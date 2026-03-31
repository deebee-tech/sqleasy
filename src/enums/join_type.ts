/**
 * SQL JOIN kinds: inner, outer variants, cross join, or none.
 */
export enum JoinType {
   /** INNER JOIN. */
   Inner,
   /** LEFT JOIN (synonym for left outer in many dialects). */
   Left,
   /** LEFT OUTER JOIN. */
   LeftOuter,
   /** RIGHT JOIN. */
   Right,
   /** RIGHT OUTER JOIN. */
   RightOuter,
   /** FULL OUTER JOIN. */
   FullOuter,
   /** CROSS JOIN. */
   Cross,
   /** No join type / not applicable. */
   None,
}
