@TestOn('vm')
@Tags(['integration'])
library;

import 'dart:io';

import 'package:sqleasy_engine/sqleasy_engine.dart';
import 'package:test/test.dart';

/// SQLite has NO container — it is seeded straight from harness/seed/sqlite.sql into an in-memory
/// database, which is exactly how a language port is expected to use it. It is still tagged
/// `integration` because it consumes the shared harness seed.
void main() {
  late SqliteExecutor executor;

  setUpAll(() {
    executor = SqliteExecutor.openInMemory();
    // The seed is one script of many statements; `execute` runs them all.
    executor.database
        .execute(File('../../harness/seed/sqlite.sql').readAsStringSync());
  });

  tearDownAll(() async => executor.close());

  test('runs a parameterized SELECT and returns the seeded rows', () async {
    final result = await executor.run(
      const PreparedSql(
        'SELECT id, email, display_name FROM customers WHERE id = ?',
        [1],
      ),
    );

    expect(result.rowCount, 1);
    expect(result.rows.single['email'], 'ada@example.com');
    expect(result.rows.single['display_name'], 'Ada Lovelace');
  });

  test('a real NULL comes back as null, not as an absent key', () async {
    final result = await executor.run(
      const PreparedSql(
        'SELECT display_name FROM customers WHERE email = ?',
        ['grace@example.com'],
      ),
    );

    expect(result.rows.single.containsKey('display_name'), isTrue);
    expect(result.rows.single['display_name'], isNull);
  });

  test('a BIGINT past 2^53 survives exactly', () async {
    final result = await executor.run(
      const PreparedSql('SELECT big_ref FROM orders WHERE id = ?', [1]),
    );

    expect(result.rows.single['big_ref'], 9007199254740993);
  });

  // SQLite has no fixed-point type: a NUMERIC column has REAL affinity, so an exact decimal is lost
  // AT REST before any driver sees it. The seed therefore stores decimals as TEXT — the only SQLite
  // rendering that reaches the canonical "decimal is an exact string" that Postgres and MySQL already
  // produce. This pins that decision: revert the seed to NUMERIC and this fails.
  test('a DECIMAL is exact, because the seed stores it as TEXT', () async {
    final result = await executor.run(
      const PreparedSql('SELECT total FROM orders ORDER BY id'),
    );

    final totals = result.rows.map((row) => row['total']).toList();
    expect(totals, ['19.99', '1234567.89', '0.01']);
    expect(totals.first, isA<String>(),
        reason: 'a double here would mean the value was rounded at rest');
  });

  test(
      'statements in a transaction run in order and each returns its own result',
      () async {
    final results = await executor.transaction([
      const PreparedSql('SELECT id FROM customers WHERE id = ?', [1]),
      const PreparedSql('SELECT id FROM customers WHERE id = ?', [2]),
      const PreparedSql('SELECT COUNT(*) AS n FROM orders'),
    ]);

    expect(results, hasLength(3));
    expect(results[0].rows.single['id'], 1);
    expect(results[1].rows.single['id'], 2);
    expect(results[2].rows.single['n'], 3);
  });

  test('a failed transaction rolls the whole batch back', () async {
    await expectLater(
      executor.transaction([
        const PreparedSql(
          "INSERT INTO customers (email, created_at) VALUES ('rolled@back.com', '2024-05-01 00:00:00')",
        ),
        const PreparedSql('SELECT this_column_does_not_exist FROM customers'),
      ]),
      throwsA(anything),
    );

    final after = await executor.run(
      const PreparedSql('SELECT COUNT(*) AS n FROM customers WHERE email = ?',
          ['rolled@back.com']),
    );
    expect(after.rows.single['n'], 0, reason: 'the INSERT must not survive');
  });

  test('explain reports the plan shape, and no invented numbers', () async {
    final estimate = await executor.explain(
      const PreparedSql('SELECT * FROM orders WHERE customer_id = ?', [1]),
    );

    expect(estimate.plan, isNotEmpty);
    // SQLite's planner exposes no cost/row estimates at all — reporting one would be inventing it.
    expect(estimate.cost, isNull);
    expect(estimate.rows, isNull);
  });

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
      print('sqlite raw: $shapes');
    }
    expect(result.rowCount, 3);
  });
}
