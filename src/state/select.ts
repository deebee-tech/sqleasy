import { BuilderType } from '../enums/builder-type';
import type { QueryState } from './query';

/**
 * Holds state for one SELECT list item (column, subquery, alias, or raw).
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
  /** Raw SQL for this select item when not using structured fields. */
  raw: string | undefined;
};

/** Creates a {@link SelectState} with default field values. */
export const createSelectState = (): SelectState => ({
  builderType: BuilderType.None,
  tableNameOrAlias: undefined,
  columnName: undefined,
  alias: undefined,
  subquery: undefined,
  raw: undefined,
});
