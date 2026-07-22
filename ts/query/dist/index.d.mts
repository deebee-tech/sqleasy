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
//#region src/enums/call-return-intent.d.ts
/**
 * What a {@link QueryBuilder.callFunction} call is expected to return, which decides whether
 * Postgres/MSSQL wrap the invocation in `SELECT expr` (a single scalar) or `SELECT * FROM expr`
 * (a set-returning / table-valued function). MySQL has no table-valued functions and refuses
 * {@link ResultSet}.
 */
declare const CallReturnIntent: {
  /** No return value. Only meaningful for procedures — never valid for {@link QueryBuilder.callFunction}. */
  readonly Void: "Void";
  /** A single scalar value: `SELECT name(...)`. */
  readonly Scalar: "Scalar";
  /** A set-returning / table-valued function: `SELECT * FROM name(...)`. */
  readonly ResultSet: "ResultSet";
};
/** One of the {@link CallReturnIntent} values. */
type CallReturnIntent = (typeof CallReturnIntent)[keyof typeof CallReturnIntent];
//#endregion
//#region src/enums/full-text-mode.d.ts
/**
 * Full-text search match mode — not every dialect supports every mode; unsupported combos throw
 * at parse time.
 */
declare const FullTextMode: {
  /** Natural-language / plain search (PG `plainto_tsquery`, MySQL natural mode, MSSQL `FREETEXT`). */
  readonly Natural: "Natural";
  /** Boolean / structured query (PG `to_tsquery`, MySQL boolean mode, MSSQL `CONTAINS`). */
  readonly Boolean: "Boolean";
  /** Phrase search where the dialect distinguishes it (MySQL `IN BOOLEAN MODE` phrase, PG phrase). */
  readonly Phrase: "Phrase";
};
/** One of the {@link FullTextMode} values. */
type FullTextMode = (typeof FullTextMode)[keyof typeof FullTextMode];
//#endregion
//#region src/enums/json-extract-mode.d.ts
/**
 * Whether a JSON path read returns text (`->>` / `JSON_UNQUOTE`) or a JSON value (`->` /
 * `JSON_EXTRACT`).
 */
declare const JsonExtractMode: {
  /** Text extraction (`->>` on Postgres, `JSON_UNQUOTE(JSON_EXTRACT(...))` elsewhere). */
  readonly Text: "Text";
  /** JSON value extraction (`->` on Postgres, `JSON_EXTRACT` elsewhere). */
  readonly Object: "Object";
};
/** One of the {@link JsonExtractMode} values. */
type JsonExtractMode = (typeof JsonExtractMode)[keyof typeof JsonExtractMode];
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
  /** LATERAL derived table (Postgres/MySQL `JOIN LATERAL`; MSSQL maps to `CROSS APPLY`). */
  readonly Lateral: "Lateral";
  /** MSSQL `CROSS APPLY` (Postgres/MySQL: `CROSS JOIN LATERAL`). */
  readonly CrossApply: "CrossApply";
  /** MSSQL `OUTER APPLY` (Postgres/MySQL: `LEFT JOIN LATERAL`). */
  readonly OuterApply: "OuterApply";
  /** No join type / not applicable. */
  readonly None: "None";
};
/** One of the {@link JoinType} kinds. */
type JoinType = (typeof JoinType)[keyof typeof JoinType];
//#endregion
//#region src/enums/nulls-order.d.ts
/**
 * `NULLS FIRST` / `NULLS LAST` placement for an ORDER BY term (top-level or inside a window's
 * `OVER (... ORDER BY ...)`). Postgres and SQLite have native syntax; MySQL and MSSQL have
 * neither, and get an equivalent `CASE WHEN col IS NULL THEN … END` sort-key emulation — see
 * `default-order-by.ts`.
 */
declare const NullsOrder: {
  /** No explicit NULL placement — dialect default (NULLS LAST for ASC, NULLS FIRST for DESC, per SQL:2003). */
  readonly None: "None";
  /** NULLs sort before all non-NULL values. */
  readonly First: "First";
  /** NULLs sort after all non-NULL values. */
  readonly Last: "Last";
};
/** One of the {@link NullsOrder} placements. */
type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder];
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
  /**
   * Literal substring match — `LIKE %value% ESCAPE …` with the LIKE metacharacters (`%`, `_`, and
   * MSSQL's `[`) in the bound value ESCAPED, so a search for `50%` matches the literal string, not
   * "anything starting 50". The value is the raw text to find; the wildcards are added here. Unlike
   * {@link Like}, the caller does NOT supply wildcards.
   */
  readonly Contains: "Contains";
  /** Negated literal substring match (`NOT LIKE %value%`, escaped) — see {@link Contains}. */
  readonly NotContains: "NotContains";
  /** Literal prefix match (`LIKE value% ESCAPE …`, escaped) — see {@link Contains}. */
  readonly StartsWith: "StartsWith";
  /** Literal suffix match (`LIKE %value ESCAPE …`, escaped) — see {@link Contains}. */
  readonly EndsWith: "EndsWith";
  /**
   * Case-insensitive pattern match. Native `ILIKE` on Postgres; on MySQL, SQLite, and MSSQL
   * (none of which have `ILIKE`) it is rewritten to `LOWER(col) LIKE LOWER(?)`.
   */
  readonly Ilike: "Ilike";
  /** Negated case-insensitive pattern match — see {@link WhereOperator.Ilike}. */
  readonly NotIlike: "NotIlike";
  /**
   * Regular-expression match. Native `~` on Postgres and `REGEXP` on MySQL (where case sensitivity is
   * collation-driven — the default utf8mb4 collation is case-insensitive). SQLite (`REGEXP` needs an
   * app-registered function) and MSSQL (no regex engine before SQL Server 2025) have no built-in
   * operator and THROW. The bound value is the pattern.
   */
  readonly Regex: "Regex";
  /** Negated regular-expression match — see {@link Regex}. */
  readonly NotRegex: "NotRegex";
  /** Case-insensitive regular-expression match. Native `~*` on Postgres; on MySQL it is the same as
   * {@link Regex} (case sensitivity is collation-driven, not operator-driven). SQLite/MSSQL throw. */
  readonly Iregex: "Iregex";
  /** Negated case-insensitive regular-expression match — see {@link Iregex}. */
  readonly NotIregex: "NotIregex";
  /**
   * Null-safe inequality: true unless both sides are equal, treating two `NULL`s as equal
   * (unlike `<>`, which is `NULL` — never true — whenever either side is `NULL`). Native `IS
   * DISTINCT FROM` on Postgres/SQLite; MySQL rewrites to `NOT (a <=> b)`; MSSQL (no native
   * operator) rewrites to `(col <> value OR col IS NULL)`, or `col IS NOT NULL` for a NULL value.
   */
  readonly IsDistinctFrom: "IsDistinctFrom";
  /**
   * Null-safe equality: true when both sides are equal OR both are `NULL` (unlike `=`, which is
   * `NULL` whenever either side is `NULL`). Native `IS NOT DISTINCT FROM` on Postgres/SQLite;
   * MySQL rewrites to its native `<=>` operator; MSSQL (no native operator) rewrites to `col =
   * value`, or `col IS NULL` for a NULL value — sound because the compared value is always a bound literal.
   */
  readonly IsNotDistinctFrom: "IsNotDistinctFrom";
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
//#region src/enums/hint-kind.d.ts
/**
 * Structured query-hint kinds. Each dialect accepts a different subset; unsupported combos throw
 * at parse time. Use {@link QueryBuilder.hintRaw} for hints this enum cannot express.
 */
declare const HintKind: {
  /** MySQL `USE INDEX (name)` on a FROM/JOIN table reference. */
  readonly UseIndex: "UseIndex";
  /** MySQL `FORCE INDEX (name)` on a FROM/JOIN table reference. */
  readonly ForceIndex: "ForceIndex";
  /** MSSQL trailing `OPTION (...)` clause on a SELECT. */
  readonly MssqlOption: "MssqlOption";
  /** Dialect-specific raw hint SQL — caller owns correctness. */
  readonly Raw: "Raw";
};
/** One of the {@link HintKind} values. */
type HintKind = (typeof HintKind)[keyof typeof HintKind];
//#endregion
//#region src/state/hint.d.ts
/**
 * One structured or raw query hint. Populated by the builder; exposed via
 * {@link QueryState.hintStates}.
 */
type HintState = {
  /** Which hint shape to emit. */
  kind: HintKind;
  /** Table name or alias the index hint applies to (MySQL index hints). */
  tableNameOrAlias: string | undefined;
  /** Index name for `USE INDEX` / `FORCE INDEX`. */
  indexName: string | undefined;
  /** Option text for MSSQL `OPTION (...)` (without the wrapping `OPTION`). */
  optionText: string | undefined;
  /** Raw hint SQL when {@link kind} is {@link HintKind.Raw}. */
  raw: string | undefined;
};
/** Creates a {@link HintState} with default field values. */
declare const createHintState: () => HintState;
//#endregion
//#region src/enums/call-kind.d.ts
/**
 * Whether a {@link QueryBuilder.callProcedure}/{@link QueryBuilder.callFunction} invocation
 * targets a stored procedure or a stored function — the two are emitted differently on every
 * dialect (a `CALL`/`EXEC` statement vs. an expression usable in a `SELECT`).
 */
declare const CallKind: {
  /** A stored procedure, invoked as its own statement (`CALL name(...)` / `EXEC name ...`). */
  readonly Procedure: "Procedure";
  /** A stored function, invoked as a `SELECT` expression (`SELECT name(...)`). */
  readonly Function: "Function";
};
/** One of the {@link CallKind} values. */
type CallKind = (typeof CallKind)[keyof typeof CallKind];
//#endregion
//#region src/enums/call-param-direction.d.ts
/**
 * The calling convention for one {@link QueryBuilder.callProcedure}/{@link
 * QueryBuilder.callFunction} argument. OUT/INOUT are meaningful only for procedures — see {@link
 * QueryBuilder.procParamOut}/{@link QueryBuilder.procParamInOut}.
 */
declare const CallParamDirection: {
  /** An input value, bound like any other parameter. */
  readonly In: "In";
  /** An output-only slot (MSSQL: a declared local variable; MySQL: a session variable). */
  readonly Out: "Out";
  /** Both an input value and an output slot. */
  readonly InOut: "InOut";
};
/** One of the {@link CallParamDirection} values. */
type CallParamDirection = (typeof CallParamDirection)[keyof typeof CallParamDirection];
//#endregion
//#region src/state/call.d.ts
/**
 * One argument to a {@link QueryBuilder.callProcedure}/{@link QueryBuilder.callFunction} call.
 *
 * `name` is dual-purpose, matching how the underlying SQL actually spells a named argument. For
 * {@link CallParamDirection.In} it is the *named-argument key* — Postgres (`name := value`) and
 * MSSQL (`@name = value`) match it against the routine's own declared parameter name; MySQL has
 * no named-argument syntax and refuses it. For {@link CallParamDirection.Out}/{@link
 * CallParamDirection.InOut} it is instead the *variable identifier*: the MSSQL local variable
 * `DECLARE @name ...` declares, or the MySQL session variable `@name` references — required on
 * both, and by convention the same name as the routine's own parameter. Postgres has no variables
 * at all (an OUT value simply comes back as a result column of the `CALL`), so `name` there is
 * always just the named-argument key, and may be omitted.
 */
