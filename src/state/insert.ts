import type { QueryState } from './query';

/**
 * Holds state for an INSERT: target table, columns, and either row value sets or a SELECT
 * source. Populated by the builder; exposed via {@link QueryState.insertState}.
 */
export type InsertState = {
  /** Schema or database owner qualifier for the target table. */
  owner: string | undefined;
  /** Target table name. */
  tableName: string | undefined;
  /** Column names for the INSERT column list. */
  columns: string[];
  /** One inner array per row; values align with {@link InsertState.columns}. Mutually exclusive with {@link selectSubquery}. */
  values: any[][];
  /**
   * `INSERT ... SELECT` source query, when set instead of {@link values}. Mutually exclusive
   * with `values` — a builder that sets both throws at parse time.
   */
  selectSubquery: QueryState | undefined;
  /** Raw SQL for the INSERT when not fully represented by structured fields. */
  raw: string | undefined;
};

/** Creates an {@link InsertState} with default field values. */
export const createInsertState = (): InsertState => ({
  owner: undefined,
  tableName: undefined,
  columns: [],
  values: [],
  selectSubquery: undefined,
  raw: undefined,
});
