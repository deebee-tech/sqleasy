import 'package:sqleasy/sqleasy.dart';
import 'package:test/test.dart';

/// Mirrors the TypeScript port's tests/shared/set_operation_branch_scope.test.ts.
///
/// Through 12.0.0 a branch's `ORDER BY` / `LIMIT` was emitted with NO parentheses, so it bound to
/// the whole compound instead of the operand it was written on. Measured against the harness on a
/// 3-row table: the old SQL returned 1 row, the parenthesized form returns 4 (3 + the branch's 1) —
/// which is what the caller wrote. There was no error either way.
///
/// Only Postgres and MySQL can express this; MSSQL (Msg 156) and SQLite ("near \"(\": syntax error")
/// reject a parenthesized operand outright, so they refuse rather than emulate.
void main() {
  QueryBuilder build(Dialect config, void Function(QueryBuilder) mutate) {
    return QueryBuilder(config)
      ..fromTable('users')
      ..selectAll()
      ..unionAll((u) {
        u
          ..fromTable('admins')
          ..selectAll();
        mutate(u);
      });
  }

  group('Postgres and MySQL parenthesize the operand', () {
    test('scopes a branch LIMIT', () {
      final pg = build(PostgresQuery().configuration, (u) => u.limit(3));
      expect(
        pg.parsePrepared().sql,
        'SELECT * FROM "public"."users" UNION ALL '
        '(SELECT * FROM "public"."admins" LIMIT 3);',
      );

      final my = build(MysqlQuery().configuration, (u) => u.limit(3));
      expect(
        my.parsePrepared().sql,
        'SELECT * FROM `users` UNION ALL (SELECT * FROM `admins` LIMIT 3);',
      );
    });

    test('scopes a branch ORDER BY together with its LIMIT', () {
      final pg = build(PostgresQuery().configuration, (u) {
        u
          ..orderByColumn('', 'id', OrderByDirection.descending)
          ..limit(3);
      });
      expect(
        pg.parsePrepared().sql,
        contains(
            '(SELECT * FROM "public"."admins" ORDER BY "id" DESC LIMIT 3)'),
      );
    });

    test('composes with an outer limit instead of two LIMIT clauses', () {
      final pg = build(PostgresQuery().configuration, (u) => u.limit(3))
        ..limit(99);
      final sql = pg.parsePrepared().sql;

      expect(
        sql,
        'SELECT * FROM "public"."users" UNION ALL '
        '(SELECT * FROM "public"."admins" LIMIT 3) LIMIT 99;',
      );
      // The shape that used to come out — two bare LIMITs — is a syntax error on this engine.
      expect(sql, isNot(contains('LIMIT 3 LIMIT 99')));
    });
  });

  group('SQLite and MSSQL refuse, because neither can express it', () {
    test('SQLite refuses a branch LIMIT and points at a CTE', () {
      final b = build(SqliteQuery().configuration, (u) => u.limit(3));
      expect(
        () => b.parsePrepared(),
        throwsA(predicate((e) =>
            '$e'.contains('SQLite cannot scope LIMIT to one branch') &&
            '$e'.contains('CTE or a derived table'))),
      );
    });

    test('MSSQL refuses a branch ORDER BY and points at top()', () {
      final b = build(MssqlQuery().configuration,
          (u) => u.orderByColumn('', 'id', OrderByDirection.descending));
      expect(
        () => b.parsePrepared(),
        throwsA(predicate((e) =>
            '$e'.contains('MSSQL cannot scope ORDER BY to one branch') &&
            '$e'.contains('top(n)'))),
      );
    });

    // MSSQL's one real branch-level cap. It needs no parentheses and was never broken.
    test('MSSQL still emits a branch TOP, which genuinely caps the operand',
        () {
      final b = build(MssqlQuery().configuration, (u) => u.top(3));
      expect(b.parsePrepared().sql,
          contains('UNION ALL SELECT TOP (3) * FROM [dbo].[admins]'));
    });
  });

  // A UNION ALL (B UNION C) is not A UNION ALL B UNION C. Every engine reads the flat form as
  // (A UNION ALL B) UNION C, so the outer UNION ALL's duplicates get deduplicated by an inner UNION
  // that was never meant to see them. Measured on customers {1,2,3}: grouped 4 rows, flat 3.
  group('a nested set operation keeps its grouping', () {
    test('Postgres parenthesizes the nested operand', () {
      final b = build(
          PostgresQuery().configuration,
          (u) => u.union((v) => v
            ..fromTable('staff')
            ..selectAll()));
      expect(
        b.parsePrepared().sql,
        'SELECT * FROM "public"."users" UNION ALL '
        '(SELECT * FROM "public"."admins" UNION SELECT * FROM "public"."staff");',
      );
    });

    // SQLite refuses on the PARENTHESES, so a grouped operand is out of reach — where MSSQL, which
    // parenthesizes happily, emits it. The refusals split by reason, not by dialect.
    test('SQLite refuses it, for the same reason it refuses a branch LIMIT',
        () {
      final b = build(
          SqliteQuery().configuration,
          (u) => u.union((v) => v
            ..fromTable('staff')
            ..selectAll()));
      expect(
        () => b.parsePrepared(),
        throwsA(predicate((e) =>
            '$e'.contains('cannot scope a nested set operation') &&
            '$e'.contains('no parenthesized operand at all'))),
      );
    });

    test('MSSQL ALLOWS it, because T-SQL takes the parentheses', () {
      final b = build(
          MssqlQuery().configuration,
          (u) => u.union((v) => v
            ..fromTable('staff')
            ..selectAll()));
      expect(
        b.parsePrepared().sql,
        contains(
            'UNION ALL (SELECT * FROM [dbo].[admins] UNION SELECT * FROM [dbo].[staff])'),
      );
    });
  });

  group('unscoped branches are untouched — no stray parentheses', () {
    for (final entry in {
      'postgres': PostgresQuery().configuration,
      'mysql': MysqlQuery().configuration,
      'sqlite': SqliteQuery().configuration,
    }.entries) {
      test('${entry.key} emits a plain operand with no scoping clause', () {
        final b = build(entry.value, (_) {});
        expect(b.parsePrepared().sql, isNot(contains('(SELECT')));
      });
    }

    test('an outer limit alone still applies to the whole result', () {
      final b = build(PostgresQuery().configuration, (_) {})..limit(99);
      expect(
        b.parsePrepared().sql,
        'SELECT * FROM "public"."users" UNION ALL '
        'SELECT * FROM "public"."admins" LIMIT 99;',
      );
    });
  });
}
