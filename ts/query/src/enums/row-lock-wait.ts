/**
 * Wait behavior for a {@link RowLockMode}, when the requested rows are already locked.
 */
export const RowLockWait = {
  /** Block until the lock is available (the dialect's default wait behavior). */
  Default: 'Default',
  /** Fail immediately instead of waiting (`NOWAIT`). */
  Nowait: 'Nowait',
  /** Silently skip already-locked rows instead of waiting (`SKIP LOCKED`, MSSQL `READPAST`). */
  SkipLocked: 'SkipLocked',
} as const;

/** One of the {@link RowLockWait} values. */
export type RowLockWait = (typeof RowLockWait)[keyof typeof RowLockWait];
