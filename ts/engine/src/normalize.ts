/**
 * Result-row normalization — turning each driver's native value into ONE canonical form, so the same
 * logical row reads identically on every dialect AND in every language port.
 *
 * The 2026-07-19 audit found the engine performed no normalization at all, so one logical value came
 * back four different ways. Corpus C (`contract/corpora/normalization/corpus.json`) is the contract
 * this satisfies; the Dart port implements the same forms in `dart/engine/lib/src/normalize.dart`.
 *
 * It is deliberately CONSERVATIVE: it converts only what it can identify from the value's own type or
 * from the driver's column metadata. It never guesses from a string's shape — a `note` column holding
 * "2024-04-01" is text a user wrote, not a timestamp, and rewriting it would corrupt data to make a
 * table look tidy.
 */

/** A timestamp whose sub-second part is all zeroes, so a whole second is written plainly. */
const ZERO_FRACTION = /\.0+$/;

const pad = (value: number, width = 2): string => String(value).padStart(width, '0');

/**
 * The canonical text for a temporal value: **ISO-8601, with NO timezone designator.**
 *
 * The columns this engine reads (`TIMESTAMP`, `DATETIME`, `DATETIME2`) carry no timezone, but every
 * driver here hands back a `Date`, which is an instant. `toISOString()` would then convert that
 * instant to UTC and append a `Z` — turning "10:00, no zone" into "14:00Z" on a machine in EDT, and
 * into something else again on a machine elsewhere. Both the shift and the `Z` assert something the
 * column never stored.
 *
 * The drivers build that `Date` by reading the stored wall clock in the LOCAL zone, so the local
 * components are exactly the digits the database holds. Those are what get written, which also makes
 * the result independent of the machine's `TZ`.
 *
 * A value that genuinely carries an offset belongs in a `TIMESTAMPTZ`-shaped column — a different
 * capability, with its own canonical form. It is not folded in here.
 */
export function canonicalTimestamp(value: Date): string {
  const date = `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  const time = `${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
  const fraction = value.getMilliseconds() === 0 ? '' : `.${pad(value.getMilliseconds(), 3)}`;
  return `${date}T${time}${fraction}`.replace(ZERO_FRACTION, '');
}

/**
 * Normalizes ONE driver value by its own JavaScript type.
 *
 * Only `Date` is rewritten here, because it is the one type whose identity is unambiguous AND whose
 * rendering disagrees across drivers. Numbers, bigints, strings (including the exact decimal strings
 * every dialect produces), booleans and nulls already agree and pass through untouched.
 *
 * Values whose canonical form depends on the COLUMN rather than the value — a 64-bit integer that a
 * driver hands back as a string, indistinguishable from a decimal — are converted by the dialect
 * executor from its own column metadata, which is the only place that information exists.
 */
export function normalizeValue(value: unknown): unknown {
  return value instanceof Date ? canonicalTimestamp(value) : value;
}

/** Normalizes every value in a result row, leaving keys and their order alone. */
export function normalizeRow<T>(row: T): T {
  if (row === null || typeof row !== 'object') return row;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
    out[key] = normalizeValue(value);
  }
  return out as T;
}

/** Normalizes every row in a result set. */
export function normalizeRows<T>(rows: T[]): T[] {
  return rows.map((row) => normalizeRow(row));
}
