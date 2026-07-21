/**
 * Result-row normalization — turning each driver's native value into ONE canonical form, so the same
 * logical row reads identically on every dialect AND in every language port.
 *
 * The 2026-07-19 audit found the engine performed no normalization at all, so one logical value came
 * back four different ways. Corpus C (`contract/corpora/normalization/corpus.json`) is the contract
 * this satisfies; the Dart port implements the same forms in `dart/engine/lib/src/normalize.dart`.
 *
 * It is deliberately CONSERVATIVE: it converts only what the DIALECT EXECUTOR has positively
 * identified from the driver's own column metadata. It never guesses from a value's shape — a `note`
 * column holding "2024-04-01" is text a user wrote, not a timestamp, and rewriting it would corrupt
 * data to make a table look tidy.
 *
 * ── WHY NORMALIZATION IS COLUMN-DRIVEN, NOT VALUE-DRIVEN (fixed 2026-07-21) ──
 * The first version rewrote every `Date` it saw into one zone-less form. That was wrong, and
 * measurably so: three different column types arrive as an indistinguishable `Date`, and flattening
 * them lost real information. Measured against the harness on an `America/New_York` machine:
 *
 *     TIMESTAMPTZ '2024-04-01 10:00:00+00'  ->  "2024-04-01T06:00:00"   <- WRONG: shifted into the
 *     TIMESTAMPTZ '2024-04-01 10:00:00-04'  ->  "2024-04-01T10:00:00"      reader's local zone, the
 *     DATE        '2024-04-01'              ->  "2024-04-01T00:00:00"      offset silently discarded
 *
 * Two distinct instants became two different naive strings, and which strings you got depended on
 * the reading machine's `TZ`. That is the same silent-corruption class as the MySQL `TINYINT(1)`
 * bug — the read succeeds and the digits are simply different.
 *
 * So a temporal value now carries its column's KIND, and each kind gets the canonical form that
 * actually represents it. A `Date` whose kind the executor could not determine is LEFT ALONE:
 * refusing to guess is the whole point, and handing back the driver's own object is the honest
 * answer to "I do not know what this is".
 *
 * ── ARRAYS ARE NORMALIZED; THE POSTGRES-ONLY TYPES ARE NOT ──
 * A `timestamp[]` is normalized ELEMENT-WISE, because that is not a new canonical form — it is the
 * element's existing form applied one level down. It had to be: with no kind for the array OIDs the
 * elements passed through raw and read differently in every timezone, `date[]` landing on the wrong
 * day. The scalar bug, unfixed, one level down.
 *
 * What stays out of scope, deliberately, is the set of Postgres types with no analogue in any other
 * dialect: `tsrange`/`daterange`, `time`, `timetz`, `interval`. They carry NO canonical form — see
 * the rationale in `contract/schema/normalization.ts`, which is where a scope decision belongs. They
 * are passed through exactly as the driver produced them, and none of them is TZ-dependent, so this
 * is a boundary rather than a defect. T-SQL `time` is omitted for the same reason.
 */

/** A timestamp whose sub-second part is all zeroes, so a whole second is written plainly. */
const ZERO_FRACTION = /\.0+$/;

const pad = (value: number, width = 2): string => String(value).padStart(width, '0');

/**
 * What a temporal column actually IS — which is what decides its canonical text.
 *
 * Only the executor can know this, because it is a property of the COLUMN and every kind reaches
 * JavaScript as the same `Date`. Each dialect maps its own catalog's types onto these three.
 */
export type TemporalKind =
  /**
   * A point in time that carries a zone or offset: `timestamptz`, `timestamp with time zone`,
   * MySQL `TIMESTAMP` (stored UTC), `datetimeoffset`. An instant has no single local rendering, so
   * writing one down with no designator asserts something false.
   */
  | 'instant'
  /** A calendar date with no time component at all: `date`. */
  | 'date'
  /**
   * A wall clock with no zone: `timestamp`, `datetime`, `datetime2`, `smalldatetime`. The digits the
   * database holds are the whole truth; there is no instant to recover and none may be invented.
   */
  | 'naive';

/** Column name -> what that column's temporal values are. Built by each dialect executor. */
export type ColumnKinds = ReadonlyMap<string, TemporalKind>;

/**
 * Which half of a `Date` holds the digits the database actually stored — a DRIVER property, so the
 * executor states it and this module never guesses.
 *
 * A zone-less column has no instant to represent, yet every driver must still produce a `Date`, so
 * each one picks a zone to pretend the wall clock was in. `pg` and `mysql2` pick LOCAL, which puts
 * the stored digits in `getHours()`. `tedious` picks UTC, which puts them in `getUTCHours()` and
 * leaves the local getters shifted by the reader's offset. Measured, under two zones:
 *
 *     DATETIME2 '2024-04-01T10:00:00' read with LOCAL getters -> "2024-04-01T06:00:00"  (New_York)
 *                                                             -> "2024-04-01T19:00:00"  (Tokyo)
 *     DATE      '2024-04-01'          read with LOCAL getters -> "2024-03-31"  <- a day earlier
 *
 * Reading the matching half makes the answer the stored digits on every driver, and independent of
 * the reading machine's `TZ` — which is the whole contract.
 */
