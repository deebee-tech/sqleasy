import { JoinOnOperator } from "../enums/join_on_operator";
import { JoinOperator } from "../enums/join_operator";

/**
 * Holds state for one ON (or AND) join condition between two sides.
 * Populated by the builder; nested under {@link JoinState.joinOnStates}.
 */
export class JoinOnState {
   /** Alias of the left-hand column in the join condition. */
   aliasLeft: string | undefined = undefined;
   /** Left-hand column name. */
   columnLeft: string | undefined = undefined;
   /** Operator relating left and right (e.g. equals). */
   joinOperator: JoinOperator = JoinOperator.Equals;
   /** Alias of the right-hand side (column or literal context). */
   aliasRight: string | undefined = undefined;
   /** Right-hand column name when the RHS is a column. */
   columnRight: string | undefined = undefined;
   /** AND/OR style combinator with the next join-on term. */
   joinOnOperator: JoinOnOperator = JoinOnOperator.None;
   /** Raw SQL for this join condition when not using structured fields. */
   raw: string | undefined = undefined;
   /** Right-hand value when the RHS is a literal or parameter. */
   valueRight: any | undefined = undefined;
}
