//#region src/configuration/configuration_delimiters.d.ts
/** Pair of delimiter strings for quoting identifiers or framing transaction blocks. */
declare class ConfigurationDelimiters {
  /** Opening delimiter (e.g. `[`, `` ` ``, or `"`). */
  begin: string;
  /** Closing delimiter matching {@link ConfigurationDelimiters.begin}. */
  end: string;
}
//#endregion
//#region src/configuration/runtime_configuration.d.ts
/** Options passed when creating SqlEasy instances or builders. */
declare class RuntimeConfiguration {
  /** Maximum number of rows to return from queries; defaults to 1000. */
  maxRowsReturned: number;
  /** Optional host-defined settings carried alongside runtime options. */
  customConfiguration: any | undefined;
}
//#endregion
//#region src/enums/database_type.d.ts
/**
 * Identifies the target SQL database dialect for generation and quoting behavior.
 */
declare enum DatabaseType {
  /** Microsoft SQL Server. */
  Mssql = 0,
  /** PostgreSQL. */
  Postgres = 1,
  /** MySQL or compatible (e.g. MariaDB). */
  Mysql = 2,
  /** SQLite. */
  Sqlite = 3,
  /** Dialect not set or unrecognized. */
  Unknown = 4
}
//#endregion
//#region src/configuration/interface_configuration.d.ts
/**
 * Dialect-specific configuration that controls how SQL is generated.
 *
 * Each database dialect provides its own implementation with appropriate
 * identifier quoting, placeholder styles, default schemas, and transaction syntax.
 */
interface IConfiguration {
  /** Returns the {@link DatabaseType} enum value identifying this dialect. */
  databaseType(): DatabaseType;
  /** Returns the default schema/owner name (e.g. `"dbo"` for MSSQL, `"public"` for Postgres). */
  defaultOwner(): string;
  /** Returns the delimiters used to quote identifiers (e.g. `[`/`]` for MSSQL, `"`/`"` for Postgres). */
  identifierDelimiters(): ConfigurationDelimiters;
  /** Returns the placeholder character used in prepared statements (e.g. `"?"` or `"$"`). */
  preparedStatementPlaceholder(): string;
  /** Returns the current {@link RuntimeConfiguration} for this instance. */
  runtimeConfiguration(): RuntimeConfiguration;
  /** Returns the delimiter used to quote string literals (typically `'`). */
  stringDelimiter(): string;
  /** Returns the delimiters used to wrap transaction blocks (e.g. `BEGIN`/`COMMIT`). */
  transactionDelimiters(): ConfigurationDelimiters;
}
//#endregion
//#region src/enums/join_type.d.ts
/**
 * SQL JOIN kinds: inner, outer variants, cross join, or none.
 */
declare enum JoinType {
  /** INNER JOIN. */
  Inner = 0,
  /** LEFT JOIN (synonym for left outer in many dialects). */
  Left = 1,
  /** LEFT OUTER JOIN. */
  LeftOuter = 2,
  /** RIGHT JOIN. */
  Right = 3,
  /** RIGHT OUTER JOIN. */
  RightOuter = 4,
  /** FULL OUTER JOIN. */
  FullOuter = 5,
  /** CROSS JOIN. */
  Cross = 6,
  /** No join type / not applicable. */
  None = 7
}
//#endregion
//#region src/enums/order_by_direction.d.ts
/**
 * Sort direction for ORDER BY columns and expressions.
 */
declare enum OrderByDirection {
  /** Ascending (ASC). */
  Ascending = 0,
  /** Descending (DESC). */
  Descending = 1,
  /** No direction / dialect default. */
  None = 2
}
//#endregion
//#region src/enums/where_operator.d.ts
/**
 * Comparison operators for WHERE and HAVING predicates.
 */
declare enum WhereOperator {
  /** Equality (=). */
  Equals = 0,
  /** Inequality (<> or !=). */
  NotEquals = 1,
  /** Strictly greater than (>). */
  GreaterThan = 2,
  /** Greater than or equal (>=). */
  GreaterThanOrEquals = 3,
  /** Strictly less than (<). */
  LessThan = 4,
  /** Less than or equal (<=). */
  LessThanOrEquals = 5,
  /** No operator specified. */
  None = 6
}
//#endregion
//#region src/enums/multi_builder_transaction_state.d.ts
/**
 * Whether multi-statement batches are wrapped in an explicit transaction block.
 */
declare enum MultiBuilderTransactionState {
  /** Emit BEGIN/COMMIT (or equivalent) around the batch. */
  TransactionOn = 0,
  /** Do not wrap the batch in a transaction. */
  TransactionOff = 1,
  /** Use default / unspecified transaction behavior. */
  None = 2
}
//#endregion
//#region src/enums/builder_type.d.ts
/**
 * Internal discriminator for the kind of builder operation stored in a state entry.
 * Used by the query builder to track fragments (FROM, WHERE, JOIN, etc.).
 */
declare enum BuilderType {
  /** Logical AND between predicate groups or conditions. */
  And = 0,
  /** FROM clause sourced from a nested builder/subquery. */
  FromBuilder = 1,
  /** FROM clause referencing a table name. */
  FromTable = 2,
  /** FROM clause using raw SQL text. */
  FromRaw = 3,
  /** GROUP BY on a column reference. */
  GroupByColumn = 4,
  /** GROUP BY using raw SQL. */
  GroupByRaw = 5,
  /** HAVING condition (standard form). */
  Having = 6,
  /** HAVING clause using raw SQL. */
  HavingRaw = 7,
  /** INSERT INTO table/columns entry. */
  InsertInto = 8,
  /** INSERT values or body as raw SQL. */
  InsertRaw = 9,
  /** JOIN defined via a nested builder. */
  JoinBuilder = 10,
  /** JOIN ON or clause fragment as raw SQL. */
  JoinRaw = 11,
  /** JOIN targeting a table reference. */
  JoinTable = 12,
  /** No operation / placeholder. */
  None = 13,
  /** Logical OR between predicate groups or conditions. */
  Or = 14,
  /** ORDER BY on a column with optional direction. */
  OrderByColumn = 15,
  /** ORDER BY using raw SQL. */
  OrderByRaw = 16,
  /** SELECT * (all columns). */
  SelectAll = 17,
  /** SELECT list entry from a nested builder/subquery. */
  SelectBuilder = 18,
  /** SELECT list entry for a single column/expression. */
  SelectColumn = 19,
  /** SELECT list entry as raw SQL. */
  SelectRaw = 20,
  /** UPDATE target table. */
  UpdateTable = 21,
  /** UPDATE SET column assignment. */
  UpdateColumn = 22,
  /** UPDATE fragment as raw SQL. */
  UpdateRaw = 23,
  /** DELETE FROM table. */
  DeleteFrom = 24,
  /** UNION set operator (distinct). */
  Union = 25,
  /** UNION ALL set operator. */
  UnionAll = 26,
  /** INTERSECT set operator. */
  Intersect = 27,
  /** EXCEPT / MINUS set operator. */
  Except = 28,
  /** Common table expression defined via a builder. */
  CteBuilder = 29,
  /** CTE definition as raw SQL. */
  CteRaw = 30,
  /** WHERE predicate (standard comparison or helper). */
  Where = 31,
  /** WHERE column BETWEEN low AND high. */
  WhereBetween = 32,
  /** Opens a parenthesized WHERE group. */
  WhereGroupBegin = 33,
  /** Nested WHERE built from a sub-builder. */
  WhereGroupBuilder = 34,
  /** Closes a parenthesized WHERE group. */
  WhereGroupEnd = 35,
  /** WHERE EXISTS (subquery from builder). */
  WhereExistsBuilder = 36,
  /** WHERE IN (subquery from builder). */
  WhereInBuilder = 37,
  /** WHERE IN (literal value list). */
  WhereInValues = 38,
  /** WHERE NOT EXISTS (subquery from builder). */
  WhereNotExistsBuilder = 39,
  /** WHERE NOT IN (subquery from builder). */
  WhereNotInBuilder = 40,
  /** WHERE NOT IN (literal value list). */
  WhereNotInValues = 41,
  /** WHERE column IS NOT NULL. */
  WhereNotNull = 42,
  /** WHERE column IS NULL. */
  WhereNull = 43,
  /** WHERE fragment as raw SQL. */
  WhereRaw = 44
}
//#endregion
//#region src/state/cte_state.d.ts
/**
 * Holds state for a single WITH (CTE) clause entry: name, body, and recursion flag.
 * Populated by the builder; exposed via {@link SqlEasyState.cteStates}.
 */
declare class CteState {
  /** Which builder variant produced this state. */
  builderType: BuilderType;
  /** CTE name as declared in WITH. */
  name: string;
  /** Whether this CTE is declared as RECURSIVE. */
  recursive: boolean;
  /** Nested query state for the CTE body, when not using raw SQL. */
  sqlEasyState: SqlEasyState | undefined;
  /** Raw SQL fragment for the CTE body when bypassing structured state. */
  raw: string | undefined;
}
//#endregion
//#region src/state/from_state.d.ts
/**
 * Holds state for one FROM source (table, subquery, or raw).
 * Populated by the builder; exposed via {@link SqlEasyState.fromStates}.
 */
