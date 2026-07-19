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
   * Literal substring match — `LIKE %value% ESCAPE …` with the LIKE metacharacters (`%`, `_`, and
   * MSSQL's `[`) in the bound value ESCAPED, so a search for `50%` matches the literal string, not
   * "anything starting 50". The value is the raw text to find; the wildcards are added here. Unlike
   * {@link Like}, the caller does NOT supply wildcards.
   */
  Contains: 'Contains',
  /** Negated literal substring match (`NOT LIKE %value%`, escaped) — see {@link Contains}. */
  NotContains: 'NotContains',
  /** Literal prefix match (`LIKE value% ESCAPE …`, escaped) — see {@link Contains}. */
  StartsWith: 'StartsWith',
  /** Literal suffix match (`LIKE %value ESCAPE …`, escaped) — see {@link Contains}. */
  EndsWith: 'EndsWith',
  /**
   * Case-insensitive pattern match. Native `ILIKE` on Postgres; on MySQL, SQLite, and MSSQL
   * (none of which have `ILIKE`) it is rewritten to `LOWER(col) LIKE LOWER(?)`.
   */
  Ilike: 'Ilike',
  /** Negated case-insensitive pattern match — see {@link WhereOperator.Ilike}. */
  NotIlike: 'NotIlike',
  /**
   * Regular-expression match. Native `~` on Postgres and `REGEXP` on MySQL (where case sensitivity is
   * collation-driven — the default utf8mb4 collation is case-insensitive). SQLite (`REGEXP` needs an
   * app-registered function) and MSSQL (no regex engine before SQL Server 2025) have no built-in
   * operator and THROW. The bound value is the pattern.
   */
  Regex: 'Regex',
  /** Negated regular-expression match — see {@link Regex}. */
  NotRegex: 'NotRegex',
  /** Case-insensitive regular-expression match. Native `~*` on Postgres; on MySQL it is the same as
   * {@link Regex} (case sensitivity is collation-driven, not operator-driven). SQLite/MSSQL throw. */
  Iregex: 'Iregex',
  /** Negated case-insensitive regular-expression match — see {@link Iregex}. */
  NotIregex: 'NotIregex',
  /**
   * Null-safe inequality: true unless both sides are equal, treating two `NULL`s as equal
   * (unlike `<>`, which is `NULL` — never true — whenever either side is `NULL`). Native `IS
   * DISTINCT FROM` on Postgres/SQLite; MySQL rewrites to `NOT (a <=> b)`; MSSQL (no native
   * operator) rewrites to `(col <> value OR col IS NULL)`, or `col IS NOT NULL` for a NULL value.
   */
  IsDistinctFrom: 'IsDistinctFrom',
  /**
   * Null-safe equality: true when both sides are equal OR both are `NULL` (unlike `=`, which is
   * `NULL` whenever either side is `NULL`). Native `IS NOT DISTINCT FROM` on Postgres/SQLite;
   * MySQL rewrites to its native `<=>` operator; MSSQL (no native operator) rewrites to `col =
   * value`, or `col IS NULL` for a NULL value — sound because the compared value is always a bound literal.
   */
  IsNotDistinctFrom: 'IsNotDistinctFrom',
} as const;

/** One of the {@link WhereOperator} comparison values. */
export type WhereOperator = (typeof WhereOperator)[keyof typeof WhereOperator];
