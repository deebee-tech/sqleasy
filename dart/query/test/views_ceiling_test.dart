@TestOn('vm')
library;

import 'dart:io';

import 'package:test/test.dart';

/// The COMPILE-TIME ceiling proof. `test/ceiling/negative_cases.dart` calls, on each dialect's view,
/// a method that dialect cannot run; every call must fail analysis with `undefined_method`. This test
/// runs the analyzer on that fixture and asserts each expected `(method, view)` rejection is present —
/// the Dart analog of TypeScript's `@ts-expect-error` block. If a wrong-dialect method ever becomes
/// reachable on the wrong view, its expected error disappears and this test fails.
void main() {
  // Each pair is a wrong-dialect call in the fixture that MUST be rejected.
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
    // Engine-native renames: the generic is hidden where the alias is shown, and the alias is
    // absent off its home dialect.
    ('forUpdate', 'MssqlQueryBuilder'),
    ('onConflictDoNothing', 'MysqlQueryBuilder'),
    ('updlock', 'PostgresQueryBuilder'),
    ('insertIgnore', 'PostgresQueryBuilder'),
  ];

  late String analyzerOutput;

  setUpAll(() {
    // `dart analyze` exits non-zero when it finds issues — that is the expected, healthy case here.
    final result = Process.runSync(
        'dart', ['analyze', 'test/ceiling/negative_cases.dart']);
    analyzerOutput = '${result.stdout}\n${result.stderr}';
  });

  test('every wrong-dialect call in the fixture is rejected at compile time',
      () {
    for (final (method, view) in expected) {
      expect(
        analyzerOutput,
        allOf(
          contains("The method '$method' isn't defined for the type '$view'"),
          contains('undefined_method'),
        ),
        reason: '$method should be ABSENT from $view (honest-surface ceiling)',
      );
    }
  });

  test(
      'the ceiling holds one level down — a subquery callback is the same narrow view',
      () {
    // negative_cases.dart calls `inner.top(5)` inside a Postgres `fromWithBuilder` callback; `inner`
    // is the Postgres view, so top() is absent there too.
    expect(
      analyzerOutput,
      contains(
          "The method 'top' isn't defined for the type 'PostgresQueryBuilder'"),
    );
  });

  test('the ceiling holds inside a MERGE using-select subquery', () {
    // negative_cases.dart calls `sub.distinctOn(...)` inside `merge((m) => m.usingSelect('s', ...))`;
    // MERGE is MSSQL-only, so `sub` is the MSSQL view and distinctOn (Postgres-only) is absent there.
    expect(
      analyzerOutput,
      contains(
          "The method 'distinctOn' isn't defined for the type 'MssqlQueryBuilder'"),
    );
  });

  test('the fixture produces ONLY the expected undefined_method rejections',
      () {
    // Guards against the fixture rotting into unrelated errors (a typo, a renamed method) that would
    // make the assertions above pass for the wrong reason.
    final errorLines =
        analyzerOutput.split('\n').where((l) => l.contains(' error ')).toList();
    // +2: the fromWithBuilder callback case and the MERGE using-select callback case.
    expect(errorLines, hasLength(expected.length + 2));
    for (final line in errorLines) {
      expect(line, contains('undefined_method'),
          reason: 'unexpected error: $line');
    }
  });
}