type CallParamState = {
  /** Calling convention: bound input, output-only, or both. */
  direction: CallParamDirection;
  /** See the type-level doc above — meaning depends on `direction` and dialect. */
  name: string | undefined;
  /** Bound value for `In`/`InOut`; ignored (no value to supply) for `Out`. */
  value: any;
  /** Declared T-SQL type for an MSSQL OUT/INOUT variable (e.g. `'INT'`); required there only. */
  sqlType: string | undefined;
  /** Raw SQL argument expression, emitted verbatim — mutually exclusive with `value`. */
  raw: string | undefined;
};
/**
 * Holds state for a {@link QueryBuilder.callProcedure}/{@link QueryBuilder.callFunction}
 * statement. Populated by the builder; exposed via {@link QueryState.callState}.
 */
type CallState = {
  /** Procedure (`CALL`/`EXEC`) or function (`SELECT` expression). */
  kind: CallKind;
  /** Schema/owner the routine lives in; `undefined`/`''` omits it. */
  owner: string | undefined;
  /** The routine name. */
  name: string;
  /** For functions: scalar vs. set-returning invocation. Unused for procedures. */
  returnIntent: CallReturnIntent;
  /** Arguments in declaration order. */
  params: CallParamState[];
};
/** Creates a {@link CallState} with default field values. */
declare const createCallState: () => CallState;
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
  /** FROM table-valued function / set-returning function call. */
  readonly FromFunction: "FromFunction";
  /** FROM LATERAL derived table. */
  readonly FromLateral: "FromLateral";
  /** GROUP BY on a column reference. */
  readonly GroupByColumn: "GroupByColumn";
  /** GROUP BY using raw SQL. */
  readonly GroupByRaw: "GroupByRaw";
  /** GROUP BY ROLLUP (...). */
  readonly GroupByRollup: "GroupByRollup";
  /** GROUP BY CUBE (...). */
  readonly GroupByCube: "GroupByCube";
  /** GROUP BY GROUPING SETS (...). */
  readonly GroupByGroupingSets: "GroupByGroupingSets";
  /** HAVING condition (standard form). */
  readonly Having: "Having";
  /** HAVING clause using raw SQL. */
  readonly HavingRaw: "HavingRaw";
  /** HAVING column BETWEEN low AND high. */
  readonly HavingBetween: "HavingBetween";
  /** Opens a parenthesized HAVING group. */
  readonly HavingGroupBegin: "HavingGroupBegin";
  /** Nested HAVING built from a sub-builder. */
  readonly HavingGroupBuilder: "HavingGroupBuilder";
  /** Closes a parenthesized HAVING group. */
  readonly HavingGroupEnd: "HavingGroupEnd";
  /** HAVING EXISTS (subquery from builder). */
  readonly HavingExistsBuilder: "HavingExistsBuilder";
  /** HAVING IN (subquery from builder). */
  readonly HavingInBuilder: "HavingInBuilder";
  /** HAVING IN (literal value list). */
  readonly HavingInValues: "HavingInValues";
  /** HAVING NOT EXISTS (subquery from builder). */
  readonly HavingNotExistsBuilder: "HavingNotExistsBuilder";
  /** HAVING NOT IN (subquery from builder). */
  readonly HavingNotInBuilder: "HavingNotInBuilder";
  /** HAVING NOT IN (literal value list). */
  readonly HavingNotInValues: "HavingNotInValues";
  /** HAVING column IS NOT NULL. */
  readonly HavingNotNull: "HavingNotNull";
  /** HAVING column IS NULL. */
  readonly HavingNull: "HavingNull";
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
  /** SELECT list entry for a window function (`fn(...) OVER (...)`). */
  readonly SelectWindow: "SelectWindow";
  /** SELECT list JSON path extraction. */
  readonly SelectJsonExtract: "SelectJsonExtract";
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
  /** WHERE JSON path extract comparison. */
  readonly WhereJsonExtract: "WhereJsonExtract";
  /** WHERE JSON containment (`@>` / `JSON_CONTAINS`). */
  readonly WhereJsonContains: "WhereJsonContains";
  /** WHERE full-text search predicate. */
  readonly WhereFullText: "WhereFullText";
  /** HAVING JSON path extract comparison. */
  readonly HavingJsonExtract: "HavingJsonExtract";
  /** HAVING JSON containment. */
  readonly HavingJsonContains: "HavingJsonContains";
  /** HAVING full-text search predicate. */
  readonly HavingFullText: "HavingFullText";
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
  /** Optional explicit column list: `WITH name (col1, col2) AS (...)`. Empty omits it. */
  columns: string[];
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
 * Holds state for one FROM source (table, subquery, lateral, table function, or raw).
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
  /** Table-valued / set-returning function name when {@link builderType} is {@link BuilderType.FromFunction}. */
  functionName?: string;
  /** Positional arguments for a table-valued function. */
  functionParams?: any[];
};
/** Creates a {@link FromState} with default field values. */
declare const createFromState: () => FromState;
//#endregion
//#region src/state/group-by.d.ts
/** One column reference inside a GROUP BY modifier (`ROLLUP`/`CUBE`/`GROUPING SETS`). */
type GroupByColumnRef = {
  tableNameOrAlias: string;
  columnName: string;
};
/**
 * Holds state for one GROUP BY expression (column, raw, or modifier).
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
  /** Column sets for {@link BuilderType.GroupByGroupingSets}. */
  groupingSets?: GroupByColumnRef[][];
};
/** Creates a {@link GroupByState} with default field values. */
declare const createGroupByState: () => GroupByState;
//#endregion
//#region src/state/where.d.ts
/** Column reference for a multi-column full-text predicate. */
type FullTextColumnRef = {
  tableNameOrAlias: string;
  columnName: string;
};
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
  /** JSON path segment or JSONPath string for JSON predicates. */
  jsonPath?: string;
  /** Text vs JSON-object extraction for JSON predicates. */
  jsonExtractMode?: JsonExtractMode;
  /** Full-text match mode. */
  fullTextMode?: FullTextMode;
  /** Columns searched by a full-text predicate. */
  fullTextColumns?: FullTextColumnRef[];
};
/** Creates a {@link WhereState} with default field values. */
declare const createWhereState: () => WhereState;
//#endregion
//#region src/state/having.d.ts
/**
 * Holds state for one HAVING predicate (same shape as WHERE, including subqueries).
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
  /** Nested query state when the RHS is a subquery (IN/EXISTS/group). */
  subquery: QueryState | undefined;
  /** Bound parameter values associated with this predicate. */
  values: any[];
  jsonPath?: string;
  jsonExtractMode?: JsonExtractMode;
  fullTextMode?: FullTextMode;
  fullTextColumns?: FullTextColumnRef[];
};
/** Creates a {@link HavingState} with default field values. */
declare const createHavingState: () => HavingState;
//#endregion
//#region src/state/insert.d.ts
/**
 * Holds state for an INSERT: target table, columns, and either row value sets or a SELECT
 * source. Populated by the builder; exposed via {@link QueryState.insertState}.
 */
type InsertState = {
  /** Schema or database owner qualifier for the target table. */
  owner: string | undefined;
  /** Target table name. */
  tableName: string | undefined;
  /** Column names for the INSERT column list. */
  columns: string[];
  /** One inner array per row; values align with {@link InsertState.columns}. Mutually exclusive with {@link selectSubquery}. */
  values: any[][];
  /**
   * `INSERT ... SELECT` source query, when set instead of {@link values}. Mutually exclusive
   * with `values` — a builder that sets both throws at parse time.
   */
  selectSubquery: QueryState | undefined;
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
  /** `ON column IN (values)` — see {@link JoinOnBuilder.onIn}. */
  readonly InValues: "InValues";
  /** `ON column NOT IN (values)` — see {@link JoinOnBuilder.onNotIn}. */
  readonly NotInValues: "NotInValues";
  /** `ON column BETWEEN low AND high` — see {@link JoinOnBuilder.onBetween}. */
  readonly Between: "Between";
  /** `ON column NOT BETWEEN low AND high` — see {@link JoinOnBuilder.onNotBetween}. */
  readonly NotBetween: "NotBetween";
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
  /** Pattern match (LIKE) — usable in both `on` (column-to-column) and `onValue` (column-to-value). */
  readonly Like: "Like";
  /** Negated pattern match (NOT LIKE). */
  readonly NotLike: "NotLike";
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
  /** Right-hand value when the RHS is a literal or parameter (`onValue`). */
  valueRight: any | undefined;
  /** Right-hand value list for `onIn`/`onNotIn` (any length) or `onBetween`/`onNotBetween` (exactly two). */
  valuesRight: any[] | undefined;
};
/** Creates a {@link JoinOnState} with default field values. */
declare const createJoinOnState: () => JoinOnState;
//#endregion
//#region src/state/merge.d.ts
/**
 * A right-hand-side expression in a MERGE `SET` assignment or `INSERT ... VALUES` list.
 *
 * MERGE is unusual in that the RHS is almost always a reference to the *source* row
 * (`source.col`), not a bound literal — which is why this is a tagged type rather than a plain
 * `value: any`. Making `source(...)` the natural spelling keeps the surface honest about how a
 * MERGE is actually written; `value(...)` is the escape for a genuine bound literal.
 */
