/**
 * Indicates which SQL clause produced a parser error for clearer diagnostics.
 */
export enum ParserArea {
   /** SELECT list or projections. */
   Select = "Select",
   /** FROM clause. */
   From = "From",
   /** JOIN definitions. */
   Join = "Join",
   /** WHERE clause. */
   Where = "Where",
   /** ORDER BY clause. */
   OrderBy = "OrderBy",
   /** LIMIT, OFFSET, FETCH, TOP, etc. */
   LimitOffset = "LimitOffset",
   /** Cross-clause or unspecified area. */
   General = "General",
}
