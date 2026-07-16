//#region src/configuration/delimiters.d.ts
/** Pair of delimiter strings for quoting identifiers or framing transaction blocks. */
type ConfigurationDelimiters = {
  /** Opening delimiter (e.g. `[`, `` ` ``, or `"`). */
  begin: string;
  /** Closing delimiter matching {@link ConfigurationDelimiters.begin}. */
  end: string;
};
//#endregion
//#region src/configuration/runtime.d.ts
/** Options passed when creating Query instances or builders. */
declare class RuntimeConfiguration {
  /** Optional host-defined settings carried alongside runtime options. */
  customConfiguration: any | undefined;
}
//#endregion
//#region src/enums/database-type.d.ts
/**
 * Identifies the target SQL database dialect for generation and quoting behavior.
 */
declare const DatabaseType: {
  /** Microsoft SQL Server. */
  readonly Mssql: "mssql";
  /** PostgreSQL. */
  readonly Postgres: "postgres";
  /** MySQL or compatible (e.g. MariaDB). */
  readonly Mysql: "mysql";
  /** SQLite. */
  readonly Sqlite: "sqlite";
  /** Dialect not set or unrecognized. */
  readonly Unknown: "unknown";
};
/** One of the {@link DatabaseType} dialect identifiers. */
type DatabaseType = (typeof DatabaseType)[keyof typeof DatabaseType];
//#endregion
//#region src/configuration/configuration.d.ts
/**
 * Dialect-specific configuration that controls how SQL is generated.
 *
 * This is a plain data object — the whole strategy for a dialect. Each dialect ships a
 * factory (e.g. {@link sqliteConfiguration}) that produces one, and the single
 * {@link QueryBuilder} class reads it to decide identifier quoting, placeholder style,
 * default schema, and transaction syntax.
 */
type Dialect = {
  /** The {@link DatabaseType} identifying this dialect. */
  databaseType: DatabaseType;
  /** The default schema/owner name (e.g. `"dbo"` for MSSQL, `"public"` for Postgres). */
  defaultOwner: string;
  /** The delimiters used to quote identifiers (e.g. `[`/`]` for MSSQL, `"`/`"` for Postgres). */
  identifierDelimiters: ConfigurationDelimiters;
  /** The placeholder character used in prepared statements (e.g. `"?"` or `"$"`). */
  preparedStatementPlaceholder: string;
  /** The {@link RuntimeConfiguration} bound to this dialect instance. */
  runtimeConfiguration: RuntimeConfiguration;
  /** The delimiters used to wrap transaction blocks (e.g. `BEGIN`/`COMMIT`). */
  transactionDelimiters: ConfigurationDelimiters;
};
//#endregion
//#region src/enums/join-type.d.ts
/**
 * SQL JOIN kinds: inner, outer variants, cross join, or none.
 */
declare const JoinType: {
  /** INNER JOIN. */
  readonly Inner: "Inner";
  /** LEFT JOIN (synonym for left outer in many dialects). */
  readonly Left: "Left";
  /** LEFT OUTER JOIN. */
  readonly LeftOuter: "LeftOuter";
  /** RIGHT JOIN. */
  readonly Right: "Right";
  /** RIGHT OUTER JOIN. */
  readonly RightOuter: "RightOuter";
  /** FULL OUTER JOIN. */
  readonly FullOuter: "FullOuter";
  /** CROSS JOIN. */
  readonly Cross: "Cross";
  /** No join type / not applicable. */
  readonly None: "None";
};
/** One of the {@link JoinType} kinds. */
type JoinType = (typeof JoinType)[keyof typeof JoinType];
//#endregion
//#region src/enums/order-by-direction.d.ts
/**
 * Sort direction for ORDER BY columns and expressions.
 */
declare const OrderByDirection: {
  /** Ascending (ASC). */
  readonly Ascending: "Ascending";
  /** Descending (DESC). */
  readonly Descending: "Descending";
  /** No direction / dialect default. */
  readonly None: "None";
};
/** One of the {@link OrderByDirection} values. */
type OrderByDirection = (typeof OrderByDirection)[keyof typeof OrderByDirection];
//#endregion
//#region src/enums/where-operator.d.ts
/**
 * Comparison operators for WHERE and HAVING predicates.
 */
declare const WhereOperator: {
  /** Equality (=). */
  readonly Equals: "Equals";
  /** Inequality (<> or !=). */
  readonly NotEquals: "NotEquals";
  /** Strictly greater than (>). */
  readonly GreaterThan: "GreaterThan";
  /** Greater than or equal (>=). */
  readonly GreaterThanOrEquals: "GreaterThanOrEquals";
  /** Strictly less than (<). */
  readonly LessThan: "LessThan";
  /** Less than or equal (<=). */
  readonly LessThanOrEquals: "LessThanOrEquals";
  /** No operator specified. */
  readonly None: "None";
  /** Pattern match (LIKE) — the bound value carries any `%`/`_` wildcards. */
  readonly Like: "Like";
  /** Negated pattern match (NOT LIKE). */
  readonly NotLike: "NotLike";
};
/** One of the {@link WhereOperator} comparison values. */
type WhereOperator = (typeof WhereOperator)[keyof typeof WhereOperator];
//#endregion
//#region src/enums/multi-builder-transaction-state.d.ts
/**
 * Whether a multi-statement batch is wrapped in an explicit transaction block.
 */
