import { BuilderType } from '../enums/builder-type';
import type { QueryState } from './query';

/**
 * Holds state for one UNION (or similar) branch: nested query or raw SQL.
 * Populated by the builder; exposed via {@link QueryState.unionStates}.
 */
export type UnionState = {
  /** Which builder variant produced this state. */
  builderType: BuilderType;
  /** State for the branch query when not represented as raw SQL. */
  subquery: QueryState | undefined;
  /** Raw SQL for this compound branch when applicable. */
  raw: string | undefined;
};

/** Creates a {@link UnionState} with default field values. */
export const createUnionState = (): UnionState => ({
  builderType: BuilderType.None,
  subquery: undefined,
  raw: undefined,
});
