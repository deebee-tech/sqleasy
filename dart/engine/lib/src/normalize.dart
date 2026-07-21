/// Result-row normalization — turning each driver's native value into ONE canonical form, so the
/// same logical row reads identically on every dialect AND in every language port.
///
/// The 2026-07-19 audit found the engine performed no normalization at all, so one logical value
/// came back a different way per dialect. Corpus C (`contract/corpora/normalization/corpus.json`) is
/// the contract this satisfies; the TypeScript reference implements the same forms in
/// `ts/engine/src/normalize.ts` and this module must agree with it cell for cell.
///
/// It is deliberately CONSERVATIVE: it converts only what the DIALECT EXECUTOR has positively
/// identified from the driver's own column metadata. It never guesses from a value's shape — a
/// `note` column holding "2024-04-01" is text a user wrote, not a timestamp, and rewriting it would
/// corrupt data to make a table look tidy.
///
/// ── WHY NORMALIZATION IS COLUMN-DRIVEN, NOT VALUE-DRIVEN (fixed 2026-07-21) ──
/// The first version rewrote every `DateTime` it saw into one zone-less form. That was wrong, and
/// measurably so: three different column types arrive as an indistinguishable `DateTime`, and
/// flattening them lost real information. Measured against the harness through `package:postgres`
/// 3.5.12, under the OLD rule (render the wall clock, drop any `Z`):
///
///     TIMESTAMPTZ '2024-04-01 10:00:00+00'  ->  "2024-04-01T10:00:00"   <- WRONG: the designator
///     TIMESTAMPTZ '2024-04-01 10:00:00-04'  ->  "2024-04-01T14:00:00"      that made these INSTANTS
///     DATE        '2024-04-01'              ->  "2024-04-01T00:00:00"   <- WRONG: a midnight the
///                                                                          column never held
///
/// Two zone-carrying values came back looking like wall clocks, so a consumer could no longer tell
/// an instant from a naive reading, and a date acquired a time. That is the same silent-corruption
/// class as the MySQL `TINYINT(1)` bug — the read succeeds and the meaning is simply different.
///
/// (The TypeScript port's symptom was worse, and is recorded here because it is why the corpus asks
/// for TZ-independence: JavaScript's `Date` carries no UTC flag, so `pg` hands back a local-zone
/// object and the strings above ALSO moved with the reading machine's `TZ`. Dart is spared that
/// half — see [canonicalTimestamp] — but not the loss of meaning.)
///
/// So a temporal value now carries its column's KIND, and each kind gets the canonical form that
/// actually represents it. A `DateTime` whose kind the executor could not determine is LEFT ALONE:
/// refusing to guess is the whole point, and handing back the driver's own object is the honest
/// answer to "I do not know what this is".
library;

/// What a temporal column actually IS — which is what decides its canonical text.
///
/// Only the executor can know this, because it is a property of the COLUMN and every kind reaches
/// Dart as the same `DateTime`. Each dialect maps its own catalog's types onto these three.
enum TemporalKind {
  /// A point in time that carries a zone or offset: `timestamptz`, `timestamp with time zone`,
  /// MySQL `TIMESTAMP` (stored UTC), `datetimeoffset`. An instant has no single local rendering, so
  /// writing one down with no designator asserts something false.
  instant,

  /// A calendar date with no time component at all: `date`.
  date,

  /// A wall clock with no zone: `timestamp`, `datetime`, `datetime2`, `smalldatetime`. The digits
  /// the database holds are the whole truth; there is no instant to recover and none may be
  /// invented.
  naive,
}

/// Column name -> what that column's temporal values are. Built by each dialect executor.
typedef ColumnKinds = Map<String, TemporalKind>;

String _pad(int value, [int width = 2]) => value.toString().padLeft(width, '0');

/// The sub-second text, or empty for a whole second. Dart keeps MICROSECONDS on the VM and Postgres
/// stores them, so both digits groups are written when there are any — truncating to milliseconds to
/// match JavaScript's `Date` would throw away digits the database actually holds. No corpus case
/// carries a sub-second value, so the ports cannot disagree over one today.
String _fraction(DateTime value) {
  if (value.microsecond != 0) {
    return '.${_pad(value.millisecond, 3)}${_pad(value.microsecond, 3)}';
  }
  return value.millisecond == 0 ? '' : '.${_pad(value.millisecond, 3)}';
}

/// The canonical text for a ZONE-LESS temporal value: **ISO-8601, with NO timezone designator.**
///
/// `TIMESTAMP`, `DATETIME` and `DATETIME2` carry no zone, but every driver here hands back a
/// `DateTime`, which Dart models as an instant. `toIso8601String()` on a UTC-flagged one appends a
/// `Z` — turning "10:00, no zone" into an assertion the column never stored.
///
/// ── WHY THERE IS NO `DateComponents` PARAMETER (measured 2026-07-21) ──
/// The TypeScript port needs one: a zone-less column has no instant to represent, yet every driver
/// must still produce a `Date`, so each picks a zone to pretend the wall clock was in — and
/// JavaScript's `Date` does not record which. `pg` and `mysql2` pick local, `tedious` picks UTC, so
/// the executor has to TELL the normalizer which half of the object holds the stored digits.
///
/// Dart's `DateTime` carries `isUtc`, and every component getter (`year`, `hour`, …) reads the half
/// that flag names. Both drivers put the stored digits in exactly that half, so reading the object's
/// own components is already right — and, being read out of the half the driver wrote them into, the
/// answer does not move with the reading machine's `TZ`. Measured, one process per zone:
///
///     package:postgres 3.5.12        TIMESTAMP '2024-04-01 10:00:00'  isUtc=true
///       own components  -> 2024-04-01T10:00:00  under BOTH TZ=America/New_York and TZ=Asia/Tokyo
///       local half      -> 2024-04-01T06:00     (New_York)  /  2024-04-01T19:00  (Tokyo)
///     package:postgres 3.5.12        DATE '2024-04-01'                isUtc=true
///       own components  -> 2024-04-01           under both
///       local half      -> 2024-03-31           (New_York)  <- a day earlier
///     mysql_client_plus 0.1.3        DATETIME '2024-04-01 10:00:00'   isUtc=false
///       own components  -> 2024-04-01T10:00:00  under both
///       utc half        -> 2024-04-01T14:00     (New_York)  /  2024-04-01T01:00  (Tokyo)
///
/// The two drivers disagree about `isUtc` for the SAME kind of column — which is precisely the
/// disagreement `DateComponents` was invented to carry — and reading the own half absorbs it. So the
/// axis exists here too; Dart just records it on the value instead of in a parameter.
String canonicalTimestamp(DateTime value) {
  final time =
      '${_pad(value.hour)}:${_pad(value.minute)}:${_pad(value.second)}';
  return '${canonicalDate(value)}T$time${_fraction(value)}';
}