type MergeExpr = {
  kind: 'source';
  columnName: string;
} | {
  kind: 'target';
  columnName: string;
} | {
  kind: 'value';
  value: any;
} | {
  kind: 'raw';
  sql: string;
};
/** How the MERGE `USING` source is expressed. */
type MergeUsing = {
  kind: 'values';
  alias: string;
  columns: string[];
  rows: any[][];
} | {
  kind: 'table';
  owner: string | undefined;
  table: string;
  alias: string;
} | {
  kind: 'select';
  alias: string;
  subquery: unknown;
} | {
  kind: 'raw';
  alias: string;
  sql: string;
};
/** One SET assignment inside a WHEN … THEN UPDATE arm. */
type MergeAssignment = {
  columnName: string;
  value: MergeExpr;
};
/** The action taken by one WHEN clause. */
type MergeWhenAction = {
  kind: 'update';
  assignments: MergeAssignment[];
  raw: string | undefined;
} | {
  kind: 'delete';
} | {
  kind: 'insert';
  columns: string[];
  values: MergeExpr[];
} | {
  kind: 'insertDefaultValues';
};
/** Which side of the match a WHEN clause fires on. */
type MergeWhenMatch = 'matched' | 'notMatchedByTarget' | 'notMatchedBySource';
/** One WHEN clause of a MERGE, in author order. */
type MergeWhenState = {
  match: MergeWhenMatch;
  /** Optional `AND <condition>` guard, rendered with {@link renderJoinOnConditions}. */
  and: JoinOnState[] | undefined;
  action: MergeWhenAction;
};
/**
 * State for a T-SQL `MERGE` statement. MERGE is native T-SQL only; the parser refuses it on every
 * other dialect. This is a first-class statement, NOT an INSERT carrying an upsert clause — that
 * conflation is precisely the "upsert wearing MERGE's name" that was removed.
 */
type MergeState = {
  targetOwner: string | undefined;
  targetTable: string | undefined;
  targetAlias: string;
  /** `WITH (HOLDLOCK)` on the target. `undefined` means the caller did not decide either way. */
  holdlock: boolean | undefined;
  using: MergeUsing | undefined;
  /** `ON <merge_search_condition>` — required. */
  onStates: JoinOnState[];
  /** WHEN clauses in author order. */
  whenStates: MergeWhenState[];
  /** Raw `OUTPUT` result-set expression, e.g. `$action, inserted.id, deleted.status`. */
  outputRaw: string | undefined;
};
/** Creates a {@link MergeState} with default field values. */
declare const createMergeState: () => MergeState;
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
  /** `NULLS FIRST`/`NULLS LAST` placement; `None` omits it (dialect default). Ignored for `raw`. */
  nulls: NullsOrder;
  /** Raw SQL for this ORDER BY term when not using structured fields. */
  raw: string | undefined;
};
/** Creates an {@link OrderByState} with default field values. */
declare const createOrderByState: () => OrderByState;
//#endregion
//#region src/state/returning.d.ts
/**
 * Holds state for a RETURNING (PG/SQLite) or OUTPUT (MSSQL) clause on INSERT/UPDATE/DELETE.
 * Populated by the builder; exposed via {@link QueryState.returningState}.
 */
type ReturningState = {
  /** Columns to return, unqualified (dialect-specific prefixing is applied by the parser). */
  columns: string[];
  /** Raw SQL for the returned column list when not using structured fields. */
  raw: string | undefined;
};
/** Creates a {@link ReturningState} with default field values. */
declare const createReturningState: () => ReturningState;
//#endregion
//#region src/enums/row-lock-mode.d.ts
/**
 * The row-locking mode requested for a SELECT (`FOR UPDATE` / `FOR SHARE` and MSSQL's
 * table-hint equivalents).
 */
declare const RowLockMode: {
  /** No row lock requested. */
  readonly None: "None";
  /** Exclusive row lock — blocks other writers (`FOR UPDATE`, MSSQL `WITH (UPDLOCK, ROWLOCK)`). */
  readonly ForUpdate: "ForUpdate";
  /** Shared row lock — blocks writers, allows other readers (`FOR SHARE`, MSSQL `WITH (HOLDLOCK, ROWLOCK)`). */
  readonly ForShare: "ForShare";
};
/** One of the {@link RowLockMode} values. */
type RowLockMode = (typeof RowLockMode)[keyof typeof RowLockMode];
//#endregion
//#region src/enums/row-lock-wait.d.ts
/**
 * Wait behavior for a {@link RowLockMode}, when the requested rows are already locked.
 */
declare const RowLockWait: {
  /** Block until the lock is available (the dialect's default wait behavior). */
  readonly Default: "Default";
  /** Fail immediately instead of waiting (`NOWAIT`). */
  readonly Nowait: "Nowait";
  /** Silently skip already-locked rows instead of waiting (`SKIP LOCKED`, MSSQL `READPAST`). */
  readonly SkipLocked: "SkipLocked";
};
/** One of the {@link RowLockWait} values. */
type RowLockWait = (typeof RowLockWait)[keyof typeof RowLockWait];
//#endregion
//#region src/state/row-lock.d.ts
/**
 * Holds state for a SELECT's row-locking clause (`FOR UPDATE`/`FOR SHARE`, or MSSQL's
 * `WITH (...)` table-hint equivalent). Populated by the builder; exposed via
 * {@link QueryState.rowLock}.
 */
type RowLockState = {
  /** Which lock strength to request. */
  mode: RowLockMode;
  /** How to behave when the requested rows are already locked. */
  wait: RowLockWait;
};
/** Creates a {@link RowLockState} with default field values. */
declare const createRowLockState: () => RowLockState;
//#endregion
//#region src/enums/frame-bound-type.d.ts
/**
 * One endpoint of a window function's frame clause (`ROWS`/`RANGE BETWEEN ... AND ...`).
 */
declare const FrameBoundType: {
  /** `UNBOUNDED PRECEDING` — the frame's start, extending to the first row of the partition. */
  readonly UnboundedPreceding: "UnboundedPreceding";
  /** `N PRECEDING` — offset rows/range before the current row; see the bound's `offset`. */
  readonly Preceding: "Preceding";
  /** `CURRENT ROW`. */
  readonly CurrentRow: "CurrentRow";
  /** `N FOLLOWING` — offset rows/range after the current row; see the bound's `offset`. */
  readonly Following: "Following";
  /** `UNBOUNDED FOLLOWING` — the frame's end, extending to the last row of the partition. */
  readonly UnboundedFollowing: "UnboundedFollowing";
};
/** One of the {@link FrameBoundType} endpoints. */
type FrameBoundType = (typeof FrameBoundType)[keyof typeof FrameBoundType];
//#endregion
//#region src/enums/frame-unit.d.ts
/**
 * The unit a window function's frame clause counts in — physical rows, or logical value range.
 */
declare const FrameUnit: {
  /** `ROWS` — counts physical rows relative to the current row. */
  readonly Rows: "Rows";
  /** `RANGE` — counts by logical value distance (or, with unbounded/current-row bounds, groups of peers). */
  readonly Range: "Range";
};
/** One of the {@link FrameUnit} kinds. */
type FrameUnit = (typeof FrameUnit)[keyof typeof FrameUnit];
//#endregion
//#region src/state/window.d.ts
/** Holds state for one `PARTITION BY` term inside a window's `OVER (...)`. */
type WindowPartitionByState = {
  /** Table name or alias qualifying the partitioning column; unset for `raw`. */
  tableNameOrAlias: string | undefined;
  /** Column name being partitioned by; unset for `raw`. */
  columnName: string | undefined;
  /** Raw SQL for this partition term when not using structured fields. */
  raw: string | undefined;
};
/** Holds state for one `ORDER BY` term inside a window's `OVER (...)`. */
type WindowOrderByState = {
  /** Table name or alias qualifying the sort column; unset for `raw`. */
  tableNameOrAlias: string | undefined;
  /** Column name used for ordering; unset for `raw`. */
  columnName: string | undefined;
  /** ASC, DESC, or none. */
  direction: OrderByDirection;
  /** `NULLS FIRST`/`NULLS LAST` placement — see {@link NullsOrder}. */
  nulls: NullsOrder;
  /** Raw SQL for this sort term when not using structured fields. */
  raw: string | undefined;
};
/** One endpoint (`start`/`end`) of a window's `ROWS`/`RANGE BETWEEN ... AND ...` frame clause. */
type WindowFrameBoundState = {
  /** Which kind of bound this endpoint is. */
  type: FrameBoundType;
  /** Row/range offset for {@link FrameBoundType.Preceding}/{@link FrameBoundType.Following}; ignored otherwise. */
  offset: number | undefined;
};
/** A window's optional frame clause (`ROWS`/`RANGE BETWEEN start AND end`). */
type WindowFrameState = {
  /** Whether the frame counts physical rows or a logical range. */
  unit: FrameUnit;
  /** The frame's starting bound. */
  start: WindowFrameBoundState;
  /** The frame's ending bound; omitted means `CURRENT ROW` per the SQL standard's single-bound shorthand. */
  end: WindowFrameBoundState | undefined;
  /** Raw SQL for the entire frame clause when not using structured fields; mutually exclusive with the fields above. */
  raw: string | undefined;
};
/**
 * Holds state for one window function's `OVER (...)` clause: `PARTITION BY`, `ORDER BY`, and an
 * optional frame. Populated by {@link WindowBuilder}; nested under a `SelectWindow`
 * {@link SelectState}.
 */
type WindowState = {
  /** PARTITION BY terms in declaration order. */
  partitionByStates: WindowPartitionByState[];
  /** ORDER BY terms in declaration order. */
  orderByStates: WindowOrderByState[];
  /** The frame clause, when set. */
  frame: WindowFrameState | undefined;
};
/** Creates a {@link WindowState} with default field values (an empty `OVER ()`). */
declare const createWindowState: () => WindowState;
//#endregion
//#region src/state/select.d.ts
/**
 * Holds state for one SELECT list item (column, subquery, alias, raw, or window function).
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
  /**
   * Raw SQL for this select item when not using structured fields. For a `SelectWindow` item,
   * this instead carries the window function's call expression (e.g. `'ROW_NUMBER()'`,
   * `'SUM("o"."amount")'`) — the structured part is the `OVER (...)` clause, in {@link window}.
   */
  raw: string | undefined;
  /** The `OVER (...)` clause for a `SelectWindow` item; unset for every other builder type. */
  window: WindowState | undefined;
  /** JSON path for a `SelectJsonExtract` item. */
  jsonPath?: string;
  /** Text vs JSON-object extraction for a `SelectJsonExtract` item. */
  jsonExtractMode?: JsonExtractMode;
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
//#region src/enums/upsert-action.d.ts
/**
 * The conflict-resolution action for an INSERT's upsert clause.
 */
declare const UpsertAction: {
  /** No upsert clause configured. */
  readonly None: "None";
  /** Conflicting rows are silently skipped (PG/SQLite `DO NOTHING`, MySQL `INSERT IGNORE`). */
  readonly DoNothing: "DoNothing";
  /** Conflicting rows are updated (PG/SQLite `DO UPDATE SET`, MySQL `ON DUPLICATE KEY UPDATE`). */
  readonly DoUpdate: "DoUpdate";
};
/** One of the {@link UpsertAction} values. */
type UpsertAction = (typeof UpsertAction)[keyof typeof UpsertAction];
//#endregion
//#region src/state/upsert.d.ts
/**
 * Holds state for an INSERT's conflict clause (PG/SQLite `ON CONFLICT`, MySQL
 * `ON DUPLICATE KEY UPDATE` / `INSERT IGNORE`). Populated by the builder; exposed via
 * {@link QueryState.upsertState}. MSSQL upsert is emitted as `MERGE` by {@link defaultInsert};
 * PG/SQLite/MySQL use their native conflict clauses.
 */
