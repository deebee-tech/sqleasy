import { RowLockMode } from '../enums/row-lock-mode';
import { RowLockWait } from '../enums/row-lock-wait';

/**
 * Holds state for a SELECT's row-locking clause (`FOR UPDATE`/`FOR SHARE`, or MSSQL's
 * `WITH (...)` table-hint equivalent). Populated by the builder; exposed via
 * {@link QueryState.rowLock}.
 */
export type RowLockState = {
  /** Which lock strength to request. */
  mode: RowLockMode;
  /** How to behave when the requested rows are already locked. */
  wait: RowLockWait;
};

/** Creates a {@link RowLockState} with default field values. */
export const createRowLockState = (): RowLockState => ({
  mode: RowLockMode.None,
  wait: RowLockWait.Default,
});
