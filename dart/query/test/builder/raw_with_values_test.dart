import 'package:sqleasy/sqleasy.dart';
import 'package:test/test.dart';

/// A raw fragment used to be text and only text. A caller with `name LIKE ?` had nowhere to put the
/// value, so the value went into the string — which is how a query builder ends up shipping SQL
/// injection, and is exactly what 12Stone's V2 had done at ~94 call sites before this existed.
void main() {
  group('raw fragments carrying bound values', () {
    test('binds a WHERE fragment, in marker order', () {
      final builder = PostgresQuery().newBuilder()
        ..selectAll()
        ..fromTable('contacts', alias: 'c')
        ..whereRaw("c.first_name || ' ' || c.last_name LIKE ?", ['%ada%']);

      final prepared = builder.parsePrepared();
      expect(prepared.sql,
          contains("c.first_name || ' ' || c.last_name LIKE \$1"));
      expect(prepared.params, ['%ada%']);
    });

    test('binds an ON fragment', () {
      final builder = PostgresQuery().newBuilder()
        ..selectAll()
        ..fromTable('orders', alias: 'o')
        ..joinTable(JoinType.left, 'customers', (j) {
          j.on('o', 'customer_id', JoinOperator.equals, 'c', 'id');
          j.and();
          j.onRaw('COALESCE(c.tier, ?) = ?', [0, 3]);
        }, alias: 'c');

      final prepared = builder.parsePrepared();
      expect(prepared.sql, contains('COALESCE(c.tier, \$1) = \$2'));
      expect(prepared.params, [0, 3]);
    });

    /// The reason a fragment is not always scanned for `?`. A question mark in the fragment's TEXT
    /// is ordinary, and tearing one out to make room for a value nobody supplied would corrupt it.
    test('leaves a literal question mark alone when no values are supplied',
        () {
      final builder = PostgresQuery().newBuilder()
        ..selectAll()
        ..fromTable('notes', alias: 'n')
        ..whereRaw("n.body LIKE '%why?%'");

      final prepared = builder.parsePrepared();
      expect(prepared.sql, contains("n.body LIKE '%why?%'"));
      expect(prepared.params, isEmpty);
    });

    test('takes an escaped marker as a literal question mark', () {
      final builder = PostgresQuery().newBuilder()
        ..selectAll()
        ..fromTable('notes', alias: 'n')
        ..whereRaw(r"n.body LIKE '%why\?%' AND n.id = ?", [7]);

      final prepared = builder.parsePrepared();
      expect(prepared.sql, contains("n.body LIKE '%why?%'"));
      expect(prepared.sql, contains('n.id = \$1'));
      expect(prepared.params, [7]);
    });

    // Binding what it can and leaving the rest dangling surfaces far from here, as a driver error
    // about a parameter count nobody can trace back to a fragment.
    test('refuses a marker/value count mismatch', () {
      for (final c in [
        ('a = ? AND b = ?', [1]),
        ('a = ?', [1, 2]),
      ]) {
        final builder = PostgresQuery().newBuilder()
          ..selectAll()
          ..fromTable('t', alias: 't')
          ..whereRaw(c.$1, c.$2);

        expect(
          () => builder.parsePrepared(),
          throwsA(
              predicate((e) => e.toString().contains('value marker(s) but'))),
        );
      }
    });

    test('inlines the values under parseRaw, like every other value', () {
      final builder = PostgresQuery().newBuilder()
        ..selectAll()
        ..fromTable('t', alias: 't')
        ..whereRaw('t.n = ?', [42]);

      expect(builder.parseRaw(), contains('t.n = 42'));
    });
  });
}
