import { BuilderType } from "../enums/builder_type";
import type { SqlEasyState } from "./sqleasy_state";

/**
 * Holds state for one FROM source (table, subquery, or raw).
 * Populated by the builder; exposed via {@link SqlEasyState.fromStates}.
 */
export class FromState {
   /** Which builder variant produced this state. */
   builderType: BuilderType = BuilderType.None;
   /** Schema or database owner qualifier for the table. */
   owner: string | undefined = undefined;
   /** Base table name when this source is a table. */
   tableName: string | undefined = undefined;
   /** Table or subquery alias in the FROM clause. */
   alias: string | undefined = undefined;
   /** Nested query state when this FROM entry is a subquery. */
   sqlEasyState: SqlEasyState | undefined = undefined;
   /** Raw SQL for this FROM fragment when not using structured fields. */
   raw: string | undefined = undefined;
}
