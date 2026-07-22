/**
 * The five aggregate functions every dialect spells identically.
 *
 * This is a CALL NODE, not an expression AST. The operand is one column or `*`, with an optional
 * DISTINCT — nothing nests inside it, and nothing composes with it. That boundary is the ruling
 * this surface was built under: SQLEasy models clauses, and `COUNT(x)` is the one function shape
 * common enough that expressing it only through `selectRaw` was costing more than the node costs.
 * `CASE`, `CAST`, `COALESCE` and the scalar-function surface stay out, deliberately.
 *
 * All five are identical text on Postgres, MySQL, SQLite and MSSQL, so there is no engine-native
 * naming split here — measured, along with `DISTINCT` inside each.
 */
export const AggregateFunction = {
  /** `COUNT(x)` — the only one that also accepts `*`. */
  Count: 'Count',
  Sum: 'Sum',
  Avg: 'Avg',
  Min: 'Min',
  Max: 'Max',
} as const;

/** One of the {@link AggregateFunction} values. */
export type AggregateFunction = (typeof AggregateFunction)[keyof typeof AggregateFunction];

/**
 * The operand that means "every row" rather than a column.
 *
 * Spelled as the SQL itself spells it. Only `COUNT` accepts it — `SUM(*)` and `MIN(*)` are
 * "function sum() does not exist" on Postgres, not a parse error, so the refusal has to be ours.
 * It is never quoted: `"*"` is a column literally named `*`.
 */
export const AGGREGATE_STAR = '*';
