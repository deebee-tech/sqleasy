@TestOn('vm')
library;

import 'dart:convert';
import 'dart:io';

import 'package:test/test.dart';

/// The COMPILE-TIME ceiling proof. `test/ceiling/negative_cases.dart` calls, on each dialect's view,
/// a method that dialect cannot run; every call must fail analysis with `undefined_method`. This runs
/// the analyzer (JSON output) on that fixture and asserts it rejects EXACTLY the intended calls — the
/// Dart analog of TypeScript's `@ts-expect-error` block. If a wrong-dialect method ever becomes
/// reachable on the wrong view, its rejection disappears and this fails; if a new spurious error
/// appears, the multiset equality fails too.
void main() {
  // Intended wrong-dialect rejections — one per unique (method, view). Removing a method from an
  // AbsentOn set (TS) / a dialect's `absent` set (Dart manifest) drops its rejection and fails here.
  const expected = <(String method, String view)>[
    ('top', 'PostgresQueryBuilder'),
    ('top', 'MysqlQueryBuilder'),
    ('top', 'SqliteQueryBuilder'),
    ('merge', 'PostgresQueryBuilder'),
    ('distinctOn', 'MssqlQueryBuilder'),
    ('forShare', 'MssqlQueryBuilder'),
    ('onConflictDoNothing', 'MssqlQueryBuilder'),
    ('returning', 'MysqlQueryBuilder'),
    ('limitWithTies', 'MysqlQueryBuilder'),
    ('hintUseIndex', 'PostgresQueryBuilder'),
    ('callProcedure', 'SqliteQueryBuilder'),
    ('forUpdate', 'SqliteQueryBuilder'),
    // Engine-native renames: the generic is hidden where the alias is shown, and the alias is absent
    // off its home dialect.
    ('forUpdate', 'MssqlQueryBuilder'),
    ('onConflictDoNothing', 'MysqlQueryBuilder'),
    ('updlock', 'PostgresQueryBuilder'),
    ('insertIgnore', 'PostgresQueryBuilder'),
  ];

  // The SAME rejection reached again through a NESTED context — each contributes one more error, so
  // if nested narrowing regressed (the nested call stopped erroring) the count would drop and the
  // multiset equality would fail, even though the pair still appears at top level.
  const nested = <(String method, String view)>[
    (
      'top',
      'PostgresQueryBuilder'
    ), // inside a fromWithBuilder subquery callback
    ('distinctOn', 'MssqlQueryBuilder'), // inside a MERGE using-select subquery
    ('top', 'PostgresQueryBuilder'), // a Postgres MultiBuilder statement
    ('forUpdate', 'MssqlQueryBuilder'), // an MSSQL MultiBuilder statement
  ];

  final pairPattern =
      RegExp(r"The method '(\w+)' isn't defined for the type '(\w+)'");

  late List<Map<String, Object?>> errors;
  late List<(String, String)> pairs;

  setUpAll(() {
    // `dart analyze` exits non-zero when it finds issues — the expected, healthy case here.
    final result = Process.runSync(
      'dart',
      ['analyze', '--format=json', 'test/ceiling/negative_cases.dart'],
    );
    final decoded = jsonDecode(result.stdout as String) as Map<String, Object?>;
    final diagnostics =
        (decoded['diagnostics']! as List).cast<Map<String, Object?>>();
    errors = diagnostics.where((d) => d['severity'] == 'ERROR').toList();
    pairs = [
      for (final d in errors)
        if (pairPattern.firstMatch(d['problemMessage'] as String? ?? '')
            case final m?)
          (m.group(1)!, m.group(2)!),
    ];
  });

  test('every rejection is a compile-time undefined_method, nothing else', () {
    for (final d in errors) {
      expect(d['code'], 'undefined_method',
          reason: 'unexpected error: ${d['problemMessage']}');
    }
    // Every ERROR must have parsed into a (method, view) pair — otherwise the message shape drifted.
    expect(pairs, hasLength(errors.length));
  });

  test('rejects EXACTLY the intended wrong-dialect calls, at every level', () {
    Map<(String, String), int> tally(Iterable<(String, String)> ps) {
      final m = <(String, String), int>{};
      for (final p in ps) {
        m[p] = (m[p] ?? 0) + 1;
      }
      return m;
    }

    // Multiset equality: a missing rejection, an extra one, or a nested case that stopped narrowing
    // all fail here.
    expect(tally(pairs), equals(tally([...expected, ...nested])));
  });
}
