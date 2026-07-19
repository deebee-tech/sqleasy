/**
 * The row-locking mode requested for a SELECT (`FOR UPDATE` / `FOR SHARE` and MSSQL's
 * table-hint equivalents).
 */
export const RowLockMode = {
  /** No row lock requested. */
  None: 'None',
  /** Exclusive row lock — blocks other writers (`FOR UPDATE`, MSSQL `WITH (UPDLOCK, ROWLOCK)`). */
  ForUpdate: 'ForUpdate',
  /** Shared row lock — blocks writers, allows other readers (`FOR SHARE`, MSSQL `WITH (HOLDLOCK, ROWLOCK)`). */
  ForShare: 'ForShare',
} as const;

/** One of the {@link RowLockMode} values. */
export type RowLockMode = (typeof RowLockMode)[keyof typeof RowLockMode];
