/**
 * Holds state for an INSERT: target table, columns, and row value sets.
 * Populated by the builder; exposed via {@link QueryState.insertState}.
 */
export type InsertState = {
  /** Schema or database owner qualifier for the target table. */
  owner: string | undefined;
  /** Target table name. */
  tableName: string | undefined;
  /** Column names for the INSERT column list. */
  columns: string[];
  /** One inner array per row; values align with {@link InsertState.columns}. */
  values: any[][];
  /** Raw SQL for the INSERT when not fully represented by structured fields. */
  raw: string | undefined;
};

/** Creates an {@link InsertState} with default field values. */
export const createInsertState = (): InsertState => ({
  owner: undefined,
  tableName: undefined,
  columns: [],
  values: [],
  raw: undefined,
});
