/**
 * High-level SQL statement kind the builder is assembling.
 */
export enum QueryType {
   /** SELECT query. */
   Select,
   /** INSERT statement. */
   Insert,
   /** UPDATE statement. */
   Update,
   /** DELETE statement. */
   Delete,
}
