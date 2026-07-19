/**
 * Whether a {@link QueryBuilder.callProcedure}/{@link QueryBuilder.callFunction} invocation
 * targets a stored procedure or a stored function — the two are emitted differently on every
 * dialect (a `CALL`/`EXEC` statement vs. an expression usable in a `SELECT`).
 */
export const CallKind = {
  /** A stored procedure, invoked as its own statement (`CALL name(...)` / `EXEC name ...`). */
  Procedure: 'Procedure',
  /** A stored function, invoked as a `SELECT` expression (`SELECT name(...)`). */
  Function: 'Function',
} as const;

/** One of the {@link CallKind} values. */
export type CallKind = (typeof CallKind)[keyof typeof CallKind];