declare const MultiBuilderTransactionState: {
  /** Emit the dialect's BEGIN/COMMIT (or equivalent) around the batch. */
  readonly TransactionOn: "TransactionOn";
  /** Do not wrap the batch in a transaction. */
  readonly TransactionOff: "TransactionOff";
  /** Use default / unspecified transaction behavior. */
  readonly None: "None";
};
/** One of the {@link MultiBuilderTransactionState} values. */
type MultiBuilderTransactionState = (typeof MultiBuilderTransactionState)[keyof typeof MultiBuilderTransactionState];
//#endregion
//#region src/enums/parser-mode.d.ts
/**
 * Whether values are inlined into the SQL (Raw) or surfaced as bound parameters (Prepared).
 */
declare const ParserMode: {
  /** Values are rendered inline into the SQL string. */
  readonly Raw: "Raw";
  /** Values are replaced by placeholders and surfaced separately. */
  readonly Prepared: "Prepared";
  /** No mode / unused. */
  readonly None: "None";
};
/** One of the {@link ParserMode} values. */
type ParserMode = (typeof ParserMode)[keyof typeof ParserMode];
//#endregion
//#region src/helpers/sql.d.ts
/**
 * Accumulates SQL fragments and their bound values while a parser walks a query state.
 *
 * Deliberately dialect-agnostic: it emits {@link PLACEHOLDER_TOKEN}, never a dialect's `?`/`$`, so
 * it needs no {@link Dialect}. The dialect's placeholder is applied once, at the top-level parse.
 */
declare class SqlHelper {
  #private;
  constructor(parserMode: ParserMode);
  /**
   * Emits one bound value: a {@link PLACEHOLDER_TOKEN} in Prepared mode (with the value recorded for
   * binding), or the value inlined in Raw mode.
   *
   * This appends directly rather than returning text for the caller to pass back through
   * {@link addSqlSnippet}, so that `addSqlSnippet` can reject *every* NUL byte it sees. If the token
   * passed through the public path, `addSqlSnippet` could not tell our token from a NUL sequence
   * in a caller's raw fragment — which is exactly how a raw fragment could forge a placeholder.
   */
  addDynamicValue: (value: any) => void;
  /**
   * Appends a SQL fragment. This is the path every caller-supplied raw fragment takes, so a NUL
   * byte is refused outright: it could forge a {@link PLACEHOLDER_TOKEN} and steal a bound value's
   * position, and it silently truncates the statement in some drivers. Our own tokens never come
   * through here — see {@link addDynamicValue}.
   */
  addSqlSnippet: (sql: string) => void;
  /**
   * Splices a sub-parser's already-rendered SQL and its bound values into this helper. The sub-SQL
   * legitimately carries {@link PLACEHOLDER_TOKEN}s, so it bypasses the NUL check in
   * {@link addSqlSnippet} — its own fragments were validated when the sub-parser built them.
   */
  addSqlSnippetWithValues: (sqlString: string, values: any[]) => void;
  clear: () => void;
  /**
   * The rendered SQL, still carrying {@link PLACEHOLDER_TOKEN} for each bound value. Sub-parsers
   * compose their output into a parent helper, so the tokens must survive until the top-level
   * parse swaps them for the dialect's placeholder via {@link renderPlaceholders}.
   */
  getSql: () => string;
  getSqlDebug: () => string;
  getValues: () => any[];
  getValueStringFromDataType: (value: any) => string;
}
//#endregion
//#region src/enums/builder-type.d.ts
/**
 * Internal discriminator for the kind of builder operation stored in a state entry.
 * Used by the query builder to track fragments (FROM, WHERE, JOIN, etc.).
 */
