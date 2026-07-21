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

  /// Corpus cases THIS PORT cannot replay, and exactly why.
  ///
  /// Not a way to make a red suite green: a gap here is a promise the port does not keep, so it is
  /// stated by name, with its cause, and asserted below to still exist in the corpus. The golden
  /// stays correct — the contract is never weakened to match a driver's limitation, the same way the
  /// MSSQL leg is recorded as absent rather than quietly dropped.
  const knownGaps = <String, String>{
    'a multi-dimensional array recurses':
        'package:postgres 3.5.12 mis-decodes EVERY multi-dimensional array, temporal or not: '
            'ARRAY[ARRAY[1,2],ARRAY[3,4]] comes back as [1, 1]. readListBytes consumes one '
            '(dim_size, lower_bound) pair, but the wire format carries one PER DIMENSION, so at '
            'ndim=2 it reads elements from inside the second dimension header. The same value cast '
            '::text returns the correct {{...}}, so the server sends good bytes and the decoder '
            'loses them. Corrupted before normalization runs — nothing in this package can fix it. '
            'The TypeScript port replays this case and passes.',
  };

  test('every known gap still names a real corpus case', () {
    // A renamed or deleted case must surface the stale exemption instead of silently widening it.
    final names = cases.map((c) => c['name']! as String).toSet();
    for (final gap in knownGaps.keys) {
      expect(names, contains(gap),
          reason:
              'knownGaps names "$gap", which the corpus no longer defines — '
              'delete the exemption or fix the name');
    }
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

      // `skip` carries the REASON, so the runner prints why on every run — a bare skip is how a
      // gap goes quiet.
      test('[$dialect] $name', skip: knownGaps[name], () async {
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
///
/// An `array` tag is built by recursing, so a nested array is tagged all the way down and compares
/// element-wise and in ORDER. The comparison itself is whole-structure deep equality against the
/// golden, which means a length mismatch fails: a short array cannot pass as a prefix of a long one,
/// and a long one cannot pass by containing the expected elements. The fallback arm deliberately
/// tags anything else as a string of its `toString()` — a raw driver object that escaped
/// normalization therefore FAILS against a golden rather than being quietly accepted.
Map<String, Object?> _tag(Object? value) => switch (value) {
      null => {'t': 'null'},
      final bool b => {'t': 'bool', 'v': b},
      final int i => {'t': 'int', 'v': i.toString()},
      final double d => {'t': 'double', 'v': d},
      final String s => {'t': 'string', 'v': s},
      final List<Object?> list => {
          't': 'array',
          'v': [for (final element in list) _tag(element)],
        },
      _ => {'t': 'string', 'v': value.toString()},
    };
