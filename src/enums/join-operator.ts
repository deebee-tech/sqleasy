/**
 * Comparison operators used in JOIN ON conditions (e.g. tableA.id = tableB.id).
 */
export const JoinOperator = {
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
} as const;

/** One of the {@link JoinOperator} comparison values. */
export type JoinOperator = (typeof JoinOperator)[keyof typeof JoinOperator];
