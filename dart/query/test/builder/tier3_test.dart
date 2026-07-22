import 'package:sqleasy/sqleasy.dart';
import 'package:test/test.dart';

void main() {
  group('Tier 3 — JSON operators', () {
    test('Postgres whereJsonExtract text mode', () {
      final b = PostgresQuery().newBuilder()
        ..selectAll()
        ..fromTable('users', alias: 'u')
        ..whereJsonExtract(
          'u',
          'meta',
          r'$.email',
          JsonExtractMode.text,
          WhereOperator.equals,
          'a@b.c',
        );
      // Was asserting `->>'email'`, which is a KEY lookup, not a JSONPath — so given SQLEasy's
      // `$.email` it returned NULL and the predicate silently never matched. The path argument is a
      // JSONPath on all four dialects now, and `jsonb_path_query_first` is the operator that
      // actually takes one.
      expect(
        b.parseRaw(),
        contains(
          'jsonb_path_query_first("u"."meta", \'\$.email\') #>> \'{}\' = a@b.c',
        ),
      );
    });

    test('MySQL whereJsonContains', () {
      final b = MysqlQuery().newBuilder()
        ..selectAll()
        ..fromTable('users', alias: 'u')
        ..whereJsonContains('u', 'meta', {'role': 'admin'});
      expect(b.parseRaw(), contains('JSON_CONTAINS(`u`.`meta`,'));
    });

    test('selectJsonExtract on MSSQL uses JSON_VALUE', () {
      final b = MssqlQuery().newBuilder()
        ..selectJsonExtract(
          'u',
          'meta',
          r'$.email',
          JsonExtractMode.text,
          alias: 'email',
        )
        ..fromTable('users', alias: 'u');
      expect(
        b.parseRaw(),
        contains(r"JSON_VALUE([u].[meta], '$.email') AS [email]"),
      );
    });
  });

  group('Tier 3 — full-text search', () {
    test('Postgres whereMatch natural mode', () {
      final b = PostgresQuery().newBuilder()
        ..selectAll()
        ..fromTable('docs', alias: 'd')
        ..whereMatch([(table: 'd', column: 'body')], 'hello world');
      expect(b.parseRaw(), contains('plainto_tsquery'));
      expect(b.parseRaw(), contains('@@'));
    });

    test('MySQL whereMatch boolean mode', () {
      final b = MysqlQuery().newBuilder()
        ..selectAll()
        ..fromTable('docs', alias: 'd')
        ..whereMatch(
          [(table: 'd', column: 'body')],
          '+hello',
          FullTextMode.boolean,
        );
      expect(b.parseRaw(), contains('IN BOOLEAN MODE'));
    });

    test('SQLite FTS MATCH', () {
      final b = SqliteQuery().newBuilder()
        ..selectAll()
        ..fromTable('docs_fts', alias: 'd')
        ..whereMatch([(table: 'd', column: 'body')], 'hello');
      expect(b.parseRaw(), contains('"d"."body" MATCH hello'));
    });
  });

  // T-SQL has no upsert primitive. This previously asserted a synthesized MERGE — a different
  // statement, un-hinted and therefore race-prone at READ COMMITTED, that the caller never wrote.
  group('Tier 3 — MSSQL has no upsert', () {
    test('refuses onConflictDoUpdate rather than synthesizing a MERGE', () {
      final b = MssqlQuery().newBuilder() as QueryBuilder
        ..insertInto('users')
        ..insertColumns(['email', 'name'])
        ..insertValues(['a@b.c', 'Ada'])
        ..onConflictDoUpdate([], [(column: 'name', value: 'Ada')]);

      expect(
        () => b.parseRaw(),
        throwsA(predicate((e) => e.toString().contains('MSSQL has no upsert'))),
      );
    });
  });

  group('Tier 3 — LATERAL / APPLY', () {
    test('Postgres joinCrossApply maps to CROSS JOIN LATERAL', () {
      final b = PostgresQuery().newBuilder()
        ..selectAll()
        ..fromTable('orders', alias: 'o')
        ..joinCrossApply('x', (sub) {
          sub
            ..selectColumn('li', 'sku')
            ..fromTable('line_items', alias: 'li');
        });
      expect(b.parseRaw(), contains('CROSS JOIN LATERAL'));
    });

    test('MSSQL joinOuterApply', () {
      final b = MssqlQuery().newBuilder()
        ..selectAll()
        ..fromTable('orders', alias: 'o')
        ..joinOuterApply('x', (sub) {
          sub
            ..selectColumn('li', 'sku')
            ..fromTable('line_items', alias: 'li');
        });
      expect(b.parseRaw(), contains('OUTER APPLY'));
    });

    test('SQLite fromLateral throws', () {
      final b = SqliteQuery().newBuilder() as QueryBuilder
        ..selectAll()
        ..fromTable('orders', alias: 'o')
        ..fromLateral('x', (sub) {
          sub.selectAll().fromTable('line_items', alias: 'li');
        });
      expect(() => b.parseRaw(), throwsA(isA<ParserError>()));
    });
  });

  group('Tier 3 — table functions', () {
    test('Postgres fromTableFunction', () {
      final b = PostgresQuery().newBuilder()
        ..selectAll()
        ..fromTableFunction('generate_series', 'g', [1, 3]);
      // NOT owner-qualified. This used to assert `FROM "public"."generate_series"`, which Postgres
      // rejects — `function public.generate_series(integer, integer) does not exist`, because
      // built-ins live in pg_catalog and resolve through search_path. The default owner is a TABLE
      // default.
      expect(
        b.parseRaw(),
        contains('FROM "generate_series"(1, 3) AS "g"'),
      );
    });

    test('SQLite json_each TVF', () {
      final b = SqliteQuery().newBuilder()
        ..selectAll()
        ..fromTableFunction('json_each', 'j', ['{"a":1}']);
      expect(b.parseRaw(), contains('json_each({"a":1})'));
    });
  });

  group('Tier 3 — grouping sets', () {
    test('Postgres groupByRollup', () {
      final b = PostgresQuery().newBuilder()
        ..selectColumn('o', 'region')
        ..fromTable('orders', alias: 'o')
        ..groupByRollup([(table: 'o', column: 'region')]);
      expect(b.parseRaw(), contains('GROUP BY ROLLUP ("o"."region")'));
    });

    test('MySQL groupByRollup uses WITH ROLLUP', () {
      final b = MysqlQuery().newBuilder()
        ..selectColumn('o', 'region')
        ..fromTable('orders', alias: 'o')
        ..groupByColumn('o', 'region')
        ..groupByRollup();
      expect(b.parseRaw(), contains('GROUP BY `o`.`region` WITH ROLLUP'));
    });
  });

  group('Tier 3 — WITH TIES', () {
    test('Postgres limitWithTies', () {
      final b = PostgresQuery().newBuilder()
        ..selectColumn('o', 'id')
        ..fromTable('orders', alias: 'o')
        ..orderByColumn('o', 'total', OrderByDirection.descending)
        ..limitWithTies(5);
      expect(b.parseRaw(), contains('FETCH FIRST 5 ROWS WITH TIES'));
    });

    test('SQLite limitWithTies throws', () {
      final b = SqliteQuery().newBuilder() as QueryBuilder
        ..selectAll()
        ..fromTable('orders', alias: 'o')
        ..orderByColumn('o', 'total', OrderByDirection.descending)
        ..limitWithTies(5);
      expect(() => b.parseRaw(), throwsA(isA<ParserError>()));
    });
  });

  group('Tier 3 — hints', () {
    test('MySQL hintUseIndex', () {
      final b = MysqlQuery().newBuilder()
        ..selectAll()
        ..fromTable('users', alias: 'u')
        ..hintUseIndex('u', 'users_email_idx');
      expect(b.parseRaw(), contains('USE INDEX (`users_email_idx`)'));
    });

    test('MSSQL hintMssqlOption', () {
      final b = MssqlQuery().newBuilder()
        ..selectAll()
        ..fromTable('users', alias: 'u')
        ..orderByColumn('u', 'id', OrderByDirection.ascending)
        ..limit(10)
        ..hintMssqlOption('RECOMPILE');
      expect(b.parseRaw(), contains('OPTION (RECOMPILE)'));
    });
  });

  // A MySQL index hint (`USE INDEX`/`FORCE INDEX`) is a MySQL-only construct. On a SELECT the
  // refusal has always fired, because the check rode the SELECT tail. But INSERT/UPDATE/DELETE
  // return before that tail, so a hint set on a non-MySQL mutation was SILENTLY DROPPED. The check
  // now runs before the queryType dispatch, so every statement kind refuses alike.
  group('Tier 3 — index hints are refused on non-MySQL mutations, not dropped',
      () {
    // Runtime-floor tests: reach the index-hint methods through the wide QueryBuilder (they are not
    // MySQL, so their views do not expose them) to prove the parser refuses rather than drops them.
    final nonMysql = <String, QueryBuilder Function()>{
      'Postgres': () => PostgresQuery().newBuilder() as QueryBuilder,
      'MSSQL': () => MssqlQuery().newBuilder() as QueryBuilder,
      'SQLite': () => SqliteQuery().newBuilder() as QueryBuilder,
    };

    nonMysql.forEach((name, make) {
      test('$name refuses hintUseIndex on an UPDATE instead of dropping it',
          () {
        final b = make()
          ..updateTable('users', alias: 'u')
          ..set('name', 'Ada')
          ..where('u', 'id', WhereOperator.equals, 1)
          ..hintUseIndex('u', 'users_email_idx');
        expect(
          () => b.parseRaw(),
          throwsA(
            predicate(
              (e) => e.toString().contains('only supported on MySQL'),
            ),
          ),
        );
      });

      test('$name refuses hintForceIndex on a DELETE instead of dropping it',
          () {
        final b = make()
          ..deleteFrom('users', alias: 'u')
          ..where('u', 'id', WhereOperator.equals, 1)
          ..hintForceIndex('u', 'users_email_idx');
        expect(
          () => b.parseRaw(),
          throwsA(
            predicate(
              (e) => e.toString().contains('only supported on MySQL'),
            ),
          ),
        );
      });
    });
  });
}
