import { BuilderType } from "../enums/builder_type";
import type { SqlEasyState } from "./sqleasy_state";

/**
 * Holds state for a single WITH (CTE) clause entry: name, body, and recursion flag.
 * Populated by the builder; exposed via {@link SqlEasyState.cteStates}.
 */
export class CteState {
   /** Which builder variant produced this state. */
   builderType: BuilderType = BuilderType.None;
   /** CTE name as declared in WITH. */
   name: string = "";
   /** Whether this CTE is declared as RECURSIVE. */
   recursive: boolean = false;
   /** Nested query state for the CTE body, when not using raw SQL. */
   sqlEasyState: SqlEasyState | undefined = undefined;
   /** Raw SQL fragment for the CTE body when bypassing structured state. */
   raw: string | undefined = undefined;
}
