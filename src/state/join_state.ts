import { BuilderType } from "../enums/builder_type";
import { JoinType } from "../enums/join_type";
import type { JoinOnState } from "./join_on_state";
import type { SqlEasyState } from "./sqleasy_state";

/**
 * Holds state for one JOIN (table/subquery, type, and ON clauses).
 * Populated by the builder; exposed via {@link SqlEasyState.joinStates}.
 */
export class JoinState {
   /** Which builder variant produced this state. */
   builderType: BuilderType = BuilderType.None;
   /** INNER, LEFT, RIGHT, etc. */
   joinType: JoinType = JoinType.Inner;
   /** Schema or owner for the joined table. */
   owner: string | undefined = undefined;
   /** Joined table name. */
   tableName: string | undefined = undefined;
   /** Alias for the joined relation. */
   alias: string | undefined = undefined;
   /** Nested query state when the join target is a subquery. */
   sqlEasyState: SqlEasyState | undefined = undefined;
   /** Raw SQL for the join target or full join fragment when applicable. */
   raw: string | undefined = undefined;
   /** Ordered ON/AND conditions for this join. */
   joinOnStates: JoinOnState[] = [];
}