declare class FromState {
  /** Which builder variant produced this state. */
  builderType: BuilderType;
  /** Schema or database owner qualifier for the table. */
  owner: string | undefined;
  /** Base table name when this source is a table. */
  tableName: string | undefined;
  /** Table or subquery alias in the FROM clause. */
  alias: string | undefined;
  /** Nested query state when this FROM entry is a subquery. */
  sqlEasyState: SqlEasyState | undefined;
  /** Raw SQL for this FROM fragment when not using structured fields. */
  raw: string | undefined;
}
//#endregion
//#region src/state/group_by_state.d.ts
/**
 * Holds state for one GROUP BY expression (column or raw).
 * Populated by the builder; exposed via {@link SqlEasyState.groupByStates}.
 */
declare class GroupByState {
  /** Which builder variant produced this state. */
  builderType: BuilderType;
  /** Table name or alias qualifying the grouped column. */
  tableNameOrAlias: string | undefined;
  /** Column name being grouped. */
  columnName: string | undefined;
  /** Raw SQL for this GROUP BY term when not using structured fields. */
  raw: string | undefined;
}
//#endregion
//#region src/state/having_state.d.ts
/**
 * Holds state for one HAVING predicate (similar shape to WHERE).
 * Populated by the builder; exposed via {@link SqlEasyState.havingStates}.
 */
declare class HavingState {
  /** Which builder variant produced this state. */
  builderType: BuilderType;
  /** Table name or alias qualifying the column in the predicate. */
  tableNameOrAlias: string | undefined;
  /** Column name in the HAVING expression. */
  columnName: string | undefined;
  /** Comparison or logical operator for this HAVING term. */
  whereOperator: WhereOperator;
  /** Raw SQL for this HAVING fragment when not using structured fields. */
  raw: string | undefined;
  /** Bound parameter values associated with this predicate. */
  values: any[];
}
//#endregion
//#region src/state/insert_state.d.ts
/**
 * Holds state for an INSERT: target table, columns, and row value sets.
 * Populated by the builder; exposed via {@link SqlEasyState.insertState}.
 */
declare class InsertState {
  /** Schema or database owner qualifier for the target table. */
  owner: string | undefined;
  /** Target table name. */
  tableName: string | undefined;
  /** Column names for the INSERT column list. */
  columns: string[];
  /** One inner array per row; values align with {@link InsertState.columns}. */
  values: any[][];
  /** Raw SQL for the INSERT when not fully represented by structured fields. */
  raw: string | undefined;
}
//#endregion
//#region src/enums/join_on_operator.d.ts
/**
 * Classifies each entry in a JOIN ON condition list (column compare, grouping, logic).
 */
declare enum JoinOnOperator {
  /** Opens a parenthesized ON predicate group. */
  GroupBegin = 0,
  /** Closes a parenthesized ON predicate group. */
  GroupEnd = 1,
  /** Standard ON left op right comparison. */
  On = 2,
  /** ON fragment as raw SQL. */
  Raw = 3,
  /** ON right-hand value or bound parameter. */
  Value = 4,
  /** Logical AND between ON parts. */
  And = 5,
  /** Logical OR between ON parts. */
  Or = 6,
  /** No operator / unused slot. */
  None = 7
}
//#endregion
//#region src/enums/join_operator.d.ts
/**
 * Comparison operators used in JOIN ON conditions (e.g. tableA.id = tableB.id).
 */
declare enum JoinOperator {
  /** Equality (=). */
  Equals = 0,
  /** Inequality (<> or !=). */
  NotEquals = 1,
  /** Strictly greater than (>). */
  GreaterThan = 2,
  /** Greater than or equal (>=). */
  GreaterThanOrEquals = 3,
  /** Strictly less than (<). */
  LessThan = 4,
  /** Less than or equal (<=). */
  LessThanOrEquals = 5,
  /** No operator specified. */
  None = 6
}
//#endregion
//#region src/state/join_on_state.d.ts
/**
 * Holds state for one ON (or AND) join condition between two sides.
 * Populated by the builder; nested under {@link JoinState.joinOnStates}.
 */
declare class JoinOnState {
  /** Alias of the left-hand column in the join condition. */
  aliasLeft: string | undefined;
  /** Left-hand column name. */
  columnLeft: string | undefined;
  /** Operator relating left and right (e.g. equals). */
  joinOperator: JoinOperator;
  /** Alias of the right-hand side (column or literal context). */
  aliasRight: string | undefined;
  /** Right-hand column name when the RHS is a column. */
  columnRight: string | undefined;
  /** AND/OR style combinator with the next join-on term. */
  joinOnOperator: JoinOnOperator;
  /** Raw SQL for this join condition when not using structured fields. */
  raw: string | undefined;
  /** Right-hand value when the RHS is a literal or parameter. */
  valueRight: any | undefined;
}
//#endregion
//#region src/state/join_state.d.ts
/**
 * Holds state for one JOIN (table/subquery, type, and ON clauses).
 * Populated by the builder; exposed via {@link SqlEasyState.joinStates}.
 */
declare class JoinState {
  /** Which builder variant produced this state. */
  builderType: BuilderType;
  /** INNER, LEFT, RIGHT, etc. */
  joinType: JoinType;
  /** Schema or owner for the joined table. */
  owner: string | undefined;
  /** Joined table name. */
  tableName: string | undefined;
  /** Alias for the joined relation. */
  alias: string | undefined;
  /** Nested query state when the join target is a subquery. */
  sqlEasyState: SqlEasyState | undefined;
  /** Raw SQL for the join target or full join fragment when applicable. */
  raw: string | undefined;
  /** Ordered ON/AND conditions for this join. */
  joinOnStates: JoinOnState[];
}
//#endregion
//#region src/state/order_by_state.d.ts
/**
 * Holds state for one ORDER BY sort key and direction.
 * Populated by the builder; exposed via {@link SqlEasyState.orderByStates}.
 */
declare class OrderByState {
  /** Which builder variant produced this state. */
  builderType: BuilderType;
  /** Table name or alias qualifying the sort column. */
  tableNameOrAlias: string | undefined;
  /** Column or expression name used for ordering. */
  columnName: string | undefined;
  /** ASC, DESC, or none. */
  direction: OrderByDirection;
  /** Raw SQL for this ORDER BY term when not using structured fields. */
  raw: string | undefined;
}
//#endregion
//#region src/state/select_state.d.ts
/**
 * Holds state for one SELECT list item (column, subquery, alias, or raw).
 * Populated by the builder; exposed via {@link SqlEasyState.selectStates}.
 */
declare class SelectState {
  /** Which builder variant produced this state. */
  builderType: BuilderType;
  /** Table name or alias qualifying the selected column. */
  tableNameOrAlias: string | undefined;
  /** Column name or expression identifier. */
  columnName: string | undefined;
  /** Output alias for this select item. */
  alias: string | undefined;
  /** Nested query state when this item is a scalar subquery. */
  sqlEasyState: SqlEasyState | undefined;
  /** Raw SQL for this select item when not using structured fields. */
  raw: string | undefined;
}
//#endregion
//#region src/state/union_state.d.ts
/**
 * Holds state for one UNION (or similar) branch: nested query or raw SQL.
 * Populated by the builder; exposed via {@link SqlEasyState.unionStates}.
 */
declare class UnionState {
  /** Which builder variant produced this state. */
  builderType: BuilderType;
  /** State for the branch query when not represented as raw SQL. */
  sqlEasyState: SqlEasyState | undefined;
  /** Raw SQL for this compound branch when applicable. */
  raw: string | undefined;
}
//#endregion
//#region src/state/update_state.d.ts
/**
 * Holds state for one UPDATE SET assignment (column and value or raw).
 * Populated by the builder; exposed via {@link SqlEasyState.updateStates}.
 */
declare class UpdateState {
  /** Which builder variant produced this state. */
  builderType: BuilderType;
  /** Target column name being updated. */
  columnName: string | undefined;
  /** New value or parameter placeholder binding. */
  value: any;
  /** Raw SQL for this SET fragment when not using structured fields. */
  raw: string | undefined;
}
//#endregion
//#region src/state/where_state.d.ts
/**
 * Holds state for one WHERE predicate (column op value, subquery, or raw).
 * Populated by the builder; exposed via {@link SqlEasyState.whereStates}.
 */
declare class WhereState {
  /** Which builder variant produced this state. */
  builderType: BuilderType;
  /** Table name or alias qualifying the column. */
  tableNameOrAlias: string | undefined;
  /** Column name in the predicate. */
  columnName: string | undefined;
  /** Comparison or logical operator for this term. */
  whereOperator: WhereOperator;
  /** Raw SQL for this WHERE fragment when not using structured fields. */
  raw: string | undefined;
  /** Nested query state when the RHS is a subquery. */
  sqlEasyState: SqlEasyState | undefined;
  /** Bound parameter values for this predicate. */
  values: any[];
}
//#endregion
//#region src/enums/query_type.d.ts
/**
 * High-level SQL statement kind the builder is assembling.
 */
declare enum QueryType {
  /** SELECT query. */
  Select = 0,
  /** INSERT statement. */
  Insert = 1,
  /** UPDATE statement. */
  Update = 2,
  /** DELETE statement. */
  Delete = 3
}
//#endregion
//#region src/state/sqleasy_state.d.ts
/**
 * Root snapshot of query-builder state returned by {@link IBuilder.state}.
 * Arrays preserve clause order; insert/update fields apply per query kind.
 */
