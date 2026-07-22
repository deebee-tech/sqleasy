import 'package:sqleasy/sqleasy.dart';
import 'package:test/test.dart';

/// Mirrors the TypeScript port's tests/shared/unqualified_columns.test.ts.
///
/// An empty alias means "unqualified". `fromTable` has always honored that — it emits no `AS`
/// clause — but every other clause concatenated `quoteIdentifier(alias) + '.' + column`
/// unconditionally, so the same empty string produced a ZERO-LENGTH delimited identifier. Measured
/// against the harness on the shipped 11.0.0:
///
///     WHERE ""."id" = $1   ->  Postgres: ERROR: zero-length delimited identifier
///     WHERE ""."id" = ?    ->  SQLite:   SQLITE_ERROR: no such column: .id
///     WHERE ``.`id` = ?    ->  MySQL:    ACCEPTED — returns the row
///
/// MySQL accepting it is what made this worse than a syntax error: one builder produced SQL that
/// ran on one dialect and was rejected by the others, silently. The emission corpus pins the text
/// per dialect; this suite asserts the INVARIANT, so a future clause that forgets to route through
/// `qualifiedColumn` fails here even if nobody adds a golden for it.
///
/// Dart's API differs from TypeScript's: `fromTable` takes a nullable named `alias` (null = none)
/// while `where` takes a positional non-nullable `table` (so '' = none). Both spellings must reach
/// the same unqualified emission, which is why each case below is exercised twice.
void main() {
  final dialects = <String, ({Dialect Function() config, String empty})>{
    'postgres': (config: () => PostgresQuery().configuration, empty: '""'),
    'mysql': (config: () => MysqlQuery().configuration, empty: '``'),
    'sqlite': (config: () => SqliteQuery().configuration, empty: '""'),
    'mssql': (config: () => MssqlQuery().configuration, empty: '[]'),
  };

  final builders = <String, void Function(QueryBuilder)>{
    'where': (b) => b
      ..fromTable('orders')
      ..selectAll()
      ..where('', 'total', WhereOperator.equals, 1),
    'whereBetween': (b) => b
      ..fromTable('orders')
      ..selectAll()
      ..whereBetween('', 'total', 1, 9),
    'whereNull': (b) => b
      ..fromTable('orders')
      ..selectAll()
      ..whereNull('', 'note'),
    'whereInValues': (b) => b
      ..fromTable('orders')
      ..selectAll()
      ..whereInValues('', 'total', [1, 2]),
    'selectColumn': (b) => b
      ..fromTable('orders')
      ..selectColumn('', 'total'),
    'orderByColumn': (b) => b
      ..fromTable('orders')
      ..selectAll()
      ..orderByColumn('', 'total', OrderByDirection.descending),
    'groupByColumn': (b) => b
      ..fromTable('orders')
      ..selectColumn('', 'total')
      ..groupByColumn('', 'total'),
    'having': (b) => b
      ..fromTable('orders')
      ..selectColumn('', 'total')
      ..groupByColumn('', 'total')
      ..having('', 'total', WhereOperator.greaterThan, 1),
  };

  group('an empty alias emits an unqualified column, never an empty identifier',
      () {
    dialects.forEach((dialectName, dialect) {
      group(dialectName, () {
        builders.forEach((clause, build) {
          test('$clause carries no empty ${dialect.empty} identifier', () {
            final builder = QueryBuilder(dialect.config());
            build(builder);
            final sql = builder.parsePrepared().sql;

            expect(sql, isNot(contains(dialect.empty)));
            // ...and the column is still there, so this cannot pass by emitting nothing.
            expect(sql, anyOf(contains('total'), contains('note')));
          });
        });
      });
    });

    test('a non-empty alias still qualifies', () {
      final builder = QueryBuilder(PostgresQuery().configuration)
        ..fromTable('orders', alias: 'o')
        ..selectAll()
        ..where('o', 'total', WhereOperator.equals, 1);

      expect(builder.parsePrepared().sql, contains('"o"."total"'));
    });
  });
}