declare const BuilderType: {
  /** Logical AND between predicate groups or conditions. */
  readonly And: "And";
  /** FROM clause sourced from a nested builder/subquery. */
  readonly FromBuilder: "FromBuilder";
  /** FROM clause referencing a table name. */
  readonly FromTable: "FromTable";
  /** FROM clause using raw SQL text. */
  readonly FromRaw: "FromRaw";
  /** GROUP BY on a column reference. */
  readonly GroupByColumn: "GroupByColumn";
  /** GROUP BY using raw SQL. */
  readonly GroupByRaw: "GroupByRaw";
  /** HAVING condition (standard form). */
  readonly Having: "Having";
  /** HAVING clause using raw SQL. */
  readonly HavingRaw: "HavingRaw";
  /** INSERT values or body as raw SQL. */
  readonly InsertRaw: "InsertRaw";
  /** JOIN defined via a nested builder. */
  readonly JoinBuilder: "JoinBuilder";
  /** JOIN ON or clause fragment as raw SQL. */
  readonly JoinRaw: "JoinRaw";
  /** JOIN targeting a table reference. */
  readonly JoinTable: "JoinTable";
  /** No operation / placeholder. */
  readonly None: "None";
  /** Logical OR between predicate groups or conditions. */
  readonly Or: "Or";
  /** ORDER BY on a column with optional direction. */
  readonly OrderByColumn: "OrderByColumn";
  /** ORDER BY using raw SQL. */
  readonly OrderByRaw: "OrderByRaw";
  /** SELECT * (all columns). */
  readonly SelectAll: "SelectAll";
  /** SELECT list entry from a nested builder/subquery. */
  readonly SelectBuilder: "SelectBuilder";
  /** SELECT list entry for a single column/expression. */
  readonly SelectColumn: "SelectColumn";
  /** SELECT list entry as raw SQL. */
  readonly SelectRaw: "SelectRaw";
  /** UPDATE SET column assignment. */
  readonly UpdateColumn: "UpdateColumn";
  /** UPDATE fragment as raw SQL. */
  readonly UpdateRaw: "UpdateRaw";
  /** UNION set operator (distinct). */
  readonly Union: "Union";
  /** UNION ALL set operator. */
  readonly UnionAll: "UnionAll";
  /** INTERSECT set operator. */
  readonly Intersect: "Intersect";
  /** EXCEPT / MINUS set operator. */
  readonly Except: "Except";
  /** Common table expression defined via a builder. */
  readonly CteBuilder: "CteBuilder";
  /** CTE definition as raw SQL. */
  readonly CteRaw: "CteRaw";
  /** WHERE predicate (standard comparison or helper). */
  readonly Where: "Where";
  /** WHERE column BETWEEN low AND high. */
  readonly WhereBetween: "WhereBetween";
  /** Opens a parenthesized WHERE group. */
  readonly WhereGroupBegin: "WhereGroupBegin";
  /** Nested WHERE built from a sub-builder. */
  readonly WhereGroupBuilder: "WhereGroupBuilder";
  /** Closes a parenthesized WHERE group. */
  readonly WhereGroupEnd: "WhereGroupEnd";
  /** WHERE EXISTS (subquery from builder). */
  readonly WhereExistsBuilder: "WhereExistsBuilder";
  /** WHERE IN (subquery from builder). */
  readonly WhereInBuilder: "WhereInBuilder";
  /** WHERE IN (literal value list). */
  readonly WhereInValues: "WhereInValues";
  /** WHERE NOT EXISTS (subquery from builder). */
  readonly WhereNotExistsBuilder: "WhereNotExistsBuilder";
  /** WHERE NOT IN (subquery from builder). */
  readonly WhereNotInBuilder: "WhereNotInBuilder";
  /** WHERE NOT IN (literal value list). */
  readonly WhereNotInValues: "WhereNotInValues";
  /** WHERE column IS NOT NULL. */
  readonly WhereNotNull: "WhereNotNull";
  /** WHERE column IS NULL. */
  readonly WhereNull: "WhereNull";
  /** WHERE fragment as raw SQL. */
  readonly WhereRaw: "WhereRaw";
};
/** One of the {@link BuilderType} discriminator values. */
type BuilderType = (typeof BuilderType)[keyof typeof BuilderType];
//#endregion
//#region src/state/cte.d.ts
/**
 * Holds state for a single WITH (CTE) clause entry: name, body, and recursion flag.
 * Populated by the builder; exposed via {@link QueryState.cteStates}.
 */
type CteState = {
  /** Which builder variant produced this state. */
  builderType: BuilderType;
  /** CTE name as declared in WITH. */
  name: string;
  /** Whether this CTE is declared as RECURSIVE. */
  recursive: boolean;
  /** Nested query state for the CTE body, when not using raw SQL. */
  subquery: QueryState | undefined;
  /** Raw SQL fragment for the CTE body when bypassing structured state. */
  raw: string | undefined;
};
/** Creates a {@link CteState} with default field values. */
declare const createCteState: () => CteState;
//#endregion
//#region src/state/from.d.ts
/**
 * Holds state for one FROM source (table, subquery, or raw).
 * Populated by the builder; exposed via {@link QueryState.fromStates}.
 */
type FromState = {
  /** Which builder variant produced this state. */
  builderType: BuilderType;
  /** Schema or database owner qualifier for the table. */
  owner: string | undefined;
  /** Base table name when this source is a table. */
  tableName: string | undefined;
  /** Table or subquery alias in the FROM clause. */
  alias: string | undefined;
  /** Nested query state when this FROM entry is a subquery. */
  subquery: QueryState | undefined;
  /** Raw SQL for this FROM fragment when not using structured fields. */
  raw: string | undefined;
};
/** Creates a {@link FromState} with default field values. */
declare const createFromState: () => FromState;
//#endregion
//#region src/state/group-by.d.ts
/**
 * Holds state for one GROUP BY expression (column or raw).
 * Populated by the builder; exposed via {@link QueryState.groupByStates}.
 */
type GroupByState = {
  /** Which builder variant produced this state. */
  builderType: BuilderType;
  /** Table name or alias qualifying the grouped column. */
  tableNameOrAlias: string | undefined;
  /** Column name being grouped. */
  columnName: string | undefined;
  /** Raw SQL for this GROUP BY term when not using structured fields. */
  raw: string | undefined;
};
/** Creates a {@link GroupByState} with default field values. */
declare const createGroupByState: () => GroupByState;
//#endregion
//#region src/state/having.d.ts
/**
 * Holds state for one HAVING predicate (similar shape to WHERE).
 * Populated by the builder; exposed via {@link QueryState.havingStates}.
 */
type HavingState = {
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
};
/** Creates a {@link HavingState} with default field values. */
declare const createHavingState: () => HavingState;
//#endregion
//#region src/state/insert.d.ts
/**
 * Holds state for an INSERT: target table, columns, and row value sets.
 * Populated by the builder; exposed via {@link QueryState.insertState}.
 */
type InsertState = {
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
};
/** Creates an {@link InsertState} with default field values. */
declare const createInsertState: () => InsertState;
//#endregion
//#region src/enums/join-on-operator.d.ts
/**
 * Classifies each entry in a JOIN ON condition list (column compare, grouping, logic).
 */
