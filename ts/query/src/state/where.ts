import { BuilderType } from '../enums/builder-type';
import { FullTextMode } from '../enums/full-text-mode';
import { JsonExtractMode } from '../enums/json-extract-mode';
import { WhereOperator } from '../enums/where-operator';
import type { QueryState } from './query';

/** Column reference for a multi-column full-text predicate. */
export type FullTextColumnRef = {
  tableNameOrAlias: string;
  columnName: string;
};

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
  /** JSON path segment or JSONPath string for JSON predicates. */
  jsonPath?: string;
  /** Text vs JSON-object extraction for JSON predicates. */
  jsonExtractMode?: JsonExtractMode;
  /** Full-text match mode. */
  fullTextMode?: FullTextMode;
  /** Columns searched by a full-text predicate. */
  fullTextColumns?: FullTextColumnRef[];
  /**
   * The multi-column LEFT side of a row-value comparison — `(a, b) > (?, ?)` / `(a, b) IN (…)`.
   *
   * Additive: the single-column path keeps using `columnName`/`tableNameOrAlias`, untouched. A
   * row-value predicate uses this list instead, and `values` holds either one tuple (for a scalar
   * comparison) or a list of tuples (for IN). MSSQL has no row constructor in a comparison and is
   * refused — the OR-chain expansion is the emulation this library does not do.
   */
  rowColumns?: { tableNameOrAlias: string; columnName: string }[];
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
  jsonPath: undefined,
  jsonExtractMode: undefined,
  fullTextMode: undefined,
  fullTextColumns: undefined,
});
