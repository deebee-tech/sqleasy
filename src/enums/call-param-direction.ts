/**
 * The calling convention for one {@link QueryBuilder.callProcedure}/{@link
 * QueryBuilder.callFunction} argument. OUT/INOUT are meaningful only for procedures — see {@link
 * QueryBuilder.procParamOut}/{@link QueryBuilder.procParamInOut}.
 */
export const CallParamDirection = {
  /** An input value, bound like any other parameter. */
  In: 'In',
  /** An output-only slot (MSSQL: a declared local variable; MySQL: a session variable). */
  Out: 'Out',
  /** Both an input value and an output slot. */
  InOut: 'InOut',
} as const;

/** One of the {@link CallParamDirection} values. */
export type CallParamDirection = (typeof CallParamDirection)[keyof typeof CallParamDirection];
