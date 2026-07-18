import { UpsertAction } from '../enums/upsert-action';

/**
 * Holds state for an INSERT's conflict clause (PG/SQLite `ON CONFLICT`, MySQL
 * `ON DUPLICATE KEY UPDATE` / `INSERT IGNORE`). Populated by the builder; exposed via
 * {@link QueryState.upsertState}. MSSQL upsert is emitted as `MERGE` by {@link defaultInsert};
 * PG/SQLite/MySQL use their native conflict clauses.
 */
export type UpsertState = {
  /** Which conflict-resolution action to emit. */
  action: UpsertAction;
  /**
   * Columns identifying the conflict target for PG/SQLite `ON CONFLICT (...)`. Ignored on
   * MySQL, which infers the conflicting key from the table's own unique/primary constraints —
   * kept here anyway so the same call shape works across dialects.
   */
  conflictColumns: string[];
  /** SET assignments for the conflict-update action. */
  updateColumns: { columnName: string; value: any }[];
  /** Raw SQL for the conflict-update SET list when not using structured fields. */
  updateRaw: string | undefined;
};

/** Creates an {@link UpsertState} with default field values. */
export const createUpsertState = (): UpsertState => ({
  action: UpsertAction.None,
  conflictColumns: [],
  updateColumns: [],
  updateRaw: undefined,
});