type UpsertState = {
  /** Which conflict-resolution action to emit. */
  action: UpsertAction;
  /**
   * Columns identifying the conflict target for PG/SQLite `ON CONFLICT (...)`. Ignored on
   * MySQL, which infers the conflicting key from the table's own unique/primary constraints —
   * kept here anyway so the same call shape works across dialects.
   */
  conflictColumns: string[];
  /** SET assignments for the conflict-update action. */
  updateColumns: {
    columnName: string;
    value: any;
  }[];
  /** Raw SQL for the conflict-update SET list when not using structured fields. */
  updateRaw: string | undefined;
};
/** Creates an {@link UpsertState} with default field values. */
declare const createUpsertState: () => UpsertState;
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
  /** Stored procedure/function invocation (`CALL`/`EXEC`/`SELECT func(...)`). */
  readonly Call: "Call";
  /** `MERGE` statement — native T-SQL only. */
  readonly Merge: "Merge";
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
  /** INSERT conflict clause (upsert); undefined when not configured. */
  upsertState: UpsertState | undefined;
  /** MERGE statement (native T-SQL only); undefined when not a MERGE. */
  mergeState: MergeState | undefined;
  /** RETURNING/OUTPUT clause for INSERT/UPDATE/DELETE; undefined when not configured. */
  returningState: ReturningState | undefined;
  /** Row-locking clause for SELECT (`FOR UPDATE`/`FOR SHARE`); undefined when not configured. */
  rowLock: RowLockState | undefined;
  /** Stored procedure/function call state; undefined for non-Call queries. */
  callState: CallState | undefined;
  /** True when this state represents a nested subquery, not the outer query. */
  isInnerStatement: boolean;
  /** Maximum row count. `0` is unreachable — `limit()` refuses a non-positive value. */
  limit: number;
  /** When true, emit `WITH TIES` alongside the row limit (dialect-specific). */
  limitWithTies?: boolean;
  /**
   * Rows to skip before returning. `undefined` means the caller never asked; `0` means they asked
   * for zero, which is NOT the same thing and is not interchangeable.
   *
   * `OFFSET 0 ROWS` is the token that legalises an ORDER BY inside an MSSQL derived table or
   * subquery — measured: `SELECT * FROM (SELECT id FROM orders ORDER BY id) x` is Msg 1033, and
   * adding `OFFSET 0 ROWS` alone (no FETCH) makes it run. Treating `0` as "unset" therefore
   * deleted the only clause holding the statement up.
   */
  offset: number | undefined;
  /** Whether SELECT DISTINCT was requested. */
  distinct: boolean;
  /**
   * `DISTINCT ON (...)` columns (Postgres only); undefined/empty omits it. Mutually exclusive
   * with {@link distinct} — setting both throws at parse time.
   */
  distinctOnColumns: {
    tableNameOrAlias: string;
    columnName: string;
  }[] | undefined;
  /** Opaque hook for dialect- or app-specific extensions. */
  customState: any | undefined;
  /**
   * Index into {@link fromStates} for the UPDATE/DELETE target table.
   * Set by `updateTable` / `deleteFrom` so a prior `fromTable` cannot steal the target.
   */
  mutationTargetIndex: number | undefined;
  /** Structured/raw query hints in declaration order. */
  hintStates?: HintState[];
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
 * Renders one query state as a prepared SQL string (placeholders, without a separate params
 * array). For Postgres/MySQL/SQLite this is **not** execution-safe on its own — use
 * {@link parsePrepared} to get `{ sql, params }`. For MSSQL, `parse` and `parsePrepared`
 * both return the same self-contained `sp_executesql` batch (values inlined; `params` empty).
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
 * Fluent builder for a JOIN's `ON` condition list — `on`/`onValue` comparisons (including
 * `JoinOperator.Like`/`NotLike`), `onIn`/`onBetween` (and their `NOT` variants), `onRaw`
 * fragments, `and`/`or` combinators, and parenthesized `onGroup`s. One class for every dialect;
 * {@link states} hands the accumulated conditions to the join clause parser.
 */
declare class JoinOnBuilder {
  #private;
  constructor(config: Dialect);
  and: () => this;
  on: (aliasLeft: string, columnLeft: string, joinOperator: JoinOperator, aliasRight: string, columnRight: string) => this;
  onGroup: (builder: (builder: JoinOnBuilder) => void) => this;
  onRaw: (raw: string) => this;
  onValue: (aliasLeft: string, columnLeft: string, joinOperator: JoinOperator, valueRight: any) => this;
  /** `ON column IN (values)`. */
  onIn: (aliasLeft: string, columnLeft: string, values: any[]) => this;
  /** `ON column NOT IN (values)`. */
  onNotIn: (aliasLeft: string, columnLeft: string, values: any[]) => this;
  /** `ON column BETWEEN value1 AND value2`. */
  onBetween: (aliasLeft: string, columnLeft: string, value1: any, value2: any) => this;
  /** `ON column NOT BETWEEN value1 AND value2`. */
  onNotBetween: (aliasLeft: string, columnLeft: string, value1: any, value2: any) => this;
  or: () => this;
  states: () => JoinOnState[];
}
//#endregion
//#region src/builder/typed-views.d.ts
/**
 * Per-engine typed views over the single {@link QueryBuilder} runtime class.
 *
 * SQLEasy is an honest capability surface: hitting the dot should show only what the engine you are
 * on can actually do. The runtime enforces that by throwing (the floor, and all Go can do); these
 * views add the compile-time ceiling for TypeScript — a method a dialect cannot run is not on that
 * dialect's builder type, so it does not autocomplete and does not compile.
 *
 * There is ONE runtime class. A dialect facade (`MssqlQuery.newBuilder()`, …) constructs a
 * `QueryBuilder` and returns it typed as the narrow view; the object is unchanged, only its static
 * type is narrowed. Structural typing makes this sound — `QueryBuilder` really does have every
 * method each view exposes — and the {@link _assertQueryBuilderSatisfiesViews} guard fails the build
 * if that ever stops being true.
 *
 * ── HOW THE VIEW IS DERIVED (mechanism, proven before it was written) ──
 * {@link BuilderView} maps over a curated set of method keys and, for every method that returns the
 * builder (`this`, which resolves to `QueryBuilder` when indexed), REBINDS the return to the viewing
 * type `Self` — so `mssql.selectAll().where(…).top(…)` stays typed as the MSSQL view through the
 * whole chain. It ALSO rebinds subquery-callback parameters (see {@link RebindArgs}): a
 * `fromWithBuilder('sub', (inner) => …)` on the Postgres view hands back an `inner` that is itself
 * the Postgres view, so the ceiling holds one level down — a subquery runs on the SAME engine, and
 * `inner.top(5)` must be just as absent as `pg.top(5)`. Terminal methods that return something else
 * (`parsePrepared`, `state`, …) keep their real return. Everything NOT in the key set is absent.
 *
 * Two other approaches were measured and rejected: a `this`-returning `Omit<QueryBuilder, K>` does
 * NOT drop the omitted method (polymorphic `this` reintroduces it), and a method typed to `never` on
 * the wrong dialect still autocompletes and only fails on call — which defeats the "hit the dot"
 * test. Only structural absence via this mapped-type derivation passes.
 */
/**
 * Rewrites ONE method argument for the viewing type: a subquery callback `(b: QueryBuilder) => R`
 * becomes `(b: Self) => R`, so nested completion is narrowed to the same dialect. Every other
 * argument — a string, a `JoinOnBuilder`/`MergeBuilder`/`WindowBuilder` callback (a different builder
 * type, so it does not match) — is left exactly as it was. The contravariant position is why the
 * anti-drift guard still holds: a concrete `QueryBuilder` is WIDER than the view, which is precisely
 * what a `(b: Self) => R` parameter accepts.
 */
type RebindArg<T, Self> = T extends ((b: QueryBuilder) => infer R) ? (b: Self) => R : T;
/** Rewrites each argument in a method's parameter tuple via {@link RebindArg}. */
type RebindArgs<A extends readonly unknown[], Self> = { [I in keyof A]: RebindArg<A[I], Self>; };
type BuilderView<Keys extends keyof QueryBuilder, Self> = { [K in Keys]: QueryBuilder[K] extends ((...args: infer A) => QueryBuilder) ? (...args: RebindArgs<A, Self>) => Self : QueryBuilder[K]; };
/**
 * ── THE ADJUDICATION ──
 *
 * Below, each dialect names the methods it CANNOT run — the compile-time mirror of a runtime
 * refusal that ALWAYS fires on that dialect, no matter the arguments. Every entry is grounded in a
 * hard `throw` in the parser: if a method merely *sometimes* refuses (only in a certain combination,
 * or only for a non-empty argument), it stays on the view and the runtime handles the bad case. To
 * assert an absence we had not verified would be the same dishonesty this surface removes, pointed
 * the other way — so a method appears here only when its refusal has no escape path.
 *
 * A `clear*` sits beside its setter: `clearTop` is listed wherever `top` is, because a clear for a
 * capability the view does not expose has nothing to clear. `distinct`/`clearDistinct` (plain
 * DISTINCT, universal) are deliberately NOT here — only `distinctOn`/`clearDistinctOn` are.
 *
 * Conditional refusals intentionally left OFF these lists (they stay shared, runtime-guarded):
 *   • `joinTable(JoinType.FullOuter)` — MySQL rejects only that one join type, not `joinTable`.
 *   • `fromTableWithOwner`/`joinTableWithOwner`/… — MySQL refuses a NON-empty owner; an empty owner
 *     is accepted, so the method is usable.
 *   • `onConflictDoUpdate` on MySQL — valid (ON DUPLICATE KEY UPDATE); only a conflict TARGET is
 *     refused. Absent on MSSQL, which has no upsert at all.
 *   • `procParamNamed` on MSSQL — valid for procedures; only a named arg to a FUNCTION is refused.
 *   • `limitWithTies` + `offset` on MSSQL — the combination is refused, not `limitWithTies` itself.
 *   • joins in UPDATE/DELETE on SQLite — `joinTable` is fine on a SELECT; only the mutation combo
 *     throws.
 */
/**
 * MSSQL cannot run these.
 *
 * `forShare*` — no shared row lock; HOLDLOCK is a SERIALIZABLE isolation hint, not `FOR SHARE`
 * (default-row-lock). `fromLateral`/`joinLateral` — T-SQL spells LATERAL as APPLY, so the LATERAL
 * forms are refused in favour of `joinCrossApply`/`joinOuterApply` (default-from, default-join).
 * `whereJsonContains`/`havingJsonContains` — no JSON containment operator (default-where).
 * `onConflict*`/`clearUpsert` — no upsert; T-SQL expresses it with the separate MERGE statement
 * (default-insert). `hintUseIndex`/`hintForceIndex` — MySQL-only index hints (default-hint).
 * `distinctOn`/`clearDistinctOn` — `DISTINCT ON` is Postgres-only (default-select).
 */
