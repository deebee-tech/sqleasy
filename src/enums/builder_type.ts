/**
 * Internal discriminator for the kind of builder operation stored in a state entry.
 * Used by the query builder to track fragments (FROM, WHERE, JOIN, etc.).
 */
export enum BuilderType {
   /** Logical AND between predicate groups or conditions. */
   And,
   /** FROM clause sourced from a nested builder/subquery. */
   FromBuilder,
   /** FROM clause referencing a table name. */
   FromTable,
   /** FROM clause using raw SQL text. */
   FromRaw,
   /** GROUP BY on a column reference. */
   GroupByColumn,
   /** GROUP BY using raw SQL. */
   GroupByRaw,
   /** HAVING condition (standard form). */
   Having,
   /** HAVING clause using raw SQL. */
   HavingRaw,
   /** INSERT INTO table/columns entry. */
   InsertInto,
   /** INSERT values or body as raw SQL. */
   InsertRaw,
   /** JOIN defined via a nested builder. */
   JoinBuilder,
   /** JOIN ON or clause fragment as raw SQL. */
   JoinRaw,
   /** JOIN targeting a table reference. */
   JoinTable,
   /** No operation / placeholder. */
   None,
   /** Logical OR between predicate groups or conditions. */
   Or,
   /** ORDER BY on a column with optional direction. */
   OrderByColumn,
   /** ORDER BY using raw SQL. */
   OrderByRaw,
   /** SELECT * (all columns). */
   SelectAll,
   /** SELECT list entry from a nested builder/subquery. */
   SelectBuilder,
   /** SELECT list entry for a single column/expression. */
   SelectColumn,
   /** SELECT list entry as raw SQL. */
   SelectRaw,
   /** UPDATE target table. */
   UpdateTable,
   /** UPDATE SET column assignment. */
   UpdateColumn,
   /** UPDATE fragment as raw SQL. */
   UpdateRaw,
   /** DELETE FROM table. */
   DeleteFrom,
   /** UNION set operator (distinct). */
   Union,
   /** UNION ALL set operator. */
   UnionAll,
   /** INTERSECT set operator. */
   Intersect,
   /** EXCEPT / MINUS set operator. */
   Except,
   /** Common table expression defined via a builder. */
   CteBuilder,
   /** CTE definition as raw SQL. */
   CteRaw,
   /** WHERE predicate (standard comparison or helper). */
   Where,
   /** WHERE column BETWEEN low AND high. */
   WhereBetween,
   /** Opens a parenthesized WHERE group. */
   WhereGroupBegin,
   /** Nested WHERE built from a sub-builder. */
   WhereGroupBuilder,
   /** Closes a parenthesized WHERE group. */
   WhereGroupEnd,
   /** WHERE EXISTS (subquery from builder). */
   WhereExistsBuilder,
   /** WHERE IN (subquery from builder). */
   WhereInBuilder,
   /** WHERE IN (literal value list). */
   WhereInValues,
   /** WHERE NOT EXISTS (subquery from builder). */
   WhereNotExistsBuilder,
   /** WHERE NOT IN (subquery from builder). */
   WhereNotInBuilder,
   /** WHERE NOT IN (literal value list). */
   WhereNotInValues,
   /** WHERE column IS NOT NULL. */
   WhereNotNull,
   /** WHERE column IS NULL. */
   WhereNull,
   /** WHERE fragment as raw SQL. */
   WhereRaw,
}
