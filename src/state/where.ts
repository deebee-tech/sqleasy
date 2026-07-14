import { BuilderType } from '../enums/builder-type';
import { WhereOperator } from '../enums/where-operator';
import type { QueryState } from './query';

/**
 * Holds state for one WHERE predicate (column op value, subquery, or raw).
 * Populated by the builder; exposed via {@link QueryState.whereStates}.
 */
export type WhereState = {
  /** Which builder variant produced this state. */
  builderType: BuilderType;
  /** Table name or alias qualifying the column. */
  tableNameOrAlias: string | undefined;
  /** Column name in the predicate. */
  columnName: string | undefined;
  /** Comparison or logical operator for this term. */
  whereOperator: WhereOperator;
  /** Raw SQL for this WHERE fragment when not using structured fields. */
  raw: string | undefined;
  /** Nested query state when the RHS is a subquery. */
  subquery: QueryState | undefined;
  /** Bound parameter values for this predicate. */
  values: any[];
};

/** Creates a {@link WhereState} with default field values. */
export const createWhereState = (): WhereState => ({
  builderType: BuilderType.None,
  tableNameOrAlias: undefined,
  columnName: undefined,
  whereOperator: WhereOperator.None,
  raw: undefined,
  subquery: undefined,
  values: [],
});
