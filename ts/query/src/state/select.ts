import { BuilderType } from '../enums/builder-type';
import { JsonExtractMode } from '../enums/json-extract-mode';
import type { QueryState } from './query';
import type { WindowState } from './window';

/**
 * Holds state for one SELECT list item (column, subquery, alias, raw, or window function).
 * Populated by the builder; exposed via {@link QueryState.selectStates}.
 */
export type SelectState = {
  /** Which builder variant produced this state. */
  builderType: BuilderType;
  /** Table name or alias qualifying the selected column. */
  tableNameOrAlias: string | undefined;
  /** Column name or expression identifier. */
  columnName: string | undefined;
  /** Output alias for this select item. */
  alias: string | undefined;
  /** Nested query state when this item is a scalar subquery. */
  subquery: QueryState | undefined;
  /**
   * Raw SQL for this select item when not using structured fields. For a `SelectWindow` item,
   * this instead carries the window function's call expression (e.g. `'ROW_NUMBER()'`,
   * `'SUM("o"."amount")'`) — the structured part is the `OVER (...)` clause, in {@link window}.
   */
  raw: string | undefined;
  /** The `OVER (...)` clause for a `SelectWindow` item; unset for every other builder type. */
  window: WindowState | undefined;
  /** JSON path for a `SelectJsonExtract` item. */
  jsonPath?: string;
  /** Text vs JSON-object extraction for a `SelectJsonExtract` item. */
  jsonExtractMode?: JsonExtractMode;
};

/** Creates a {@link SelectState} with default field values. */
export const createSelectState = (): SelectState => ({
  builderType: BuilderType.None,
  tableNameOrAlias: undefined,
  columnName: undefined,
  alias: undefined,
  subquery: undefined,
  raw: undefined,
  window: undefined,
  jsonPath: undefined,
  jsonExtractMode: undefined,
});
