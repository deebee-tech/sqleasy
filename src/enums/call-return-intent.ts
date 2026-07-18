/**
 * What a {@link QueryBuilder.callFunction} call is expected to return, which decides whether
 * Postgres/MSSQL wrap the invocation in `SELECT expr` (a single scalar) or `SELECT * FROM expr`
 * (a set-returning / table-valued function). MySQL has no table-valued functions and refuses
 * {@link ResultSet}.
 */
export const CallReturnIntent = {
  /** No return value. Only meaningful for procedures — never valid for {@link QueryBuilder.callFunction}. */
  Void: 'Void',
  /** A single scalar value: `SELECT name(...)`. */
  Scalar: 'Scalar',
  /** A set-returning / table-valued function: `SELECT * FROM name(...)`. */
  ResultSet: 'ResultSet',
} as const;

/** One of the {@link CallReturnIntent} values. */
export type CallReturnIntent = (typeof CallReturnIntent)[keyof typeof CallReturnIntent];