declare class SqlEasyState {
  /** Logical name of the builder instance, if set. */
  builderName: string;
  /** High-level statement kind (SELECT, INSERT, etc.). */
  queryType: QueryType;
  /** FROM sources in declaration order. */
  fromStates: FromState[];
  /** JOIN clauses in declaration order. */
  joinStates: JoinState[];
  /** WHERE predicates in declaration order. */
  whereStates: WhereState[];
  /** ORDER BY terms in declaration order. */
  orderByStates: OrderByState[];
  /** SELECT list items in declaration order. */
  selectStates: SelectState[];
  /** GROUP BY terms in declaration order. */
  groupByStates: GroupByState[];
  /** HAVING predicates in declaration order. */
  havingStates: HavingState[];
  /** UNION / compound-query parts in declaration order. */
  unionStates: UnionState[];
  /** WITH (CTE) entries in declaration order. */
  cteStates: CteState[];
  /** INSERT-specific state; undefined for non-INSERT queries. */
  insertState: InsertState | undefined;
  /** UPDATE SET assignments in declaration order. */
  updateStates: UpdateState[];
  /** True when this state represents a nested subquery, not the outer query. */
  isInnerStatement: boolean;
  /** Maximum row count (0 often means unset; dialect-specific). */
  limit: number;
  /** Rows to skip before returning (0 often means unset). */
  offset: number;
  /** Whether SELECT DISTINCT was requested. */
  distinct: boolean;
  /** Opaque hook for dialect- or app-specific extensions. */
  customState: any | undefined;
}
//#endregion
//#region src/parser/interface_parser.d.ts
/**
 * Renders {@link SqlEasyState} into dialect-specific SQL strings.
 *
 * Users typically do not interact with parsers directly; instead,
 * call {@link IBuilder.parse} or {@link IBuilder.parseRaw} on the builder.
 */
interface IParser {
  /**
   * Renders a single query state as a prepared SQL string with parameter placeholders.
   *
   * @param state The builder state to render
   */
  toSql(state: SqlEasyState): string;
  /**
   * Renders multiple query states as a single prepared SQL string,
   * optionally wrapped in a transaction.
   *
   * @param states Array of builder states to render
   * @param transactionState Whether to wrap the output in transaction delimiters
   */
  toSqlMulti(states: SqlEasyState[], transactionState: MultiBuilderTransactionState): string;
  /**
   * Renders a single query state as a raw SQL string with values inlined.
   *
   * @param state The builder state to render
   */
  toSqlRaw(state: SqlEasyState): string;
  /**
   * Renders multiple query states as a single raw SQL string with values inlined,
   * optionally wrapped in a transaction.
   *
   * @param states Array of builder states to render
   * @param transactionState Whether to wrap the output in transaction delimiters
   */
  toSqlMultiRaw(states: SqlEasyState[], transactionState: MultiBuilderTransactionState): string;
}
//#endregion
//#region src/builder/interface_join_on_builder.d.ts
/**
 * Builder for defining JOIN ON conditions with support for AND/OR logic
 * and grouped conditions.
 *
 * Instances are provided via the `joinOnBuilder` callback parameter of
 * {@link IBuilder.joinTable} and related methods.
 *
 * @template T The concrete join-on builder type for fluent chaining
 */
interface IJoinOnBuilder<T> {
  /** Inserts an explicit AND between ON conditions. */
  and(): T;
  /**
   * Creates a new join-on builder instance, optionally with a different configuration.
   *
   * @param config Optional configuration override
   */
  newJoinOnBuilder(config?: IConfiguration): T;
  /**
   * Adds an ON condition comparing columns from two tables.
   *
   * @param aliasLeft The alias of the left table
   * @param columnLeft The column name from the left table
   * @param joinOperator The comparison operator
   * @param aliasRight The alias of the right table
   * @param columnRight The column name from the right table
   */
  on(aliasLeft: string, columnLeft: string, joinOperator: JoinOperator, aliasRight: string, columnRight: string): T;
  /**
   * Groups ON conditions inside parentheses for precedence control.
   *
   * @param builder Callback that receives a join-on builder to define the grouped conditions
   */
  onGroup(builder: (jb: T) => void): T;
  /**
   * Adds an ON condition from a raw SQL string.
   *
   * @param raw The raw SQL fragment
   */
  onRaw(raw: string): T;
  /**
   * Adds an ON condition comparing a column to a literal value.
   *
   * @param aliasLeft The alias of the left table
   * @param columnLeft The column name from the left table
   * @param joinOperator The comparison operator
   * @param valueRight The literal value to compare against
   */
  onValue(aliasLeft: string, columnLeft: string, joinOperator: JoinOperator, valueRight: any): T;
  /** Inserts an explicit OR between ON conditions. */
  or(): T;
  /** Returns the accumulated array of {@link JoinOnState} entries. */
  states(): JoinOnState[];
}
//#endregion
//#region src/builder/interface_builder.d.ts
/**
 * Fluent SQL query builder interface for constructing SELECT, INSERT, UPDATE,
 * and DELETE statements with type-safe method chaining.
 *
 * Obtain an instance via {@link ISqlEasy.newBuilder} rather than constructing directly.
 *
 * @template T The concrete builder type, returned from every method for fluent chaining
 * @template U The concrete join-on builder type used in JOIN callbacks
 * @template V The concrete parser type used to render SQL
 */
