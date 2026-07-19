import { HintKind } from '../enums/hint-kind';

/**
 * One structured or raw query hint. Populated by the builder; exposed via
 * {@link QueryState.hintStates}.
 */
export type HintState = {
  /** Which hint shape to emit. */
  kind: HintKind;
  /** Table name or alias the index hint applies to (MySQL index hints). */
  tableNameOrAlias: string | undefined;
  /** Index name for `USE INDEX` / `FORCE INDEX`. */
  indexName: string | undefined;
  /** Option text for MSSQL `OPTION (...)` (without the wrapping `OPTION`). */
  optionText: string | undefined;
  /** Raw hint SQL when {@link kind} is {@link HintKind.Raw}. */
  raw: string | undefined;
};

/** Creates a {@link HintState} with default field values. */
export const createHintState = (): HintState => ({
  kind: HintKind.Raw,
  tableNameOrAlias: undefined,
  indexName: undefined,
  optionText: undefined,
  raw: undefined,
});
