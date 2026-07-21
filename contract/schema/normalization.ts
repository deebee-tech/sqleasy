/**
 * Corpus C — RESULT NORMALIZATION: the canonical shape a row must have, whatever engine produced it.
 *
 * Corpus A pins what SQL the builder EMITS. This pins what the engine HANDS BACK after running it.
 * The 2026-07-19 audit found the engine did no normalization at all, so one logical value came back
 * four different ways; this corpus is where "byte-for-byte parity is the product" is enforced for
 * results.
 *
 * Cases run against the shared docker harness (`pnpm harness:up`, seeded from `harness/seed/`), so
 * the DATA is fixed and known — a golden here is a statement about the canonical form, not a
 * recording of whatever an implementation happened to return.
 *
 * ── THE CANONICAL FORMS (settled 2026-07-20, each by measurement then decision) ──
 *   • decimal   — an exact STRING. Postgres and MySQL already do this; SQLite reaches it because the
 *                 seed stores decimals as TEXT (it has no fixed-point type, so a NUMERIC column would
 *                 lose the value at rest). No rounding, anywhere.
 *   • timestamp — ISO-8601 with NO timezone designator. These columns carry no zone, so the `Z` the
 *                 Postgres driver appends asserts something the column never stored.
 *   • integer   — a 64-bit int, exact. The corpus encodes it as DIGITS IN A STRING because JSON
 *                 numbers cannot carry 64 bits losslessly — `9007199254740993` (2^53+1) is in this
 *                 very corpus and a JSON parser would silently round it to ...992.
 *   • null      — a PRESENT column whose value is null, never an absent key.
 */

import type { Dialect, InputValue } from './corpus';

/**
 * One value in a normalized result row, tagged with its canonical type.
 *
 * Tagged for the same reason corpus A tags its inputs: JSON cannot distinguish types the target
 * languages can. An untagged `1` gives no way to say whether the contract demands an int or a bool,
 * and an untagged `19.99` would smuggle a float in where an exact decimal string is required.
 */
export type ResultValue =
  | { t: 'null' }
  /** Text, AND the canonical form of decimals and timestamps. */
  | { t: 'string'; v: string }
  /** Decimal digits — see the note above on why this is a string and not a JSON number. */
  | { t: 'int'; v: string }
  /** A genuine floating-point column. Deliberately rare: money is a decimal, and decimals are strings. */
  | { t: 'double'; v: number }
  | { t: 'bool'; v: boolean };

/** A normalized result set: column order is part of the contract, not incidental. */
export type ResultSet = {
  columns: string[];
  rows: ResultValue[][];
  /** Rows returned (SELECT) or affected (INSERT/UPDATE/DELETE). */
  rowCount: number;
};

export type NormalizationCase = {
  name: string;
  /** Why this case exists, when it is not obvious. */
  note?: string;
  /**
   * The statement to run, per dialect.
   *
   * Unlike corpus A the SQL here is hand-written, because this corpus is not testing the builder —
   * it is testing what comes BACK. The text differs per dialect only in placeholder style and
   * quoting; the rows it selects are identical.
   */
  sql: Partial<Record<Dialect, string>>;
  /** Bound parameters, shared across dialects. */
  params?: InputValue[];
  /** Defaults to all four. */
  dialects?: Dialect[];
  /** The canonical result EVERY dialect must produce — unless `overrides` says otherwise. */
  expect: ResultSet;
  /**
   * Where the engines HONESTLY differ, recorded rather than papered over.
   *
   * There is exactly one such axis today: SQLite has no boolean type, so a BOOLEAN column comes back
   * as `1`/`0` while Postgres and MySQL return a real bool — and SQLite's driver does not expose a
   * result column's declared type, so nothing can tell "this int is a boolean" from "this int is a
   * count". Forcing SQLite to fake a bool would be a lie; forcing Postgres down to 1/0 to match it
   * would level a richer engine down to the weakest. Neither is acceptable, so the divergence is the
   * truth and it is written down.
   */
  overrides?: Partial<Record<Dialect, Partial<ResultSet>>>;
};

export type NormalizationCorpus = {
  /** The SQLEasy version these goldens were authored against. */
  version: string;
  cases: NormalizationCase[];
};
