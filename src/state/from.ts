import { BuilderType } from '../enums/builder-type';
import type { QueryState } from './query';

/**
 * Holds state for one FROM source (table, subquery, or raw).
 * Populated by the builder; exposed via {@link QueryState.fromStates}.
 */
export type FromState = {
  /** Which builder variant produced this state. */
  builderType: BuilderType;
  /** Schema or database owner qualifier for the table. */
  owner: string | undefined;
  /** Base table name when this source is a table. */
  tableName: string | undefined;
  /** Table or subquery alias in the FROM clause. */
  alias: string | undefined;
  /** Nested query state when this FROM entry is a subquery. */
  subquery: QueryState | undefined;
  /** Raw SQL for this FROM fragment when not using structured fields. */
  raw: string | undefined;
};

/** Creates a {@link FromState} with default field values. */
export const createFromState = (): FromState => ({
  builderType: BuilderType.None,
  owner: undefined,
  tableName: undefined,
  alias: undefined,
  subquery: undefined,
  raw: undefined,
});
