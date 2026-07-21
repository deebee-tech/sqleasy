@TestOn('vm')
@Tags(['integration'])
library;

import 'dart:convert';
import 'dart:io';

import 'package:sqleasy_engine/sqleasy_engine.dart';
import 'package:test/test.dart';

/// Replays CORPUS C (normalization) against every implemented dialect.
///
/// The corpus — not this engine — is the definition of correct: a golden here states the canonical
/// form a row must have, and is authored from the fixed harness seed rather than recorded from
/// whatever an implementation returned. If a case fails, the engine is wrong until proven otherwise.
///
/// Requires the shared docker harness (`pnpm harness:up`). FAIL LOUD, NEVER SKIP.
void main() {
  // MSSQL is deliberately absent: there is no native pure-Dart TDS driver and its leg is built last
  // (see docs/engine-pilot-plan.md). This list is asserted below so the gap stays EXPLICIT — a port
  // that quietly stopped replaying a dialect is exactly how coverage is lost.
  const implemented = {'postgres', 'mysql', 'sqlite'};

  final corpus = jsonDecode(
    File('../../contract/corpora/normalization/corpus.json').readAsStringSync(),
  ) as Map<String, Object?>;
  final cases = (corpus['cases']! as List).cast<Map<String, Object?>>();

  late Map<String, DbExecutor> executors;

  setUpAll(() async {
    executors = {
      'postgres': await PostgresExecutor.open(
        const PostgresConnectionOptions(
          host: 'localhost',
          database: 'sqleasy_ci',
          username: 'sqleasy',
          password: 'sqleasy_ci',
        ),
      ),
      'mysql': await MysqlExecutor.open(
        const MysqlConnectionOptions(
          host: 'localhost',
          database: 'sqleasy_ci',
          username: 'root',
          password: 'sqleasy_ci',
          allowInvalidCertificate: true,
        ),
      ),
      'sqlite': SqliteExecutor.openInMemory()
        ..database.execute(
          File('../../harness/seed/sqlite.sql').readAsStringSync(),
        ),
    };
  });

  tearDownAll(() async {
    for (final executor in executors.values) {
      await executor.close();
    }
  });

  test('the corpus is non-empty and every case names its dialects', () {
    expect(cases, isNotEmpty);
    for (final testCase in cases) {
      expect((testCase['sql']! as Map).keys, isNotEmpty,
          reason: '${testCase['name']} has no SQL');
    }
  });

  test('the set of replayed dialects is explicit', () {
    expect(executors.keys.toSet(), implemented,
        reason: 'a dialect silently dropped from the replay is lost coverage');
  });

  for (final testCase in cases) {
    final name = testCase['name']! as String;
    final sqlByDialect = (testCase['sql']! as Map).cast<String, Object?>();
    final params = (testCase['params'] as List?) ?? const [];
    final baseExpect = testCase['expect']! as Map<String, Object?>;
    final overrides =
        (testCase['overrides'] as Map?)?.cast<String, Object?>() ?? const {};
    // A case may name the dialects it applies to — a DATE case cannot run on SQLite, which has no
    // date type. Absent SQL says the same thing; both are honoured so neither can drift.
    final allowed = (testCase['dialects'] as List?)?.cast<String>();

    for (final dialect in implemented) {
      if (allowed != null && !allowed.contains(dialect)) continue;
      final sql = sqlByDialect[dialect] as String?;
      if (sql == null) continue; // the corpus does not define this case here

      test('[$dialect] $name', () async {
        // An override REPLACES only the keys it names; everything else stays canonical.
        final expected = {
          ...baseExpect,
          ...?(overrides[dialect] as Map<String, Object?>?),
        };

        final result = await executors[dialect]!
            .run(PreparedSql(sql, _bindParams(params)));

        expect(result.rowCount, expected['rowCount'], reason: 'rowCount');
        expect(
          result.rows.isEmpty ? <String>[] : result.rows.first.keys.toList(),
          expected['columns'],
          reason: 'column names AND their order are part of the contract',
        );
        expect(
          result.rows.map((row) => row.values.map(_tag).toList()).toList(),
          expected['rows'],
          reason: 'normalized row values',
        );
      });
    }
  }
}

/// Turns a corpus `InputValue` into the Dart value to bind.
List<Object?> _bindParams(List<Object?> params) => [
      for (final raw in params.cast<Map<String, Object?>>())
        switch (raw['t']) {
          'null' => null,
          'int' => (raw['v']! as num).toInt(),
          'double' => (raw['v']! as num).toDouble(),
          'bool' => raw['v']! as bool,
          _ => raw['v'],
        },
    ];

/// Tags an actual value the way the corpus tags an expected one, so the two compare directly.
///
/// Integers are tagged with their DIGITS, not a JSON number, because a 64-bit value does not survive
/// a JSON number — 2^53+1 is in this corpus precisely to catch that.
Map<String, Object?> _tag(Object? value) => switch (value) {
      null => {'t': 'null'},
      final bool b => {'t': 'bool', 'v': b},
      final int i => {'t': 'int', 'v': i.toString()},
      final double d => {'t': 'double', 'v': d},
      final String s => {'t': 'string', 'v': s},
      _ => {'t': 'string', 'v': value.toString()},
    };
