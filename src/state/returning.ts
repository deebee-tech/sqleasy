/**
 * Holds state for a RETURNING (PG/SQLite) or OUTPUT (MSSQL) clause on INSERT/UPDATE/DELETE.
 * Populated by the builder; exposed via {@link QueryState.returningState}.
 */
export type ReturningState = {
  /** Columns to return, unqualified (dialect-specific prefixing is applied by the parser). */
  columns: string[];
  /** Raw SQL for the returned column list when not using structured fields. */
  raw: string | undefined;
};

/** Creates a {@link ReturningState} with default field values. */
export const createReturningState = (): ReturningState => ({
  columns: [],
  raw: undefined,
});
