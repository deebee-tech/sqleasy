import 'package:sqleasy/sqleasy.dart';
import 'package:test/test.dart';

void main() {
  group('richer JOIN ON predicates', () {
    test('supports LIKE between two columns', () {
      final builder = PostgresQuery().newBuilder()
        ..selectAll()
        ..fromTable('products', alias: 'p')
        ..joinTable(JoinType.inner, 'categories', (j) {
          j.on('p', 'name', JoinOperator.like, 'c', 'name_pattern');
        }, alias: 'c');

      expect(builder.parseRaw(),
          contains('ON "p"."name" LIKE "c"."name_pattern"'));
    });

    test('onIn renders and binds an IN list', () {
      final builder = PostgresQuery().newBuilder()
        ..selectAll()
        ..fromTable('orders', alias: 'o')
        ..joinTable(JoinType.inner, 'customers', (j) {
          j.onIn('c', 'tier', [1, 2, 3]);
        }, alias: 'c');

      final prepared = builder.parsePrepared();
      expect(prepared.sql, contains('ON "c"."tier" IN (\$1, \$2, \$3)'));
      expect(prepared.params, [1, 2, 3]);
    });

    // The WHERE clause has refused an empty IN since it was written; the JOIN clause emitted
    // `IN ()` instead — invalid SQL that reaches the database before anything complains.
    test('onIn/onNotIn refuse an empty list rather than emitting IN ()', () {
      for (final empty in [true, false]) {
        final builder = PostgresQuery().newBuilder()
          ..selectAll()
          ..fromTable('orders', alias: 'o')
          ..joinTable(JoinType.inner, 'customers', (j) {
            j.on('o', 'customer_id', JoinOperator.equals, 'c', 'id');
            j.and();
            empty ? j.onIn('c', 'tier', []) : j.onNotIn('c', 'tier', []);
          }, alias: 'c');

        expect(
          () => builder.parseRaw(),
          throwsA(predicate((e) =>
              e.toString().contains('requires at least one value'))),
        );
      }
    });

    test('onNotBetween composes with implicit AND', () {
      final builder = PostgresQuery().newBuilder()
        ..selectAll()
        ..fromTable('orders', alias: 'o')
        ..joinTable(JoinType.inner, 'customers', (j) {
          j
              .on('o', 'customer_id', JoinOperator.equals, 'c', 'id')
              .onNotBetween('c', 'tier', 1, 3);
        }, alias: 'c');

      expect(
        builder.parseRaw(),
        contains(
          'ON "o"."customer_id" = "c"."id" AND "c"."tier" NOT BETWEEN 1 AND 3',
        ),
      );
    });
  });

  /// A null test cannot go through `onValue`: `= NULL` is never true, so passing null there yields
  /// a predicate that silently matches nothing — a wrong answer with no error. WHERE has had
  /// `whereNull`/`whereNotNull` since the beginning; the JOIN was simply asymmetric.
  group('JOIN ON null tests', () {
    test('onNull renders IS NULL', () {
      final builder = PostgresQuery().newBuilder()
        ..selectAll()
        ..fromTable('orders', alias: 'o')
        ..joinTable(JoinType.left, 'customers', (j) {
          j.onNull('c', 'deleted_at');
        }, alias: 'c');

      expect(builder.parseRaw(), contains('ON "c"."deleted_at" IS NULL'));
    });

    test('onNotNull composes with a preceding on() via the implicit AND', () {
      final builder = PostgresQuery().newBuilder()
        ..selectAll()
        ..fromTable('orders', alias: 'o')
        ..joinTable(JoinType.left, 'customers', (j) {
          j
              .on('o', 'customer_id', JoinOperator.equals, 'c', 'id')
              .onNotNull('c', 'email');
        }, alias: 'c');

      expect(
        builder.parseRaw(),
        contains('ON "o"."customer_id" = "c"."id" AND "c"."email" IS NOT NULL'),
      );
    });

    // IS NULL takes no operand, so it must consume no placeholder. Emitting one would shift every
    // later parameter by one and misbind the whole query.
    test('binds no placeholder, leaving later parameters aligned', () {
      final builder = PostgresQuery().newBuilder()
        ..selectAll()
        ..fromTable('orders', alias: 'o')
        ..joinTable(JoinType.left, 'customers', (j) {
          j
              .onValue('c', 'tier', JoinOperator.equals, 'gold')
              .and()
              .onNull('c', 'deleted_at')
              .and()
              .onValue('c', 'region', JoinOperator.equals, 'emea');
        }, alias: 'c');

      final prepared = builder.parsePrepared();
      expect(prepared.sql, contains('"c"."tier" = \$1'));
      expect(prepared.sql, contains('"c"."deleted_at" IS NULL'));
      expect(prepared.sql, contains('"c"."region" = \$2'));
      expect(prepared.params, ['gold', 'emea']);
    });

    test('each dialect quotes the identifier with its own delimiters', () {
      final cases = <String, dynamic>{
        '[c].[deleted_at] IS NULL': MssqlQuery(),
        '`c`.`deleted_at` IS NULL': MysqlQuery(),
        '"c"."deleted_at" IS NULL': SqliteQuery(),
      };

      cases.forEach((expected, query) {
        final builder = query.newBuilder()
          ..selectAll()
          ..fromTable('orders', alias: 'o')
          ..joinTable(JoinType.left, 'customers', (j) {
            j.onNull('c', 'deleted_at');
          }, alias: 'c');

        expect(builder.parseRaw(), contains(expected));
      });
    });
  });
}
