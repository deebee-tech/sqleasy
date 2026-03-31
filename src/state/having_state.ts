import { BuilderType } from "../enums/builder_type";
import { WhereOperator } from "../enums/where_operator";

/**
 * Holds state for one HAVING predicate (similar shape to WHERE).
 * Populated by the builder; exposed via {@link SqlEasyState.havingStates}.
 */
export class HavingState {
   /** Which builder variant produced this state. */
   builderType: BuilderType = BuilderType.None;
   /** Table name or alias qualifying the column in the predicate. */
   tableNameOrAlias: string | undefined = undefined;
   /** Column name in the HAVING expression. */
   columnName: string | undefined = undefined;
   /** Comparison or logical operator for this HAVING term. */
   whereOperator: WhereOperator = WhereOperator.None;
   /** Raw SQL for this HAVING fragment when not using structured fields. */
   raw: string | undefined = undefined;
   /** Bound parameter values associated with this predicate. */
   values: any[] = [];
}
