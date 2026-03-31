import { BuilderType } from "../enums/builder_type";
import { WhereOperator } from "../enums/where_operator";
import type { SqlEasyState } from "./sqleasy_state";

/**
 * Holds state for one WHERE predicate (column op value, subquery, or raw).
 * Populated by the builder; exposed via {@link SqlEasyState.whereStates}.
 */
export class WhereState {
   /** Which builder variant produced this state. */
   builderType: BuilderType = BuilderType.None;
   /** Table name or alias qualifying the column. */
   tableNameOrAlias: string | undefined = undefined;
   /** Column name in the predicate. */
   columnName: string | undefined = undefined;
   /** Comparison or logical operator for this term. */
   whereOperator: WhereOperator = WhereOperator.None;
   /** Raw SQL for this WHERE fragment when not using structured fields. */
   raw: string | undefined = undefined;
   /** Nested query state when the RHS is a subquery. */
   sqlEasyState: SqlEasyState | undefined = undefined;
   /** Bound parameter values for this predicate. */
   values: any[] = [];
}
