@TestOn('vm')
@Tags(['integration'])
library;

import 'package:sqleasy_engine/sqleasy_engine.dart';
import 'package:test/test.dart';

/// Runs against the SHARED conformance harness (`pnpm harness:up`), seeded from
/// harness/seed/postgres.sql.
///
/// FAIL LOUD, NEVER SKIP: per harness/README.md, a suite that self-skips on a missing connection
/// reports green having tested nothing — which is exactly how a dialect silently loses coverage. So
/// this file does not guard on reachability; if the harness is down, it fails.
void main() {
  late PostgresExecutor executor;

  setUpAll(() async {
    executor = await PostgresExecutor.open(
      const PostgresConnectionOptions(
        host: 'localhost',
        database: 'sqleasy_ci',
        username: 'sqleasy',
        password: 'sqleasy_ci',
      ),
    );
  });

  tearDownAll(() async => executor.close());

  test('runs a parameterized SELECT and returns the seeded rows', () async {
    final result = await executor.run(
      const PreparedSql(
        r'SELECT id, email, display_name, is_active FROM customers WHERE id = $1',
        [1],
      ),
    );

    expect(result.rowCount, 1);
    expect(result.rows.single['email'], 'ada@example.com');
    expect(result.rows.single['display_name'], 'Ada Lovelace');
    expect(result.rows.single['is_active'], isTrue);
  });

  test('a real NULL comes back as null, not as an absent key', () async {
    final result = await executor.run(
      const PreparedSql(
        r'SELECT display_name FROM customers WHERE email = $1',
        ['grace@example.com'],
      ),
    );

    expect(result.rows.single.containsKey('display_name'), isTrue);
    expect(result.rows.single['display_name'], isNull);
  });

  // THE point of the seed's awkward data: 9007199254740993 is 2^53 + 1, past the range a double can
  // represent exactly. Dart's native int is 64-bit, so it survives here — this test is what would
  // catch a port that routed BIGINT through a float.
  test('a BIGINT past 2^53 survives exactly', () async {
    final result = await executor.run(
      const PreparedSql(r'SELECT big_ref FROM orders WHERE id = $1', [1]),
    );

    final value = result.rows.single['big_ref'];
    expect(value, 9007199254740993);
    expect(value.toString(), '9007199254740993');
  });

  test(
      'statements in a transaction run in order and each returns its own result',
      () async {
    final results = await executor.transaction([
      const PreparedSql(r'SELECT id FROM customers WHERE id = $1', [1]),
      const PreparedSql(r'SELECT id FROM customers WHERE id = $1', [2]),
      const PreparedSql(r'SELECT COUNT(*) AS n FROM orders'),
    ]);

    expect(results, hasLength(3));
    expect(results[0].rows.single['id'], 1);
    expect(results[1].rows.single['id'], 2);
    expect(results[2].rows.single['n'], 3);
  });

  test('explain reports a plan without executing the statement', () async {
    final estimate = await executor.explain(
      const PreparedSql(r'SELECT * FROM orders WHERE customer_id = $1', [1]),
    );

    expect(estimate.plan, isNotEmpty);
    expect(estimate.rows, isNotNull);
  });

  // Not an assertion so much as a RECORD: the normalization corpus (C) has to define a canonical
  // form for these, so the raw driver types are printed for the design to work from.
  test('records the raw driver types for the normalization design', () async {
    final result = await executor.run(
      const PreparedSql(
        'SELECT id, total, big_ref, placed_at, note FROM orders ORDER BY id',
      ),
    );
    for (final row in result.rows) {
      final shapes = row.entries
          .map((e) => '${e.key}=${e.value}<${e.value.runtimeType}>')
          .join(' ');
      // ignore: avoid_print
      print('postgres raw: $shapes');
    }
    expect(result.rowCount, 3);
  });
}
