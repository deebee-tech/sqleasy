import { BuilderType } from "../enums/builder_type";

/**
 * Holds state for one UPDATE SET assignment (column and value or raw).
 * Populated by the builder; exposed via {@link SqlEasyState.updateStates}.
 */
export class UpdateState {
   /** Which builder variant produced this state. */
   builderType: BuilderType = BuilderType.None;
   /** Target column name being updated. */
   columnName: string | undefined = undefined;
   /** New value or parameter placeholder binding. */
   value: any = undefined;
   /** Raw SQL for this SET fragment when not using structured fields. */
   raw: string | undefined = undefined;
}
