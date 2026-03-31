/**
 * Comparison operators used in JOIN ON conditions (e.g. tableA.id = tableB.id).
 */
export enum JoinOperator {
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