interface IBuilder<T, U extends IJoinOnBuilder<U>, V extends IParser> {
  /** Inserts an explicit AND between WHERE conditions. */
  and(): T;
  /** Resets all builder state (SELECT, FROM, JOIN, WHERE, etc.) to defaults. */
  clearAll(): T;
  /** Removes all FROM clauses from the builder. */
  clearFrom(): T;
  /** Removes all GROUP BY clauses from the builder. */
  clearGroupBy(): T;
  /** Removes all HAVING clauses from the builder. */
  clearHaving(): T;
  /** Removes all JOIN clauses from the builder. */
  clearJoin(): T;
  /** Resets the LIMIT value to zero. */
  clearLimit(): T;
  /** Resets the OFFSET value to zero. */
  clearOffset(): T;
  /** Removes all ORDER BY clauses from the builder. */
  clearOrderBy(): T;
  /** Removes all SELECT columns/expressions from the builder. */
  clearSelect(): T;
  /** Removes all WHERE conditions from the builder. */
  clearWhere(): T;
  /**
   * Defines a Common Table Expression (CTE) built from a sub-query.
   *
   * @param name The CTE name referenced in the main query
   * @param builder Callback that receives a fresh builder to define the CTE query
   */
  cte(name: string, builder: (builder: T) => void): T;
  /**
   * Defines a CTE from a raw SQL string.
   *
   * @param name The CTE name referenced in the main query
   * @param raw The raw SQL for the CTE body
   */
  cteRaw(name: string, raw: string): T;
  /**
   * Defines a recursive CTE built from a sub-query.
   *
   * @param name The CTE name referenced in the main query
   * @param builder Callback that receives a fresh builder to define the recursive CTE query
   */
  cteRecursive(name: string, builder: (builder: T) => void): T;
  /**
   * Begins a DELETE statement targeting the specified table.
   *
   * @param tableName The table to delete from
   * @param alias The alias for the table
   */
  deleteFrom(tableName: string, alias: string): T;
  /**
   * Begins a DELETE statement targeting a table with an explicit schema/owner.
   *
   * @param owner The schema or owner name
   * @param tableName The table to delete from
   * @param alias The alias for the table
   */
  deleteFromWithOwner(owner: string, tableName: string, alias: string): T;
  /** Adds DISTINCT to the SELECT clause. */
  distinct(): T;
  /**
   * Appends an EXCEPT set operation using a sub-query.
   *
   * @param builder Callback that receives a fresh builder to define the EXCEPT query
   */
  except(builder: (builder: T) => void): T;
  /**
   * Adds a FROM clause from a raw SQL string.
   *
   * @param rawFrom The raw SQL fragment for the FROM clause
   */
  fromRaw(rawFrom: string): T;
  /**
   * Adds multiple FROM clauses from raw SQL strings.
   *
   * @param rawFroms Array of raw SQL fragments for the FROM clause
   */
  fromRaws(rawFroms: string[]): T;
  /**
   * Adds a FROM clause referencing a table by name with an alias.
   *
   * @param tableName The name of the table
   * @param alias The alias to use for the table in the query
   */
  fromTable(tableName: string, alias: string): T;
  /**
   * Adds multiple FROM clauses referencing tables by name with aliases.
   *
   * @param tables Array of table definitions with `tableName` and `alias`
   */
  fromTables(tables: {
    tableName: string;
    alias: string;
  }[]): T;
  /**
   * Adds a FROM clause referencing a table with an explicit schema/owner.
   *
   * @param owner The schema or owner name
   * @param tableName The name of the table
   * @param alias The alias to use for the table in the query
   */
  fromTableWithOwner(owner: string, tableName: string, alias: string): T;
  /**
   * Adds multiple FROM clauses referencing tables with explicit schema/owner.
   *
   * @param tablesWithOwner Array of table definitions with `owner`, `tableName`, and `alias`
   */
  fromTablesWithOwner(tablesWithOwner: {
    owner: string;
    tableName: string;
    alias: string;
  }[]): T;
  /**
   * Adds a derived table (sub-query) to the FROM clause.
   *
   * @param alias The alias for the derived table
   * @param builder Callback that receives a fresh builder to define the sub-query
   */
  fromWithBuilder(alias: string, builder: (builder: T) => void): T;
  /**
   * Adds a GROUP BY clause for a single column.
   *
   * @param tableNameOrAlias The table name or alias qualifying the column
   * @param columnName The column to group by
   */
  groupByColumn(tableNameOrAlias: string, columnName: string): T;
  /**
   * Adds GROUP BY clauses for multiple columns.
   *
   * @param columns Array of column definitions with `tableNameOrAlias` and `columnName`
   */
  groupByColumns(columns: {
    tableNameOrAlias: string;
    columnName: string;
  }[]): T;
  /**
   * Adds a GROUP BY clause from a raw SQL string.
   *
   * @param rawGroupBy The raw SQL fragment
   */
  groupByRaw(rawGroupBy: string): T;
  /**
   * Adds multiple GROUP BY clauses from raw SQL strings.
   *
   * @param rawGroupBys Array of raw SQL fragments
   */
  groupByRaws(rawGroupBys: string[]): T;
  /**
   * Adds a HAVING condition on a column.
   *
   * @param tableNameOrAlias The table name or alias qualifying the column
   * @param columnName The column to filter on
   * @param whereOperator The comparison operator
   * @param value The value to compare against
   */
  having(tableNameOrAlias: string, columnName: string, whereOperator: WhereOperator, value: any): T;
  /**
   * Adds a HAVING clause from a raw SQL string.
   *
   * @param rawHaving The raw SQL fragment
   */
  havingRaw(rawHaving: string): T;
  /**
   * Adds multiple HAVING clauses from raw SQL strings.
   *
   * @param rawHavings Array of raw SQL fragments
   */
  havingRaws(rawHavings: string[]): T;
  /**
   * Begins an INSERT statement targeting the specified table.
   *
   * @param tableName The table to insert into
   */
  insertInto(tableName: string): T;
  /**
   * Begins an INSERT statement targeting a table with an explicit schema/owner.
   *
   * @param owner The schema or owner name
   * @param tableName The table to insert into
   */
  insertIntoWithOwner(owner: string, tableName: string): T;
  /**
   * Sets the column names for an INSERT statement.
   *
   * @param columns Array of column names
   */
  insertColumns(columns: string[]): T;
  /**
   * Adds a row of values to the INSERT statement. Call multiple times for multi-row inserts.
   *
   * @param values Array of values corresponding to the insert columns
   */
  insertValues(values: any[]): T;
  /**
   * Sets the INSERT statement body from a raw SQL string.
   *
   * @param raw The raw SQL for the INSERT body
   */
  insertRaw(raw: string): T;
  /**
   * Appends an INTERSECT set operation using a sub-query.
   *
   * @param builder Callback that receives a fresh builder to define the INTERSECT query
   */
  intersect(builder: (builder: T) => void): T;
  /**
   * Adds a JOIN clause from a raw SQL string.
   *
   * @param rawJoin The raw SQL fragment for the JOIN
   */
  joinRaw(rawJoin: string): T;
  /**
   * Adds multiple JOIN clauses from raw SQL strings.
   *
   * @param rawJoins Array of raw SQL fragments for the JOINs
   */
  joinRaws(rawJoins: string[]): T;
  /**
   * Adds a typed JOIN to another table with ON conditions defined via a callback.
   *
   * @param joinType The type of join (INNER, LEFT, RIGHT, etc.)
   * @param tableName The table to join
   * @param alias The alias for the joined table
   * @param joinOnBuilder Callback that receives a join-on builder to define ON conditions
   */
  joinTable(joinType: JoinType, tableName: string, alias: string, joinOnBuilder: (joinOnBuilder: U) => void): T;
  /**
   * Adds multiple typed JOINs to other tables.
   *
   * @param joins Array of join definitions with `joinType`, `tableName`, `alias`, and `joinOnBuilder` callback
   */
  joinTables(joins: {
    joinType: JoinType;
    tableName: string;
    alias: string;
    joinOnBuilder: (joinOnBuilder: U) => void;
  }[]): T;
  /**
   * Adds multiple typed JOINs to tables with explicit schema/owner.
   *
   * @param joins Array of join definitions with `joinType`, `owner`, `tableName`, `alias`, and `joinOnBuilder` callback
   */
  joinTablesWithOwner(joins: {
    joinType: JoinType;
    owner: string;
    tableName: string;
    alias: string;
    joinOnBuilder: (joinOnBuilder: U) => void;
  }[]): T;
  /**
   * Adds a typed JOIN to a table with an explicit schema/owner and ON conditions.
   *
   * @param joinType The type of join (INNER, LEFT, RIGHT, etc.)
   * @param owner The schema or owner name
   * @param tableName The table to join
   * @param alias The alias for the joined table
   * @param joinOnBuilder Callback that receives a join-on builder to define ON conditions
   */
  joinTableWithOwner(joinType: JoinType, owner: string, tableName: string, alias: string, joinOnBuilder: (joinOnBuilder: U) => void): T;
  /**
   * Adds a JOIN to a derived table (sub-query) with ON conditions.
   *
   * @param joinType The type of join (INNER, LEFT, RIGHT, etc.)
   * @param alias The alias for the derived table
   * @param builder Callback that receives a fresh builder to define the sub-query
   * @param joinOnBuilder Callback that receives a join-on builder to define ON conditions
   */
  joinWithBuilder(joinType: JoinType, alias: string, builder: (builder: T) => void, joinOnBuilder: (joinOnBuilder: U) => void): T;
  /**
   * Sets the maximum number of rows to return.
   *
   * @param limit The row limit
   */
  limit(limit: number): T;
  /**
   * Creates a new builder instance, optionally with a different configuration.
   *
   * @param config Optional configuration override
   */
  newBuilder(config?: IConfiguration): T;
  /**
   * Creates a new join-on builder instance, optionally with a different configuration.
   *
   * @param config Optional configuration override
   */
  newJoinOnBuilder(config?: IConfiguration): U;
  /**
   * Creates a new parser instance, optionally with a different configuration.
   *
   * @param config Optional configuration override
   */
  newParser(config?: IConfiguration): V;
  /**
   * Sets the number of rows to skip before returning results.
   *
   * @param offset The row offset
   */
  offset(offset: number): T;
  /** Inserts an explicit OR between WHERE conditions. */
  or(): T;
  /**
   * Adds an ORDER BY clause for a single column.
   *
   * @param tableNameOrAlias The table name or alias qualifying the column
   * @param columnName The column to order by
   * @param direction The sort direction (ascending or descending)
   */
  orderByColumn(tableNameOrAlias: string, columnName: string, direction: OrderByDirection): T;
  /**
   * Adds ORDER BY clauses for multiple columns.
   *
   * @param columns Array of column definitions with `tableNameOrAlias`, `columnName`, and `direction`
   */
  orderByColumns(columns: {
    tableNameOrAlias: string;
    columnName: string;
    direction: OrderByDirection;
  }[]): T;
  /**
   * Adds an ORDER BY clause from a raw SQL string.
   *
   * @param rawOrderBy The raw SQL fragment
   */
  orderByRaw(rawOrderBy: string): T;
  /**
   * Adds multiple ORDER BY clauses from raw SQL strings.
   *
   * @param rawOrderBys Array of raw SQL fragments
   */
  orderByRaws(rawOrderBys: string[]): T;
  /**
   * Renders the built query as a prepared SQL string with parameter placeholders.
   * The placeholder style is dialect-specific (e.g. `?` for MySQL/MSSQL, `$` for Postgres).
   */
  parse(): string;
  /**
   * Renders the built query as a raw SQL string with values inlined.
   * Useful for debugging or contexts where prepared statements are not supported.
   */
  parseRaw(): string;
  /** Adds `SELECT *` to the query. */
  selectAll(): T;
  /**
   * Adds a single column to the SELECT clause.
   *
   * @param tableNameOrAlias The table name or alias qualifying the column
   * @param columnName The column name
   * @param columnAlias The alias for the column in the result set (empty string for no alias)
   */
  selectColumn(tableNameOrAlias: string, columnName: string, columnAlias: string): T;
  /**
   * Adds multiple columns to the SELECT clause.
   *
   * @param columns Array of column definitions with `tableNameOrAlias`, `columnName`, and `columnAlias`
   */
  selectColumns(columns: {
    tableNameOrAlias: string;
    columnName: string;
    columnAlias: string;
  }[]): T;
  /**
   * Adds a raw SQL expression to the SELECT clause.
   *
   * @param rawSelect The raw SQL expression (e.g. `"COUNT(*) AS total"`)
   */
  selectRaw(rawSelect: string): T;
  /**
   * Adds multiple raw SQL expressions to the SELECT clause.
   *
   * @param rawSelects Array of raw SQL expressions
   */
  selectRaws(rawSelects: string[]): T;
  /**
   * Adds a scalar sub-query to the SELECT clause.
   *
   * @param alias The alias for the sub-query result column
   * @param builder Callback that receives a fresh builder to define the sub-query
   */
  selectWithBuilder(alias: string, builder: (builder: T) => void): T;
  /**
   * Adds a SET clause for an UPDATE statement, setting a column to a value.
   *
   * @param columnName The column to update
   * @param value The new value
   */
  set(columnName: string, value: any): T;
  /**
   * Adds multiple SET clauses for an UPDATE statement.
   *
   * @param columns Array of column/value pairs with `columnName` and `value`
   */
  setColumns(columns: {
    columnName: string;
    value: any;
  }[]): T;
  /**
   * Adds a raw SQL SET clause for an UPDATE statement.
   *
   * @param raw The raw SQL fragment for the SET clause
   */
  setRaw(raw: string): T;
  /** Returns the internal {@link SqlEasyState} representing the current builder state. */
  state(): SqlEasyState;
  /**
   * Appends a UNION set operation using a sub-query.
   *
   * @param builder Callback that receives a fresh builder to define the UNION query
   */
  union(builder: (builder: T) => void): T;
  /**
   * Appends a UNION ALL set operation using a sub-query.
   *
   * @param builder Callback that receives a fresh builder to define the UNION ALL query
   */
  unionAll(builder: (builder: T) => void): T;
  /**
   * Begins an UPDATE statement targeting the specified table.
   *
   * @param tableName The table to update
   * @param alias The alias for the table
   */
  updateTable(tableName: string, alias: string): T;
  /**
   * Begins an UPDATE statement targeting a table with an explicit schema/owner.
   *
   * @param owner The schema or owner name
   * @param tableName The table to update
   * @param alias The alias for the table
   */
  updateTableWithOwner(owner: string, tableName: string, alias: string): T;
  /**
   * Adds a WHERE condition comparing a column to a value.
   *
   * @param tableNameOrAlias The table name or alias qualifying the column
   * @param columnName The column to filter on
   * @param whereOperator The comparison operator
   * @param value The value to compare against
   */
  where(tableNameOrAlias: string, columnName: string, whereOperator: WhereOperator, value: any): T;
  /**
   * Adds a WHERE BETWEEN condition.
   *
   * @param tableNameOrAlias The table name or alias qualifying the column
   * @param columnName The column to filter on
   * @param value1 The lower bound
   * @param value2 The upper bound
   */
  whereBetween(tableNameOrAlias: string, columnName: string, value1: any, value2: any): T;
  /**
   * Adds a WHERE EXISTS condition using a correlated sub-query.
   *
   * @param tableNameOrAlias The table name or alias qualifying the column
   * @param columnName The column name
   * @param builder Callback that receives a fresh builder to define the sub-query
   */
  whereExistsWithBuilder(tableNameOrAlias: string, columnName: string, builder: (builder: T) => void): T;
  /**
   * Groups WHERE conditions inside parentheses for precedence control.
   *
   * @param builder Callback that receives a fresh builder to define the grouped conditions
   */
  whereGroup(builder: (builder: T) => void): T;
  /**
   * Adds a WHERE IN condition using a sub-query.
   *
   * @param tableNameOrAlias The table name or alias qualifying the column
   * @param columnName The column to filter on
   * @param builder Callback that receives a fresh builder to define the sub-query
   */
  whereInWithBuilder(tableNameOrAlias: string, columnName: string, builder: (builder: T) => void): T;
  /**
   * Adds a WHERE IN condition with an explicit list of values.
   *
   * @param tableNameOrAlias The table name or alias qualifying the column
   * @param columnName The column to filter on
   * @param values The list of values
   */
  whereInValues(tableNameOrAlias: string, columnName: string, values: any[]): T;
  /**
   * Adds a WHERE NOT EXISTS condition using a correlated sub-query.
   *
   * @param tableNameOrAlias The table name or alias qualifying the column
   * @param columnName The column name
   * @param builder Callback that receives a fresh builder to define the sub-query
   */
  whereNotExistsWithBuilder(tableNameOrAlias: string, columnName: string, builder: (builder: T) => void): T;
  /**
   * Adds a WHERE NOT IN condition using a sub-query.
   *
   * @param tableNameOrAlias The table name or alias qualifying the column
   * @param columnName The column to filter on
   * @param builder Callback that receives a fresh builder to define the sub-query
   */
  whereNotInWithBuilder(tableNameOrAlias: string, columnName: string, builder: (builder: T) => void): T;
  /**
   * Adds a WHERE NOT IN condition with an explicit list of values.
   *
   * @param tableNameOrAlias The table name or alias qualifying the column
   * @param columnName The column to filter on
   * @param values The list of values
   */
  whereNotInValues(tableNameOrAlias: string, columnName: string, values: any[]): T;
  /**
   * Adds a WHERE column IS NOT NULL condition.
   *
   * @param tableNameOrAlias The table name or alias qualifying the column
   * @param columnName The column to check
   */
  whereNotNull(tableNameOrAlias: string, columnName: string): T;
  /**
   * Adds a WHERE column IS NULL condition.
   *
   * @param tableNameOrAlias The table name or alias qualifying the column
   * @param columnName The column to check
   */
  whereNull(tableNameOrAlias: string, columnName: string): T;
  /**
   * Adds a WHERE clause from a raw SQL string.
   *
   * @param rawWhere The raw SQL fragment
   */
  whereRaw(rawWhere: string): T;
  /**
   * Adds multiple WHERE clauses from raw SQL strings.
   *
   * @param rawWheres Array of raw SQL fragments
   */
  whereRaws(rawWheres: string[]): T;
}
//#endregion
//#region src/builder/interface_multi_builder.d.ts
/**
 * Builder for composing multiple SQL statements into a single batch,
 * with optional transaction wrapping.
 *
 * Obtain an instance via {@link ISqlEasy.newMultiBuilder} rather than constructing directly.
 *
 * @template T The concrete single-query builder type
 * @template U The concrete join-on builder type
 * @template V The concrete parser type
 */