declare const JoinOnOperator: {
  /** Opens a parenthesized ON predicate group. */
  readonly GroupBegin: "GroupBegin";
  /** Closes a parenthesized ON predicate group. */
  readonly GroupEnd: "GroupEnd";
  /** Standard ON left op right comparison. */
  readonly On: "On";
  /** ON fragment as raw SQL. */
  readonly Raw: "Raw";
  /** ON right-hand value or bound parameter. */
  readonly Value: "Value";
  /** Logical AND between ON parts. */
  readonly And: "And";
  /** Logical OR between ON parts. */
  readonly Or: "Or";
  /** No operator / unused slot. */
  readonly None: "None";
};
/** One of the {@link JoinOnOperator} values. */
type JoinOnOperator = (typeof JoinOnOperator)[keyof typeof JoinOnOperator];
//#endregion
//#region src/enums/join-operator.d.ts
/**
 * Comparison operators used in JOIN ON conditions (e.g. tableA.id = tableB.id).
 */
declare const JoinOperator: {
  /** Equality (=). */
  readonly Equals: "Equals";
  /** Inequality (<> or !=). */
  readonly NotEquals: "NotEquals";
  /** Strictly greater than (>). */
  readonly GreaterThan: "GreaterThan";
  /** Greater than or equal (>=). */
  readonly GreaterThanOrEquals: "GreaterThanOrEquals";
  /** Strictly less than (<). */
  readonly LessThan: "LessThan";
  /** Less than or equal (<=). */
  readonly LessThanOrEquals: "LessThanOrEquals";
  /** No operator specified. */
  readonly None: "None";
};
/** One of the {@link JoinOperator} comparison values. */
type JoinOperator = (typeof JoinOperator)[keyof typeof JoinOperator];
//#endregion
//#region src/state/join-on.d.ts
/**
 * Holds state for one ON (or AND) join condition between two sides.
 * Populated by the builder; nested under {@link JoinState.joinOnStates}.
 */
type JoinOnState = {
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
};
/** Creates a {@link JoinOnState} with default field values. */
declare const createJoinOnState: () => JoinOnState;
//#endregion
//#region src/state/join.d.ts
/**
 * Holds state for one JOIN (table/subquery, type, and ON clauses).
 * Populated by the builder; exposed via {@link QueryState.joinStates}.
 */
type JoinState = {
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
  subquery: QueryState | undefined;
  /** Raw SQL for the join target or full join fragment when applicable. */
  raw: string | undefined;
  /** Ordered ON/AND conditions for this join. */
  joinOnStates: JoinOnState[];
};
/** Creates a {@link JoinState} with default field values. */
declare const createJoinState: () => JoinState;
//#endregion
//#region src/state/order-by.d.ts
/**
 * Holds state for one ORDER BY sort key and direction.
 * Populated by the builder; exposed via {@link QueryState.orderByStates}.
 */
type OrderByState = {
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
};
/** Creates an {@link OrderByState} with default field values. */
declare const createOrderByState: () => OrderByState;
//#endregion
//#region src/state/select.d.ts
/**
 * Holds state for one SELECT list item (column, subquery, alias, or raw).
 * Populated by the builder; exposed via {@link QueryState.selectStates}.
 */
type SelectState = {
  /** Which builder variant produced this state. */
  builderType: BuilderType;
  /** Table name or alias qualifying the selected column. */
  tableNameOrAlias: string | undefined;
  /** Column name or expression identifier. */
  columnName: string | undefined;
  /** Output alias for this select item. */
  alias: string | undefined;
  /** Nested query state when this item is a scalar subquery. */
  subquery: QueryState | undefined;
  /** Raw SQL for this select item when not using structured fields. */
  raw: string | undefined;
};
/** Creates a {@link SelectState} with default field values. */
declare const createSelectState: () => SelectState;
//#endregion
//#region src/state/union.d.ts
/**
 * Holds state for one UNION (or similar) branch: nested query or raw SQL.
 * Populated by the builder; exposed via {@link QueryState.unionStates}.
 */
type UnionState = {
  /** Which builder variant produced this state. */
  builderType: BuilderType;
  /** State for the branch query when not represented as raw SQL. */
  subquery: QueryState | undefined;
  /** Raw SQL for this compound branch when applicable. */
  raw: string | undefined;
};
/** Creates a {@link UnionState} with default field values. */
declare const createUnionState: () => UnionState;
//#endregion
//#region src/state/update.d.ts
/**
 * Holds state for one UPDATE SET assignment (column and value or raw).
 * Populated by the builder; exposed via {@link QueryState.updateStates}.
 */
type UpdateState = {
  /** Which builder variant produced this state. */
  builderType: BuilderType;
  /** Target column name being updated. */
  columnName: string | undefined;
  /** New value or parameter placeholder binding. */
  value: any;
  /** Raw SQL for this SET fragment when not using structured fields. */
  raw: string | undefined;
};
/** Creates an {@link UpdateState} with default field values. */
declare const createUpdateState: () => UpdateState;
//#endregion
//#region src/state/where.d.ts
/**
 * Holds state for one WHERE predicate (column op value, subquery, or raw).
 * Populated by the builder; exposed via {@link QueryState.whereStates}.
 */
type WhereState = {
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
  subquery: QueryState | undefined;
  /** Bound parameter values for this predicate. */
  values: any[];
};
/** Creates a {@link WhereState} with default field values. */
declare const createWhereState: () => WhereState;
//#endregion
//#region src/enums/query-type.d.ts
/**
 * High-level SQL statement kind the builder is assembling.
 */
