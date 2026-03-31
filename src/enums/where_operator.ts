/**
 * Comparison operators for WHERE and HAVING predicates.
 */
export enum WhereOperator {
   /** Equality (=). */
   Equals,
   /** Inequality (<> or !=). */
   NotEquals,
   /** Strictly greater than (>). */
   GreaterThan,
   /** Greater than or equal (>=). */
   GreaterThanOrEquals,
   /** Strictly less than (<). */
   LessThan,
   /** Less than or equal (<=). */
   LessThanOrEquals,
   /** No operator specified. */
   None,
}