interface IMultiBuilder<T extends IBuilder<T, U, V>, U extends IJoinOnBuilder<U>, V extends IParser> {
  /**
   * Adds a named builder to the batch and returns it for configuration.
   *
   * @param builderName A unique name identifying this builder within the batch
   */
  addBuilder(builderName: string): T;
  /**
   * Renders all builders in the batch as a single prepared SQL string.
   * If a transaction state is set, the output is wrapped with the
   * appropriate BEGIN/COMMIT delimiters.
   */
  parse(): string;
  /**
   * Renders all builders in the batch as a single raw SQL string with values inlined.
   * If a transaction state is set, the output is wrapped with the
   * appropriate BEGIN/COMMIT delimiters.
   */
  parseRaw(): string;
  /**
   * Removes a previously added builder from the batch by name.
   *
   * @param builderName The name of the builder to remove
   */
  removeBuilder(builderName: string): void;
  /**
   * Reorders the builders in the batch. The provided array must contain
   * exactly the same builder names that were previously added.
   *
   * @param builderNames The desired order of builder names
   */
  reorderBuilders(builderNames: string[]): void;
  /**
   * Sets whether the batch should be wrapped in a transaction.
   *
   * @param transactionState The desired transaction state
   */
  setTransactionState(transactionState: MultiBuilderTransactionState): void;
  /** Returns the array of {@link SqlEasyState} objects for all builders in the batch. */
  states(): SqlEasyState[];
  /** Returns the current transaction state of the multi-builder. */
  transactionState(): MultiBuilderTransactionState;
}
//#endregion
//#region src/enums/parser_area.d.ts
/**
 * Indicates which SQL clause produced a parser error for clearer diagnostics.
 */
declare enum ParserArea {
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
  General = "General"
}
//#endregion
//#region src/helpers/parser_error.d.ts
/** Error thrown when SQL parsing fails; {@link ParserError.name} is `SqlEasyParserError`. */
declare class ParserError extends Error {
  /**
   * @param parserArea - Phase or region of the parser where the error occurred.
   * @param message - Human-readable parse error description.
   */
  constructor(parserArea: ParserArea, message: string);
}
//#endregion
//#region src/sqleasy/interface_sqleasy.d.ts
/**
 * Top-level entry point for a specific SQL dialect.
 *
 * Each supported database has a concrete implementation (e.g. {@link PostgresSqlEasy},
 * {@link MssqlSqlEasy}) that provides dialect-aware builders and configuration.
 *
 * @template T The concrete builder type
 * @template U The concrete join-on builder type
 * @template V The concrete multi-builder type
 * @template W The concrete parser type
 */
