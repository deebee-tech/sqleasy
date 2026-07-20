import 'package:sqleasy/sqleasy.dart';
import 'package:test/test.dart';

void main() {
  group('ORDER BY NULLS FIRST/LAST', () {
    test('Postgres renders native NULLS LAST', () {
      final builder = PostgresQuery().newBuilder()
        ..selectAll()
        ..fromTable('orders', alias: 'o')
        ..orderByColumn(
            'o', 'shipped_at', OrderByDirection.ascending, NullsOrder.last);

      expect(builder.parseRaw(),
          contains('ORDER BY "o"."shipped_at" ASC NULLS LAST'));
    });

    // Previously asserted the CASE sort key. MySQL has no NULLS FIRST/LAST in any version; the
    // synthesized key produced the right order but was an extra sort expression the caller never
    // wrote, and it stopped an index from satisfying the ORDER BY.
    test('MySQL refuses NULLS LAST instead of synthesizing a CASE sort key',
        () {
      final builder = MysqlQuery().newBuilder()
        ..selectAll()
        ..fromTable('orders', alias: 'o')
        ..orderByColumn(
            'o', 'shipped_at', OrderByDirection.ascending, NullsOrder.last);

      expect(
        () => builder.parseRaw(),
        throwsA(predicate(
            (e) => e.toString().contains('MySQL has no NULLS FIRST/LAST'))),
      );
    });

    test('MySQL emits no CASE sort key once the placement is dropped', () {
      final builder = MysqlQuery().newBuilder()
        ..selectAll()
        ..fromTable('orders', alias: 'o')
        ..orderByColumn('o', 'shipped_at', OrderByDirection.ascending);

      final sql = builder.parseRaw();
      expect(sql, contains('ORDER BY `o`.`shipped_at` ASC'));
      expect(sql, isNot(contains('CASE')));
    });
  });
}
