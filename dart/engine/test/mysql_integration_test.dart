@TestOn('vm')
@Tags(['integration'])
library;

import 'package:sqleasy_engine/sqleasy_engine.dart';
import 'package:test/test.dart';

/// Runs against the SHARED conformance harness (`pnpm harness:up`), seeded from
/// harness/seed/mysql.sql. FAIL LOUD, NEVER SKIP — see harness/README.md.
void main() {
  late MysqlExecutor executor;

  setUpAll(() async {
    executor = await MysqlExecutor.open(
      const MysqlConnectionOptions(
        host: 'localhost',
        database: 'sqleasy_ci',
        username: 'root',
        password: 'sqleasy_ci',
        // MySQL 8.4 authenticates with caching_sha2_password, which the driver will only send over
        // TLS; the container presents the self-signed cert MySQL generates at init.
        allowInvalidCertificate: true,
      ),
    );
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

  // The audit's MySQL finding: a BIGINT past 2^53 must not be routed through a double.
  test('a BIGINT past 2^53 survives exactly', () async {
    final result = await executor.run(
      const PreparedSql('SELECT big_ref FROM orders WHERE id = ?', [1]),
    );

    final value = result.rows.single['big_ref'];
    expect(value.toString(), '9007199254740993');
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
    expect(results[0].rows.single['id'].toString(), '1');
    expect(results[1].rows.single['id'].toString(), '2');
    expect(results[2].rows.single['n'].toString(), '3');
  });

  test('explain reports a plan without executing the statement', () async {
    final estimate = await executor.explain(
      const PreparedSql('SELECT * FROM orders WHERE customer_id = ?', [1]),
    );

    expect(estimate.plan, isNotEmpty);
  });

  // The canonical temporal form: ISO-8601 with NO timezone designator. These columns carry no
  // timezone, so the Postgres driver's UTC flag (and the `Z` it would print) says something the
  // column never stored. All three legs must land on the identical string.
  test('a timestamp normalizes to ISO-8601 with no invented timezone',
      () async {
    final result = await executor.run(
      const PreparedSql('SELECT placed_at FROM orders ORDER BY id'),
    );

    final stamps = result.rows.map((row) => row['placed_at']).toList();
    expect(stamps, [
      '2024-04-01T10:00:00',
      '2024-04-02T11:15:00',
      '2024-04-03T12:30:00',
    ]);
    expect(stamps.first, isA<String>());
    expect(stamps.first.toString(), isNot(endsWith('Z')),
        reason: 'a Z would assert a timezone the column never carried');
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
      print('mysql raw: $shapes');
    }
    expect(result.rowCount, 3);
  });
}
