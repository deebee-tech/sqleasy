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
} as const;

/** One of the {@link WhereOperator} comparison values. */
export type WhereOperator = (typeof WhereOperator)[keyof typeof WhereOperator];
