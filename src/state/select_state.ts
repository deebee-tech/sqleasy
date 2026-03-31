import { BuilderType } from "../enums/builder_type";
import type { SqlEasyState } from "./sqleasy_state";

/**
 * Holds state for one SELECT list item (column, subquery, alias, or raw).
 * Populated by the builder; exposed via {@link SqlEasyState.selectStates}.
 */
export class SelectState {
   /** Which builder variant produced this state. */
   builderType: BuilderType = BuilderType.None;
   /** Table name or alias qualifying the selected column. */
   tableNameOrAlias: string | undefined = undefined;
   /** Column name or expression identifier. */
   columnName: string | undefined = undefined;
   /** Output alias for this select item. */
   alias: string | undefined = undefined;
   /** Nested query state when this item is a scalar subquery. */
   sqlEasyState: SqlEasyState | undefined = undefined;
   /** Raw SQL for this select item when not using structured fields. */
   raw: string | undefined = undefined;
}