declare const QueryType: {
  /** SELECT query. */
  readonly Select: "Select";
  /** INSERT statement. */
  readonly Insert: "Insert";
  /** UPDATE statement. */
  readonly Update: "Update";
  /** DELETE statement. */
  readonly Delete: "Delete";
};
/** One of the {@link QueryType} statement kinds. */
type QueryType = (typeof QueryType)[keyof typeof QueryType];
//#endregion
//#region src/state/query.d.ts
/**
 * Root snapshot of query-builder state returned by {@link QueryBuilder.state}.
 * Arrays preserve clause order; insert/update fields apply per query kind.
 */
type QueryState = {
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
};
/** Creates a {@link QueryState} with default field values (an empty SELECT). */
declare const createQueryState: () => QueryState;
//#endregion
//#region src/parser/to-sql.d.ts
/**
 * A prepared statement and the ordered values bound to its placeholders — ready to hand
 * straight to a driver as `query(sql, params)`. For dialects that inline values into a
 * self-contained statement (e.g. MSSQL's `sp_executesql`), `params` is empty.
 */
type PreparedSql = {
  sql: string;
  params: unknown[];
};
/** Hooks the dialect can inject into the shared clause walk (e.g. MSSQL's `TOP`). */
type ToSqlOptions = {
  beforeSelectColumns?: (state: QueryState, config: Dialect, sqlHelper: SqlHelper) => void;
};
/**
 * Renders a {@link QueryState} to SQL by walking its clauses in order. Pure and
 * dialect-driven: everything dialect-specific comes from {@link Dialect} `config`, except
 * the {@link ToSqlOptions} hooks the caller threads through (MSSQL's `TOP`). Used both for
 * the outer statement and, recursively, for every nested subquery.
 */
declare const defaultToSql: (state: QueryState | undefined, config: Dialect, mode: ParserMode, options?: ToSqlOptions) => SqlHelper;
/**
 * Renders one query state as a prepared SQL string. MSSQL returns a self-contained
 * `sp_executesql`; Postgres rewrites to `$n`; the rest keep the dialect's `?` placeholder.
 */
declare const parse: (state: QueryState, config: Dialect) => string;
/**
 * Renders one query state as prepared SQL plus its ordered bound values. MSSQL inlines its
 * values into the `sp_executesql` string, so its `params` is empty.
 */
declare const parsePrepared: (state: QueryState, config: Dialect) => PreparedSql;
/**
 * Renders one query state as a raw SQL string with values inlined (MSSQL keeps its `TOP`). DEBUG /
 * TEST display only: values are inlined UNQUOTED + UNESCAPED (readable golden SQL for the parser
 * test suite), so the result is NOT execution-safe. To run a query, use `parsePrepared` (bound
 * params) — never execute `parseRaw`/`parse` output against a driver. See `SqlHelper.getSqlDebug`.
 */
declare const parseRaw: (state: QueryState, config: Dialect) => string;
/**
 * Renders a batch of query states as a single prepared SQL string. Each statement is prepared
 * independently (so placeholder numbering restarts per statement, matching running them one by
 * one). When `transactionState` is {@link MultiBuilderTransactionState.TransactionOn}, the batch
 * is wrapped in the dialect's `transactionDelimiters`.
 */
declare const parseMulti: (states: QueryState[], transactionState: MultiBuilderTransactionState, config: Dialect) => string;
/**
 * Renders a batch of query states as a single raw SQL string with values inlined. DEBUG / TEST
 * display only — NOT execution-safe (see {@link parseRaw}). Wraps in the dialect's
 * `transactionDelimiters` when `transactionState` is
 * {@link MultiBuilderTransactionState.TransactionOn}.
 */
declare const parseMultiRaw: (states: QueryState[], transactionState: MultiBuilderTransactionState, config: Dialect) => string;
//#endregion
//#region src/builder/join-on.d.ts
/**
 * Fluent builder for a JOIN's `ON` condition list — `on`/`onValue` comparisons, `onRaw`
 * fragments, `and`/`or` combinators, and parenthesized `onGroup`s. One class for every
 * dialect; {@link states} hands the accumulated conditions to the join clause parser.
 */
declare class JoinOnBuilder {
  #private;
  constructor(config: Dialect);
  and: () => this;
  on: (aliasLeft: string, columnLeft: string, joinOperator: JoinOperator, aliasRight: string, columnRight: string) => this;
  onGroup: (builder: (builder: JoinOnBuilder) => void) => this;
  onRaw: (raw: string) => this;
  onValue: (aliasLeft: string, columnLeft: string, joinOperator: JoinOperator, valueRight: any) => this;
  or: () => this;
  states: () => JoinOnState[];
}
//#endregion
//#region src/builder/query.d.ts
/**
 * The single, dialect-agnostic fluent SQL builder for SELECT / INSERT / UPDATE / DELETE.
 *
 * The injected {@link Dialect} `config` carries everything dialect-specific (quoting,
 * placeholders, default owner, `TOP`/`OFFSET` behaviour), so one class serves every
 * database. Every mutator returns `this` for chaining; subqueries are built with a private
 * same-dialect child builder and stored as nested {@link QueryState} on the clause record.
 *
 * Obtain one via a dialect entry point (e.g. `new SqliteQuery().newBuilder()`).
 */
