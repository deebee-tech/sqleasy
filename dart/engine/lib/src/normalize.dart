/// Result-row normalization — turning each driver's native value into ONE canonical form, so the
/// same logical row reads identically on every dialect.
///
/// The 2026-07-19 audit found the engine performed no normalization at all, so the same value came
/// back four different ways. This is where "byte-for-byte parity is the product" is enforced for
/// results, and it is deliberately CONSERVATIVE: it converts only what it can identify from the
/// value's own Dart type. It never guesses from a string's shape — a `note` column holding
/// "2024-04-01" is text a user wrote, not a timestamp, and rewriting it would corrupt data to make a
/// table look tidy.
library;

/// A timestamp with an all-zero sub-second part, so a whole second is written plainly.
final RegExp _zeroFraction = RegExp(r'\.0+$');

/// The canonical text for a temporal value: **ISO-8601, with NO timezone designator.**
///
/// The columns this engine reads (`TIMESTAMP`, `DATETIME`, `DATETIME2`) carry no timezone, but the
/// Postgres driver hands back a `DateTime` flagged UTC — so `toIso8601String()` appends a `Z` that
/// says something the column never stored. That `Z` is INVENTED, and stamping an unknown offset onto
/// a wall-clock reading is the same class of untruth as rounding a decimal to make it fit a float.
/// The wall-clock components ARE the value, so they are what is written.
///
/// A value that genuinely carries an offset belongs in a `TIMESTAMPTZ`-shaped column, which is a
/// different capability and would get its own canonical form — it is not folded in here.
String canonicalTimestamp(DateTime value) {
  var text = value.toIso8601String();
  if (text.endsWith('Z')) text = text.substring(0, text.length - 1);
  return text.replaceFirst(_zeroFraction, '');
}

/// Normalizes ONE driver value.
///
/// Only `DateTime` is rewritten today, because it is the only type whose Dart identity is
/// unambiguous AND whose renderings disagree across drivers. Ints, strings (including the exact
/// decimal strings every dialect now produces), booleans and nulls already agree and are passed
/// through untouched — normalizing them would be motion without meaning.
Object? normalizeValue(Object? value) =>
    value is DateTime ? canonicalTimestamp(value) : value;

/// Normalizes every value in a result row, leaving keys and ordering alone.
Map<String, Object?> normalizeRow(Map<String, Object?> row) =>
    row.map((key, value) => MapEntry(key, normalizeValue(value)));