export type DateComponents = 'local' | 'utc';

/** The stored digits, read from whichever half of the `Date` the driver put them in. */
function parts(
  value: Date,
  components: DateComponents,
): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  ms: number;
} {
  return components === 'utc'
    ? {
        year: value.getUTCFullYear(),
        month: value.getUTCMonth() + 1,
        day: value.getUTCDate(),
        hour: value.getUTCHours(),
        minute: value.getUTCMinutes(),
        second: value.getUTCSeconds(),
        ms: value.getUTCMilliseconds(),
      }
    : {
        year: value.getFullYear(),
        month: value.getMonth() + 1,
        day: value.getDate(),
        hour: value.getHours(),
        minute: value.getMinutes(),
        second: value.getSeconds(),
        ms: value.getMilliseconds(),
      };
}

/**
 * The canonical text for a ZONE-LESS temporal value: **ISO-8601, with NO timezone designator.**
 *
 * `TIMESTAMP`, `DATETIME` and `DATETIME2` carry no zone, but every driver here hands back a `Date`,
 * which is an instant. `toISOString()` would convert that instant to UTC and append a `Z` — turning
 * "10:00, no zone" into "14:00Z" on a machine in EDT, and into something else again elsewhere. Both
 * the shift and the `Z` assert something the column never stored.
 *
 * The stored digits are recovered by reading the half of the `Date` the driver put them in — see
 * {@link DateComponents}. That is what gets written, which also makes the result independent of the
 * reading machine's `TZ`.
 */
export function canonicalTimestamp(value: Date, components: DateComponents = 'local'): string {
  const p = parts(value, components);
  const fraction = p.ms === 0 ? '' : `.${pad(p.ms, 3)}`;
  const time = `${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
  return `${canonicalDate(value, components)}T${time}${fraction}`.replace(ZERO_FRACTION, '');
}

/**
 * The canonical text for a DATE column: `YYYY-MM-DD`, and nothing more.
 *
 * A date has no time, so appending `T00:00:00` states a midnight the column never held — and once
 * written it is indistinguishable from a timestamp that genuinely landed on midnight. Reads the same
 * {@link DateComponents} half as {@link canonicalTimestamp}, and for the same reason — with a whole
 * extra day at stake, since an offset applied to midnight lands on the previous date.
 */
export function canonicalDate(value: Date, components: DateComponents = 'local'): string {
  const p = parts(value, components);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/**
 * The canonical text for an INSTANT: **ISO-8601 in UTC, with the `Z` designator.**
 *
 * The opposite call from {@link canonicalTimestamp}, for the opposite reason. This column genuinely
 * identifies a point in time, so a rendering with no designator would DROP that meaning and leave a
 * string that reads like a wall clock. UTC specifically, because the driver hands over a `Date` — an
 * instant with no memory of the offset it was written with — so `Z` is the only designator that is
 * true rather than invented.
 */
export function canonicalInstant(value: Date): string {
  return value.toISOString().replace(/\.000Z$/, 'Z');
}

/**
 * Normalizes ONE driver value, given what its column is.
 *
 * A `Date` with no known kind is returned UNTOUCHED. That is deliberate: this layer exists to stop
 * the engine guessing, and an unidentified temporal is exactly the case where guessing produced
 * corrupted data. Non-temporal values — numbers, bigints, strings (including the exact decimal
 * strings every dialect produces), booleans, nulls — already agree across dialects and pass through.
 */
export function normalizeValue(
  value: unknown,
  kind?: TemporalKind,
  components: DateComponents = 'local',
): unknown {
  // An ARRAY of temporals is normalized element-wise. This is not a new canonical form — it is the
  // form the elements already have, applied one level down, and the recursion carries it through
  // Postgres's multi-dimensional arrays for free. Arrays with no temporal kind are returned as-is
  // rather than rebuilt, so a `text[]` costs nothing.
  if (Array.isArray(value)) {
    return kind === undefined ? value : value.map((el) => normalizeValue(el, kind, components));
  }
  if (!(value instanceof Date)) return value;
  switch (kind) {
    // An instant is absolute, so it is read the same way whatever the driver chose.
    case 'instant':
      return canonicalInstant(value);
    case 'date':
      return canonicalDate(value, components);
    case 'naive':
      return canonicalTimestamp(value, components);
    default:
      return value;
  }
}

/** Normalizes every value in a result row, leaving keys and their order alone. */
export function normalizeRow<T>(
  row: T,
  kinds?: ColumnKinds,
  components: DateComponents = 'local',
): T {
  if (row === null || typeof row !== 'object') return row;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
    out[key] = normalizeValue(value, kinds?.get(key), components);
  }
  return out as T;
}

/**
 * Normalizes every row in a result set.
 *
 * With no `kinds` this leaves temporal values alone by construction — the correct behaviour for a
 * driver that hands back strings rather than `Date`s (SQLite), and the safe behaviour for a query
 * whose metadata the driver did not carry.
 */
export function normalizeRows<T>(
  rows: T[],
  kinds?: ColumnKinds,
  components: DateComponents = 'local',
): T[] {
  return rows.map((row) => normalizeRow(row, kinds, components));
}