type AbsentOnMssql = 'forShare' | 'forShareNowait' | 'forShareSkipLocked' | 'fromLateral' | 'joinLateral' | 'whereJsonContains' | 'havingJsonContains' | 'onConflictDoNothing' | 'onConflictDoUpdate' | 'onConflictDoUpdateRaw' | 'clearUpsert' | 'hintUseIndex' | 'hintForceIndex' | 'distinctOn' | 'clearDistinctOn' | 'forUpdate' | 'forUpdateNowait' | 'forUpdateSkipLocked' | 'insertIgnore' | 'onDuplicateKeyUpdate' | 'onDuplicateKeyUpdateRaw' | 'joinCrossLateral' | 'joinLeftLateral';
/**
 * MySQL cannot run these.
 *
 * `top`/`clearTop` — `TOP` is a T-SQL keyword; the row cap is `limit()`. `merge` — MERGE is native
 * T-SQL only. `hintMssqlOption` — a T-SQL `OPTION (...)` hint. `distinctOn`/`clearDistinctOn` —
 * Postgres-only. `limitWithTies`/`clearLimitWithTies` — no WITH TIES (default-limit-offset).
 * `groupByCube`/`groupByGroupingSets` — MySQL has ROLLUP but neither CUBE nor GROUPING SETS
 * (default-group-by). `fromTableFunction`/`fromTableFunctionWithOwner` — no table-valued functions
 * in FROM (default-from). `procParamNamed` — no named parameters in CALL (default-call).
 * `returning`/`returningRaw`/`clearReturning` — no RETURNING clause (default-returning).
 */
type AbsentOnMysql = 'top' | 'clearTop' | 'merge' | 'hintMssqlOption' | 'distinctOn' | 'clearDistinctOn' | 'limitWithTies' | 'clearLimitWithTies' | 'groupByCube' | 'groupByGroupingSets' | 'fromTableFunction' | 'fromTableFunctionWithOwner' | 'procParamNamed' | 'returning' | 'returningRaw' | 'clearReturning' | 'onConflictDoNothing' | 'onConflictDoUpdate' | 'onConflictDoUpdateRaw' | 'updlock' | 'updlockNowait' | 'updlockReadpast' | 'joinCrossApply' | 'joinOuterApply';
/**
 * Postgres cannot run these.
 *
 * `top`/`clearTop` — T-SQL keyword; use `limit()`. `merge` — native T-SQL only. `hintMssqlOption` —
 * T-SQL `OPTION (...)`. `hintUseIndex`/`hintForceIndex` — MySQL-only index hints (default-hint).
 * Everything else Postgres does; it is the widest surface, and `distinctOn` is its own.
 */
type AbsentOnPostgres = 'top' | 'clearTop' | 'merge' | 'hintMssqlOption' | 'hintUseIndex' | 'hintForceIndex' | 'updlock' | 'updlockNowait' | 'updlockReadpast' | 'insertIgnore' | 'onDuplicateKeyUpdate' | 'onDuplicateKeyUpdateRaw' | 'joinCrossApply' | 'joinOuterApply';
/**
 * SQLite cannot run these — the narrowest surface.
 *
 * `call*`/`clearCall`/`procParam*` — no stored procedures or functions (default-call). `forUpdate*`/
 * `forShare*`/`clearRowLock` — no row locking (default-row-lock). `fromLateral`/`joinLateral`/
 * `joinCrossApply`/`joinOuterApply` — no LATERAL or APPLY (default-from, default-join).
 * `groupByRollup`/`groupByCube`/`groupByGroupingSets` — none of the grouping extensions
 * (default-group-by). `whereJsonContains`/`havingJsonContains` — no JSON containment (default-where).
 * `hintUseIndex`/`hintForceIndex` — MySQL-only; `hintMssqlOption` — MSSQL-only (default-hint).
 * `limitWithTies`/`clearLimitWithTies` — no WITH TIES. `merge`, `top`/`clearTop` — T-SQL only.
 * `distinctOn`/`clearDistinctOn` — Postgres-only.
 */
type AbsentOnSqlite = 'callProcedure' | 'callProcedureWithOwner' | 'callFunction' | 'callFunctionWithOwner' | 'clearCall' | 'procParam' | 'procParams' | 'procParamNamed' | 'procParamInOut' | 'procParamOut' | 'procParamRaw' | 'forUpdate' | 'forUpdateNowait' | 'forUpdateSkipLocked' | 'forShare' | 'forShareNowait' | 'forShareSkipLocked' | 'clearRowLock' | 'fromLateral' | 'joinLateral' | 'joinCrossApply' | 'joinOuterApply' | 'groupByRollup' | 'groupByCube' | 'groupByGroupingSets' | 'whereJsonContains' | 'havingJsonContains' | 'hintUseIndex' | 'hintForceIndex' | 'hintMssqlOption' | 'limitWithTies' | 'clearLimitWithTies' | 'merge' | 'top' | 'clearTop' | 'distinctOn' | 'clearDistinctOn' | 'updlock' | 'updlockNowait' | 'updlockReadpast' | 'insertIgnore' | 'onDuplicateKeyUpdate' | 'onDuplicateKeyUpdateRaw' | 'joinCrossLateral' | 'joinLeftLateral';
/** The MSSQL builder view — every method except {@link AbsentOnMssql}. */
interface MssqlQueryBuilder extends BuilderView<Exclude<keyof QueryBuilder, AbsentOnMssql>, MssqlQueryBuilder> {}
/** The Postgres builder view — every method except {@link AbsentOnPostgres}. */
interface PostgresQueryBuilder extends BuilderView<Exclude<keyof QueryBuilder, AbsentOnPostgres>, PostgresQueryBuilder> {}
/** The MySQL builder view — every method except {@link AbsentOnMysql}. */
interface MysqlQueryBuilder extends BuilderView<Exclude<keyof QueryBuilder, AbsentOnMysql>, MysqlQueryBuilder> {}
/** The SQLite builder view — every method except {@link AbsentOnSqlite}. */
interface SqliteQueryBuilder extends BuilderView<Exclude<keyof QueryBuilder, AbsentOnSqlite>, SqliteQueryBuilder> {}
/**
 * The surface every dialect shares — a method appears here only when NO dialect lacks it, so it is
 * `keyof QueryBuilder` minus the union of all four absence sets.
 *
 * All four dialect views are assignable to this, so a helper that works on *any* dialect's builder
 * and only touches common methods should accept `CommonQueryBuilder` (or be generic over it) rather
 * than the concrete `QueryBuilder`, which the narrow views are NOT assignable to.
 */
interface CommonQueryBuilder extends BuilderView<Exclude<keyof QueryBuilder, AbsentOnMssql | AbsentOnMysql | AbsentOnPostgres | AbsentOnSqlite>, CommonQueryBuilder> {}
/**
 * Anti-drift guard, checked at compile time only (never called).
 *
 * A view is a hand-curated subset of `QueryBuilder`'s surface. If a method a view names is renamed
 * or removed on `QueryBuilder`, or its signature drifts, these assignments stop type-checking and
 * the build fails — so a view can never quietly promise a method the runtime no longer has. The
 * runtime `QueryBuilder` must be assignable to every view, because it genuinely has all their
 * methods; the narrowing is only in the static type a facade hands back.
 */
declare const _assertQueryBuilderSatisfiesViews: (builder: QueryBuilder) => void;
//#endregion
//#region src/builder/merge.d.ts
/** `source.<col>` — a reference to the USING source row (the common MERGE RHS). */
declare const source: (columnName: string) => MergeExpr;
/** `target.<col>` — a reference to the target row. */
declare const target: (columnName: string) => MergeExpr;
/** A genuine bound literal (`@pN`), for the rarer case where a WHEN action assigns a constant. */
declare const value: (v: any) => MergeExpr;
/** A raw SQL fragment for an RHS the structured forms cannot express. */
declare const raw: (sql: string) => MergeExpr;
/**
 * Builds a T-SQL `MERGE` statement, one clause per method, in the grammar's own vocabulary.
 *
 * MERGE is native T-SQL and exists on no other dialect; {@link QueryBuilder.merge} stores this
 * state and the parser refuses it everywhere but MSSQL. This is a whole statement, not an INSERT
 * with a conflict clause — that conflation was the removed lie.
 *
 * Populated through a callback, the same shape as `joinTable((j) => …)` and
 * `selectWindow(fn, (w) => …)`.
 */
