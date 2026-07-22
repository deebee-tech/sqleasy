//#region src/enums/builder-type.ts
/**
* Internal discriminator for the kind of builder operation stored in a state entry.
* Used by the query builder to track fragments (FROM, WHERE, JOIN, etc.).
*/
const BuilderType = {
	/** Logical AND between predicate groups or conditions. */
	And: "And",
	/** FROM clause sourced from a nested builder/subquery. */
	FromBuilder: "FromBuilder",
	/** FROM clause referencing a table name. */
	FromTable: "FromTable",
	/** FROM clause using raw SQL text. */
	FromRaw: "FromRaw",
	/** FROM table-valued function / set-returning function call. */
	FromFunction: "FromFunction",
	/** FROM LATERAL derived table. */
	FromLateral: "FromLateral",
	/** GROUP BY on a column reference. */
	GroupByColumn: "GroupByColumn",
	/** GROUP BY using raw SQL. */
	GroupByRaw: "GroupByRaw",
	/** GROUP BY ROLLUP (...). */
	GroupByRollup: "GroupByRollup",
	/** GROUP BY CUBE (...). */
	GroupByCube: "GroupByCube",
	/** GROUP BY GROUPING SETS (...). */
	GroupByGroupingSets: "GroupByGroupingSets",
	/** HAVING condition (standard form). */
	Having: "Having",
	/** HAVING clause using raw SQL. */
	HavingRaw: "HavingRaw",
	/** `HAVING COUNT(x) > n` — the canonical HAVING, previously havingRaw-only. */
	HavingAggregate: "HavingAggregate",
	/** HAVING column BETWEEN low AND high. */
	HavingBetween: "HavingBetween",
	/** Opens a parenthesized HAVING group. */
	HavingGroupBegin: "HavingGroupBegin",
	/** Nested HAVING built from a sub-builder. */
	HavingGroupBuilder: "HavingGroupBuilder",
	/** Closes a parenthesized HAVING group. */
	HavingGroupEnd: "HavingGroupEnd",
	/** HAVING EXISTS (subquery from builder). */
	HavingExistsBuilder: "HavingExistsBuilder",
	/** HAVING IN (subquery from builder). */
	HavingInBuilder: "HavingInBuilder",
	/** HAVING IN (literal value list). */
	HavingInValues: "HavingInValues",
	/** HAVING NOT EXISTS (subquery from builder). */
	HavingNotExistsBuilder: "HavingNotExistsBuilder",
	/** HAVING NOT IN (subquery from builder). */
	HavingNotInBuilder: "HavingNotInBuilder",
	/** HAVING NOT IN (literal value list). */
	HavingNotInValues: "HavingNotInValues",
	/** HAVING column IS NOT NULL. */
	HavingNotNull: "HavingNotNull",
	/** HAVING column IS NULL. */
	HavingNull: "HavingNull",
	/** INSERT values or body as raw SQL. */
	InsertRaw: "InsertRaw",
	/** JOIN defined via a nested builder. */
	JoinBuilder: "JoinBuilder",
	/** JOIN ON or clause fragment as raw SQL. */
	JoinRaw: "JoinRaw",
	/** JOIN targeting a table reference. */
	JoinTable: "JoinTable",
	/** No operation / placeholder. */
	None: "None",
	/** Logical OR between predicate groups or conditions. */
	Or: "Or",
	/** ORDER BY on a column with optional direction. */
	OrderByColumn: "OrderByColumn",
	/** ORDER BY using raw SQL. */
	OrderByRaw: "OrderByRaw",
	/** SELECT * (all columns). */
	SelectAll: "SelectAll",
	/** SELECT list entry from a nested builder/subquery. */
	SelectBuilder: "SelectBuilder",
	/** SELECT list entry for a single column/expression. */
	SelectColumn: "SelectColumn",
	/** SELECT list entry as raw SQL. */
	SelectRaw: "SelectRaw",
	/** SELECT list entry for a window function (`fn(...) OVER (...)`). */
	SelectWindow: "SelectWindow",
	/** SELECT list JSON path extraction. */
	SelectJsonExtract: "SelectJsonExtract",
	/** `COUNT(x)` / `SUM(x)` / … in the SELECT list. */
	SelectAggregate: "SelectAggregate",
	/** `string_agg(x, sep ORDER BY y)` / `GROUP_CONCAT(x …)` — ordered string aggregation. */
	SelectStringAgg: "SelectStringAgg",
	/** `json_agg(x)` / `json_object_agg(k, v)` and their per-dialect spellings. */
	SelectJsonAgg: "SelectJsonAgg",
	/** UPDATE SET column assignment. */
	UpdateColumn: "UpdateColumn",
	/** UPDATE fragment as raw SQL. */
	UpdateRaw: "UpdateRaw",
	/** UNION set operator (distinct). */
	Union: "Union",
	/** UNION ALL set operator. */
	UnionAll: "UnionAll",
	/** INTERSECT set operator. */
	Intersect: "Intersect",
	/** EXCEPT / MINUS set operator. */
	Except: "Except",
	/** Common table expression defined via a builder. */
	CteBuilder: "CteBuilder",
	/** CTE definition as raw SQL. */
	CteRaw: "CteRaw",
	/** WHERE predicate (standard comparison or helper). */
	Where: "Where",
	/** `(a, b) > (?, ?)` — a row-value comparison against a single tuple. */
	WhereRowValue: "WhereRowValue",
	/** `(a, b) IN ((?,?), (?,?))` — a row-value IN over a list of tuples. */
	WhereRowValueIn: "WhereRowValueIn",
	/** WHERE column BETWEEN low AND high. */
	WhereBetween: "WhereBetween",
	/** Opens a parenthesized WHERE group. */
	WhereGroupBegin: "WhereGroupBegin",
	/** Nested WHERE built from a sub-builder. */
	WhereGroupBuilder: "WhereGroupBuilder",
	/** Closes a parenthesized WHERE group. */
	WhereGroupEnd: "WhereGroupEnd",
	/** WHERE EXISTS (subquery from builder). */
	WhereExistsBuilder: "WhereExistsBuilder",
	/** WHERE IN (subquery from builder). */
	WhereInBuilder: "WhereInBuilder",
	/** WHERE IN (literal value list). */
	WhereInValues: "WhereInValues",
	/** WHERE NOT EXISTS (subquery from builder). */
	WhereNotExistsBuilder: "WhereNotExistsBuilder",
	/** WHERE NOT IN (subquery from builder). */
	WhereNotInBuilder: "WhereNotInBuilder",
	/** WHERE NOT IN (literal value list). */
	WhereNotInValues: "WhereNotInValues",
	/** WHERE column IS NOT NULL. */
	WhereNotNull: "WhereNotNull",
	/** WHERE column IS NULL. */
	WhereNull: "WhereNull",
	/** WHERE fragment as raw SQL. */
	WhereRaw: "WhereRaw",
	/** WHERE JSON path extract comparison. */
	WhereJsonExtract: "WhereJsonExtract",
	/** WHERE JSON containment (`@>` / `JSON_CONTAINS`). */
	WhereJsonContains: "WhereJsonContains",
	/** WHERE full-text search predicate. */
	WhereFullText: "WhereFullText",
	/** HAVING JSON path extract comparison. */
	HavingJsonExtract: "HavingJsonExtract",
	/** HAVING JSON containment. */
	HavingJsonContains: "HavingJsonContains",
	/** HAVING full-text search predicate. */
	HavingFullText: "HavingFullText"
};
//#endregion
//#region src/enums/where-operator.ts
/**
* Comparison operators for WHERE and HAVING predicates.
*/
const WhereOperator = {
	/** Equality (=). */
	Equals: "Equals",
	/** Inequality (<> or !=). */
	NotEquals: "NotEquals",
	/** Strictly greater than (>). */
	GreaterThan: "GreaterThan",
	/** Greater than or equal (>=). */
	GreaterThanOrEquals: "GreaterThanOrEquals",
	/** Strictly less than (<). */
	LessThan: "LessThan",
	/** Less than or equal (<=). */
	LessThanOrEquals: "LessThanOrEquals",
	/** No operator specified. */
	None: "None",
	/** Pattern match (LIKE) — the bound value carries any `%`/`_` wildcards. */
	Like: "Like",
	/** Negated pattern match (NOT LIKE). */
	NotLike: "NotLike",
	/**
	* Literal substring match — `LIKE %value% ESCAPE …` with the LIKE metacharacters (`%`, `_`, and
	* MSSQL's `[`) in the bound value ESCAPED, so a search for `50%` matches the literal string, not
	* "anything starting 50". The value is the raw text to find; the wildcards are added here. Unlike
	* {@link Like}, the caller does NOT supply wildcards.
	*/
	Contains: "Contains",
	/** Negated literal substring match (`NOT LIKE %value%`, escaped) — see {@link Contains}. */
	NotContains: "NotContains",
	/** Literal prefix match (`LIKE value% ESCAPE …`, escaped) — see {@link Contains}. */
	StartsWith: "StartsWith",
	/** Literal suffix match (`LIKE %value ESCAPE …`, escaped) — see {@link Contains}. */
	EndsWith: "EndsWith",
	/**
	* Case-insensitive pattern match. Native `ILIKE` on Postgres; on MySQL, SQLite, and MSSQL
	* (none of which have `ILIKE`) it is rewritten to `LOWER(col) LIKE LOWER(?)`.
	*/
	Ilike: "Ilike",
	/** Negated case-insensitive pattern match — see {@link WhereOperator.Ilike}. */
	NotIlike: "NotIlike",
	/**
	* Regular-expression match. Native `~` on Postgres and `REGEXP` on MySQL (where case sensitivity is
	* collation-driven — the default utf8mb4 collation is case-insensitive). SQLite (`REGEXP` needs an
	* app-registered function) and MSSQL (no regex engine before SQL Server 2025) have no built-in
	* operator and THROW. The bound value is the pattern.
	*/
	Regex: "Regex",
	/** Negated regular-expression match — see {@link Regex}. */
	NotRegex: "NotRegex",
	/** Case-insensitive regular-expression match. Native `~*` on Postgres; on MySQL it is the same as
	* {@link Regex} (case sensitivity is collation-driven, not operator-driven). SQLite/MSSQL throw. */
	Iregex: "Iregex",
	/** Negated case-insensitive regular-expression match — see {@link Iregex}. */
	NotIregex: "NotIregex",
	/**
	* Null-safe inequality: true unless both sides are equal, treating two `NULL`s as equal
	* (unlike `<>`, which is `NULL` — never true — whenever either side is `NULL`). Native `IS
	* DISTINCT FROM` on Postgres/SQLite; MySQL rewrites to `NOT (a <=> b)`; MSSQL (no native
	* operator) rewrites to `(col <> value OR col IS NULL)`, or `col IS NOT NULL` for a NULL value.
	*/
	IsDistinctFrom: "IsDistinctFrom",
	/**
	* Null-safe equality: true when both sides are equal OR both are `NULL` (unlike `=`, which is
	* `NULL` whenever either side is `NULL`). Native `IS NOT DISTINCT FROM` on Postgres/SQLite;
	* MySQL rewrites to its native `<=>` operator; MSSQL (no native operator) rewrites to `col =
	* value`, or `col IS NULL` for a NULL value — sound because the compared value is always a bound literal.
	*/
	IsNotDistinctFrom: "IsNotDistinctFrom"
};
//#endregion
//#region src/state/where.ts
/** Creates a {@link WhereState} with default field values. */
const createWhereState = () => ({
	builderType: BuilderType.None,
	tableNameOrAlias: void 0,
	columnName: void 0,
	whereOperator: WhereOperator.None,
	raw: void 0,
	subquery: void 0,
	values: [],
	jsonPath: void 0,
	jsonExtractMode: void 0,
	fullTextMode: void 0,
	fullTextColumns: void 0
});
//#endregion
//#region src/enums/call-kind.ts
/**
* Whether a {@link QueryBuilder.callProcedure}/{@link QueryBuilder.callFunction} invocation
* targets a stored procedure or a stored function — the two are emitted differently on every
* dialect (a `CALL`/`EXEC` statement vs. an expression usable in a `SELECT`).
*/
const CallKind = {
	/** A stored procedure, invoked as its own statement (`CALL name(...)` / `EXEC name ...`). */
	Procedure: "Procedure",
	/** A stored function, invoked as a `SELECT` expression (`SELECT name(...)`). */
	Function: "Function"
};
//#endregion
//#region src/enums/call-param-direction.ts
/**
* The calling convention for one {@link QueryBuilder.callProcedure}/{@link
* QueryBuilder.callFunction} argument. OUT/INOUT are meaningful only for procedures — see {@link
* QueryBuilder.procParamOut}/{@link QueryBuilder.procParamInOut}.
*/
const CallParamDirection = {
	/** An input value, bound like any other parameter. */
	In: "In",
	/** An output-only slot (MSSQL: a declared local variable; MySQL: a session variable). */
	Out: "Out",
	/** Both an input value and an output slot. */
	InOut: "InOut"
};
//#endregion
//#region src/enums/call-return-intent.ts
/**
* What a {@link QueryBuilder.callFunction} call is expected to return, which decides whether
* Postgres/MSSQL wrap the invocation in `SELECT expr` (a single scalar) or `SELECT * FROM expr`
* (a set-returning / table-valued function). MySQL has no table-valued functions and refuses
* {@link ResultSet}.
*/
const CallReturnIntent = {
	/** No return value. Only meaningful for procedures — never valid for {@link QueryBuilder.callFunction}. */
	Void: "Void",
	/** A single scalar value: `SELECT name(...)`. */
	Scalar: "Scalar",
	/** A set-returning / table-valued function: `SELECT * FROM name(...)`. */
	ResultSet: "ResultSet"
};
//#endregion
//#region src/enums/full-text-mode.ts
/**
* Full-text search match mode — not every dialect supports every mode; unsupported combos throw
* at parse time.
*/
const FullTextMode = {
	/** Natural-language / plain search (PG `plainto_tsquery`, MySQL natural mode, MSSQL `FREETEXT`). */
	Natural: "Natural",
	/** Boolean / structured query (PG `to_tsquery`, MySQL boolean mode, MSSQL `CONTAINS`). */
	Boolean: "Boolean",
	/** Phrase search where the dialect distinguishes it (MySQL `IN BOOLEAN MODE` phrase, PG phrase). */
	Phrase: "Phrase"
};
//#endregion
//#region src/enums/hint-kind.ts
/**
* Structured query-hint kinds. Each dialect accepts a different subset; unsupported combos throw
* at parse time. Use {@link QueryBuilder.hintRaw} for hints this enum cannot express.
*/
const HintKind = {
	/** MySQL `USE INDEX (name)` on a FROM/JOIN table reference. */
	UseIndex: "UseIndex",
	/** MySQL `FORCE INDEX (name)` on a FROM/JOIN table reference. */
	ForceIndex: "ForceIndex",
	/** MSSQL trailing `OPTION (...)` clause on a SELECT. */
	MssqlOption: "MssqlOption",
	/** Dialect-specific raw hint SQL — caller owns correctness. */
	Raw: "Raw"
};
//#endregion
//#region src/enums/json-extract-mode.ts
/**
* Whether a JSON path read returns text (`->>` / `JSON_UNQUOTE`) or a JSON value (`->` /
* `JSON_EXTRACT`).
*/
const JsonExtractMode = {
	/** Text extraction (`->>` on Postgres, `JSON_UNQUOTE(JSON_EXTRACT(...))` elsewhere). */
	Text: "Text",
	/** JSON value extraction (`->` on Postgres, `JSON_EXTRACT` elsewhere). */
	Object: "Object"
};
//#endregion
//#region src/enums/parser-area.ts
/**
* Indicates which SQL clause produced a parser error for clearer diagnostics.
*/
const ParserArea = {
	/** SELECT list or projections. */
	Select: "Select",
	/** FROM clause. */
	From: "From",
	/** JOIN definitions. */
	Join: "Join",
	/** WHERE clause. */
	Where: "Where",
	/** HAVING clause. */
	Having: "Having",
	/** ORDER BY clause. */
	OrderBy: "OrderBy",
	/** LIMIT, OFFSET, FETCH, TOP, etc. */
	LimitOffset: "LimitOffset",
	/** INSERT statement. */
	Insert: "Insert",
	/** UPDATE statement. */
	Update: "Update",
	/** DELETE statement. */
	Delete: "Delete",
	/** Stored procedure/function invocation. */
	Call: "Call",
	/** MERGE statement. */
	Merge: "Merge",
	/** Cross-clause or unspecified area. */
	General: "General"
};
//#endregion
//#region src/enums/join-type.ts
/**
* SQL JOIN kinds: inner, outer variants, cross join, or none.
*/
const JoinType = {
	/** INNER JOIN. */
	Inner: "Inner",
	/** LEFT JOIN (synonym for left outer in many dialects). */
	Left: "Left",
	/** LEFT OUTER JOIN. */
	LeftOuter: "LeftOuter",
	/** RIGHT JOIN. */
	Right: "Right",
	/** RIGHT OUTER JOIN. */
	RightOuter: "RightOuter",
	/** FULL OUTER JOIN. */
	FullOuter: "FullOuter",
	/** CROSS JOIN. */
	Cross: "Cross",
	/** LATERAL derived table (Postgres/MySQL `JOIN LATERAL`; MSSQL maps to `CROSS APPLY`). */
	Lateral: "Lateral",
	/** MSSQL `CROSS APPLY` (Postgres/MySQL: `CROSS JOIN LATERAL`). */
	CrossApply: "CrossApply",
	/** MSSQL `OUTER APPLY` (Postgres/MySQL: `LEFT JOIN LATERAL`). */
	OuterApply: "OuterApply",
	/** No join type / not applicable. */
	None: "None"
};
//#endregion
//#region src/enums/nulls-order.ts
/**
* `NULLS FIRST` / `NULLS LAST` placement for an ORDER BY term (top-level or inside a window's
* `OVER (... ORDER BY ...)`). Postgres and SQLite have native syntax; MySQL and MSSQL have
* neither, and get an equivalent `CASE WHEN col IS NULL THEN … END` sort-key emulation — see
* `default-order-by.ts`.
*/
const NullsOrder = {
	/** No explicit NULL placement — dialect default (NULLS LAST for ASC, NULLS FIRST for DESC, per SQL:2003). */
	None: "None",
	/** NULLs sort before all non-NULL values. */
	First: "First",
	/** NULLs sort after all non-NULL values. */
	Last: "Last"
};
//#endregion
//#region src/enums/order-by-direction.ts
/**
* Sort direction for ORDER BY columns and expressions.
*/
const OrderByDirection = {
	/** Ascending (ASC). */
	Ascending: "Ascending",
	/** Descending (DESC). */
	Descending: "Descending",
	/** No direction / dialect default. */
	None: "None"
};
//#endregion
//#region src/enums/query-type.ts
/**
* High-level SQL statement kind the builder is assembling.
*/
const QueryType = {
	/** SELECT query. */
	Select: "Select",
	/** INSERT statement. */
	Insert: "Insert",
	/** UPDATE statement. */
	Update: "Update",
	/** DELETE statement. */
	Delete: "Delete",
	/** Stored procedure/function invocation (`CALL`/`EXEC`/`SELECT func(...)`). */
	Call: "Call",
	/** `MERGE` statement — native T-SQL only. */
	Merge: "Merge"
};
//#endregion
//#region src/enums/row-lock-mode.ts
/**
* The row-locking mode requested for a SELECT (`FOR UPDATE` / `FOR SHARE` and MSSQL's
* table-hint equivalents).
*/
const RowLockMode = {
	/** No row lock requested. */
	None: "None",
	/** Exclusive row lock — blocks other writers (`FOR UPDATE`, MSSQL `WITH (UPDLOCK, ROWLOCK)`). */
	ForUpdate: "ForUpdate",
	/** Shared row lock — blocks writers, allows other readers (`FOR SHARE`, MSSQL `WITH (HOLDLOCK, ROWLOCK)`). */
	ForShare: "ForShare"
};
//#endregion
//#region src/enums/row-lock-wait.ts
/**
* Wait behavior for a {@link RowLockMode}, when the requested rows are already locked.
*/
const RowLockWait = {
	/** Block until the lock is available (the dialect's default wait behavior). */
	Default: "Default",
	/** Fail immediately instead of waiting (`NOWAIT`). */
	Nowait: "Nowait",
	/** Silently skip already-locked rows instead of waiting (`SKIP LOCKED`, MSSQL `READPAST`). */
	SkipLocked: "SkipLocked"
};
//#endregion
//#region src/enums/upsert-action.ts
/**
* The conflict-resolution action for an INSERT's upsert clause.
*/
const UpsertAction = {
	/** No upsert clause configured. */
	None: "None",
	/** Conflicting rows are silently skipped (PG/SQLite `DO NOTHING`, MySQL `INSERT IGNORE`). */
	DoNothing: "DoNothing",
	/** Conflicting rows are updated (PG/SQLite `DO UPDATE SET`, MySQL `ON DUPLICATE KEY UPDATE`). */
	DoUpdate: "DoUpdate"
};
//#endregion
//#region src/helpers/parser-error.ts
/** Error thrown when SQL parsing fails; {@link ParserError.name} is `QueryParserError`. */
var ParserError = class extends Error {
	/**
	* @param parserArea - Phase or region of the parser where the error occurred.
	* @param message - Human-readable parse error description.
	*/
	constructor(parserArea, message) {
		const finalMessage = `${parserArea}: ${message}`;
		super(finalMessage);
		this.name = "QueryParserError";
	}
};
//#endregion
//#region src/enums/database-type.ts
/**
* Identifies the target SQL database dialect for generation and quoting behavior.
*/
const DatabaseType = {
	/** Microsoft SQL Server. */
	Mssql: "mssql",
	/** PostgreSQL. */
	Postgres: "postgres",
	/** MySQL or compatible (e.g. MariaDB). */
	Mysql: "mysql",
	/** SQLite. */
	Sqlite: "sqlite",
	/** Dialect not set or unrecognized. */
	Unknown: "unknown"
};
//#endregion
//#region src/enums/multi-builder-transaction-state.ts
/**
* Whether a multi-statement batch is wrapped in an explicit transaction block.
*/
const MultiBuilderTransactionState = {
	/** Emit the dialect's BEGIN/COMMIT (or equivalent) around the batch. */
	TransactionOn: "TransactionOn",
	/** Do not wrap the batch in a transaction. */
	TransactionOff: "TransactionOff",
	/** Use default / unspecified transaction behavior. */
	None: "None"
};
//#endregion
//#region src/enums/parser-mode.ts
/**
* Whether values are inlined into the SQL (Raw) or surfaced as bound parameters (Prepared).
*/
const ParserMode = {
	/** Values are rendered inline into the SQL string. */
	Raw: "Raw",
	/** Values are replaced by placeholders and surfaced separately. */
	Prepared: "Prepared",
	/** No mode / unused. */
	None: "None"
};
//#endregion
//#region src/helpers/dialect-name.ts
/**
* How a dialect is named in a refusal message, so every one of them reads `<Dialect> has no ...`.
*
* Refusals are part of the contract — the golden corpus pins their exact text and every language
* port reproduces it — so the spelling has to come from one place rather than being retyped at each
* throw site.
*
* `Unknown` is a real member of {@link DatabaseType} and reaches here whenever a dialect branch
* falls through, so it gets a reading that is honest about not knowing rather than blaming whichever
* engine happened to be last in the chain.
*/
const dialectDisplayName = (databaseType) => ({
	[DatabaseType.Mssql]: "MSSQL",
	[DatabaseType.Mysql]: "MySQL",
	[DatabaseType.Postgres]: "Postgres",
	[DatabaseType.Sqlite]: "SQLite",
	[DatabaseType.Unknown]: "This dialect"
})[databaseType];
//#endregion
//#region src/helpers/sql.ts
const NUL = String.fromCharCode(0);
/**
* Refuses a value that has no SQL representation, at the point it is bound or inlined.
*
* `NaN`/`Infinity` used to render as the bare words `NaN`/`Infinity` (invalid SQL in every dialect)
* when inlined, and to sail straight into the bound `params` otherwise — surfacing as a driver-level
* error far from the call that caused it, or silently coercing. Fail here, where the caller is.
*/
const assertBindableValue = (value) => {
	if (typeof value === "number" && !Number.isFinite(value)) throw new ParserError(ParserArea.General, `value is not a finite number: ${value}`);
};
/**
* Replaces each {@link PLACEHOLDER_TOKEN} with the dialect's placeholder, in emission order.
*
* Values are appended in the same order their tokens are, so the Nth token binds the Nth value.
* `nth` receives the zero-based index, which Postgres needs for `$1`, `$2`, … and MSSQL for
* `@p0`, `@p1`, ….
*/
const renderPlaceholders = (sql, nth) => {
	let index = 0;
	return sql.split("\0?\0").reduce((acc, part) => acc + nth(index++) + part);
};
/**
* Accumulates SQL fragments and their bound values while a parser walks a query state.
*
* Deliberately dialect-agnostic: it emits {@link PLACEHOLDER_TOKEN}, never a dialect's `?`/`$`, so
* it needs no {@link Dialect}. The dialect's placeholder is applied once, at the top-level parse.
*/
var SqlHelper = class {
	#parts = [];
	#values = [];
	#parserMode;
	constructor(parserMode) {
		this.#parserMode = parserMode;
	}
	/**
	* Emits one bound value: a {@link PLACEHOLDER_TOKEN} in Prepared mode (with the value recorded for
	* binding), or the value inlined in Raw mode.
	*
	* This appends directly rather than returning text for the caller to pass back through
	* {@link addSqlSnippet}, so that `addSqlSnippet` can reject *every* NUL byte it sees. If the token
	* passed through the public path, `addSqlSnippet` could not tell our token from a NUL sequence
	* in a caller's raw fragment — which is exactly how a raw fragment could forge a placeholder.
	*/
	addDynamicValue = (value) => {
		assertBindableValue(value);
		if (this.#parserMode === ParserMode.Prepared) {
			this.#values.push(value);
			this.#parts.push("\0?\0");
			return;
		}
		this.#parts.push(this.getValueStringFromDataType(value));
	};
	/**
	* Appends a SQL fragment. This is the path every caller-supplied raw fragment takes, so a NUL
	* byte is refused outright: it could forge a {@link PLACEHOLDER_TOKEN} and steal a bound value's
	* position, and it silently truncates the statement in some drivers. Our own tokens never come
	* through here — see {@link addDynamicValue}.
	*/
	addSqlSnippet = (sql) => {
		if (sql.includes(NUL)) throw new ParserError(ParserArea.General, "SQL fragment contains a NUL byte");
		this.#parts.push(sql);
	};
	/**
	* Splices a sub-parser's already-rendered SQL and its bound values into this helper. The sub-SQL
	* legitimately carries {@link PLACEHOLDER_TOKEN}s, so it bypasses the NUL check in
	* {@link addSqlSnippet} — its own fragments were validated when the sub-parser built them.
	*/
	addSqlSnippetWithValues = (sqlString, values) => {
		this.#values.push(...values);
		this.#parts.push(sqlString);
	};
	clear = () => {
		this.#parts = [];
		this.#values = [];
	};
	/**
	* The rendered SQL, still carrying {@link PLACEHOLDER_TOKEN} for each bound value. Sub-parsers
	* compose their output into a parent helper, so the tokens must survive until the top-level
	* parse swaps them for the dialect's placeholder via {@link renderPlaceholders}.
	*/
	getSql = () => {
		return this.#parts.join("");
	};
	getSqlDebug = () => {
		const values = this.#values;
		return renderPlaceholders(this.#parts.join(""), (index) => index < values.length ? this.getValueStringFromDataType(values[index]) : "");
	};
	getValues = () => {
		return [...this.#values];
	};
	getValueStringFromDataType = (value) => {
		if (value === null || value === void 0) return "";
		switch (typeof value) {
			case "string": return value;
			case "number":
				if (!Number.isFinite(value)) throw new ParserError(ParserArea.General, `value is not a finite number: ${value}`);
				return value.toString();
			case "boolean": return value ? "true" : "false";
			case "object":
				if (value instanceof Date) return value.toISOString();
				return JSON.stringify(value);
			default: return value.toString();
		}
	};
};
/**
* A SQL STRING LITERAL — single-quoted, with embedded quotes doubled.
*
* Exists because `JSON.stringify()` was being used for this, and a JSON string is not a SQL string.
* JSON quotes with `"`, which every dialect here reads as a DELIMITED IDENTIFIER, so the emitted SQL
* asked for a column instead of a value. Measured against real servers:
*
*   Postgres  to_tsvector("english", ...)          -> ERROR: column "english" does not exist
*   MySQL     JSON_EXTRACT(c, "$.a")               -> works ONLY under the default sql_mode;
*                                                     under ANSI_QUOTES: Unknown column '$.a'
*
* The Postgres form was broken outright and the MySQL one survived on a technicality, which is the
* more dangerous shape: it works until someone sets a perfectly ordinary sql_mode. Use this for any
* value that must reach the server AS TEXT, and `quoteIdentifier` for anything naming an object.
*/
const sqlStringLiteral = (value) => "'" + value.replaceAll("'", "''") + "'";
//#endregion
//#region src/helpers/identifier.ts
/**
* Quote a SQL identifier (schema/table/column/alias) for a dialect, escaping any embedded closing
* delimiter by doubling it — the standard SQL identifier escape (`]`→`]]` for MSSQL, `"`→`""` for
* Postgres, `` ` ``→ ` `` ` for MySQL). Identifier names are user-controlled (a dataset's table and
* column names), so without escaping a name like `x] OR [1=1` would break out of the quoting and
* inject SQL. A NUL byte can silently truncate the identifier in some drivers, so it is rejected.
*/
function quoteIdentifier(name, delimiters) {
	const id = name ?? "";
	if (id.includes("\0")) throw new ParserError(ParserArea.General, "identifier contains a NUL byte");
	const escaped = id.split(delimiters.end).join(delimiters.end + delimiters.end);
	return delimiters.begin + escaped + delimiters.end;
}
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
function qualifiedColumn(tableNameOrAlias, columnName, delimiters) {
	const column = quoteIdentifier(columnName, delimiters);
	if (tableNameOrAlias === void 0 || tableNameOrAlias === "") return column;
	return quoteIdentifier(tableNameOrAlias, delimiters) + "." + column;
}
//#endregion
//#region src/parser/default-call.ts
const AREA = ParserArea.Call;
/**
* `name`/variable identifiers are spliced into the SQL as bare syntax (`@name`, `name :=`), never
* through {@link quoteIdentifier} — quoting a T-SQL local variable or a MySQL session variable is
* not valid syntax at all. Since that text is not a bound value either, it must be restricted to a
* safe identifier shape here, or a caller-supplied name could inject arbitrary SQL.
*/
const SAFE_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const assertSafeParamName = (name) => {
	if (!SAFE_NAME_PATTERN.test(name)) throw new ParserError(AREA, `invalid parameter/variable name: "${name}"`);
};
const qualifiedCallName = (config, owner, name) => {
	let out = "";
	if (owner && owner !== "") out += quoteIdentifier(owner, config.identifierDelimiters) + ".";
	out += quoteIdentifier(name, config.identifierDelimiters);
	return out;
};
/** Emits one argument's value/raw text — shared by every dialect's `In`/`InOut` handling. */
const emitArgValue = (sqlHelper, param) => {
	if (param.raw !== void 0) {
		sqlHelper.addSqlSnippet(param.raw);
		return;
	}
	sqlHelper.addDynamicValue(param.value);
};
const emitPostgresArgs = (sqlHelper, params) => {
	sqlHelper.addSqlSnippet("(");
	let sawNamed = false;
	for (let i = 0; i < params.length; i++) {
		const param = params[i];
		const named = param.name !== void 0;
		if (named) sawNamed = true;
		else if (sawNamed) throw new ParserError(AREA, "a positional argument cannot follow a named argument");
		if (named) {
			assertSafeParamName(param.name);
			sqlHelper.addSqlSnippet(param.name + " := ");
		}
		if (param.raw !== void 0) sqlHelper.addSqlSnippet(param.raw);
		else if (param.direction === CallParamDirection.Out) sqlHelper.addDynamicValue(null);
		else sqlHelper.addDynamicValue(param.value);
		if (i < params.length - 1) sqlHelper.addSqlSnippet(", ");
	}
	sqlHelper.addSqlSnippet(")");
};
const emitPostgresCall = (sqlHelper, config, callState) => {
	if (callState.kind === CallKind.Procedure) sqlHelper.addSqlSnippet("CALL ");
	else if (callState.returnIntent === CallReturnIntent.ResultSet) sqlHelper.addSqlSnippet("SELECT * FROM ");
	else sqlHelper.addSqlSnippet("SELECT ");
	sqlHelper.addSqlSnippet(qualifiedCallName(config, callState.owner, callState.name));
	emitPostgresArgs(sqlHelper, callState.params);
};
const emitMysqlArgs = (sqlHelper, params) => {
	sqlHelper.addSqlSnippet("(");
	for (let i = 0; i < params.length; i++) {
		const param = params[i];
		if (param.name !== void 0 && param.direction === CallParamDirection.In) throw new ParserError(AREA, "MySQL does not support named parameters in CALL");
		if (param.raw !== void 0) sqlHelper.addSqlSnippet(param.raw);
		else if (param.direction === CallParamDirection.Out || param.direction === CallParamDirection.InOut) {
			if (!param.name) throw new ParserError(AREA, "OUT/INOUT parameters require a session variable name on MySQL");
			assertSafeParamName(param.name);
			sqlHelper.addSqlSnippet("@" + param.name);
		} else sqlHelper.addDynamicValue(param.value);
		if (i < params.length - 1) sqlHelper.addSqlSnippet(", ");
	}
	sqlHelper.addSqlSnippet(")");
};
const emitMysqlCall = (sqlHelper, config, callState) => {
	if (callState.kind === CallKind.Function) {
		if (callState.returnIntent === CallReturnIntent.ResultSet) throw new ParserError(AREA, "MySQL does not support table-valued functions");
		sqlHelper.addSqlSnippet("SELECT ");
		sqlHelper.addSqlSnippet(qualifiedCallName(config, callState.owner, callState.name));
		emitMysqlArgs(sqlHelper, callState.params);
		return;
	}
	for (const param of callState.params) if (param.direction === CallParamDirection.InOut) {
		assertSafeParamName(param.name);
		sqlHelper.addSqlSnippet("SET @" + param.name + " = ");
		sqlHelper.addDynamicValue(param.value);
		sqlHelper.addSqlSnippet("; ");
	}
	sqlHelper.addSqlSnippet("CALL ");
	sqlHelper.addSqlSnippet(qualifiedCallName(config, callState.owner, callState.name));
	emitMysqlArgs(sqlHelper, callState.params);
};
const emitMssqlDeclarations = (sqlHelper, params) => {
	for (const param of params) {
		if (param.direction !== CallParamDirection.Out && param.direction !== CallParamDirection.InOut) continue;
		if (!param.name) throw new ParserError(AREA, "OUT/INOUT parameters require a variable name on MSSQL");
		if (!param.sqlType) throw new ParserError(AREA, "OUT/INOUT parameters require an explicit sqlType on MSSQL");
		assertSafeParamName(param.name);
		sqlHelper.addSqlSnippet("DECLARE @" + param.name + " " + param.sqlType);
		if (param.direction === CallParamDirection.InOut) {
			sqlHelper.addSqlSnippet(" = ");
			sqlHelper.addDynamicValue(param.value);
		}
		sqlHelper.addSqlSnippet("; ");
	}
};
const emitMssqlProcedureArgs = (sqlHelper, params) => {
	if (params.length === 0) return;
	sqlHelper.addSqlSnippet(" ");
	let sawNamed = false;
	for (let i = 0; i < params.length; i++) {
		const param = params[i];
		const hasVariable = param.direction === CallParamDirection.Out || param.direction === CallParamDirection.InOut;
		if (hasVariable || param.name !== void 0) sawNamed = true;
		else if (sawNamed) throw new ParserError(AREA, "a positional argument cannot follow a named argument");
		if (hasVariable) sqlHelper.addSqlSnippet("@" + param.name + " = @" + param.name + " OUTPUT");
		else if (param.raw !== void 0) sqlHelper.addSqlSnippet(param.raw);
		else {
			if (param.name !== void 0) {
				assertSafeParamName(param.name);
				sqlHelper.addSqlSnippet("@" + param.name + " = ");
			}
			sqlHelper.addDynamicValue(param.value);
		}
		if (i < params.length - 1) sqlHelper.addSqlSnippet(", ");
	}
};
const emitMssqlFunctionArgs = (sqlHelper, params) => {
	sqlHelper.addSqlSnippet("(");
	for (let i = 0; i < params.length; i++) {
		const param = params[i];
		if (param.name !== void 0) throw new ParserError(AREA, "MSSQL does not support named parameters when invoking a function");
		emitArgValue(sqlHelper, param);
		if (i < params.length - 1) sqlHelper.addSqlSnippet(", ");
	}
	sqlHelper.addSqlSnippet(")");
};
const emitMssqlCall = (sqlHelper, config, callState) => {
	emitMssqlDeclarations(sqlHelper, callState.params);
	if (callState.kind === CallKind.Procedure) {
		sqlHelper.addSqlSnippet("EXEC ");
		sqlHelper.addSqlSnippet(qualifiedCallName(config, callState.owner, callState.name));
		emitMssqlProcedureArgs(sqlHelper, callState.params);
		return;
	}
	sqlHelper.addSqlSnippet(callState.returnIntent === CallReturnIntent.ResultSet ? "SELECT * FROM " : "SELECT ");
	sqlHelper.addSqlSnippet(qualifiedCallName(config, callState.owner, callState.name));
	emitMssqlFunctionArgs(sqlHelper, callState.params);
};
/**
* Renders a `CALL`/`EXEC`/`SELECT func(...)` statement for {@link QueryState.callState}. SQLite has
* no stored procedures or functions at all and refuses every call outright. OUT/INOUT parameters
* are refused for functions on every dialect — a function's result is its return expression, not
* an output parameter, and none of the `SELECT`-based function emissions below have anywhere to
* put one.
*/
const defaultCall = (state, config, mode) => {
	const sqlHelper = new SqlHelper(mode);
	if (!state.callState) throw new ParserError(AREA, "No call state provided");
	const callState = state.callState;
	if (!callState.name) throw new ParserError(AREA, "callProcedure/callFunction requires a name");
	if (config.databaseType === DatabaseType.Sqlite) throw new ParserError(AREA, "SQLite does not support stored procedures or functions (CALL/EXEC)");
	if (callState.kind === CallKind.Function) {
		for (const param of callState.params) if (param.direction !== CallParamDirection.In) throw new ParserError(AREA, "OUT/INOUT parameters are only supported for procedure calls, not functions");
	}
	if (config.databaseType === DatabaseType.Postgres) emitPostgresCall(sqlHelper, config, callState);
	else if (config.databaseType === DatabaseType.Mysql) emitMysqlCall(sqlHelper, config, callState);
	else emitMssqlCall(sqlHelper, config, callState);
	return sqlHelper;
};
//#endregion
//#region src/parser/default-cte.ts
/**
* Refuses clauses a RECURSIVE CTE's members cannot carry.
*
* SQLEasy renders a recursive CTE body as one builder — `anchor UNION ALL recursive` — so a clause
* set on that body lands at the END of the body, which is textually inside the RECURSIVE term. That
* is the one place the engines police. Measured, each construct on its own and against a working
* baseline recursive CTE that runs on all four:
*
*     in the RECURSIVE term      PG    MySQL  SQLite  MSSQL
*     ORDER BY                   ERR   ERR    OK      Msg 1033
*     LIMIT                      ERR   OK     OK      (no LIMIT in T-SQL)
*     SELECT DISTINCT            OK    ERR    OK      ERR
*     — for contrast —
*     LIMIT in the ANCHOR term   OK    OK
*     LIMIT on the OUTER select  OK    OK                          <- where it belongs
*
* ── THE ORDER BY ROW WAS MEASURED WRONG THE FIRST TIME ──
* The first probe used `ORDER BY n`, naming the CTE's declared column. SQLite rejected that with
* "1st ORDER BY term does not match any column" — a COLUMN-RESOLUTION failure, not a prohibition —
* and it was read as SQLite refusing the clause. Re-probed with a resolvable term:
*
*     … UNION ALL SELECT n+1 FROM t WHERE n<3 ORDER BY 1
*       PG      ERROR: ORDER BY in a recursive query is not implemented
*       MySQL   ERROR 1235: … 'ORDER BY over UNION in recursive Common Table Expression'
*       MSSQL   Msg 1033
*       SQLite  accepted, 3 rows
*
* Two of the three refusals name recursion explicitly, which is the evidence the first probe never
* produced. SQLite genuinely allows it, so it is not refused here. MSSQL's Msg 1033 is the generic
* "no ORDER BY in a subquery without a row cap" rule, already enforced for every inner statement in
* `to-sql.ts`, so this guard leaves MSSQL to that one rather than duplicating it.
*/
const assertRecursiveMembersSupported = (cteState, config) => {
	const body = cteState.subquery;
	if (!cteState.recursive || body === void 0) return;
	if (body.orderByStates.length > 0 && (config.databaseType === DatabaseType.Postgres || config.databaseType === DatabaseType.Mysql)) throw new ParserError(ParserArea.OrderBy, `${dialectDisplayName(config.databaseType)} cannot ORDER BY inside a recursive CTE body — it names the restriction explicitly ("ORDER BY in a recursive query is not implemented" / "ORDER BY over UNION in recursive Common Table Expression"), and a clause set on the body lands in the recursive term. Order the OUTER select instead, which every dialect accepts.`);
	if (body.limit > 0 || body.offset !== void 0) {
		if (config.databaseType === DatabaseType.Postgres) throw new ParserError(ParserArea.LimitOffset, "Postgres cannot LIMIT or OFFSET inside a recursive CTE body — the clause lands in the recursive term, which it rejects. Cap the OUTER select instead, which every dialect accepts, or bound the recursion with a WHERE on the recursive member.");
	}
	if (body.unionStates.some((branch) => branch.subquery?.distinct === true) && (config.databaseType === DatabaseType.Mysql || config.databaseType === DatabaseType.Mssql)) throw new ParserError(ParserArea.Select, `${dialectDisplayName(config.databaseType)} rejects SELECT DISTINCT on the recursive member of a recursive CTE. Use union() rather than unionAll() if you want duplicate elimination across the recursion, which is where these engines allow it.`);
};
const defaultCte = (state, config, mode, options) => {
	const sqlHelper = new SqlHelper(mode);
	if (state.cteStates.length === 0) return sqlHelper;
	if (state.cteStates.some((cte) => cte.recursive) && config.databaseType !== DatabaseType.Mssql) sqlHelper.addSqlSnippet("WITH RECURSIVE ");
	else sqlHelper.addSqlSnippet("WITH ");
	for (let i = 0; i < state.cteStates.length; i++) {
		const cteState = state.cteStates[i];
		assertRecursiveMembersSupported(cteState, config);
		sqlHelper.addSqlSnippet(quoteIdentifier(cteState.name, config.identifierDelimiters));
		if (cteState.columns.length > 0) {
			sqlHelper.addSqlSnippet(" (");
			cteState.columns.forEach((column, columnIndex) => {
				sqlHelper.addSqlSnippet(quoteIdentifier(column, config.identifierDelimiters));
				if (columnIndex < cteState.columns.length - 1) sqlHelper.addSqlSnippet(", ");
			});
			sqlHelper.addSqlSnippet(")");
		}
		sqlHelper.addSqlSnippet(" AS (");
		if (cteState.builderType === BuilderType.CteRaw) sqlHelper.addSqlSnippet(cteState.raw ?? "");
		else if (cteState.subquery) {
			const subHelper = defaultToSql(cteState.subquery, config, mode, options);
			sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
		}
		sqlHelper.addSqlSnippet(")");
		if (i < state.cteStates.length - 1) sqlHelper.addSqlSnippet(", ");
		else sqlHelper.addSqlSnippet(" ");
	}
	return sqlHelper;
};
//#endregion
//#region src/enums/join-on-operator.ts
/**
* Classifies each entry in a JOIN ON condition list (column compare, grouping, logic).
*/
const JoinOnOperator = {
	/** Opens a parenthesized ON predicate group. */
	GroupBegin: "GroupBegin",
	/** Closes a parenthesized ON predicate group. */
	GroupEnd: "GroupEnd",
	/** Standard ON left op right comparison. */
	On: "On",
	/** ON fragment as raw SQL. */
	Raw: "Raw",
	/** ON right-hand value or bound parameter. */
	Value: "Value",
	/** Logical AND between ON parts. */
	And: "And",
	/** Logical OR between ON parts. */
	Or: "Or",
	/** `ON column IN (values)` — see {@link JoinOnBuilder.onIn}. */
	InValues: "InValues",
	/** `ON column NOT IN (values)` — see {@link JoinOnBuilder.onNotIn}. */
	NotInValues: "NotInValues",
	/** `ON column BETWEEN low AND high` — see {@link JoinOnBuilder.onBetween}. */
	Between: "Between",
	/** `ON column NOT BETWEEN low AND high` — see {@link JoinOnBuilder.onNotBetween}. */
	NotBetween: "NotBetween",
	/** No operator / unused slot. */
	None: "None"
};
//#endregion
//#region src/enums/join-operator.ts
/**
* Comparison operators used in JOIN ON conditions (e.g. tableA.id = tableB.id).
*/
const JoinOperator = {
	/** Equality (=). */
	Equals: "Equals",
	/** Inequality (<> or !=). */
	NotEquals: "NotEquals",
	/** Strictly greater than (>). */
	GreaterThan: "GreaterThan",
	/** Greater than or equal (>=). */
	GreaterThanOrEquals: "GreaterThanOrEquals",
	/** Strictly less than (<). */
	LessThan: "LessThan",
	/** Less than or equal (<=). */
	LessThanOrEquals: "LessThanOrEquals",
	/** No operator specified. */
	None: "None",
	/** Pattern match (LIKE) — usable in both `on` (column-to-column) and `onValue` (column-to-value). */
	Like: "Like",
	/** Negated pattern match (NOT LIKE). */
	NotLike: "NotLike"
};
//#endregion
//#region src/parser/default-hint.ts
/** MySQL index hint text immediately after a table reference (`USE INDEX (idx)`). */
const mysqlIndexHintForTable = (state, config, tableNameOrAlias) => {
	const hints = state.hintStates ?? [];
	if (hints.length === 0) return "";
	const indexHints = hints.filter((hint) => (hint.kind === HintKind.UseIndex || hint.kind === HintKind.ForceIndex) && hint.tableNameOrAlias === tableNameOrAlias && hint.indexName);
	if (indexHints.length === 0) return "";
	if (config.databaseType !== DatabaseType.Mysql) throw new ParserError(ParserArea.From, "MySQL index hints (hintUseIndex/hintForceIndex) are only supported on MySQL");
	let sql = "";
	for (const hint of indexHints) sql += (hint.kind === HintKind.ForceIndex ? " FORCE INDEX (" : " USE INDEX (") + quoteIdentifier(hint.indexName, config.identifierDelimiters) + ")";
	return sql;
};
/** Trailing MSSQL `OPTION (...)` and raw hints appended after the SELECT statement body. */
const emitTrailingHints = (sqlHelper, state, config) => {
	const hints = state.hintStates ?? [];
	if (hints.length === 0) return;
	for (const hint of hints) {
		if (hint.kind === HintKind.MssqlOption) {
			if (config.databaseType !== DatabaseType.Mssql) throw new ParserError(ParserArea.General, "hintMssqlOption is only supported on MSSQL — use hintRaw on other dialects");
			if (!hint.optionText || hint.optionText.trim() === "") throw new ParserError(ParserArea.General, "hintMssqlOption requires non-empty option text");
			sqlHelper.addSqlSnippet(" OPTION (");
			sqlHelper.addSqlSnippet(hint.optionText);
			sqlHelper.addSqlSnippet(")");
			continue;
		}
		if (hint.kind === HintKind.Raw) {
			if (!hint.raw || hint.raw.trim() === "") throw new ParserError(ParserArea.General, "hintRaw requires non-empty SQL");
			sqlHelper.addSqlSnippet(" ");
			sqlHelper.addSqlSnippet(hint.raw);
		}
	}
};
/** Validates that no unsupported hint kinds remain unhandled at parse time. */
const validateHints = (state, config, area) => {
	const hints = state.hintStates ?? [];
	if (hints.length === 0) return;
	for (const hint of hints) {
		if (hint.kind === HintKind.UseIndex || hint.kind === HintKind.ForceIndex) {
			if (config.databaseType !== DatabaseType.Mysql) throw new ParserError(area, "MySQL index hints (hintUseIndex/hintForceIndex) are only supported on MySQL — use hintRaw elsewhere");
		}
		if (hint.kind === HintKind.MssqlOption && state.isInnerStatement) throw new ParserError(area, "OPTION is a statement-level clause in T-SQL — exactly once, at the very end of the whole statement — so it cannot be set on a CTE body, a set-operation branch or a subquery. Set hintMssqlOption on the outermost builder, where it applies to the statement it actually governs.");
	}
};
//#endregion
//#region src/parser/default-row-lock.ts
/**
* Trailing `FOR UPDATE`/`FOR SHARE` clause for Postgres/MySQL, appended after the whole SELECT
* (including ORDER BY/LIMIT). SQLite has no row-level locking at all and refuses it. MSSQL emits
* nothing here — its locking is a `WITH (...)` table hint on each FROM table; see
* {@link mssqlRowLockHint}.
*/
const emitTrailingRowLockClause = (sqlHelper, config, rowLock) => {
	if (config.databaseType === DatabaseType.Sqlite) throw new ParserError(ParserArea.General, "SQLite does not support row locking (FOR UPDATE/FOR SHARE)");
	if (config.databaseType === DatabaseType.Mssql) return;
	sqlHelper.addSqlSnippet(" ");
	sqlHelper.addSqlSnippet(rowLock.mode === RowLockMode.ForUpdate ? "FOR UPDATE" : "FOR SHARE");
	if (rowLock.wait === RowLockWait.Nowait) sqlHelper.addSqlSnippet(" NOWAIT");
	else if (rowLock.wait === RowLockWait.SkipLocked) sqlHelper.addSqlSnippet(" SKIP LOCKED");
};
/**
* MSSQL has no `FOR UPDATE`/`FOR SHARE` clause — the nearest equivalent is a `WITH (...)`
* locking hint on the table reference itself. `UPDLOCK`/`HOLDLOCK` approximate `FOR
* UPDATE`/`FOR SHARE`; `ROWLOCK` asks for row- (not page/table-) granularity; `NOWAIT`/
* `READPAST` approximate `NOWAIT`/`SKIP LOCKED`.
*/
/**
* Refuses a row lock that MSSQL has nowhere to put.
*
* T-SQL's `table_hint` production attaches to a `table_or_view_name` and nothing else, so a derived
* table, a table-valued function, a LATERAL/APPLY body or a raw FROM fragment cannot carry a
* locking hint. Through 10.x those sources emitted no hint and no error, so `forUpdate()` returned
* rows the caller believed were locked and which were read at plain READ COMMITTED — the failure is
* silent, and it is a data-integrity bug rather than a syntax one.
*
* Postgres and MySQL are unaffected: their `FOR UPDATE` is a statement-level clause that locks every
* table the statement reads, so it needs no per-source placement. (Postgres separately rejects a
* locking clause over a sub-select, which is a loud failure from the server, not a silent one.)
*/
const refuseUnplaceableMssqlRowLock = (config, rowLock, sourceDescription) => {
	if (!rowLock || config.databaseType !== DatabaseType.Mssql) return;
	throw new ParserError(ParserArea.General, `MSSQL cannot lock ${sourceDescription} — a locking hint attaches to a table reference only`);
};
const mssqlRowLockHint = (rowLock) => {
	if (rowLock.mode === RowLockMode.ForShare) throw new ParserError(ParserArea.General, "MSSQL has no shared row lock — HOLDLOCK is a SERIALIZABLE isolation hint, not FOR SHARE; use forUpdate() or take the isolation level explicitly");
	const strength = "UPDLOCK, ROWLOCK";
	if (rowLock.wait === RowLockWait.Nowait) return ` WITH (${strength}, NOWAIT)`;
	if (rowLock.wait === RowLockWait.SkipLocked) return ` WITH (${strength}, READPAST)`;
	return ` WITH (${strength})`;
};
//#endregion
//#region src/parser/default-join.ts
const defaultJoin = (state, config, mode, options) => {
	let sqlHelper = new SqlHelper(mode);
	if (state.joinStates.length === 0) return sqlHelper;
	for (let i = 0; i < state.joinStates.length; i++) {
		const joinState = state.joinStates[i];
		if (joinState.builderType === BuilderType.JoinRaw) {
			refuseUnplaceableMssqlRowLock(config, state.rowLock, "a raw JOIN fragment");
			sqlHelper.addSqlSnippet(joinState.raw ?? "");
			if (i < state.joinStates.length - 1) sqlHelper.addSqlSnippet(" ");
			continue;
		}
		switch (joinState.joinType) {
			case JoinType.Inner:
				sqlHelper.addSqlSnippet("INNER JOIN ");
				break;
			case JoinType.Left:
				sqlHelper.addSqlSnippet("LEFT JOIN ");
				break;
			case JoinType.LeftOuter:
				sqlHelper.addSqlSnippet("LEFT OUTER JOIN ");
				break;
			case JoinType.Right:
				sqlHelper.addSqlSnippet("RIGHT JOIN ");
				break;
			case JoinType.RightOuter:
				sqlHelper.addSqlSnippet("RIGHT OUTER JOIN ");
				break;
			case JoinType.FullOuter:
				if (config.databaseType === DatabaseType.Mysql) throw new ParserError(ParserArea.Join, "MySQL does not support FULL OUTER JOIN");
				sqlHelper.addSqlSnippet("FULL OUTER JOIN ");
				break;
			case JoinType.Cross:
				sqlHelper.addSqlSnippet("CROSS JOIN ");
				break;
			case JoinType.Lateral:
				if (config.databaseType === DatabaseType.Sqlite) throw new ParserError(ParserArea.Join, "SQLite does not support LATERAL joins");
				if (config.databaseType === DatabaseType.Mssql) throw new ParserError(ParserArea.Join, "MSSQL LATERAL joins use CROSS APPLY/OUTER APPLY — use joinCrossApply/joinOuterApply");
				sqlHelper.addSqlSnippet("JOIN LATERAL ");
				break;
			case JoinType.CrossApply:
				if (config.databaseType === DatabaseType.Mssql) {
					sqlHelper.addSqlSnippet("CROSS APPLY ");
					break;
				}
				if (config.databaseType === DatabaseType.Postgres || config.databaseType === DatabaseType.Mysql) {
					sqlHelper.addSqlSnippet("CROSS JOIN LATERAL ");
					break;
				}
				throw new ParserError(ParserArea.Join, "SQLite does not support CROSS APPLY/LATERAL joins");
			case JoinType.OuterApply:
				if (config.databaseType === DatabaseType.Mssql) {
					sqlHelper.addSqlSnippet("OUTER APPLY ");
					break;
				}
				if (config.databaseType === DatabaseType.Postgres || config.databaseType === DatabaseType.Mysql) {
					sqlHelper.addSqlSnippet("LEFT JOIN LATERAL ");
					break;
				}
				throw new ParserError(ParserArea.Join, "SQLite does not support OUTER APPLY/LATERAL joins");
		}
		if (joinState.builderType === BuilderType.JoinTable) {
			if (joinState.owner !== "" && config.databaseType === DatabaseType.Mysql) throw new ParserError(ParserArea.Join, "MySQL does not support table owners");
			if (joinState.owner !== "") {
				sqlHelper.addSqlSnippet(quoteIdentifier(joinState.owner, config.identifierDelimiters));
				sqlHelper.addSqlSnippet(".");
			}
			sqlHelper.addSqlSnippet(quoteIdentifier(joinState.tableName, config.identifierDelimiters));
			if (joinState.alias !== "") {
				sqlHelper.addSqlSnippet(" AS ");
				sqlHelper.addSqlSnippet(quoteIdentifier(joinState.alias, config.identifierDelimiters));
			}
			sqlHelper.addSqlSnippet(mysqlIndexHintForTable(state, config, joinState.alias ?? joinState.tableName ?? ""));
			if (state.rowLock && config.databaseType === DatabaseType.Mssql) sqlHelper.addSqlSnippet(mssqlRowLockHint(state.rowLock));
			sqlHelper = defaultJoinOns(sqlHelper, config, joinState.joinOnStates);
			if (i < state.joinStates.length - 1) sqlHelper.addSqlSnippet(" ");
			continue;
		}
		if (joinState.builderType === BuilderType.JoinBuilder) {
			refuseUnplaceableMssqlRowLock(config, state.rowLock, "a joined derived table");
			const subHelper = defaultToSql(joinState.subquery, config, mode, options);
			sqlHelper.addSqlSnippetWithValues("(" + subHelper.getSql() + ")", subHelper.getValues());
			if (joinState.alias !== "") {
				sqlHelper.addSqlSnippet(" AS ");
				sqlHelper.addSqlSnippet(quoteIdentifier(joinState.alias, config.identifierDelimiters));
			}
			sqlHelper = defaultJoinOns(sqlHelper, config, joinState.joinOnStates);
			if (joinState.joinType === JoinType.OuterApply && joinState.joinOnStates.length === 0 && (config.databaseType === DatabaseType.Postgres || config.databaseType === DatabaseType.Mysql)) sqlHelper.addSqlSnippet(" ON TRUE");
			if (i < state.joinStates.length - 1) sqlHelper.addSqlSnippet(" ");
		}
	}
	return sqlHelper;
};
/**
* Renders a JOIN's ON condition list *without* the leading `" ON "` keyword — the shared core
* used both for a normal JOIN and (via {@link renderJoinOnConditions}) for translating a
* join-backed UPDATE/DELETE's ON conditions into a Postgres `WHERE` predicate.
*/
const renderJoinOnPredicate = (sqlHelper, config, joinOnStates) => {
	for (let i = 0; i < joinOnStates.length; i++) {
		const on = joinOnStates[i];
		const prevOn = i > 0 ? joinOnStates[i - 1] : void 0;
		const nextOn = i < joinOnStates.length - 1 ? joinOnStates[i + 1] : void 0;
		const spaceAfter = () => {
			if (i < joinOnStates.length - 1 && nextOn?.joinOnOperator !== JoinOnOperator.GroupEnd) sqlHelper.addSqlSnippet(" ");
		};
		if (i === 0 && (on.joinOnOperator === JoinOnOperator.And || on.joinOnOperator === JoinOnOperator.Or)) throw new ParserError(ParserArea.Join, "First JOIN ON operator cannot be AND or OR");
		if (i === joinOnStates.length - 1 && (on.joinOnOperator === JoinOnOperator.And || on.joinOnOperator === JoinOnOperator.Or)) throw new ParserError(ParserArea.Join, "AND or OR cannot be used as the last JOIN ON operator");
		if ((on.joinOnOperator === JoinOnOperator.And || on.joinOnOperator === JoinOnOperator.Or) && (prevOn?.joinOnOperator === JoinOnOperator.And || prevOn?.joinOnOperator === JoinOnOperator.Or)) throw new ParserError(ParserArea.Join, "AND or OR cannot be used consecutively");
		if ((on.joinOnOperator === JoinOnOperator.And || on.joinOnOperator === JoinOnOperator.Or) && prevOn?.joinOnOperator === JoinOnOperator.GroupBegin) throw new ParserError(ParserArea.Join, "AND or OR cannot be used directly after a group begin");
		if (on.joinOnOperator === JoinOnOperator.GroupBegin && i === joinOnStates.length - 1) throw new ParserError(ParserArea.Join, "Group begin cannot be the last JOIN ON operator");
		if (on.joinOnOperator === JoinOnOperator.GroupEnd && i === 0) throw new ParserError(ParserArea.Join, "Group end cannot be the first JOIN ON operator");
		if (on.joinOnOperator === JoinOnOperator.And) {
			sqlHelper.addSqlSnippet("AND");
			spaceAfter();
			continue;
		}
		if (on.joinOnOperator === JoinOnOperator.Or) {
			sqlHelper.addSqlSnippet("OR");
			spaceAfter();
			continue;
		}
		const isPredicateOperator = (joinOnOperator) => joinOnOperator === JoinOnOperator.On || joinOnOperator === JoinOnOperator.Value || joinOnOperator === JoinOnOperator.Raw || joinOnOperator === JoinOnOperator.InValues || joinOnOperator === JoinOnOperator.NotInValues || joinOnOperator === JoinOnOperator.Between || joinOnOperator === JoinOnOperator.NotBetween;
		const endsOnExpression = prevOn && (isPredicateOperator(prevOn.joinOnOperator) || prevOn.joinOnOperator === JoinOnOperator.GroupEnd);
		const startsOnExpression = isPredicateOperator(on.joinOnOperator) || on.joinOnOperator === JoinOnOperator.GroupBegin;
		if (i > 0 && endsOnExpression && startsOnExpression) sqlHelper.addSqlSnippet("AND ");
		if (on.joinOnOperator === JoinOnOperator.GroupBegin) {
			sqlHelper.addSqlSnippet("(");
			continue;
		}
		if (on.joinOnOperator === JoinOnOperator.GroupEnd) {
			sqlHelper.addSqlSnippet(")");
			spaceAfter();
			continue;
		}
		if (on.joinOnOperator === JoinOnOperator.Raw) {
			sqlHelper.addSqlSnippet(on.raw ?? "");
			spaceAfter();
			continue;
		}
		if (on.joinOnOperator === JoinOnOperator.On) {
			sqlHelper.addSqlSnippet(qualifiedColumn(on.aliasLeft, on.columnLeft, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(" ");
			switch (on.joinOperator) {
				case JoinOperator.Equals:
					sqlHelper.addSqlSnippet("=");
					break;
				case JoinOperator.NotEquals:
					sqlHelper.addSqlSnippet("<>");
					break;
				case JoinOperator.GreaterThan:
					sqlHelper.addSqlSnippet(">");
					break;
				case JoinOperator.GreaterThanOrEquals:
					sqlHelper.addSqlSnippet(">=");
					break;
				case JoinOperator.LessThan:
					sqlHelper.addSqlSnippet("<");
					break;
				case JoinOperator.LessThanOrEquals:
					sqlHelper.addSqlSnippet("<=");
					break;
				case JoinOperator.Like:
					sqlHelper.addSqlSnippet("LIKE");
					break;
				case JoinOperator.NotLike:
					sqlHelper.addSqlSnippet("NOT LIKE");
					break;
			}
			sqlHelper.addSqlSnippet(" ");
			sqlHelper.addSqlSnippet(qualifiedColumn(on.aliasRight, on.columnRight, config.identifierDelimiters));
			spaceAfter();
			continue;
		}
		if (on.joinOnOperator === JoinOnOperator.Value) {
			sqlHelper.addSqlSnippet(qualifiedColumn(on.aliasLeft, on.columnLeft, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(" ");
			switch (on.joinOperator) {
				case JoinOperator.Equals:
					sqlHelper.addSqlSnippet("=");
					break;
				case JoinOperator.NotEquals:
					sqlHelper.addSqlSnippet("<>");
					break;
				case JoinOperator.GreaterThan:
					sqlHelper.addSqlSnippet(">");
					break;
				case JoinOperator.GreaterThanOrEquals:
					sqlHelper.addSqlSnippet(">=");
					break;
				case JoinOperator.LessThan:
					sqlHelper.addSqlSnippet("<");
					break;
				case JoinOperator.LessThanOrEquals:
					sqlHelper.addSqlSnippet("<=");
					break;
				case JoinOperator.Like:
					sqlHelper.addSqlSnippet("LIKE");
					break;
				case JoinOperator.NotLike:
					sqlHelper.addSqlSnippet("NOT LIKE");
					break;
			}
			sqlHelper.addSqlSnippet(" ");
			sqlHelper.addDynamicValue(on.valueRight);
			spaceAfter();
			continue;
		}
		if (on.joinOnOperator === JoinOnOperator.InValues || on.joinOnOperator === JoinOnOperator.NotInValues) {
			sqlHelper.addSqlSnippet(qualifiedColumn(on.aliasLeft, on.columnLeft, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(on.joinOnOperator === JoinOnOperator.NotInValues ? " NOT IN (" : " IN (");
			const values = on.valuesRight ?? [];
			values.forEach((value, valueIndex) => {
				sqlHelper.addDynamicValue(value);
				if (valueIndex < values.length - 1) sqlHelper.addSqlSnippet(", ");
			});
			sqlHelper.addSqlSnippet(")");
			spaceAfter();
			continue;
		}
		if (on.joinOnOperator === JoinOnOperator.Between || on.joinOnOperator === JoinOnOperator.NotBetween) {
			sqlHelper.addSqlSnippet(qualifiedColumn(on.aliasLeft, on.columnLeft, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(on.joinOnOperator === JoinOnOperator.NotBetween ? " NOT BETWEEN " : " BETWEEN ");
			const [lower, upper] = on.valuesRight ?? [];
			sqlHelper.addDynamicValue(lower);
			sqlHelper.addSqlSnippet(" AND ");
			sqlHelper.addDynamicValue(upper);
			spaceAfter();
			continue;
		}
	}
	return sqlHelper;
};
const defaultJoinOns = (sqlHelper, config, joinOnStates) => {
	if (joinOnStates.length === 0) return sqlHelper;
	sqlHelper.addSqlSnippet(" ON ");
	return renderJoinOnPredicate(sqlHelper, config, joinOnStates);
};
/**
* Renders a JOIN's ON conditions as a standalone boolean expression (no leading `ON`/`WHERE`
* keyword). Used to translate join-backed UPDATE/DELETE ON conditions into a Postgres `WHERE`
* predicate, since Postgres's `UPDATE ... FROM` / `DELETE ... USING` do not support `JOIN ... ON`
* syntax directly.
*/
const renderJoinOnConditions = (sqlHelper, config, joinOnStates) => {
	return renderJoinOnPredicate(sqlHelper, config, joinOnStates);
};
//#endregion
//#region src/parser/default-mutation-join.ts
/**
* Join-backed UPDATE/DELETE support (`.join(...)` combined with `.updateTable`/`.deleteFrom`).
*
* MySQL and MSSQL both accept full `JOIN ... ON` syntax directly in their multi-table UPDATE /
* `UPDATE ... FROM` / `DELETE ... FROM` grammars, so `default-update.ts`/`default-delete.ts`
* reuse `defaultJoin` verbatim for those two. Postgres's `UPDATE ... FROM` / `DELETE ... USING`
* cannot join the *target* row to a `from_item` with `JOIN ... ON` — that condition has to be a
* `WHERE` predicate — so Postgres gets a plain comma-separated `from_item` list here
* ({@link renderPostgresMutationFrom}) plus a translated `WHERE` predicate
* ({@link buildPostgresMutationJoinPredicate}), assembled by `to-sql.ts`. SQLite has no
* multi-table UPDATE/DELETE syntax at all, so joins are rejected outright.
*/
const assertMutationJoinsSupported = (state, config, area) => {
	if (state.joinStates.length === 0) return;
	if (config.databaseType === DatabaseType.Sqlite) throw new ParserError(area, "SQLite does not support joins in UPDATE/DELETE; rewrite the join as a correlated subquery");
};
const emitPostgresFromItem = (sqlHelper, config, mode, options, joinState, area) => {
	if (joinState.builderType === BuilderType.JoinRaw) throw new ParserError(area, "Raw JOIN fragments are not supported in a Postgres join-backed UPDATE/DELETE; use a raw WHERE/FROM instead");
	if (joinState.joinType !== JoinType.Inner && joinState.joinType !== JoinType.Cross) throw new ParserError(area, "Postgres UPDATE...FROM/DELETE...USING only supports INNER or CROSS joins — the ON condition is translated into a WHERE predicate, which cannot express OUTER JOIN semantics");
	if (joinState.builderType === BuilderType.JoinTable) {
		if (joinState.owner && joinState.owner !== "") {
			sqlHelper.addSqlSnippet(quoteIdentifier(joinState.owner, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(".");
		}
		sqlHelper.addSqlSnippet(quoteIdentifier(joinState.tableName, config.identifierDelimiters));
		if (joinState.alias && joinState.alias !== "") {
			sqlHelper.addSqlSnippet(" AS ");
			sqlHelper.addSqlSnippet(quoteIdentifier(joinState.alias, config.identifierDelimiters));
		}
		return;
	}
	const subHelper = defaultToSql(joinState.subquery, config, mode, options);
	sqlHelper.addSqlSnippetWithValues("(" + subHelper.getSql() + ")", subHelper.getValues());
	if (joinState.alias && joinState.alias !== "") {
		sqlHelper.addSqlSnippet(" AS ");
		sqlHelper.addSqlSnippet(quoteIdentifier(joinState.alias, config.identifierDelimiters));
	}
};
/** Renders `.join(...)` targets as a comma-separated Postgres `from_item` list (no `JOIN`/`ON`). */
const renderPostgresMutationFrom = (config, state, mode, options, area) => {
	const sqlHelper = new SqlHelper(mode);
	state.joinStates.forEach((joinState, i) => {
		emitPostgresFromItem(sqlHelper, config, mode, options, joinState, area);
		if (i < state.joinStates.length - 1) sqlHelper.addSqlSnippet(", ");
	});
	return sqlHelper;
};
/**
* Translates every `.join(...)` call's ON conditions into a single ANDed `WHERE` predicate
* (no leading `WHERE`/`AND` keyword). CROSS joins contribute no predicate (unconditional).
* Each join's own conditions are parenthesized when it has more than one, so combining them
* with `AND` never changes their internal `AND`/`OR` precedence.
*/
const buildPostgresMutationJoinPredicate = (config, state, mode) => {
	const sqlHelper = new SqlHelper(mode);
	let wroteAny = false;
	for (const joinState of state.joinStates) {
		if (joinState.joinType === JoinType.Cross || joinState.joinOnStates.length === 0) continue;
		if (wroteAny) sqlHelper.addSqlSnippet(" AND ");
		const wrapInParens = joinState.joinOnStates.length > 1;
		if (wrapInParens) sqlHelper.addSqlSnippet("(");
		renderJoinOnConditions(sqlHelper, config, joinState.joinOnStates);
		if (wrapInParens) sqlHelper.addSqlSnippet(")");
		wroteAny = true;
	}
	return sqlHelper;
};
//#endregion
//#region src/parser/default-returning.ts
const emitColumnList$1 = (sqlHelper, config, columns, prefix) => {
	for (let i = 0; i < columns.length; i++) {
		if (prefix) sqlHelper.addSqlSnippet(prefix + ".");
		sqlHelper.addSqlSnippet(quoteIdentifier(columns[i], config.identifierDelimiters));
		if (i < columns.length - 1) sqlHelper.addSqlSnippet(", ");
	}
};
const emitColumnsOrRaw = (sqlHelper, config, returningState, prefix, area) => {
	if (returningState.raw) {
		sqlHelper.addSqlSnippet(returningState.raw);
		return;
	}
	if (returningState.columns.length === 0) throw new ParserError(area, "RETURNING/OUTPUT requires at least one column");
	emitColumnList$1(sqlHelper, config, returningState.columns, prefix);
};
/**
* MSSQL's `OUTPUT` clause. Placed inline by the caller — before `VALUES` for INSERT, before
* `FROM`/`WHERE` for UPDATE, before `WHERE` for DELETE — because, unlike PG/SQLite's trailing
* `RETURNING`, T-SQL requires `OUTPUT` in the middle of the statement.
*/
const emitMssqlOutputClause = (sqlHelper, config, returningState, prefix, area) => {
	sqlHelper.addSqlSnippet(" OUTPUT ");
	emitColumnsOrRaw(sqlHelper, config, returningState, prefix, area);
};
/**
* PG/SQLite's trailing `RETURNING` clause, appended after the whole INSERT/UPDATE/DELETE
* statement (including its WHERE). MySQL has no equivalent and refuses it here with a clear
* error rather than silently dropping the columns the caller asked for.
*/
const emitTrailingReturningClause = (sqlHelper, config, returningState, area) => {
	if (config.databaseType === DatabaseType.Mysql) throw new ParserError(area, "MySQL does not support RETURNING");
	sqlHelper.addSqlSnippet(" RETURNING ");
	emitColumnsOrRaw(sqlHelper, config, returningState, void 0, area);
};
//#endregion
//#region src/parser/default-order-by.ts
/**
* Emits one `<column> [ASC|DESC] [NULLS FIRST|NULLS LAST]` sort term. Shared by the top-level
* ORDER BY clause and a window's `OVER (... ORDER BY ...)` — both sort NULLs the same way.
*
* `NULLS FIRST`/`NULLS LAST` is native on Postgres and on SQLite 3.30+. MySQL and MSSQL have no
* such syntax in any version, and a requested placement used to be synthesized there as a leading
* `CASE WHEN col IS NULL THEN … END` sort key. That is refused now: it is an extra sort expression
* the caller never wrote, and it is not merely cosmetic — an index that could have satisfied the
* ORDER BY no longer can, so the engine sorts. Getting the right rows in the right order by a route
* the caller cannot see is the thing this library does not do.
*
* {@link NullsOrder.None} is deliberately untouched. That is the dialect's own default placement,
* and the dialects genuinely disagree (Postgres sorts NULLs last on ASC, the others first). Forcing
* agreement there would mean a `CASE WHEN` on EVERY sort term in the library — the same defeat of
* index-ordered scans, applied to queries that never asked about NULLs at all.
*/
const emitOrderByTerm = (sqlHelper, config, tableNameOrAlias, columnName, direction, nulls) => {
	const columnSql = qualifiedColumn(tableNameOrAlias, columnName, config.identifierDelimiters);
	const hasNativeNulls = config.databaseType === DatabaseType.Postgres || config.databaseType === DatabaseType.Sqlite;
	if (nulls !== NullsOrder.None && !hasNativeNulls) throw new ParserError(ParserArea.OrderBy, `${dialectDisplayName(config.databaseType)} has no NULLS FIRST/LAST — order by a nullability expression explicitly if you need it`);
	sqlHelper.addSqlSnippet(columnSql);
	if (direction === OrderByDirection.Ascending) sqlHelper.addSqlSnippet(" ASC");
	else if (direction === OrderByDirection.Descending) sqlHelper.addSqlSnippet(" DESC");
	if (nulls !== NullsOrder.None && hasNativeNulls) sqlHelper.addSqlSnippet(nulls === NullsOrder.First ? " NULLS FIRST" : " NULLS LAST");
};
const defaultOrderBy = (state, config, mode) => {
	const sqlHelper = new SqlHelper(mode);
	if (state.orderByStates.length === 0) return sqlHelper;
	sqlHelper.addSqlSnippet("ORDER BY ");
	state.orderByStates.forEach((orderByState, i) => {
		if (orderByState.builderType === BuilderType.OrderByRaw) {
			sqlHelper.addSqlSnippet(orderByState.raw ?? "");
			if (i < state.orderByStates.length - 1) sqlHelper.addSqlSnippet(", ");
			return;
		}
		if (orderByState.builderType === BuilderType.OrderByColumn) {
			emitOrderByTerm(sqlHelper, config, orderByState.tableNameOrAlias, orderByState.columnName, orderByState.direction, orderByState.nulls);
			if (i < state.orderByStates.length - 1) sqlHelper.addSqlSnippet(", ");
			return;
		}
	});
	return sqlHelper;
};
//#endregion
//#region src/parser/default-limit-offset.ts
/**
* Each grammar's idiom for "no upper bound, just skip n rows".
*
* MySQL and SQLite have no standalone OFFSET — it only parses as the tail of a LIMIT — so an offset
* without a limit needs a sentinel limit in front of it or the statement is a syntax error (MySQL
* 1064, SQLite `near "OFFSET"`). MySQL's documented idiom is the largest unsigned BIGINT, 2^64-1;
* 2^64 is itself a syntax error. Postgres is deliberately absent: a bare OFFSET is valid there.
*/
const unboundedLimit = {
	[DatabaseType.Mysql]: "18446744073709551615",
	[DatabaseType.Sqlite]: "-1"
};
/**
* True when the caller called `.top(n)` at all.
*
* Presence, not positivity: `.top(0)` still counts as "the caller asked for a TOP", which is what
* both the MSSQL TOP/LIMIT conflict guard and the non-MSSQL refusal need — silently ignoring
* `.top(0)` would be the same class of bug this release is removing. `.clearTop()` deletes the key,
* so it reads false again afterwards.
*/
const hasExplicitTop = (state) => state.customState !== null && state.customState !== void 0 && state.customState["top"] !== null && state.customState["top"] !== void 0;
const defaultLimitOffset = (state, config, mode) => {
	const sqlHelper = new SqlHelper(mode);
	if (state.limit === 0 && state.offset === void 0) return sqlHelper;
	if (config.databaseType === DatabaseType.Mysql || config.databaseType === DatabaseType.Postgres || config.databaseType === DatabaseType.Sqlite) {
		if (state.limitWithTies) {
			if (config.databaseType === DatabaseType.Sqlite) throw new ParserError(ParserArea.LimitOffset, "SQLite does not support WITH TIES");
			if (config.databaseType === DatabaseType.Mysql) throw new ParserError(ParserArea.LimitOffset, "MySQL does not support WITH TIES");
			if (state.limit <= 0) throw new ParserError(ParserArea.LimitOffset, "limitWithTies requires a positive limit");
			if (state.offset !== void 0) {
				sqlHelper.addSqlSnippet("OFFSET ");
				sqlHelper.addSqlSnippet((state.offset ?? 0).toString());
				sqlHelper.addSqlSnippet(" ROWS ");
			}
			sqlHelper.addSqlSnippet("FETCH FIRST ");
			sqlHelper.addSqlSnippet(state.limit.toString());
			sqlHelper.addSqlSnippet(" ROWS WITH TIES");
			return sqlHelper;
		}
		if (state.limit > 0) {
			sqlHelper.addSqlSnippet("LIMIT ");
			sqlHelper.addSqlSnippet(state.limit.toString());
		} else if (state.offset !== void 0) {
			const sentinel = unboundedLimit[config.databaseType];
			if (sentinel !== void 0) {
				sqlHelper.addSqlSnippet("LIMIT ");
				sqlHelper.addSqlSnippet(sentinel);
			}
		}
		if (state.offset !== void 0) {
			if (state.limit > 0) sqlHelper.addSqlSnippet(" ");
			sqlHelper.addSqlSnippet(" OFFSET ");
			sqlHelper.addSqlSnippet((state.offset ?? 0).toString());
		}
	}
	if (config.databaseType === DatabaseType.Mssql) {
		if (state.customState !== null && state.customState !== void 0 && state.customState["top"] !== null && state.customState["top"] !== void 0 && (state.limit > 0 || state.offset !== void 0)) throw new ParserError(ParserArea.LimitOffset, "MSSQL should not use both TOP and LIMIT/OFFSET in the same query");
		if (state.limitWithTies) {
			if (state.limit <= 0) throw new ParserError(ParserArea.LimitOffset, "limitWithTies requires a positive limit");
			if (state.offset !== void 0) throw new ParserError(ParserArea.LimitOffset, "MSSQL cannot combine WITH TIES and OFFSET — TOP admits no offset");
		} else {
			if (state.limit > 0 || state.offset !== void 0) {
				sqlHelper.addSqlSnippet("OFFSET ");
				sqlHelper.addSqlSnippet((state.offset ?? 0).toString());
				sqlHelper.addSqlSnippet(" ROWS");
			}
			if (state.limit > 0) {
				sqlHelper.addSqlSnippet(" ");
				sqlHelper.addSqlSnippet("FETCH NEXT ");
				sqlHelper.addSqlSnippet(state.limit.toString());
				sqlHelper.addSqlSnippet(" ROWS ONLY");
			}
		}
	}
	if (state.orderByStates.length === 0) {
		if (state.limitWithTies) throw new ParserError(ParserArea.LimitOffset, "ORDER BY is required when using WITH TIES");
		if (state.offset !== void 0 && state.offset > 0) throw new ParserError(ParserArea.LimitOffset, "ORDER BY is required when using OFFSET");
		if (state.offset === 0 && config.databaseType === DatabaseType.Mssql) throw new ParserError(ParserArea.LimitOffset, "ORDER BY is required when using OFFSET on MSSQL — T-SQL attaches OFFSET/FETCH to ORDER BY, so even OFFSET 0 ROWS needs one (Msg 102)");
		if (config.databaseType === DatabaseType.Mssql && state.limit > 0) throw new ParserError(ParserArea.LimitOffset, "ORDER BY is required when using LIMIT on MSSQL, which paginates with OFFSET/FETCH; use top() for an unordered row cap");
	}
	return sqlHelper;
};
//#endregion
//#region src/parser/default-mutation-row-cap.ts
/**
* Row-capping and ordering on an UPDATE or DELETE — `UPDATE … ORDER BY … LIMIT n`, `DELETE TOP (n)`.
*
* ── WHAT WAS WRONG (fixed 2026-07-22) ──
* `.limit()`, `.offset()`, `.top()` and `.orderByColumn()` were all reachable on a mutation and ALL
* FOUR were silently dropped: the Update and Delete branches of `to-sql.ts` returned before the
* ORDER BY and limit/offset blocks, and MSSQL's TOP was emitted only by the `beforeSelectColumns`
* hook, which only `defaultSelect` calls. So `.limit(1000)` on a DELETE produced no clause, no
* parameter and no error — the statement deleted the whole table. That is the silent-no-op class
* the 2.0 rewrite exists to remove; it was closed for SELECT and left open for mutations.
*
* ── WHAT EACH ENGINE ACTUALLY DOES (measured against the harness, 2026-07-22) ──
*
*     MySQL 8.4     UPDATE/DELETE … ORDER BY … LIMIT n   accepted; ORDER BY alone also accepted
*                   … LIMIT 1 OFFSET 1                   ERROR 1064 — no OFFSET on a mutation
*                   multi-table UPDATE … LIMIT 1         ERROR 1221 "Incorrect usage of UPDATE and LIMIT"
*     MSSQL 2022    UPDATE TOP (n) / DELETE TOP (n)      accepted
*                   UPDATE TOP (1) … ORDER BY id         Msg 156 "Incorrect syntax near 'ORDER'"
*     Postgres 17   UPDATE … LIMIT 1                     syntax error at or near "LIMIT"
*     SQLite 3.51   UPDATE/DELETE … LIMIT 1              syntax error — the syntax needs
*                                                        SQLITE_ENABLE_UPDATE_DELETE_LIMIT, which is
*                                                        off in the shipped amalgamation
*
* Postgres's `ctid`/CTE workaround and SQLite's subquery rewrite are both emulation, so both dialects
* refuse rather than approximate. The two that CAN do it keep their own spelling, which is what the
* existing methods already are: `limit()` is MySQL's native word and `top()` is MSSQL's, and `top`
* is already MSSQL-only in the typed views. So this needs no new method — only honest emission and
* honest refusals.
*/
const NO_MUTATION_CAP = {
	[DatabaseType.Postgres]: "Postgres has no row limit on UPDATE/DELETE — narrow the WHERE clause, or delete by a key set you selected first (the ctid/CTE rewrite is an emulation this library will not do for you)",
	[DatabaseType.Sqlite]: "SQLite has no row limit on UPDATE/DELETE unless it was compiled with SQLITE_ENABLE_UPDATE_DELETE_LIMIT, which the shipped amalgamation is not — narrow the WHERE clause, or delete by a key set you selected first"
};
/**
* Rejects every row-cap/ordering combination the target engine cannot run.
*
* Called from the Update and Delete branches BEFORE any SQL is produced, so a refused statement
* never reaches a driver. See the measurement table above for where each rule comes from.
*/
const assertMutationRowCapSupported = (state, config, area) => {
	const wantsTop = hasExplicitTop(state);
	const wantsLimit = state.limit > 0;
	const wantsOffset = state.offset !== void 0;
	const wantsOrderBy = state.orderByStates.length > 0;
	if (!wantsTop && !wantsLimit && !wantsOffset && !wantsOrderBy) return;
	if (wantsOffset) throw new ParserError(area, "offset() has no meaning on UPDATE/DELETE — no dialect supports skipping rows in a mutation");
	if (config.databaseType === DatabaseType.Mssql) {
		if (wantsLimit) throw new ParserError(area, "MSSQL caps a mutation with TOP, not LIMIT — use top(n). limit() is the SELECT-only OFFSET/FETCH form and T-SQL has no such clause on UPDATE/DELETE");
		if (wantsOrderBy) throw new ParserError(area, "T-SQL takes no ORDER BY on an UPDATE/DELETE, so TOP (n) picks an arbitrary n rows — select the keys you want in the order you want, then mutate by those keys");
		return;
	}
	if (config.databaseType === DatabaseType.Mysql) {
		if ((wantsLimit || wantsOrderBy) && state.joinStates.length > 0) throw new ParserError(area, "MySQL takes no ORDER BY or LIMIT on a multi-table UPDATE/DELETE (ERROR 1221) — mutate one table at a time, or narrow the join");
		return;
	}
	const refusal = NO_MUTATION_CAP[config.databaseType];
	if (refusal !== void 0) throw new ParserError(area, refusal);
};
/**
* The `TOP (n) ` prefix for a T-SQL mutation, or `''`.
*
* T-SQL's spelling is `UPDATE TOP (n) tbl` / `DELETE TOP (n) FROM tbl`, so this sits between the
* verb and the target — unlike MySQL's trailing LIMIT. `WITH TIES` is deliberately not accepted
* here: it requires an ORDER BY, which a T-SQL mutation cannot have.
*/
const mssqlMutationTop = (state, config) => {
	if (config.databaseType !== DatabaseType.Mssql || !hasExplicitTop(state)) return "";
	return `TOP (${Number(state.customState["top"])}) `;
};
/**
* Emits MySQL's trailing `ORDER BY … LIMIT n` on a mutation.
*
* Runs after the WHERE clause, which is where MySQL's grammar puts it. Both parts are optional and
* independent: `ORDER BY` alone is legal (measured), and so is `LIMIT` alone.
*/
const emitMutationRowCap = (sqlHelper, state, config, mode) => {
	if (config.databaseType !== DatabaseType.Mysql) return;
	if (state.orderByStates.length > 0) {
		const orderBy = defaultOrderBy(state, config, mode);
		sqlHelper.addSqlSnippet(" ");
		sqlHelper.addSqlSnippetWithValues(orderBy.getSql(), orderBy.getValues());
	}
	if (state.limit > 0) sqlHelper.addSqlSnippet(` LIMIT ${state.limit}`);
};
/**
* Rejects a row cap or ordering on an INSERT or MERGE that the engine cannot express.
*
* ── WHAT WAS WRONG (fixed 2026-07-22) ──
* {@link assertMutationRowCapSupported} was wired into the Update and Delete branches only, so an
* INSERT or MERGE still swallowed everything: `limit()`, `offset()` and `orderByColumn()` on an
* INSERT builder vanished with no word, and `.top(n)` was dropped on both — even though T-SQL has a
* real spelling for it. Measured against MSSQL 2022, each against its own baseline:
*
*     INSERT INTO orders (…) SELECT … FROM orders            3 rows   (baseline)
*     INSERT TOP (1) INTO orders (…) SELECT … FROM orders    1 row    <- real, and it caps
*     MERGE INTO customers …                                 1 row    (baseline)
*     MERGE TOP (1) INTO customers …                         accepted <- real
*
* So `top(n)` is EMITTED on both. What no dialect has is a statement-level `LIMIT`/`OFFSET`/
* `ORDER BY` on an INSERT or MERGE: in every grammar those belong to the SOURCE SELECT, which is
* the `insertSelect` / `usingSelect` child builder. Setting them on the outer builder is a
* different statement from the one the caller meant, so they are refused with that pointer rather
* than quietly relocated.
*/
const assertInsertMergeRowCapSupported = (state, config, area) => {
	const misplaced = state.limit > 0 ? "limit()" : state.offset !== void 0 ? "offset()" : state.orderByStates.length > 0 ? "orderByColumn()" : void 0;
	if (misplaced !== void 0) {
		const isMerge = area === ParserArea.Merge;
		throw new ParserError(area, `${misplaced} has no statement-level form on ${isMerge ? "MERGE" : "INSERT"} in any dialect — it belongs to the source SELECT, so set it on the ${isMerge ? "usingSelect" : "insertSelect"}() builder.${config.databaseType === DatabaseType.Mssql ? " To cap the statement itself, use top(n)." : ""}`);
	}
};
/**
* The `TOP (n) ` prefix for a T-SQL INSERT or MERGE, or `''`.
*
* T-SQL puts it between the verb and `INTO`: `INSERT TOP (n) INTO t …`, `MERGE TOP (n) INTO t …`.
* Both were measured against their own baseline and genuinely cap the statement.
*/
const mssqlStatementTop = (state, config) => mssqlMutationTop(state, config);
//#endregion
//#region src/parser/mutation-target.ts
/**
* Refuses FROM sources an UPDATE/DELETE would silently discard.
*
* A mutation renders exactly ONE target, taken from `updateTable`/`deleteFrom`. Any other
* `fromStates` entry — a derived table from `fromWithBuilder`, a LATERAL from `fromLateral`, a raw
* source — was simply not emitted: its whole SELECT, its WHERE and its limit went on the floor, and
* any predicate the caller wrote against its alias survived into the WHERE, leaving a reference to
* an alias that appears nowhere in the statement.
*
* The capability the caller wanted already exists, correctly, through `joinWithBuilder`. Measured:
*
*     DELETE FROM "orders" AS "o" USING (SELECT "id" FROM "orders" LIMIT 2) AS "cap" WHERE …   (PG)
*     DELETE `o` FROM `orders` AS `o` INNER JOIN (SELECT `id` FROM `orders` LIMIT 2) AS `cap`  (MySQL)
*
* So this points there rather than growing a second way to spell the same thing.
*/
const assertNoDroppedFromSources = (state, area) => {
	const lost = state.fromStates.filter((from, i) => i !== state.mutationTargetIndex && (from.subquery !== void 0 || from.raw !== void 0));
	if (lost.length === 0) return;
	const aliases = lost.map((from) => from.alias).filter((alias) => alias !== void 0 && alias !== "").join(", ");
	throw new ParserError(area, `An UPDATE/DELETE renders one target table, so the derived or raw FROM source(s) ${aliases === "" ? "" : `(${aliases}) `}would be dropped without a word — their own WHERE and limit included, while predicates written against their alias survived and referenced nothing. Attach the source with joinWithBuilder/joinTable instead, which emits it as USING on Postgres and a multi-table form on MySQL.`);
};
/**
* Resolves the table targeted by UPDATE or DELETE.
*
* Prefers the `updateTable` / `deleteFrom` entry tracked by {@link QueryState.mutationTargetIndex}.
* Falls back to the sole `fromStates` entry when no mutation index is set. Refuses ambiguous
* stacks (multiple FROM sources without a recorded mutation target).
*/
const resolveMutationTarget = (state, area, missingMessage) => {
	if (state.fromStates.length === 0) throw new ParserError(area, missingMessage);
	if (state.mutationTargetIndex !== void 0) {
		const target = state.fromStates[state.mutationTargetIndex];
		if (!target) throw new ParserError(area, missingMessage);
		assertNoDroppedFromSources(state, area);
		return target;
	}
	if (state.fromStates.length > 1) throw new ParserError(area, "Ambiguous UPDATE/DELETE target: call updateTable/deleteFrom after fromTable, or clearFrom first");
	return state.fromStates[0];
};
//#endregion
//#region src/parser/default-delete.ts
const defaultDelete = (state, config, mode, options) => {
	const sqlHelper = new SqlHelper(mode);
	assertMutationJoinsSupported(state, config, ParserArea.Delete);
	const hasJoins = state.joinStates.length > 0;
	const delim = config.identifierDelimiters;
	const quote = (s) => quoteIdentifier(s, delim);
	const fromState = resolveMutationTarget(state, ParserArea.Delete, "DELETE requires a table");
	const owner = fromState.owner ?? "";
	const alias = fromState.alias ?? "";
	if (owner !== "" && config.databaseType === DatabaseType.Mysql) throw new ParserError(ParserArea.Delete, "MySQL does not support table owners");
	const qualified = (owner !== "" ? quote(owner) + "." : "") + quote(fromState.tableName ?? "");
	if (config.databaseType === DatabaseType.Mssql && (alias !== "" || hasJoins)) {
		sqlHelper.addSqlSnippet("DELETE ");
		sqlHelper.addSqlSnippet(mssqlMutationTop(state, config));
		sqlHelper.addSqlSnippet(alias !== "" ? quote(alias) : qualified);
		if (state.returningState) emitMssqlOutputClause(sqlHelper, config, state.returningState, "DELETED", ParserArea.Delete);
		sqlHelper.addSqlSnippet(" FROM ");
		sqlHelper.addSqlSnippet(qualified);
		if (alias !== "") {
			sqlHelper.addSqlSnippet(" AS ");
			sqlHelper.addSqlSnippet(quote(alias));
		}
		if (hasJoins) {
			const join = defaultJoin(state, config, mode, options);
			sqlHelper.addSqlSnippet(" ");
			sqlHelper.addSqlSnippetWithValues(join.getSql(), join.getValues());
		}
		return sqlHelper;
	}
	if (hasJoins && config.databaseType === DatabaseType.Mysql) {
		sqlHelper.addSqlSnippet("DELETE ");
		sqlHelper.addSqlSnippet(mssqlMutationTop(state, config));
		sqlHelper.addSqlSnippet(alias !== "" ? quote(alias) : qualified);
		sqlHelper.addSqlSnippet(" FROM ");
		sqlHelper.addSqlSnippet(qualified);
		if (alias !== "") {
			sqlHelper.addSqlSnippet(" AS ");
			sqlHelper.addSqlSnippet(quote(alias));
		}
		const join = defaultJoin(state, config, mode, options);
		sqlHelper.addSqlSnippet(" ");
		sqlHelper.addSqlSnippetWithValues(join.getSql(), join.getValues());
		return sqlHelper;
	}
	sqlHelper.addSqlSnippet("DELETE ");
	sqlHelper.addSqlSnippet(mssqlMutationTop(state, config));
	sqlHelper.addSqlSnippet("FROM ");
	sqlHelper.addSqlSnippet(qualified);
	if (alias !== "") {
		sqlHelper.addSqlSnippet(" AS ");
		sqlHelper.addSqlSnippet(quote(alias));
	}
	if (state.returningState && config.databaseType === DatabaseType.Mssql) emitMssqlOutputClause(sqlHelper, config, state.returningState, "DELETED", ParserArea.Delete);
	if (hasJoins && config.databaseType === DatabaseType.Postgres) {
		const using = renderPostgresMutationFrom(config, state, mode, options, ParserArea.Delete);
		sqlHelper.addSqlSnippet(" USING ");
		sqlHelper.addSqlSnippetWithValues(using.getSql(), using.getValues());
	}
	return sqlHelper;
};
//#endregion
//#region src/parser/default-from.ts
const defaultFrom = (state, config, mode, options) => {
	const sqlHelper = new SqlHelper(mode);
	if (state.fromStates.length === 0) throw new ParserError(ParserArea.From, "No tables to select from");
	sqlHelper.addSqlSnippet("FROM ");
	state.fromStates.forEach((fromState, i) => {
		if (fromState.builderType === BuilderType.FromRaw) {
			refuseUnplaceableMssqlRowLock(config, state.rowLock, "a raw FROM fragment");
			sqlHelper.addSqlSnippet(fromState.raw ?? "");
			if (i < state.fromStates.length - 1) sqlHelper.addSqlSnippet(", ");
			return;
		}
		if (fromState.builderType === BuilderType.FromTable) {
			if (fromState.owner !== "" && config.databaseType === DatabaseType.Mysql) throw new ParserError(ParserArea.From, "MySQL does not support table owners");
			const namesADeclaredCte = state.cteStates.some((cte) => cte.name === fromState.tableName) || fromState.tableName !== void 0 && options?.declaredCteNames?.has(fromState.tableName) === true;
			if (fromState.owner !== "" && !namesADeclaredCte) {
				sqlHelper.addSqlSnippet(quoteIdentifier(fromState.owner, config.identifierDelimiters));
				sqlHelper.addSqlSnippet(".");
			}
			sqlHelper.addSqlSnippet(quoteIdentifier(fromState.tableName, config.identifierDelimiters));
			if (fromState.alias !== "") {
				sqlHelper.addSqlSnippet(" AS ");
				sqlHelper.addSqlSnippet(quoteIdentifier(fromState.alias, config.identifierDelimiters));
			}
			sqlHelper.addSqlSnippet(mysqlIndexHintForTable(state, config, fromState.alias ?? fromState.tableName ?? ""));
			if (state.rowLock && config.databaseType === DatabaseType.Mssql) sqlHelper.addSqlSnippet(mssqlRowLockHint(state.rowLock));
			if (i < state.fromStates.length - 1) sqlHelper.addSqlSnippet(", ");
			return;
		}
		if (fromState.builderType === BuilderType.FromBuilder) {
			refuseUnplaceableMssqlRowLock(config, state.rowLock, "a derived table");
			const subHelper = defaultToSql(fromState.subquery, config, mode, options);
			sqlHelper.addSqlSnippetWithValues("(" + subHelper.getSql() + ")", subHelper.getValues());
			if (fromState.alias !== "") {
				sqlHelper.addSqlSnippet(" AS ");
				sqlHelper.addSqlSnippet(quoteIdentifier(fromState.alias, config.identifierDelimiters));
			}
			if (i < state.fromStates.length - 1) sqlHelper.addSqlSnippet(", ");
			return;
		}
		if (fromState.builderType === BuilderType.FromLateral) {
			refuseUnplaceableMssqlRowLock(config, state.rowLock, "a LATERAL subquery");
			if (config.databaseType === DatabaseType.Sqlite) throw new ParserError(ParserArea.From, "SQLite does not support LATERAL derived tables");
			if (config.databaseType === DatabaseType.Mssql) throw new ParserError(ParserArea.From, "MSSQL LATERAL belongs in APPLY joins — use joinCrossApply/joinOuterApply");
			const subHelper = defaultToSql(fromState.subquery, config, mode, options);
			sqlHelper.addSqlSnippet("LATERAL (");
			sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
			sqlHelper.addSqlSnippet(")");
			if (fromState.alias !== "") {
				sqlHelper.addSqlSnippet(" AS ");
				sqlHelper.addSqlSnippet(quoteIdentifier(fromState.alias, config.identifierDelimiters));
			}
			if (i < state.fromStates.length - 1) sqlHelper.addSqlSnippet(", ");
			return;
		}
		if (fromState.builderType === BuilderType.FromFunction) {
			refuseUnplaceableMssqlRowLock(config, state.rowLock, "a table-valued function");
			if (config.databaseType === DatabaseType.Mysql) throw new ParserError(ParserArea.From, "MySQL does not support table functions in FROM — use fromFunctionRaw");
			if (fromState.owner && fromState.owner !== "") {
				sqlHelper.addSqlSnippet(quoteIdentifier(fromState.owner, config.identifierDelimiters));
				sqlHelper.addSqlSnippet(".");
			}
			const fnName = fromState.functionName ?? "";
			if (config.databaseType === DatabaseType.Sqlite) sqlHelper.addSqlSnippet(fnName);
			else sqlHelper.addSqlSnippet(quoteIdentifier(fnName, config.identifierDelimiters));
			sqlHelper.addSqlSnippet("(");
			const params = fromState.functionParams ?? [];
			params.forEach((param, paramIndex) => {
				sqlHelper.addDynamicValue(param);
				if (paramIndex < params.length - 1) sqlHelper.addSqlSnippet(", ");
			});
			sqlHelper.addSqlSnippet(")");
			if (fromState.alias !== "") {
				sqlHelper.addSqlSnippet(" AS ");
				sqlHelper.addSqlSnippet(quoteIdentifier(fromState.alias, config.identifierDelimiters));
			}
			if (i < state.fromStates.length - 1) sqlHelper.addSqlSnippet(", ");
		}
	});
	return sqlHelper;
};
//#endregion
//#region src/parser/comparison-operator.ts
/**
* Emits `<column> <operator> <value>` for a comparison predicate — the shared core of WHERE's
* and HAVING's `col op value` term, so the two clauses can never drift on operator semantics.
*
* `columnSql` must already be the fully quoted/qualified column reference (e.g. `"u"."id"`).
* `area` selects the {@link ParserError} area for an unsupported operator, so the message still
* says `Where:` or `Having:` as appropriate.
*/
const emitComparisonPredicate = (sqlHelper, config, columnSql, whereOperator, value, area) => {
	if ((whereOperator === WhereOperator.Equals || whereOperator === WhereOperator.NotEquals) && (value === null || value === void 0)) {
		sqlHelper.addSqlSnippet(columnSql);
		sqlHelper.addSqlSnippet(" ");
		sqlHelper.addSqlSnippet(whereOperator === WhereOperator.Equals ? "IS NULL" : "IS NOT NULL");
		return;
	}
	if (whereOperator === WhereOperator.IsDistinctFrom || whereOperator === WhereOperator.IsNotDistinctFrom) {
		const isNotDistinct = whereOperator === WhereOperator.IsNotDistinctFrom;
		if (config.databaseType === DatabaseType.Postgres || config.databaseType === DatabaseType.Sqlite) {
			sqlHelper.addSqlSnippet(columnSql);
			sqlHelper.addSqlSnippet(isNotDistinct ? " IS NOT DISTINCT FROM " : " IS DISTINCT FROM ");
			sqlHelper.addDynamicValue(value);
			return;
		}
		if (config.databaseType === DatabaseType.Mysql) {
			if (isNotDistinct) {
				sqlHelper.addSqlSnippet(columnSql);
				sqlHelper.addSqlSnippet(" <=> ");
				sqlHelper.addDynamicValue(value);
				return;
			}
			sqlHelper.addSqlSnippet("NOT (");
			sqlHelper.addSqlSnippet(columnSql);
			sqlHelper.addSqlSnippet(" <=> ");
			sqlHelper.addDynamicValue(value);
			sqlHelper.addSqlSnippet(")");
			return;
		}
		if (value === null || value === void 0) {
			sqlHelper.addSqlSnippet(columnSql);
			sqlHelper.addSqlSnippet(isNotDistinct ? " IS NULL" : " IS NOT NULL");
			return;
		}
		if (isNotDistinct) {
			sqlHelper.addSqlSnippet(columnSql);
			sqlHelper.addSqlSnippet(" = ");
			sqlHelper.addDynamicValue(value);
			return;
		}
		sqlHelper.addSqlSnippet("(");
		sqlHelper.addSqlSnippet(columnSql);
		sqlHelper.addSqlSnippet(" <> ");
		sqlHelper.addDynamicValue(value);
		sqlHelper.addSqlSnippet(" OR ");
		sqlHelper.addSqlSnippet(columnSql);
		sqlHelper.addSqlSnippet(" IS NULL)");
		return;
	}
	if (whereOperator === WhereOperator.Ilike || whereOperator === WhereOperator.NotIlike) {
		const negate = whereOperator === WhereOperator.NotIlike;
		if (config.databaseType === DatabaseType.Postgres) {
			sqlHelper.addSqlSnippet(columnSql);
			sqlHelper.addSqlSnippet(negate ? " NOT ILIKE " : " ILIKE ");
			sqlHelper.addDynamicValue(value);
			return;
		}
		throw new ParserError(area, `${dialectDisplayName(config.databaseType)} has no ILIKE operator — its LIKE case-sensitivity is collation-dependent`);
	}
	if (whereOperator === WhereOperator.Regex || whereOperator === WhereOperator.NotRegex || whereOperator === WhereOperator.Iregex || whereOperator === WhereOperator.NotIregex) {
		const negate = whereOperator === WhereOperator.NotRegex || whereOperator === WhereOperator.NotIregex;
		const insensitive = whereOperator === WhereOperator.Iregex || whereOperator === WhereOperator.NotIregex;
		if (config.databaseType === DatabaseType.Postgres) {
			sqlHelper.addSqlSnippet(columnSql);
			sqlHelper.addSqlSnippet(insensitive ? negate ? " !~* " : " ~* " : negate ? " !~ " : " ~ ");
			sqlHelper.addDynamicValue(value);
			return;
		}
		if (config.databaseType === DatabaseType.Mysql) {
			if (negate) sqlHelper.addSqlSnippet("NOT ");
			sqlHelper.addSqlSnippet("REGEXP_LIKE(");
			sqlHelper.addSqlSnippet(columnSql);
			sqlHelper.addSqlSnippet(", ");
			sqlHelper.addDynamicValue(value);
			sqlHelper.addSqlSnippet(insensitive ? ", 'i')" : ", 'c')");
			return;
		}
		throw new ParserError(area, `${config.databaseType === DatabaseType.Sqlite ? "SQLite" : "MSSQL"} has no built-in regular-expression operator`);
	}
	if (whereOperator === WhereOperator.Contains || whereOperator === WhereOperator.NotContains || whereOperator === WhereOperator.StartsWith || whereOperator === WhereOperator.EndsWith) {
		let escaped = String(value).replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
		if (config.databaseType === DatabaseType.Mssql) escaped = escaped.replaceAll("[", "\\[");
		const pattern = whereOperator === WhereOperator.StartsWith ? `${escaped}%` : whereOperator === WhereOperator.EndsWith ? `%${escaped}` : `%${escaped}%`;
		const escapeLiteral = config.databaseType === DatabaseType.Mysql ? "'\\\\'" : "'\\'";
		sqlHelper.addSqlSnippet(columnSql);
		sqlHelper.addSqlSnippet(whereOperator === WhereOperator.NotContains ? " NOT LIKE " : " LIKE ");
		sqlHelper.addDynamicValue(pattern);
		sqlHelper.addSqlSnippet(" ESCAPE ");
		sqlHelper.addSqlSnippet(escapeLiteral);
		return;
	}
	sqlHelper.addSqlSnippet(columnSql);
	sqlHelper.addSqlSnippet(" ");
	switch (whereOperator) {
		case WhereOperator.Equals:
			sqlHelper.addSqlSnippet("=");
			break;
		case WhereOperator.NotEquals:
			sqlHelper.addSqlSnippet("<>");
			break;
		case WhereOperator.GreaterThan:
			sqlHelper.addSqlSnippet(">");
			break;
		case WhereOperator.GreaterThanOrEquals:
			sqlHelper.addSqlSnippet(">=");
			break;
		case WhereOperator.LessThan:
			sqlHelper.addSqlSnippet("<");
			break;
		case WhereOperator.LessThanOrEquals:
			sqlHelper.addSqlSnippet("<=");
			break;
		case WhereOperator.Like:
			sqlHelper.addSqlSnippet("LIKE");
			break;
		case WhereOperator.NotLike:
			sqlHelper.addSqlSnippet("NOT LIKE");
			break;
		default: throw new ParserError(area, `Unsupported ${area.toUpperCase()} operator: ${whereOperator}`);
	}
	sqlHelper.addSqlSnippet(" ");
	sqlHelper.addDynamicValue(value);
};
//#endregion
//#region src/parser/default-full-text.ts
const columnRef$2 = (config, tableNameOrAlias, columnName) => qualifiedColumn(tableNameOrAlias, columnName, config.identifierDelimiters);
/**
* Emits a dialect-specific full-text predicate for one or more columns and a bound query term.
* The query value is appended by the caller via {@link SqlHelper.addDynamicValue}.
*/
/**
* Postgres has a distinct tsquery constructor per search mode, and all three are native.
*
* `Phrase` used to be refused outright as "not structured yet". It is structured: `phraseto_tsquery`
* (9.6+) joins the terms with the `<->` distance operator, which is exactly a phrase match. Routing
* it to `plainto_tsquery` instead would match the words in any order — the one thing a phrase search
* exists to prevent.
*/
const postgresTsQueryFunction = (mode) => {
	if (mode === FullTextMode.Boolean) return "to_tsquery(";
	if (mode === FullTextMode.Phrase) return "phraseto_tsquery(";
	return "plainto_tsquery(";
};
const emitFullTextPredicate = (sqlHelper, config, columns, mode, area) => {
	if (columns.length === 0) throw new ParserError(area, "Full-text search requires at least one column");
	if (config.databaseType === DatabaseType.Postgres) {
		if (columns.length === 1) {
			const col = columns[0];
			sqlHelper.addSqlSnippet("to_tsvector(");
			sqlHelper.addSqlSnippet(sqlStringLiteral("english"));
			sqlHelper.addSqlSnippet(", ");
			sqlHelper.addSqlSnippet(columnRef$2(config, col.tableNameOrAlias, col.columnName));
			sqlHelper.addSqlSnippet(") @@ ");
			sqlHelper.addSqlSnippet(postgresTsQueryFunction(mode));
			sqlHelper.addSqlSnippet(sqlStringLiteral("english"));
			sqlHelper.addSqlSnippet(", ");
			return;
		}
		throw new ParserError(area, "Postgres full-text matches ONE tsvector — pass a single column, index a generated tsvector column, or build the document yourself with whereMatchRaw");
	}
	if (config.databaseType === DatabaseType.Mysql) {
		if (mode === FullTextMode.Phrase) throw new ParserError(area, "MySQL expresses a phrase by quoting the search string, not by a mode — pass a quoted phrase to a Boolean search, or use whereMatchRaw");
		sqlHelper.addSqlSnippet("MATCH (");
		columns.forEach((col, i) => {
			sqlHelper.addSqlSnippet(columnRef$2(config, col.tableNameOrAlias, col.columnName));
			if (i < columns.length - 1) sqlHelper.addSqlSnippet(", ");
		});
		sqlHelper.addSqlSnippet(") AGAINST (");
		return;
	}
	if (config.databaseType === DatabaseType.Mssql) {
		if (columns.length !== 1) throw new ParserError(area, "MSSQL CONTAINS/FREETEXT accepts a single column — pass one column or use whereMatchRaw");
		if (mode === FullTextMode.Phrase) throw new ParserError(area, "MSSQL expresses a phrase by quoting it inside the CONTAINS search condition, not by a mode — pass a quoted phrase to a Boolean search, or use whereMatchRaw");
		const col = columns[0];
		if (mode === FullTextMode.Natural) {
			sqlHelper.addSqlSnippet("FREETEXT(");
			sqlHelper.addSqlSnippet(columnRef$2(config, col.tableNameOrAlias, col.columnName));
			sqlHelper.addSqlSnippet(", ");
			return;
		}
		sqlHelper.addSqlSnippet("CONTAINS(");
		sqlHelper.addSqlSnippet(columnRef$2(config, col.tableNameOrAlias, col.columnName));
		sqlHelper.addSqlSnippet(", ");
		return;
	}
	if (config.databaseType === DatabaseType.Sqlite) {
		if (columns.length !== 1) throw new ParserError(area, "SQLite FTS MATCH accepts a single FTS column — pass one column or use whereMatchRaw");
		if (mode !== FullTextMode.Natural) throw new ParserError(area, `SQLite FTS MATCH has no mode selector — its operators live inside the query string, so FullTextMode.${FullTextMode[mode] ?? mode} cannot change the statement. Use FullTextMode.Natural and write the FTS5 operators into the query, or whereMatchRaw.`);
		const col = columns[0];
		sqlHelper.addSqlSnippet(columnRef$2(config, col.tableNameOrAlias, col.columnName));
		sqlHelper.addSqlSnippet(" MATCH ");
		return;
	}
	throw new ParserError(area, `Full-text search is not supported on ${config.databaseType}`);
};
/** Emits the closing syntax after the bound full-text query value (MySQL `AGAINST (...)` only). */
const emitFullTextValueSuffix = (sqlHelper, config, mode) => {
	if (config.databaseType === DatabaseType.Postgres || config.databaseType === DatabaseType.Mssql) {
		sqlHelper.addSqlSnippet(")");
		return;
	}
	if (config.databaseType === DatabaseType.Mysql) {
		if (mode === FullTextMode.Boolean) {
			sqlHelper.addSqlSnippet(" IN BOOLEAN MODE)");
			return;
		}
		sqlHelper.addSqlSnippet(" IN NATURAL LANGUAGE MODE)");
	}
};
//#endregion
//#region src/parser/default-json.ts
const columnRef$1 = (config, tableNameOrAlias, columnName) => qualifiedColumn(tableNameOrAlias, columnName, config.identifierDelimiters);
/**
* The raw escape hatch that actually exists for the clause a refusal fired in.
*
* The SQLite refusal below used to name `selectJsonRaw`, a method that has never existed anywhere
* in this library — and the wrong name had been copied into the Dart port and BOTH contract
* manifests, so the contract itself asserted it. A refusal that points at a method the caller
* cannot call is worse than no advice, and it is exactly the same failure as an emulation: the
* library saying something untrue about its own surface. These three are real, and which one is
* right depends on the clause.
*/
const rawHatchFor = (area) => {
	if (area === ParserArea.Where) return "whereRaw";
	if (area === ParserArea.Having) return "havingRaw";
	return "selectRaw";
};
/**
* Emits a dialect-specific JSON path extraction expression for `column` at `path`.
* `path` is a single Postgres key segment (`'email'`) or a JSON path (`'$.email'`) on other dialects.
*/
const emitJsonExtractExpression = (sqlHelper, config, tableNameOrAlias, columnName, path, mode, area) => {
	const col = columnRef$1(config, tableNameOrAlias, columnName);
	if (config.databaseType === DatabaseType.Postgres) {
		sqlHelper.addSqlSnippet("jsonb_path_query_first(");
		sqlHelper.addSqlSnippet(col);
		sqlHelper.addSqlSnippet(", ");
		sqlHelper.addSqlSnippet(sqlStringLiteral(path));
		sqlHelper.addSqlSnippet(mode === JsonExtractMode.Text ? ") #>> '{}'" : ")");
		return;
	}
	if (config.databaseType === DatabaseType.Mysql) {
		if (mode === JsonExtractMode.Text) {
			sqlHelper.addSqlSnippet("JSON_UNQUOTE(JSON_EXTRACT(");
			sqlHelper.addSqlSnippet(col);
			sqlHelper.addSqlSnippet(", ");
			sqlHelper.addSqlSnippet(sqlStringLiteral(path));
			sqlHelper.addSqlSnippet("))");
			return;
		}
		sqlHelper.addSqlSnippet("JSON_EXTRACT(");
		sqlHelper.addSqlSnippet(col);
		sqlHelper.addSqlSnippet(", ");
		sqlHelper.addSqlSnippet(sqlStringLiteral(path));
		sqlHelper.addSqlSnippet(")");
		return;
	}
	if (config.databaseType === DatabaseType.Mssql) {
		if (mode === JsonExtractMode.Object) {
			sqlHelper.addSqlSnippet("JSON_QUERY(");
			sqlHelper.addSqlSnippet(col);
			sqlHelper.addSqlSnippet(", ");
			sqlHelper.addSqlSnippet(sqlStringLiteral(path));
			sqlHelper.addSqlSnippet(")");
			return;
		}
		sqlHelper.addSqlSnippet("JSON_VALUE(");
		sqlHelper.addSqlSnippet(col);
		sqlHelper.addSqlSnippet(", ");
		sqlHelper.addSqlSnippet(sqlStringLiteral(path));
		sqlHelper.addSqlSnippet(")");
		return;
	}
	if (config.databaseType === DatabaseType.Sqlite) {
		if (mode === JsonExtractMode.Object) throw new ParserError(area, `SQLite json_extract always returns text — use JsonExtractMode.Text or ${rawHatchFor(area)}`);
		sqlHelper.addSqlSnippet("json_extract(");
		sqlHelper.addSqlSnippet(col);
		sqlHelper.addSqlSnippet(", ");
		sqlHelper.addSqlSnippet(sqlStringLiteral(path));
		sqlHelper.addSqlSnippet(")");
		return;
	}
	throw new ParserError(area, `JSON extract is not supported on ${config.databaseType}`);
};
/** Emits `column @> value` / `JSON_CONTAINS` / equivalent containment predicate (lhs only). */
const emitJsonContainsExpression = (sqlHelper, config, tableNameOrAlias, columnName, area) => {
	const col = columnRef$1(config, tableNameOrAlias, columnName);
	if (config.databaseType === DatabaseType.Postgres) {
		sqlHelper.addSqlSnippet(col);
		sqlHelper.addSqlSnippet(" @> ");
		return;
	}
	if (config.databaseType === DatabaseType.Mysql) {
		sqlHelper.addSqlSnippet("JSON_CONTAINS(");
		sqlHelper.addSqlSnippet(col);
		sqlHelper.addSqlSnippet(", ");
		return;
	}
	if (config.databaseType === DatabaseType.Mssql) throw new ParserError(area, "MSSQL has no JSON containment operator — use whereJsonExtract or whereRaw with OPENJSON/JSON_QUERY");
	throw new ParserError(area, "SQLite does not support JSON containment — use whereJsonExtract or whereRaw");
};
//#endregion
//#region src/parser/default-json-predicate.ts
/**
* Stand-in column name used while rendering a comparison against a JSON extraction, then
* substituted for the real expression. Deliberately unquotable and unlikely to occur in user data.
*/
const JSON_COLUMN_SENTINEL = "___json___";
const emitJsonExtractPredicate = (sqlHelper, config, mode, state, area) => {
	if (!state.columnName || !state.jsonPath || !state.jsonExtractMode) throw new ParserError(area, "JSON extract predicate requires a column, a path, and a mode");
	const jsonScratch = new SqlHelper(mode);
	emitJsonExtractExpression(jsonScratch, config, state.tableNameOrAlias ?? "", state.columnName, state.jsonPath, state.jsonExtractMode, area);
	const jsonSql = jsonScratch.getSql();
	const scratch = new SqlHelper(mode);
	emitComparisonPredicate(scratch, config, JSON_COLUMN_SENTINEL, state.whereOperator, state.values[0], area);
	const predicate = scratch.getSql().split(JSON_COLUMN_SENTINEL).join(jsonSql);
	if (predicate.includes(JSON_COLUMN_SENTINEL)) throw new ParserError(area, "JSON predicate failed to resolve its column reference");
	sqlHelper.addSqlSnippetWithValues(predicate, [...jsonScratch.getValues(), ...scratch.getValues()]);
};
const emitJsonContainsPredicate = (sqlHelper, config, state, area) => {
	if (!state.columnName) throw new ParserError(area, "JSON contains predicate requires a column");
	emitJsonContainsExpression(sqlHelper, config, state.tableNameOrAlias ?? "", state.columnName, area);
	sqlHelper.addDynamicValue(state.values[0]);
	if (config.databaseType === DatabaseType.Postgres) sqlHelper.addSqlSnippet("::jsonb");
	if (config.databaseType === DatabaseType.Mysql) sqlHelper.addSqlSnippet(")");
};
const emitFullTextMatchPredicate = (sqlHelper, config, columns, mode, value, area) => {
	emitFullTextPredicate(sqlHelper, config, columns, mode, area);
	sqlHelper.addDynamicValue(value);
	emitFullTextValueSuffix(sqlHelper, config, mode);
};
/** Emits one GROUP BY column reference. */
const emitGroupByColumnRef = (sqlHelper, config, tableNameOrAlias, columnName) => {
	sqlHelper.addSqlSnippet(qualifiedColumn(tableNameOrAlias, columnName, config.identifierDelimiters));
};
/**
* Refuses a row cap on a subquery used in an `IN` / `NOT IN` / quantified predicate on MySQL.
*
* MySQL cannot evaluate a LIMIT inside that specific position and says so plainly. Measured, with
* the LIMIT as the only variable — a derived table and an EXISTS subquery both take it fine, so the
* restriction is about the PREDICATE position, not about subqueries in general:
*
*     … WHERE o.id IN     (SELECT id FROM orders LIMIT 2)   ERROR 1235
*     … WHERE o.id NOT IN (SELECT id FROM orders LIMIT 2)   ERROR 1235
*     … WHERE o.id > ANY  (SELECT id FROM orders LIMIT 2)   ERROR 1235
*     … WHERE EXISTS      (SELECT id FROM orders LIMIT 2)   accepted
*     SELECT * FROM       (SELECT id FROM orders LIMIT 2) x accepted
*
* "This version of MySQL doesn't yet support 'LIMIT & IN/ALL/ANY/SOME subquery'" — the server's own
* words, and the reason the refusal names the derived-table rewrite rather than performing it.
*
* `offset()` trips the same error on MySQL, because an offset with no limit synthesizes the
* sentinel `LIMIT 18446744073709551615` in front of it — a LIMIT is a LIMIT to the parser.
*/
const assertPredicateSubqueryRowCap = (subquery, config, area) => {
	if (config.databaseType !== DatabaseType.Mysql || subquery === void 0) return;
	if (subquery.limit === 0 && subquery.offset === void 0) return;
	throw new ParserError(area, "MySQL cannot evaluate a row cap inside an IN/NOT IN/ANY/ALL subquery — the server reports \"doesn't yet support 'LIMIT & IN/ALL/ANY/SOME subquery'\". Select the capped rows into a derived table with fromWithBuilder and join or match against that instead; MySQL accepts a LIMIT there.");
};
//#endregion
//#region src/parser/default-group-by.ts
const emitColumnList = (sqlHelper, config, columns) => {
	columns.forEach((column, i) => {
		emitGroupByColumnRef(sqlHelper, config, column.tableNameOrAlias, column.columnName);
		if (i < columns.length - 1) sqlHelper.addSqlSnippet(", ");
	});
};
const collectPlainColumns = (groupByStates) => groupByStates.filter((state) => state.builderType === BuilderType.GroupByColumn).map((state) => ({
	tableNameOrAlias: state.tableNameOrAlias ?? "",
	columnName: state.columnName ?? ""
}));
/**
* Emits the GROUP BY list, with EVERY grouping element the caller set.
*
* ── WHAT WAS WRONG (fixed 2026-07-22) ──
* This used `groupByStates.find(...)` to locate the first ROLLUP/CUBE/GROUPING SETS and emitted only
* that. Every other grouping element — plain columns, raws, a second modifier — was discarded with
* no word, so the statement ran and grouped by something the caller never asked for:
*
*     groupByRollup(id) + groupByColumn(customer_id)  ->  GROUP BY ROLLUP ("o"."id")
*     groupByColumn(customer_id) + groupByRollup(id)  ->  GROUP BY ROLLUP ("o"."id")
*     groupByRollup(id) + groupByCube(customer_id)    ->  GROUP BY ROLLUP ("o"."id")
*
* Wrong results, no error, in either order. Found by the mechanical clause-pair sweep in
* `scripts/check-silent-noops.mjs` rather than by anyone reading the code.
*
* ── THE TWO GRAMMARS (measured against the harness, 2026-07-22) ──
* ROLLUP is an ELEMENT on Postgres and MSSQL, and a trailing SUFFIX on MySQL. They do not compose
* the same way and cannot share an emission path:
*
*     Postgres 17  GROUP BY ROLLUP(a), b            OK      order is not significant
*                  GROUP BY a, ROLLUP(b)            OK
*                  GROUP BY ROLLUP(a), CUBE(b)      OK
*     MSSQL 2022   GROUP BY ROLLUP(a), b            OK
*     MySQL 8.4    GROUP BY a, b WITH ROLLUP        OK      one suffix, applies to the whole list
*                  GROUP BY a, ROLLUP(b)            ERROR 1064 — no function form at all
*
* So MySQL takes at most ONE rollup and it goes at the end; the other two take any number of
* elements in any order. SQLite has none of the three and refuses, as before.
*/
const defaultGroupBy = (state, config, mode) => {
	const sqlHelper = new SqlHelper(mode);
	if (state.groupByStates.length === 0) return sqlHelper;
	const isModifier = (g) => g.builderType === BuilderType.GroupByRollup || g.builderType === BuilderType.GroupByCube || g.builderType === BuilderType.GroupByGroupingSets;
	const modifiers = state.groupByStates.filter(isModifier);
	const plainColumns = collectPlainColumns(state.groupByStates);
	/** The columns a modifier groups over: its own set, or the statement's plain columns. */
	const columnsFor = (g) => g.groupingSets && g.groupingSets.length === 1 ? g.groupingSets[0] : plainColumns;
	const NAME = {
		[BuilderType.GroupByRollup]: "ROLLUP",
		[BuilderType.GroupByCube]: "CUBE",
		[BuilderType.GroupByGroupingSets]: "GROUPING SETS"
	};
	for (const modifier of modifiers) {
		const label = NAME[modifier.builderType] ?? "grouping";
		if (config.databaseType === DatabaseType.Sqlite) throw new ParserError(ParserArea.General, `SQLite has no ${label} — use groupByRaw`);
		if (config.databaseType === DatabaseType.Mysql && label !== "ROLLUP") throw new ParserError(ParserArea.General, `MySQL has no ${label} — use groupByRollup or groupByRaw`);
		if (modifier.builderType === BuilderType.GroupByGroupingSets) {
			if ((modifier.groupingSets ?? []).length === 0) throw new ParserError(ParserArea.General, "GROUPING SETS requires at least one column set");
		} else if (columnsFor(modifier).length === 0) throw new ParserError(ParserArea.General, `${label} requires at least one grouping column`);
	}
	if (config.databaseType === DatabaseType.Mysql && modifiers.length > 1) throw new ParserError(ParserArea.General, "MySQL spells ROLLUP as a single trailing WITH ROLLUP over the whole GROUP BY list, so it takes only one grouping modifier — two cannot both apply. Use groupByRaw if you need a shape MySQL cannot express directly.");
	sqlHelper.addSqlSnippet("GROUP BY ");
	const emitModifier = (g) => {
		if (g.builderType === BuilderType.GroupByGroupingSets) {
			const sets = g.groupingSets ?? [];
			sqlHelper.addSqlSnippet("GROUPING SETS (");
			sets.forEach((set, i) => {
				sqlHelper.addSqlSnippet("(");
				emitColumnList(sqlHelper, config, set);
				sqlHelper.addSqlSnippet(")");
				if (i < sets.length - 1) sqlHelper.addSqlSnippet(", ");
			});
			sqlHelper.addSqlSnippet(")");
			return;
		}
		sqlHelper.addSqlSnippet(g.builderType === BuilderType.GroupByRollup ? "ROLLUP (" : "CUBE (");
		emitColumnList(sqlHelper, config, columnsFor(g));
		sqlHelper.addSqlSnippet(")");
	};
	if (config.databaseType === DatabaseType.Mysql) {
		const rollup = modifiers[0];
		const carriesOwnColumns = rollup?.groupingSets !== void 0 && rollup.groupingSets.length === 1;
		const otherTerms = state.groupByStates.filter((g) => !isModifier(g));
		if (carriesOwnColumns && otherTerms.length > 0) throw new ParserError(ParserArea.General, "MySQL cannot cross a ROLLUP with other grouping terms — its WITH ROLLUP applies to the whole GROUP BY list, so ROLLUP(a) alongside b has no MySQL spelling. Roll up the full list by passing every column to groupByRollup, or use groupByRaw.");
		const terms = rollup ? columnsFor(rollup) : [];
		const emitted = rollup && carriesOwnColumns ? terms.map((c) => ({
			kind: "col",
			col: c
		})) : state.groupByStates.filter((g) => !isModifier(g)).map((g) => g.builderType === BuilderType.GroupByRaw ? {
			kind: "raw",
			raw: g.raw ?? ""
		} : {
			kind: "col",
			col: {
				tableNameOrAlias: g.tableNameOrAlias ?? "",
				columnName: g.columnName ?? ""
			}
		});
		emitted.forEach((term, i) => {
			if (term.kind === "raw") sqlHelper.addSqlSnippet(term.raw);
			else emitGroupByColumnRef(sqlHelper, config, term.col.tableNameOrAlias, term.col.columnName);
			if (i < emitted.length - 1) sqlHelper.addSqlSnippet(", ");
		});
		if (rollup) sqlHelper.addSqlSnippet(" WITH ROLLUP");
		return sqlHelper;
	}
	const absorbed = modifiers.length > 0 && modifiers.every((m) => !(m.groupingSets && m.groupingSets.length === 1)) && plainColumns.length > 0;
	const elements = state.groupByStates.filter((g) => isModifier(g) || !(absorbed && g.builderType === BuilderType.GroupByColumn));
	elements.forEach((g, i) => {
		if (isModifier(g)) emitModifier(g);
		else if (g.builderType === BuilderType.GroupByRaw) sqlHelper.addSqlSnippet(g.raw ?? "");
		else emitGroupByColumnRef(sqlHelper, config, g.tableNameOrAlias ?? "", g.columnName ?? "");
		if (i < elements.length - 1) sqlHelper.addSqlSnippet(", ");
	});
	return sqlHelper;
};
//#endregion
//#region src/enums/aggregate-function.ts
/**
* The five aggregate functions every dialect spells identically.
*
* This is a CALL NODE, not an expression AST. The operand is one column or `*`, with an optional
* DISTINCT — nothing nests inside it, and nothing composes with it. That boundary is the ruling
* this surface was built under: SQLEasy models clauses, and `COUNT(x)` is the one function shape
* common enough that expressing it only through `selectRaw` was costing more than the node costs.
* `CASE`, `CAST`, `COALESCE` and the scalar-function surface stay out, deliberately.
*
* All five are identical text on Postgres, MySQL, SQLite and MSSQL, so there is no engine-native
* naming split here — measured, along with `DISTINCT` inside each.
*/
const AggregateFunction = {
	/** `COUNT(x)` — the only one that also accepts `*`. */
	Count: "Count",
	Sum: "Sum",
	Avg: "Avg",
	Min: "Min",
	Max: "Max"
};
/**
* The operand that means "every row" rather than a column.
*
* Spelled as the SQL itself spells it. Only `COUNT` accepts it — `SUM(*)` and `MIN(*)` are
* "function sum() does not exist" on Postgres, not a parse error, so the refusal has to be ours.
* It is never quoted: `"*"` is a column literally named `*`.
*/
const AGGREGATE_STAR = "*";
//#endregion
//#region src/parser/default-row-value.ts
/**
* Row-value comparison: `(a, b) > (?, ?)` and `(a, b) IN ((?,?), (?,?))`.
*
* The keyset-pagination predicate and the composite-key lookup. `(created_at, id) < (?, ?)` is the
* only formulation of a keyset page that stays correct across ties and lets the engine use the
* composite index that satisfies the ORDER BY — its absence is why deep pagination otherwise falls
* back to OFFSET.
*
* ── WHERE IT WORKS (measured against the harness, 2026-07-22) ──
*
*     (a, b) > (?, ?)            Postgres  MySQL  SQLite 3.15+   accepted
*     (a, b) IN ((?,?), (?,?))   Postgres  MySQL  SQLite         accepted
*     (a, b) = (?, ?)            Postgres  MySQL  SQLite         accepted
*     any of the above                                MSSQL      Msg — no row constructor
*
* T-SQL has no row constructor in a comparison in any version, and the OR-chain rewrite
* (`a > ? OR (a = ? AND b > ?)`) is exactly the emulation this library refuses to synthesize: it
* changes the plan, the parameter count, and the NULL semantics. So MSSQL refuses and says why.
*/
const MSSQL_REFUSAL = "MSSQL has no row-value constructor in a comparison — `(a, b) > (?, ?)` and `(a, b) IN (…)` are not T-SQL in any version. The equivalent OR-chain (a > ? OR (a = ? AND b > ?)) is an emulation this library will not synthesize for you: it changes the query plan and the NULL handling. Write that predicate yourself with whereRaw/whereGroup if you need it on SQL Server.";
const emitTuple = (sqlHelper, config, columns) => {
	sqlHelper.addSqlSnippet("(");
	columns.forEach((c, i) => {
		sqlHelper.addSqlSnippet(qualifiedColumn(c.tableNameOrAlias, c.columnName, config.identifierDelimiters));
		if (i < columns.length - 1) sqlHelper.addSqlSnippet(", ");
	});
	sqlHelper.addSqlSnippet(")");
};
/** `(a, b) <op> (?, ?)` — one tuple on each side. `values` is the single right-hand tuple. */
const emitRowValueComparison = (sqlHelper, config, cur, area) => {
	if (config.databaseType === DatabaseType.Mssql) throw new ParserError(area, MSSQL_REFUSAL);
	const columns = cur.rowColumns ?? [];
	const rhs = cur.values[0] ?? [];
	if (columns.length < 2) throw new ParserError(area, "A row-value comparison needs at least two columns");
	if (rhs.length !== columns.length) throw new ParserError(area, `A row-value comparison needs one value per column — got ${columns.length} columns and ${rhs.length} values`);
	emitTuple(sqlHelper, config, columns);
	sqlHelper.addSqlSnippet(` ${rowValueOperatorSql(cur.whereOperator, area)} `);
	sqlHelper.addSqlSnippet("(");
	rhs.forEach((value, i) => {
		sqlHelper.addDynamicValue(value);
		if (i < rhs.length - 1) sqlHelper.addSqlSnippet(", ");
	});
	sqlHelper.addSqlSnippet(")");
};
/** `(a, b) IN ((?,?), (?,?))`. `values` is the list of tuples. */
const emitRowValueIn = (sqlHelper, config, cur, area) => {
	if (config.databaseType === DatabaseType.Mssql) throw new ParserError(area, MSSQL_REFUSAL);
	const columns = cur.rowColumns ?? [];
	const tuples = cur.values;
	if (columns.length < 2) throw new ParserError(area, "A row-value IN needs at least two columns");
	if (tuples.length === 0) throw new ParserError(area, "A row-value IN needs at least one tuple");
	for (const tuple of tuples) if (!Array.isArray(tuple) || tuple.length !== columns.length) throw new ParserError(area, `Every tuple in a row-value IN must have ${columns.length} values to match the columns`);
	emitTuple(sqlHelper, config, columns);
	sqlHelper.addSqlSnippet(" IN (");
	tuples.forEach((tuple, ti) => {
		sqlHelper.addSqlSnippet("(");
		tuple.forEach((value, vi) => {
			sqlHelper.addDynamicValue(value);
			if (vi < tuple.length - 1) sqlHelper.addSqlSnippet(", ");
		});
		sqlHelper.addSqlSnippet(")");
		if (ti < tuples.length - 1) sqlHelper.addSqlSnippet(", ");
	});
	sqlHelper.addSqlSnippet(")");
};
/**
* The SQL text for a row-value comparison operator. Only the ordered comparisons and equality make
* sense on a tuple — LIKE, IS NULL, BETWEEN and friends do not compose with a row constructor.
*/
const rowValueOperatorSql = (op, area) => {
	switch (op) {
		case WhereOperator.Equals: return "=";
		case WhereOperator.NotEquals: return "<>";
		case WhereOperator.GreaterThan: return ">";
		case WhereOperator.GreaterThanOrEquals: return ">=";
		case WhereOperator.LessThan: return "<";
		case WhereOperator.LessThanOrEquals: return "<=";
		default: throw new ParserError(area, "A row-value comparison takes only =, <>, <, <=, > or >= — LIKE, IS NULL and BETWEEN have no meaning on a tuple. Use a single-column predicate for those.");
	}
};
//#endregion
//#region src/parser/default-where.ts
const WHERE_PREDICATE_TYPES = /* @__PURE__ */ new Set([
	BuilderType.Where,
	BuilderType.WhereRaw,
	BuilderType.WhereBetween,
	BuilderType.WhereExistsBuilder,
	BuilderType.WhereInBuilder,
	BuilderType.WhereInValues,
	BuilderType.WhereNotExistsBuilder,
	BuilderType.WhereNotInBuilder,
	BuilderType.WhereNotInValues,
	BuilderType.WhereNotNull,
	BuilderType.WhereNull,
	BuilderType.WhereJsonExtract,
	BuilderType.WhereJsonContains,
	BuilderType.WhereFullText
]);
const isWherePredicate = (state) => WHERE_PREDICATE_TYPES.has(state.builderType);
/** True when the prior token ends an expression that can be AND-joined to the next. */
const endsWhereExpression = (state) => isWherePredicate(state) || state.builderType === BuilderType.WhereGroupEnd;
/** True when the current token starts an expression that can follow an auto-AND. */
const startsWhereExpression = (state) => isWherePredicate(state) || state.builderType === BuilderType.WhereGroupBegin;
const defaultWhere = (state, config, mode, options) => {
	const sqlHelper = new SqlHelper(mode);
	if (state.whereStates.length === 0) return sqlHelper;
	sqlHelper.addSqlSnippet("WHERE ");
	for (let i = 0; i < state.whereStates.length; i++) {
		const cur = state.whereStates[i];
		const prev = i > 0 ? state.whereStates[i - 1] : void 0;
		const next = i < state.whereStates.length - 1 ? state.whereStates[i + 1] : void 0;
		const spaceAfter = () => {
			if (i < state.whereStates.length - 1 && next?.builderType !== BuilderType.WhereGroupEnd) sqlHelper.addSqlSnippet(" ");
		};
		if (i === 0 && (cur.builderType === BuilderType.And || cur.builderType === BuilderType.Or)) throw new ParserError(ParserArea.Where, "First WHERE operator cannot be AND or OR");
		if (i === state.whereStates.length - 1 && (cur.builderType === BuilderType.And || cur.builderType === BuilderType.Or)) throw new ParserError(ParserArea.Where, "AND or OR cannot be used as the last WHERE operator");
		if ((cur.builderType === BuilderType.And || cur.builderType === BuilderType.Or) && (prev?.builderType === BuilderType.And || prev?.builderType === BuilderType.Or)) throw new ParserError(ParserArea.Where, "AND or OR cannot be used consecutively");
		if ((cur.builderType === BuilderType.And || cur.builderType === BuilderType.Or) && prev?.builderType === BuilderType.WhereGroupBegin) throw new ParserError(ParserArea.Where, "AND or OR cannot be used directly after a group begin");
		if (cur.builderType === BuilderType.WhereGroupBegin && i === state.whereStates.length - 1) throw new ParserError(ParserArea.Where, "Group begin cannot be the last WHERE operator");
		if (cur.builderType === BuilderType.WhereGroupEnd && i === 0) throw new ParserError(ParserArea.Where, "Group end cannot be the first WHERE operator");
		if (cur.builderType === BuilderType.And) {
			sqlHelper.addSqlSnippet("AND");
			if (i < state.whereStates.length - 1) sqlHelper.addSqlSnippet(" ");
			continue;
		}
		if (cur.builderType === BuilderType.Or) {
			sqlHelper.addSqlSnippet("OR");
			spaceAfter();
			continue;
		}
		if (i > 0 && prev && endsWhereExpression(prev) && startsWhereExpression(cur)) sqlHelper.addSqlSnippet("AND ");
		if (cur.builderType === BuilderType.WhereGroupBegin) {
			sqlHelper.addSqlSnippet("(");
			continue;
		}
		if (cur.builderType === BuilderType.WhereGroupEnd) {
			sqlHelper.addSqlSnippet(")");
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.WhereRaw) {
			sqlHelper.addSqlSnippet(cur.raw ?? "");
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.WhereGroupBuilder) {
			if (!cur.subquery || cur.subquery.whereStates.length === 0) throw new ParserError(ParserArea.Where, "WHERE group cannot be empty");
			const subHelper = defaultWhere(cur.subquery, config, mode);
			let inner = subHelper.getSql();
			if (inner.startsWith("WHERE ")) inner = inner.slice(6);
			if (inner.trim() === "") throw new ParserError(ParserArea.Where, "WHERE group cannot be empty");
			sqlHelper.addSqlSnippetWithValues(inner, subHelper.getValues());
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.WhereRowValue) {
			emitRowValueComparison(sqlHelper, config, cur, ParserArea.Where);
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.WhereRowValueIn) {
			emitRowValueIn(sqlHelper, config, cur, ParserArea.Where);
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.Where) {
			emitComparisonPredicate(sqlHelper, config, qualifiedColumn(cur.tableNameOrAlias, cur.columnName, config.identifierDelimiters), cur.whereOperator, cur.values[0], ParserArea.Where);
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.WhereBetween) {
			sqlHelper.addSqlSnippet(qualifiedColumn(cur.tableNameOrAlias, cur.columnName, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(" ");
			sqlHelper.addSqlSnippet("BETWEEN ");
			sqlHelper.addDynamicValue(cur.values[0]);
			sqlHelper.addSqlSnippet(" AND ");
			sqlHelper.addDynamicValue(cur.values[1]);
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.WhereExistsBuilder) {
			sqlHelper.addSqlSnippet("EXISTS (");
			const subHelper = defaultToSql(cur.subquery, config, mode, options);
			sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
			sqlHelper.addSqlSnippet(")");
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.WhereInBuilder) {
			assertPredicateSubqueryRowCap(cur.subquery, config, ParserArea.Where);
			sqlHelper.addSqlSnippet(qualifiedColumn(cur.tableNameOrAlias, cur.columnName, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(" IN (");
			const subHelper = defaultToSql(cur.subquery, config, mode, options);
			sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
			sqlHelper.addSqlSnippet(")");
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.WhereInValues) {
			if (cur.values.length === 0) throw new ParserError(ParserArea.Where, "IN requires at least one value");
			sqlHelper.addSqlSnippet(qualifiedColumn(cur.tableNameOrAlias, cur.columnName, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(" IN (");
			for (let j = 0; j < cur.values.length; j++) {
				sqlHelper.addDynamicValue(cur.values[j]);
				if (j < cur.values.length - 1) sqlHelper.addSqlSnippet(", ");
			}
			sqlHelper.addSqlSnippet(")");
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.WhereNotExistsBuilder) {
			sqlHelper.addSqlSnippet("NOT EXISTS (");
			const subHelper = defaultToSql(cur.subquery, config, mode, options);
			sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
			sqlHelper.addSqlSnippet(")");
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.WhereNotInBuilder) {
			assertPredicateSubqueryRowCap(cur.subquery, config, ParserArea.Where);
			sqlHelper.addSqlSnippet(qualifiedColumn(cur.tableNameOrAlias, cur.columnName, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(" NOT IN (");
			const subHelper = defaultToSql(cur.subquery, config, mode, options);
			sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
			sqlHelper.addSqlSnippet(")");
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.WhereNotInValues) {
			if (cur.values.length === 0) throw new ParserError(ParserArea.Where, "NOT IN requires at least one value");
			sqlHelper.addSqlSnippet(qualifiedColumn(cur.tableNameOrAlias, cur.columnName, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(" NOT IN (");
			for (let j = 0; j < cur.values.length; j++) {
				sqlHelper.addDynamicValue(cur.values[j]);
				if (j < cur.values.length - 1) sqlHelper.addSqlSnippet(", ");
			}
			sqlHelper.addSqlSnippet(")");
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.WhereNotNull) {
			sqlHelper.addSqlSnippet(qualifiedColumn(cur.tableNameOrAlias, cur.columnName, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(" IS NOT NULL");
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.WhereNull) {
			sqlHelper.addSqlSnippet(qualifiedColumn(cur.tableNameOrAlias, cur.columnName, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(" IS NULL");
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.WhereJsonExtract) {
			emitJsonExtractPredicate(sqlHelper, config, mode, cur, ParserArea.Where);
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.WhereJsonContains) {
			emitJsonContainsPredicate(sqlHelper, config, cur, ParserArea.Where);
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.WhereFullText) {
			emitFullTextMatchPredicate(sqlHelper, config, cur.fullTextColumns ?? [], cur.fullTextMode ?? FullTextMode.Natural, cur.values[0], ParserArea.Where);
			spaceAfter();
			continue;
		}
	}
	return sqlHelper;
};
//#endregion
//#region src/parser/default-aggregate.ts
/**
* The five aggregate calls, rendered.
*
* ── WHAT THIS IS, AND THE LINE IT DOES NOT CROSS ──
* A CALL NODE: one function, one operand, an optional DISTINCT. Nothing nests inside it and nothing
* composes with it. SQLEasy models clauses rather than expressions, and that stays true — `CASE`,
* `CAST`, `COALESCE` and a general scalar-function surface remain out. What changed is only that
* `COUNT(x)` turned out to be common enough that reaching it exclusively through `selectRaw` cost
* more than the node does: `HAVING COUNT(*) > 5`, the canonical HAVING, was `havingRaw` only.
*
* ── WHY THERE IS NO DIALECT SPLIT HERE ──
* All five are identical text on all four engines, including DISTINCT inside them. Measured:
*
*     COUNT(*) · COUNT(col) · COUNT(DISTINCT col) · SUM(DISTINCT col) · AVG/MIN/MAX
*       Postgres 17, MySQL 8.4, SQLite 3.51, MSSQL 2022 — all accepted
*     COUNT(DISTINCT *)
*       rejected by all four (SQLite: `near "*": syntax error`)
*
* So this is one of the genuinely shared capabilities, and gets one shared spelling. The
* engine-native-name rule applies where the engines differ, and here they do not.
*/
const SQL_NAME = {
	[AggregateFunction.Count]: "COUNT",
	[AggregateFunction.Sum]: "SUM",
	[AggregateFunction.Avg]: "AVG",
	[AggregateFunction.Min]: "MIN",
	[AggregateFunction.Max]: "MAX"
};
const emitAggregateCall = (sqlHelper, config, call, mode, area) => {
	const { aggregate, tableNameOrAlias, columnName, distinct, filter } = call;
	const isStar = columnName === "*";
	if (isStar && aggregate !== AggregateFunction.Count) throw new ParserError(area, `${SQL_NAME[aggregate]}(*) is not a function any dialect has — only COUNT takes the star. Aggregate a column instead, or use count if you meant "how many rows".`);
	if (isStar && distinct) throw new ParserError(area, "COUNT(DISTINCT *) is rejected by every dialect — `*` is not a value that can be compared for distinctness. Name the column whose distinct values you want to count.");
	if (!isStar && columnName === "") throw new ParserError(area, `${SQL_NAME[aggregate]} requires a column, or '*' for count`);
	sqlHelper.addSqlSnippet(SQL_NAME[aggregate]);
	sqlHelper.addSqlSnippet("(");
	if (distinct) sqlHelper.addSqlSnippet("DISTINCT ");
	sqlHelper.addSqlSnippet(isStar ? "*" : qualifiedColumn(tableNameOrAlias, columnName, config.identifierDelimiters));
	sqlHelper.addSqlSnippet(")");
	if (filter !== void 0) emitAggregateFilter(sqlHelper, config, filter, mode, area);
};
/**
* `FILTER (WHERE …)` on the aggregate just emitted.
*
* Postgres 9.4+ and SQLite 3.30+ only. MySQL and MSSQL have no FILTER clause — and this is where
* the refusal MUST live, not with the engine: measured, `FILTER` is not a reserved word on either,
* so `COUNT(*) FILTER` parses as `COUNT(*) AS FILTER` and the engine then faults on the `(WHERE …)`
* — or worse, on a shape where it does not, silently yields a mis-aliased column. So a bad emission
* is not a syntax error there; it is a wrong answer. Refusing before emitting is the only safe
* option, and the message names conditional aggregation as what those engines use instead (without
* emitting it — this library refuses rather than rewrites).
*
* The predicate is a real WHERE clause, captured on `filter.whereStates`, so it composes with
* everything WHERE composes with. `defaultWhere` emits `WHERE …`; the leading keyword is stripped
* because FILTER supplies its own.
*/
const emitAggregateFilter = (sqlHelper, config, filter, mode, area) => {
	if (config.databaseType === DatabaseType.Mysql || config.databaseType === DatabaseType.Mssql) throw new ParserError(area, `${config.databaseType === DatabaseType.Mysql ? "MySQL" : "MSSQL"} has no FILTER clause on aggregates — and it cannot be emitted safely, because FILTER parses as a column alias there rather than erroring. Use conditional aggregation instead, e.g. COUNT(CASE WHEN <pred> THEN 1 END), which you can build with selectRaw.`);
	if (filter.whereStates.length === 0) throw new ParserError(area, "FILTER requires a WHERE predicate");
	const where = defaultWhere(filter, config, mode);
	let whereSql = where.getSql();
	if (whereSql.startsWith("WHERE ")) whereSql = whereSql.slice(6);
	sqlHelper.addSqlSnippet(" FILTER (WHERE ");
	sqlHelper.addSqlSnippetWithValues(whereSql, where.getValues());
	sqlHelper.addSqlSnippet(")");
};
//#endregion
//#region src/parser/default-having.ts
/**
* HAVING mirrors WHERE's predicate set exactly (BETWEEN, IN, NULL checks, EXISTS, groups) —
* see `default-where.ts`, whose combinator/spacing rules this file follows term for term.
*/
const HAVING_PREDICATE_TYPES = /* @__PURE__ */ new Set([
	BuilderType.Having,
	BuilderType.HavingRaw,
	BuilderType.HavingBetween,
	BuilderType.HavingExistsBuilder,
	BuilderType.HavingInBuilder,
	BuilderType.HavingInValues,
	BuilderType.HavingNotExistsBuilder,
	BuilderType.HavingNotInBuilder,
	BuilderType.HavingNotInValues,
	BuilderType.HavingNotNull,
	BuilderType.HavingNull,
	BuilderType.HavingJsonExtract,
	BuilderType.HavingJsonContains,
	BuilderType.HavingFullText
]);
const isHavingPredicate = (state) => HAVING_PREDICATE_TYPES.has(state.builderType);
/** True when the prior token ends an expression that can be AND-joined to the next. */
const endsHavingExpression = (state) => isHavingPredicate(state) || state.builderType === BuilderType.HavingGroupEnd;
/** True when the current token starts an expression that can follow an auto-AND. */
const startsHavingExpression = (state) => isHavingPredicate(state) || state.builderType === BuilderType.HavingGroupBegin;
const defaultHaving = (state, config, mode, options) => {
	const sqlHelper = new SqlHelper(mode);
	if (state.havingStates.length === 0) return sqlHelper;
	if (state.groupByStates.length === 0) throw new ParserError(ParserArea.Having, "HAVING requires a GROUP BY clause");
	sqlHelper.addSqlSnippet("HAVING ");
	for (let i = 0; i < state.havingStates.length; i++) {
		const cur = state.havingStates[i];
		const prev = i > 0 ? state.havingStates[i - 1] : void 0;
		const next = i < state.havingStates.length - 1 ? state.havingStates[i + 1] : void 0;
		const spaceAfter = () => {
			if (i < state.havingStates.length - 1 && next?.builderType !== BuilderType.HavingGroupEnd) sqlHelper.addSqlSnippet(" ");
		};
		if (i === 0 && (cur.builderType === BuilderType.And || cur.builderType === BuilderType.Or)) throw new ParserError(ParserArea.Having, "First HAVING operator cannot be AND or OR");
		if (i === state.havingStates.length - 1 && (cur.builderType === BuilderType.And || cur.builderType === BuilderType.Or)) throw new ParserError(ParserArea.Having, "AND or OR cannot be used as the last HAVING operator");
		if ((cur.builderType === BuilderType.And || cur.builderType === BuilderType.Or) && (prev?.builderType === BuilderType.And || prev?.builderType === BuilderType.Or)) throw new ParserError(ParserArea.Having, "AND or OR cannot be used consecutively");
		if ((cur.builderType === BuilderType.And || cur.builderType === BuilderType.Or) && prev?.builderType === BuilderType.HavingGroupBegin) throw new ParserError(ParserArea.Having, "AND or OR cannot be used directly after a group begin");
		if (cur.builderType === BuilderType.HavingGroupBegin && i === state.havingStates.length - 1) throw new ParserError(ParserArea.Having, "Group begin cannot be the last HAVING operator");
		if (cur.builderType === BuilderType.HavingGroupEnd && i === 0) throw new ParserError(ParserArea.Having, "Group end cannot be the first HAVING operator");
		if (cur.builderType === BuilderType.And) {
			sqlHelper.addSqlSnippet("AND");
			if (i < state.havingStates.length - 1) sqlHelper.addSqlSnippet(" ");
			continue;
		}
		if (cur.builderType === BuilderType.Or) {
			sqlHelper.addSqlSnippet("OR");
			spaceAfter();
			continue;
		}
		if (i > 0 && prev && endsHavingExpression(prev) && startsHavingExpression(cur)) sqlHelper.addSqlSnippet("AND ");
		if (cur.builderType === BuilderType.HavingGroupBegin) {
			sqlHelper.addSqlSnippet("(");
			continue;
		}
		if (cur.builderType === BuilderType.HavingGroupEnd) {
			sqlHelper.addSqlSnippet(")");
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.HavingRaw) {
			sqlHelper.addSqlSnippet(cur.raw ?? "");
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.HavingGroupBuilder) {
			if (!cur.subquery || cur.subquery.havingStates.length === 0) throw new ParserError(ParserArea.Having, "HAVING group cannot be empty");
			const subHelper = defaultHaving({
				...cur.subquery,
				groupByStates: state.groupByStates
			}, config, mode);
			let inner = subHelper.getSql();
			if (inner.startsWith("HAVING ")) inner = inner.slice(7);
			if (inner.trim() === "") throw new ParserError(ParserArea.Having, "HAVING group cannot be empty");
			sqlHelper.addSqlSnippetWithValues(inner, subHelper.getValues());
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.HavingAggregate) {
			const AGGREGATE_SENTINEL = "___aggregate___";
			const aggScratch = new SqlHelper(mode);
			emitAggregateCall(aggScratch, config, {
				aggregate: cur.aggregate,
				tableNameOrAlias: cur.tableNameOrAlias ?? "",
				columnName: cur.columnName ?? "",
				distinct: cur.aggregateDistinct === true,
				filter: cur.aggregateFilter
			}, mode, ParserArea.Having);
			const cmpScratch = new SqlHelper(mode);
			emitComparisonPredicate(cmpScratch, config, AGGREGATE_SENTINEL, cur.whereOperator, cur.values[0], ParserArea.Having);
			const predicate = cmpScratch.getSql().split(AGGREGATE_SENTINEL).join(aggScratch.getSql());
			if (predicate.includes(AGGREGATE_SENTINEL)) throw new ParserError(ParserArea.Having, "HAVING aggregate failed to resolve its call");
			sqlHelper.addSqlSnippetWithValues(predicate, [...aggScratch.getValues(), ...cmpScratch.getValues()]);
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.Having) {
			emitComparisonPredicate(sqlHelper, config, qualifiedColumn(cur.tableNameOrAlias, cur.columnName, config.identifierDelimiters), cur.whereOperator, cur.values[0], ParserArea.Having);
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.HavingBetween) {
			sqlHelper.addSqlSnippet(qualifiedColumn(cur.tableNameOrAlias, cur.columnName, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(" ");
			sqlHelper.addSqlSnippet("BETWEEN ");
			sqlHelper.addDynamicValue(cur.values[0]);
			sqlHelper.addSqlSnippet(" AND ");
			sqlHelper.addDynamicValue(cur.values[1]);
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.HavingExistsBuilder) {
			sqlHelper.addSqlSnippet("EXISTS (");
			const subHelper = defaultToSql(cur.subquery, config, mode, options);
			sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
			sqlHelper.addSqlSnippet(")");
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.HavingInBuilder) {
			assertPredicateSubqueryRowCap(cur.subquery, config, ParserArea.Having);
			sqlHelper.addSqlSnippet(qualifiedColumn(cur.tableNameOrAlias, cur.columnName, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(" IN (");
			const subHelper = defaultToSql(cur.subquery, config, mode, options);
			sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
			sqlHelper.addSqlSnippet(")");
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.HavingInValues) {
			if (cur.values.length === 0) throw new ParserError(ParserArea.Having, "IN requires at least one value");
			sqlHelper.addSqlSnippet(qualifiedColumn(cur.tableNameOrAlias, cur.columnName, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(" IN (");
			for (let j = 0; j < cur.values.length; j++) {
				sqlHelper.addDynamicValue(cur.values[j]);
				if (j < cur.values.length - 1) sqlHelper.addSqlSnippet(", ");
			}
			sqlHelper.addSqlSnippet(")");
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.HavingNotExistsBuilder) {
			sqlHelper.addSqlSnippet("NOT EXISTS (");
			const subHelper = defaultToSql(cur.subquery, config, mode, options);
			sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
			sqlHelper.addSqlSnippet(")");
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.HavingNotInBuilder) {
			assertPredicateSubqueryRowCap(cur.subquery, config, ParserArea.Having);
			sqlHelper.addSqlSnippet(qualifiedColumn(cur.tableNameOrAlias, cur.columnName, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(" NOT IN (");
			const subHelper = defaultToSql(cur.subquery, config, mode, options);
			sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
			sqlHelper.addSqlSnippet(")");
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.HavingNotInValues) {
			if (cur.values.length === 0) throw new ParserError(ParserArea.Having, "NOT IN requires at least one value");
			sqlHelper.addSqlSnippet(qualifiedColumn(cur.tableNameOrAlias, cur.columnName, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(" NOT IN (");
			for (let j = 0; j < cur.values.length; j++) {
				sqlHelper.addDynamicValue(cur.values[j]);
				if (j < cur.values.length - 1) sqlHelper.addSqlSnippet(", ");
			}
			sqlHelper.addSqlSnippet(")");
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.HavingNotNull) {
			sqlHelper.addSqlSnippet(qualifiedColumn(cur.tableNameOrAlias, cur.columnName, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(" IS NOT NULL");
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.HavingNull) {
			sqlHelper.addSqlSnippet(qualifiedColumn(cur.tableNameOrAlias, cur.columnName, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(" IS NULL");
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.HavingJsonExtract) {
			emitJsonExtractPredicate(sqlHelper, config, mode, cur, ParserArea.Having);
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.HavingJsonContains) {
			emitJsonContainsPredicate(sqlHelper, config, cur, ParserArea.Having);
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.HavingFullText) {
			emitFullTextMatchPredicate(sqlHelper, config, cur.fullTextColumns ?? [], cur.fullTextMode ?? FullTextMode.Natural, cur.values[0], ParserArea.Having);
			spaceAfter();
			continue;
		}
	}
	return sqlHelper;
};
//#endregion
//#region src/parser/default-upsert.ts
/**
* MySQL spells "skip conflicting rows" as an `INSERT IGNORE` prefix, not a trailing clause —
* `defaultInsert` calls this to decide whether to emit `IGNORE` right after `INSERT `.
*/
const isMysqlInsertIgnore = (upsertState, config) => config.databaseType === DatabaseType.Mysql && upsertState !== void 0 && upsertState.action === UpsertAction.DoNothing;
const emitSetList = (sqlHelper, config, upsertState, area) => {
	if (upsertState.updateRaw) {
		sqlHelper.addSqlSnippet(upsertState.updateRaw);
		return;
	}
	if (upsertState.updateColumns.length === 0) throw new ParserError(area, "Upsert DO UPDATE requires at least one SET column");
	for (let i = 0; i < upsertState.updateColumns.length; i++) {
		const column = upsertState.updateColumns[i];
		sqlHelper.addSqlSnippet(quoteIdentifier(column.columnName, config.identifierDelimiters));
		sqlHelper.addSqlSnippet(" = ");
		sqlHelper.addDynamicValue(column.value);
		if (i < upsertState.updateColumns.length - 1) sqlHelper.addSqlSnippet(", ");
	}
};
const emitConflictColumns = (sqlHelper, config, columns) => {
	sqlHelper.addSqlSnippet("(");
	for (let i = 0; i < columns.length; i++) {
		sqlHelper.addSqlSnippet(quoteIdentifier(columns[i], config.identifierDelimiters));
		if (i < columns.length - 1) sqlHelper.addSqlSnippet(", ");
	}
	sqlHelper.addSqlSnippet(")");
};
/**
* Emits the trailing conflict clause after `VALUES (...)`: PG/SQLite `ON CONFLICT ...`, MySQL
* `ON DUPLICATE KEY UPDATE ...` (its `DoNothing` case is instead an `INSERT IGNORE` prefix — see
* {@link isMysqlInsertIgnore} — and emits nothing here). MSSQL upsert is emitted as a `MERGE`
* statement by {@link defaultInsert} instead of calling this function.
*/
const emitUpsertClause = (sqlHelper, config, upsertState, area) => {
	if (config.databaseType === DatabaseType.Mssql) throw new ParserError(area, "MSSQL upsert is emitted as MERGE by defaultInsert — this path should not run");
	if (config.databaseType === DatabaseType.Mysql) {
		if (upsertState.conflictColumns.length > 0) throw new ParserError(area, "MySQL has no conflict target — ON DUPLICATE KEY UPDATE fires on any unique key, so conflict columns cannot be honored; omit them");
		if (upsertState.action === UpsertAction.DoNothing) return;
		sqlHelper.addSqlSnippet(" ON DUPLICATE KEY UPDATE ");
		emitSetList(sqlHelper, config, upsertState, area);
		return;
	}
	sqlHelper.addSqlSnippet(" ON CONFLICT");
	if (upsertState.conflictColumns.length > 0) {
		sqlHelper.addSqlSnippet(" ");
		emitConflictColumns(sqlHelper, config, upsertState.conflictColumns);
	}
	if (upsertState.action === UpsertAction.DoNothing) {
		sqlHelper.addSqlSnippet(" DO NOTHING");
		return;
	}
	if (upsertState.conflictColumns.length === 0) throw new ParserError(area, "ON CONFLICT DO UPDATE requires at least one conflict column");
	sqlHelper.addSqlSnippet(" DO UPDATE SET ");
	emitSetList(sqlHelper, config, upsertState, area);
};
//#endregion
//#region src/parser/default-insert.ts
const defaultInsert = (state, config, mode, options) => {
	const sqlHelper = new SqlHelper(mode);
	if (!state.insertState) throw new ParserError(ParserArea.Insert, "No insert state provided");
	const insertState = state.insertState;
	if (insertState.raw) {
		if (state.upsertState) throw new ParserError(ParserArea.Insert, "insertRaw replaces the whole INSERT statement, so an upsert clause set alongside it cannot reach the SQL. Put the conflict handling in the raw text, or build the insert with insertColumns/insertValues so the upsert has a statement to attach to.");
		if (state.returningState && config.databaseType === DatabaseType.Mssql) throw new ParserError(ParserArea.Insert, "insertRaw replaces the whole INSERT statement, and T-SQL puts OUTPUT inside it — so an OUTPUT clause set alongside a raw insert cannot reach the SQL. Write the OUTPUT into the raw text, or build the insert with insertColumns/insertValues.");
		sqlHelper.addSqlSnippet(insertState.raw);
		return sqlHelper;
	}
	if (state.upsertState && config.databaseType === DatabaseType.Mssql) throw new ParserError(ParserArea.Insert, "MSSQL has no upsert — T-SQL expresses this with MERGE, which is a different statement with different concurrency semantics; write it explicitly");
	if (!insertState.tableName) throw new ParserError(ParserArea.Insert, "INSERT requires a table");
	sqlHelper.addSqlSnippet("INSERT ");
	sqlHelper.addSqlSnippet(mssqlStatementTop(state, config));
	if (isMysqlInsertIgnore(state.upsertState, config)) sqlHelper.addSqlSnippet("IGNORE ");
	sqlHelper.addSqlSnippet("INTO ");
	if (insertState.owner && insertState.owner !== "") {
		if (config.databaseType === DatabaseType.Mysql) throw new ParserError(ParserArea.Insert, "MySQL does not support table owners");
		sqlHelper.addSqlSnippet(quoteIdentifier(insertState.owner, config.identifierDelimiters));
		sqlHelper.addSqlSnippet(".");
	}
	sqlHelper.addSqlSnippet(quoteIdentifier(insertState.tableName, config.identifierDelimiters));
	if (insertState.columns.length > 0) {
		sqlHelper.addSqlSnippet(" (");
		for (let i = 0; i < insertState.columns.length; i++) {
			sqlHelper.addSqlSnippet(quoteIdentifier(insertState.columns[i], config.identifierDelimiters));
			if (i < insertState.columns.length - 1) sqlHelper.addSqlSnippet(", ");
		}
		sqlHelper.addSqlSnippet(")");
	}
	if (state.returningState && config.databaseType === DatabaseType.Mssql) emitMssqlOutputClause(sqlHelper, config, state.returningState, "INSERTED", ParserArea.Insert);
	if (insertState.selectSubquery) {
		if (insertState.values.length > 0) throw new ParserError(ParserArea.Insert, "INSERT cannot combine a SELECT source with VALUES rows");
		sqlHelper.addSqlSnippet(" ");
		const subHelper = defaultToSql(insertState.selectSubquery, config, mode, options);
		sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
		if (state.upsertState) emitUpsertClause(sqlHelper, config, state.upsertState, ParserArea.Insert);
		return sqlHelper;
	}
	if (insertState.values.length === 0) throw new ParserError(ParserArea.Insert, "INSERT requires at least one VALUES row");
	const columnCount = insertState.columns.length;
	sqlHelper.addSqlSnippet(" VALUES ");
	for (let r = 0; r < insertState.values.length; r++) {
		sqlHelper.addSqlSnippet("(");
		const row = insertState.values[r];
		if (columnCount > 0 && row.length !== columnCount) throw new ParserError(ParserArea.Insert, `INSERT column count (${columnCount}) does not match value count (${row.length}) for row ${r + 1}`);
		for (let c = 0; c < row.length; c++) {
			sqlHelper.addDynamicValue(row[c]);
			if (c < row.length - 1) sqlHelper.addSqlSnippet(", ");
		}
		sqlHelper.addSqlSnippet(")");
		if (r < insertState.values.length - 1) sqlHelper.addSqlSnippet(", ");
	}
	if (state.upsertState) emitUpsertClause(sqlHelper, config, state.upsertState, ParserArea.Insert);
	return sqlHelper;
};
//#endregion
//#region src/parser/default-merge.ts
const qi = (name, config) => quoteIdentifier(name, config.identifierDelimiters);
/** `alias.column`, both quoted. */
const columnRef = (config, alias, column) => qi(alias, config) + "." + qi(column, config);
const usingAlias = (state) => state.using ? state.using.alias : "source";
/** Emit one MERGE RHS expression — a source/target column, a bound literal, or raw SQL. */
const emitExpr = (sqlHelper, config, state, expr) => {
	switch (expr.kind) {
		case "source":
			sqlHelper.addSqlSnippet(columnRef(config, usingAlias(state), expr.columnName));
			return;
		case "target":
			sqlHelper.addSqlSnippet(columnRef(config, state.targetAlias, expr.columnName));
			return;
		case "value":
			sqlHelper.addDynamicValue(expr.value);
			return;
		case "raw":
			sqlHelper.addSqlSnippet(expr.sql);
			return;
	}
};
/** `AND <condition>` guard on a WHEN clause, via the shared join-on predicate machinery. */
const emitAnd = (sqlHelper, config, when) => {
	if (!when.and || when.and.length === 0) return;
	sqlHelper.addSqlSnippet(" AND ");
	renderJoinOnConditions(sqlHelper, config, when.and);
};
const emitAction = (sqlHelper, config, state, action) => {
	switch (action.kind) {
		case "delete":
			sqlHelper.addSqlSnippet("DELETE");
			return;
		case "update":
			sqlHelper.addSqlSnippet("UPDATE SET ");
			if (action.raw !== void 0) {
				sqlHelper.addSqlSnippet(action.raw);
				return;
			}
			if (action.assignments.length === 0) throw new ParserError(ParserArea.Merge, "MERGE UPDATE requires at least one SET assignment");
			action.assignments.forEach((assignment, i) => {
				sqlHelper.addSqlSnippet(qi(assignment.columnName, config));
				sqlHelper.addSqlSnippet(" = ");
				emitExpr(sqlHelper, config, state, assignment.value);
				if (i < action.assignments.length - 1) sqlHelper.addSqlSnippet(", ");
			});
			return;
		case "insert":
			if (action.columns.length !== action.values.length) throw new ParserError(ParserArea.Merge, "MERGE INSERT column count must equal the VALUES count");
			sqlHelper.addSqlSnippet("INSERT (");
			action.columns.forEach((column, i) => {
				sqlHelper.addSqlSnippet(qi(column, config));
				if (i < action.columns.length - 1) sqlHelper.addSqlSnippet(", ");
			});
			sqlHelper.addSqlSnippet(") VALUES (");
			action.values.forEach((expr, i) => {
				emitExpr(sqlHelper, config, state, expr);
				if (i < action.values.length - 1) sqlHelper.addSqlSnippet(", ");
			});
			sqlHelper.addSqlSnippet(")");
			return;
		case "insertDefaultValues":
			sqlHelper.addSqlSnippet("INSERT DEFAULT VALUES");
			return;
	}
};
const whenKeyword = (match) => {
	switch (match) {
		case "matched": return "WHEN MATCHED";
		case "notMatchedByTarget": return "WHEN NOT MATCHED BY TARGET";
		case "notMatchedBySource": return "WHEN NOT MATCHED BY SOURCE";
	}
};
const emitUsing = (sqlHelper, config, mode, using, options) => {
	sqlHelper.addSqlSnippet("USING ");
	switch (using.kind) {
		case "values":
			if (using.rows.length === 0) throw new ParserError(ParserArea.Merge, "MERGE USING (VALUES …) requires at least one row");
			sqlHelper.addSqlSnippet("(VALUES ");
			using.rows.forEach((row, r) => {
				if (row.length !== using.columns.length) throw new ParserError(ParserArea.Merge, "MERGE USING VALUES row width must equal the column count");
				sqlHelper.addSqlSnippet("(");
				row.forEach((cell, c) => {
					sqlHelper.addDynamicValue(cell);
					if (c < row.length - 1) sqlHelper.addSqlSnippet(", ");
				});
				sqlHelper.addSqlSnippet(")");
				if (r < using.rows.length - 1) sqlHelper.addSqlSnippet(", ");
			});
			sqlHelper.addSqlSnippet(") AS ");
			sqlHelper.addSqlSnippet(qi(using.alias, config));
			sqlHelper.addSqlSnippet(" (");
			using.columns.forEach((column, i) => {
				sqlHelper.addSqlSnippet(qi(column, config));
				if (i < using.columns.length - 1) sqlHelper.addSqlSnippet(", ");
			});
			sqlHelper.addSqlSnippet(")");
			return;
		case "table":
			if (using.owner !== void 0 && using.owner !== "") {
				sqlHelper.addSqlSnippet(qi(using.owner, config));
				sqlHelper.addSqlSnippet(".");
			}
			sqlHelper.addSqlSnippet(qi(using.table, config));
			sqlHelper.addSqlSnippet(" AS ");
			sqlHelper.addSqlSnippet(qi(using.alias, config));
			return;
		case "select": {
			const sub = defaultToSql(using.subquery, config, mode, options);
			sqlHelper.addSqlSnippetWithValues("(" + sub.getSql() + ")", sub.getValues());
			sqlHelper.addSqlSnippet(" AS ");
			sqlHelper.addSqlSnippet(qi(using.alias, config));
			return;
		}
		case "raw":
			sqlHelper.addSqlSnippet(using.sql);
			sqlHelper.addSqlSnippet(" AS ");
			sqlHelper.addSqlSnippet(qi(using.alias, config));
			return;
	}
};
const unconditionalCount = (whens, match) => whens.filter((w) => w.match === match && (!w.and || w.and.length === 0)).length;
/**
* Validates the WHEN-clause cardinality T-SQL enforces, so a MERGE SQL Server would reject at
* runtime (Msg 10714/10715) never leaves the builder — the same "don't emit unrunnable SQL" rule
* the rest of the surface holds to.
*/
const validateWhenCardinality = (state) => {
	const whens = state.whenStates;
	if (whens.length === 0) throw new ParserError(ParserArea.Merge, "MERGE requires at least one WHEN clause");
	const matched = whens.filter((w) => w.match === "matched");
	if (matched.length > 2) throw new ParserError(ParserArea.Merge, "MERGE allows at most two WHEN MATCHED clauses (one UPDATE and one DELETE)");
	if (matched.length === 2) {
		const kinds = new Set(matched.map((w) => w.action.kind));
		if (!(kinds.has("update") && kinds.has("delete"))) throw new ParserError(ParserArea.Merge, "two WHEN MATCHED clauses must be one UPDATE and one DELETE, not two of the same");
		if (!matched[0].and || matched[0].and.length === 0) throw new ParserError(ParserArea.Merge, "with two WHEN MATCHED clauses the first must carry an AND condition");
	}
	if (unconditionalCount(whens, "matched") > 1) throw new ParserError(ParserArea.Merge, "MERGE allows at most one unconditional WHEN MATCHED");
	if (unconditionalCount(whens, "notMatchedByTarget") > 1) throw new ParserError(ParserArea.Merge, "MERGE allows at most one unconditional WHEN NOT MATCHED BY TARGET");
};
/**
* Renders a T-SQL `MERGE` statement from {@link MergeState}. Native T-SQL only — every other
* dialect is refused, because MERGE exists nowhere else and the builder does not approximate it.
* This replaced the parked upsert-shaped emitter, which structurally could not carry a USING
* alias, an arbitrary ON, WHEN NOT MATCHED BY SOURCE, DELETE arms, or multiple WHENs.
*/
const defaultMerge = (state, config, mode, options) => {
	const sqlHelper = new SqlHelper(mode);
	if (config.databaseType !== DatabaseType.Mssql) throw new ParserError(ParserArea.Merge, `${dialectDisplayName(config.databaseType)} has no MERGE statement — it is native T-SQL only`);
	const merge = state.mergeState;
	if (!merge || !merge.targetTable) throw new ParserError(ParserArea.Merge, "MERGE requires a target table — call into(...)");
	if (!merge.using) throw new ParserError(ParserArea.Merge, "MERGE requires a USING source");
	if (merge.onStates.length === 0) throw new ParserError(ParserArea.Merge, "MERGE requires an ON condition");
	validateWhenCardinality(merge);
	sqlHelper.addSqlSnippet("MERGE ");
	sqlHelper.addSqlSnippet(mssqlStatementTop(state, config));
	sqlHelper.addSqlSnippet("INTO ");
	sqlHelper.addSqlSnippet(qi(merge.targetOwner !== void 0 && merge.targetOwner !== "" ? merge.targetOwner : config.defaultOwner, config));
	sqlHelper.addSqlSnippet(".");
	sqlHelper.addSqlSnippet(qi(merge.targetTable, config));
	if (merge.holdlock === true) sqlHelper.addSqlSnippet(" WITH (HOLDLOCK)");
	sqlHelper.addSqlSnippet(" AS ");
	sqlHelper.addSqlSnippet(qi(merge.targetAlias, config));
	sqlHelper.addSqlSnippet(" ");
	emitUsing(sqlHelper, config, mode, merge.using, options);
	sqlHelper.addSqlSnippet(" ON ");
	renderJoinOnConditions(sqlHelper, config, merge.onStates);
	for (const when of merge.whenStates) {
		sqlHelper.addSqlSnippet(" ");
		sqlHelper.addSqlSnippet(whenKeyword(when.match));
		emitAnd(sqlHelper, config, when);
		sqlHelper.addSqlSnippet(" THEN ");
		emitAction(sqlHelper, config, merge, when.action);
	}
	if (merge.outputRaw !== void 0) {
		sqlHelper.addSqlSnippet(" OUTPUT ");
		sqlHelper.addSqlSnippet(merge.outputRaw);
	}
	sqlHelper.addSqlSnippet(";");
	return sqlHelper;
};
//#endregion
//#region src/enums/frame-bound-type.ts
/**
* One endpoint of a window function's frame clause (`ROWS`/`RANGE BETWEEN ... AND ...`).
*/
const FrameBoundType = {
	/** `UNBOUNDED PRECEDING` — the frame's start, extending to the first row of the partition. */
	UnboundedPreceding: "UnboundedPreceding",
	/** `N PRECEDING` — offset rows/range before the current row; see the bound's `offset`. */
	Preceding: "Preceding",
	/** `CURRENT ROW`. */
	CurrentRow: "CurrentRow",
	/** `N FOLLOWING` — offset rows/range after the current row; see the bound's `offset`. */
	Following: "Following",
	/** `UNBOUNDED FOLLOWING` — the frame's end, extending to the last row of the partition. */
	UnboundedFollowing: "UnboundedFollowing"
};
//#endregion
//#region src/enums/frame-unit.ts
/**
* The unit a window function's frame clause counts in — physical rows, or logical value range.
*/
const FrameUnit = {
	/** `ROWS` — counts physical rows relative to the current row. */
	Rows: "Rows",
	/** `RANGE` — counts by logical value distance (or, with unbounded/current-row bounds, groups of peers). */
	Range: "Range"
};
//#endregion
//#region src/parser/default-window.ts
const emitFrameBound = (sqlHelper, bound) => {
	switch (bound.type) {
		case FrameBoundType.UnboundedPreceding:
			sqlHelper.addSqlSnippet("UNBOUNDED PRECEDING");
			break;
		case FrameBoundType.Preceding:
			sqlHelper.addSqlSnippet(`${bound.offset ?? 0} PRECEDING`);
			break;
		case FrameBoundType.CurrentRow:
			sqlHelper.addSqlSnippet("CURRENT ROW");
			break;
		case FrameBoundType.Following:
			sqlHelper.addSqlSnippet(`${bound.offset ?? 0} FOLLOWING`);
			break;
		case FrameBoundType.UnboundedFollowing:
			sqlHelper.addSqlSnippet("UNBOUNDED FOLLOWING");
			break;
	}
};
/**
* True when a frame bound carries a numeric offset (`n PRECEDING` / `n FOLLOWING`) rather than one
* of the unbounded/current-row keywords.
*/
const hasNumericOffset = (bound) => bound?.type === FrameBoundType.Preceding || bound?.type === FrameBoundType.Following;
/**
* Renders a window's `OVER (...)` clause: `PARTITION BY`, `ORDER BY` (with `NULLS FIRST`/`LAST`
* — see {@link emitOrderByTerm}), and an optional `ROWS`/`RANGE` frame.
*
* Nearly identical across the four dialects, with one real exception: T-SQL's `RANGE` accepts only
* `UNBOUNDED PRECEDING`, `CURRENT ROW` and `UNBOUNDED FOLLOWING`. A numeric offset is valid on
* `ROWS` but not on `RANGE`, and `RANGE 5 PRECEDING` is a syntax error on every SQL Server version.
* Postgres, MySQL 8.0+ and SQLite 3.28+ all accept it.
*/
const defaultWindow = (windowState, config, mode) => {
	const sqlHelper = new SqlHelper(mode);
	sqlHelper.addSqlSnippet("OVER (");
	let needsSpace = false;
	if (windowState.partitionByStates.length > 0) {
		sqlHelper.addSqlSnippet("PARTITION BY ");
		windowState.partitionByStates.forEach((partition, i) => {
			if (partition.raw !== void 0) sqlHelper.addSqlSnippet(partition.raw);
			else sqlHelper.addSqlSnippet(qualifiedColumn(partition.tableNameOrAlias, partition.columnName, config.identifierDelimiters));
			if (i < windowState.partitionByStates.length - 1) sqlHelper.addSqlSnippet(", ");
		});
		needsSpace = true;
	}
	if (windowState.orderByStates.length > 0) {
		if (needsSpace) sqlHelper.addSqlSnippet(" ");
		sqlHelper.addSqlSnippet("ORDER BY ");
		windowState.orderByStates.forEach((orderBy, i) => {
			if (orderBy.raw !== void 0) sqlHelper.addSqlSnippet(orderBy.raw);
			else emitOrderByTerm(sqlHelper, config, orderBy.tableNameOrAlias, orderBy.columnName, orderBy.direction, orderBy.nulls);
			if (i < windowState.orderByStates.length - 1) sqlHelper.addSqlSnippet(", ");
		});
		needsSpace = true;
	}
	if (windowState.frame) {
		if (needsSpace) sqlHelper.addSqlSnippet(" ");
		if (windowState.frame.raw !== void 0) sqlHelper.addSqlSnippet(windowState.frame.raw);
		else {
			if (config.databaseType === DatabaseType.Mssql && windowState.frame.unit === FrameUnit.Range && (hasNumericOffset(windowState.frame.start) || hasNumericOffset(windowState.frame.end))) throw new ParserError(ParserArea.Select, "MSSQL RANGE frames accept only UNBOUNDED PRECEDING, CURRENT ROW and UNBOUNDED FOLLOWING — use a ROWS frame for a numeric offset");
			sqlHelper.addSqlSnippet(windowState.frame.unit === FrameUnit.Rows ? "ROWS " : "RANGE ");
			if (windowState.frame.end) {
				sqlHelper.addSqlSnippet("BETWEEN ");
				emitFrameBound(sqlHelper, windowState.frame.start);
				sqlHelper.addSqlSnippet(" AND ");
				emitFrameBound(sqlHelper, windowState.frame.end);
			} else emitFrameBound(sqlHelper, windowState.frame.start);
		}
	}
	sqlHelper.addSqlSnippet(")");
	return sqlHelper;
};
//#endregion
//#region src/parser/default-json-agg.ts
const FN = {
	[DatabaseType.Postgres]: {
		array: "json_agg",
		object: "json_object_agg"
	},
	[DatabaseType.Mysql]: {
		array: "JSON_ARRAYAGG",
		object: "JSON_OBJECTAGG"
	},
	[DatabaseType.Sqlite]: {
		array: "json_group_array",
		object: "json_group_object"
	}
};
const emitJsonAggregation = (sqlHelper, config, valueExpr, state, area) => {
	const db = config.databaseType;
	const names = FN[db];
	if (names === void 0) throw new ParserError(area, "MSSQL has no JSON aggregate function — JSON_ARRAYAGG is Azure SQL / SQL Server 2025 only, and 2022 does not have it. FOR JSON PATH shapes the whole result set into one document, which is a different thing, so this library does not substitute it. Build the document yourself with a FOR JSON subquery via selectRaw if you need it on SQL Server 2022.");
	const value = qualifiedColumn(valueExpr.tableNameOrAlias, valueExpr.columnName, config.identifierDelimiters);
	if (db === DatabaseType.Mysql) {
		if (state.distinct) throw new ParserError(area, "MySQL JSON aggregation has no DISTINCT — de-duplicate in a subquery first, or aggregate on Postgres/SQLite which support it.");
		if (state.orderBy.length > 0) throw new ParserError(area, "MySQL JSON aggregation has no inner ORDER BY — element order is unspecified. Order the rows in a subquery, or aggregate on Postgres/SQLite which support the inner ORDER BY.");
	}
	if (state.jsonb && db !== DatabaseType.Postgres) throw new ParserError(area, "Only Postgres has a jsonb aggregate — jsonb is a Postgres storage type. Drop the jsonb option on this dialect; its json aggregate returns the same shape.");
	const fnName = state.jsonb ? state.shape === "array" ? "jsonb_agg" : "jsonb_object_agg" : state.shape === "array" ? names.array : names.object;
	sqlHelper.addSqlSnippet(fnName);
	sqlHelper.addSqlSnippet("(");
	if (state.distinct) sqlHelper.addSqlSnippet("DISTINCT ");
	if (state.shape === "object") {
		sqlHelper.addSqlSnippet(qualifiedColumn(state.keyTableNameOrAlias ?? "", state.keyColumnName ?? "", config.identifierDelimiters));
		sqlHelper.addSqlSnippet(", ");
	}
	sqlHelper.addSqlSnippet(value);
	if (state.orderBy.length > 0) {
		sqlHelper.addSqlSnippet(" ORDER BY ");
		state.orderBy.forEach((key, i) => {
			emitOrderByTerm(sqlHelper, config, key.tableNameOrAlias, key.columnName, key.direction, NullsOrder.None);
			if (i < state.orderBy.length - 1) sqlHelper.addSqlSnippet(", ");
		});
	}
	sqlHelper.addSqlSnippet(")");
};
//#endregion
//#region src/parser/default-string-agg.ts
const emitOrderKeys = (sqlHelper, config, keys) => {
	keys.forEach((key, i) => {
		emitOrderByTerm(sqlHelper, config, key.tableNameOrAlias, key.columnName, key.direction, NullsOrder.None);
		if (i < keys.length - 1) sqlHelper.addSqlSnippet(", ");
	});
};
const emitStringAggregation = (sqlHelper, config, expr, state, area) => {
	const column = qualifiedColumn(expr.tableNameOrAlias, expr.columnName, config.identifierDelimiters);
	const db = config.databaseType;
	if (state.functionName === "string_agg") {
		if (db === DatabaseType.Mysql) throw new ParserError(area, "MySQL has no string_agg — use groupConcat, its engine-native name");
		if (!state.hasSeparator) throw new ParserError(area, `${db === DatabaseType.Mssql ? "MSSQL" : "Postgres"} string_agg requires a separator — there is no one-argument form. Pass the separator you want between values.`);
		if (db === DatabaseType.Mssql) {
			if (state.distinct) throw new ParserError(area, "MSSQL STRING_AGG has no DISTINCT — it is the only engine of the four without it here. De-duplicate in a subquery first, or use a different engine for this query.");
			sqlHelper.addSqlSnippet("STRING_AGG(");
			sqlHelper.addSqlSnippet(column);
			sqlHelper.addSqlSnippet(", ");
			sqlHelper.addDynamicValue(state.separator);
			sqlHelper.addSqlSnippet(")");
			if (state.orderBy.length > 0) {
				sqlHelper.addSqlSnippet(" WITHIN GROUP (ORDER BY ");
				emitOrderKeys(sqlHelper, config, state.orderBy);
				sqlHelper.addSqlSnippet(")");
			}
			return;
		}
		sqlHelper.addSqlSnippet("string_agg(");
		if (state.distinct) sqlHelper.addSqlSnippet("DISTINCT ");
		sqlHelper.addSqlSnippet(column);
		sqlHelper.addSqlSnippet(", ");
		sqlHelper.addDynamicValue(state.separator);
		if (state.orderBy.length > 0) {
			if (db === DatabaseType.Postgres && state.distinct) {
				if (state.orderBy.find((k) => k.tableNameOrAlias !== expr.tableNameOrAlias || k.columnName !== expr.columnName) !== void 0 || state.orderBy.length > 1) throw new ParserError(area, "Postgres string_agg(DISTINCT …) can only ORDER BY the aggregated expression itself — a different sort key is rejected by the engine. Drop DISTINCT, or sort by the same column.");
			}
			sqlHelper.addSqlSnippet(" ORDER BY ");
			emitOrderKeys(sqlHelper, config, state.orderBy);
		}
		sqlHelper.addSqlSnippet(")");
		return;
	}
	if (db === DatabaseType.Postgres || db === DatabaseType.Mssql) throw new ParserError(area, `${db === DatabaseType.Postgres ? "Postgres" : "MSSQL"} has no GROUP_CONCAT — use stringAgg, its engine-native name.`);
	if (db === DatabaseType.Mysql) {
		sqlHelper.addSqlSnippet("GROUP_CONCAT(");
		if (state.distinct) sqlHelper.addSqlSnippet("DISTINCT ");
		sqlHelper.addSqlSnippet(column);
		if (state.orderBy.length > 0) {
			sqlHelper.addSqlSnippet(" ORDER BY ");
			emitOrderKeys(sqlHelper, config, state.orderBy);
		}
		if (state.hasSeparator) {
			sqlHelper.addSqlSnippet(" SEPARATOR ");
			sqlHelper.addDynamicValue(state.separator);
		}
		sqlHelper.addSqlSnippet(")");
		return;
	}
	if (state.distinct && state.hasSeparator) throw new ParserError(area, "SQLite group_concat(DISTINCT …) takes only one argument, so it cannot carry a custom separator — the result uses the default ','. Drop the separator, or drop DISTINCT.");
	sqlHelper.addSqlSnippet("group_concat(");
	if (state.distinct) sqlHelper.addSqlSnippet("DISTINCT ");
	sqlHelper.addSqlSnippet(column);
	if (state.hasSeparator) {
		sqlHelper.addSqlSnippet(", ");
		sqlHelper.addDynamicValue(state.separator);
	}
	if (state.orderBy.length > 0) {
		sqlHelper.addSqlSnippet(" ORDER BY ");
		emitOrderKeys(sqlHelper, config, state.orderBy);
	}
	sqlHelper.addSqlSnippet(")");
};
//#endregion
//#region src/parser/default-select.ts
const defaultSelect = (state, config, mode, options) => {
	const sqlHelper = new SqlHelper(mode);
	if (state.selectStates.length === 0) throw new ParserError(ParserArea.Select, "Select statement must have at least one select state");
	sqlHelper.addSqlSnippet("SELECT ");
	if (state.distinctOnColumns && state.distinctOnColumns.length > 0) {
		if (config.databaseType !== DatabaseType.Postgres) throw new ParserError(ParserArea.Select, "DISTINCT ON is only supported on Postgres");
		if (state.distinct) throw new ParserError(ParserArea.Select, "Cannot combine distinct() with distinctOn()");
		sqlHelper.addSqlSnippet("DISTINCT ON (");
		state.distinctOnColumns.forEach((column, i) => {
			sqlHelper.addSqlSnippet(qualifiedColumn(column.tableNameOrAlias, column.columnName, config.identifierDelimiters));
			if (i < state.distinctOnColumns.length - 1) sqlHelper.addSqlSnippet(", ");
		});
		sqlHelper.addSqlSnippet(") ");
	} else if (state.distinct) sqlHelper.addSqlSnippet("DISTINCT ");
	if (options?.beforeSelectColumns) options.beforeSelectColumns(state, config, sqlHelper);
	for (let i = 0; i < state.selectStates.length; i++) {
		const selectState = state.selectStates[i];
		if (selectState.builderType === BuilderType.SelectAll) {
			sqlHelper.addSqlSnippet("*");
			if (i < state.selectStates.length - 1) sqlHelper.addSqlSnippet(", ");
		}
		if (selectState.builderType === BuilderType.SelectRaw) {
			sqlHelper.addSqlSnippet(selectState.raw ?? "");
			if (i < state.selectStates.length - 1) sqlHelper.addSqlSnippet(", ");
			continue;
		}
		if (selectState.builderType === BuilderType.SelectColumn) {
			sqlHelper.addSqlSnippet(qualifiedColumn(selectState.tableNameOrAlias, selectState.columnName, config.identifierDelimiters));
			if (selectState.alias !== "") {
				sqlHelper.addSqlSnippet(" AS ");
				sqlHelper.addSqlSnippet(quoteIdentifier(selectState.alias, config.identifierDelimiters));
			}
			if (i < state.selectStates.length - 1) sqlHelper.addSqlSnippet(", ");
			continue;
		}
		if (selectState.builderType === BuilderType.SelectWindow) {
			sqlHelper.addSqlSnippet(selectState.raw ?? "");
			sqlHelper.addSqlSnippet(" ");
			const windowHelper = defaultWindow(selectState.window ?? {
				partitionByStates: [],
				orderByStates: [],
				frame: void 0
			}, config, mode);
			sqlHelper.addSqlSnippetWithValues(windowHelper.getSql(), windowHelper.getValues());
			if (selectState.alias !== "") {
				sqlHelper.addSqlSnippet(" AS ");
				sqlHelper.addSqlSnippet(quoteIdentifier(selectState.alias, config.identifierDelimiters));
			}
			if (i < state.selectStates.length - 1) sqlHelper.addSqlSnippet(", ");
			continue;
		}
		if (selectState.builderType === BuilderType.SelectBuilder) {
			const subHelper = defaultToSql(selectState.subquery, config, mode, options);
			sqlHelper.addSqlSnippetWithValues(`(${subHelper.getSql()})`, subHelper.getValues());
			if (selectState.alias !== "") {
				sqlHelper.addSqlSnippet(" AS ");
				sqlHelper.addSqlSnippet(quoteIdentifier(selectState.alias, config.identifierDelimiters));
			}
			if (i < state.selectStates.length - 1) sqlHelper.addSqlSnippet(", ");
			continue;
		}
		if (selectState.builderType === BuilderType.SelectJsonAgg) {
			emitJsonAggregation(sqlHelper, config, {
				tableNameOrAlias: selectState.tableNameOrAlias ?? "",
				columnName: selectState.columnName ?? ""
			}, selectState.jsonAgg, ParserArea.Select);
			if (selectState.alias !== "") {
				sqlHelper.addSqlSnippet(" AS ");
				sqlHelper.addSqlSnippet(quoteIdentifier(selectState.alias, config.identifierDelimiters));
			}
			if (i < state.selectStates.length - 1) sqlHelper.addSqlSnippet(", ");
			continue;
		}
		if (selectState.builderType === BuilderType.SelectStringAgg) {
			emitStringAggregation(sqlHelper, config, {
				tableNameOrAlias: selectState.tableNameOrAlias ?? "",
				columnName: selectState.columnName ?? ""
			}, selectState.stringAgg, ParserArea.Select);
			if (selectState.alias !== "") {
				sqlHelper.addSqlSnippet(" AS ");
				sqlHelper.addSqlSnippet(quoteIdentifier(selectState.alias, config.identifierDelimiters));
			}
			if (i < state.selectStates.length - 1) sqlHelper.addSqlSnippet(", ");
			continue;
		}
		if (selectState.builderType === BuilderType.SelectAggregate) {
			emitAggregateCall(sqlHelper, config, {
				aggregate: selectState.aggregate,
				tableNameOrAlias: selectState.tableNameOrAlias ?? "",
				columnName: selectState.columnName ?? "",
				distinct: selectState.aggregateDistinct === true,
				filter: selectState.aggregateFilter
			}, mode, ParserArea.Select);
			if (selectState.alias !== "") {
				sqlHelper.addSqlSnippet(" AS ");
				sqlHelper.addSqlSnippet(quoteIdentifier(selectState.alias, config.identifierDelimiters));
			}
			if (i < state.selectStates.length - 1) sqlHelper.addSqlSnippet(", ");
			continue;
		}
		if (selectState.builderType === BuilderType.SelectJsonExtract) {
			emitJsonExtractExpression(sqlHelper, config, selectState.tableNameOrAlias ?? "", selectState.columnName ?? "", selectState.jsonPath ?? "", selectState.jsonExtractMode ?? JsonExtractMode.Text, ParserArea.Select);
			if (selectState.alias !== "") {
				sqlHelper.addSqlSnippet(" AS ");
				sqlHelper.addSqlSnippet(quoteIdentifier(selectState.alias, config.identifierDelimiters));
			}
			if (i < state.selectStates.length - 1) sqlHelper.addSqlSnippet(", ");
			continue;
		}
	}
	return sqlHelper;
};
//#endregion
//#region src/parser/default-union.ts
/**
* A branch's own paging clauses — the ones that need parentheses AND that some engines forbid
* inside an operand.
*/
const branchPages = (branch) => branch.orderByStates.length > 0 || branch.limit > 0 || branch.offset !== void 0;
/**
* A branch that needs parentheses to sit in the operand slot at all — either it is ITSELF a set
* operation (the caller expressed a grouped operand), or it declares its own CTE.
*
* `A UNION ALL (B UNION C)` is not `A UNION ALL B UNION C`. Every engine reads the flat form as
* `(A UNION ALL B) UNION C`, so the outer UNION ALL's duplicates get deduplicated by an inner UNION
* that was never meant to see them. Measured on customers {1,2,3} with A=id<=2, B=id>=2, C=id=3:
* the grouped form returns 4 rows (1,2,3,2) and the flat form 3. No error either way.
*
* A branch that declares a CTE is the same shape of problem: `UNION ALL WITH c AS (…) SELECT …` is
* a syntax error on EVERY engine, while the parenthesized `UNION ALL (WITH c AS (…) SELECT …)` is
* accepted by Postgres and MySQL. Measured, with a working baseline on each:
*
*                                          PG   MySQL  SQLite  MSSQL
*     UNION ALL WITH c AS (…) SELECT …     ERR   ERR    ERR     ERR
*     UNION ALL (WITH c AS (…) SELECT …)   OK    OK     ERR     ERR
*
* This is a scoping need with a DIFFERENT dialect profile from {@link branchPages}: it wants only
* the parentheses, and three of four engines are happy to give them.
*/
const branchGroups = (branch) => branch.unionStates.length > 0 || branch.cteStates.length > 0;
/**
* Does this set-operation BRANCH need parentheses to mean what the caller wrote?
*
* Everything else a branch can carry — `DISTINCT`, MSSQL's `TOP (n)`, the whole WHERE/GROUP BY/
* HAVING stack — is already lexically bound to its own SELECT and needs no help. (Verified:
* `UNION ALL SELECT TOP (3) * FROM b` caps the OPERAND on MSSQL, returning 3 rows from it rather
* than 3 from the union.)
*/
const branchIsScoped = (branch) => branchPages(branch) || branchGroups(branch);
/**
* Refuses a scoping clause on a branch the dialect cannot scope, and reports whether the operand
* must be wrapped in parentheses to mean what the caller wrote.
*
* ── THE BUG THIS EXISTS TO FIX (found 2026-07-22) ──
* A branch's `ORDER BY` / `LIMIT` was emitted in the right textual place but with NO parentheses,
* so it bound to the whole compound instead of the operand it was written on:
*
*     .unionAll(u => u.fromTable('b','').selectAll().limit(3))
*     ->  SELECT * FROM "a" UNION ALL SELECT * FROM "b" LIMIT 3
*
* That caps the UNION, not the branch. The statement runs and returns the wrong rows — no error,
* nothing to notice. Adding an outer `.limit(99)` made it worse still: `LIMIT 3 LIMIT 99`, which
* Postgres, MySQL and SQLite all reject as a syntax error.
*
* ── WHAT EACH ENGINE ACTUALLY DOES (measured against the harness, 2026-07-22) ──
*
*     Postgres 17   … UNION ALL (SELECT … ORDER BY id LIMIT 3)   accepted
*     MySQL 8.4     … UNION ALL (SELECT … ORDER BY id LIMIT 3)   accepted
*     MSSQL 2022    … UNION ALL (SELECT id FROM t)               accepted — parens are FINE
*                   … UNION ALL (SELECT TOP (2) id FROM t)       accepted
*                   … UNION ALL (SELECT … ORDER BY id)           Msg 156
*                   … UNION ALL (SELECT … OFFSET 0 ROWS FETCH …) Msg 156
*                   SELECT TOP (3) … UNION ALL SELECT …          accepted — the operand IS capped
*     SQLite 3.51   … UNION ALL (SELECT id FROM t)               near "(": syntax error
*                   SELECT … LIMIT 3 UNION ALL SELECT …          "LIMIT clause should come after
*                                                                 UNION ALL not before"
*
* The two engines fail for DIFFERENT reasons, and an earlier version of this comment got MSSQL
* wrong — it claimed T-SQL rejects a parenthesized operand, which is false and was measured false.
* The first probe used `(SELECT TOP (3) … ORDER BY id)`, so the Msg 156 it produced was about the
* ORDER BY, not the parentheses; testing the parentheses on their own accepts. SQLite is the only
* one that rejects the parentheses themselves.
*
* ── THE REFUSALS SPLIT BY REASON, NOT BY DIALECT ──
* The two failing engines fail at different points, so a blanket per-dialect refusal is wrong:
*
*   SQLite  cannot parenthesize an operand AT ALL, so it refuses every scoping need — a grouped
*           operand as much as a paged one.
*   MSSQL   parenthesizes happily, so a GROUPED operand is fine (measured: the nested form returns
*           the 4 correct rows). What it cannot do is PAGE inside an operand: T-SQL allows no
*           ORDER BY there, and `limit()` renders as OFFSET/FETCH, which requires one. Its one real
*           branch cap is `top(n)`, which needs neither and is emitted unparenthesized.
*
* Hoisting a branch into a derived table or CTE would fake the refused cases, and that is emulation
* — the caller can write it with `fromWithBuilder`/`cte` if that is what they meant.
*/
const assertBranchScopeSupported = (branch, config) => {
	if (!branchIsScoped(branch)) return;
	if (config.databaseType === DatabaseType.Postgres || config.databaseType === DatabaseType.Mysql) return;
	const name = dialectDisplayName(config.databaseType);
	if (config.databaseType === DatabaseType.Sqlite) {
		const [what, area] = branchGroups(branch) ? [branch.unionStates.length > 0 ? "a nested set operation" : "a CTE", ParserArea.General] : [branch.orderByStates.length > 0 ? "ORDER BY" : branch.limit > 0 ? "LIMIT" : "OFFSET", branch.orderByStates.length > 0 ? ParserArea.OrderBy : ParserArea.LimitOffset];
		throw new ParserError(area, `${name} cannot scope ${what} to one branch of a set operation — it allows no parenthesized operand at all. Lift the branch into a CTE or a derived table and select from that. Leaving it unparenthesized would change which rows the statement returns.`);
	}
	if (!branchPages(branch)) return;
	const clause = branch.orderByStates.length > 0 ? "ORDER BY" : branch.limit > 0 ? "LIMIT" : "OFFSET";
	throw new ParserError(branch.orderByStates.length > 0 ? ParserArea.OrderBy : ParserArea.LimitOffset, `${name} cannot scope ${clause} to one branch of a set operation. T-SQL allows no ORDER BY inside a set-operation operand, and its OFFSET/FETCH paging form requires one — cap the branch with top(n), which needs neither, or lift it into a CTE and select from that. Setting it on the outer builder instead applies it to the whole result, which is a different query.`);
};
const defaultUnion = (state, config, mode, options) => {
	const sqlHelper = new SqlHelper(mode);
	if (state.unionStates.length === 0) return sqlHelper;
	for (let i = 0; i < state.unionStates.length; i++) {
		const unionState = state.unionStates[i];
		switch (unionState.builderType) {
			case BuilderType.Union:
				sqlHelper.addSqlSnippet("UNION ");
				break;
			case BuilderType.UnionAll:
				sqlHelper.addSqlSnippet("UNION ALL ");
				break;
			case BuilderType.Intersect:
				sqlHelper.addSqlSnippet("INTERSECT ");
				break;
			case BuilderType.Except:
				sqlHelper.addSqlSnippet("EXCEPT ");
				break;
		}
		if (unionState.raw) sqlHelper.addSqlSnippet(unionState.raw);
		else if (unionState.subquery) {
			assertBranchScopeSupported(unionState.subquery, config);
			const subHelper = defaultToSql(unionState.subquery, config, mode, options);
			const wrap = branchIsScoped(unionState.subquery);
			sqlHelper.addSqlSnippetWithValues(wrap ? `(${subHelper.getSql()})` : subHelper.getSql(), subHelper.getValues());
		}
		if (i < state.unionStates.length - 1) sqlHelper.addSqlSnippet(" ");
	}
	return sqlHelper;
};
//#endregion
//#region src/parser/default-update.ts
const defaultUpdate = (state, config, mode, options) => {
	const sqlHelper = new SqlHelper(mode);
	if (state.updateStates.length === 0) throw new ParserError(ParserArea.Update, "UPDATE requires at least one SET column");
	assertMutationJoinsSupported(state, config, ParserArea.Update);
	const hasJoins = state.joinStates.length > 0;
	const delim = config.identifierDelimiters;
	const quote = (s) => quoteIdentifier(s, delim);
	const fromState = resolveMutationTarget(state, ParserArea.Update, "UPDATE requires a table");
	const owner = fromState.owner ?? "";
	const alias = fromState.alias ?? "";
	if (owner !== "" && config.databaseType === DatabaseType.Mysql) throw new ParserError(ParserArea.Update, "MySQL does not support table owners");
	const qualified = (owner !== "" ? quote(owner) + "." : "") + quote(fromState.tableName ?? "");
	const mssqlAliased = config.databaseType === DatabaseType.Mssql && (alias !== "" || hasJoins);
	sqlHelper.addSqlSnippet("UPDATE ");
	sqlHelper.addSqlSnippet(mssqlMutationTop(state, config));
	if (mssqlAliased) sqlHelper.addSqlSnippet(alias !== "" ? quote(alias) : qualified);
	else {
		sqlHelper.addSqlSnippet(qualified);
		if (alias !== "") {
			sqlHelper.addSqlSnippet(" AS ");
			sqlHelper.addSqlSnippet(quote(alias));
		}
		if (hasJoins && config.databaseType === DatabaseType.Mysql) {
			const join = defaultJoin(state, config, mode, options);
			sqlHelper.addSqlSnippet(" ");
			sqlHelper.addSqlSnippetWithValues(join.getSql(), join.getValues());
		}
	}
	sqlHelper.addSqlSnippet(" SET ");
	for (let i = 0; i < state.updateStates.length; i++) {
		const updateState = state.updateStates[i];
		if (updateState.builderType === BuilderType.UpdateRaw) sqlHelper.addSqlSnippet(updateState.raw ?? "");
		else if (updateState.builderType === BuilderType.UpdateColumn) {
			sqlHelper.addSqlSnippet(quoteIdentifier(updateState.columnName, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(" = ");
			sqlHelper.addDynamicValue(updateState.value);
		}
		if (i < state.updateStates.length - 1) sqlHelper.addSqlSnippet(", ");
	}
	if (state.returningState && config.databaseType === DatabaseType.Mssql) emitMssqlOutputClause(sqlHelper, config, state.returningState, "INSERTED", ParserArea.Update);
	if (mssqlAliased) {
		sqlHelper.addSqlSnippet(" FROM ");
		sqlHelper.addSqlSnippet(qualified);
		if (alias !== "") {
			sqlHelper.addSqlSnippet(" AS ");
			sqlHelper.addSqlSnippet(quote(alias));
		}
		if (hasJoins) {
			const join = defaultJoin(state, config, mode, options);
			sqlHelper.addSqlSnippet(" ");
			sqlHelper.addSqlSnippetWithValues(join.getSql(), join.getValues());
		}
	}
	if (hasJoins && config.databaseType === DatabaseType.Postgres) {
		const from = renderPostgresMutationFrom(config, state, mode, options, ParserArea.Update);
		sqlHelper.addSqlSnippet(" FROM ");
		sqlHelper.addSqlSnippetWithValues(from.getSql(), from.getValues());
	}
	return sqlHelper;
};
//#endregion
//#region src/parser/to-sql.ts
/**
* Adds this statement's own CTE names to the set inherited from its enclosing statements.
*
* Returns the SAME options object when the statement declares nothing, so the common case
* allocates nothing and the identity of `options` is preserved for every other consumer.
*/
const withDeclaredCteNames = (options, state) => {
	if (state.cteStates.length === 0) return options;
	const names = new Set(options?.declaredCteNames ?? []);
	for (const cte of state.cteStates) names.add(cte.name);
	return {
		...options,
		declaredCteNames: names
	};
};
/**
* Emits the ` WHERE ...` clause for a join-backed UPDATE/DELETE. For MySQL/MSSQL the join's ON
* conditions were already emitted inline as real `JOIN ... ON` syntax by `defaultUpdate`/
* `defaultDelete`, so this is just the caller's own `.where(...)` predicates, unchanged. For
* Postgres, the join's ON conditions cannot live in `FROM`/`USING` — see
* `default-mutation-join.ts` — so they are translated into a `WHERE` predicate here and ANDed
* in front of the caller's own predicates.
*/
const emitMutationWhere = (sqlHelper, state, config, mode, options) => {
	const joinPredicate = state.joinStates.length > 0 && config.databaseType === DatabaseType.Postgres ? buildPostgresMutationJoinPredicate(config, state, mode) : void 0;
	if (!joinPredicate || joinPredicate.getSql() === "") {
		if (state.whereStates.length > 0) {
			const where = defaultWhere(state, config, mode, options);
			sqlHelper.addSqlSnippet(" ");
			sqlHelper.addSqlSnippetWithValues(where.getSql(), where.getValues());
		}
		return;
	}
	sqlHelper.addSqlSnippet(" WHERE ");
	sqlHelper.addSqlSnippetWithValues(joinPredicate.getSql(), joinPredicate.getValues());
	if (state.whereStates.length > 0) {
		const where = defaultWhere(state, config, mode, options);
		let whereSql = where.getSql();
		if (whereSql.startsWith("WHERE ")) whereSql = whereSql.slice(6);
		sqlHelper.addSqlSnippet(" AND ");
		sqlHelper.addSqlSnippetWithValues(whereSql, where.getValues());
	}
};
/**
* Renders a {@link QueryState} to SQL by walking its clauses in order. Pure and
* dialect-driven: everything dialect-specific comes from {@link Dialect} `config`, except
* the {@link ToSqlOptions} hooks the caller threads through (MSSQL's `TOP`). Used both for
* the outer statement and, recursively, for every nested subquery.
*/
const defaultToSql = (state, config, mode, options) => {
	const sqlHelper = new SqlHelper(mode);
	if (state === null || state === void 0) throw new ParserError(ParserArea.General, "No state provided");
	if (config.databaseType !== DatabaseType.Mssql && hasExplicitTop(state)) throw new ParserError(ParserArea.LimitOffset, `${dialectDisplayName(config.databaseType)} has no TOP clause — use limit() instead`);
	options = withDeclaredCteNames(options, state);
	validateHints(state, config, ParserArea.General);
	if (state.isInnerStatement && state.queryType !== QueryType.Select) {
		if (!(state.isCteBody === true && config.databaseType === DatabaseType.Postgres)) throw new ParserError(ParserArea.General, `A sub-builder must be a SELECT — an INSERT, UPDATE, DELETE or CALL built inside a child callback would be spliced in wherever that child is inlined, which no engine parses. ${config.databaseType === DatabaseType.Postgres ? "Postgres allows a data-modifying CTE, so build it with cte() if that is what you meant." : `${dialectDisplayName(config.databaseType)} has no data-modifying CTE either — run the mutation as its own statement.`}`);
	}
	if (config.databaseType === DatabaseType.Mssql && state.isInnerStatement && state.orderByStates.length > 0 && state.limit === 0 && state.offset === void 0 && !hasExplicitTop(state)) throw new ParserError(ParserArea.OrderBy, "T-SQL rejects an ORDER BY inside a subquery, derived table, CTE body or set-operation operand unless it comes with a row cap (Msg 1033) — an ordering with nothing to cap has no meaning there. Add top(n), or offset(0) if you only want the ordering to be legal and are relying on it downstream.");
	if (config.databaseType === DatabaseType.Mssql && state.isInnerStatement && state.cteStates.length > 0) throw new ParserError(ParserArea.General, "T-SQL allows WITH only at the start of a statement, so a CTE cannot be declared on a subquery, a derived table, a set-operation branch or another CTE body. Declare it on the outermost builder — a T-SQL CTE is visible to the whole statement, including its subqueries.");
	if (state.cteStates.length > 0) {
		const cte = defaultCte(state, config, mode, options);
		sqlHelper.addSqlSnippetWithValues(cte.getSql(), cte.getValues());
	}
	if (state.rowLock && state.queryType !== QueryType.Select) throw new ParserError(ParserArea.General, "FOR UPDATE/FOR SHARE requires a SELECT query");
	if (state.rowLock && state.unionStates.length > 0) throw new ParserError(ParserArea.General, "A row lock cannot cover a set operation — Postgres rejects it outright, and MySQL and MSSQL silently lock only one operand, leaving the rest of the rows you asked for unlocked. Lock the operands individually, or lock the base rows before combining them.");
	if (config.databaseType === DatabaseType.Mysql && state.rowLock && state.fromStates.some((from) => from.subquery !== void 0)) throw new ParserError(ParserArea.General, "MySQL's FOR UPDATE/FOR SHARE does not reach rows behind a derived table — they are read completely unlocked, with no error, while Postgres locks them. Lock the base table in its own statement, or join the table directly instead of wrapping it in a subquery.");
	if (state.upsertState && state.queryType !== QueryType.Insert) throw new ParserError(ParserArea.Insert, "Upsert (ON CONFLICT) requires INSERT");
	if (state.callState && state.queryType !== QueryType.Call) throw new ParserError(ParserArea.Call, "Procedure/function call state requires queryType Call");
	if (state.queryType === QueryType.Merge) {
		assertInsertMergeRowCapSupported(state, config, ParserArea.Merge);
		const merge = defaultMerge(state, config, mode, options);
		sqlHelper.addSqlSnippetWithValues(merge.getSql(), merge.getValues());
		return sqlHelper;
	}
	if (state.queryType === QueryType.Call) {
		if (state.cteStates.length > 0) throw new ParserError(ParserArea.Call, "A CTE cannot be combined with a procedure/function call");
		if (state.returningState) throw new ParserError(ParserArea.Call, "RETURNING/OUTPUT cannot be combined with a procedure/function call");
		const call = defaultCall(state, config, mode);
		sqlHelper.addSqlSnippetWithValues(call.getSql(), call.getValues());
		if (!state.isInnerStatement) sqlHelper.addSqlSnippet(";");
		return sqlHelper;
	}
	if (state.queryType === QueryType.Insert) {
		assertInsertMergeRowCapSupported(state, config, ParserArea.Insert);
		const insert = defaultInsert(state, config, mode, options);
		sqlHelper.addSqlSnippetWithValues(insert.getSql(), insert.getValues());
		if (state.returningState && config.databaseType !== DatabaseType.Mssql) emitTrailingReturningClause(sqlHelper, config, state.returningState, ParserArea.Insert);
		if (!state.isInnerStatement) sqlHelper.addSqlSnippet(";");
		return sqlHelper;
	}
	if (state.queryType === QueryType.Update) {
		assertMutationRowCapSupported(state, config, ParserArea.Update);
		const update = defaultUpdate(state, config, mode, options);
		sqlHelper.addSqlSnippetWithValues(update.getSql(), update.getValues());
		emitMutationWhere(sqlHelper, state, config, mode, options);
		emitMutationRowCap(sqlHelper, state, config, mode);
		if (state.returningState && config.databaseType !== DatabaseType.Mssql) emitTrailingReturningClause(sqlHelper, config, state.returningState, ParserArea.Update);
		if (!state.isInnerStatement) sqlHelper.addSqlSnippet(";");
		return sqlHelper;
	}
	if (state.queryType === QueryType.Delete) {
		assertMutationRowCapSupported(state, config, ParserArea.Delete);
		const del = defaultDelete(state, config, mode, options);
		sqlHelper.addSqlSnippetWithValues(del.getSql(), del.getValues());
		emitMutationWhere(sqlHelper, state, config, mode, options);
		emitMutationRowCap(sqlHelper, state, config, mode);
		if (state.returningState && config.databaseType !== DatabaseType.Mssql) emitTrailingReturningClause(sqlHelper, config, state.returningState, ParserArea.Delete);
		if (!state.isInnerStatement) sqlHelper.addSqlSnippet(";");
		return sqlHelper;
	}
	if (state.returningState) throw new ParserError(ParserArea.General, "RETURNING/OUTPUT requires INSERT, UPDATE, or DELETE");
	const sel = defaultSelect(state, config, mode, options);
	sqlHelper.addSqlSnippetWithValues(sel.getSql(), sel.getValues());
	const from = defaultFrom(state, config, mode, options);
	sqlHelper.addSqlSnippet(" ");
	sqlHelper.addSqlSnippetWithValues(from.getSql(), from.getValues());
	if (state.joinStates.length > 0) {
		const join = defaultJoin(state, config, mode, options);
		sqlHelper.addSqlSnippet(" ");
		sqlHelper.addSqlSnippetWithValues(join.getSql(), join.getValues());
	}
	if (state.whereStates.length > 0) {
		const where = defaultWhere(state, config, mode, options);
		sqlHelper.addSqlSnippet(" ");
		sqlHelper.addSqlSnippetWithValues(where.getSql(), where.getValues());
	}
	if (state.groupByStates.length > 0) {
		const groupBy = defaultGroupBy(state, config, mode);
		sqlHelper.addSqlSnippet(" ");
		sqlHelper.addSqlSnippetWithValues(groupBy.getSql(), groupBy.getValues());
	}
	if (state.havingStates.length > 0) {
		const having = defaultHaving(state, config, mode, options);
		sqlHelper.addSqlSnippet(" ");
		sqlHelper.addSqlSnippetWithValues(having.getSql(), having.getValues());
	}
	if (state.unionStates.length > 0) {
		const union = defaultUnion(state, config, mode, options);
		sqlHelper.addSqlSnippet(" ");
		sqlHelper.addSqlSnippetWithValues(union.getSql(), union.getValues());
	}
	if (state.orderByStates.length > 0) {
		const orderBy = defaultOrderBy(state, config, mode);
		sqlHelper.addSqlSnippet(" ");
		sqlHelper.addSqlSnippetWithValues(orderBy.getSql(), orderBy.getValues());
	}
	if (state.limit > 0 || state.offset !== void 0 || state.limitWithTies) {
		const limitOffset = defaultLimitOffset(state, config, mode);
		const clause = limitOffset.getSql();
		if (clause !== "") {
			sqlHelper.addSqlSnippet(" ");
			sqlHelper.addSqlSnippetWithValues(clause, limitOffset.getValues());
		}
	}
	if (state.rowLock) emitTrailingRowLockClause(sqlHelper, config, state.rowLock);
	emitTrailingHints(sqlHelper, state, config);
	if (!state.isInnerStatement) sqlHelper.addSqlSnippet(";");
	return sqlHelper;
};
/**
* MSSQL prepends a `TOP` to the SELECT list for an explicit `.top(n)`. Other dialects need no hook.
*
* There is deliberately no automatic cap here. SQLEasy emits the query it was asked for, however
* unbounded — a row cap is the caller's policy, not the builder's, and one applied behind the
* caller's back is a silent truncation they never wrote. `.top(n)` is the caller asking; it
* conflicts with limit/offset outright, and `defaultLimitOffset` throws on that combination.
*/
const toSqlOptionsFor = (config) => {
	if (config.databaseType !== DatabaseType.Mssql) return {};
	return { beforeSelectColumns: (state, _cfg, sqlHelper) => {
		if (hasExplicitTop(state)) {
			sqlHelper.addSqlSnippet(`TOP (${Number(state.customState["top"])}) `);
			return;
		}
		if (state.limitWithTies && state.limit > 0) sqlHelper.addSqlSnippet(`TOP (${state.limit}) WITH TIES `);
	} };
};
/** A parameter value as a T-SQL literal for the sp_executesql value list. */
const toHex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
const isBinaryValue = (value) => value instanceof Uint8Array;
const mssqlParameterValue = (value) => {
	if (value === null || value === void 0) return "NULL";
	if (isBinaryValue(value)) return "0x" + toHex(value);
	switch (typeof value) {
		case "number":
			if (!Number.isFinite(value)) throw new ParserError(ParserArea.General, `value is not a finite number: ${value}`);
			return value.toString();
		case "boolean": return value ? "1" : "0";
		case "bigint": return value.toString();
		case "object":
			if (value instanceof Date) return "'" + value.toISOString() + "'";
			return "N'" + JSON.stringify(value).replaceAll("'", "''") + "'";
		default: return "N'" + String(value).replaceAll("'", "''") + "'";
	}
};
/** The T-SQL declared type for an sp_executesql `@pN` parameter, inferred from the value. */
const mssqlParameterType = (value) => {
	if (isBinaryValue(value)) return "varbinary(max)";
	switch (typeof value) {
		case "string": return "nvarchar(max)";
		case "number":
			if (!Number.isFinite(value)) throw new ParserError(ParserArea.General, `value is not a finite number: ${value}`);
			if (Number.isSafeInteger(value)) if (value >= 0 && value <= 255) return "tinyint";
			else if (value >= -32768 && value <= 32767) return "smallint";
			else if (value >= -2147483648 && value <= 2147483647) return "int";
			else return "bigint";
			else return "float";
		case "boolean": return "bit";
		case "bigint": return "bigint";
		default: return "nvarchar(max)";
	}
};
/**
* Wraps the rendered statement in a self-contained `exec sp_executesql`: the SQL string
* (with `''`-escaped quotes and `?`→`@pN`), the `@pN type` declaration list, and — only
* when there are parameters — the `@pN = value` assignment list.
*/
const mssqlToSql = (state, config) => {
	const paramsString = new SqlHelper(ParserMode.Prepared);
	const finalString = new SqlHelper(ParserMode.Prepared);
	const sqlHelper = defaultToSql(state, config, ParserMode.Prepared, toSqlOptionsFor(config));
	let sql = sqlHelper.getSql();
	sql = sql.replaceAll("'", "''");
	const values = sqlHelper.getValues();
	sql = renderPlaceholders(sql, (index) => "@p" + index);
	values.forEach((value, index) => {
		if (index > 0) paramsString.addSqlSnippet(", ");
		paramsString.addSqlSnippet("@p" + index + " " + mssqlParameterType(value));
	});
	finalString.addSqlSnippet("SET NOCOUNT ON; ");
	finalString.addSqlSnippet("exec sp_executesql N'");
	finalString.addSqlSnippet(sql);
	finalString.addSqlSnippet("', N'");
	finalString.addSqlSnippet(paramsString.getSql());
	finalString.addSqlSnippet("'");
	if (values.length > 0) {
		finalString.addSqlSnippet(", ");
		for (let i = 0; i < values.length; i++) {
			if (i > 0) finalString.addSqlSnippet(", ");
			finalString.addSqlSnippet("@p" + i + " = " + mssqlParameterValue(values[i]));
		}
	}
	finalString.addSqlSnippet(";");
	return finalString.getSql();
};
/**
* Postgres uses numbered `$n` placeholders: substitute the Nth token with `$1`, `$2`, … in order.
*
* This must not scan for a bare `$`. Doing so rewrote the `$` inside caller text — `selectRaw("'$100'")`
* became `'$1100'` — and shifted the real placeholder to `$2` while only one value was bound, so
* Postgres rejected the statement outright. `$` is especially common in Postgres (`$$`-quoting).
*/
const postgresPrepared = (state, config) => {
	const sqlHelper = defaultToSql(state, config, ParserMode.Prepared);
	return {
		sql: renderPlaceholders(sqlHelper.getSql(), (index) => config.preparedStatementPlaceholder + (index + 1)),
		params: sqlHelper.getValues()
	};
};
/**
* The dialect's own placeholder, substituted for each {@link PLACEHOLDER_TOKEN}. MySQL and SQLite
* bind positionally, so every placeholder is the same `?`.
*/
const positionalPrepared = (state, config) => {
	const sqlHelper = defaultToSql(state, config, ParserMode.Prepared);
	return {
		sql: renderPlaceholders(sqlHelper.getSql(), () => config.preparedStatementPlaceholder),
		params: sqlHelper.getValues()
	};
};
/**
* Renders one query state as a prepared SQL string (placeholders, without a separate params
* array). For Postgres/MySQL/SQLite this is **not** execution-safe on its own — use
* {@link parsePrepared} to get `{ sql, params }`. For MSSQL, `parse` and `parsePrepared`
* both return the same self-contained `sp_executesql` batch (values inlined; `params` empty).
*/
const parse = (state, config) => {
	if (config.databaseType === DatabaseType.Mssql) return mssqlToSql(state, config);
	if (config.databaseType === DatabaseType.Postgres) return postgresPrepared(state, config).sql;
	return positionalPrepared(state, config).sql;
};
/**
* Renders one query state as prepared SQL plus its ordered bound values. MSSQL inlines its
* values into the `sp_executesql` string, so its `params` is empty.
*/
const parsePrepared = (state, config) => {
	if (config.databaseType === DatabaseType.Mssql) return {
		sql: mssqlToSql(state, config),
		params: []
	};
	if (config.databaseType === DatabaseType.Postgres) return postgresPrepared(state, config);
	return positionalPrepared(state, config);
};
/**
* Renders one query state as a raw SQL string with values inlined (MSSQL keeps its `TOP`). DEBUG /
* TEST display only: values are inlined UNQUOTED + UNESCAPED (readable golden SQL for the parser
* test suite), so the result is NOT execution-safe. To run a query, use `parsePrepared` (bound
* params) — never execute `parseRaw`/`parse` output against a driver. See `SqlHelper.getSqlDebug`.
*/
const parseRaw = (state, config) => {
	return defaultToSql(state, config, ParserMode.Raw, toSqlOptionsFor(config)).getSqlDebug();
};
/**
* Renders a batch of query states as a single prepared SQL string. Each statement is prepared
* independently (so placeholder numbering restarts per statement, matching running them one by
* one). When `transactionState` is {@link MultiBuilderTransactionState.TransactionOn}, the batch
* is wrapped in the dialect's `transactionDelimiters`.
*/
const parseMulti = (states, transactionState, config) => {
	let sql = "";
	if (transactionState === MultiBuilderTransactionState.TransactionOn) sql += config.transactionDelimiters.begin + "; ";
	for (const state of states) sql += parse(state, config);
	if (transactionState === MultiBuilderTransactionState.TransactionOn) sql += config.transactionDelimiters.end + ";";
	return sql;
};
/**
* Renders a batch of query states as a single raw SQL string with values inlined. DEBUG / TEST
* display only — NOT execution-safe (see {@link parseRaw}). Wraps in the dialect's
* `transactionDelimiters` when `transactionState` is
* {@link MultiBuilderTransactionState.TransactionOn}.
*/
const parseMultiRaw = (states, transactionState, config) => {
	let sql = "";
	if (transactionState === MultiBuilderTransactionState.TransactionOn) sql += config.transactionDelimiters.begin + "; ";
	for (const state of states) sql += parseRaw(state, config);
	if (transactionState === MultiBuilderTransactionState.TransactionOn) sql += config.transactionDelimiters.end + ";";
	return sql;
};
//#endregion
//#region src/state/insert.ts
/** Creates an {@link InsertState} with default field values. */
const createInsertState = () => ({
	owner: void 0,
	tableName: void 0,
	columns: [],
	values: [],
	selectSubquery: void 0,
	raw: void 0
});
//#endregion
//#region src/state/query.ts
/** Creates a {@link QueryState} with default field values (an empty SELECT). */
const createQueryState = () => ({
	builderName: "",
	queryType: QueryType.Select,
	fromStates: [],
	joinStates: [],
	whereStates: [],
	orderByStates: [],
	selectStates: [],
	groupByStates: [],
	havingStates: [],
	unionStates: [],
	cteStates: [],
	insertState: void 0,
	updateStates: [],
	upsertState: void 0,
	mergeState: void 0,
	returningState: void 0,
	rowLock: void 0,
	callState: void 0,
	isInnerStatement: false,
	limit: 0,
	limitWithTies: false,
	offset: void 0,
	distinct: false,
	distinctOnColumns: void 0,
	customState: void 0,
	mutationTargetIndex: void 0,
	hintStates: []
});
//#endregion
//#region src/builder/join-on.ts
/**
* Fluent builder for a JOIN's `ON` condition list — `on`/`onValue` comparisons (including
* `JoinOperator.Like`/`NotLike`), `onIn`/`onBetween` (and their `NOT` variants), `onRaw`
* fragments, `and`/`or` combinators, and parenthesized `onGroup`s. One class for every dialect;
* {@link states} hands the accumulated conditions to the join clause parser.
*/
var JoinOnBuilder = class JoinOnBuilder {
	#states = [];
	#config;
	constructor(config) {
		this.#config = config;
	}
	#child = () => new JoinOnBuilder(this.#config);
	and = () => {
		this.#states.push({
			joinOperator: JoinOperator.None,
			joinOnOperator: JoinOnOperator.And,
			aliasLeft: void 0,
			columnLeft: void 0,
			aliasRight: void 0,
			columnRight: void 0,
			raw: void 0,
			valueRight: void 0,
			valuesRight: void 0
		});
		return this;
	};
	on = (aliasLeft, columnLeft, joinOperator, aliasRight, columnRight) => {
		this.#states.push({
			joinOperator,
			joinOnOperator: JoinOnOperator.On,
			aliasLeft,
			columnLeft,
			aliasRight,
			columnRight,
			raw: void 0,
			valueRight: void 0,
			valuesRight: void 0
		});
		return this;
	};
	onGroup = (builder) => {
		this.#states.push({
			joinOperator: JoinOperator.None,
			joinOnOperator: JoinOnOperator.GroupBegin,
			aliasLeft: void 0,
			columnLeft: void 0,
			aliasRight: void 0,
			columnRight: void 0,
			raw: void 0,
			valueRight: void 0,
			valuesRight: void 0
		});
		const child = this.#child();
		builder(child);
		this.#states.push(...child.states());
		this.#states.push({
			joinOperator: JoinOperator.None,
			joinOnOperator: JoinOnOperator.GroupEnd,
			aliasLeft: void 0,
			columnLeft: void 0,
			aliasRight: void 0,
			columnRight: void 0,
			raw: void 0,
			valueRight: void 0,
			valuesRight: void 0
		});
		return this;
	};
	onRaw = (raw) => {
		this.#states.push({
			joinOperator: JoinOperator.None,
			joinOnOperator: JoinOnOperator.Raw,
			aliasLeft: void 0,
			columnLeft: void 0,
			aliasRight: void 0,
			columnRight: void 0,
			raw,
			valueRight: void 0,
			valuesRight: void 0
		});
		return this;
	};
	onValue = (aliasLeft, columnLeft, joinOperator, valueRight) => {
		this.#states.push({
			joinOperator,
			joinOnOperator: JoinOnOperator.Value,
			aliasLeft,
			columnLeft,
			aliasRight: void 0,
			columnRight: void 0,
			raw: void 0,
			valueRight,
			valuesRight: void 0
		});
		return this;
	};
	/** `ON column IN (values)`. */
	onIn = (aliasLeft, columnLeft, values) => {
		this.#states.push({
			joinOperator: JoinOperator.None,
			joinOnOperator: JoinOnOperator.InValues,
			aliasLeft,
			columnLeft,
			aliasRight: void 0,
			columnRight: void 0,
			raw: void 0,
			valueRight: void 0,
			valuesRight: [...values]
		});
		return this;
	};
	/** `ON column NOT IN (values)`. */
	onNotIn = (aliasLeft, columnLeft, values) => {
		this.#states.push({
			joinOperator: JoinOperator.None,
			joinOnOperator: JoinOnOperator.NotInValues,
			aliasLeft,
			columnLeft,
			aliasRight: void 0,
			columnRight: void 0,
			raw: void 0,
			valueRight: void 0,
			valuesRight: [...values]
		});
		return this;
	};
	/** `ON column BETWEEN value1 AND value2`. */
	onBetween = (aliasLeft, columnLeft, value1, value2) => {
		this.#states.push({
			joinOperator: JoinOperator.None,
			joinOnOperator: JoinOnOperator.Between,
			aliasLeft,
			columnLeft,
			aliasRight: void 0,
			columnRight: void 0,
			raw: void 0,
			valueRight: void 0,
			valuesRight: [value1, value2]
		});
		return this;
	};
	/** `ON column NOT BETWEEN value1 AND value2`. */
	onNotBetween = (aliasLeft, columnLeft, value1, value2) => {
		this.#states.push({
			joinOperator: JoinOperator.None,
			joinOnOperator: JoinOnOperator.NotBetween,
			aliasLeft,
			columnLeft,
			aliasRight: void 0,
			columnRight: void 0,
			raw: void 0,
			valueRight: void 0,
			valuesRight: [value1, value2]
		});
		return this;
	};
	or = () => {
		this.#states.push({
			joinOperator: JoinOperator.None,
			joinOnOperator: JoinOnOperator.Or,
			aliasLeft: void 0,
			columnLeft: void 0,
			aliasRight: void 0,
			columnRight: void 0,
			raw: void 0,
			valueRight: void 0,
			valuesRight: void 0
		});
		return this;
	};
	states = () => {
		return this.#states;
	};
};
//#endregion
//#region src/state/merge.ts
/** Creates a {@link MergeState} with default field values. */
const createMergeState = () => ({
	targetOwner: void 0,
	targetTable: void 0,
	targetAlias: "target",
	holdlock: void 0,
	using: void 0,
	onStates: [],
	whenStates: [],
	outputRaw: void 0
});
//#endregion
//#region src/builder/merge.ts
/** `source.<col>` — a reference to the USING source row (the common MERGE RHS). */
const source = (columnName) => ({
	kind: "source",
	columnName
});
/** `target.<col>` — a reference to the target row. */
const target = (columnName) => ({
	kind: "target",
	columnName
});
/** A genuine bound literal (`@pN`), for the rarer case where a WHEN action assigns a constant. */
const value = (v) => ({
	kind: "value",
	value: v
});
/** A raw SQL fragment for an RHS the structured forms cannot express. */
const raw = (sql) => ({
	kind: "raw",
	sql
});
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
var MergeBuilder = class {
	#state = createMergeState();
	#config;
	constructor(config) {
		this.#config = config;
	}
	#child = () => new QueryBuilder(this.#config);
	#collectAnd = (and) => {
		if (!and) return;
		const j = new JoinOnBuilder(this.#config);
		and(j);
		return j.states();
	};
	#pushWhen = (match, action, and) => {
		this.#state.whenStates.push({
			match,
			and: this.#collectAnd(and),
			action
		});
		return this;
	};
	/** `MERGE INTO <table> [AS alias]` — target defaults to the alias `target`, owner to the dialect default. */
	into = (table, alias = "target") => {
		this.#state.targetTable = table;
		this.#state.targetAlias = alias;
		return this;
	};
	/** `MERGE INTO <owner>.<table> [AS alias]`. */
	intoWithOwner = (owner, table, alias = "target") => {
		this.#state.targetOwner = owner;
		this.#state.targetTable = table;
		this.#state.targetAlias = alias;
		return this;
	};
	/**
	* `WITH (HOLDLOCK)` on the target.
	*
	* A MERGE used as an upsert is race-prone at READ COMMITTED without it — under concurrency an
	* un-hinted MERGE can still raise a duplicate-key violation, which `HOLDLOCK` (a SERIALIZABLE
	* hint on the target only) prevents. The builder does not add it for you: it emits the MERGE you
	* wrote, and this is how you write the concurrency-safe one.
	*/
	holdlock = (on = true) => {
		this.#state.holdlock = on;
		return this;
	};
	/** `USING (VALUES …) AS alias (columns)` — one or more literal rows. */
	usingValues = (alias, columns, rows) => {
		this.#state.using = {
			kind: "values",
			alias,
			columns,
			rows
		};
		return this;
	};
	/** `USING <table> AS alias`. */
	usingTable = (table, alias, owner) => {
		this.#state.using = {
			kind: "table",
			owner,
			table,
			alias
		};
		return this;
	};
	/**
	* `USING (<subquery>) AS alias`. MERGE is MSSQL-only, so its USING subquery runs on MSSQL — the
	* callback builder is the MSSQL view, keeping the honest-surface ceiling inside the subquery too.
	* The concrete `QueryBuilder` the runtime passes is assignable to that view.
	*/
	usingSelect = (alias, build) => {
		const child = this.#child();
		build(child);
		child.state().isInnerStatement = true;
		this.#state.using = {
			kind: "select",
			alias,
			subquery: child.state()
		};
		return this;
	};
	/** `USING <raw> AS alias`, for a source the structured forms cannot express (APPLY, TVF, …). */
	usingRaw = (sql, alias) => {
		this.#state.using = {
			kind: "raw",
			alias,
			sql
		};
		return this;
	};
	/** `ON <merge_search_condition>` — required; full predicate strength via {@link JoinOnBuilder}. */
	on = (build) => {
		const j = new JoinOnBuilder(this.#config);
		build(j);
		this.#state.onStates = j.states();
		return this;
	};
	/** `WHEN MATCHED [AND …] THEN UPDATE SET …`. */
	whenMatchedThenUpdate = (assignments, and) => this.#pushWhen("matched", {
		kind: "update",
		assignments,
		raw: void 0
	}, and);
	/** `WHEN MATCHED [AND …] THEN UPDATE SET <raw>`. */
	whenMatchedThenUpdateRaw = (raw, and) => this.#pushWhen("matched", {
		kind: "update",
		assignments: [],
		raw
	}, and);
	/** `WHEN MATCHED [AND …] THEN DELETE`. */
	whenMatchedThenDelete = (and) => this.#pushWhen("matched", { kind: "delete" }, and);
	/** `WHEN NOT MATCHED [BY TARGET] [AND …] THEN INSERT (columns) VALUES (…)`. */
	whenNotMatchedThenInsert = (columns, values, and) => this.#pushWhen("notMatchedByTarget", {
		kind: "insert",
		columns,
		values
	}, and);
	/** `WHEN NOT MATCHED [BY TARGET] [AND …] THEN INSERT DEFAULT VALUES`. */
	whenNotMatchedThenInsertDefaultValues = (and) => this.#pushWhen("notMatchedByTarget", { kind: "insertDefaultValues" }, and);
	/** `WHEN NOT MATCHED BY SOURCE [AND …] THEN UPDATE SET …`. */
	whenNotMatchedBySourceThenUpdate = (assignments, and) => this.#pushWhen("notMatchedBySource", {
		kind: "update",
		assignments,
		raw: void 0
	}, and);
	/** `WHEN NOT MATCHED BY SOURCE [AND …] THEN DELETE`. */
	whenNotMatchedBySourceThenDelete = (and) => this.#pushWhen("notMatchedBySource", { kind: "delete" }, and);
	/**
	* `OUTPUT <expression>` as a raw fragment, e.g. `$action, inserted.id, deleted.status`.
	*
	* Deliberately raw, and the only OUTPUT form offered here. MERGE's OUTPUT is materially richer
	* than an INSERT/UPDATE/DELETE OUTPUT — it exposes the per-row `$action` and can mix `inserted.*`
	* and `deleted.*` in one row — so a structured `output(columns)` that quietly captured a single
	* side would be exactly the kind of half-true convenience this library refuses. Write the
	* expression; the builder does not pretend to know which side each column comes from.
	*/
	outputRaw = (sql) => {
		this.#state.outputRaw = sql;
		return this;
	};
	state = () => this.#state;
};
//#endregion
//#region src/state/window.ts
/** Creates a {@link WindowState} with default field values (an empty `OVER ()`). */
const createWindowState = () => ({
	partitionByStates: [],
	orderByStates: [],
	frame: void 0
});
//#endregion
//#region src/builder/window.ts
/**
* Fluent builder for a window function's `OVER (...)` clause — `PARTITION BY`, `ORDER BY`
* (with `NULLS FIRST`/`NULLS LAST`), and an optional `ROWS`/`RANGE` frame. One class for every
* dialect; {@link state} hands the accumulated clause to {@link QueryBuilder.selectWindow}.
*/
var WindowBuilder = class {
	#state = createWindowState();
	partitionByColumn = (tableNameOrAlias, columnName) => {
		this.#state.partitionByStates.push({
			tableNameOrAlias,
			columnName,
			raw: void 0
		});
		return this;
	};
	partitionByColumns = (columns) => {
		columns.forEach((column) => {
			this.partitionByColumn(column.tableNameOrAlias, column.columnName);
		});
		return this;
	};
	partitionByRaw = (raw) => {
		this.#state.partitionByStates.push({
			tableNameOrAlias: void 0,
			columnName: void 0,
			raw
		});
		return this;
	};
	orderByColumn = (tableNameOrAlias, columnName, direction = OrderByDirection.None, nulls = NullsOrder.None) => {
		this.#state.orderByStates.push({
			tableNameOrAlias,
			columnName,
			direction,
			nulls,
			raw: void 0
		});
		return this;
	};
	orderByRaw = (raw) => {
		this.#state.orderByStates.push({
			tableNameOrAlias: void 0,
			columnName: void 0,
			direction: OrderByDirection.None,
			nulls: NullsOrder.None,
			raw
		});
		return this;
	};
	/** Sets a structured `ROWS`/`RANGE BETWEEN start AND end` frame. Omit `end` for the SQL-standard single-bound shorthand (implicitly `AND CURRENT ROW`). */
	frame = (unit, startType, startOffset, endType, endOffset) => {
		this.#state.frame = {
			unit,
			start: {
				type: startType,
				offset: startOffset
			},
			end: endType ? {
				type: endType,
				offset: endOffset
			} : void 0,
			raw: void 0
		};
		return this;
	};
	/** Raw-SQL form of {@link frame} for expressions the structured bounds can't express. */
	frameRaw = (raw) => {
		this.#state.frame = {
			unit: FrameUnit.Rows,
			start: {
				type: FrameBoundType.CurrentRow,
				offset: void 0
			},
			end: void 0,
			raw
		};
		return this;
	};
	state = () => {
		return this.#state;
	};
};
//#endregion
//#region src/builder/query.ts
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
var QueryBuilder = class QueryBuilder {
	#state = createQueryState();
	#config;
	/** Where `and()` / `or()` append — flips when WHERE vs HAVING predicates are added. */
	#combinatorTarget = "where";
	constructor(config) {
		this.#config = config;
	}
	/** A fresh builder sharing this builder's dialect — the parent of every subquery. */
	#child = () => new QueryBuilder(this.#config);
	#pushCombinator = (builderType) => {
		if (this.#combinatorTarget === "having") {
			this.#state.havingStates.push({
				builderType,
				tableNameOrAlias: void 0,
				columnName: void 0,
				whereOperator: WhereOperator.None,
				raw: void 0,
				subquery: void 0,
				values: []
			});
			return this;
		}
		this.#state.whereStates.push({
			builderType,
			tableNameOrAlias: void 0,
			columnName: void 0,
			whereOperator: WhereOperator.None,
			raw: void 0,
			subquery: void 0,
			values: []
		});
		return this;
	};
	/** Returns the dialect configuration backing this builder. */
	configuration = () => {
		return this.#config;
	};
	and = () => this.#pushCombinator(BuilderType.And);
	or = () => this.#pushCombinator(BuilderType.Or);
	clearAll = () => {
		this.#state = createQueryState();
		this.#combinatorTarget = "where";
		return this;
	};
	clearFrom = () => {
		this.#state.fromStates = [];
		return this;
	};
	clearGroupBy = () => {
		this.#state.groupByStates = [];
		return this;
	};
	clearHaving = () => {
		this.#state.havingStates = [];
		this.#combinatorTarget = "where";
		return this;
	};
	clearJoin = () => {
		this.#state.joinStates = [];
		return this;
	};
	clearLimit = () => {
		this.#state.limit = 0;
		this.#state.limitWithTies = false;
		return this;
	};
	/** Removes the offset entirely. `undefined`, not `0` — `offset(0)` is a real, emitted value. */
	clearOffset = () => {
		this.#state.offset = void 0;
		return this;
	};
	clearOrderBy = () => {
		this.#state.orderByStates = [];
		return this;
	};
	clearSelect = () => {
		this.#state.selectStates = [];
		this.#state.distinct = false;
		this.#state.distinctOnColumns = void 0;
		return this;
	};
	clearDistinct = () => {
		this.#state.distinct = false;
		return this;
	};
	/**
	* Postgres-only `DISTINCT ON (...)`: keeps only the first row (per the query's `ORDER BY`)
	* for each distinct combination of the given columns. Mutually exclusive with {@link distinct}
	* — combining them throws at parse time. Throws on every other dialect, which has no equivalent.
	*/
	distinctOn = (columns) => {
		this.#state.distinctOnColumns = columns.map((column) => ({
			tableNameOrAlias: column.tableNameOrAlias,
			columnName: column.columnName
		}));
		return this;
	};
	clearDistinctOn = () => {
		this.#state.distinctOnColumns = void 0;
		return this;
	};
	clearWhere = () => {
		this.#state.whereStates = [];
		return this;
	};
	clearCte = () => {
		this.#state.cteStates = [];
		return this;
	};
	clearUnion = () => {
		this.#state.unionStates = [];
		return this;
	};
	clearInsert = () => {
		this.#state.insertState = void 0;
		this.#state.upsertState = void 0;
		if (this.#state.queryType === QueryType.Insert) this.#state.queryType = QueryType.Select;
		return this;
	};
	clearUpdate = () => {
		this.#state.updateStates = [];
		this.#clearMutationTarget();
		if (this.#state.queryType === QueryType.Update) this.#state.queryType = QueryType.Select;
		return this;
	};
	/** Clears the DELETE target table and resets sticky Delete query type. */
	clearDelete = () => {
		this.#clearMutationTarget();
		if (this.#state.queryType === QueryType.Delete) this.#state.queryType = QueryType.Select;
		return this;
	};
	#clearMutationTarget = () => {
		if (this.#state.mutationTargetIndex !== void 0) {
			this.#state.fromStates.splice(this.#state.mutationTargetIndex, 1);
			this.#state.mutationTargetIndex = void 0;
		}
	};
	#markSelectQuery = () => {
		if (this.#state.queryType === QueryType.Delete || this.#state.queryType === QueryType.Update || this.#state.queryType === QueryType.Insert || this.#state.queryType === QueryType.Call) {
			this.#state.queryType = QueryType.Select;
			this.#state.mutationTargetIndex = void 0;
		}
	};
	distinct = () => {
		this.#state.distinct = true;
		return this;
	};
	fromRaw = (rawFrom) => {
		this.#state.fromStates.push({
			builderType: BuilderType.FromRaw,
			owner: void 0,
			tableName: void 0,
			alias: void 0,
			subquery: void 0,
			raw: rawFrom
		});
		return this;
	};
	fromRaws = (rawFroms) => {
		rawFroms.forEach((rawFrom) => {
			this.fromRaw(rawFrom);
		});
		return this;
	};
	fromTable = (tableName, alias) => {
		this.#state.fromStates.push({
			builderType: BuilderType.FromTable,
			owner: this.#config.defaultOwner,
			tableName,
			alias,
			subquery: void 0,
			raw: void 0
		});
		return this;
	};
	fromTables = (tables) => {
		tables.forEach((table) => {
			this.fromTable(table.tableName, table.alias);
		});
		return this;
	};
	fromTableWithOwner = (owner, tableName, alias) => {
		this.#state.fromStates.push({
			builderType: BuilderType.FromTable,
			owner,
			tableName,
			alias,
			subquery: void 0,
			raw: void 0
		});
		return this;
	};
	fromTablesWithOwner = (tables) => {
		tables.forEach((table) => {
			this.fromTableWithOwner(table.owner, table.tableName, table.alias);
		});
		return this;
	};
	fromWithBuilder = (alias, builder) => {
		const child = this.#child();
		builder(child);
		child.state().isInnerStatement = true;
		this.#state.fromStates.push({
			builderType: BuilderType.FromBuilder,
			owner: void 0,
			tableName: void 0,
			alias,
			subquery: child.state(),
			raw: void 0
		});
		return this;
	};
	/** Postgres/MySQL `FROM LATERAL (subquery) AS alias`. MSSQL/SQLite throw — use APPLY on MSSQL. */
	fromLateral = (alias, builder) => {
		const child = this.#child();
		builder(child);
		child.state().isInnerStatement = true;
		this.#state.fromStates.push({
			builderType: BuilderType.FromLateral,
			owner: void 0,
			tableName: void 0,
			alias,
			subquery: child.state(),
			raw: void 0,
			functionName: void 0,
			functionParams: void 0
		});
		return this;
	};
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
	fromTableFunction = (functionName, alias, params = []) => {
		this.#state.fromStates.push({
			builderType: BuilderType.FromFunction,
			owner: "",
			tableName: void 0,
			alias,
			subquery: void 0,
			raw: void 0,
			functionName,
			functionParams: [...params]
		});
		return this;
	};
	/** {@link fromTableFunction} with an explicit schema/owner qualifier. */
	fromTableFunctionWithOwner = (owner, functionName, alias, params = []) => {
		this.#state.fromStates.push({
			builderType: BuilderType.FromFunction,
			owner,
			tableName: void 0,
			alias,
			subquery: void 0,
			raw: void 0,
			functionName,
			functionParams: [...params]
		});
		return this;
	};
	/** Raw-SQL table source when structured TVF helpers are insufficient. */
	fromFunctionRaw = (rawFrom, alias) => {
		this.#state.fromStates.push({
			builderType: BuilderType.FromRaw,
			owner: void 0,
			tableName: void 0,
			alias,
			subquery: void 0,
			raw: rawFrom,
			functionName: void 0,
			functionParams: void 0
		});
		return this;
	};
	joinRaw = (rawJoin) => {
		this.#state.joinStates.push({
			builderType: BuilderType.JoinRaw,
			joinType: JoinType.None,
			owner: void 0,
			tableName: void 0,
			alias: void 0,
			subquery: void 0,
			raw: rawJoin,
			joinOnStates: []
		});
		return this;
	};
	joinRaws = (rawJoins) => {
		rawJoins.forEach((rawJoin) => {
			this.joinRaw(rawJoin);
		});
		return this;
	};
	joinTable = (joinType, tableName, alias, joinOnBuilder) => {
		const joinOnBuilderInstance = new JoinOnBuilder(this.#config);
		joinOnBuilder(joinOnBuilderInstance);
		this.#state.joinStates.push({
			builderType: BuilderType.JoinTable,
			joinType,
			owner: this.#config.defaultOwner,
			tableName,
			alias,
			subquery: void 0,
			raw: void 0,
			joinOnStates: joinOnBuilderInstance.states()
		});
		return this;
	};
	joinTables = (joins) => {
		for (const join of joins) this.joinTable(join.joinType, join.tableName, join.alias, join.joinOnBuilder);
		return this;
	};
	joinTablesWithOwner = (joins) => {
		for (const join of joins) this.joinTableWithOwner(join.joinType, join.owner, join.tableName, join.alias, join.joinOnBuilder);
		return this;
	};
	joinTableWithOwner = (joinType, owner, tableName, alias, joinOnBuilder) => {
		const joinOnBuilderInstance = new JoinOnBuilder(this.#config);
		joinOnBuilder(joinOnBuilderInstance);
		this.#state.joinStates.push({
			builderType: BuilderType.JoinTable,
			joinType,
			owner,
			tableName,
			alias,
			subquery: void 0,
			raw: void 0,
			joinOnStates: joinOnBuilderInstance.states()
		});
		return this;
	};
	joinWithBuilder = (joinType, alias, builder, joinOnBuilder) => {
		const child = this.#child();
		builder(child);
		child.state().isInnerStatement = true;
		const newJoinOnBuilder = new JoinOnBuilder(this.#config);
		joinOnBuilder(newJoinOnBuilder);
		this.#state.joinStates.push({
			builderType: BuilderType.JoinBuilder,
			joinType,
			owner: void 0,
			tableName: void 0,
			alias,
			subquery: child.state(),
			raw: void 0,
			joinOnStates: newJoinOnBuilder.states()
		});
		return this;
	};
	/** MSSQL `CROSS APPLY` / Postgres+MySQL `CROSS JOIN LATERAL`. SQLite throws. */
	joinCrossApply = (alias, builder, joinOnBuilder) => {
		return this.#joinApply(JoinType.CrossApply, alias, builder, joinOnBuilder);
	};
	/** MSSQL `OUTER APPLY` / Postgres+MySQL `LEFT JOIN LATERAL`. SQLite throws. */
	joinOuterApply = (alias, builder, joinOnBuilder) => {
		return this.#joinApply(JoinType.OuterApply, alias, builder, joinOnBuilder);
	};
	/**
	* Postgres / MySQL `CROSS JOIN LATERAL` — those engines' spelling of {@link joinCrossApply}.
	*
	* NOT a synonym for {@link joinLateral}, which is a third join taking its own ON condition. The
	* three are genuinely different — measured: `CROSS JOIN LATERAL … AS x`,
	* `LEFT JOIN LATERAL … ON TRUE`, and `JOIN LATERAL … ON <cond>` — so this renames one of them per
	* dialect rather than collapsing any two.
	*/
	joinCrossLateral = (alias, builder, joinOnBuilder) => this.joinCrossApply(alias, builder, joinOnBuilder);
	/** Postgres / MySQL `LEFT JOIN LATERAL … ON TRUE` — their spelling of {@link joinOuterApply}. */
	joinLeftLateral = (alias, builder, joinOnBuilder) => this.joinOuterApply(alias, builder, joinOnBuilder);
	/** Postgres/MySQL `JOIN LATERAL (subquery) AS alias ON ...`. MSSQL/SQLite throw. */
	joinLateral = (alias, builder, joinOnBuilder) => {
		return this.#joinApply(JoinType.Lateral, alias, builder, joinOnBuilder);
	};
	#joinApply = (joinType, alias, builder, joinOnBuilder) => {
		const child = this.#child();
		builder(child);
		child.state().isInnerStatement = true;
		if (joinOnBuilder && joinType !== JoinType.Lateral) throw new ParserError(ParserArea.Join, "CROSS APPLY, OUTER APPLY and CROSS/LEFT JOIN LATERAL take no ON clause — the subquery is already correlated, so put the predicate in its own where() instead. Only joinLateral (INNER JOIN LATERAL) has an ON slot.");
		const joinOnBuilderInstance = new JoinOnBuilder(this.#config);
		if (joinOnBuilder) joinOnBuilder(joinOnBuilderInstance);
		this.#state.joinStates.push({
			builderType: BuilderType.JoinBuilder,
			joinType,
			owner: void 0,
			tableName: void 0,
			alias,
			subquery: child.state(),
			raw: void 0,
			joinOnStates: joinOnBuilderInstance.states()
		});
		return this;
	};
	limit = (limit) => {
		if (!Number.isFinite(limit) || limit <= 0 || !Number.isInteger(limit)) throw new ParserError(ParserArea.LimitOffset, "LIMIT must be a positive integer");
		this.#state.limit = limit;
		return this;
	};
	/**
	* Limits rows and includes tied rows at the cutoff (`FETCH FIRST n ROWS WITH TIES` and dialect
	* equivalents). Requires `ORDER BY` under the same rules as {@link limit}.
	*/
	limitWithTies = (limit) => {
		this.limit(limit);
		this.#state.limitWithTies = true;
		return this;
	};
	clearLimitWithTies = () => {
		this.#state.limitWithTies = false;
		return this;
	};
	/**
	* Rows to skip. `0` is a REAL value, not "unset" — it is what legalises an ORDER BY inside an
	* MSSQL derived table or subquery (`OFFSET 0 ROWS`, measured), so it is stored and emitted.
	* Omitting the call entirely is how you say "no offset".
	*/
	offset = (offset) => {
		if (!Number.isFinite(offset) || offset < 0 || !Number.isInteger(offset)) throw new ParserError(ParserArea.LimitOffset, "OFFSET must be a non-negative integer");
		this.#state.offset = offset;
		return this;
	};
	orderByColumn = (tableNameOrAlias, columnName, direction, nulls = NullsOrder.None) => {
		this.#state.orderByStates.push({
			builderType: BuilderType.OrderByColumn,
			tableNameOrAlias,
			columnName,
			direction,
			nulls,
			raw: void 0
		});
		return this;
	};
	orderByColumns = (columns) => {
		columns.forEach((column) => {
			this.orderByColumn(column.tableNameOrAlias, column.columnName, column.direction, column.nulls ?? NullsOrder.None);
		});
		return this;
	};
	orderByRaw = (rawOrderBy) => {
		this.#state.orderByStates.push({
			builderType: BuilderType.OrderByRaw,
			tableNameOrAlias: void 0,
			columnName: void 0,
			direction: OrderByDirection.Ascending,
			nulls: NullsOrder.None,
			raw: rawOrderBy
		});
		return this;
	};
	orderByRaws = (rawOrderBys) => {
		rawOrderBys.forEach((rawOrderBy) => {
			this.orderByRaw(rawOrderBy);
		});
		return this;
	};
	/** DEBUG / TEST rendering (placeholders as text). NOT execution-safe — run {@link parsePrepared}. */
	parse = () => {
		return parse(this.state(), this.#config);
	};
	/** The ONLY execution-safe render: parameterized SQL + ordered bound values. Use this to run. */
	parsePrepared = () => {
		return parsePrepared(this.state(), this.#config);
	};
	/** DEBUG / TEST rendering with values inlined UNQUOTED. NOT execution-safe — run {@link parsePrepared}. */
	parseRaw = () => {
		return parseRaw(this.state(), this.#config);
	};
	selectAll = () => {
		this.#markSelectQuery();
		this.#state.selectStates.push({
			builderType: BuilderType.SelectAll,
			tableNameOrAlias: void 0,
			columnName: void 0,
			alias: void 0,
			subquery: void 0,
			raw: void 0,
			window: void 0
		});
		return this;
	};
	selectColumn = (tableNameOrAlias, columnName, columnAlias) => {
		this.#markSelectQuery();
		this.#state.selectStates.push({
			builderType: BuilderType.SelectColumn,
			tableNameOrAlias,
			columnName,
			alias: columnAlias,
			subquery: void 0,
			raw: void 0,
			window: void 0
		});
		return this;
	};
	selectColumns = (columns) => {
		columns.forEach((column) => {
			this.selectColumn(column.tableNameOrAlias, column.columnName, column.columnAlias);
		});
		return this;
	};
	selectRaw = (rawSelect) => {
		this.#markSelectQuery();
		this.#state.selectStates.push({
			builderType: BuilderType.SelectRaw,
			tableNameOrAlias: void 0,
			columnName: void 0,
			alias: void 0,
			subquery: void 0,
			raw: rawSelect,
			window: void 0
		});
		return this;
	};
	selectRaws = (rawSelects) => {
		rawSelects.forEach((rawSelect) => {
			this.selectRaw(rawSelect);
		});
		return this;
	};
	selectWithBuilder = (alias, builder) => {
		this.#markSelectQuery();
		const child = this.#child();
		builder(child);
		child.state().isInnerStatement = true;
		this.#state.selectStates.push({
			builderType: BuilderType.SelectBuilder,
			tableNameOrAlias: void 0,
			columnName: void 0,
			alias,
			subquery: child.state(),
			raw: void 0,
			window: void 0
		});
		return this;
	};
	/**
	* Adds a window function to the SELECT list: `fn OVER (...)`. `fn` is the function's call
	* expression, emitted verbatim (e.g. `'ROW_NUMBER()'`, `'SUM("o"."amount")'`) — like
	* {@link selectRaw}, it is not quoted/escaped, so quote any identifiers inside it yourself.
	* The `OVER` clause itself (`PARTITION BY`/`ORDER BY`/frame) is structured, via {@link WindowBuilder}.
	*/
	selectWindow = (fn, over, alias) => {
		this.#markSelectQuery();
		const windowBuilder = new WindowBuilder();
		over(windowBuilder);
		this.#state.selectStates.push({
			builderType: BuilderType.SelectWindow,
			tableNameOrAlias: void 0,
			columnName: void 0,
			alias,
			subquery: void 0,
			raw: fn,
			window: windowBuilder.state()
		});
		return this;
	};
	/**
	* Dialect-aware JSON path extraction in the SELECT list (`->`/`->>`/`JSON_EXTRACT`/`JSON_VALUE`).
	*/
	/**
	* `COUNT(x)`, `SUM(x)`, `AVG(x)`, `MIN(x)`, `MAX(x)` in the SELECT list, optionally over DISTINCT.
	*
	* Pass `'*'` as the column for `COUNT(*)` — only COUNT has a star form; `SUM(*)` is refused
	* because Postgres answers "function sum() does not exist" rather than a parse error, so nothing
	* downstream would catch it. `COUNT(DISTINCT *)` is refused for the same class of reason: every
	* dialect rejects it, and dropping the DISTINCT silently would answer a different question.
	*
	* This is a call node with one operand, not an expression AST — see default-aggregate.ts.
	*/
	selectAggregate = (aggregate, tableNameOrAlias, columnName, alias, distinct = false, filter) => {
		this.#markSelectQuery();
		this.#state.selectStates.push({
			builderType: BuilderType.SelectAggregate,
			tableNameOrAlias,
			columnName,
			alias,
			raw: void 0,
			subquery: void 0,
			window: void 0,
			jsonPath: void 0,
			jsonExtractMode: void 0,
			aggregate,
			aggregateDistinct: distinct,
			aggregateFilter: this.#captureFilter(filter)
		});
		return this;
	};
	/**
	* Runs a `FILTER (WHERE …)` callback against a child builder and returns its state, or undefined
	* when no filter was given. Only the child's WHERE predicates are read downstream; the rest of
	* the child state is inert. The dialect refusal (MySQL/MSSQL) lives in the emitter, so it fires
	* on the prepared paths too.
	*/
	#captureFilter = (filter) => {
		if (filter === void 0) return;
		const child = this.#child();
		filter(child);
		child.state().isInnerStatement = true;
		return child.state();
	};
	selectJsonExtract = (tableNameOrAlias, columnName, path, mode = JsonExtractMode.Text, alias = "") => {
		this.#markSelectQuery();
		this.#state.selectStates.push({
			builderType: BuilderType.SelectJsonExtract,
			tableNameOrAlias,
			columnName,
			alias,
			subquery: void 0,
			raw: void 0,
			window: void 0,
			jsonPath: path,
			jsonExtractMode: mode
		});
		return this;
	};
	state = () => {
		return this.#state;
	};
	where = (tableNameOrAlias, columnName, whereOperator, value) => {
		this.#combinatorTarget = "where";
		this.#state.whereStates.push({
			builderType: BuilderType.Where,
			tableNameOrAlias,
			columnName,
			whereOperator,
			raw: void 0,
			subquery: void 0,
			values: [value]
		});
		return this;
	};
	whereBetween = (tableNameOrAlias, columnName, value1, value2) => {
		this.#combinatorTarget = "where";
		this.#state.whereStates.push({
			builderType: BuilderType.WhereBetween,
			tableNameOrAlias,
			columnName,
			whereOperator: WhereOperator.Equals,
			raw: void 0,
			subquery: void 0,
			values: [value1, value2]
		});
		return this;
	};
	/**
	* @param tableNameOrAlias - Unused: `EXISTS (subquery)` never references the outer column.
	*   Kept for wire parity with the golden corpus; prefer {@link whereExists} in new code.
	* @param columnName - Unused; see `tableNameOrAlias`.
	*/
	whereExistsWithBuilder = (tableNameOrAlias, columnName, builder) => {
		this.#combinatorTarget = "where";
		const child = this.#child();
		builder(child);
		child.state().isInnerStatement = true;
		this.#state.whereStates.push({
			builderType: BuilderType.WhereExistsBuilder,
			tableNameOrAlias,
			columnName,
			whereOperator: WhereOperator.None,
			raw: void 0,
			subquery: child.state(),
			values: []
		});
		return this;
	};
	/** `WHERE EXISTS (subquery)` — the same clause as {@link whereExistsWithBuilder} without its unused table/column parameters. */
	whereExists = (builder) => {
		this.#combinatorTarget = "where";
		const child = this.#child();
		builder(child);
		child.state().isInnerStatement = true;
		this.#state.whereStates.push({
			builderType: BuilderType.WhereExistsBuilder,
			tableNameOrAlias: void 0,
			columnName: void 0,
			whereOperator: WhereOperator.None,
			raw: void 0,
			subquery: child.state(),
			values: []
		});
		return this;
	};
	whereGroup(builder) {
		this.#combinatorTarget = "where";
		this.#state.whereStates.push({
			builderType: BuilderType.WhereGroupBegin,
			tableNameOrAlias: void 0,
			columnName: void 0,
			whereOperator: WhereOperator.None,
			raw: void 0,
			values: [],
			subquery: void 0
		});
		const child = this.#child();
		builder(child);
		child.state().isInnerStatement = true;
		if (child.state().whereStates.length === 0) throw new ParserError(ParserArea.Where, "WHERE group cannot be empty");
		this.#state.whereStates.push({
			builderType: BuilderType.WhereGroupBuilder,
			tableNameOrAlias: void 0,
			columnName: void 0,
			whereOperator: WhereOperator.None,
			raw: void 0,
			values: [],
			subquery: child.state()
		});
		this.#state.whereStates.push({
			builderType: BuilderType.WhereGroupEnd,
			tableNameOrAlias: "",
			columnName: "",
			whereOperator: WhereOperator.None,
			raw: "",
			values: [],
			subquery: child.state()
		});
		return this;
	}
	whereInWithBuilder = (tableNameOrAlias, columnName, builder) => {
		this.#combinatorTarget = "where";
		const child = this.#child();
		builder(child);
		child.state().isInnerStatement = true;
		this.#state.whereStates.push({
			builderType: BuilderType.WhereInBuilder,
			tableNameOrAlias,
			columnName,
			whereOperator: WhereOperator.None,
			raw: void 0,
			subquery: child.state(),
			values: []
		});
		return this;
	};
	/**
	* A row-value comparison: `(a, b) > (?, ?)`. The keyset-pagination predicate and the composite-key
	* lookup — the only formulation of a keyset page that stays correct across ties and uses the
	* composite index. Refused on MSSQL, which has no row constructor in a comparison; the OR-chain
	* rewrite is an emulation this library does not do.
	*
	* `columns` is the tuple on the left; `values` is one value per column.
	*/
	whereRowValue = (columns, whereOperator, values) => {
		this.#combinatorTarget = "where";
		this.#state.whereStates.push({
			...createWhereState(),
			builderType: BuilderType.WhereRowValue,
			whereOperator,
			rowColumns: [...columns],
			values: [[...values]]
		});
		return this;
	};
	/**
	* A row-value `IN`: `(a, b) IN ((?,?), (?,?))`. The composite-key membership test. `tuples` is a
	* list of value-tuples, each matching the shape of `columns`. Refused on MSSQL for the same reason
	* as {@link whereRowValue}.
	*/
	whereRowValueIn = (columns, tuples) => {
		this.#combinatorTarget = "where";
		this.#state.whereStates.push({
			...createWhereState(),
			builderType: BuilderType.WhereRowValueIn,
			whereOperator: WhereOperator.None,
			rowColumns: [...columns],
			values: tuples.map((t) => [...t])
		});
		return this;
	};
	whereInValues = (tableNameOrAlias, columnName, values) => {
		this.#combinatorTarget = "where";
		values = [...values];
		this.#state.whereStates.push({
			builderType: BuilderType.WhereInValues,
			tableNameOrAlias,
			columnName,
			whereOperator: WhereOperator.None,
			raw: void 0,
			subquery: void 0,
			values
		});
		return this;
	};
	/**
	* @param tableNameOrAlias - Unused: `NOT EXISTS (subquery)` never references the outer column.
	*   Kept for wire parity with the golden corpus; prefer {@link whereNotExists} in new code.
	* @param columnName - Unused; see `tableNameOrAlias`.
	*/
	whereNotExistsWithBuilder = (tableNameOrAlias, columnName, builder) => {
		this.#combinatorTarget = "where";
		const child = this.#child();
		builder(child);
		child.state().isInnerStatement = true;
		this.#state.whereStates.push({
			builderType: BuilderType.WhereNotExistsBuilder,
			tableNameOrAlias,
			columnName,
			whereOperator: WhereOperator.None,
			raw: void 0,
			subquery: child.state(),
			values: []
		});
		return this;
	};
	/** `WHERE NOT EXISTS (subquery)` — the same clause as {@link whereNotExistsWithBuilder} without its unused table/column parameters. */
	whereNotExists = (builder) => {
		this.#combinatorTarget = "where";
		const child = this.#child();
		builder(child);
		child.state().isInnerStatement = true;
		this.#state.whereStates.push({
			builderType: BuilderType.WhereNotExistsBuilder,
			tableNameOrAlias: void 0,
			columnName: void 0,
			whereOperator: WhereOperator.None,
			raw: void 0,
			subquery: child.state(),
			values: []
		});
		return this;
	};
	whereNotInWithBuilder = (tableNameOrAlias, columnName, builder) => {
		this.#combinatorTarget = "where";
		const child = this.#child();
		builder(child);
		child.state().isInnerStatement = true;
		this.#state.whereStates.push({
			builderType: BuilderType.WhereNotInBuilder,
			tableNameOrAlias,
			columnName,
			whereOperator: WhereOperator.None,
			raw: void 0,
			subquery: child.state(),
			values: []
		});
		return this;
	};
	whereNotInValues = (tableNameOrAlias, columnName, values) => {
		this.#combinatorTarget = "where";
		values = [...values];
		this.#state.whereStates.push({
			builderType: BuilderType.WhereNotInValues,
			tableNameOrAlias,
			columnName,
			whereOperator: WhereOperator.None,
			raw: void 0,
			subquery: void 0,
			values
		});
		return this;
	};
	whereNotNull = (tableNameOrAlias, columnName) => {
		this.#combinatorTarget = "where";
		this.#state.whereStates.push({
			builderType: BuilderType.WhereNotNull,
			tableNameOrAlias,
			columnName,
			whereOperator: WhereOperator.None,
			raw: void 0,
			subquery: void 0,
			values: []
		});
		return this;
	};
	whereNull = (tableNameOrAlias, columnName) => {
		this.#combinatorTarget = "where";
		this.#state.whereStates.push({
			builderType: BuilderType.WhereNull,
			tableNameOrAlias,
			columnName,
			whereOperator: WhereOperator.None,
			raw: void 0,
			subquery: void 0,
			values: []
		});
		return this;
	};
	whereRaw = (rawWhere) => {
		this.#combinatorTarget = "where";
		this.#state.whereStates.push({
			builderType: BuilderType.WhereRaw,
			tableNameOrAlias: void 0,
			columnName: void 0,
			whereOperator: WhereOperator.None,
			raw: rawWhere,
			subquery: void 0,
			values: []
		});
		return this;
	};
	whereRaws = (rawWheres) => {
		rawWheres.forEach((rawWhere) => {
			this.whereRaw(rawWhere);
		});
		return this;
	};
	/** Compare a dialect-specific JSON path extraction against a bound value. */
	whereJsonExtract = (tableNameOrAlias, columnName, path, mode, whereOperator, value) => {
		this.#combinatorTarget = "where";
		this.#state.whereStates.push({
			builderType: BuilderType.WhereJsonExtract,
			tableNameOrAlias,
			columnName,
			whereOperator,
			raw: void 0,
			subquery: void 0,
			values: [value],
			jsonPath: path,
			jsonExtractMode: mode,
			fullTextMode: void 0,
			fullTextColumns: void 0
		});
		return this;
	};
	/** JSON containment (`@>` / `JSON_CONTAINS`) against a bound JSON document. */
	whereJsonContains = (tableNameOrAlias, columnName, value) => {
		this.#combinatorTarget = "where";
		this.#state.whereStates.push({
			builderType: BuilderType.WhereJsonContains,
			tableNameOrAlias,
			columnName,
			whereOperator: WhereOperator.None,
			raw: void 0,
			subquery: void 0,
			values: [value],
			jsonPath: void 0,
			jsonExtractMode: void 0,
			fullTextMode: void 0,
			fullTextColumns: void 0
		});
		return this;
	};
	/** Dialect-aware full-text predicate over one or more columns. */
	whereMatch = (columns, query, mode = FullTextMode.Natural) => {
		this.#combinatorTarget = "where";
		this.#state.whereStates.push({
			builderType: BuilderType.WhereFullText,
			tableNameOrAlias: void 0,
			columnName: void 0,
			whereOperator: WhereOperator.None,
			raw: void 0,
			subquery: void 0,
			values: [query],
			jsonPath: void 0,
			jsonExtractMode: void 0,
			fullTextMode: mode,
			fullTextColumns: columns.map((column) => ({
				tableNameOrAlias: column.tableNameOrAlias,
				columnName: column.columnName
			}))
		});
		return this;
	};
	/** Raw full-text SQL when structured {@link whereMatch} cannot express the predicate. */
	whereMatchRaw = (rawWhere) => this.whereRaw(rawWhere);
	groupByColumn = (tableNameOrAlias, columnName) => {
		this.#state.groupByStates.push({
			builderType: BuilderType.GroupByColumn,
			tableNameOrAlias,
			columnName,
			raw: void 0,
			groupingSets: void 0
		});
		return this;
	};
	groupByColumns = (columns) => {
		columns.forEach((column) => {
			this.groupByColumn(column.tableNameOrAlias, column.columnName);
		});
		return this;
	};
	groupByRaw = (rawGroupBy) => {
		this.#state.groupByStates.push({
			builderType: BuilderType.GroupByRaw,
			tableNameOrAlias: void 0,
			columnName: void 0,
			raw: rawGroupBy,
			groupingSets: void 0
		});
		return this;
	};
	groupByRaws = (rawGroupBys) => {
		rawGroupBys.forEach((rawGroupBy) => {
			this.groupByRaw(rawGroupBy);
		});
		return this;
	};
	/** `GROUP BY ROLLUP (...)` (MySQL: trailing `WITH ROLLUP` when columns were already grouped). */
	groupByRollup = (columns = []) => {
		this.#state.groupByStates.push({
			builderType: BuilderType.GroupByRollup,
			tableNameOrAlias: void 0,
			columnName: void 0,
			raw: void 0,
			groupingSets: columns.length > 0 ? [columns] : void 0
		});
		return this;
	};
	/** `GROUP BY CUBE (...)` — not supported on MySQL (throws at parse time). */
	groupByCube = (columns = []) => {
		this.#state.groupByStates.push({
			builderType: BuilderType.GroupByCube,
			tableNameOrAlias: void 0,
			columnName: void 0,
			raw: void 0,
			groupingSets: columns.length > 0 ? [columns] : void 0
		});
		return this;
	};
	/** `GROUP BY GROUPING SETS ((...), (...))` — not supported on MySQL (throws at parse time). */
	groupByGroupingSets = (sets) => {
		this.#state.groupByStates.push({
			builderType: BuilderType.GroupByGroupingSets,
			tableNameOrAlias: void 0,
			columnName: void 0,
			raw: void 0,
			groupingSets: sets
		});
		return this;
	};
	having = (tableNameOrAlias, columnName, whereOperator, value) => {
		this.#combinatorTarget = "having";
		this.#state.havingStates.push({
			builderType: BuilderType.Having,
			tableNameOrAlias,
			columnName,
			whereOperator,
			raw: void 0,
			subquery: void 0,
			values: [value]
		});
		return this;
	};
	/**
	* `string_agg(x, sep ORDER BY y)` — ordered string aggregation. Postgres, SQLite and MSSQL (whose
	* ordering renders as `WITHIN GROUP`). Hidden on MySQL, whose engine-native name is `groupConcat`.
	* The separator is mandatory here, because Postgres and MSSQL have no one-argument form.
	*/
	selectStringAgg = (tableNameOrAlias, columnName, separator, alias, options = {}) => {
		return this.#pushStringAgg("string_agg", tableNameOrAlias, columnName, true, separator, alias, options);
	};
	/**
	* `GROUP_CONCAT(x ORDER BY y SEPARATOR sep)` — MySQL and SQLite. The separator is OPTIONAL (the
	* engines default to `','`); omit it by leaving `separator` undefined. Hidden on Postgres and
	* MSSQL, whose engine-native name is `stringAgg`.
	*/
	selectGroupConcat = (tableNameOrAlias, columnName, alias, options = {}) => {
		const { separator, ...rest } = options;
		return this.#pushStringAgg("group_concat", tableNameOrAlias, columnName, separator !== void 0, separator, alias, rest);
	};
	/**
	* `json_agg(x)` — fold rows into a JSON ARRAY in one column. Postgres/MySQL/SQLite; hidden on
	* MSSQL 2022, which has no such function. Pass `jsonb: true` for Postgres's `jsonb_agg`.
	* DISTINCT and orderBy are available on Postgres and SQLite; MySQL refuses both.
	*/
	selectJsonArrayAgg = (tableNameOrAlias, columnName, alias, options = {}) => {
		return this.#pushJsonAgg("array", tableNameOrAlias, columnName, alias, void 0, void 0, options);
	};
	/**
	* `json_object_agg(k, v)` — fold rows into a JSON OBJECT keyed by `k`. Postgres/MySQL/SQLite;
	* hidden on MSSQL 2022. `orderBy` on Postgres/SQLite; MySQL refuses it.
	*/
	selectJsonObjectAgg = (keyTableNameOrAlias, keyColumnName, valueTableNameOrAlias, valueColumnName, alias, options = {}) => {
		return this.#pushJsonAgg("object", valueTableNameOrAlias, valueColumnName, alias, keyTableNameOrAlias, keyColumnName, options);
	};
	#pushJsonAgg = (shape, tableNameOrAlias, columnName, alias, keyTableNameOrAlias, keyColumnName, options) => {
		this.#markSelectQuery();
		this.#state.selectStates.push({
			builderType: BuilderType.SelectJsonAgg,
			tableNameOrAlias,
			columnName,
			alias,
			raw: void 0,
			subquery: void 0,
			window: void 0,
			jsonPath: void 0,
			jsonExtractMode: void 0,
			jsonAgg: {
				shape,
				jsonb: options.jsonb === true,
				distinct: options.distinct === true,
				keyTableNameOrAlias,
				keyColumnName,
				orderBy: (options.orderBy ?? []).map((o) => ({ ...o }))
			}
		});
		return this;
	};
	#pushStringAgg = (functionName, tableNameOrAlias, columnName, hasSeparator, separator, alias, options) => {
		this.#markSelectQuery();
		this.#state.selectStates.push({
			builderType: BuilderType.SelectStringAgg,
			tableNameOrAlias,
			columnName,
			alias,
			raw: void 0,
			subquery: void 0,
			window: void 0,
			jsonPath: void 0,
			jsonExtractMode: void 0,
			stringAgg: {
				functionName,
				separator,
				hasSeparator,
				distinct: options.distinct === true,
				orderBy: (options.orderBy ?? []).map((o) => ({ ...o }))
			}
		});
		return this;
	};
	/**
	* `HAVING COUNT(x) > n` — the canonical HAVING, which until now was reachable only through
	* `havingRaw`. Pass `'*'` as the column for `COUNT(*)`.
	*/
	havingAggregate = (aggregate, tableNameOrAlias, columnName, whereOperator, value, distinct = false, filter) => {
		this.#combinatorTarget = "having";
		this.#state.havingStates.push({
			builderType: BuilderType.HavingAggregate,
			tableNameOrAlias,
			columnName,
			whereOperator,
			raw: void 0,
			subquery: void 0,
			values: [value],
			aggregate,
			aggregateDistinct: distinct,
			aggregateFilter: this.#captureFilter(filter)
		});
		return this;
	};
	havingRaw = (rawHaving) => {
		this.#combinatorTarget = "having";
		this.#state.havingStates.push({
			builderType: BuilderType.HavingRaw,
			tableNameOrAlias: void 0,
			columnName: void 0,
			whereOperator: WhereOperator.None,
			raw: rawHaving,
			subquery: void 0,
			values: []
		});
		return this;
	};
	havingRaws = (rawHavings) => {
		rawHavings.forEach((rawHaving) => {
			this.havingRaw(rawHaving);
		});
		return this;
	};
	havingJsonExtract = (tableNameOrAlias, columnName, path, mode, whereOperator, value) => {
		this.#combinatorTarget = "having";
		this.#state.havingStates.push({
			builderType: BuilderType.HavingJsonExtract,
			tableNameOrAlias,
			columnName,
			whereOperator,
			raw: void 0,
			subquery: void 0,
			values: [value],
			jsonPath: path,
			jsonExtractMode: mode,
			fullTextMode: void 0,
			fullTextColumns: void 0
		});
		return this;
	};
	havingJsonContains = (tableNameOrAlias, columnName, value) => {
		this.#combinatorTarget = "having";
		this.#state.havingStates.push({
			builderType: BuilderType.HavingJsonContains,
			tableNameOrAlias,
			columnName,
			whereOperator: WhereOperator.None,
			raw: void 0,
			subquery: void 0,
			values: [value],
			jsonPath: void 0,
			jsonExtractMode: void 0,
			fullTextMode: void 0,
			fullTextColumns: void 0
		});
		return this;
	};
	havingMatch = (columns, query, mode = FullTextMode.Natural) => {
		this.#combinatorTarget = "having";
		this.#state.havingStates.push({
			builderType: BuilderType.HavingFullText,
			tableNameOrAlias: void 0,
			columnName: void 0,
			whereOperator: WhereOperator.None,
			raw: void 0,
			subquery: void 0,
			values: [query],
			jsonPath: void 0,
			jsonExtractMode: void 0,
			fullTextMode: mode,
			fullTextColumns: columns.map((column) => ({
				tableNameOrAlias: column.tableNameOrAlias,
				columnName: column.columnName
			}))
		});
		return this;
	};
	havingBetween = (tableNameOrAlias, columnName, value1, value2) => {
		this.#combinatorTarget = "having";
		this.#state.havingStates.push({
			builderType: BuilderType.HavingBetween,
			tableNameOrAlias,
			columnName,
			whereOperator: WhereOperator.Equals,
			raw: void 0,
			subquery: void 0,
			values: [value1, value2]
		});
		return this;
	};
	/** `HAVING EXISTS (subquery)` — mirrors {@link whereExists} for the HAVING clause. */
	havingExists = (builder) => {
		this.#combinatorTarget = "having";
		const child = this.#child();
		builder(child);
		child.state().isInnerStatement = true;
		this.#state.havingStates.push({
			builderType: BuilderType.HavingExistsBuilder,
			tableNameOrAlias: void 0,
			columnName: void 0,
			whereOperator: WhereOperator.None,
			raw: void 0,
			subquery: child.state(),
			values: []
		});
		return this;
	};
	/** `HAVING NOT EXISTS (subquery)` — mirrors {@link whereNotExists} for the HAVING clause. */
	havingNotExists = (builder) => {
		this.#combinatorTarget = "having";
		const child = this.#child();
		builder(child);
		child.state().isInnerStatement = true;
		this.#state.havingStates.push({
			builderType: BuilderType.HavingNotExistsBuilder,
			tableNameOrAlias: void 0,
			columnName: void 0,
			whereOperator: WhereOperator.None,
			raw: void 0,
			subquery: child.state(),
			values: []
		});
		return this;
	};
	/** Opens a parenthesized HAVING group — mirrors {@link whereGroup} for the HAVING clause. */
	havingGroup(builder) {
		this.#combinatorTarget = "having";
		this.#state.havingStates.push({
			builderType: BuilderType.HavingGroupBegin,
			tableNameOrAlias: void 0,
			columnName: void 0,
			whereOperator: WhereOperator.None,
			raw: void 0,
			values: [],
			subquery: void 0
		});
		const child = this.#child();
		builder(child);
		child.state().isInnerStatement = true;
		if (child.state().havingStates.length === 0) throw new ParserError(ParserArea.Having, "HAVING group cannot be empty");
		this.#state.havingStates.push({
			builderType: BuilderType.HavingGroupBuilder,
			tableNameOrAlias: void 0,
			columnName: void 0,
			whereOperator: WhereOperator.None,
			raw: void 0,
			values: [],
			subquery: child.state()
		});
		this.#state.havingStates.push({
			builderType: BuilderType.HavingGroupEnd,
			tableNameOrAlias: "",
			columnName: "",
			whereOperator: WhereOperator.None,
			raw: "",
			values: [],
			subquery: child.state()
		});
		return this;
	}
	havingInWithBuilder = (tableNameOrAlias, columnName, builder) => {
		this.#combinatorTarget = "having";
		const child = this.#child();
		builder(child);
		child.state().isInnerStatement = true;
		this.#state.havingStates.push({
			builderType: BuilderType.HavingInBuilder,
			tableNameOrAlias,
			columnName,
			whereOperator: WhereOperator.None,
			raw: void 0,
			subquery: child.state(),
			values: []
		});
		return this;
	};
	havingInValues = (tableNameOrAlias, columnName, values) => {
		this.#combinatorTarget = "having";
		values = [...values];
		this.#state.havingStates.push({
			builderType: BuilderType.HavingInValues,
			tableNameOrAlias,
			columnName,
			whereOperator: WhereOperator.None,
			raw: void 0,
			subquery: void 0,
			values
		});
		return this;
	};
	havingNotInWithBuilder = (tableNameOrAlias, columnName, builder) => {
		this.#combinatorTarget = "having";
		const child = this.#child();
		builder(child);
		child.state().isInnerStatement = true;
		this.#state.havingStates.push({
			builderType: BuilderType.HavingNotInBuilder,
			tableNameOrAlias,
			columnName,
			whereOperator: WhereOperator.None,
			raw: void 0,
			subquery: child.state(),
			values: []
		});
		return this;
	};
	havingNotInValues = (tableNameOrAlias, columnName, values) => {
		this.#combinatorTarget = "having";
		values = [...values];
		this.#state.havingStates.push({
			builderType: BuilderType.HavingNotInValues,
			tableNameOrAlias,
			columnName,
			whereOperator: WhereOperator.None,
			raw: void 0,
			subquery: void 0,
			values
		});
		return this;
	};
	havingNotNull = (tableNameOrAlias, columnName) => {
		this.#combinatorTarget = "having";
		this.#state.havingStates.push({
			builderType: BuilderType.HavingNotNull,
			tableNameOrAlias,
			columnName,
			whereOperator: WhereOperator.None,
			raw: void 0,
			subquery: void 0,
			values: []
		});
		return this;
	};
	havingNull = (tableNameOrAlias, columnName) => {
		this.#combinatorTarget = "having";
		this.#state.havingStates.push({
			builderType: BuilderType.HavingNull,
			tableNameOrAlias,
			columnName,
			whereOperator: WhereOperator.None,
			raw: void 0,
			subquery: void 0,
			values: []
		});
		return this;
	};
	/**
	* Assembles a T-SQL `MERGE` statement via a {@link MergeBuilder} callback — native T-SQL only;
	* the parser refuses it on every other dialect. MERGE is its own statement kind, mutually
	* exclusive with SELECT/INSERT/UPDATE/DELETE, so this flips {@link QueryType} the way
	* `insertInto` does rather than contributing a clause the way `joinTable` does.
	*/
	merge = (build) => {
		this.#state.queryType = QueryType.Merge;
		const mergeBuilder = new MergeBuilder(this.#config);
		build(mergeBuilder);
		this.#state.mergeState = mergeBuilder.state();
		return this;
	};
	insertInto = (tableName) => {
		this.#state.queryType = QueryType.Insert;
		if (!this.#state.insertState) this.#state.insertState = createInsertState();
		this.#state.insertState.owner = this.#config.defaultOwner;
		this.#state.insertState.tableName = tableName;
		return this;
	};
	insertIntoWithOwner = (owner, tableName) => {
		this.#state.queryType = QueryType.Insert;
		if (!this.#state.insertState) this.#state.insertState = createInsertState();
		this.#state.insertState.owner = owner;
		this.#state.insertState.tableName = tableName;
		return this;
	};
	insertColumns = (columns) => {
		if (!this.#state.insertState) this.#state.insertState = createInsertState();
		this.#state.insertState.columns = [...columns];
		return this;
	};
	insertValues = (values) => {
		if (!this.#state.insertState) this.#state.insertState = createInsertState();
		this.#state.insertState.values.push([...values]);
		return this;
	};
	insertRaw = (raw) => {
		this.#state.queryType = QueryType.Insert;
		if (!this.#state.insertState) this.#state.insertState = createInsertState();
		this.#state.insertState.raw = raw;
		return this;
	};
	/**
	* `INSERT ... SELECT`: the row values come from a sub-query instead of a literal `VALUES`
	* list. Mutually exclusive with {@link insertValues} — providing both throws at parse time.
	*/
	insertSelect = (builder) => {
		this.#state.queryType = QueryType.Insert;
		if (!this.#state.insertState) this.#state.insertState = createInsertState();
		const child = this.#child();
		builder(child);
		child.state().isInnerStatement = true;
		this.#state.insertState.selectSubquery = child.state();
		return this;
	};
	updateTable = (tableName, alias) => {
		this.#state.queryType = QueryType.Update;
		this.#state.fromStates.push({
			builderType: BuilderType.FromTable,
			owner: this.#config.defaultOwner,
			tableName,
			alias,
			subquery: void 0,
			raw: void 0
		});
		this.#state.mutationTargetIndex = this.#state.fromStates.length - 1;
		return this;
	};
	updateTableWithOwner = (owner, tableName, alias) => {
		this.#state.queryType = QueryType.Update;
		this.#state.fromStates.push({
			builderType: BuilderType.FromTable,
			owner,
			tableName,
			alias,
			subquery: void 0,
			raw: void 0
		});
		this.#state.mutationTargetIndex = this.#state.fromStates.length - 1;
		return this;
	};
	set = (columnName, value) => {
		this.#state.updateStates.push({
			builderType: BuilderType.UpdateColumn,
			columnName,
			value,
			raw: void 0
		});
		return this;
	};
	setColumns = (columns) => {
		columns.forEach((column) => {
			this.set(column.columnName, column.value);
		});
		return this;
	};
	setRaw = (raw) => {
		this.#state.updateStates.push({
			builderType: BuilderType.UpdateRaw,
			columnName: void 0,
			value: void 0,
			raw
		});
		return this;
	};
	deleteFrom = (tableName, alias) => {
		this.#state.queryType = QueryType.Delete;
		this.#state.fromStates.push({
			builderType: BuilderType.FromTable,
			owner: this.#config.defaultOwner,
			tableName,
			alias,
			subquery: void 0,
			raw: void 0
		});
		this.#state.mutationTargetIndex = this.#state.fromStates.length - 1;
		return this;
	};
	deleteFromWithOwner = (owner, tableName, alias) => {
		this.#state.queryType = QueryType.Delete;
		this.#state.fromStates.push({
			builderType: BuilderType.FromTable,
			owner,
			tableName,
			alias,
			subquery: void 0,
			raw: void 0
		});
		this.#state.mutationTargetIndex = this.#state.fromStates.length - 1;
		return this;
	};
	union = (builder) => {
		const child = this.#child();
		builder(child);
		child.state().isInnerStatement = true;
		this.#state.unionStates.push({
			builderType: BuilderType.Union,
			subquery: child.state(),
			raw: void 0
		});
		return this;
	};
	unionAll = (builder) => {
		const child = this.#child();
		builder(child);
		child.state().isInnerStatement = true;
		this.#state.unionStates.push({
			builderType: BuilderType.UnionAll,
			subquery: child.state(),
			raw: void 0
		});
		return this;
	};
	intersect = (builder) => {
		const child = this.#child();
		builder(child);
		child.state().isInnerStatement = true;
		this.#state.unionStates.push({
			builderType: BuilderType.Intersect,
			subquery: child.state(),
			raw: void 0
		});
		return this;
	};
	except = (builder) => {
		const child = this.#child();
		builder(child);
		child.state().isInnerStatement = true;
		this.#state.unionStates.push({
			builderType: BuilderType.Except,
			subquery: child.state(),
			raw: void 0
		});
		return this;
	};
	/** @param columns - Optional explicit column list: `WITH name (col1, col2) AS (...)`. Omit/empty leaves it out. */
	cte = (name, builder, columns = []) => {
		const child = this.#child();
		builder(child);
		child.state().isInnerStatement = true;
		child.state().isCteBody = true;
		this.#state.cteStates.push({
			builderType: BuilderType.CteBuilder,
			name,
			columns: [...columns],
			recursive: false,
			subquery: child.state(),
			raw: void 0
		});
		return this;
	};
	/** @param columns - Optional explicit column list — see {@link cte}. Recursive CTEs commonly need one, since the recursive member's SELECT list can't always be inferred from the anchor alone. */
	cteRecursive = (name, builder, columns = []) => {
		const child = this.#child();
		builder(child);
		child.state().isInnerStatement = true;
		child.state().isCteBody = true;
		this.#state.cteStates.push({
			builderType: BuilderType.CteBuilder,
			name,
			columns: [...columns],
			recursive: true,
			subquery: child.state(),
			raw: void 0
		});
		return this;
	};
	cteRaw = (name, raw) => {
		this.#state.cteStates.push({
			builderType: BuilderType.CteRaw,
			name,
			columns: [],
			recursive: false,
			subquery: void 0,
			raw
		});
		return this;
	};
	/** Removes a previously set `TOP` limit from builder state (MSSQL). */
	clearTop = () => {
		if (this.#state.customState) {
			delete this.#state.customState["top"];
			if (Object.keys(this.#state.customState).length === 0) this.#state.customState = void 0;
		}
		return this;
	};
	/** Sets the `TOP` row limit for the generated `SELECT` (MSSQL; ignored by other dialects). */
	top = (top) => {
		if (!this.#state.customState) this.#state.customState = {};
		this.#state.customState["top"] = top;
		return this;
	};
	/**
	* Returns the given columns from an INSERT/UPDATE/DELETE: PG/SQLite `RETURNING`, MSSQL
	* `OUTPUT INSERTED.…`/`OUTPUT DELETED.…`. MySQL has no equivalent and throws at parse time.
	*/
	returning = (columns) => {
		this.#state.returningState = {
			columns: [...columns],
			raw: void 0
		};
		return this;
	};
	/** Raw-SQL form of {@link returning} for expressions the structured column list cannot express. */
	returningRaw = (raw) => {
		this.#state.returningState = {
			columns: [],
			raw
		};
		return this;
	};
	clearReturning = () => {
		this.#state.returningState = void 0;
		return this;
	};
	/**
	* INSERT conflict clause: silently skip conflicting rows (PG/SQLite `ON CONFLICT ... DO
	* NOTHING`, MySQL `INSERT IGNORE`). On MSSQL, upsert is emitted as a `MERGE` statement.
	*
	* @param conflictColumns - Conflict target for PG/SQLite. Ignored on MySQL, which infers the
	*   conflicting key from the table's own constraints; kept so one call shape works everywhere.
	*/
	onConflictDoNothing = (conflictColumns = []) => {
		this.#state.upsertState = {
			action: UpsertAction.DoNothing,
			conflictColumns: [...conflictColumns],
			updateColumns: [],
			updateRaw: void 0
		};
		return this;
	};
	/**
	* INSERT conflict clause: update the existing row (PG/SQLite `ON CONFLICT ... DO UPDATE SET`,
	* MySQL `ON DUPLICATE KEY UPDATE`). On MSSQL, upsert is emitted as a `MERGE` statement.
	*
	* @param conflictColumns - Conflict target for PG/SQLite. Ignored on MySQL; see {@link onConflictDoNothing}.
	*/
	onConflictDoUpdate = (conflictColumns, updates) => {
		this.#state.upsertState = {
			action: UpsertAction.DoUpdate,
			conflictColumns: [...conflictColumns],
			updateColumns: updates.map((update) => ({
				columnName: update.columnName,
				value: update.value
			})),
			updateRaw: void 0
		};
		return this;
	};
	/** Raw-SQL form of {@link onConflictDoUpdate}'s SET list for expressions columns can't express. */
	onConflictDoUpdateRaw = (conflictColumns, raw) => {
		this.#state.upsertState = {
			action: UpsertAction.DoUpdate,
			conflictColumns: [...conflictColumns],
			updateColumns: [],
			updateRaw: raw
		};
		return this;
	};
	clearUpsert = () => {
		this.#state.upsertState = void 0;
		return this;
	};
	/** MySQL `INSERT IGNORE` — skip rows that would violate a unique key. */
	insertIgnore = () => this.onConflictDoNothing();
	/** MySQL `... ON DUPLICATE KEY UPDATE col = val, …`. */
	onDuplicateKeyUpdate = (updates) => this.onConflictDoUpdate([], updates);
	/** Raw-SQL form of {@link onDuplicateKeyUpdate}'s SET list. */
	onDuplicateKeyUpdateRaw = (raw) => this.onConflictDoUpdateRaw([], raw);
	/** Exclusive row lock on the SELECT's result rows (`FOR UPDATE`; MSSQL `WITH (UPDLOCK, ROWLOCK)`). */
	forUpdate = () => {
		this.#state.rowLock = {
			mode: RowLockMode.ForUpdate,
			wait: RowLockWait.Default
		};
		return this;
	};
	/** {@link forUpdate}, failing immediately instead of waiting on an already-locked row. */
	forUpdateNowait = () => {
		this.#state.rowLock = {
			mode: RowLockMode.ForUpdate,
			wait: RowLockWait.Nowait
		};
		return this;
	};
	/** {@link forUpdate}, silently skipping already-locked rows instead of waiting. */
	forUpdateSkipLocked = () => {
		this.#state.rowLock = {
			mode: RowLockMode.ForUpdate,
			wait: RowLockWait.SkipLocked
		};
		return this;
	};
	/** MSSQL `WITH (UPDLOCK, ROWLOCK)` — the T-SQL spelling of {@link forUpdate}. */
	updlock = () => this.forUpdate();
	/** {@link updlock}, failing immediately on an already-locked row (`, NOWAIT`). */
	updlockNowait = () => this.forUpdateNowait();
	/** {@link updlock}, skipping already-locked rows (`, READPAST`). */
	/**
	* MSSQL `WITH (UPDLOCK, ROWLOCK, READPAST)` — the T-SQL spelling of {@link forUpdateSkipLocked}.
	*
	* Named for the hint that does the work. It was `updlockSkipLocked`, which was half-translated:
	* `updlock` is T-SQL while `SkipLocked` is Postgres/MySQL vocabulary, and the already-adjudicated
	* `RowLockWait.SkipLocked` cell records MSSQL's own term as READPAST — so the op and the enum
	* contradicted each other. UPDLOCK + ROWLOCK + READPAST is Microsoft's documented queue idiom.
	*/
	updlockReadpast = () => this.forUpdateSkipLocked();
	/** Shared row lock on the SELECT's result rows (`FOR SHARE`; MSSQL `WITH (HOLDLOCK, ROWLOCK)`). */
	forShare = () => {
		this.#state.rowLock = {
			mode: RowLockMode.ForShare,
			wait: RowLockWait.Default
		};
		return this;
	};
	/** {@link forShare}, failing immediately instead of waiting on an already-locked row. */
	forShareNowait = () => {
		this.#state.rowLock = {
			mode: RowLockMode.ForShare,
			wait: RowLockWait.Nowait
		};
		return this;
	};
	/** {@link forShare}, silently skipping already-locked rows instead of waiting. */
	forShareSkipLocked = () => {
		this.#state.rowLock = {
			mode: RowLockMode.ForShare,
			wait: RowLockWait.SkipLocked
		};
		return this;
	};
	clearRowLock = () => {
		this.#state.rowLock = void 0;
		return this;
	};
	/** MySQL `USE INDEX (index)` on a FROM/JOIN table alias. Other dialects throw at parse time. */
	hintUseIndex = (tableNameOrAlias, indexName) => {
		(this.#state.hintStates ??= []).push({
			kind: HintKind.UseIndex,
			tableNameOrAlias,
			indexName,
			optionText: void 0,
			raw: void 0
		});
		return this;
	};
	/** MySQL `FORCE INDEX (index)` on a FROM/JOIN table alias. */
	hintForceIndex = (tableNameOrAlias, indexName) => {
		(this.#state.hintStates ??= []).push({
			kind: HintKind.ForceIndex,
			tableNameOrAlias,
			indexName,
			optionText: void 0,
			raw: void 0
		});
		return this;
	};
	/** MSSQL trailing `OPTION (...)` clause, e.g. `hintMssqlOption('RECOMPILE')`. */
	hintMssqlOption = (optionText) => {
		(this.#state.hintStates ??= []).push({
			kind: HintKind.MssqlOption,
			tableNameOrAlias: void 0,
			indexName: void 0,
			optionText,
			raw: void 0
		});
		return this;
	};
	/**
	* Documented raw hint escape hatch — caller owns dialect correctness (e.g. Postgres
	* `/*+ SeqScan(users) *\/` comments, optimizer-specific syntax).
	*/
	hintRaw = (rawHint) => {
		(this.#state.hintStates ??= []).push({
			kind: HintKind.Raw,
			tableNameOrAlias: void 0,
			indexName: void 0,
			optionText: void 0,
			raw: rawHint
		});
		return this;
	};
	clearHints = () => {
		this.#state.hintStates = [];
		return this;
	};
	#requireCallState = () => {
		if (!this.#state.callState) throw new ParserError(ParserArea.Call, "call a procParam* method only after callProcedure/callFunction");
		return this.#state.callState;
	};
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
	callProcedure = (name) => {
		this.#state.queryType = QueryType.Call;
		this.#state.callState = {
			kind: CallKind.Procedure,
			owner: "",
			name,
			returnIntent: CallReturnIntent.Void,
			params: []
		};
		return this;
	};
	/** {@link callProcedure}, qualified with an explicit schema/owner. */
	callProcedureWithOwner = (owner, name) => {
		this.#state.queryType = QueryType.Call;
		this.#state.callState = {
			kind: CallKind.Procedure,
			owner,
			name,
			returnIntent: CallReturnIntent.Void,
			params: []
		};
		return this;
	};
	/**
	* Invokes a stored function as an expression: `SELECT name(...)` (or, with
	* {@link CallReturnIntent.ResultSet}, `SELECT * FROM name(...)` for a set-returning /
	* table-valued function — refused on MySQL, which has none). Not supported on SQLite.
	*/
	callFunction = (name, returnIntent = CallReturnIntent.Scalar) => {
		if (returnIntent === CallReturnIntent.Void) throw new ParserError(ParserArea.Call, "callFunction requires CallReturnIntent.Scalar or CallReturnIntent.ResultSet");
		this.#state.queryType = QueryType.Call;
		this.#state.callState = {
			kind: CallKind.Function,
			owner: "",
			name,
			returnIntent,
			params: []
		};
		return this;
	};
	/** {@link callFunction}, qualified with an explicit schema/owner. */
	callFunctionWithOwner = (owner, name, returnIntent = CallReturnIntent.Scalar) => {
		if (returnIntent === CallReturnIntent.Void) throw new ParserError(ParserArea.Call, "callFunction requires CallReturnIntent.Scalar or CallReturnIntent.ResultSet");
		this.#state.queryType = QueryType.Call;
		this.#state.callState = {
			kind: CallKind.Function,
			owner,
			name,
			returnIntent,
			params: []
		};
		return this;
	};
	/** Appends a positional IN argument. */
	procParam = (value) => {
		this.#requireCallState().params.push({
			direction: CallParamDirection.In,
			name: void 0,
			value,
			sqlType: void 0,
			raw: void 0
		});
		return this;
	};
	/** Appends several positional IN arguments in order. */
	procParams = (values) => {
		values.forEach((value) => this.procParam(value));
		return this;
	};
	/**
	* Appends a named IN argument (Postgres `name := value`, MSSQL `@name = value`). Not supported
	* on MySQL, which has no named-argument call syntax — throws at parse time.
	*/
	procParamNamed = (name, value) => {
		this.#requireCallState().params.push({
			direction: CallParamDirection.In,
			name,
			value,
			sqlType: void 0,
			raw: void 0
		});
		return this;
	};
	/** Appends a positional argument as raw SQL, emitted verbatim (e.g. a computed expression). */
	procParamRaw = (raw) => {
		this.#requireCallState().params.push({
			direction: CallParamDirection.In,
			name: void 0,
			value: void 0,
			sqlType: void 0,
			raw
		});
		return this;
	};
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
	procParamOut = (name, sqlType) => {
		this.#requireCallState().params.push({
			direction: CallParamDirection.Out,
			name,
			value: void 0,
			sqlType,
			raw: void 0
		});
		return this;
	};
	/** {@link procParamOut}, additionally seeding the variable/argument with an initial `value`. */
	procParamInOut = (name, value, sqlType) => {
		this.#requireCallState().params.push({
			direction: CallParamDirection.InOut,
			name,
			value,
			sqlType,
			raw: void 0
		});
		return this;
	};
	/** Clears a previously configured procedure/function call. */
	clearCall = () => {
		this.#state.callState = void 0;
		if (this.#state.queryType === QueryType.Call) this.#state.queryType = QueryType.Select;
		return this;
	};
};
//#endregion
//#region src/builder/typed-views.ts
/**
* Anti-drift guard, checked at compile time only (never called).
*
* A view is a hand-curated subset of `QueryBuilder`'s surface. If a method a view names is renamed
* or removed on `QueryBuilder`, or its signature drifts, these assignments stop type-checking and
* the build fails — so a view can never quietly promise a method the runtime no longer has. The
* runtime `QueryBuilder` must be assignable to every view, because it genuinely has all their
* methods; the narrowing is only in the static type a facade hands back.
*/
const _assertQueryBuilderSatisfiesViews = (builder) => {};
//#endregion
//#region src/builder/multi-builder.ts
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
var MultiBuilder = class {
	#config;
	#builders = [];
	#transactionState = MultiBuilderTransactionState.TransactionOn;
	constructor(config) {
		this.#config = config;
	}
	/** Adds a named builder to the batch and returns it, typed as the engine's narrow view {@link V}. */
	addBuilder = (builderName) => {
		const builder = new QueryBuilder(this.#config);
		builder.state().builderName = builderName;
		this.#builders.push(builder);
		return builder;
	};
	/** Renders the batch as a single prepared SQL string (transaction-wrapped when enabled). */
	parse = () => {
		return parseMulti(this.states(), this.#transactionState, this.#config);
	};
	/** Renders the batch as a single raw SQL string with values inlined. DEBUG / TEST only. */
	parseRaw = () => {
		return parseMultiRaw(this.states(), this.#transactionState, this.#config);
	};
	/**
	* The execution-safe form of the batch: each builder rendered as its own prepared
	* `{ sql, params }`, in batch order. This — not {@link parse} — is what you run: a batch is
	* executed statement by statement, because placeholder numbering restarts per statement (so the
	* single {@link parse} string is not a runnable parameterized call), and {@link parse}/{@link
	* parseRaw} carry no bound values at all. Open a transaction on your own connection, run each in
	* order, and consult {@link transactionState} to decide whether to wrap them in BEGIN/COMMIT — the
	* delimiters are NOT included here.
	*/
	preparedStatements = () => {
		return this.#builders.map((builder) => builder.parsePrepared());
	};
	/** Removes a previously added builder from the batch by name. */
	removeBuilder = (builderName) => {
		this.#builders = this.#builders.filter((builder) => builder.state().builderName !== builderName);
	};
	/**
	* Reorders the batch to match the given builder names; names not present are dropped and
	* repeated names are deduplicated (first occurrence wins).
	*/
	reorderBuilders = (builderNames) => {
		const reordered = [];
		[...new Set(builderNames)].forEach((builderName) => {
			const match = this.#builders.find((builder) => builder.state().builderName === builderName);
			if (match) reordered.push(match);
		});
		this.#builders = reordered;
	};
	/** Sets whether the batch is wrapped in a transaction. */
	setTransactionState = (transactionState) => {
		this.#transactionState = transactionState;
	};
	/** Returns the {@link QueryState} of every builder in the batch, in order. */
	states = () => {
		return this.#builders.map((builder) => builder.state());
	};
	/** Returns the current transaction state of the batch. */
	transactionState = () => {
		return this.#transactionState;
	};
};
//#endregion
//#region src/configuration/runtime.ts
/** Options passed when creating Query instances or builders. */
var RuntimeConfiguration = class {
	/** Optional host-defined settings carried alongside runtime options. */
	customConfiguration = void 0;
};
//#endregion
//#region src/dialects/mssql/configuration.ts
/**
* The Microsoft SQL Server {@link Dialect}: bracket identifiers, `?` placeholders, `dbo` schema.
*
* @param rc - Runtime options (e.g. row limits) bound to the returned dialect.
*/
const mssqlConfiguration = (rc = new RuntimeConfiguration()) => ({
	databaseType: DatabaseType.Mssql,
	defaultOwner: "dbo",
	identifierDelimiters: {
		begin: "[",
		end: "]"
	},
	preparedStatementPlaceholder: "?",
	runtimeConfiguration: rc,
	transactionDelimiters: {
		begin: "BEGIN TRANSACTION",
		end: "COMMIT TRANSACTION"
	}
});
//#endregion
//#region src/dialects/mssql/query.ts
/** Main entry point for Microsoft SQL Server: produces {@link QueryBuilder}s bound to the MSSQL dialect. */
var MssqlQuery = class {
	#configuration;
	/** @param rc - Optional runtime options; defaults to a new {@link RuntimeConfiguration} when omitted. */
	constructor(rc = new RuntimeConfiguration()) {
		this.#configuration = mssqlConfiguration(rc);
	}
	/** Returns the shared MSSQL dialect configuration for this instance. */
	configuration = () => {
		return this.#configuration;
	};
	/** Creates a query builder, optionally with a one-off {@link RuntimeConfiguration}. */
	newBuilder = (rc) => {
		return new QueryBuilder(rc ? mssqlConfiguration(rc) : this.#configuration);
	};
	/** Creates a multi-statement builder for batching statements, optionally in a transaction. */
	newMultiBuilder = (rc) => {
		return new MultiBuilder(rc ? mssqlConfiguration(rc) : this.#configuration);
	};
};
//#endregion
//#region src/dialects/mysql/configuration.ts
/**
* The MySQL {@link Dialect}: backtick identifiers, `?` placeholders, no default owner.
*
* @param rc - Runtime options (e.g. row limits) bound to the returned dialect.
*/
const mysqlConfiguration = (rc = new RuntimeConfiguration()) => ({
	databaseType: DatabaseType.Mysql,
	defaultOwner: "",
	identifierDelimiters: {
		begin: "`",
		end: "`"
	},
	preparedStatementPlaceholder: "?",
	runtimeConfiguration: rc,
	transactionDelimiters: {
		begin: "START TRANSACTION",
		end: "COMMIT"
	}
});
//#endregion
//#region src/dialects/mysql/query.ts
/** Main entry point for MySQL: produces {@link QueryBuilder}s bound to the MySQL dialect. */
var MysqlQuery = class {
	#configuration;
	/** @param rc - Optional runtime options; defaults to a new {@link RuntimeConfiguration} when omitted. */
	constructor(rc = new RuntimeConfiguration()) {
		this.#configuration = mysqlConfiguration(rc);
	}
	/** Returns the shared MySQL dialect configuration for this instance. */
	configuration = () => {
		return this.#configuration;
	};
	/** Creates a query builder, optionally with a one-off {@link RuntimeConfiguration}. */
	newBuilder = (rc) => {
		return new QueryBuilder(rc ? mysqlConfiguration(rc) : this.#configuration);
	};
	/** Creates a multi-statement builder for batching statements, optionally in a transaction. */
	newMultiBuilder = (rc) => {
		return new MultiBuilder(rc ? mysqlConfiguration(rc) : this.#configuration);
	};
};
//#endregion
//#region src/dialects/postgres/configuration.ts
/**
* The PostgreSQL {@link Dialect}: double-quoted identifiers, `$` placeholders, `public` schema.
*
* @param rc - Runtime options (e.g. row limits) bound to the returned dialect.
*/
const postgresConfiguration = (rc = new RuntimeConfiguration()) => ({
	databaseType: DatabaseType.Postgres,
	defaultOwner: "public",
	identifierDelimiters: {
		begin: "\"",
		end: "\""
	},
	preparedStatementPlaceholder: "$",
	runtimeConfiguration: rc,
	transactionDelimiters: {
		begin: "BEGIN",
		end: "COMMIT"
	}
});
//#endregion
//#region src/dialects/postgres/query.ts
/** Main entry point for PostgreSQL: produces {@link QueryBuilder}s bound to the Postgres dialect. */
var PostgresQuery = class {
	#configuration;
	/** @param rc - Optional runtime options; defaults to a new {@link RuntimeConfiguration} when omitted. */
	constructor(rc = new RuntimeConfiguration()) {
		this.#configuration = postgresConfiguration(rc);
	}
	/** Returns the shared PostgreSQL dialect configuration for this instance. */
	configuration = () => {
		return this.#configuration;
	};
	/** Creates a query builder, optionally with a one-off {@link RuntimeConfiguration}. */
	newBuilder = (rc) => {
		return new QueryBuilder(rc ? postgresConfiguration(rc) : this.#configuration);
	};
	/** Creates a multi-statement builder for batching statements, optionally in a transaction. */
	newMultiBuilder = (rc) => {
		return new MultiBuilder(rc ? postgresConfiguration(rc) : this.#configuration);
	};
};
//#endregion
//#region src/dialects/sqlite/configuration.ts
/**
* The SQLite {@link Dialect}: double-quoted identifiers, `?` placeholders, no default owner.
*
* @param rc - Runtime options (e.g. row limits) bound to the returned dialect.
*/
const sqliteConfiguration = (rc = new RuntimeConfiguration()) => ({
	databaseType: DatabaseType.Sqlite,
	defaultOwner: "",
	identifierDelimiters: {
		begin: "\"",
		end: "\""
	},
	preparedStatementPlaceholder: "?",
	runtimeConfiguration: rc,
	transactionDelimiters: {
		begin: "BEGIN",
		end: "COMMIT"
	}
});
//#endregion
//#region src/dialects/sqlite/query.ts
/** Main entry point for SQLite: produces {@link QueryBuilder}s bound to the SQLite dialect. */
var SqliteQuery = class {
	#configuration;
	/** @param rc - Optional runtime options; defaults to a new {@link RuntimeConfiguration} when omitted. */
	constructor(rc = new RuntimeConfiguration()) {
		this.#configuration = sqliteConfiguration(rc);
	}
	/** Returns the shared SQLite dialect configuration for this instance. */
	configuration = () => {
		return this.#configuration;
	};
	/** Creates a query builder, optionally with a one-off {@link RuntimeConfiguration}. */
	newBuilder = (rc) => {
		return new QueryBuilder(rc ? sqliteConfiguration(rc) : this.#configuration);
	};
	/** Creates a multi-statement builder for batching statements, optionally in a transaction. */
	newMultiBuilder = (rc) => {
		return new MultiBuilder(rc ? sqliteConfiguration(rc) : this.#configuration);
	};
};
//#endregion
//#region src/state/call.ts
/** Creates a {@link CallState} with default field values. */
const createCallState = () => ({
	kind: CallKind.Procedure,
	owner: void 0,
	name: "",
	returnIntent: CallReturnIntent.Void,
	params: []
});
//#endregion
//#region src/state/cte.ts
/** Creates a {@link CteState} with default field values. */
const createCteState = () => ({
	builderType: BuilderType.None,
	name: "",
	columns: [],
	recursive: false,
	subquery: void 0,
	raw: void 0
});
//#endregion
//#region src/state/from.ts
/** Creates a {@link FromState} with default field values. */
const createFromState = () => ({
	builderType: BuilderType.None,
	owner: void 0,
	tableName: void 0,
	alias: void 0,
	subquery: void 0,
	raw: void 0,
	functionName: void 0,
	functionParams: void 0
});
//#endregion
//#region src/state/group-by.ts
/** Creates a {@link GroupByState} with default field values. */
const createGroupByState = () => ({
	builderType: BuilderType.None,
	tableNameOrAlias: void 0,
	columnName: void 0,
	raw: void 0,
	groupingSets: void 0
});
//#endregion
//#region src/state/having.ts
/** Creates a {@link HavingState} with default field values. */
const createHavingState = () => ({
	builderType: BuilderType.None,
	tableNameOrAlias: void 0,
	columnName: void 0,
	whereOperator: WhereOperator.None,
	raw: void 0,
	subquery: void 0,
	values: [],
	jsonPath: void 0,
	jsonExtractMode: void 0,
	fullTextMode: void 0,
	fullTextColumns: void 0
});
//#endregion
//#region src/state/hint.ts
/** Creates a {@link HintState} with default field values. */
const createHintState = () => ({
	kind: HintKind.Raw,
	tableNameOrAlias: void 0,
	indexName: void 0,
	optionText: void 0,
	raw: void 0
});
//#endregion
//#region src/state/join-on.ts
/** Creates a {@link JoinOnState} with default field values. */
const createJoinOnState = () => ({
	aliasLeft: void 0,
	columnLeft: void 0,
	joinOperator: JoinOperator.Equals,
	aliasRight: void 0,
	columnRight: void 0,
	joinOnOperator: JoinOnOperator.None,
	raw: void 0,
	valueRight: void 0,
	valuesRight: void 0
});
//#endregion
//#region src/state/join.ts
/** Creates a {@link JoinState} with default field values. */
const createJoinState = () => ({
	builderType: BuilderType.None,
	joinType: JoinType.Inner,
	owner: void 0,
	tableName: void 0,
	alias: void 0,
	subquery: void 0,
	raw: void 0,
	joinOnStates: []
});
//#endregion
//#region src/state/order-by.ts
/** Creates an {@link OrderByState} with default field values. */
const createOrderByState = () => ({
	builderType: BuilderType.None,
	tableNameOrAlias: void 0,
	columnName: void 0,
	direction: OrderByDirection.None,
	nulls: NullsOrder.None,
	raw: void 0
});
//#endregion
//#region src/state/returning.ts
/** Creates a {@link ReturningState} with default field values. */
const createReturningState = () => ({
	columns: [],
	raw: void 0
});
//#endregion
//#region src/state/row-lock.ts
/** Creates a {@link RowLockState} with default field values. */
const createRowLockState = () => ({
	mode: RowLockMode.None,
	wait: RowLockWait.Default
});
//#endregion
//#region src/state/select.ts
/** Creates a {@link SelectState} with default field values. */
const createSelectState = () => ({
	builderType: BuilderType.None,
	tableNameOrAlias: void 0,
	columnName: void 0,
	alias: void 0,
	subquery: void 0,
	raw: void 0,
	window: void 0,
	jsonPath: void 0,
	jsonExtractMode: void 0
});
//#endregion
//#region src/state/union.ts
/** Creates a {@link UnionState} with default field values. */
const createUnionState = () => ({
	builderType: BuilderType.None,
	subquery: void 0,
	raw: void 0
});
//#endregion
//#region src/state/update.ts
/** Creates an {@link UpdateState} with default field values. */
const createUpdateState = () => ({
	builderType: BuilderType.None,
	columnName: void 0,
	value: void 0,
	raw: void 0
});
//#endregion
//#region src/state/upsert.ts
/** Creates an {@link UpsertState} with default field values. */
const createUpsertState = () => ({
	action: UpsertAction.None,
	conflictColumns: [],
	updateColumns: [],
	updateRaw: void 0
});
//#endregion
//#region src/expression/scalar.ts
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
const Fn = {
	/**
	* NULL-skipping string concatenation (spreadsheet-style: one NULL operand must not null the whole
	* result). MSSQL `CONCAT` already skips NULLs; the others coalesce each operand to `''` — on
	* Postgres casting to text first, since its `||`/`COALESCE` reject a non-text operand (this also
	* makes `integer || integer` work). Pass two or more operands.
	*/
	concat(operands, databaseType) {
		if (databaseType === DatabaseType.Mssql) return `CONCAT(${operands.join(", ")})`;
		const parts = operands.map((operand) => databaseType === DatabaseType.Postgres ? `COALESCE(CAST(${operand} AS text), '')` : `COALESCE(${operand}, '')`);
		return databaseType === DatabaseType.Mysql ? `CONCAT(${parts.join(", ")})` : `(${parts.join(" || ")})`;
	},
	/**
	* Character length (NOT byte length). MySQL `LENGTH()` counts BYTES (5 for `café`), so use
	* `CHAR_LENGTH()`; MSSQL uses `LEN()`; Postgres/SQLite `LENGTH()` already counts characters on text.
	*/
	charLength(operand, databaseType) {
		if (databaseType === DatabaseType.Mssql) return `LEN(${operand})`;
		if (databaseType === DatabaseType.Mysql) return `CHAR_LENGTH(${operand})`;
		return `LENGTH(${operand})`;
	},
	/**
	* Round to `places` decimal places. Postgres has no `round(double precision, integer)` overload —
	* only `round(numeric, integer)` — so a float column errors; cast to numeric there. The other
	* dialects round a float directly. `places` is emitted verbatim (pass a literal like `2` or `'0'`,
	* or built SQL).
	*/
	round(operand, places, databaseType) {
		return databaseType === DatabaseType.Postgres ? `ROUND(CAST(${operand} AS numeric), ${places})` : `ROUND(${operand}, ${places})`;
	},
	/**
	* The current timestamp: `GETDATE()` on MSSQL, `NOW()` on MySQL, `datetime('now')` on SQLite, and
	* `CURRENT_TIMESTAMP` on Postgres (also the standard fallback for an unset/unknown dialect).
	*/
	now(databaseType) {
		switch (databaseType) {
			case DatabaseType.Mssql: return "GETDATE()";
			case DatabaseType.Mysql: return "NOW()";
			case DatabaseType.Sqlite: return `datetime('now')`;
			default: return "CURRENT_TIMESTAMP";
		}
	},
	/**
	* Fractional division — `numerator / denominator` that NEVER truncates to integer division.
	* Postgres, MSSQL, and SQLite all do INTEGER division when both operands are integers (`5 / 2` → 2);
	* MySQL already yields a decimal. This casts the numerator to the dialect's fractional type so the
	* result is always fractional: Postgres `numeric`, MSSQL `decimal`, SQLite `REAL`; MySQL is left as
	* a plain `/`. Division-by-zero behavior is the dialect's own (Postgres/MSSQL error, MySQL/SQLite
	* yield NULL) — this normalizes the integer-vs-decimal split only.
	*/
	divide(numerator, denominator, databaseType) {
		switch (databaseType) {
			case DatabaseType.Postgres: return `(CAST(${numerator} AS numeric) / ${denominator})`;
			case DatabaseType.Mssql: return `(CAST(${numerator} AS decimal(38, 10)) / ${denominator})`;
			case DatabaseType.Sqlite: return `(CAST(${numerator} AS REAL) / ${denominator})`;
			default: return `(${numerator} / ${denominator})`;
		}
	}
};
//#endregion
export { AGGREGATE_STAR, AggregateFunction, BuilderType, CallKind, CallParamDirection, CallReturnIntent, DatabaseType, Fn, FrameBoundType, FrameUnit, FullTextMode, HintKind, JoinOnBuilder, JoinOnOperator, JoinOperator, JoinType, JsonExtractMode, MergeBuilder, MssqlQuery, MultiBuilder, MultiBuilderTransactionState, MysqlQuery, NullsOrder, OrderByDirection, ParserArea, ParserError, PostgresQuery, QueryBuilder, QueryType, RowLockMode, RowLockWait, RuntimeConfiguration, SqliteQuery, UpsertAction, WhereOperator, WindowBuilder, _assertQueryBuilderSatisfiesViews, createCallState, createCteState, createFromState, createGroupByState, createHavingState, createHintState, createInsertState, createJoinOnState, createJoinState, createMergeState, createOrderByState, createQueryState, createReturningState, createRowLockState, createSelectState, createUnionState, createUpdateState, createUpsertState, createWhereState, createWindowState, defaultToSql, mssqlConfiguration, mysqlConfiguration, parse, parseMulti, parseMultiRaw, parsePrepared, parseRaw, postgresConfiguration, qualifiedColumn, quoteIdentifier, raw, source, sqliteConfiguration, target, value };

//# sourceMappingURL=index.mjs.map