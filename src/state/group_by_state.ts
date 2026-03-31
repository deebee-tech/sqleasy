import { BuilderType } from "../enums/builder_type";

/**
 * Holds state for one GROUP BY expression (column or raw).
 * Populated by the builder; exposed via {@link SqlEasyState.groupByStates}.
 */
export class GroupByState {
   /** Which builder variant produced this state. */
   builderType: BuilderType = BuilderType.None;
   /** Table name or alias qualifying the grouped column. */
   tableNameOrAlias: string | undefined = undefined;
   /** Column name being grouped. */
   columnName: string | undefined = undefined;
   /** Raw SQL for this GROUP BY term when not using structured fields. */
   raw: string | undefined = undefined;
}
