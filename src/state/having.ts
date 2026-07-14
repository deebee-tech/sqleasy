import { BuilderType } from '../enums/builder-type';
import { WhereOperator } from '../enums/where-operator';

/**
 * Holds state for one HAVING predicate (similar shape to WHERE).
 * Populated by the builder; exposed via {@link QueryState.havingStates}.
 */
export type HavingState = {
  /** Which builder variant produced this state. */
  builderType: BuilderType;
  /** Table name or alias qualifying the column in the predicate. */
  tableNameOrAlias: string | undefined;
  /** Column name in the HAVING expression. */
  columnName: string | undefined;
  /** Comparison or logical operator for this HAVING term. */
  whereOperator: WhereOperator;
  /** Raw SQL for this HAVING fragment when not using structured fields. */
  raw: string | undefined;
  /** Bound parameter values associated with this predicate. */
  values: any[];
};

/** Creates a {@link HavingState} with default field values. */
export const createHavingState = (): HavingState => ({
  builderType: BuilderType.None,
  tableNameOrAlias: undefined,
  columnName: undefined,
  whereOperator: WhereOperator.None,
  raw: undefined,
  values: [],
});