interface ISqlEasy<T extends IBuilder<T, U, W>, U extends IJoinOnBuilder<U>, V extends IMultiBuilder<T, U, W>, W extends IParser> {
  /** Returns the dialect-specific configuration for this instance. */
  configuration(): IConfiguration;
  /**
   * Creates a new single-query builder for constructing SQL statements.
   *
   * @param rc Optional runtime configuration override
   */
  newBuilder(rc?: RuntimeConfiguration): T;
  /**
   * Creates a new multi-statement builder for batching multiple queries.
   *
   * @param rc Optional runtime configuration override
   */
  newMultiBuilder(rc?: RuntimeConfiguration): V;
}
//#endregion
//#region src/builder/default_builder.d.ts
declare abstract class DefaultBuilder<T extends IBuilder<T, U, V>, U extends IJoinOnBuilder<U>, V extends IParser> implements IBuilder<T, U, V> {
  private _sqlEasyState;
  private _config;
  constructor(config: IConfiguration);
  abstract newBuilder(config?: IConfiguration): T;
  abstract newJoinOnBuilder(config?: IConfiguration): U;
  abstract newParser(config?: IConfiguration): V;
  and: () => T;
  clearAll: () => T;
  clearFrom: () => T;
  clearGroupBy: () => T;
  clearHaving: () => T;
  clearJoin: () => T;
  clearLimit: () => T;
  clearOffset: () => T;
  clearOrderBy: () => T;
  clearSelect: () => T;
  clearWhere: () => T;
  distinct: () => T;
  fromRaw: (rawFrom: string) => T;
  fromRaws: (rawFroms: string[]) => T;
  fromTable: (tableName: string, alias: string) => T;
  fromTables: (tables: {
    tableName: string;
    alias: string;
  }[]) => T;
  fromTableWithOwner: (owner: string, tableName: string, alias: string) => T;
  fromTablesWithOwner: (tables: {
    owner: string;
    tableName: string;
    alias: string;
  }[]) => T;
  fromWithBuilder: (alias: string, builder: (builder: T) => void) => T;
  joinRaw: (rawJoin: string) => T;
  joinRaws: (rawJoins: string[]) => T;
  joinTable: (joinType: JoinType, tableName: string, alias: string, joinOnBuilder: (joinOnBuilder: U) => void) => T;
  joinTables: (joins: {
    joinType: JoinType;
    tableName: string;
    alias: string;
    joinOnBuilder: (joinOnBuilder: U) => void;
  }[]) => T;
  joinTablesWithOwner: (joins: {
    joinType: JoinType;
    owner: string;
    tableName: string;
    alias: string;
    joinOnBuilder: (joinOnBuilder: U) => void;
  }[]) => T;
  joinTableWithOwner: (joinType: JoinType, owner: string, tableName: string, alias: string, joinOnBuilder: (joinOnBuilder: U) => void) => T;
  joinWithBuilder: (joinType: JoinType, alias: string, builder: (builder: T) => void, joinOnBuilder: (joinOnBuilder: U) => void) => T;
  limit: (limit: number) => T;
  offset: (offset: number) => T;
  or: () => T;
  orderByColumn: (tableNameOrAlias: string, columnName: string, direction: OrderByDirection) => T;
  orderByColumns: (columns: {
    tableNameOrAlias: string;
    columnName: string;
    direction: OrderByDirection;
  }[]) => T;
  orderByRaw: (rawOrderBy: string) => T;
  orderByRaws: (rawOrderBys: string[]) => T;
  parse: () => string;
  parseRaw: () => string;
  selectAll: () => T;
  selectColumn: (tableNameOrAlias: string, columnName: string, columnAlias: string) => T;
  selectColumns: (columns: {
    tableNameOrAlias: string;
    columnName: string;
    columnAlias: string;
  }[]) => T;
  selectRaw: (rawSelect: string) => T;
  selectRaws: (rawSelects: string[]) => T;
  selectWithBuilder: (alias: string, builder: (builder: T) => void) => T;
  state: () => SqlEasyState;
  where: (tableNameOrAlias: string, columnName: string, whereOperator: WhereOperator, value: any) => T;
  whereBetween: (tableNameOrAlias: string, columnName: string, value1: any, value2: any) => T;
  whereExistsWithBuilder: (tableNameOrAlias: string, columnName: string, builder: (builder: T) => void) => T;
  whereGroup(builder: (builder: T) => void): T;
  whereInWithBuilder: (tableNameOrAlias: string, columnName: string, builder: (builder: T) => void) => T;
  whereInValues: (tableNameOrAlias: string, columnName: string, values: any[]) => T;
  whereNotExistsWithBuilder: (tableNameOrAlias: string, columnName: string, builder: (builder: T) => void) => T;
  whereNotInWithBuilder: (tableNameOrAlias: string, columnName: string, builder: (builder: T) => void) => T;
  whereNotInValues: (tableNameOrAlias: string, columnName: string, values: any[]) => T;
  whereNotNull: (tableNameOrAlias: string, columnName: string) => T;
  whereNull: (tableNameOrAlias: string, columnName: string) => T;
  whereRaw: (rawWhere: string) => T;
  whereRaws: (rawWheres: string[]) => T;
  groupByColumn: (tableNameOrAlias: string, columnName: string) => T;
  groupByColumns: (columns: {
    tableNameOrAlias: string;
    columnName: string;
  }[]) => T;
  groupByRaw: (rawGroupBy: string) => T;
  groupByRaws: (rawGroupBys: string[]) => T;
  having: (tableNameOrAlias: string, columnName: string, whereOperator: WhereOperator, value: any) => T;
  havingRaw: (rawHaving: string) => T;
  havingRaws: (rawHavings: string[]) => T;
  insertInto: (tableName: string) => T;
  insertIntoWithOwner: (owner: string, tableName: string) => T;
  insertColumns: (columns: string[]) => T;
  insertValues: (values: any[]) => T;
  insertRaw: (raw: string) => T;
  updateTable: (tableName: string, alias: string) => T;
  updateTableWithOwner: (owner: string, tableName: string, alias: string) => T;
  set: (columnName: string, value: any) => T;
  setColumns: (columns: {
    columnName: string;
    value: any;
  }[]) => T;
  setRaw: (raw: string) => T;
  deleteFrom: (tableName: string, alias: string) => T;
  deleteFromWithOwner: (owner: string, tableName: string, alias: string) => T;
  union: (builder: (builder: T) => void) => T;
  unionAll: (builder: (builder: T) => void) => T;
  intersect: (builder: (builder: T) => void) => T;
  except: (builder: (builder: T) => void) => T;
  cte: (name: string, builder: (builder: T) => void) => T;
  cteRecursive: (name: string, builder: (builder: T) => void) => T;
  cteRaw: (name: string, raw: string) => T;
}
//#endregion
//#region src/sqleasy/mssql/mssql_configuration.d.ts
/** {@link IConfiguration} for Microsoft SQL Server (delimiters, placeholders, default schema). */
declare class MssqlConfiguration implements IConfiguration {
  private _mssqlRuntimeConfiguration;
  /** @param rc - Runtime options (e.g. row limits) bound to this dialect configuration. */
  constructor(rc: RuntimeConfiguration);
  /** Returns {@link DatabaseType.Mssql}. */
  databaseType: () => DatabaseType;
  /** Default schema/owner for unqualified objects (`dbo`). */
  defaultOwner: () => string;
  /** Bracket delimiters for quoted identifiers. */
  identifierDelimiters: () => ConfigurationDelimiters;
  /** Placeholder character for parameterized SQL (`?`). */
  preparedStatementPlaceholder: () => string;
  /** Runtime options associated with this configuration. */
  runtimeConfiguration: () => RuntimeConfiguration;
  /** Single-quote delimiter for string literals. */
  stringDelimiter: () => string;
  /** Keywords delimiting a transaction block for this dialect. */
  transactionDelimiters: () => ConfigurationDelimiters;
}
//#endregion
//#region src/builder/default_join_on_builder.d.ts
declare abstract class DefaultJoinOnBuilder<T extends IJoinOnBuilder<T>> implements IJoinOnBuilder<T> {
  private _states;
  private _config;
  constructor(config: IConfiguration);
  abstract newJoinOnBuilder(config?: IConfiguration): T;
  and: () => T;
  on: (aliasLeft: string, columnLeft: string, joinOperator: JoinOperator, aliasRight: string, columnRight: string) => T;
  onGroup: (builder: (builder: T) => void) => T;
  onRaw: (raw: string) => T;
  onValue: (aliasLeft: string, columnLeft: string, joinOperator: JoinOperator, valueRight: any) => T;
  or: () => T;
  states: () => JoinOnState[];
}
//#endregion
//#region src/sqleasy/mssql/mssql_join_on_builder.d.ts
/** MSSQL {@link DefaultJoinOnBuilder} for constructing `JOIN ... ON` fragments. */
declare class MssqlJoinOnBuilder extends DefaultJoinOnBuilder<MssqlJoinOnBuilder> {
  private _mssqlConfiguration;
  /** @param config - MSSQL dialect configuration used when emitting join conditions. */
  constructor(config: MssqlConfiguration);
  /** Returns a new join-on builder, reusing this configuration unless `config` is provided. */
  newJoinOnBuilder: (config?: IConfiguration) => MssqlJoinOnBuilder;
}
//#endregion
//#region src/enums/parser_mode.d.ts
declare enum ParserMode {
  Raw = 0,
  Prepared = 1,
  None = 2
}
//#endregion
//#region src/helpers/sql_helper.d.ts
declare class SqlHelper {
  private _sb;
  private _values;
  private _config;
  private _parserMode;
  constructor(config: IConfiguration, parserMode: ParserMode);
  addDynamicValue: (value: any) => string;
  addSqlSnippet: (sql: string) => void;
  addSqlSnippetWithValues: (sqlString: string, values: any[]) => void;
  clear: () => void;
  getSql: () => string;
  getSqlDebug: () => string;
  getValues: () => any[];
  getValueStringFromDataType: (value: any) => string;
}
//#endregion
//#region src/parser/default_to_sql.d.ts
interface ToSqlOptions {
  beforeSelectColumns?: (state: SqlEasyState, config: IConfiguration, sqlHelper: SqlHelper) => void;
}
//#endregion
//#region src/parser/default_parser.d.ts
declare abstract class DefaultParser {
  private _config;
  constructor(config: IConfiguration);
  protected get config(): IConfiguration;
  protected getToSqlOptions(): ToSqlOptions;
  abstract toSql(state: SqlEasyState): string;
  abstract toSqlMulti(states: SqlEasyState[], transactionState: MultiBuilderTransactionState): string;
  toSqlRaw: (state: SqlEasyState) => string;
  toSqlMultiRaw: (states: SqlEasyState[], transactionState: MultiBuilderTransactionState) => string;
}
//#endregion
//#region src/sqleasy/mssql/mssql_parser.d.ts
declare class MssqlParser extends DefaultParser {
  private _mssqlConfiguration;
  constructor(config: MssqlConfiguration);
  protected getToSqlOptions(): ToSqlOptions;
  toSql: (state: SqlEasyState) => string;
  toSqlMulti: (states: SqlEasyState[], transactionState: MultiBuilderTransactionState) => string;
  private getParameterType;
}
//#endregion
//#region src/sqleasy/mssql/mssql_builder.d.ts
/** MSSQL {@link DefaultBuilder}; creates dialect parsers and join-on builders and supports `TOP`. */
declare class MssqlBuilder extends DefaultBuilder<MssqlBuilder, MssqlJoinOnBuilder, MssqlParser> {
  private _mssqlConfig;
  /** @param config - MSSQL dialect configuration used for SQL generation. */
  constructor(config: MssqlConfiguration);
  /** Returns a new builder, reusing this configuration unless `config` is provided. */
  newBuilder: (config?: IConfiguration) => MssqlBuilder;
  /** Returns a new join-on builder for this dialect. */
  newJoinOnBuilder: (config?: IConfiguration) => MssqlJoinOnBuilder;
  /** Returns a new MSSQL parser instance. */
  newParser: (config?: IConfiguration) => MssqlParser;
  /** Removes a previously set `TOP` limit from builder state. */
  clearTop: () => MssqlBuilder;
  /** Sets the `TOP` row limit for the generated `SELECT`. */
  top: (top: number) => MssqlBuilder;
}
//#endregion
//#region src/builder/default_multi_builder.d.ts
declare abstract class DefaultMultiBuilder<T extends IBuilder<T, U, V>, U extends IJoinOnBuilder<U>, V extends IParser> implements IMultiBuilder<T, U, V> {
  private _config;
  private _states;
  private _transactionState;
  constructor(config: IConfiguration);
  abstract newBuilder(): T;
  abstract newParser(): V;
  addBuilder: (builderName: string) => T;
  parse: () => string;
  parseRaw: () => string;
  removeBuilder: (builderName: string) => void;
  reorderBuilders: (builderNames: string[]) => void;
  setTransactionState: (transactionState: MultiBuilderTransactionState) => void;
  states: () => SqlEasyState[];
  transactionState: () => MultiBuilderTransactionState;
}
//#endregion
//#region src/sqleasy/mssql/mssql_multi_builder.d.ts
/** MSSQL {@link DefaultMultiBuilder} for batching multiple statements with shared configuration. */
declare class MssqlMultiBuilder extends DefaultMultiBuilder<MssqlBuilder, MssqlJoinOnBuilder, MssqlParser> {
  private _mssqlConfiguration;
  /** @param config - MSSQL dialect configuration shared by child builders and parsers. */
  constructor(config: MssqlConfiguration);
  /** Creates a fresh {@link MssqlBuilder} using this multi-builder’s configuration. */
  newBuilder: () => MssqlBuilder;
  /** Creates a fresh {@link MssqlParser} using this multi-builder’s configuration. */
  newParser: () => MssqlParser;
}
//#endregion
//#region src/sqleasy/mssql/mssql_sqleasy.d.ts
/** Main entry point for Microsoft SQL Server; implements {@link ISqlEasy} for MSSQL builders and parsers. */
declare class MssqlSqlEasy implements ISqlEasy<MssqlBuilder, MssqlJoinOnBuilder, MssqlMultiBuilder, MssqlParser> {
  private _mssqlConfiguration;
  /** @param rc - Optional runtime options; defaults to a new {@link RuntimeConfiguration} when omitted. */
  constructor(rc?: RuntimeConfiguration);
  /** Returns the shared MSSQL dialect configuration for this instance. */
  configuration: () => MssqlConfiguration;
  /** Creates a query builder, optionally with a one-off {@link RuntimeConfiguration}. */
  newBuilder: (rc?: RuntimeConfiguration) => MssqlBuilder;
  /** Creates a multi-statement builder, optionally with a one-off {@link RuntimeConfiguration}. */
  newMultiBuilder: (rc?: RuntimeConfiguration) => MssqlMultiBuilder;
}
//#endregion
//#region src/sqleasy/mysql/mysql_configuration.d.ts
/** {@link IConfiguration} for MySQL (delimiters, placeholders, transactions). */
declare class MysqlConfiguration implements IConfiguration {
  private _mysqlRuntimeConfiguration;
  /** @param rc - Runtime options (e.g. row limits) bound to this dialect configuration. */
  constructor(rc: RuntimeConfiguration);
  /** Returns {@link DatabaseType.Mysql}. */
  databaseType: () => DatabaseType;
  /** Default owner for unqualified objects (empty for typical MySQL usage). */
  defaultOwner: () => string;
  /** Backtick delimiters for quoted identifiers. */
  identifierDelimiters: () => ConfigurationDelimiters;
  /** Placeholder character for parameterized SQL (`?`). */
  preparedStatementPlaceholder: () => string;
  /** Runtime options associated with this configuration. */
  runtimeConfiguration: () => RuntimeConfiguration;
  /** Single-quote delimiter for string literals. */
  stringDelimiter: () => string;
  /** Keywords delimiting a transaction block for this dialect. */
  transactionDelimiters: () => ConfigurationDelimiters;
}
//#endregion
//#region src/sqleasy/mysql/mysql_join_on_builder.d.ts
/** MySQL {@link DefaultJoinOnBuilder} for constructing `JOIN ... ON` fragments. */
declare class MysqlJoinOnBuilder extends DefaultJoinOnBuilder<MysqlJoinOnBuilder> {
  private _mysqlConfig;
  /** @param config - MySQL dialect configuration used when emitting join conditions. */
  constructor(config: MysqlConfiguration);
  /** Returns a new join-on builder, reusing this configuration unless `config` is provided. */
  newJoinOnBuilder: (config?: IConfiguration) => MysqlJoinOnBuilder;
}
//#endregion
//#region src/sqleasy/mysql/mysql_parser.d.ts
declare class MysqlParser extends DefaultParser {
  private _mysqlConfiguration;
  constructor(config: MysqlConfiguration);
  toSql: (state: SqlEasyState) => string;
  toSqlMulti: (states: SqlEasyState[], transactionState: MultiBuilderTransactionState) => string;
}
//#endregion
//#region src/sqleasy/mysql/mysql_builder.d.ts
/** MySQL {@link DefaultBuilder}; creates dialect parsers and join-on builders. */
declare class MysqlBuilder extends DefaultBuilder<MysqlBuilder, MysqlJoinOnBuilder, MysqlParser> {
  private _mysqlConfig;
  /** @param config - MySQL dialect configuration used for SQL generation. */
  constructor(config: MysqlConfiguration);
  /** Returns a new builder, reusing this configuration unless `config` is provided. */
  newBuilder: (config?: IConfiguration) => MysqlBuilder;
  /** Returns a new join-on builder for this dialect. */
  newJoinOnBuilder: (config?: IConfiguration) => MysqlJoinOnBuilder;
  /** Returns a new MySQL parser instance. */
  newParser: (config?: IConfiguration) => MysqlParser;
}
//#endregion
//#region src/sqleasy/mysql/mysql_multi_builder.d.ts
/** MySQL {@link DefaultMultiBuilder} for batching multiple statements with shared configuration. */
declare class MysqlMultiBuilder extends DefaultMultiBuilder<MysqlBuilder, MysqlJoinOnBuilder, MysqlParser> {
  private _mysqlConfig;
  /** @param config - MySQL dialect configuration shared by child builders and parsers. */
  constructor(config: MysqlConfiguration);
  /** Creates a fresh {@link MysqlBuilder} using this multi-builder’s configuration. */
  newBuilder: () => MysqlBuilder;
  /** Creates a fresh {@link MysqlParser} using this multi-builder’s configuration. */
  newParser: () => MysqlParser;
}
//#endregion
//#region src/sqleasy/mysql/mysql_sqleasy.d.ts
/** Main entry point for MySQL; implements {@link ISqlEasy} for MySQL builders and parsers. */
declare class MysqlSqlEasy implements ISqlEasy<MysqlBuilder, MysqlJoinOnBuilder, MysqlMultiBuilder, MysqlParser> {
  private _mysqlConfiguration;
  /** @param rc - Optional runtime options; defaults to a new {@link RuntimeConfiguration} when omitted. */
  constructor(rc?: RuntimeConfiguration);
  /** Returns the shared MySQL dialect configuration for this instance. */
  configuration: () => MysqlConfiguration;
  /** Creates a query builder, optionally with a one-off {@link RuntimeConfiguration}. */
  newBuilder: (rc?: RuntimeConfiguration) => MysqlBuilder;
  /** Creates a multi-statement builder, optionally with a one-off {@link RuntimeConfiguration}. */
  newMultiBuilder: (rc?: RuntimeConfiguration) => MysqlMultiBuilder;
}
//#endregion
//#region src/sqleasy/postgres/postgres_configuration.d.ts
/** {@link IConfiguration} for PostgreSQL (delimiters, placeholders, default schema). */
declare class PostgresConfiguration implements IConfiguration {
  private _postgresRuntimeConfiguration;
  /** @param rc - Runtime options (e.g. row limits) bound to this dialect configuration. */
  constructor(rc: RuntimeConfiguration);
  /** Returns {@link DatabaseType.Postgres}. */
  databaseType: () => DatabaseType;
  /** Default schema for unqualified objects (`public`). */
  defaultOwner: () => string;
  /** Double-quote delimiters for quoted identifiers. */
  identifierDelimiters: () => ConfigurationDelimiters;
  /** Prefix for numbered prepared statement placeholders (`$`). */
  preparedStatementPlaceholder: () => string;
  /** Runtime options associated with this configuration. */
  runtimeConfiguration: () => RuntimeConfiguration;
  /** Single-quote delimiter for string literals. */
  stringDelimiter: () => string;
  /** Keywords delimiting a transaction block for this dialect. */
  transactionDelimiters: () => ConfigurationDelimiters;
}
//#endregion
//#region src/sqleasy/postgres/postgres_join_on_builder.d.ts
/** PostgreSQL {@link DefaultJoinOnBuilder} for constructing `JOIN ... ON` fragments. */
declare class PostgresJoinOnBuilder extends DefaultJoinOnBuilder<PostgresJoinOnBuilder> {
  private _postgresConfig;
  /** @param config - PostgreSQL dialect configuration used when emitting join conditions. */
  constructor(config: PostgresConfiguration);
  /** Returns a new join-on builder, reusing this configuration unless `config` is provided. */
  newJoinOnBuilder: (config?: IConfiguration) => PostgresJoinOnBuilder;
}
//#endregion
//#region src/sqleasy/postgres/postgres_parser.d.ts
declare class PostgresParser extends DefaultParser {
  private _postgresConfiguration;
  constructor(config: PostgresConfiguration);
  toSql: (state: SqlEasyState) => string;
  toSqlMulti: (states: SqlEasyState[], transactionState: MultiBuilderTransactionState) => string;
}
//#endregion
//#region src/sqleasy/postgres/postgres_builder.d.ts
/** PostgreSQL {@link DefaultBuilder}; creates dialect parsers and join-on builders. */
declare class PostgresBuilder extends DefaultBuilder<PostgresBuilder, PostgresJoinOnBuilder, PostgresParser> {
  private _postgresConfig;
  /** @param config - PostgreSQL dialect configuration used for SQL generation. */
  constructor(config: PostgresConfiguration);
  /** Returns a new builder, reusing this configuration unless `config` is provided. */
  newBuilder: (config?: IConfiguration) => PostgresBuilder;
  /** Returns a new join-on builder for this dialect. */
  newJoinOnBuilder: (config?: IConfiguration) => PostgresJoinOnBuilder;
  /** Returns a new PostgreSQL parser instance. */
  newParser: (config?: IConfiguration) => PostgresParser;
}
//#endregion
//#region src/sqleasy/postgres/postgres_multi_builder.d.ts
/** PostgreSQL {@link DefaultMultiBuilder} for batching multiple statements with shared configuration. */
declare class PostgresMultiBuilder extends DefaultMultiBuilder<PostgresBuilder, PostgresJoinOnBuilder, PostgresParser> {
  private _postgresConfig;
  /** @param config - PostgreSQL dialect configuration shared by child builders and parsers. */
  constructor(config: PostgresConfiguration);
  /** Creates a fresh {@link PostgresBuilder} using this multi-builder’s configuration. */
  newBuilder: () => PostgresBuilder;
  /** Creates a fresh {@link PostgresParser} using this multi-builder’s configuration. */
  newParser: () => PostgresParser;
}
//#endregion
//#region src/sqleasy/postgres/postgres_sqleasy.d.ts
/** Main entry point for PostgreSQL; implements {@link ISqlEasy} for Postgres builders and parsers. */
declare class PostgresSqlEasy implements ISqlEasy<PostgresBuilder, PostgresJoinOnBuilder, PostgresMultiBuilder, PostgresParser> {
  private _postgresConfig;
  /** @param rc - Optional runtime options; defaults to a new {@link RuntimeConfiguration} when omitted. */
  constructor(rc?: RuntimeConfiguration);
  /** Returns the shared PostgreSQL dialect configuration for this instance. */
  configuration: () => PostgresConfiguration;
  /** Creates a query builder, optionally with a one-off {@link RuntimeConfiguration}. */
  newBuilder: (rc?: RuntimeConfiguration) => PostgresBuilder;
  /** Creates a multi-statement builder, optionally with a one-off {@link RuntimeConfiguration}. */
  newMultiBuilder: (rc?: RuntimeConfiguration) => PostgresMultiBuilder;
}
//#endregion
//#region src/sqleasy/sqlite/sqlite_configuration.d.ts
/** {@link IConfiguration} for SQLite (delimiters, placeholders, transactions). */
declare class SqliteConfiguration implements IConfiguration {
  private _sqliteRuntimeConfiguration;
  /** @param rc - Runtime options (e.g. row limits) bound to this dialect configuration. */
  constructor(rc: RuntimeConfiguration);
  /** Returns {@link DatabaseType.Sqlite}. */
  databaseType: () => DatabaseType;
  /** Default owner for unqualified objects (empty for SQLite). */
  defaultOwner: () => string;
  /** Double-quote delimiters for quoted identifiers. */
  identifierDelimiters: () => ConfigurationDelimiters;
  /** Placeholder character for parameterized SQL (`?`). */
  preparedStatementPlaceholder: () => string;
  /** Runtime options associated with this configuration. */
  runtimeConfiguration: () => RuntimeConfiguration;
  /** Single-quote delimiter for string literals. */
  stringDelimiter: () => string;
  /** Keywords delimiting a transaction block for this dialect. */
  transactionDelimiters: () => ConfigurationDelimiters;
}
//#endregion
//#region src/sqleasy/sqlite/sqlite_join_on_builder.d.ts
/** SQLite {@link DefaultJoinOnBuilder} for constructing `JOIN ... ON` fragments. */
declare class SqliteJoinOnBuilder extends DefaultJoinOnBuilder<SqliteJoinOnBuilder> {
  private _sqliteConfig;
  /** @param config - SQLite dialect configuration used when emitting join conditions. */
  constructor(config: SqliteConfiguration);
  /** Returns a new join-on builder, reusing this configuration unless `config` is provided. */
  newJoinOnBuilder: (config?: IConfiguration) => SqliteJoinOnBuilder;
}
//#endregion
//#region src/sqleasy/sqlite/sqlite_parser.d.ts
declare class SqliteParser extends DefaultParser {
  private _sqliteConfiguration;
  constructor(config: SqliteConfiguration);
  toSql: (state: SqlEasyState) => string;
  toSqlMulti: (states: SqlEasyState[], transactionState: MultiBuilderTransactionState) => string;
}
//#endregion
//#region src/sqleasy/sqlite/sqlite_builder.d.ts
/** SQLite {@link DefaultBuilder}; creates dialect parsers and join-on builders. */
declare class SqliteBuilder extends DefaultBuilder<SqliteBuilder, SqliteJoinOnBuilder, SqliteParser> {
  private _sqliteConfig;
  /** @param config - SQLite dialect configuration used for SQL generation. */
  constructor(config: SqliteConfiguration);
  /** Returns a new builder, reusing this configuration unless `config` is provided. */
  newBuilder: (config?: IConfiguration) => SqliteBuilder;
  /** Returns a new join-on builder for this dialect. */
  newJoinOnBuilder: (config?: IConfiguration) => SqliteJoinOnBuilder;
  /** Returns a new SQLite parser instance. */
  newParser: (config?: IConfiguration) => SqliteParser;
}
//#endregion
//#region src/sqleasy/sqlite/sqlite_multi_builder.d.ts
/** SQLite {@link DefaultMultiBuilder} for batching multiple statements with shared configuration. */
declare class SqliteMultiBuilder extends DefaultMultiBuilder<SqliteBuilder, SqliteJoinOnBuilder, SqliteParser> {
  private _sqliteConfig;
  /** @param config - SQLite dialect configuration shared by child builders and parsers. */
  constructor(config: SqliteConfiguration);
  /** Creates a fresh {@link SqliteBuilder} using this multi-builder’s configuration. */
  newBuilder: () => SqliteBuilder;
  /** Creates a fresh {@link SqliteParser} using this multi-builder’s configuration. */
  newParser: () => SqliteParser;
}
//#endregion
//#region src/sqleasy/sqlite/sqlite_sqleasy.d.ts
/** Main entry point for SQLite; implements {@link ISqlEasy} for SQLite builders and parsers. */
declare class SqliteSqlEasy implements ISqlEasy<SqliteBuilder, SqliteJoinOnBuilder, SqliteMultiBuilder, SqliteParser> {
  private _sqliteConfiguration;
  /** @param rc - Optional runtime options; defaults to a new {@link RuntimeConfiguration} when omitted. */
  constructor(rc?: RuntimeConfiguration);
  /** Returns the shared SQLite dialect configuration for this instance. */
  configuration: () => SqliteConfiguration;
  /** Creates a query builder, optionally with a one-off {@link RuntimeConfiguration}. */
  newBuilder: (rc?: RuntimeConfiguration) => SqliteBuilder;
  /** Creates a multi-statement builder, optionally with a one-off {@link RuntimeConfiguration}. */
  newMultiBuilder: (rc?: RuntimeConfiguration) => SqliteMultiBuilder;
}
//#endregion
export { BuilderType, ConfigurationDelimiters, CteState, DatabaseType, FromState, GroupByState, HavingState, IBuilder, IConfiguration, IJoinOnBuilder, IMultiBuilder, IParser, ISqlEasy, InsertState, JoinOnOperator, JoinOnState, JoinOperator, JoinState, JoinType, MssqlBuilder, MssqlConfiguration, MssqlJoinOnBuilder, MssqlMultiBuilder, MssqlSqlEasy, MultiBuilderTransactionState, MysqlBuilder, MysqlConfiguration, MysqlJoinOnBuilder, MysqlMultiBuilder, MysqlSqlEasy, OrderByDirection, OrderByState, ParserArea, ParserError, PostgresBuilder, PostgresConfiguration, PostgresJoinOnBuilder, PostgresMultiBuilder, PostgresSqlEasy, QueryType, RuntimeConfiguration, SelectState, SqlEasyState, SqliteBuilder, SqliteConfiguration, SqliteJoinOnBuilder, SqliteMultiBuilder, SqliteSqlEasy, UnionState, UpdateState, WhereOperator, WhereState };
//# sourceMappingURL=index.d.mts.map