declare class MergeBuilder {
  #private;
  constructor(config: Dialect);
  /** `MERGE INTO <table> [AS alias]` — target defaults to the alias `target`, owner to the dialect default. */
  into: (table: string, alias?: string) => this;
  /** `MERGE INTO <owner>.<table> [AS alias]`. */
  intoWithOwner: (owner: string, table: string, alias?: string) => this;
  /**
   * `WITH (HOLDLOCK)` on the target.
   *
   * A MERGE used as an upsert is race-prone at READ COMMITTED without it — under concurrency an
   * un-hinted MERGE can still raise a duplicate-key violation, which `HOLDLOCK` (a SERIALIZABLE
   * hint on the target only) prevents. The builder does not add it for you: it emits the MERGE you
   * wrote, and this is how you write the concurrency-safe one.
   */
  holdlock: (on?: boolean) => this;
  /** `USING (VALUES …) AS alias (columns)` — one or more literal rows. */
  usingValues: (alias: string, columns: string[], rows: any[][]) => this;
  /** `USING <table> AS alias`. */
  usingTable: (table: string, alias: string, owner?: string) => this;
  /**
   * `USING (<subquery>) AS alias`. MERGE is MSSQL-only, so its USING subquery runs on MSSQL — the
   * callback builder is the MSSQL view, keeping the honest-surface ceiling inside the subquery too.
   * The concrete `QueryBuilder` the runtime passes is assignable to that view.
   */
  usingSelect: (alias: string, build: (q: MssqlQueryBuilder) => void) => this;
  /** `USING <raw> AS alias`, for a source the structured forms cannot express (APPLY, TVF, …). */
  usingRaw: (sql: string, alias: string) => this;
  /** `ON <merge_search_condition>` — required; full predicate strength via {@link JoinOnBuilder}. */
  on: (build: (j: JoinOnBuilder) => void) => this;
  /** `WHEN MATCHED [AND …] THEN UPDATE SET …`. */
  whenMatchedThenUpdate: (assignments: MergeAssignment[], and?: (j: JoinOnBuilder) => void) => this;
  /** `WHEN MATCHED [AND …] THEN UPDATE SET <raw>`. */
  whenMatchedThenUpdateRaw: (raw: string, and?: (j: JoinOnBuilder) => void) => this;
  /** `WHEN MATCHED [AND …] THEN DELETE`. */
  whenMatchedThenDelete: (and?: (j: JoinOnBuilder) => void) => this;
  /** `WHEN NOT MATCHED [BY TARGET] [AND …] THEN INSERT (columns) VALUES (…)`. */
  whenNotMatchedThenInsert: (columns: string[], values: MergeExpr[], and?: (j: JoinOnBuilder) => void) => this;
  /** `WHEN NOT MATCHED [BY TARGET] [AND …] THEN INSERT DEFAULT VALUES`. */
  whenNotMatchedThenInsertDefaultValues: (and?: (j: JoinOnBuilder) => void) => this;
  /** `WHEN NOT MATCHED BY SOURCE [AND …] THEN UPDATE SET …`. */
  whenNotMatchedBySourceThenUpdate: (assignments: MergeAssignment[], and?: (j: JoinOnBuilder) => void) => this;
  /** `WHEN NOT MATCHED BY SOURCE [AND …] THEN DELETE`. */
  whenNotMatchedBySourceThenDelete: (and?: (j: JoinOnBuilder) => void) => this;
  /**
   * `OUTPUT <expression>` as a raw fragment, e.g. `$action, inserted.id, deleted.status`.
   *
   * Deliberately raw, and the only OUTPUT form offered here. MERGE's OUTPUT is materially richer
   * than an INSERT/UPDATE/DELETE OUTPUT — it exposes the per-row `$action` and can mix `inserted.*`
   * and `deleted.*` in one row — so a structured `output(columns)` that quietly captured a single
   * side would be exactly the kind of half-true convenience this library refuses. Write the
   * expression; the builder does not pretend to know which side each column comes from.
   */
  outputRaw: (sql: string) => this;
  state: () => MergeState;
}
//#endregion
//#region src/builder/window.d.ts
/**
 * Fluent builder for a window function's `OVER (...)` clause — `PARTITION BY`, `ORDER BY`
 * (with `NULLS FIRST`/`NULLS LAST`), and an optional `ROWS`/`RANGE` frame. One class for every
 * dialect; {@link state} hands the accumulated clause to {@link QueryBuilder.selectWindow}.
 */
