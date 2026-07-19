import { BuilderType } from '../enums/builder-type';
import { JoinType } from '../enums/join-type';
import type { JoinOnState } from './join-on';
import type { QueryState } from './query';

/**
 * Holds state for one JOIN (table/subquery, type, and ON clauses).
 * Populated by the builder; exposed via {@link QueryState.joinStates}.
 */
export type JoinState = {
  /** Which builder variant produced this state. */
  builderType: BuilderType;
  /** INNER, LEFT, RIGHT, etc. */
  joinType: JoinType;
  /** Schema or owner for the joined table. */
  owner: string | undefined;
  /** Joined table name. */
  tableName: string | undefined;
  /** Alias for the joined relation. */
  alias: string | undefined;
  /** Nested query state when the join target is a subquery. */
  subquery: QueryState | undefined;
  /** Raw SQL for the join target or full join fragment when applicable. */
  raw: string | undefined;
  /** Ordered ON/AND conditions for this join. */
  joinOnStates: JoinOnState[];
};

/** Creates a {@link JoinState} with default field values. */
export const createJoinState = (): JoinState => ({
  builderType: BuilderType.None,
  joinType: JoinType.Inner,
  owner: undefined,
  tableName: undefined,
  alias: undefined,
  subquery: undefined,
  raw: undefined,
  joinOnStates: [],
});
