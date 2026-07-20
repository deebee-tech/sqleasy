/**
 * High-level SQL statement kind the builder is assembling.
 */
export const QueryType = {
  /** SELECT query. */
  Select: 'Select',
  /** INSERT statement. */
  Insert: 'Insert',
  /** UPDATE statement. */
  Update: 'Update',
  /** DELETE statement. */
  Delete: 'Delete',
  /** Stored procedure/function invocation (`CALL`/`EXEC`/`SELECT func(...)`). */
  Call: 'Call',
  /** `MERGE` statement — native T-SQL only. */
  Merge: 'Merge',
} as const;

/** One of the {@link QueryType} statement kinds. */
export type QueryType = (typeof QueryType)[keyof typeof QueryType];