declare class WindowBuilder {
  #private;
  partitionByColumn: (tableNameOrAlias: string, columnName: string) => this;
  partitionByColumns: (columns: {
    tableNameOrAlias: string;
    columnName: string;
  }[]) => this;
  partitionByRaw: (raw: string) => this;
  orderByColumn: (tableNameOrAlias: string, columnName: string, direction?: OrderByDirection, nulls?: NullsOrder) => this;
  orderByRaw: (raw: string) => this;
  /** Sets a structured `ROWS`/`RANGE BETWEEN start AND end` frame. Omit `end` for the SQL-standard single-bound shorthand (implicitly `AND CURRENT ROW`). */
  frame: (unit: FrameUnit, startType: FrameBoundType, startOffset?: number, endType?: FrameBoundType, endOffset?: number) => this;
  /** Raw-SQL form of {@link frame} for expressions the structured bounds can't express. */
  frameRaw: (raw: string) => this;
  state: () => WindowState;
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
  or: () => this;
  clearAll: () => this;
  clearFrom: () => this;
  clearGroupBy: () => this;
  clearHaving: () => this;
  clearJoin: () => this;
  clearLimit: () => this;
  /** Removes the offset entirely. `undefined`, not `0` — `offset(0)` is a real, emitted value. */
  clearOffset: () => this;
  clearOrderBy: () => this;
  clearSelect: () => this;
  clearDistinct: () => this;
  /**
   * Postgres-only `DISTINCT ON (...)`: keeps only the first row (per the query's `ORDER BY`)
   * for each distinct combination of the given columns. Mutually exclusive with {@link distinct}
   * — combining them throws at parse time. Throws on every other dialect, which has no equivalent.
   */
  distinctOn: (columns: {
    tableNameOrAlias: string;
    columnName: string;
  }[]) => this;
  clearDistinctOn: () => this;
  clearWhere: () => this;
  clearCte: () => this;
  clearUnion: () => this;
  clearInsert: () => this;
  clearUpdate: () => this;
  /** Clears the DELETE target table and resets sticky Delete query type. */
  clearDelete: () => this;
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
  /** Postgres/MySQL `FROM LATERAL (subquery) AS alias`. MSSQL/SQLite throw — use APPLY on MSSQL. */
  fromLateral: (alias: string, builder: (builder: QueryBuilder) => void) => this;
  /**
   * Table-valued / set-returning function in the FROM clause (`FROM fn(...) AS alias`).
   * Dialect-specific: Postgres/MSSQL TVFs, SQLite helpers like `json_each`.
   *
   * NO owner is injected. The default owner is a TABLE default, and a function is not a table:
   * qualifying `generate_series` with it produced `FROM "public"."generate_series"(1, 5)`, which
   * Postgres rejects with `function public.generate_series(integer, integer) does not exist` —
   * built-ins live in `pg_catalog`, and the unqualified call resolves through `search_path` exactly
   * as intended. MSSQL carried the identical defect as `[dbo].[generate_series](...)`. Use
   * {@link fromTableFunctionWithOwner} when a function genuinely lives in a named schema.
   */
  fromTableFunction: (functionName: string, alias: string, params?: any[]) => this;
  /** {@link fromTableFunction} with an explicit schema/owner qualifier. */
  fromTableFunctionWithOwner: (owner: string, functionName: string, alias: string, params?: any[]) => this;
  /** Raw-SQL table source when structured TVF helpers are insufficient. */
  fromFunctionRaw: (rawFrom: string, alias: string) => this;
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
  /** MSSQL `CROSS APPLY` / Postgres+MySQL `CROSS JOIN LATERAL`. SQLite throws. */
  joinCrossApply: (alias: string, builder: (builder: QueryBuilder) => void, joinOnBuilder?: (joinOnBuilder: JoinOnBuilder) => void) => this;
  /** MSSQL `OUTER APPLY` / Postgres+MySQL `LEFT JOIN LATERAL`. SQLite throws. */
  joinOuterApply: (alias: string, builder: (builder: QueryBuilder) => void, joinOnBuilder?: (joinOnBuilder: JoinOnBuilder) => void) => this;
  /**
   * Postgres / MySQL `CROSS JOIN LATERAL` — those engines' spelling of {@link joinCrossApply}.
   *
   * NOT a synonym for {@link joinLateral}, which is a third join taking its own ON condition. The
   * three are genuinely different — measured: `CROSS JOIN LATERAL … AS x`,
   * `LEFT JOIN LATERAL … ON TRUE`, and `JOIN LATERAL … ON <cond>` — so this renames one of them per
   * dialect rather than collapsing any two.
   */
  joinCrossLateral: (alias: string, builder: (builder: QueryBuilder) => void, joinOnBuilder?: (joinOnBuilder: JoinOnBuilder) => void) => this;
  /** Postgres / MySQL `LEFT JOIN LATERAL … ON TRUE` — their spelling of {@link joinOuterApply}. */
  joinLeftLateral: (alias: string, builder: (builder: QueryBuilder) => void, joinOnBuilder?: (joinOnBuilder: JoinOnBuilder) => void) => this;
  /** Postgres/MySQL `JOIN LATERAL (subquery) AS alias ON ...`. MSSQL/SQLite throw. */
  joinLateral: (alias: string, builder: (builder: QueryBuilder) => void, joinOnBuilder: (joinOnBuilder: JoinOnBuilder) => void) => this;
  limit: (limit: number) => this;
  /**
   * Limits rows and includes tied rows at the cutoff (`FETCH FIRST n ROWS WITH TIES` and dialect
   * equivalents). Requires `ORDER BY` under the same rules as {@link limit}.
   */
  limitWithTies: (limit: number) => this;
  clearLimitWithTies: () => this;
  /**
   * Rows to skip. `0` is a REAL value, not "unset" — it is what legalises an ORDER BY inside an
   * MSSQL derived table or subquery (`OFFSET 0 ROWS`, measured), so it is stored and emitted.
   * Omitting the call entirely is how you say "no offset".
   */
  offset: (offset: number) => this;
  orderByColumn: (tableNameOrAlias: string, columnName: string, direction: OrderByDirection, nulls?: NullsOrder) => this;
  orderByColumns: (columns: {
    tableNameOrAlias: string;
    columnName: string;
    direction: OrderByDirection;
    nulls?: NullsOrder;
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
  /**
   * Adds a window function to the SELECT list: `fn OVER (...)`. `fn` is the function's call
   * expression, emitted verbatim (e.g. `'ROW_NUMBER()'`, `'SUM("o"."amount")'`) — like
   * {@link selectRaw}, it is not quoted/escaped, so quote any identifiers inside it yourself.
   * The `OVER` clause itself (`PARTITION BY`/`ORDER BY`/frame) is structured, via {@link WindowBuilder}.
   */
  selectWindow: (fn: string, over: (builder: WindowBuilder) => void, alias: string) => this;
  /**
   * Dialect-aware JSON path extraction in the SELECT list (`->`/`->>`/`JSON_EXTRACT`/`JSON_VALUE`).
   */
  selectJsonExtract: (tableNameOrAlias: string, columnName: string, path: string, mode?: JsonExtractMode, alias?: string) => this;
  state: () => QueryState;
  where: (tableNameOrAlias: string, columnName: string, whereOperator: WhereOperator, value: any) => this;
  whereBetween: (tableNameOrAlias: string, columnName: string, value1: any, value2: any) => this;
  /**
   * @param tableNameOrAlias - Unused: `EXISTS (subquery)` never references the outer column.
   *   Kept for wire parity with the golden corpus; prefer {@link whereExists} in new code.
   * @param columnName - Unused; see `tableNameOrAlias`.
   */
  whereExistsWithBuilder: (tableNameOrAlias: string, columnName: string, builder: (builder: QueryBuilder) => void) => this;
  /** `WHERE EXISTS (subquery)` — the same clause as {@link whereExistsWithBuilder} without its unused table/column parameters. */
  whereExists: (builder: (builder: QueryBuilder) => void) => this;
  whereGroup(builder: (builder: QueryBuilder) => void): this;
  whereInWithBuilder: (tableNameOrAlias: string, columnName: string, builder: (builder: QueryBuilder) => void) => this;
  whereInValues: (tableNameOrAlias: string, columnName: string, values: any[]) => this;
  /**
   * @param tableNameOrAlias - Unused: `NOT EXISTS (subquery)` never references the outer column.
   *   Kept for wire parity with the golden corpus; prefer {@link whereNotExists} in new code.
   * @param columnName - Unused; see `tableNameOrAlias`.
   */
  whereNotExistsWithBuilder: (tableNameOrAlias: string, columnName: string, builder: (builder: QueryBuilder) => void) => this;
  /** `WHERE NOT EXISTS (subquery)` — the same clause as {@link whereNotExistsWithBuilder} without its unused table/column parameters. */
  whereNotExists: (builder: (builder: QueryBuilder) => void) => this;
  whereNotInWithBuilder: (tableNameOrAlias: string, columnName: string, builder: (builder: QueryBuilder) => void) => this;
  whereNotInValues: (tableNameOrAlias: string, columnName: string, values: any[]) => this;
  whereNotNull: (tableNameOrAlias: string, columnName: string) => this;
  whereNull: (tableNameOrAlias: string, columnName: string) => this;
  whereRaw: (rawWhere: string) => this;
  whereRaws: (rawWheres: string[]) => this;
  /** Compare a dialect-specific JSON path extraction against a bound value. */
  whereJsonExtract: (tableNameOrAlias: string, columnName: string, path: string, mode: JsonExtractMode, whereOperator: WhereOperator, value: any) => this;
  /** JSON containment (`@>` / `JSON_CONTAINS`) against a bound JSON document. */
  whereJsonContains: (tableNameOrAlias: string, columnName: string, value: any) => this;
  /** Dialect-aware full-text predicate over one or more columns. */
  whereMatch: (columns: {
    tableNameOrAlias: string;
    columnName: string;
  }[], query: string, mode?: FullTextMode) => this;
  /** Raw full-text SQL when structured {@link whereMatch} cannot express the predicate. */
  whereMatchRaw: (rawWhere: string) => this;
  groupByColumn: (tableNameOrAlias: string, columnName: string) => this;
  groupByColumns: (columns: {
    tableNameOrAlias: string;
    columnName: string;
  }[]) => this;
  groupByRaw: (rawGroupBy: string) => this;
  groupByRaws: (rawGroupBys: string[]) => this;
  /** `GROUP BY ROLLUP (...)` (MySQL: trailing `WITH ROLLUP` when columns were already grouped). */
  groupByRollup: (columns?: {
    tableNameOrAlias: string;
    columnName: string;
  }[]) => this;
  /** `GROUP BY CUBE (...)` — not supported on MySQL (throws at parse time). */
  groupByCube: (columns?: {
    tableNameOrAlias: string;
    columnName: string;
  }[]) => this;
  /** `GROUP BY GROUPING SETS ((...), (...))` — not supported on MySQL (throws at parse time). */
  groupByGroupingSets: (sets: {
    tableNameOrAlias: string;
    columnName: string;
  }[][]) => this;
  having: (tableNameOrAlias: string, columnName: string, whereOperator: WhereOperator, value: any) => this;
  havingRaw: (rawHaving: string) => this;
  havingRaws: (rawHavings: string[]) => this;
  havingJsonExtract: (tableNameOrAlias: string, columnName: string, path: string, mode: JsonExtractMode, whereOperator: WhereOperator, value: any) => this;
  havingJsonContains: (tableNameOrAlias: string, columnName: string, value: any) => this;
  havingMatch: (columns: {
    tableNameOrAlias: string;
    columnName: string;
  }[], query: string, mode?: FullTextMode) => this;
  havingBetween: (tableNameOrAlias: string, columnName: string, value1: any, value2: any) => this;
  /** `HAVING EXISTS (subquery)` — mirrors {@link whereExists} for the HAVING clause. */
  havingExists: (builder: (builder: QueryBuilder) => void) => this;
  /** `HAVING NOT EXISTS (subquery)` — mirrors {@link whereNotExists} for the HAVING clause. */
  havingNotExists: (builder: (builder: QueryBuilder) => void) => this;
  /** Opens a parenthesized HAVING group — mirrors {@link whereGroup} for the HAVING clause. */
  havingGroup(builder: (builder: QueryBuilder) => void): this;
  havingInWithBuilder: (tableNameOrAlias: string, columnName: string, builder: (builder: QueryBuilder) => void) => this;
  havingInValues: (tableNameOrAlias: string, columnName: string, values: any[]) => this;
  havingNotInWithBuilder: (tableNameOrAlias: string, columnName: string, builder: (builder: QueryBuilder) => void) => this;
  havingNotInValues: (tableNameOrAlias: string, columnName: string, values: any[]) => this;
  havingNotNull: (tableNameOrAlias: string, columnName: string) => this;
  havingNull: (tableNameOrAlias: string, columnName: string) => this;
  /**
   * Assembles a T-SQL `MERGE` statement via a {@link MergeBuilder} callback — native T-SQL only;
   * the parser refuses it on every other dialect. MERGE is its own statement kind, mutually
   * exclusive with SELECT/INSERT/UPDATE/DELETE, so this flips {@link QueryType} the way
   * `insertInto` does rather than contributing a clause the way `joinTable` does.
   */
  merge: (build: (merge: MergeBuilder) => void) => this;
  insertInto: (tableName: string) => this;
  insertIntoWithOwner: (owner: string, tableName: string) => this;
  insertColumns: (columns: string[]) => this;
  insertValues: (values: any[]) => this;
  insertRaw: (raw: string) => this;
  /**
   * `INSERT ... SELECT`: the row values come from a sub-query instead of a literal `VALUES`
   * list. Mutually exclusive with {@link insertValues} — providing both throws at parse time.
   */
  insertSelect: (builder: (builder: QueryBuilder) => void) => this;
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
  /** @param columns - Optional explicit column list: `WITH name (col1, col2) AS (...)`. Omit/empty leaves it out. */
  cte: (name: string, builder: (builder: QueryBuilder) => void, columns?: string[]) => this;
  /** @param columns - Optional explicit column list — see {@link cte}. Recursive CTEs commonly need one, since the recursive member's SELECT list can't always be inferred from the anchor alone. */
  cteRecursive: (name: string, builder: (builder: QueryBuilder) => void, columns?: string[]) => this;
  cteRaw: (name: string, raw: string) => this;
  /** Removes a previously set `TOP` limit from builder state (MSSQL). */
  clearTop: () => this;
  /** Sets the `TOP` row limit for the generated `SELECT` (MSSQL; ignored by other dialects). */
  top: (top: number) => this;
  /**
   * Returns the given columns from an INSERT/UPDATE/DELETE: PG/SQLite `RETURNING`, MSSQL
   * `OUTPUT INSERTED.…`/`OUTPUT DELETED.…`. MySQL has no equivalent and throws at parse time.
   */
  returning: (columns: string[]) => this;
  /** Raw-SQL form of {@link returning} for expressions the structured column list cannot express. */
  returningRaw: (raw: string) => this;
  clearReturning: () => this;
  /**
   * INSERT conflict clause: silently skip conflicting rows (PG/SQLite `ON CONFLICT ... DO
   * NOTHING`, MySQL `INSERT IGNORE`). On MSSQL, upsert is emitted as a `MERGE` statement.
   *
   * @param conflictColumns - Conflict target for PG/SQLite. Ignored on MySQL, which infers the
   *   conflicting key from the table's own constraints; kept so one call shape works everywhere.
   */
  onConflictDoNothing: (conflictColumns?: string[]) => this;
  /**
   * INSERT conflict clause: update the existing row (PG/SQLite `ON CONFLICT ... DO UPDATE SET`,
   * MySQL `ON DUPLICATE KEY UPDATE`). On MSSQL, upsert is emitted as a `MERGE` statement.
   *
   * @param conflictColumns - Conflict target for PG/SQLite. Ignored on MySQL; see {@link onConflictDoNothing}.
   */
  onConflictDoUpdate: (conflictColumns: string[], updates: {
    columnName: string;
    value: any;
  }[]) => this;
  /** Raw-SQL form of {@link onConflictDoUpdate}'s SET list for expressions columns can't express. */
  onConflictDoUpdateRaw: (conflictColumns: string[], raw: string) => this;
  clearUpsert: () => this;
  /** MySQL `INSERT IGNORE` — skip rows that would violate a unique key. */
  insertIgnore: () => this;
  /** MySQL `... ON DUPLICATE KEY UPDATE col = val, …`. */
  onDuplicateKeyUpdate: (updates: {
    columnName: string;
    value: any;
  }[]) => this;
  /** Raw-SQL form of {@link onDuplicateKeyUpdate}'s SET list. */
  onDuplicateKeyUpdateRaw: (raw: string) => this;
  /** Exclusive row lock on the SELECT's result rows (`FOR UPDATE`; MSSQL `WITH (UPDLOCK, ROWLOCK)`). */
  forUpdate: () => this;
  /** {@link forUpdate}, failing immediately instead of waiting on an already-locked row. */
  forUpdateNowait: () => this;
  /** {@link forUpdate}, silently skipping already-locked rows instead of waiting. */
  forUpdateSkipLocked: () => this;
  /** MSSQL `WITH (UPDLOCK, ROWLOCK)` — the T-SQL spelling of {@link forUpdate}. */
  updlock: () => this;
  /** {@link updlock}, failing immediately on an already-locked row (`, NOWAIT`). */
  updlockNowait: () => this;
  /** {@link updlock}, skipping already-locked rows (`, READPAST`). */
  /**
   * MSSQL `WITH (UPDLOCK, ROWLOCK, READPAST)` — the T-SQL spelling of {@link forUpdateSkipLocked}.
   *
   * Named for the hint that does the work. It was `updlockSkipLocked`, which was half-translated:
   * `updlock` is T-SQL while `SkipLocked` is Postgres/MySQL vocabulary, and the already-adjudicated
   * `RowLockWait.SkipLocked` cell records MSSQL's own term as READPAST — so the op and the enum
   * contradicted each other. UPDLOCK + ROWLOCK + READPAST is Microsoft's documented queue idiom.
   */
  updlockReadpast: () => this;
  /** Shared row lock on the SELECT's result rows (`FOR SHARE`; MSSQL `WITH (HOLDLOCK, ROWLOCK)`). */
  forShare: () => this;
  /** {@link forShare}, failing immediately instead of waiting on an already-locked row. */
  forShareNowait: () => this;
  /** {@link forShare}, silently skipping already-locked rows instead of waiting. */
  forShareSkipLocked: () => this;
  clearRowLock: () => this;
  /** MySQL `USE INDEX (index)` on a FROM/JOIN table alias. Other dialects throw at parse time. */
  hintUseIndex: (tableNameOrAlias: string, indexName: string) => this;
  /** MySQL `FORCE INDEX (index)` on a FROM/JOIN table alias. */
  hintForceIndex: (tableNameOrAlias: string, indexName: string) => this;
  /** MSSQL trailing `OPTION (...)` clause, e.g. `hintMssqlOption('RECOMPILE')`. */
  hintMssqlOption: (optionText: string) => this;
  /**
   * Documented raw hint escape hatch — caller owns dialect correctness (e.g. Postgres
   * `/*+ SeqScan(users) *\/` comments, optimizer-specific syntax).
   */
  hintRaw: (rawHint: string) => this;
  clearHints: () => this;
  /** Invokes a stored procedure: Postgres/MySQL `CALL`, MSSQL `EXEC`. Not supported on SQLite. */
  /**
   * NO owner is injected — see {@link fromTableFunction} for the measurement. The default owner is a
   * TABLE default, and qualifying a ROUTINE with it puts every built-in out of reach:
   * `SELECT "public"."generate_series"()` and `[dbo].[STRING_SPLIT](...)` are both rejected by a live
   * server (`function ... does not exist`, `Invalid object name 'dbo.STRING_SPLIT'`), while the
   * unqualified call resolves through `search_path` / the default schema exactly as intended. Nothing
   * is lost for a user's own routine, which resolves the same way; use the `WithOwner` variant when it
   * genuinely lives in a named schema.
   */
  callProcedure: (name: string) => this;
  /** {@link callProcedure}, qualified with an explicit schema/owner. */
  callProcedureWithOwner: (owner: string, name: string) => this;
  /**
   * Invokes a stored function as an expression: `SELECT name(...)` (or, with
   * {@link CallReturnIntent.ResultSet}, `SELECT * FROM name(...)` for a set-returning /
   * table-valued function — refused on MySQL, which has none). Not supported on SQLite.
   */
  callFunction: (name: string, returnIntent?: CallReturnIntent) => this;
  /** {@link callFunction}, qualified with an explicit schema/owner. */
  callFunctionWithOwner: (owner: string, name: string, returnIntent?: CallReturnIntent) => this;
  /** Appends a positional IN argument. */
  procParam: (value: any) => this;
  /** Appends several positional IN arguments in order. */
  procParams: (values: any[]) => this;
  /**
   * Appends a named IN argument (Postgres `name := value`, MSSQL `@name = value`). Not supported
   * on MySQL, which has no named-argument call syntax — throws at parse time.
   */
  procParamNamed: (name: string, value: any) => this;
  /** Appends a positional argument as raw SQL, emitted verbatim (e.g. a computed expression). */
  procParamRaw: (raw: string) => this;
  /**
   * Appends an output-only argument to a **procedure** call (refused on function calls — a
   * function's result is its return expression, not an output parameter). `name` is the MSSQL
   * declared variable / MySQL session variable identifier — required on both, conventionally the
   * same as the procedure's own parameter name; Postgres has no variables and reads the OUT value
   * back as a result column of the `CALL` instead, so `name` there only matters if you also want
   * this argument to use named-call syntax.
   *
   * @param sqlType - The MSSQL `DECLARE`d type (e.g. `'INT'`, `'NVARCHAR(50)'`). Required on
   *   MSSQL — throws at parse time if omitted there. Ignored on Postgres/MySQL.
   */
  procParamOut: (name: string, sqlType?: string) => this;
  /** {@link procParamOut}, additionally seeding the variable/argument with an initial `value`. */
  procParamInOut: (name: string, value: any, sqlType?: string) => this;
  /** Clears a previously configured procedure/function call. */
  clearCall: () => this;
}
//#endregion
//#region src/builder/multi-builder.d.ts
/**
 * Composes multiple {@link QueryBuilder} statements into a single SQL string, optionally wrapped
 * in a transaction. Obtain one from a dialect entry point (e.g.
 * `new PostgresQuery().newMultiBuilder()`) rather than constructing directly. Named builders can
 * be removed or reordered before rendering.
 *
 * `V` is the per-engine builder view {@link addBuilder} hands back, so a batch obtained from a
 * dialect facade narrows each statement to that engine's honest surface — exactly like
 * `newBuilder()`. It defaults to the wide {@link QueryBuilder} for a directly-constructed batch.
 */
declare class MultiBuilder<V = QueryBuilder> {
  #private;
  constructor(config: Dialect);
  /** Adds a named builder to the batch and returns it, typed as the engine's narrow view {@link V}. */
  addBuilder: (builderName: string) => V;
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
  /** HAVING clause. */
  readonly Having: "Having";
  /** ORDER BY clause. */
  readonly OrderBy: "OrderBy";
  /** LIMIT, OFFSET, FETCH, TOP, etc. */
  readonly LimitOffset: "LimitOffset";
  /** INSERT statement. */
  readonly Insert: "Insert";
  /** UPDATE statement. */
  readonly Update: "Update";
  /** DELETE statement. */
  readonly Delete: "Delete";
  /** Stored procedure/function invocation. */
  readonly Call: "Call";
  /** MERGE statement. */
  readonly Merge: "Merge";
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
/**
 * A column reference, qualified by its table or alias only when there IS one.
 *
 * An empty alias means "unqualified" — the convention `fromTable(name, '')` has always used, and
 * the one the emission corpus pins ("from table without an alias"). Every other clause used to
 * concatenate `quoteIdentifier(alias) + '.' + quoteIdentifier(column)` unconditionally, so the same
 * empty string that correctly suppressed `AS ""` in FROM produced a zero-length delimited
 * identifier everywhere else. Measured against the harness on the shipped 11.0.0:
 *
 *     WHERE ""."id" = $1   ->  Postgres: ERROR: zero-length delimited identifier
 *     WHERE ""."id" = ?    ->  SQLite:   SQLITE_ERROR: no such column: .id
 *     WHERE ``.`id` = ?    ->  MySQL:    ACCEPTED — returns the row
 *
 * MySQL accepting it is what makes this worse than a plain syntax error: the same builder output
 * runs on one dialect and is rejected by the others, which is precisely the portability trap this
 * library exists to make impossible. Routing every qualified reference through here is what keeps
 * the FROM clause's convention true in all of them.
 */
declare function qualifiedColumn(tableNameOrAlias: string | undefined, columnName: string | undefined, delimiters: ConfigurationDelimiters): string;
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
  newBuilder: (rc?: RuntimeConfiguration) => MssqlQueryBuilder;
  /** Creates a multi-statement builder for batching statements, optionally in a transaction. */
  newMultiBuilder: (rc?: RuntimeConfiguration) => MultiBuilder<MssqlQueryBuilder>;
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
  newBuilder: (rc?: RuntimeConfiguration) => MysqlQueryBuilder;
  /** Creates a multi-statement builder for batching statements, optionally in a transaction. */
  newMultiBuilder: (rc?: RuntimeConfiguration) => MultiBuilder<MysqlQueryBuilder>;
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
  newBuilder: (rc?: RuntimeConfiguration) => PostgresQueryBuilder;
  /** Creates a multi-statement builder for batching statements, optionally in a transaction. */
  newMultiBuilder: (rc?: RuntimeConfiguration) => MultiBuilder<PostgresQueryBuilder>;
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
  newBuilder: (rc?: RuntimeConfiguration) => SqliteQueryBuilder;
  /** Creates a multi-statement builder for batching statements, optionally in a transaction. */
  newMultiBuilder: (rc?: RuntimeConfiguration) => MultiBuilder<SqliteQueryBuilder>;
}
//#endregion
//#region src/expression/scalar.d.ts
/** The shape of the {@link Fn} scalar-expression helpers. */
type ScalarExpressions = {
  /** NULL-skipping string concatenation. See {@link Fn.concat}. */
  concat(operands: string[], databaseType: DatabaseType): string;
  /** Character (not byte) length. See {@link Fn.charLength}. */
  charLength(operand: string, databaseType: DatabaseType): string;
  /** Round to `places` decimals. See {@link Fn.round}. */
  round(operand: string, places: string | number, databaseType: DatabaseType): string;
  /** The current-timestamp expression. See {@link Fn.now}. */
  now(databaseType: DatabaseType): string;
  /** Fractional (never integer) division. See {@link Fn.divide}. */
  divide(numerator: string, denominator: string, databaseType: DatabaseType): string;
};
/**
 * Pure, per-dialect emit helpers for scalar expressions — the dialect-correctness knowledge for a
 * handful of common functions, factored out so an expression compiler (DeeBee's formula compiler is
 * one consumer) can build normalized SQL without re-deriving each dialect's quirks.
 *
 * Every helper takes ALREADY-BUILT operand SQL — quoted/qualified by the caller — plus the target
 * {@link DatabaseType}, and returns a SQL fragment. No identifier quoting, no parameter binding, no
 * `{Column}` resolution: those stay with the caller. This is deliberately NOT an expression AST —
 * just the normalization helpers.
 */
declare const Fn: ScalarExpressions;
//#endregion
export { BuilderType, BuilderView, CallKind, CallParamDirection, CallParamState, CallReturnIntent, CallState, CommonQueryBuilder, ConfigurationDelimiters, CteState, DatabaseType, Dialect, Fn, FrameBoundType, FrameUnit, FromState, FullTextColumnRef, FullTextMode, GroupByColumnRef, GroupByState, HavingState, HintKind, HintState, InsertState, JoinOnBuilder, JoinOnOperator, JoinOnState, JoinOperator, JoinState, JoinType, JsonExtractMode, MergeAssignment, MergeBuilder, MergeExpr, MergeState, MergeUsing, MergeWhenAction, MergeWhenMatch, MergeWhenState, MssqlQuery, MssqlQueryBuilder, MultiBuilder, MultiBuilderTransactionState, MysqlQuery, MysqlQueryBuilder, NullsOrder, OrderByDirection, OrderByState, ParserArea, ParserError, PostgresQuery, PostgresQueryBuilder, PreparedSql, QueryBuilder, QueryState, QueryType, ReturningState, RowLockMode, RowLockState, RowLockWait, RuntimeConfiguration, SelectState, SqliteQuery, SqliteQueryBuilder, ToSqlOptions, UnionState, UpdateState, UpsertAction, UpsertState, WhereOperator, WhereState, WindowBuilder, WindowFrameBoundState, WindowFrameState, WindowOrderByState, WindowPartitionByState, WindowState, _assertQueryBuilderSatisfiesViews, createCallState, createCteState, createFromState, createGroupByState, createHavingState, createHintState, createInsertState, createJoinOnState, createJoinState, createMergeState, createOrderByState, createQueryState, createReturningState, createRowLockState, createSelectState, createUnionState, createUpdateState, createUpsertState, createWhereState, createWindowState, defaultToSql, mssqlConfiguration, mysqlConfiguration, parse, parseMulti, parseMultiRaw, parsePrepared, parseRaw, postgresConfiguration, qualifiedColumn, quoteIdentifier, raw, source, sqliteConfiguration, target, value };
//# sourceMappingURL=index.d.mts.map