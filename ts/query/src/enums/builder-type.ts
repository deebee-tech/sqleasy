/**
 * Internal discriminator for the kind of builder operation stored in a state entry.
 * Used by the query builder to track fragments (FROM, WHERE, JOIN, etc.).
 */
export const BuilderType = {
  /** Logical AND between predicate groups or conditions. */
  And: 'And',
  /** FROM clause sourced from a nested builder/subquery. */
  FromBuilder: 'FromBuilder',
  /** FROM clause referencing a table name. */
  FromTable: 'FromTable',
  /** FROM clause using raw SQL text. */
  FromRaw: 'FromRaw',
  /** FROM table-valued function / set-returning function call. */
  FromFunction: 'FromFunction',
  /** FROM LATERAL derived table. */
  FromLateral: 'FromLateral',
  /** GROUP BY on a column reference. */
  GroupByColumn: 'GroupByColumn',
  /** GROUP BY using raw SQL. */
  GroupByRaw: 'GroupByRaw',
  /** GROUP BY ROLLUP (...). */
  GroupByRollup: 'GroupByRollup',
  /** GROUP BY CUBE (...). */
  GroupByCube: 'GroupByCube',
  /** GROUP BY GROUPING SETS (...). */
  GroupByGroupingSets: 'GroupByGroupingSets',
  /** HAVING condition (standard form). */
  Having: 'Having',
  /** HAVING clause using raw SQL. */
  HavingRaw: 'HavingRaw',
  /** HAVING column BETWEEN low AND high. */
  HavingBetween: 'HavingBetween',
  /** Opens a parenthesized HAVING group. */
  HavingGroupBegin: 'HavingGroupBegin',
  /** Nested HAVING built from a sub-builder. */
  HavingGroupBuilder: 'HavingGroupBuilder',
  /** Closes a parenthesized HAVING group. */
  HavingGroupEnd: 'HavingGroupEnd',
  /** HAVING EXISTS (subquery from builder). */
  HavingExistsBuilder: 'HavingExistsBuilder',
  /** HAVING IN (subquery from builder). */
  HavingInBuilder: 'HavingInBuilder',
  /** HAVING IN (literal value list). */
  HavingInValues: 'HavingInValues',
  /** HAVING NOT EXISTS (subquery from builder). */
  HavingNotExistsBuilder: 'HavingNotExistsBuilder',
  /** HAVING NOT IN (subquery from builder). */
  HavingNotInBuilder: 'HavingNotInBuilder',
  /** HAVING NOT IN (literal value list). */
  HavingNotInValues: 'HavingNotInValues',
  /** HAVING column IS NOT NULL. */
  HavingNotNull: 'HavingNotNull',
  /** HAVING column IS NULL. */
  HavingNull: 'HavingNull',
  /** INSERT values or body as raw SQL. */
  InsertRaw: 'InsertRaw',
  /** JOIN defined via a nested builder. */
  JoinBuilder: 'JoinBuilder',
  /** JOIN ON or clause fragment as raw SQL. */
  JoinRaw: 'JoinRaw',
  /** JOIN targeting a table reference. */
  JoinTable: 'JoinTable',
  /** No operation / placeholder. */
  None: 'None',
  /** Logical OR between predicate groups or conditions. */
  Or: 'Or',
  /** ORDER BY on a column with optional direction. */
  OrderByColumn: 'OrderByColumn',
  /** ORDER BY using raw SQL. */
  OrderByRaw: 'OrderByRaw',
  /** SELECT * (all columns). */
  SelectAll: 'SelectAll',
  /** SELECT list entry from a nested builder/subquery. */
  SelectBuilder: 'SelectBuilder',
  /** SELECT list entry for a single column/expression. */
  SelectColumn: 'SelectColumn',
  /** SELECT list entry as raw SQL. */
  SelectRaw: 'SelectRaw',
  /** SELECT list entry for a window function (`fn(...) OVER (...)`). */
  SelectWindow: 'SelectWindow',
  /** SELECT list JSON path extraction. */
  SelectJsonExtract: 'SelectJsonExtract',
  /** UPDATE SET column assignment. */
  UpdateColumn: 'UpdateColumn',
  /** UPDATE fragment as raw SQL. */
  UpdateRaw: 'UpdateRaw',
  /** UNION set operator (distinct). */
  Union: 'Union',
  /** UNION ALL set operator. */
  UnionAll: 'UnionAll',
  /** INTERSECT set operator. */
  Intersect: 'Intersect',
  /** EXCEPT / MINUS set operator. */
  Except: 'Except',
  /** Common table expression defined via a builder. */
  CteBuilder: 'CteBuilder',
  /** CTE definition as raw SQL. */
  CteRaw: 'CteRaw',
  /** WHERE predicate (standard comparison or helper). */
  Where: 'Where',
  /** WHERE column BETWEEN low AND high. */
  WhereBetween: 'WhereBetween',
  /** Opens a parenthesized WHERE group. */
  WhereGroupBegin: 'WhereGroupBegin',
  /** Nested WHERE built from a sub-builder. */
  WhereGroupBuilder: 'WhereGroupBuilder',
  /** Closes a parenthesized WHERE group. */
  WhereGroupEnd: 'WhereGroupEnd',
  /** WHERE EXISTS (subquery from builder). */
  WhereExistsBuilder: 'WhereExistsBuilder',
  /** WHERE IN (subquery from builder). */
  WhereInBuilder: 'WhereInBuilder',
  /** WHERE IN (literal value list). */
  WhereInValues: 'WhereInValues',
  /** WHERE NOT EXISTS (subquery from builder). */
  WhereNotExistsBuilder: 'WhereNotExistsBuilder',
  /** WHERE NOT IN (subquery from builder). */
  WhereNotInBuilder: 'WhereNotInBuilder',
  /** WHERE NOT IN (literal value list). */
  WhereNotInValues: 'WhereNotInValues',
  /** WHERE column IS NOT NULL. */
  WhereNotNull: 'WhereNotNull',
  /** WHERE column IS NULL. */
  WhereNull: 'WhereNull',
  /** WHERE fragment as raw SQL. */
  WhereRaw: 'WhereRaw',
  /** WHERE JSON path extract comparison. */
  WhereJsonExtract: 'WhereJsonExtract',
  /** WHERE JSON containment (`@>` / `JSON_CONTAINS`). */
  WhereJsonContains: 'WhereJsonContains',
  /** WHERE full-text search predicate. */
  WhereFullText: 'WhereFullText',
  /** HAVING JSON path extract comparison. */
  HavingJsonExtract: 'HavingJsonExtract',
  /** HAVING JSON containment. */
  HavingJsonContains: 'HavingJsonContains',
  /** HAVING full-text search predicate. */
  HavingFullText: 'HavingFullText',
} as const;

/** One of the {@link BuilderType} discriminator values. */
export type BuilderType = (typeof BuilderType)[keyof typeof BuilderType];
