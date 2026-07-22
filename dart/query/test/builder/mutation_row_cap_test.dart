import 'package:sqleasy/sqleasy.dart';
import 'package:test/test.dart';

/// Mirrors the TypeScript port's tests/shared/mutation_row_cap.test.ts.
///
/// Through 11.0.0 `.limit()`, `.offset()`, `.top()` and `.orderByColumn()` were all reachable on a
/// mutation and ALL FOUR were silently dropped — `.limit(1000)` on a DELETE produced no clause, no
/// parameter and no error, so the statement deleted the whole table. The emitted SQL below was
/// measured against the harness; the refusals are the cases the engines reject.
void main() {
  QueryBuilder mysql() => QueryBuilder(MysqlQuery().configuration);
  QueryBuilder mssql() => QueryBuilder(MssqlQuery().configuration);

  group('MySQL — a real trailing ORDER BY / LIMIT', () {
    test('caps a DELETE with a trailing LIMIT', () {
      final b = mysql()
        ..deleteFrom('orders')
        ..where('', 'total', WhereOperator.equals, 1)
        ..limit(10);
      expect(b.parsePrepared().sql,
          'DELETE FROM `orders` WHERE `total` = ? LIMIT 10;');
    });

    test('orders and caps an UPDATE', () {
      final b = mysql()
        ..updateTable('orders')
        ..set('note', 'x')
        ..orderByColumn('', 'id', OrderByDirection.ascending)
        ..limit(10);
      expect(b.parsePrepared().sql,
          'UPDATE `orders` SET `note` = ? ORDER BY `id` ASC LIMIT 10;');
    });

    // ERROR 1221 "Incorrect usage of UPDATE and LIMIT" — measured.
    test('refuses a row cap on a MULTI-TABLE mutation', () {
      final b = mysql()
        ..deleteFrom('orders', alias: 'o')
        ..joinTable(JoinType.inner, 'customers',
            (j) => j.on('c', 'id', JoinOperator.equals, 'o', 'customer_id'),
            alias: 'c')
        ..limit(1);
      expect(() => b.parsePrepared(),
          throwsA(predicate((e) => '$e'.contains('ERROR 1221'))));
    });
  });

  group('MSSQL — TOP (n) between the verb and the target', () {
    test('caps an UPDATE', () {
      final b = mssql()
        ..updateTable('orders')
        ..set('note', 'x')
        ..top(3);
      expect(b.parsePrepared().sql, contains('UPDATE TOP (3) [dbo].[orders]'));
    });

    test('caps a DELETE', () {
      final b = mssql()
        ..deleteFrom('orders')
        ..top(3);
      expect(b.parsePrepared().sql,
          contains('DELETE TOP (3) FROM [dbo].[orders]'));
    });

    test('refuses limit(), pointing at top()', () {
      final b = mssql()
        ..deleteFrom('orders')
        ..limit(3);
      expect(() => b.parsePrepared(),
          throwsA(predicate((e) => '$e'.contains('use top(n)'))));
    });

    // Msg 156 "Incorrect syntax near 'ORDER'" — measured.
    test('refuses ORDER BY, because TOP without one picks arbitrary rows', () {
      final b = mssql()
        ..updateTable('orders')
        ..set('note', 'x')
        ..top(3)
        ..orderByColumn('', 'id', OrderByDirection.ascending);
      expect(
          () => b.parsePrepared(),
          throwsA(predicate(
              (e) => '$e'.contains('T-SQL takes no ORDER BY on an UPDATE'))));
    });
  });

  group('the two dialects with no mutation row cap refuse rather than emulate',
      () {
    test('Postgres refuses, and names the rewrite it will not do', () {
      final b = QueryBuilder(PostgresQuery().configuration)
        ..deleteFrom('orders')
        ..limit(10);
      expect(
          () => b.parsePrepared(),
          throwsA(predicate(
              (e) => '$e'.contains('ctid/CTE rewrite is an emulation'))));
    });

    test('SQLite refuses, and names the compile flag', () {
      final b = QueryBuilder(SqliteQuery().configuration)
        ..updateTable('orders')
        ..set('note', 'x')
        ..limit(10);
      expect(
          () => b.parsePrepared(),
          throwsA(predicate(
              (e) => '$e'.contains('SQLITE_ENABLE_UPDATE_DELETE_LIMIT'))));
    });
  });

  // MySQL — the only engine with a mutation LIMIT — rejects `LIMIT 1 OFFSET 1` with ERROR 1064.
  test('offset() is refused on a mutation on every dialect', () {
    for (final config in [
      PostgresQuery().configuration,
      MysqlQuery().configuration,
      SqliteQuery().configuration,
      MssqlQuery().configuration,
    ]) {
      final b = QueryBuilder(config)
        ..deleteFrom('orders')
        ..offset(1);
      expect(
          () => b.parsePrepared(),
          throwsA(predicate((e) =>
              '$e'.contains('offset() has no meaning on UPDATE/DELETE'))));
    }
  });

  test('a mutation with no row cap is unchanged', () {
    final b = QueryBuilder(PostgresQuery().configuration)
      ..deleteFrom('orders')
      ..where('', 'total', WhereOperator.equals, 1);
    expect(b.parsePrepared().sql,
        'DELETE FROM "public"."orders" WHERE "total" = \$1;');
  });
}
