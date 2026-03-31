import { BuilderType } from "../enums/builder_type";
import type { SqlEasyState } from "./sqleasy_state";

/**
 * Holds state for one UNION (or similar) branch: nested query or raw SQL.
 * Populated by the builder; exposed via {@link SqlEasyState.unionStates}.
 */
export class UnionState {
   /** Which builder variant produced this state. */
   builderType: BuilderType = BuilderType.None;
   /** State for the branch query when not represented as raw SQL. */
   sqlEasyState: SqlEasyState | undefined = undefined;
   /** Raw SQL for this compound branch when applicable. */
   raw: string | undefined = undefined;
}
