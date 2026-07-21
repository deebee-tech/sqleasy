@TestOn('vm')
library;

import 'package:sqleasy_engine/sqleasy_engine.dart';
import 'package:test/test.dart';

/// Pure contract tests — no database. The DB-backed conformance lives in the `integration`-tagged
/// suites, which turbo runs as `conformance:integration` against the shared docker harness.
void main() {
  group('PreparedSql', () {
    test('defaults to no parameters, so bare SQL needs no ceremony', () {
      const prepared = PreparedSql('SELECT 1');
      expect(prepared.sql, 'SELECT 1');
      expect(prepared.params, isEmpty);
    });

    test('keeps parameters in the order given — binding is positional', () {
      const prepared = PreparedSql(r'SELECT $1, $2', ['a', 2]);
      expect(prepared.params, ['a', 2]);
    });

    test('carries a null parameter as a real null, not as absent', () {
      const prepared = PreparedSql(r'SELECT $1', [null]);
      expect(prepared.params, hasLength(1));
      expect(prepared.params.single, isNull);
    });
  });

  group('QueryResult', () {
    test('a SELECT reports the rows it returned', () {
      const result = QueryResult(
        rows: [
          {'id': 1},
          {'id': 2}
        ],
        rowCount: 2,
      );
      expect(result.rows, hasLength(2));
      expect(result.rowCount, 2);
    });

    test('a mutation reports affected rows with no rows returned', () {
      const result = QueryResult(rows: [], rowCount: 5);
      expect(result.rows, isEmpty);
      expect(result.rowCount, 5);
    });
  });

  group('ExplainEstimate', () {
    test('cost and rows are optional — SQLite reports neither', () {
      const estimate = ExplainEstimate(fullScan: true, plan: 'SCAN orders');
      expect(estimate.cost, isNull);
      expect(estimate.rows, isNull);
      expect(estimate.fullScan, isTrue);
      expect(estimate.plan, 'SCAN orders');
    });
  });
}
