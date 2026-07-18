/**
 * Comparison operators for WHERE and HAVING predicates.
 */
export const WhereOperator = {
  /** Equality (=). */
  Equals: 'Equals',
  /** Inequality (<> or !=). */
  NotEquals: 'NotEquals',
  /** Strictly greater than (>). */
  GreaterThan: 'GreaterThan',
  /** Greater than or equal (>=). */
  GreaterThanOrEquals: 'GreaterThanOrEquals',
  /** Strictly less than (<). */
  LessThan: 'LessThan',
  /** Less than or equal (<=). */
  LessThanOrEquals: 'LessThanOrEquals',
  /** No operator specified. */
  None: 'None',
  /** Pattern match (LIKE) — the bound value carries any `%`/`_` wildcards. */
  Like: 'Like',
  /** Negated pattern match (NOT LIKE). */
  NotLike: 'NotLike',
  /**
   * Case-insensitive pattern match. Native `ILIKE` on Postgres; on MySQL, SQLite, and MSSQL
   * (none of which have `ILIKE`) it is rewritten to `LOWER(col) LIKE LOWER(?)`.
   */
  Ilike: 'Ilike',
  /** Negated case-insensitive pattern match — see {@link WhereOperator.Ilike}. */
  NotIlike: 'NotIlike',
  /**
   * Null-safe inequality: true unless both sides are equal, treating two `NULL`s as equal
   * (unlike `<>`, which is `NULL` — never true — whenever either side is `NULL`). Native `IS
   * DISTINCT FROM` on Postgres/SQLite; MySQL rewrites to `NOT (a <=> b)`; MSSQL has no
   * equivalent and throws.
   */
  IsDistinctFrom: 'IsDistinctFrom',
  /**
   * Null-safe equality: true when both sides are equal OR both are `NULL` (unlike `=`, which is
   * `NULL` whenever either side is `NULL`). Native `IS NOT DISTINCT FROM` on Postgres/SQLite;
   * MySQL rewrites to its native `<=>` operator; MSSQL has no equivalent and throws.
   */
  IsNotDistinctFrom: 'IsNotDistinctFrom',
} as const;

/** One of the {@link WhereOperator} comparison values. */
export type WhereOperator = (typeof WhereOperator)[keyof typeof WhereOperator];
