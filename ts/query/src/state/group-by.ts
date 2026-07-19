import { BuilderType } from '../enums/builder-type';

/** One column reference inside a GROUP BY modifier (`ROLLUP`/`CUBE`/`GROUPING SETS`). */
export type GroupByColumnRef = {
  tableNameOrAlias: string;
  columnName: string;
};

/**
 * Holds state for one GROUP BY expression (column, raw, or modifier).
 * Populated by the builder; exposed via {@link QueryState.groupByStates}.
 */
export type GroupByState = {
  /** Which builder variant produced this state. */
  builderType: BuilderType;
  /** Table name or alias qualifying the grouped column. */
  tableNameOrAlias: string | undefined;
  /** Column name being grouped. */
  columnName: string | undefined;
  /** Raw SQL for this GROUP BY term when not using structured fields. */
  raw: string | undefined;
  /** Column sets for {@link BuilderType.GroupByGroupingSets}. */
  groupingSets?: GroupByColumnRef[][];
};

/** Creates a {@link GroupByState} with default field values. */
export const createGroupByState = (): GroupByState => ({
  builderType: BuilderType.None,
  tableNameOrAlias: undefined,
  columnName: undefined,
  raw: undefined,
  groupingSets: undefined,
});