declare class QueryBuilder {
  #private;
  constructor(config: Dialect);
  /** Returns the dialect configuration backing this builder. */
  configuration: () => Dialect;
  and: () => this;
  clearAll: () => this;
  clearFrom: () => this;
  clearGroupBy: () => this;
  clearHaving: () => this;
  clearJoin: () => this;
  clearLimit: () => this;
  clearOffset: () => this;
  clearOrderBy: () => this;
  clearSelect: () => this;
  clearWhere: () => this;
  distinct: () => this;
  fromRaw: (rawFrom: string) => this;
  fromRaws: (rawFroms: string[]) => this;
  fromTable: (tableName: string, alias: string) => this;
  fromTables: (tables: {
    tableName: string;
    alias: string;
  }[]) => this;
  fromTableWithOwner: (owner: string, tableName: string, alias: string) => this;
  fromTablesWithOwner: (tables: {
    owner: string;
    tableName: string;
    alias: string;
  }[]) => this;
  fromWithBuilder: (alias: string, builder: (builder: QueryBuilder) => void) => this;
  joinRaw: (rawJoin: string) => this;
  joinRaws: (rawJoins: string[]) => this;
  joinTable: (joinType: JoinType, tableName: string, alias: string, joinOnBuilder: (joinOnBuilder: JoinOnBuilder) => void) => this;
  joinTables: (joins: {
    joinType: JoinType;
    tableName: string;
    alias: string;
    joinOnBuilder: (joinOnBuilder: JoinOnBuilder) => void;
  }[]) => this;
  joinTablesWithOwner: (joins: {
    joinType: JoinType;
    owner: string;
    tableName: string;
    alias: string;
    joinOnBuilder: (joinOnBuilder: JoinOnBuilder) => void;
  }[]) => this;
  joinTableWithOwner: (joinType: JoinType, owner: string, tableName: string, alias: string, joinOnBuilder: (joinOnBuilder: JoinOnBuilder) => void) => this;
  joinWithBuilder: (joinType: JoinType, alias: string, builder: (builder: QueryBuilder) => void, joinOnBuilder: (joinOnBuilder: JoinOnBuilder) => void) => this;
  limit: (limit: number) => this;
  offset: (offset: number) => this;
  or: () => this;
  orderByColumn: (tableNameOrAlias: string, columnName: string, direction: OrderByDirection) => this;
  orderByColumns: (columns: {
    tableNameOrAlias: string;
    columnName: string;
    direction: OrderByDirection;
  }[]) => this;
  orderByRaw: (rawOrderBy: string) => this;
  orderByRaws: (rawOrderBys: string[]) => this;
  /** DEBUG / TEST rendering (placeholders as text). NOT execution-safe — run {@link parsePrepared}. */
  parse: () => string;
  /** The ONLY execution-safe render: parameterized SQL + ordered bound values. Use this to run. */
  parsePrepared: () => PreparedSql;
  /** DEBUG / TEST rendering with values inlined UNQUOTED. NOT execution-safe — run {@link parsePrepared}. */
  parseRaw: () => string;
  selectAll: () => this;
  selectColumn: (tableNameOrAlias: string, columnName: string, columnAlias: string) => this;
  selectColumns: (columns: {
    tableNameOrAlias: string;
    columnName: string;
    columnAlias: string;
  }[]) => this;
  selectRaw: (rawSelect: string) => this;
  selectRaws: (rawSelects: string[]) => this;
  selectWithBuilder: (alias: string, builder: (builder: QueryBuilder) => void) => this;
  state: () => QueryState;
  where: (tableNameOrAlias: string, columnName: string, whereOperator: WhereOperator, value: any) => this;
  whereBetween: (tableNameOrAlias: string, columnName: string, value1: any, value2: any) => this;
  whereExistsWithBuilder: (tableNameOrAlias: string, columnName: string, builder: (builder: QueryBuilder) => void) => this;
  whereGroup(builder: (builder: QueryBuilder) => void): this;
  whereInWithBuilder: (tableNameOrAlias: string, columnName: string, builder: (builder: QueryBuilder) => void) => this;
  whereInValues: (tableNameOrAlias: string, columnName: string, values: any[]) => this;
  whereNotExistsWithBuilder: (tableNameOrAlias: string, columnName: string, builder: (builder: QueryBuilder) => void) => this;
  whereNotInWithBuilder: (tableNameOrAlias: string, columnName: string, builder: (builder: QueryBuilder) => void) => this;
  whereNotInValues: (tableNameOrAlias: string, columnName: string, values: any[]) => this;
  whereNotNull: (tableNameOrAlias: string, columnName: string) => this;
  whereNull: (tableNameOrAlias: string, columnName: string) => this;
  whereRaw: (rawWhere: string) => this;
  whereRaws: (rawWheres: string[]) => this;
  groupByColumn: (tableNameOrAlias: string, columnName: string) => this;
  groupByColumns: (columns: {
    tableNameOrAlias: string;
    columnName: string;
  }[]) => this;
  groupByRaw: (rawGroupBy: string) => this;
  groupByRaws: (rawGroupBys: string[]) => this;
  having: (tableNameOrAlias: string, columnName: string, whereOperator: WhereOperator, value: any) => this;
  havingRaw: (rawHaving: string) => this;
  havingRaws: (rawHavings: string[]) => this;
  insertInto: (tableName: string) => this;
  insertIntoWithOwner: (owner: string, tableName: string) => this;
  insertColumns: (columns: string[]) => this;
  insertValues: (values: any[]) => this;
  insertRaw: (raw: string) => this;
  updateTable: (tableName: string, alias: string) => this;
  updateTableWithOwner: (owner: string, tableName: string, alias: string) => this;
  set: (columnName: string, value: any) => this;
  setColumns: (columns: {
    columnName: string;
    value: any;
  }[]) => this;
  setRaw: (raw: string) => this;
  deleteFrom: (tableName: string, alias: string) => this;
  deleteFromWithOwner: (owner: string, tableName: string, alias: string) => this;
  union: (builder: (builder: QueryBuilder) => void) => this;
  unionAll: (builder: (builder: QueryBuilder) => void) => this;
  intersect: (builder: (builder: QueryBuilder) => void) => this;
  except: (builder: (builder: QueryBuilder) => void) => this;
  cte: (name: string, builder: (builder: QueryBuilder) => void) => this;
  cteRecursive: (name: string, builder: (builder: QueryBuilder) => void) => this;
  cteRaw: (name: string, raw: string) => this;
  /** Removes a previously set `TOP` limit from builder state (MSSQL). */
  clearTop: () => this;
  /** Sets the `TOP` row limit for the generated `SELECT` (MSSQL; ignored by other dialects). */
  top: (top: number) => this;
}
//#endregion
//#region src/builder/multi-builder.d.ts
/**
 * Composes multiple {@link QueryBuilder} statements into a single SQL string, optionally wrapped
 * in a transaction. Obtain one from a dialect entry point (e.g.
 * `new PostgresQuery().newMultiBuilder()`) rather than constructing directly. Named builders can
 * be removed or reordered before rendering.
 */
