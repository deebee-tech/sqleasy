@TestOn('vm')
library;

import 'package:sqleasy_engine/src/normalize.dart';
import 'package:test/test.dart';

/// Pure form tests — no database. The DB-backed proof that each executor supplies the RIGHT kind
/// lives in the `integration`-tagged corpus replay; this pins the forms themselves, and the two
/// decisions the corpus cannot reach: an unknown kind is left alone, and an instant column whose
/// driver did not hand over an instant is left alone too.
///
/// Every case is stated twice where it matters — once UTC-flagged, once local-flagged — because the
/// whole point of reading a `DateTime`'s OWN components is that the two agree.
void main() {
  group('canonicalTimestamp — zone-less, no designator', () {
    test('writes the stored digits from either half, and never a Z', () {
      expect(canonicalTimestamp(DateTime.utc(2024, 4, 1, 10)),
          '2024-04-01T10:00:00');
      expect(
          canonicalTimestamp(DateTime(2024, 4, 1, 10)), '2024-04-01T10:00:00');
    });

    test('writes a whole second plainly and keeps real sub-second digits', () {
      expect(canonicalTimestamp(DateTime.utc(2024, 4, 1, 10, 0, 0, 0, 0)),
          '2024-04-01T10:00:00');
      expect(canonicalTimestamp(DateTime.utc(2024, 4, 1, 10, 0, 0, 500)),
          '2024-04-01T10:00:00.500');
      expect(canonicalTimestamp(DateTime.utc(2024, 4, 1, 10, 0, 0, 123, 456)),
          '2024-04-01T10:00:00.123456');
    });
  });

  group('canonicalDate — a date, with no invented midnight', () {
    test('is YYYY-MM-DD and nothing more', () {
      expect(canonicalDate(DateTime.utc(2024, 4, 1)), '2024-04-01');
      expect(canonicalDate(DateTime(2024, 4, 1)), '2024-04-01');
    });

    test('does not slide a day when the value is a UTC-flagged midnight', () {
      // `package:postgres` returns DATE '2024-04-01' exactly like this. Reading the local half
      // instead lands on 2024-03-31 anywhere west of Greenwich.
      expect(canonicalDate(DateTime.utc(2024, 4, 1)), '2024-04-01');
    });
  });

  group('canonicalInstant — UTC with the Z designator', () {
    test('keeps the instant and states it in UTC', () {
      expect(canonicalInstant(DateTime.utc(2024, 4, 1, 10)),
          '2024-04-01T10:00:00Z');
      expect(canonicalInstant(DateTime.utc(2024, 4, 1, 14)),
          '2024-04-01T14:00:00Z');
    });
  });

  group('normalizeValue', () {
    test('rewrites each kind into the form that kind actually means', () {
      final value = DateTime.utc(2024, 4, 1, 10);
      expect(
          normalizeValue(value, TemporalKind.instant), '2024-04-01T10:00:00Z');
      expect(normalizeValue(value, TemporalKind.naive), '2024-04-01T10:00:00');
      expect(normalizeValue(value, TemporalKind.date), '2024-04-01');
    });

    test('leaves a DateTime of UNKNOWN kind exactly as the driver made it', () {
      final value = DateTime.utc(2024, 4, 1, 10);
      expect(normalizeValue(value), same(value));
    });

    test('leaves a local-flagged value on an instant column alone', () {
      // A BACKSTOP, not a live path: no executor mapping produces this today. A driver that stamps
      // an instant column's value with the READER's zone has not handed over an instant — reading it
      // as one would give an answer that changes with TZ — so the driver's own object is reported
      // instead. This is the shape the retired MySQL `TIMESTAMP` -> instant mapping had.
      final value = DateTime(2024, 4, 1, 10);
      expect(normalizeValue(value, TemporalKind.instant), same(value));
    });

    test('passes non-temporal values through untouched', () {
      expect(normalizeValue(null), isNull);
      expect(normalizeValue(9007199254740993), 9007199254740993);
      expect(normalizeValue('2024-04-01'), '2024-04-01');
      expect(normalizeValue(true), true);
    });
  });

  group('normalizeRow / normalizeRows', () {
    test('keys and their order survive', () {
      final row = normalizeRow(
        {'placed_at': DateTime.utc(2024, 4, 1, 10), 'note': 'first order'},
        {'placed_at': TemporalKind.naive},
      );
      expect(row.keys.toList(), ['placed_at', 'note']);
      expect(row['placed_at'], '2024-04-01T10:00:00');
    });

    test('a column absent from the kinds map is not rewritten', () {
      final value = DateTime.utc(2024, 4, 1, 10);
      final row = normalizeRow({'when': value}, {'other': TemporalKind.naive});
      expect(row['when'], same(value));
    });

    test('with no kinds at all, nothing temporal moves', () {
      final value = DateTime.utc(2024, 4, 1, 10);
      expect(
          normalizeRows([
            {'a': value}
          ]),
          [
            {'a': value}
          ]);
    });
  });
}
