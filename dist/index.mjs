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
	/** GROUP BY on a column reference. */
	GroupByColumn: "GroupByColumn",
	/** GROUP BY using raw SQL. */
	GroupByRaw: "GroupByRaw",
	/** HAVING condition (standard form). */
	Having: "Having",
	/** HAVING clause using raw SQL. */
	HavingRaw: "HavingRaw",
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
	WhereRaw: "WhereRaw"
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
	/** No join type / not applicable. */
	None: "None"
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
	Delete: "Delete"
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
	NotLike: "NotLike"
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
	/** ORDER BY clause. */
	OrderBy: "OrderBy",
	/** LIMIT, OFFSET, FETCH, TOP, etc. */
	LimitOffset: "LimitOffset",
	/** Cross-clause or unspecified area. */
	General: "General"
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
//#endregion
//#region src/parser/default-cte.ts
const defaultCte = (state, config, mode) => {
	const sqlHelper = new SqlHelper(mode);
	if (state.cteStates.length === 0) return sqlHelper;
	if (state.cteStates.some((cte) => cte.recursive)) sqlHelper.addSqlSnippet("WITH RECURSIVE ");
	else sqlHelper.addSqlSnippet("WITH ");
	for (let i = 0; i < state.cteStates.length; i++) {
		const cteState = state.cteStates[i];
		sqlHelper.addSqlSnippet(quoteIdentifier(cteState.name, config.identifierDelimiters));
		sqlHelper.addSqlSnippet(" AS (");
		if (cteState.builderType === BuilderType.CteRaw) sqlHelper.addSqlSnippet(cteState.raw ?? "");
		else if (cteState.subquery) {
			const subHelper = defaultToSql(cteState.subquery, config, mode);
			sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
		}
		sqlHelper.addSqlSnippet(")");
		if (i < state.cteStates.length - 1) sqlHelper.addSqlSnippet(", ");
		else sqlHelper.addSqlSnippet(" ");
	}
	return sqlHelper;
};
//#endregion
//#region src/parser/default-delete.ts
const defaultDelete = (state, config, mode) => {
	const sqlHelper = new SqlHelper(mode);
	if (state.fromStates.length === 0) throw new ParserError(ParserArea.General, "DELETE requires a table");
	const delim = config.identifierDelimiters;
	const quote = (s) => quoteIdentifier(s, delim);
	const fromState = state.fromStates[0];
	const owner = fromState.owner ?? "";
	const alias = fromState.alias ?? "";
	const qualified = (owner !== "" ? quote(owner) + "." : "") + quote(fromState.tableName ?? "");
	if (alias !== "" && config.databaseType === DatabaseType.Mssql) {
		sqlHelper.addSqlSnippet("DELETE ");
		sqlHelper.addSqlSnippet(quote(alias));
		sqlHelper.addSqlSnippet(" FROM ");
		sqlHelper.addSqlSnippet(qualified);
		sqlHelper.addSqlSnippet(" AS ");
		sqlHelper.addSqlSnippet(quote(alias));
		return sqlHelper;
	}
	sqlHelper.addSqlSnippet("DELETE FROM ");
	sqlHelper.addSqlSnippet(qualified);
	if (alias !== "") {
		sqlHelper.addSqlSnippet(" AS ");
		sqlHelper.addSqlSnippet(quote(alias));
	}
	return sqlHelper;
};
//#endregion
//#region src/parser/default-from.ts
const defaultFrom = (state, config, mode) => {
	const sqlHelper = new SqlHelper(mode);
	if (state.fromStates.length === 0) throw new ParserError(ParserArea.From, "No tables to select from");
	sqlHelper.addSqlSnippet("FROM ");
	state.fromStates.forEach((fromState, i) => {
		if (fromState.builderType === BuilderType.FromRaw) {
			sqlHelper.addSqlSnippet(fromState.raw ?? "");
			if (i < state.fromStates.length - 1) sqlHelper.addSqlSnippet(", ");
			return;
		}
		if (fromState.builderType === BuilderType.FromTable) {
			if (fromState.owner !== "" && config.databaseType === DatabaseType.Mysql) throw new ParserError(ParserArea.From, "MySQL does not support table owners");
			if (fromState.owner !== "") {
				sqlHelper.addSqlSnippet(quoteIdentifier(fromState.owner, config.identifierDelimiters));
				sqlHelper.addSqlSnippet(".");
			}
			sqlHelper.addSqlSnippet(quoteIdentifier(fromState.tableName, config.identifierDelimiters));
			if (fromState.alias !== "") {
				sqlHelper.addSqlSnippet(" AS ");
				sqlHelper.addSqlSnippet(quoteIdentifier(fromState.alias, config.identifierDelimiters));
			}
			if (i < state.fromStates.length - 1) sqlHelper.addSqlSnippet(", ");
			return;
		}
		if (fromState.builderType === BuilderType.FromBuilder) {
			const subHelper = defaultToSql(fromState.subquery, config, mode);
			sqlHelper.addSqlSnippetWithValues("(" + subHelper.getSql() + ")", subHelper.getValues());
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
//#region src/parser/default-group-by.ts
const defaultGroupBy = (state, config, mode) => {
	const sqlHelper = new SqlHelper(mode);
	if (state.groupByStates.length === 0) return sqlHelper;
	sqlHelper.addSqlSnippet("GROUP BY ");
	state.groupByStates.forEach((groupByState, i) => {
		if (groupByState.builderType === BuilderType.GroupByRaw) {
			sqlHelper.addSqlSnippet(groupByState.raw ?? "");
			if (i < state.groupByStates.length - 1) sqlHelper.addSqlSnippet(", ");
			return;
		}
		if (groupByState.builderType === BuilderType.GroupByColumn) {
			sqlHelper.addSqlSnippet(quoteIdentifier(groupByState.tableNameOrAlias, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(".");
			sqlHelper.addSqlSnippet(quoteIdentifier(groupByState.columnName, config.identifierDelimiters));
			if (i < state.groupByStates.length - 1) sqlHelper.addSqlSnippet(", ");
			return;
		}
	});
	return sqlHelper;
};
//#endregion
//#region src/parser/default-having.ts
const defaultHaving = (state, config, mode) => {
	const sqlHelper = new SqlHelper(mode);
	if (state.havingStates.length === 0) return sqlHelper;
	if (state.groupByStates.length === 0) throw new ParserError(ParserArea.General, "HAVING requires a GROUP BY clause");
	sqlHelper.addSqlSnippet("HAVING ");
	for (let i = 0; i < state.havingStates.length; i++) {
		const havingState = state.havingStates[i];
		if (i === 0 && (havingState.builderType === BuilderType.And || havingState.builderType === BuilderType.Or)) throw new ParserError(ParserArea.General, "First HAVING operator cannot be AND or OR");
		if (havingState.builderType === BuilderType.And) {
			sqlHelper.addSqlSnippet("AND ");
			continue;
		}
		if (havingState.builderType === BuilderType.Or) {
			sqlHelper.addSqlSnippet("OR ");
			continue;
		}
		if (havingState.builderType === BuilderType.HavingRaw) {
			sqlHelper.addSqlSnippet(havingState.raw ?? "");
			if (i < state.havingStates.length - 1) sqlHelper.addSqlSnippet(" ");
			continue;
		}
		if (havingState.builderType === BuilderType.Having) {
			sqlHelper.addSqlSnippet(quoteIdentifier(havingState.tableNameOrAlias, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(".");
			sqlHelper.addSqlSnippet(quoteIdentifier(havingState.columnName, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(" ");
			switch (havingState.whereOperator) {
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
			}
			sqlHelper.addSqlSnippet(" ");
			sqlHelper.addDynamicValue(havingState.values[0]);
			if (i < state.havingStates.length - 1) sqlHelper.addSqlSnippet(" ");
			continue;
		}
	}
	return sqlHelper;
};
//#endregion
//#region src/parser/default-insert.ts
const defaultInsert = (state, config, mode) => {
	const sqlHelper = new SqlHelper(mode);
	if (!state.insertState) throw new ParserError(ParserArea.General, "No insert state provided");
	const insertState = state.insertState;
	if (insertState.raw) {
		sqlHelper.addSqlSnippet(insertState.raw);
		return sqlHelper;
	}
	sqlHelper.addSqlSnippet("INSERT INTO ");
	if (insertState.owner && insertState.owner !== "") {
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
	if (insertState.values.length > 0) {
		sqlHelper.addSqlSnippet(" VALUES ");
		for (let r = 0; r < insertState.values.length; r++) {
			sqlHelper.addSqlSnippet("(");
			const row = insertState.values[r];
			for (let c = 0; c < row.length; c++) {
				sqlHelper.addDynamicValue(row[c]);
				if (c < row.length - 1) sqlHelper.addSqlSnippet(", ");
			}
			sqlHelper.addSqlSnippet(")");
			if (r < insertState.values.length - 1) sqlHelper.addSqlSnippet(", ");
		}
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
	None: "None"
};
//#endregion
//#region src/parser/default-join.ts
const defaultJoin = (state, config, mode) => {
	let sqlHelper = new SqlHelper(mode);
	if (state.joinStates.length === 0) return sqlHelper;
	for (let i = 0; i < state.joinStates.length; i++) {
		const joinState = state.joinStates[i];
		if (joinState.builderType === BuilderType.JoinRaw) {
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
				sqlHelper.addSqlSnippet("FULL OUTER JOIN ");
				break;
			case JoinType.Cross:
				sqlHelper.addSqlSnippet("CROSS JOIN ");
				break;
		}
		if (joinState.builderType === BuilderType.JoinTable) {
			if (joinState.owner !== "") {
				sqlHelper.addSqlSnippet(quoteIdentifier(joinState.owner, config.identifierDelimiters));
				sqlHelper.addSqlSnippet(".");
			}
			sqlHelper.addSqlSnippet(quoteIdentifier(joinState.tableName, config.identifierDelimiters));
			if (joinState.alias !== "") {
				sqlHelper.addSqlSnippet(" AS ");
				sqlHelper.addSqlSnippet(quoteIdentifier(joinState.alias, config.identifierDelimiters));
			}
			sqlHelper = defaultJoinOns(sqlHelper, config, joinState.joinOnStates);
			if (i < state.joinStates.length - 1) sqlHelper.addSqlSnippet(" ");
			continue;
		}
		if (joinState.builderType === BuilderType.JoinBuilder) {
			const subHelper = defaultToSql(joinState.subquery, config, mode);
			sqlHelper.addSqlSnippetWithValues("(" + subHelper.getSql() + ")", subHelper.getValues());
			if (joinState.alias !== "") {
				sqlHelper.addSqlSnippet(" AS ");
				sqlHelper.addSqlSnippet(quoteIdentifier(joinState.alias, config.identifierDelimiters));
			}
			sqlHelper = defaultJoinOns(sqlHelper, config, joinState.joinOnStates);
			if (i < state.joinStates.length - 1) sqlHelper.addSqlSnippet(" ");
		}
	}
	return sqlHelper;
};
const defaultJoinOns = (sqlHelper, config, joinOnStates) => {
	if (joinOnStates.length === 0) return sqlHelper;
	sqlHelper.addSqlSnippet(" ON ");
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
			sqlHelper.addSqlSnippet(quoteIdentifier(on.aliasLeft, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(".");
			sqlHelper.addSqlSnippet(quoteIdentifier(on.columnLeft, config.identifierDelimiters));
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
			}
			sqlHelper.addSqlSnippet(" ");
			sqlHelper.addSqlSnippet(quoteIdentifier(on.aliasRight, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(".");
			sqlHelper.addSqlSnippet(quoteIdentifier(on.columnRight, config.identifierDelimiters));
			spaceAfter();
			continue;
		}
		if (on.joinOnOperator === JoinOnOperator.Value) {
			sqlHelper.addSqlSnippet(quoteIdentifier(on.aliasLeft, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(".");
			sqlHelper.addSqlSnippet(quoteIdentifier(on.columnLeft, config.identifierDelimiters));
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
			}
			sqlHelper.addSqlSnippet(" ");
			sqlHelper.addDynamicValue(on.valueRight);
			spaceAfter();
			continue;
		}
	}
	return sqlHelper;
};
//#endregion
//#region src/parser/default-limit-offset.ts
const defaultLimitOffset = (state, config, mode) => {
	const sqlHelper = new SqlHelper(mode);
	if (state.limit === 0 && state.offset === 0) return sqlHelper;
	if (config.databaseType === DatabaseType.Mysql || config.databaseType === DatabaseType.Postgres || config.databaseType === DatabaseType.Sqlite) {
		if (state.limit > 0) {
			sqlHelper.addSqlSnippet("LIMIT ");
			sqlHelper.addSqlSnippet(state.limit.toString());
		}
		if (state.limit === 0 && !state.isInnerStatement && (state.whereStates === null || state.whereStates === void 0 || state.whereStates.length === 0)) {
			sqlHelper.addSqlSnippet("LIMIT ");
			sqlHelper.addSqlSnippet(config.runtimeConfiguration.maxRowsReturned.toString());
		}
		if (state.offset > 0) {
			if (state.limit > 0) sqlHelper.addSqlSnippet(" ");
			sqlHelper.addSqlSnippet(" OFFSET ");
			sqlHelper.addSqlSnippet(state.offset.toString());
		}
	}
	if (config.databaseType === DatabaseType.Mssql) {
		if (state.customState !== null && state.customState !== void 0 && state.customState["top"] !== null && state.customState["top"] !== void 0 && (state.limit > 0 || state.offset > 0)) throw new ParserError(ParserArea.LimitOffset, "MSSQL should not use both TOP and LIMIT/OFFSET in the same query");
		if (state.limit > 0 || state.offset > 0) {
			sqlHelper.addSqlSnippet("OFFSET ");
			sqlHelper.addSqlSnippet(state.offset.toString());
			sqlHelper.addSqlSnippet(" ROWS");
		}
		if (state.limit > 0) {
			sqlHelper.addSqlSnippet(" ");
			sqlHelper.addSqlSnippet("FETCH NEXT ");
			sqlHelper.addSqlSnippet(state.limit.toString());
			sqlHelper.addSqlSnippet(" ROWS ONLY");
		}
	}
	if (state.offset > 0 && (state.orderByStates === null || state.orderByStates === void 0 || state.orderByStates.length === 0)) throw new ParserError(ParserArea.LimitOffset, "ORDER BY is required when using OFFSET");
	return sqlHelper;
};
//#endregion
//#region src/parser/default-order-by.ts
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
			sqlHelper.addSqlSnippet(quoteIdentifier(orderByState.tableNameOrAlias, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(".");
			sqlHelper.addSqlSnippet(quoteIdentifier(orderByState.columnName, config.identifierDelimiters));
			if (orderByState.direction === OrderByDirection.Ascending) sqlHelper.addSqlSnippet(" ASC");
			else sqlHelper.addSqlSnippet(" DESC");
			if (i < state.orderByStates.length - 1) sqlHelper.addSqlSnippet(", ");
			return;
		}
	});
	return sqlHelper;
};
//#endregion
//#region src/parser/default-select.ts
const defaultSelect = (state, config, mode, options) => {
	const sqlHelper = new SqlHelper(mode);
	if (state.selectStates.length === 0) throw new ParserError(ParserArea.Select, "Select statement must have at least one select state");
	sqlHelper.addSqlSnippet("SELECT ");
	if (state.distinct) sqlHelper.addSqlSnippet("DISTINCT ");
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
			sqlHelper.addSqlSnippet(quoteIdentifier(selectState.tableNameOrAlias, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(".");
			sqlHelper.addSqlSnippet(quoteIdentifier(selectState.columnName, config.identifierDelimiters));
			if (selectState.alias !== "") {
				sqlHelper.addSqlSnippet(" AS ");
				sqlHelper.addSqlSnippet(quoteIdentifier(selectState.alias, config.identifierDelimiters));
			}
			if (i < state.selectStates.length - 1) sqlHelper.addSqlSnippet(", ");
			continue;
		}
		if (selectState.builderType === BuilderType.SelectBuilder) {
			const subHelper = defaultToSql(selectState.subquery, config, mode);
			sqlHelper.addSqlSnippetWithValues(`(${subHelper.getSql()})`, subHelper.getValues());
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
			const subHelper = defaultToSql(unionState.subquery, config, mode, options);
			sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
		}
		if (i < state.unionStates.length - 1) sqlHelper.addSqlSnippet(" ");
	}
	return sqlHelper;
};
//#endregion
//#region src/parser/default-update.ts
const defaultUpdate = (state, config, mode) => {
	const sqlHelper = new SqlHelper(mode);
	if (state.fromStates.length === 0) throw new ParserError(ParserArea.General, "UPDATE requires a table");
	if (state.updateStates.length === 0) throw new ParserError(ParserArea.General, "UPDATE requires at least one SET column");
	const delim = config.identifierDelimiters;
	const quote = (s) => quoteIdentifier(s, delim);
	const fromState = state.fromStates[0];
	const owner = fromState.owner ?? "";
	const alias = fromState.alias ?? "";
	const qualified = (owner !== "" ? quote(owner) + "." : "") + quote(fromState.tableName ?? "");
	const mssqlAliased = alias !== "" && config.databaseType === DatabaseType.Mssql;
	sqlHelper.addSqlSnippet("UPDATE ");
	if (mssqlAliased) sqlHelper.addSqlSnippet(quote(alias));
	else {
		sqlHelper.addSqlSnippet(qualified);
		if (alias !== "") {
			sqlHelper.addSqlSnippet(" AS ");
			sqlHelper.addSqlSnippet(quote(alias));
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
	if (mssqlAliased) {
		sqlHelper.addSqlSnippet(" FROM ");
		sqlHelper.addSqlSnippet(qualified);
		sqlHelper.addSqlSnippet(" AS ");
		sqlHelper.addSqlSnippet(quote(alias));
	}
	return sqlHelper;
};
//#endregion
//#region src/parser/default-where.ts
const defaultWhere = (state, config, mode) => {
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
			if (cur.subquery) {
				const subHelper = defaultWhere(cur.subquery, config, mode);
				let inner = subHelper.getSql();
				if (inner.startsWith("WHERE ")) inner = inner.slice(6);
				sqlHelper.addSqlSnippetWithValues(inner, subHelper.getValues());
			}
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.Where) {
			sqlHelper.addSqlSnippet(quoteIdentifier(cur.tableNameOrAlias, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(".");
			sqlHelper.addSqlSnippet(quoteIdentifier(cur.columnName, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(" ");
			switch (cur.whereOperator) {
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
			}
			sqlHelper.addSqlSnippet(" ");
			sqlHelper.addDynamicValue(cur.values[0]);
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.WhereBetween) {
			sqlHelper.addSqlSnippet(quoteIdentifier(cur.tableNameOrAlias, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(".");
			sqlHelper.addSqlSnippet(quoteIdentifier(cur.columnName, config.identifierDelimiters));
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
			const subHelper = defaultToSql(cur.subquery, config, mode);
			sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
			sqlHelper.addSqlSnippet(")");
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.WhereInBuilder) {
			sqlHelper.addSqlSnippet(quoteIdentifier(cur.tableNameOrAlias, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(".");
			sqlHelper.addSqlSnippet(quoteIdentifier(cur.columnName, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(" IN (");
			const subHelper = defaultToSql(cur.subquery, config, mode);
			sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
			sqlHelper.addSqlSnippet(")");
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.WhereInValues) {
			if (cur.values.length === 0) throw new ParserError(ParserArea.Where, "IN requires at least one value");
			sqlHelper.addSqlSnippet(quoteIdentifier(cur.tableNameOrAlias, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(".");
			sqlHelper.addSqlSnippet(quoteIdentifier(cur.columnName, config.identifierDelimiters));
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
			const subHelper = defaultToSql(cur.subquery, config, mode);
			sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
			sqlHelper.addSqlSnippet(")");
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.WhereNotInBuilder) {
			sqlHelper.addSqlSnippet(quoteIdentifier(cur.tableNameOrAlias, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(".");
			sqlHelper.addSqlSnippet(quoteIdentifier(cur.columnName, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(" NOT IN (");
			const subHelper = defaultToSql(cur.subquery, config, mode);
			sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
			sqlHelper.addSqlSnippet(")");
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.WhereNotInValues) {
			if (cur.values.length === 0) throw new ParserError(ParserArea.Where, "NOT IN requires at least one value");
			sqlHelper.addSqlSnippet(quoteIdentifier(cur.tableNameOrAlias, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(".");
			sqlHelper.addSqlSnippet(quoteIdentifier(cur.columnName, config.identifierDelimiters));
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
			sqlHelper.addSqlSnippet(quoteIdentifier(cur.tableNameOrAlias, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(".");
			sqlHelper.addSqlSnippet(quoteIdentifier(cur.columnName, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(" IS NOT NULL");
			spaceAfter();
			continue;
		}
		if (cur.builderType === BuilderType.WhereNull) {
			sqlHelper.addSqlSnippet(quoteIdentifier(cur.tableNameOrAlias, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(".");
			sqlHelper.addSqlSnippet(quoteIdentifier(cur.columnName, config.identifierDelimiters));
			sqlHelper.addSqlSnippet(" IS NULL");
			spaceAfter();
			continue;
		}
	}
	return sqlHelper;
};
//#endregion
//#region src/parser/to-sql.ts
/**
* Renders a {@link QueryState} to SQL by walking its clauses in order. Pure and
* dialect-driven: everything dialect-specific comes from {@link Dialect} `config`, except
* the {@link ToSqlOptions} hooks the caller threads through (MSSQL's `TOP`). Used both for
* the outer statement and, recursively, for every nested subquery.
*/
const defaultToSql = (state, config, mode, options) => {
	const sqlHelper = new SqlHelper(mode);
	if (state === null || state === void 0) throw new ParserError(ParserArea.General, "No state provided");
	if (state.cteStates.length > 0) {
		const cte = defaultCte(state, config, mode);
		sqlHelper.addSqlSnippetWithValues(cte.getSql(), cte.getValues());
	}
	if (state.queryType === QueryType.Insert) {
		const insert = defaultInsert(state, config, mode);
		sqlHelper.addSqlSnippetWithValues(insert.getSql(), insert.getValues());
		if (!state.isInnerStatement) sqlHelper.addSqlSnippet(";");
		return sqlHelper;
	}
	if (state.queryType === QueryType.Update) {
		const update = defaultUpdate(state, config, mode);
		sqlHelper.addSqlSnippetWithValues(update.getSql(), update.getValues());
		if (state.whereStates.length > 0) {
			const where = defaultWhere(state, config, mode);
			sqlHelper.addSqlSnippet(" ");
			sqlHelper.addSqlSnippetWithValues(where.getSql(), where.getValues());
		}
		if (!state.isInnerStatement) sqlHelper.addSqlSnippet(";");
		return sqlHelper;
	}
	if (state.queryType === QueryType.Delete) {
		const del = defaultDelete(state, config, mode);
		sqlHelper.addSqlSnippetWithValues(del.getSql(), del.getValues());
		if (state.whereStates.length > 0) {
			const where = defaultWhere(state, config, mode);
			sqlHelper.addSqlSnippet(" ");
			sqlHelper.addSqlSnippetWithValues(where.getSql(), where.getValues());
		}
		if (!state.isInnerStatement) sqlHelper.addSqlSnippet(";");
		return sqlHelper;
	}
	const sel = defaultSelect(state, config, mode, options);
	sqlHelper.addSqlSnippetWithValues(sel.getSql(), sel.getValues());
	const from = defaultFrom(state, config, mode);
	sqlHelper.addSqlSnippet(" ");
	sqlHelper.addSqlSnippetWithValues(from.getSql(), from.getValues());
	if (state.joinStates.length > 0) {
		const join = defaultJoin(state, config, mode);
		sqlHelper.addSqlSnippet(" ");
		sqlHelper.addSqlSnippetWithValues(join.getSql(), join.getValues());
	}
	if (state.whereStates.length > 0) {
		const where = defaultWhere(state, config, mode);
		sqlHelper.addSqlSnippet(" ");
		sqlHelper.addSqlSnippetWithValues(where.getSql(), where.getValues());
	}
	if (state.groupByStates.length > 0) {
		const groupBy = defaultGroupBy(state, config, mode);
		sqlHelper.addSqlSnippet(" ");
		sqlHelper.addSqlSnippetWithValues(groupBy.getSql(), groupBy.getValues());
	}
	if (state.havingStates.length > 0) {
		const having = defaultHaving(state, config, mode);
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
	if (state.limit > 0 || state.offset > 0) {
		const limitOffset = defaultLimitOffset(state, config, mode);
		sqlHelper.addSqlSnippet(" ");
		sqlHelper.addSqlSnippetWithValues(limitOffset.getSql(), limitOffset.getValues());
	}
	if (!state.isInnerStatement) sqlHelper.addSqlSnippet(";");
	return sqlHelper;
};
/**
* MSSQL prepends a `TOP` to the SELECT list — an explicit `.top(n)` when set, otherwise a
* safety-net `TOP (maxRowsReturned)` on an unbounded outer query (no WHERE, no LIMIT, not a
* subquery). Other dialects need no hook.
*/
const toSqlOptionsFor = (config) => {
	if (config.databaseType !== DatabaseType.Mssql) return {};
	return { beforeSelectColumns: (state, cfg, sqlHelper) => {
		if (state.customState !== null && state.customState !== void 0 && state.customState["top"] !== null && state.customState["top"] !== void 0 && state.customState["top"] > 0) {
			sqlHelper.addSqlSnippet("TOP ");
			sqlHelper.addSqlSnippet(`(${state.customState["top"]})`);
			sqlHelper.addSqlSnippet(" ");
		} else if (!state.isInnerStatement && state.limit === 0 && (!state.whereStates || state.whereStates.length === 0)) {
			sqlHelper.addSqlSnippet("TOP ");
			sqlHelper.addSqlSnippet(`(${cfg.runtimeConfiguration.maxRowsReturned})`);
			sqlHelper.addSqlSnippet(" ");
		}
	} };
};
/** A parameter value as a T-SQL literal for the sp_executesql value list. */
const mssqlParameterValue = (value) => {
	if (value === null || value === void 0) return "NULL";
	switch (typeof value) {
		case "number":
			if (!Number.isFinite(value)) throw new ParserError(ParserArea.General, `value is not a finite number: ${value}`);
			return value.toString();
		case "boolean": return value ? "1" : "0";
		case "object":
			if (value instanceof Date) return "'" + value.toISOString() + "'";
			return "N'" + JSON.stringify(value).replaceAll("'", "''") + "'";
		default: return "N'" + String(value).replaceAll("'", "''") + "'";
	}
};
/** The T-SQL declared type for an sp_executesql `@pN` parameter, inferred from the value. */
const mssqlParameterType = (value) => {
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
		sql: renderPlaceholders(sqlHelper.getSql(), (index) => "$" + (index + 1)),
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
* Renders one query state as a prepared SQL string. MSSQL returns a self-contained
* `sp_executesql`; Postgres rewrites to `$n`; the rest keep the dialect's `?` placeholder.
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
	if (transactionState === MultiBuilderTransactionState.TransactionOn) sql += config.transactionDelimiters.end + "; ";
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
	isInnerStatement: false,
	limit: 0,
	offset: 0,
	distinct: false,
	customState: void 0
});
//#endregion
//#region src/builder/join-on.ts
/**
* Fluent builder for a JOIN's `ON` condition list — `on`/`onValue` comparisons, `onRaw`
* fragments, `and`/`or` combinators, and parenthesized `onGroup`s. One class for every
* dialect; {@link states} hands the accumulated conditions to the join clause parser.
*/
var JoinOnBuilder = class JoinOnBuilder {
	#states = [];
	#config;
	constructor(config) {
		this.#config = config;
	}
	#child = () => new JoinOnBuilder(this.#config);
	/** Returns a new join-on builder, reusing this configuration unless `config` is provided. */
	newJoinOnBuilder = (config) => {
		return new JoinOnBuilder(config ?? this.#config);
	};
	and = () => {
		this.#states.push({
			joinOperator: JoinOperator.None,
			joinOnOperator: JoinOnOperator.And,
			aliasLeft: void 0,
			columnLeft: void 0,
			aliasRight: void 0,
			columnRight: void 0,
			raw: void 0,
			valueRight: void 0
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
			valueRight: void 0
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
			valueRight: void 0
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
			valueRight: void 0
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
			valueRight: void 0
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
			valueRight
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
			valueRight: void 0
		});
		return this;
	};
	states = () => {
		return this.#states;
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
	constructor(config) {
		this.#config = config;
	}
	/** A fresh builder sharing this builder's dialect — the parent of every subquery. */
	#child = () => new QueryBuilder(this.#config);
	/** Returns the dialect configuration backing this builder. */
	configuration = () => {
		return this.#config;
	};
	and = () => {
		this.#state.whereStates.push({
			builderType: BuilderType.And,
			tableNameOrAlias: void 0,
			columnName: void 0,
			whereOperator: WhereOperator.None,
			raw: void 0,
			subquery: void 0,
			values: []
		});
		return this;
	};
	clearAll = () => {
		this.#state = createQueryState();
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
		return this;
	};
	clearJoin = () => {
		this.#state.joinStates = [];
		return this;
	};
	clearLimit = () => {
		this.#state.limit = 0;
		return this;
	};
	clearOffset = () => {
		this.#state.offset = 0;
		return this;
	};
	clearOrderBy = () => {
		this.#state.orderByStates = [];
		return this;
	};
	clearSelect = () => {
		this.#state.selectStates = [];
		return this;
	};
	clearWhere = () => {
		this.#state.whereStates = [];
		return this;
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
	limit = (limit) => {
		this.#state.limit = limit;
		return this;
	};
	offset = (offset) => {
		this.#state.offset = offset;
		return this;
	};
	or = () => {
		this.#state.whereStates.push({
			builderType: BuilderType.Or,
			tableNameOrAlias: void 0,
			columnName: void 0,
			whereOperator: WhereOperator.None,
			raw: void 0,
			subquery: void 0,
			values: []
		});
		return this;
	};
	orderByColumn = (tableNameOrAlias, columnName, direction) => {
		this.#state.orderByStates.push({
			builderType: BuilderType.OrderByColumn,
			tableNameOrAlias,
			columnName,
			direction,
			raw: void 0
		});
		return this;
	};
	orderByColumns = (columns) => {
		columns.forEach((column) => {
			this.orderByColumn(column.tableNameOrAlias, column.columnName, column.direction);
		});
		return this;
	};
	orderByRaw = (rawOrderBy) => {
		this.#state.orderByStates.push({
			builderType: BuilderType.OrderByRaw,
			tableNameOrAlias: void 0,
			columnName: void 0,
			direction: OrderByDirection.Ascending,
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
		this.#state.selectStates.push({
			builderType: BuilderType.SelectAll,
			tableNameOrAlias: void 0,
			columnName: void 0,
			alias: void 0,
			subquery: void 0,
			raw: void 0
		});
		return this;
	};
	selectColumn = (tableNameOrAlias, columnName, columnAlias) => {
		this.#state.selectStates.push({
			builderType: BuilderType.SelectColumn,
			tableNameOrAlias,
			columnName,
			alias: columnAlias,
			subquery: void 0,
			raw: void 0
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
		this.#state.selectStates.push({
			builderType: BuilderType.SelectRaw,
			tableNameOrAlias: void 0,
			columnName: void 0,
			alias: void 0,
			subquery: void 0,
			raw: rawSelect
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
		const child = this.#child();
		builder(child);
		child.state().isInnerStatement = true;
		this.#state.selectStates.push({
			builderType: BuilderType.SelectBuilder,
			tableNameOrAlias: void 0,
			columnName: void 0,
			alias,
			subquery: child.state(),
			raw: void 0
		});
		return this;
	};
	state = () => {
		return this.#state;
	};
	where = (tableNameOrAlias, columnName, whereOperator, value) => {
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
	whereExistsWithBuilder = (tableNameOrAlias, columnName, builder) => {
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
	whereGroup(builder) {
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
	whereInValues = (tableNameOrAlias, columnName, values) => {
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
	whereNotExistsWithBuilder = (tableNameOrAlias, columnName, builder) => {
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
	whereNotInWithBuilder = (tableNameOrAlias, columnName, builder) => {
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
	groupByColumn = (tableNameOrAlias, columnName) => {
		this.#state.groupByStates.push({
			builderType: BuilderType.GroupByColumn,
			tableNameOrAlias,
			columnName,
			raw: void 0
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
			raw: rawGroupBy
		});
		return this;
	};
	groupByRaws = (rawGroupBys) => {
		rawGroupBys.forEach((rawGroupBy) => {
			this.groupByRaw(rawGroupBy);
		});
		return this;
	};
	having = (tableNameOrAlias, columnName, whereOperator, value) => {
		this.#state.havingStates.push({
			builderType: BuilderType.Having,
			tableNameOrAlias,
			columnName,
			whereOperator,
			raw: void 0,
			values: [value]
		});
		return this;
	};
	havingRaw = (rawHaving) => {
		this.#state.havingStates.push({
			builderType: BuilderType.HavingRaw,
			tableNameOrAlias: void 0,
			columnName: void 0,
			whereOperator: WhereOperator.None,
			raw: rawHaving,
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
		this.#state.insertState.columns = columns;
		return this;
	};
	insertValues = (values) => {
		if (!this.#state.insertState) this.#state.insertState = createInsertState();
		this.#state.insertState.values.push(values);
		return this;
	};
	insertRaw = (raw) => {
		this.#state.queryType = QueryType.Insert;
		if (!this.#state.insertState) this.#state.insertState = createInsertState();
		this.#state.insertState.raw = raw;
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
	cte = (name, builder) => {
		const child = this.#child();
		builder(child);
		child.state().isInnerStatement = true;
		this.#state.cteStates.push({
			builderType: BuilderType.CteBuilder,
			name,
			recursive: false,
			subquery: child.state(),
			raw: void 0
		});
		return this;
	};
	cteRecursive = (name, builder) => {
		const child = this.#child();
		builder(child);
		child.state().isInnerStatement = true;
		this.#state.cteStates.push({
			builderType: BuilderType.CteBuilder,
			name,
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
			recursive: false,
			subquery: void 0,
			raw
		});
		return this;
	};
	/** Removes a previously set `TOP` limit from builder state (MSSQL). */
	clearTop = () => {
		if (this.#state.customState) delete this.#state.customState["top"];
		return this;
	};
	/** Sets the `TOP` row limit for the generated `SELECT` (MSSQL; ignored by other dialects). */
	top = (top) => {
		if (!this.#state.customState) this.#state.customState = {};
		this.#state.customState["top"] = top;
		return this;
	};
};
//#endregion
//#region src/builder/multi-builder.ts
/**
* Composes multiple {@link QueryBuilder} statements into a single SQL string, optionally wrapped
* in a transaction. Obtain one from a dialect entry point (e.g.
* `new PostgresQuery().newMultiBuilder()`) rather than constructing directly. Named builders can
* be removed or reordered before rendering.
*/
var MultiBuilder = class {
	#config;
	#builders = [];
	#transactionState = MultiBuilderTransactionState.TransactionOn;
	constructor(config) {
		this.#config = config;
	}
	/** Adds a named builder to the batch and returns it for configuration. */
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
	/** Maximum number of rows to return from queries; defaults to 1000. */
	maxRowsReturned = 1e3;
	/** Optional host-defined settings carried alongside runtime options. */
	customConfiguration = void 0;
};
//#endregion
//#region src/enums/datatype.ts
/**
* A coarse value category. SQL generation does not use it — it is exposed for callers that want
* to describe or coerce column values on top of the builder.
*/
const Datatype = {
	/** Boolean value. */
	Boolean: "Boolean",
	/** Date/time value. */
	DateTime: "DateTime",
	/** Numeric value. */
	Number: "Number",
	/** String value. */
	String: "String",
	/** Unknown or unspecified type. */
	Unknown: "Unknown"
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
//#region src/state/cte.ts
/** Creates a {@link CteState} with default field values. */
const createCteState = () => ({
	builderType: BuilderType.None,
	name: "",
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
	raw: void 0
});
//#endregion
//#region src/state/group-by.ts
/** Creates a {@link GroupByState} with default field values. */
const createGroupByState = () => ({
	builderType: BuilderType.None,
	tableNameOrAlias: void 0,
	columnName: void 0,
	raw: void 0
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
	values: []
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
	valueRight: void 0
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
	raw: void 0
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
	raw: void 0
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
//#region src/state/where.ts
/** Creates a {@link WhereState} with default field values. */
const createWhereState = () => ({
	builderType: BuilderType.None,
	tableNameOrAlias: void 0,
	columnName: void 0,
	whereOperator: WhereOperator.None,
	raw: void 0,
	subquery: void 0,
	values: []
});
//#endregion
export { BuilderType, DatabaseType, Datatype, JoinOnBuilder, JoinOnOperator, JoinOperator, JoinType, MssqlQuery, MultiBuilder, MultiBuilderTransactionState, MysqlQuery, OrderByDirection, ParserArea, ParserError, PostgresQuery, QueryBuilder, QueryType, RuntimeConfiguration, SqliteQuery, WhereOperator, createCteState, createFromState, createGroupByState, createHavingState, createInsertState, createJoinOnState, createJoinState, createOrderByState, createQueryState, createSelectState, createUnionState, createUpdateState, createWhereState, defaultToSql, mssqlConfiguration, mysqlConfiguration, parse, parseMulti, parseMultiRaw, parsePrepared, parseRaw, postgresConfiguration, quoteIdentifier, sqliteConfiguration };

//# sourceMappingURL=index.mjs.map