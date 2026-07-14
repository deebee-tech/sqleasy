import 'package:sqleasy/src/errors/parser_error.dart';
import 'package:sqleasy/src/values/sql_value.dart';
import 'package:test/test.dart';

/// These tests are the reason the port is safe.
///
/// They MUST be run on the Dart VM *and* under dart2js:
///
///     dart test
///     dart test -p chrome
///
/// The two platforms disagree about numbers — `5.0 is int` is false on the VM and true on dart2js,
/// and `(5.0).toString()` is `"5.0"` on the VM and `"5"` on the web. Every assertion below is
/// written to hold on both. If one of them starts passing on only one platform, the port is emitting
/// different SQL on Flutter web than on Flutter mobile, which is exactly the failure this layer
/// exists to prevent.
void main() {
  group('isIntegral', () {
    test('is true for an int', () {
      expect(isIntegral(5), isTrue);
      expect(isIntegral(0), isTrue);
      expect(isIntegral(-3), isTrue);
    });

    test('is true for an INTEGRAL DOUBLE, on both platforms', () {
      // The load-bearing case. `5.0 is int` alone would be false on the VM and true on dart2js.
      expect(isIntegral(5.0), isTrue);
      expect(isIntegral(-3.0), isTrue);
      expect(isIntegral(0.0), isTrue);
      expect(isIntegral(-0.0), isTrue);
    });

    test('is false for a fractional double', () {
      expect(isIntegral(5.5), isFalse);
      expect(isIntegral(0.1), isFalse);
      expect(isIntegral(-0.5), isFalse);
    });

    test('is false for non-finite values', () {
      expect(isIntegral(double.nan), isFalse);
      expect(isIntegral(double.infinity), isFalse);
      expect(isIntegral(double.negativeInfinity), isFalse);
    });

    test('matches JavaScript Number.isInteger for large magnitudes', () {
      expect(isIntegral(1e21), isTrue);
      expect(isIntegral(9007199254740992.0), isTrue); // 2^53
    });
  });

  group('isSafeIntegral', () {
    test('mirrors Number.isSafeInteger at the 2^53 boundary', () {
      expect(isSafeIntegral(9007199254740991.0), isTrue); // 2^53 - 1
      expect(isSafeIntegral(9007199254740992.0), isFalse); // 2^53
      expect(isSafeIntegral(1e21), isFalse);
      expect(isSafeIntegral(-9007199254740991.0), isTrue);
    });

    test('is false for a fractional double', () {
      expect(isSafeIntegral(1.5), isFalse);
    });
  });

  group('formatNumber', () {
    test('renders an int without a fractional part', () {
      expect(formatNumber(5), '5');
      expect(formatNumber(0), '0');
      expect(formatNumber(-3), '-3');
      expect(formatNumber(255), '255');
    });

    test('renders an INTEGRAL DOUBLE exactly like an int — the frozen contract',
        () {
      // TypeScript emits `5` for both, and MSSQL declares `@p0 tinyint` for both. A port that let
      // `5.0` render as "5.0" would emit `@p0 float` on Flutter mobile and `@p0 tinyint` on Flutter
      // web, from the same source. Both must be "5", on both platforms.
      expect(formatNumber(5.0), '5');
      expect(formatNumber(-3.0), '-3');
      expect(formatNumber(0.0), '0');
      expect(formatNumber(5), formatNumber(5.0));
    });

    test('renders -0.0 as 0, like JavaScript String(-0)', () {
      expect(formatNumber(-0.0), '0');
    });

    test('renders a fractional double with its shortest round-trip form', () {
      expect(formatNumber(5.5), '5.5');
      expect(formatNumber(0.1), '0.1');
      // The classic float artefact — JavaScript prints exactly this, so Dart must too.
      expect(formatNumber(0.1 + 0.2), '0.30000000000000004');
    });

    test('renders large magnitudes exactly the way JavaScript does', () {
      // Dart's toString() appends ".0" to an integral double and JavaScript never does. These are
      // the exact values where that bites; each is the JS rendering, which the corpus froze.
      expect(formatNumber(9007199254740992.0), '9007199254740992'); // 2^53
      expect(formatNumber(-9007199254740992.0), '-9007199254740992');
      expect(formatNumber(1e17), '100000000000000000');
      expect(formatNumber(1e20), '100000000000000000000');

      // At 1e21 both languages switch to exponential, and agree on the text.
      expect(formatNumber(1e21), '1e+21');
      expect(formatNumber(1e22), '1e+22');
    });

    test('renders an int beyond 2^53 exactly', () {
      // On the VM this is an exact 64-bit int; under dart2js it is a double. Both must print the
      // digits, never `9007199254740992.0`.
      expect(formatNumber(9007199254740992), '9007199254740992');
    });

    test('refuses non-finite values instead of emitting NaN/Infinity as SQL',
        () {
      expect(() => formatNumber(double.nan), throwsA(isA<ParserError>()));
      expect(() => formatNumber(double.infinity), throwsA(isA<ParserError>()));
    });
  });

  group('formatDateTime', () {
    test('converts a LOCAL DateTime to UTC and appends Z', () {
      // Dart's own toIso8601String() would neither convert nor append Z here — it would emit the
      // local wall-clock time with no zone, which is a different instant and an unparseable literal.
      final local = DateTime.fromMillisecondsSinceEpoch(1705320000000);
      expect(local.isUtc, isFalse);

      final formatted = formatDateTime(local);
      expect(formatted, endsWith('Z'));
      expect(formatted, '2024-01-15T12:00:00.000Z');
    });

    test('keeps a UTC DateTime unchanged', () {
      expect(
        formatDateTime(DateTime.utc(2024, 1, 15, 12)),
        '2024-01-15T12:00:00.000Z',
      );
    });

    test('truncates microseconds to milliseconds, like a JavaScript Date', () {
      // Dart holds microseconds and would print SIX fractional digits; JS holds milliseconds and
      // always prints three. The corpus froze three.
      final precise = DateTime.utc(2024, 1, 15, 12, 0, 0, 123, 456);
      expect(formatDateTime(precise), '2024-01-15T12:00:00.123Z');
    });

    test('always emits exactly three fractional digits', () {
      expect(formatDateTime(DateTime.utc(2024, 1, 15)),
          '2024-01-15T00:00:00.000Z');
      expect(formatDateTime(DateTime.utc(2024, 1, 15, 0, 0, 0, 7)),
          '2024-01-15T00:00:00.007Z');
    });

    test('handles a pre-epoch instant', () {
      expect(
        formatDateTime(DateTime.utc(1969, 7, 20, 20, 17, 40)),
        '1969-07-20T20:17:40.000Z',
      );
    });
  });

  group('assertBindableValue', () {
    test('accepts every representable value', () {
      expect(() => assertBindableValue(null), returnsNormally);
      expect(() => assertBindableValue('x'), returnsNormally);
      expect(() => assertBindableValue(5), returnsNormally);
      expect(() => assertBindableValue(5.5), returnsNormally);
      expect(() => assertBindableValue(true), returnsNormally);
      expect(() => assertBindableValue(DateTime.utc(2024)), returnsNormally);
    });

    test('refuses NaN and Infinity', () {
      expect(
          () => assertBindableValue(double.nan), throwsA(isA<ParserError>()));
      expect(() => assertBindableValue(double.infinity),
          throwsA(isA<ParserError>()));
      expect(
        () => assertBindableValue(double.negativeInfinity),
        throwsA(isA<ParserError>()),
      );
    });
  });

  group('valueToDebugString', () {
    test('renders null as the empty string, matching TypeScript', () {
      expect(valueToDebugString(null), '');
    });

    test('renders a string verbatim — unquoted and unescaped, by design', () {
      expect(valueToDebugString("a'b"), "a'b");
      expect(valueToDebugString(''), '');
    });

    test('renders numbers through formatNumber', () {
      expect(valueToDebugString(5), '5');
      expect(valueToDebugString(5.0), '5');
      expect(valueToDebugString(5.5), '5.5');
    });

    test('renders booleans as true/false', () {
      expect(valueToDebugString(true), 'true');
      expect(valueToDebugString(false), 'false');
    });

    test('renders a DateTime as a UTC ISO instant', () {
      expect(valueToDebugString(DateTime.utc(2024, 1, 15, 12)),
          '2024-01-15T12:00:00.000Z');
    });
  });

  group('ParserError', () {
    test(
        'renders as "<Area>: <message>", matching the TypeScript message format',
        () {
      expect(
        ParserError(ParserArea.where, 'IN requires at least one value')
            .toString(),
        'Where: IN requires at least one value',
      );
      expect(
        ParserError(ParserArea.general, 'identifier contains a NUL byte')
            .toString(),
        'General: identifier contains a NUL byte',
      );
    });
  });
}