declare class MultiBuilder {
  #private;
  constructor(config: Dialect);
  /** Adds a named builder to the batch and returns it for configuration. */
  addBuilder: (builderName: string) => QueryBuilder;
  /** Renders the batch as a single prepared SQL string (transaction-wrapped when enabled). */
  parse: () => string;
  /** Renders the batch as a single raw SQL string with values inlined. DEBUG / TEST only. */
  parseRaw: () => string;
  /**
   * The execution-safe form of the batch: each builder rendered as its own prepared
   * `{ sql, params }`, in batch order. This — not {@link parse} — is what you run: a batch is
   * executed statement by statement, because placeholder numbering restarts per statement (so the
   * single {@link parse} string is not a runnable parameterized call), and {@link parse}/{@link
   * parseRaw} carry no bound values at all. Open a transaction on your own connection, run each in
   * order, and consult {@link transactionState} to decide whether to wrap them in BEGIN/COMMIT — the
   * delimiters are NOT included here.
   */
  preparedStatements: () => PreparedSql[];
  /** Removes a previously added builder from the batch by name. */
  removeBuilder: (builderName: string) => void;
  /**
   * Reorders the batch to match the given builder names; names not present are dropped and
   * repeated names are deduplicated (first occurrence wins).
   */
  reorderBuilders: (builderNames: string[]) => void;
  /** Sets whether the batch is wrapped in a transaction. */
  setTransactionState: (transactionState: MultiBuilderTransactionState) => void;
  /** Returns the {@link QueryState} of every builder in the batch, in order. */
  states: () => QueryState[];
  /** Returns the current transaction state of the batch. */
  transactionState: () => MultiBuilderTransactionState;
}
//#endregion
//#region src/enums/parser-area.d.ts
/**
 * Indicates which SQL clause produced a parser error for clearer diagnostics.
 */
declare const ParserArea: {
  /** SELECT list or projections. */
  readonly Select: "Select";
  /** FROM clause. */
  readonly From: "From";
  /** JOIN definitions. */
  readonly Join: "Join";
  /** WHERE clause. */
  readonly Where: "Where";
  /** ORDER BY clause. */
  readonly OrderBy: "OrderBy";
  /** LIMIT, OFFSET, FETCH, TOP, etc. */
  readonly LimitOffset: "LimitOffset";
  /** Cross-clause or unspecified area. */
  readonly General: "General";
};
/** One of the {@link ParserArea} clause identifiers. */
type ParserArea = (typeof ParserArea)[keyof typeof ParserArea];
//#endregion
//#region src/helpers/identifier.d.ts
/**
 * Quote a SQL identifier (schema/table/column/alias) for a dialect, escaping any embedded closing
 * delimiter by doubling it — the standard SQL identifier escape (`]`→`]]` for MSSQL, `"`→`""` for
 * Postgres, `` ` ``→ ` `` ` for MySQL). Identifier names are user-controlled (a dataset's table and
 * column names), so without escaping a name like `x] OR [1=1` would break out of the quoting and
 * inject SQL. A NUL byte can silently truncate the identifier in some drivers, so it is rejected.
 */
declare function quoteIdentifier(name: string | undefined, delimiters: ConfigurationDelimiters): string;
//#endregion
//#region src/helpers/parser-error.d.ts
/** Error thrown when SQL parsing fails; {@link ParserError.name} is `QueryParserError`. */
declare class ParserError extends Error {
  /**
   * @param parserArea - Phase or region of the parser where the error occurred.
   * @param message - Human-readable parse error description.
   */
  constructor(parserArea: ParserArea, message: string);
}
//#endregion
//#region src/dialects/mssql/configuration.d.ts
/**
 * The Microsoft SQL Server {@link Dialect}: bracket identifiers, `?` placeholders, `dbo` schema.
 *
 * @param rc - Runtime options (e.g. row limits) bound to the returned dialect.
 */
