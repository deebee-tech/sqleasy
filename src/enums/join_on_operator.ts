/**
 * Classifies each entry in a JOIN ON condition list (column compare, grouping, logic).
 */
export enum JoinOnOperator {
   /** Opens a parenthesized ON predicate group. */
   GroupBegin,
   /** Closes a parenthesized ON predicate group. */
   GroupEnd,
   /** Standard ON left op right comparison. */
   On,
   /** ON fragment as raw SQL. */
   Raw,
   /** ON right-hand value or bound parameter. */
   Value,
   /** Logical AND between ON parts. */
   And,
   /** Logical OR between ON parts. */
   Or,
   /** No operator / unused slot. */
   None,
}
