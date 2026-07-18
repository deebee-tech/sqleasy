import { BuilderType } from '../enums/builder-type';
import { FullTextMode } from '../enums/full-text-mode';
import { JsonExtractMode } from '../enums/json-extract-mode';
import { WhereOperator } from '../enums/where-operator';
import type { QueryState } from './query';
import type { FullTextColumnRef } from './where';

/**
 * Holds state for one HAVING predicate (same shape as WHERE, including subqueries).
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
  /** Nested query state when the RHS is a subquery (IN/EXISTS/group). */
  subquery: QueryState | undefined;
  /** Bound parameter values associated with this predicate. */
  values: any[];
  jsonPath?: string;
  jsonExtractMode?: JsonExtractMode;
  fullTextMode?: FullTextMode;
  fullTextColumns?: FullTextColumnRef[];
};

/** Creates a {@link HavingState} with default field values. */
export const createHavingState = (): HavingState => ({
  builderType: BuilderType.None,
  tableNameOrAlias: undefined,
  columnName: undefined,
  whereOperator: WhereOperator.None,
  raw: undefined,
  subquery: undefined,
  values: [],
  jsonPath: undefined,
  jsonExtractMode: undefined,
  fullTextMode: undefined,
  fullTextColumns: undefined,
});