declare const mssqlConfiguration: (rc?: RuntimeConfiguration) => Dialect;
//#endregion
//#region src/dialects/mssql/query.d.ts
/** Main entry point for Microsoft SQL Server: produces {@link QueryBuilder}s bound to the MSSQL dialect. */
declare class MssqlQuery {
  #private;
  /** @param rc - Optional runtime options; defaults to a new {@link RuntimeConfiguration} when omitted. */
  constructor(rc?: RuntimeConfiguration);
  /** Returns the shared MSSQL dialect configuration for this instance. */
  configuration: () => Dialect;
  /** Creates a query builder, optionally with a one-off {@link RuntimeConfiguration}. */
  newBuilder: (rc?: RuntimeConfiguration) => QueryBuilder;
  /** Creates a multi-statement builder for batching statements, optionally in a transaction. */
  newMultiBuilder: (rc?: RuntimeConfiguration) => MultiBuilder;
}
//#endregion
//#region src/dialects/mysql/configuration.d.ts
/**
 * The MySQL {@link Dialect}: backtick identifiers, `?` placeholders, no default owner.
 *
 * @param rc - Runtime options (e.g. row limits) bound to the returned dialect.
 */
declare const mysqlConfiguration: (rc?: RuntimeConfiguration) => Dialect;
//#endregion
//#region src/dialects/mysql/query.d.ts
/** Main entry point for MySQL: produces {@link QueryBuilder}s bound to the MySQL dialect. */
declare class MysqlQuery {
  #private;
  /** @param rc - Optional runtime options; defaults to a new {@link RuntimeConfiguration} when omitted. */
  constructor(rc?: RuntimeConfiguration);
  /** Returns the shared MySQL dialect configuration for this instance. */
  configuration: () => Dialect;
  /** Creates a query builder, optionally with a one-off {@link RuntimeConfiguration}. */
  newBuilder: (rc?: RuntimeConfiguration) => QueryBuilder;
  /** Creates a multi-statement builder for batching statements, optionally in a transaction. */
  newMultiBuilder: (rc?: RuntimeConfiguration) => MultiBuilder;
}
//#endregion
//#region src/dialects/postgres/configuration.d.ts
/**
 * The PostgreSQL {@link Dialect}: double-quoted identifiers, `$` placeholders, `public` schema.
 *
 * @param rc - Runtime options (e.g. row limits) bound to the returned dialect.
 */
declare const postgresConfiguration: (rc?: RuntimeConfiguration) => Dialect;
//#endregion
//#region src/dialects/postgres/query.d.ts
/** Main entry point for PostgreSQL: produces {@link QueryBuilder}s bound to the Postgres dialect. */
declare class PostgresQuery {
  #private;
  /** @param rc - Optional runtime options; defaults to a new {@link RuntimeConfiguration} when omitted. */
  constructor(rc?: RuntimeConfiguration);
  /** Returns the shared PostgreSQL dialect configuration for this instance. */
  configuration: () => Dialect;
  /** Creates a query builder, optionally with a one-off {@link RuntimeConfiguration}. */
  newBuilder: (rc?: RuntimeConfiguration) => QueryBuilder;
  /** Creates a multi-statement builder for batching statements, optionally in a transaction. */
  newMultiBuilder: (rc?: RuntimeConfiguration) => MultiBuilder;
}
//#endregion
//#region src/dialects/sqlite/configuration.d.ts
/**
 * The SQLite {@link Dialect}: double-quoted identifiers, `?` placeholders, no default owner.
 *
 * @param rc - Runtime options (e.g. row limits) bound to the returned dialect.
 */
declare const sqliteConfiguration: (rc?: RuntimeConfiguration) => Dialect;
//#endregion
//#region src/dialects/sqlite/query.d.ts
/** Main entry point for SQLite: produces {@link QueryBuilder}s bound to the SQLite dialect. */
declare class SqliteQuery {
  #private;
  /** @param rc - Optional runtime options; defaults to a new {@link RuntimeConfiguration} when omitted. */
  constructor(rc?: RuntimeConfiguration);
  /** Returns the shared SQLite dialect configuration for this instance. */
  configuration: () => Dialect;
  /** Creates a query builder, optionally with a one-off {@link RuntimeConfiguration}. */
  newBuilder: (rc?: RuntimeConfiguration) => QueryBuilder;
  /** Creates a multi-statement builder for batching statements, optionally in a transaction. */
  newMultiBuilder: (rc?: RuntimeConfiguration) => MultiBuilder;
}
//#endregion
export { BuilderType, ConfigurationDelimiters, CteState, DatabaseType, Dialect, FromState, GroupByState, HavingState, InsertState, JoinOnBuilder, JoinOnOperator, JoinOnState, JoinOperator, JoinState, JoinType, MssqlQuery, MultiBuilder, MultiBuilderTransactionState, MysqlQuery, OrderByDirection, OrderByState, ParserArea, ParserError, PostgresQuery, PreparedSql, QueryBuilder, QueryState, QueryType, RuntimeConfiguration, SelectState, SqliteQuery, ToSqlOptions, UnionState, UpdateState, WhereOperator, WhereState, createCteState, createFromState, createGroupByState, createHavingState, createInsertState, createJoinOnState, createJoinState, createOrderByState, createQueryState, createSelectState, createUnionState, createUpdateState, createWhereState, defaultToSql, mssqlConfiguration, mysqlConfiguration, parse, parseMulti, parseMultiRaw, parsePrepared, parseRaw, postgresConfiguration, quoteIdentifier, sqliteConfiguration };
//# sourceMappingURL=index.d.mts.map