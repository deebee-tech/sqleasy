import { BuilderType } from '../enums/builder-type';

/**
 * Holds state for one UPDATE SET assignment (column and value or raw).
 * Populated by the builder; exposed via {@link QueryState.updateStates}.
 */
export type UpdateState = {
  /** Which builder variant produced this state. */
  builderType: BuilderType;
  /** Target column name being updated. */
  columnName: string | undefined;
  /** New value or parameter placeholder binding. */
  value: any;
  /** Raw SQL for this SET fragment when not using structured fields. */
  raw: string | undefined;
};

/** Creates an {@link UpdateState} with default field values. */
export const createUpdateState = (): UpdateState => ({
  builderType: BuilderType.None,
  columnName: undefined,
  value: undefined,
  raw: undefined,
});