/// The canonical text for a DATE column: `YYYY-MM-DD`, and nothing more.
///
/// A date has no time, so appending `T00:00:00` states a midnight the column never held — and once
/// written it is indistinguishable from a timestamp that genuinely landed on midnight. Reads the
/// value's own components for the same reason [canonicalTimestamp] does, and with a whole extra day
/// at stake: `package:postgres` returns `DATE '2024-04-01'` as a UTC-flagged midnight, so taking the
/// local half lands on 2024-03-31 anywhere west of Greenwich.
String canonicalDate(DateTime value) =>
    '${_pad(value.year, 4)}-${_pad(value.month)}-${_pad(value.day)}';

/// The canonical text for an INSTANT: **ISO-8601 in UTC, with the `Z` designator.**
///
/// The opposite call from [canonicalTimestamp], for the opposite reason. This column genuinely
/// identifies a point in time, so a rendering with no designator would DROP that meaning and leave a
/// string that reads like a wall clock. UTC specifically, because the driver hands over a `DateTime`
/// with no memory of the offset it was written with — so `Z` is the only designator that is true
/// rather than invented.
///
/// Assumes `value` really is an instant. [normalizeValue] enforces that before calling here; see the
/// `isUtc` gate there for the one driver that fails it.
String canonicalInstant(DateTime value) =>
    '${canonicalTimestamp(value.toUtc())}Z';

/// Normalizes ONE driver value, given what its column is.
///
/// A `DateTime` with no known kind is returned UNTOUCHED. That is deliberate: this layer exists to
/// stop the engine guessing, and an unidentified temporal is exactly the case where guessing
/// produced corrupted data. Non-temporal values — ints, doubles, strings (including the exact
/// decimal strings every dialect produces), booleans, nulls — already agree across dialects and pass
/// through.
///
/// ── THE `isUtc` GATE ON `instant` — A BACKSTOP, NOT A MECHANISM ──
/// An instant column may only be written with a `Z` if the driver actually handed over an instant.
/// `package:postgres` does: `timestamptz` arrives `isUtc == true`, decoded from microseconds since
/// the epoch, so `toUtc()` is the truth. Every executor mapping in this engine today satisfies the
/// gate, so it changes no result — it exists so that a FUTURE mapping cannot silently reintroduce
/// the failure it was written for.
///
/// That failure was real, briefly. MySQL `TIMESTAMP` was mapped to `instant` on the reasonable
/// grounds that MySQL stores it as UTC. It does — but the server converts it into the SESSION time
/// zone and sends zone-less digits, and `mysql_client_plus` then `DateTime.parse`s them into a
/// LOCAL-flagged value stamped with the READER's offset. `toUtc()` therefore produced `14:00Z` under
/// `TZ=America/New_York` and `01:00Z` under `TZ=Asia/Tokyo` for the same stored row: two different
/// instants, neither of them the stored one. That mapping is now `naive` on both ports — see the
/// measurement in mysql_executor.dart — so this gate no longer fires for it.
///
/// A local-flagged value on an instant column is left alone: that reports "I cannot tell you the
/// instant" instead of inventing one, which is the same refusal an unknown kind gets. (The
/// TypeScript port cannot make this check at all — `Date` carries no such flag — which is why the
/// MySQL mapping there had to be fixed rather than caught.)
Object? normalizeValue(Object? value, [TemporalKind? kind]) {
  if (value is! DateTime) return value;
  switch (kind) {
    case TemporalKind.instant:
      return value.isUtc ? canonicalInstant(value) : value;
    case TemporalKind.date:
      return canonicalDate(value);
    case TemporalKind.naive:
      return canonicalTimestamp(value);
    case null:
      return value;
  }
}

/// Normalizes every value in a result row, leaving keys and their order alone.
Map<String, Object?> normalizeRow(
  Map<String, Object?> row, [
  ColumnKinds? kinds,
]) =>
    row.map((key, value) => MapEntry(key, normalizeValue(value, kinds?[key])));

/// Normalizes every row in a result set.
///
/// With no `kinds` this leaves temporal values alone by construction — the correct behaviour for a
/// driver that hands back strings rather than `DateTime`s (SQLite), and the safe behaviour for a
/// query whose metadata the driver did not carry.
List<Map<String, Object?>> normalizeRows(
  Iterable<Map<String, Object?>> rows, [
  ColumnKinds? kinds,
]) =>
    [for (final row in rows) normalizeRow(row, kinds)];
