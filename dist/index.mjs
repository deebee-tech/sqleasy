//#region src/configuration/configuration_delimiters.ts
/** Pair of delimiter strings for quoting identifiers or framing transaction blocks. */
var ConfigurationDelimiters = class {
	/** Opening delimiter (e.g. `[`, `` ` ``, or `"`). */
	begin = "";
	/** Closing delimiter matching {@link ConfigurationDelimiters.begin}. */
	end = "";
};
//#endregion
//#region src/configuration/runtime_configuration.ts
/** Options passed when creating SqlEasy instances or builders. */
var RuntimeConfiguration = class {
	/** Maximum number of rows to return from queries; defaults to 1000. */
	maxRowsReturned = 1e3;
	/** Optional host-defined settings carried alongside runtime options. */
	customConfiguration = void 0;
};
//#endregion
//#region src/enums/builder_type.ts
/**
* Internal discriminator for the kind of builder operation stored in a state entry.
* Used by the query builder to track fragments (FROM, WHERE, JOIN, etc.).
*/
let BuilderType = /* @__PURE__ */ function(BuilderType) {
	/** Logical AND between predicate groups or conditions. */
	BuilderType[BuilderType["And"] = 0] = "And";
	/** FROM clause sourced from a nested builder/subquery. */
	BuilderType[BuilderType["FromBuilder"] = 1] = "FromBuilder";
	/** FROM clause referencing a table name. */
	BuilderType[BuilderType["FromTable"] = 2] = "FromTable";
	/** FROM clause using raw SQL text. */
	BuilderType[BuilderType["FromRaw"] = 3] = "FromRaw";
	/** GROUP BY on a column reference. */
	BuilderType[BuilderType["GroupByColumn"] = 4] = "GroupByColumn";
	/** GROUP BY using raw SQL. */
	BuilderType[BuilderType["GroupByRaw"] = 5] = "GroupByRaw";
	/** HAVING condition (standard form). */
	BuilderType[BuilderType["Having"] = 6] = "Having";
	/** HAVING clause using raw SQL. */
	BuilderType[BuilderType["HavingRaw"] = 7] = "HavingRaw";
	/** INSERT INTO table/columns entry. */
	BuilderType[BuilderType["InsertInto"] = 8] = "InsertInto";
	/** INSERT values or body as raw SQL. */
	BuilderType[BuilderType["InsertRaw"] = 9] = "InsertRaw";
	/** JOIN defined via a nested builder. */
	BuilderType[BuilderType["JoinBuilder"] = 10] = "JoinBuilder";
	/** JOIN ON or clause fragment as raw SQL. */
	BuilderType[BuilderType["JoinRaw"] = 11] = "JoinRaw";
	/** JOIN targeting a table reference. */
	BuilderType[BuilderType["JoinTable"] = 12] = "JoinTable";
	/** No operation / placeholder. */
	BuilderType[BuilderType["None"] = 13] = "None";
	/** Logical OR between predicate groups or conditions. */
	BuilderType[BuilderType["Or"] = 14] = "Or";
	/** ORDER BY on a column with optional direction. */
	BuilderType[BuilderType["OrderByColumn"] = 15] = "OrderByColumn";
	/** ORDER BY using raw SQL. */
	BuilderType[BuilderType["OrderByRaw"] = 16] = "OrderByRaw";
	/** SELECT * (all columns). */
	BuilderType[BuilderType["SelectAll"] = 17] = "SelectAll";
	/** SELECT list entry from a nested builder/subquery. */
	BuilderType[BuilderType["SelectBuilder"] = 18] = "SelectBuilder";
	/** SELECT list entry for a single column/expression. */
	BuilderType[BuilderType["SelectColumn"] = 19] = "SelectColumn";
	/** SELECT list entry as raw SQL. */
	BuilderType[BuilderType["SelectRaw"] = 20] = "SelectRaw";
	/** UPDATE target table. */
	BuilderType[BuilderType["UpdateTable"] = 21] = "UpdateTable";
	/** UPDATE SET column assignment. */
	BuilderType[BuilderType["UpdateColumn"] = 22] = "UpdateColumn";
	/** UPDATE fragment as raw SQL. */
	BuilderType[BuilderType["UpdateRaw"] = 23] = "UpdateRaw";
	/** DELETE FROM table. */
	BuilderType[BuilderType["DeleteFrom"] = 24] = "DeleteFrom";
	/** UNION set operator (distinct). */
	BuilderType[BuilderType["Union"] = 25] = "Union";
	/** UNION ALL set operator. */
	BuilderType[BuilderType["UnionAll"] = 26] = "UnionAll";
	/** INTERSECT set operator. */
	BuilderType[BuilderType["Intersect"] = 27] = "Intersect";
	/** EXCEPT / MINUS set operator. */
	BuilderType[BuilderType["Except"] = 28] = "Except";
	/** Common table expression defined via a builder. */
	BuilderType[BuilderType["CteBuilder"] = 29] = "CteBuilder";
	/** CTE definition as raw SQL. */
	BuilderType[BuilderType["CteRaw"] = 30] = "CteRaw";
	/** WHERE predicate (standard comparison or helper). */
	BuilderType[BuilderType["Where"] = 31] = "Where";
	/** WHERE column BETWEEN low AND high. */
	BuilderType[BuilderType["WhereBetween"] = 32] = "WhereBetween";
	/** Opens a parenthesized WHERE group. */
	BuilderType[BuilderType["WhereGroupBegin"] = 33] = "WhereGroupBegin";
	/** Nested WHERE built from a sub-builder. */
	BuilderType[BuilderType["WhereGroupBuilder"] = 34] = "WhereGroupBuilder";
	/** Closes a parenthesized WHERE group. */
	BuilderType[BuilderType["WhereGroupEnd"] = 35] = "WhereGroupEnd";
	/** WHERE EXISTS (subquery from builder). */
	BuilderType[BuilderType["WhereExistsBuilder"] = 36] = "WhereExistsBuilder";
	/** WHERE IN (subquery from builder). */
	BuilderType[BuilderType["WhereInBuilder"] = 37] = "WhereInBuilder";
	/** WHERE IN (literal value list). */
	BuilderType[BuilderType["WhereInValues"] = 38] = "WhereInValues";
	/** WHERE NOT EXISTS (subquery from builder). */
	BuilderType[BuilderType["WhereNotExistsBuilder"] = 39] = "WhereNotExistsBuilder";
	/** WHERE NOT IN (subquery from builder). */
	BuilderType[BuilderType["WhereNotInBuilder"] = 40] = "WhereNotInBuilder";
	/** WHERE NOT IN (literal value list). */
	BuilderType[BuilderType["WhereNotInValues"] = 41] = "WhereNotInValues";
	/** WHERE column IS NOT NULL. */
	BuilderType[BuilderType["WhereNotNull"] = 42] = "WhereNotNull";
	/** WHERE column IS NULL. */
	BuilderType[BuilderType["WhereNull"] = 43] = "WhereNull";
	/** WHERE fragment as raw SQL. */
	BuilderType[BuilderType["WhereRaw"] = 44] = "WhereRaw";
	return BuilderType;
}({});
//#endregion
//#region src/enums/database_type.ts
/**
* Identifies the target SQL database dialect for generation and quoting behavior.
*/
let DatabaseType = /* @__PURE__ */ function(DatabaseType) {
	/** Microsoft SQL Server. */
	DatabaseType[DatabaseType["Mssql"] = 0] = "Mssql";
	/** PostgreSQL. */
	DatabaseType[DatabaseType["Postgres"] = 1] = "Postgres";
	/** MySQL or compatible (e.g. MariaDB). */
	DatabaseType[DatabaseType["Mysql"] = 2] = "Mysql";
	/** SQLite. */
	DatabaseType[DatabaseType["Sqlite"] = 3] = "Sqlite";
	/** Dialect not set or unrecognized. */
	DatabaseType[DatabaseType["Unknown"] = 4] = "Unknown";
	return DatabaseType;
}({});
//#endregion
//#region src/enums/join_on_operator.ts
/**
* Classifies each entry in a JOIN ON condition list (column compare, grouping, logic).
*/
let JoinOnOperator = /* @__PURE__ */ function(JoinOnOperator) {
	/** Opens a parenthesized ON predicate group. */
	JoinOnOperator[JoinOnOperator["GroupBegin"] = 0] = "GroupBegin";
	/** Closes a parenthesized ON predicate group. */
	JoinOnOperator[JoinOnOperator["GroupEnd"] = 1] = "GroupEnd";
	/** Standard ON left op right comparison. */
	JoinOnOperator[JoinOnOperator["On"] = 2] = "On";
	/** ON fragment as raw SQL. */
	JoinOnOperator[JoinOnOperator["Raw"] = 3] = "Raw";
	/** ON right-hand value or bound parameter. */
	JoinOnOperator[JoinOnOperator["Value"] = 4] = "Value";
	/** Logical AND between ON parts. */
	JoinOnOperator[JoinOnOperator["And"] = 5] = "And";
	/** Logical OR between ON parts. */
	JoinOnOperator[JoinOnOperator["Or"] = 6] = "Or";
	/** No operator / unused slot. */
	JoinOnOperator[JoinOnOperator["None"] = 7] = "None";
	return JoinOnOperator;
}({});
//#endregion
//#region src/enums/join_operator.ts
/**
* Comparison operators used in JOIN ON conditions (e.g. tableA.id = tableB.id).
*/
let JoinOperator = /* @__PURE__ */ function(JoinOperator) {
	/** Equality (=). */
	JoinOperator[JoinOperator["Equals"] = 0] = "Equals";
	/** Inequality (<> or !=). */
	JoinOperator[JoinOperator["NotEquals"] = 1] = "NotEquals";
	/** Strictly greater than (>). */
	JoinOperator[JoinOperator["GreaterThan"] = 2] = "GreaterThan";
	/** Greater than or equal (>=). */
	JoinOperator[JoinOperator["GreaterThanOrEquals"] = 3] = "GreaterThanOrEquals";
	/** Strictly less than (<). */
	JoinOperator[JoinOperator["LessThan"] = 4] = "LessThan";
	/** Less than or equal (<=). */
	JoinOperator[JoinOperator["LessThanOrEquals"] = 5] = "LessThanOrEquals";
	/** No operator specified. */
	JoinOperator[JoinOperator["None"] = 6] = "None";
	return JoinOperator;
}({});
//#endregion
//#region src/enums/join_type.ts
/**
* SQL JOIN kinds: inner, outer variants, cross join, or none.
*/
let JoinType = /* @__PURE__ */ function(JoinType) {
	/** INNER JOIN. */
	JoinType[JoinType["Inner"] = 0] = "Inner";
	/** LEFT JOIN (synonym for left outer in many dialects). */
	JoinType[JoinType["Left"] = 1] = "Left";
	/** LEFT OUTER JOIN. */
	JoinType[JoinType["LeftOuter"] = 2] = "LeftOuter";
	/** RIGHT JOIN. */
	JoinType[JoinType["Right"] = 3] = "Right";
	/** RIGHT OUTER JOIN. */
	JoinType[JoinType["RightOuter"] = 4] = "RightOuter";
	/** FULL OUTER JOIN. */
	JoinType[JoinType["FullOuter"] = 5] = "FullOuter";
	/** CROSS JOIN. */
	JoinType[JoinType["Cross"] = 6] = "Cross";
	/** No join type / not applicable. */
	JoinType[JoinType["None"] = 7] = "None";
	return JoinType;
}({});
//#endregion
//#region src/enums/multi_builder_transaction_state.ts
/**
* Whether multi-statement batches are wrapped in an explicit transaction block.
*/
let MultiBuilderTransactionState = /* @__PURE__ */ function(MultiBuilderTransactionState) {
	/** Emit BEGIN/COMMIT (or equivalent) around the batch. */
	MultiBuilderTransactionState[MultiBuilderTransactionState["TransactionOn"] = 0] = "TransactionOn";
	/** Do not wrap the batch in a transaction. */
	MultiBuilderTransactionState[MultiBuilderTransactionState["TransactionOff"] = 1] = "TransactionOff";
	/** Use default / unspecified transaction behavior. */
	MultiBuilderTransactionState[MultiBuilderTransactionState["None"] = 2] = "None";
	return MultiBuilderTransactionState;
}({});
//#endregion
//#region src/enums/order_by_direction.ts
/**
* Sort direction for ORDER BY columns and expressions.
*/
let OrderByDirection = /* @__PURE__ */ function(OrderByDirection) {
	/** Ascending (ASC). */
	OrderByDirection[OrderByDirection["Ascending"] = 0] = "Ascending";
	/** Descending (DESC). */
	OrderByDirection[OrderByDirection["Descending"] = 1] = "Descending";
	/** No direction / dialect default. */
	OrderByDirection[OrderByDirection["None"] = 2] = "None";
	return OrderByDirection;
}({});
//#endregion
//#region src/enums/parser_area.ts
/**
* Indicates which SQL clause produced a parser error for clearer diagnostics.
*/
let ParserArea = /* @__PURE__ */ function(ParserArea) {
	/** SELECT list or projections. */
	ParserArea["Select"] = "Select";
	/** FROM clause. */
	ParserArea["From"] = "From";
	/** JOIN definitions. */
	ParserArea["Join"] = "Join";
	/** WHERE clause. */
	ParserArea["Where"] = "Where";
	/** ORDER BY clause. */
	ParserArea["OrderBy"] = "OrderBy";
	/** LIMIT, OFFSET, FETCH, TOP, etc. */
	ParserArea["LimitOffset"] = "LimitOffset";
	/** Cross-clause or unspecified area. */
	ParserArea["General"] = "General";
	return ParserArea;
}({});
//#endregion
//#region src/enums/query_type.ts
/**
* High-level SQL statement kind the builder is assembling.
*/
let QueryType = /* @__PURE__ */ function(QueryType) {
	/** SELECT query. */
	QueryType[QueryType["Select"] = 0] = "Select";
	/** INSERT statement. */
	QueryType[QueryType["Insert"] = 1] = "Insert";
	/** UPDATE statement. */
	QueryType[QueryType["Update"] = 2] = "Update";
	/** DELETE statement. */
	QueryType[QueryType["Delete"] = 3] = "Delete";
	return QueryType;
}({});
//#endregion
//#region src/enums/where_operator.ts
/**
* Comparison operators for WHERE and HAVING predicates.
*/
let WhereOperator = /* @__PURE__ */ function(WhereOperator) {
	/** Equality (=). */
	WhereOperator[WhereOperator["Equals"] = 0] = "Equals";
	/** Inequality (<> or !=). */
	WhereOperator[WhereOperator["NotEquals"] = 1] = "NotEquals";
	/** Strictly greater than (>). */
	WhereOperator[WhereOperator["GreaterThan"] = 2] = "GreaterThan";
	/** Greater than or equal (>=). */
	WhereOperator[WhereOperator["GreaterThanOrEquals"] = 3] = "GreaterThanOrEquals";
	/** Strictly less than (<). */
	WhereOperator[WhereOperator["LessThan"] = 4] = "LessThan";
	/** Less than or equal (<=). */
	WhereOperator[WhereOperator["LessThanOrEquals"] = 5] = "LessThanOrEquals";
	/** No operator specified. */
	WhereOperator[WhereOperator["None"] = 6] = "None";
	return WhereOperator;
}({});
//#endregion
//#region src/helpers/parser_error.ts
/** Error thrown when SQL parsing fails; {@link ParserError.name} is `SqlEasyParserError`. */
var ParserError = class extends Error {
	/**
	* @param parserArea - Phase or region of the parser where the error occurred.
	* @param message - Human-readable parse error description.
	*/
	constructor(parserArea, message) {
		const finalMessage = `${parserArea}: ${message}`;
		super(finalMessage);
		this.name = "SqlEasyParserError";
	}
};
//#endregion
//#region src/state/insert_state.ts
/**
* Holds state for an INSERT: target table, columns, and row value sets.
* Populated by the builder; exposed via {@link SqlEasyState.insertState}.
*/
var InsertState = class {
	/** Schema or database owner qualifier for the target table. */
	owner = void 0;
	/** Target table name. */
	tableName = void 0;
	/** Column names for the INSERT column list. */
	columns = [];
	/** One inner array per row; values align with {@link InsertState.columns}. */
	values = [];
	/** Raw SQL for the INSERT when not fully represented by structured fields. */
	raw = void 0;
};
//#endregion
//#region src/state/sqleasy_state.ts
/**
* Root snapshot of query-builder state returned by {@link IBuilder.state}.
* Arrays preserve clause order; insert/update fields apply per query kind.
*/
var SqlEasyState = class {
	/** Logical name of the builder instance, if set. */
	builderName = "";
	/** High-level statement kind (SELECT, INSERT, etc.). */
	queryType = QueryType.Select;
	/** FROM sources in declaration order. */
	fromStates = [];
	/** JOIN clauses in declaration order. */
	joinStates = [];
	/** WHERE predicates in declaration order. */
	whereStates = [];
	/** ORDER BY terms in declaration order. */
	orderByStates = [];
	/** SELECT list items in declaration order. */
	selectStates = [];
	/** GROUP BY terms in declaration order. */
	groupByStates = [];
	/** HAVING predicates in declaration order. */
	havingStates = [];
	/** UNION / compound-query parts in declaration order. */
	unionStates = [];
	/** WITH (CTE) entries in declaration order. */
	cteStates = [];
	/** INSERT-specific state; undefined for non-INSERT queries. */
	insertState = void 0;
	/** UPDATE SET assignments in declaration order. */
	updateStates = [];
	/** True when this state represents a nested subquery, not the outer query. */
	isInnerStatement = false;
	/** Maximum row count (0 often means unset; dialect-specific). */
	limit = 0;
	/** Rows to skip before returning (0 often means unset). */
	offset = 0;
	/** Whether SELECT DISTINCT was requested. */
	distinct = false;
	/** Opaque hook for dialect- or app-specific extensions. */
	customState = void 0;
};
//#endregion
//#region src/builder/default_builder.ts
var DefaultBuilder = class {
	_sqlEasyState = new SqlEasyState();
	_config;
	constructor(config) {
		this._config = config;
	}
	and = () => {
		this._sqlEasyState.whereStates.push({
			builderType: BuilderType.And,
			tableNameOrAlias: void 0,
			columnName: void 0,
			whereOperator: WhereOperator.None,
			raw: void 0,
			sqlEasyState: void 0,
			values: []
		});
		return this;
	};
	clearAll = () => {
		this._sqlEasyState = new SqlEasyState();
		return this;
	};
	clearFrom = () => {
		this._sqlEasyState.fromStates = [];
		return this;
	};
	clearGroupBy = () => {
		this._sqlEasyState.groupByStates = [];
		return this;
	};
	clearHaving = () => {
		this._sqlEasyState.havingStates = [];
		return this;
	};
	clearJoin = () => {
		this._sqlEasyState.joinStates = [];
		return this;
	};
	clearLimit = () => {
		this._sqlEasyState.limit = 0;
		return this;
	};
	clearOffset = () => {
		this._sqlEasyState.offset = 0;
		return this;
	};
	clearOrderBy = () => {
		this._sqlEasyState.orderByStates = [];
		return this;
	};
	clearSelect = () => {
		this._sqlEasyState.selectStates = [];
		return this;
	};
	clearWhere = () => {
		this._sqlEasyState.whereStates = [];
		return this;
	};
	distinct = () => {
		this._sqlEasyState.distinct = true;
		return this;
	};
	fromRaw = (rawFrom) => {
		this._sqlEasyState.fromStates.push({
			builderType: BuilderType.FromRaw,
			owner: void 0,
			tableName: void 0,
			alias: void 0,
			sqlEasyState: void 0,
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
		this._sqlEasyState.fromStates.push({
			builderType: BuilderType.FromTable,
			owner: this._config.defaultOwner(),
			tableName,
			alias,
			sqlEasyState: void 0,
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
		this._sqlEasyState.fromStates.push({
			builderType: BuilderType.FromTable,
			owner,
			tableName,
			alias,
			sqlEasyState: void 0,
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
		const newBuilder = this.newBuilder();
		builder(newBuilder);
		newBuilder.state().isInnerStatement = true;
		this._sqlEasyState.fromStates.push({
			builderType: BuilderType.FromBuilder,
			owner: void 0,
			tableName: void 0,
			alias,
			sqlEasyState: newBuilder.state(),
			raw: void 0
		});
		return this;
	};
	joinRaw = (rawJoin) => {
		this._sqlEasyState.joinStates.push({
			builderType: BuilderType.JoinRaw,
			joinType: JoinType.None,
			owner: void 0,
			tableName: void 0,
			alias: void 0,
			sqlEasyState: void 0,
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
		const joinOnBuilderInstance = this.newJoinOnBuilder();
		joinOnBuilder(joinOnBuilderInstance);
		this._sqlEasyState.joinStates.push({
			builderType: BuilderType.JoinTable,
			joinType,
			owner: this._config.defaultOwner(),
			tableName,
			alias,
			sqlEasyState: void 0,
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
		const joinOnBuilderInstance = this.newJoinOnBuilder();
		joinOnBuilder(joinOnBuilderInstance);
		this._sqlEasyState.joinStates.push({
			builderType: BuilderType.JoinTable,
			joinType,
			owner,
			tableName,
			alias,
			sqlEasyState: void 0,
			raw: void 0,
			joinOnStates: joinOnBuilderInstance.states()
		});
		return this;
	};
	joinWithBuilder = (joinType, alias, builder, joinOnBuilder) => {
		const newBuilder = this.newBuilder();
		builder(newBuilder);
		newBuilder.state().isInnerStatement = true;
		const newJoinOnBuilder = this.newJoinOnBuilder();
		joinOnBuilder(newJoinOnBuilder);
		this._sqlEasyState.joinStates.push({
			builderType: BuilderType.JoinBuilder,
			joinType,
			owner: void 0,
			tableName: void 0,
			alias,
			sqlEasyState: newBuilder.state(),
			raw: void 0,
			joinOnStates: newJoinOnBuilder.states()
		});
		return this;
	};
	limit = (limit) => {
		this._sqlEasyState.limit = limit;
		return this;
	};
	offset = (offset) => {
		this._sqlEasyState.offset = offset;
		return this;
	};
	or = () => {
		this._sqlEasyState.whereStates.push({
			builderType: BuilderType.Or,
			tableNameOrAlias: void 0,
			columnName: void 0,
			whereOperator: WhereOperator.None,
			raw: void 0,
			sqlEasyState: void 0,
			values: []
		});
		return this;
	};
	orderByColumn = (tableNameOrAlias, columnName, direction) => {
		this._sqlEasyState.orderByStates.push({
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
		this._sqlEasyState.orderByStates.push({
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
	parse = () => {
		return this.newParser().toSql(this.state());
	};
	parseRaw = () => {
		return this.newParser().toSqlRaw(this.state());
	};
	selectAll = () => {
		this._sqlEasyState.selectStates.push({
			builderType: BuilderType.SelectAll,
			tableNameOrAlias: void 0,
			columnName: void 0,
			alias: void 0,
			sqlEasyState: void 0,
			raw: void 0
		});
		return this;
	};
	selectColumn = (tableNameOrAlias, columnName, columnAlias) => {
		this._sqlEasyState.selectStates.push({
			builderType: BuilderType.SelectColumn,
			tableNameOrAlias,
			columnName,
			alias: columnAlias,
			sqlEasyState: void 0,
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
		this._sqlEasyState.selectStates.push({
			builderType: BuilderType.SelectRaw,
			tableNameOrAlias: void 0,
			columnName: void 0,
			alias: void 0,
			sqlEasyState: void 0,
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
		const newBuilder = this.newBuilder();
		builder(newBuilder);
		newBuilder.state().isInnerStatement = true;
		this._sqlEasyState.selectStates.push({
			builderType: BuilderType.SelectBuilder,
			tableNameOrAlias: void 0,
			columnName: void 0,
			alias,
			sqlEasyState: newBuilder.state(),
			raw: void 0
		});
		return this;
	};
	state = () => {
		return this._sqlEasyState;
	};
	where = (tableNameOrAlias, columnName, whereOperator, value) => {
		this._sqlEasyState.whereStates.push({
			builderType: BuilderType.Where,
			tableNameOrAlias,
			columnName,
			whereOperator,
			raw: void 0,
			sqlEasyState: void 0,
			values: [value]
		});
		return this;
	};
	whereBetween = (tableNameOrAlias, columnName, value1, value2) => {
		this._sqlEasyState.whereStates.push({
			builderType: BuilderType.WhereBetween,
			tableNameOrAlias,
			columnName,
			whereOperator: WhereOperator.Equals,
			raw: void 0,
			sqlEasyState: void 0,
			values: [value1, value2]
		});
		return this;
	};
	whereExistsWithBuilder = (tableNameOrAlias, columnName, builder) => {
		const newBuilder = this.newBuilder();
		builder(newBuilder);
		newBuilder.state().isInnerStatement = true;
		this._sqlEasyState.whereStates.push({
			builderType: BuilderType.WhereExistsBuilder,
			tableNameOrAlias,
			columnName,
			whereOperator: WhereOperator.None,
			raw: void 0,
			sqlEasyState: newBuilder.state(),
			values: []
		});
		return this;
	};
	whereGroup(builder) {
		this._sqlEasyState.whereStates.push({
			builderType: BuilderType.WhereGroupBegin,
			tableNameOrAlias: void 0,
			columnName: void 0,
			whereOperator: WhereOperator.None,
			raw: void 0,
			values: [],
			sqlEasyState: void 0
		});
		const newBuilder = this.newBuilder();
		builder(newBuilder);
		newBuilder.state().isInnerStatement = true;
		this._sqlEasyState.whereStates.push({
			builderType: BuilderType.WhereGroupBuilder,
			tableNameOrAlias: void 0,
			columnName: void 0,
			whereOperator: WhereOperator.None,
			raw: void 0,
			values: [],
			sqlEasyState: newBuilder.state()
		});
		this._sqlEasyState.whereStates.push({
			builderType: BuilderType.WhereGroupEnd,
			tableNameOrAlias: "",
			columnName: "",
			whereOperator: WhereOperator.None,
			raw: "",
			values: [],
			sqlEasyState: newBuilder.state()
		});
		return this;
	}
	whereInWithBuilder = (tableNameOrAlias, columnName, builder) => {
		const newBuilder = this.newBuilder();
		builder(newBuilder);
		newBuilder.state().isInnerStatement = true;
		this._sqlEasyState.whereStates.push({
			builderType: BuilderType.WhereInBuilder,
			tableNameOrAlias,
			columnName,
			whereOperator: WhereOperator.None,
			raw: void 0,
			sqlEasyState: newBuilder.state(),
			values: []
		});
		return this;
	};
	whereInValues = (tableNameOrAlias, columnName, values) => {
		this._sqlEasyState.whereStates.push({
			builderType: BuilderType.WhereInValues,
			tableNameOrAlias,
			columnName,
			whereOperator: WhereOperator.None,
			raw: void 0,
			sqlEasyState: void 0,
			values
		});
		return this;
	};
	whereNotExistsWithBuilder = (tableNameOrAlias, columnName, builder) => {
		const newBuilder = this.newBuilder();
		builder(newBuilder);
		newBuilder.state().isInnerStatement = true;
		this._sqlEasyState.whereStates.push({
			builderType: BuilderType.WhereNotExistsBuilder,
			tableNameOrAlias,
			columnName,
			whereOperator: WhereOperator.None,
			raw: void 0,
			sqlEasyState: newBuilder.state(),
			values: []
		});
		return this;
	};
	whereNotInWithBuilder = (tableNameOrAlias, columnName, builder) => {
		const newBuilder = this.newBuilder();
		builder(newBuilder);
		newBuilder.state().isInnerStatement = true;
		this._sqlEasyState.whereStates.push({
			builderType: BuilderType.WhereNotInBuilder,
			tableNameOrAlias,
			columnName,
			whereOperator: WhereOperator.None,
			raw: void 0,
			sqlEasyState: newBuilder.state(),
			values: []
		});
		return this;
	};
	whereNotInValues = (tableNameOrAlias, columnName, values) => {
		this._sqlEasyState.whereStates.push({
			builderType: BuilderType.WhereNotInValues,
			tableNameOrAlias,
			columnName,
			whereOperator: WhereOperator.None,
			raw: void 0,
			sqlEasyState: void 0,
			values
		});
		return this;
	};
	whereNotNull = (tableNameOrAlias, columnName) => {
		this._sqlEasyState.whereStates.push({
			builderType: BuilderType.WhereNotNull,
			tableNameOrAlias,
			columnName,
			whereOperator: WhereOperator.None,
			raw: void 0,
			sqlEasyState: void 0,
			values: []
		});
		return this;
	};
	whereNull = (tableNameOrAlias, columnName) => {
		this._sqlEasyState.whereStates.push({
			builderType: BuilderType.WhereNull,
			tableNameOrAlias,
			columnName,
			whereOperator: WhereOperator.None,
			raw: void 0,
			sqlEasyState: void 0,
			values: []
		});
		return this;
	};
	whereRaw = (rawWhere) => {
		this._sqlEasyState.whereStates.push({
			builderType: BuilderType.WhereRaw,
			tableNameOrAlias: void 0,
			columnName: void 0,
			whereOperator: WhereOperator.None,
			raw: rawWhere,
			sqlEasyState: void 0,
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
		this._sqlEasyState.groupByStates.push({
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
		this._sqlEasyState.groupByStates.push({
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
		this._sqlEasyState.havingStates.push({
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
		this._sqlEasyState.havingStates.push({
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
		this._sqlEasyState.queryType = QueryType.Insert;
		if (!this._sqlEasyState.insertState) this._sqlEasyState.insertState = new InsertState();
		this._sqlEasyState.insertState.owner = this._config.defaultOwner();
		this._sqlEasyState.insertState.tableName = tableName;
		return this;
	};
	insertIntoWithOwner = (owner, tableName) => {
		this._sqlEasyState.queryType = QueryType.Insert;
		if (!this._sqlEasyState.insertState) this._sqlEasyState.insertState = new InsertState();
		this._sqlEasyState.insertState.owner = owner;
		this._sqlEasyState.insertState.tableName = tableName;
		return this;
	};
	insertColumns = (columns) => {
		if (!this._sqlEasyState.insertState) this._sqlEasyState.insertState = new InsertState();
		this._sqlEasyState.insertState.columns = columns;
		return this;
	};
	insertValues = (values) => {
		if (!this._sqlEasyState.insertState) this._sqlEasyState.insertState = new InsertState();
		this._sqlEasyState.insertState.values.push(values);
		return this;
	};
	insertRaw = (raw) => {
		this._sqlEasyState.queryType = QueryType.Insert;
		if (!this._sqlEasyState.insertState) this._sqlEasyState.insertState = new InsertState();
		this._sqlEasyState.insertState.raw = raw;
		return this;
	};
	updateTable = (tableName, alias) => {
		this._sqlEasyState.queryType = QueryType.Update;
		this._sqlEasyState.fromStates.push({
			builderType: BuilderType.FromTable,
			owner: this._config.defaultOwner(),
			tableName,
			alias,
			sqlEasyState: void 0,
			raw: void 0
		});
		return this;
	};
	updateTableWithOwner = (owner, tableName, alias) => {
		this._sqlEasyState.queryType = QueryType.Update;
		this._sqlEasyState.fromStates.push({
			builderType: BuilderType.FromTable,
			owner,
			tableName,
			alias,
			sqlEasyState: void 0,
			raw: void 0
		});
		return this;
	};
	set = (columnName, value) => {
		this._sqlEasyState.updateStates.push({
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
		this._sqlEasyState.updateStates.push({
			builderType: BuilderType.UpdateRaw,
			columnName: void 0,
			value: void 0,
			raw
		});
		return this;
	};
	deleteFrom = (tableName, alias) => {
		this._sqlEasyState.queryType = QueryType.Delete;
		this._sqlEasyState.fromStates.push({
			builderType: BuilderType.FromTable,
			owner: this._config.defaultOwner(),
			tableName,
			alias,
			sqlEasyState: void 0,
			raw: void 0
		});
		return this;
	};
	deleteFromWithOwner = (owner, tableName, alias) => {
		this._sqlEasyState.queryType = QueryType.Delete;
		this._sqlEasyState.fromStates.push({
			builderType: BuilderType.FromTable,
			owner,
			tableName,
			alias,
			sqlEasyState: void 0,
			raw: void 0
		});
		return this;
	};
	union = (builder) => {
		const newBuilder = this.newBuilder();
		builder(newBuilder);
		newBuilder.state().isInnerStatement = true;
		this._sqlEasyState.unionStates.push({
			builderType: BuilderType.Union,
			sqlEasyState: newBuilder.state(),
			raw: void 0
		});
		return this;
	};
	unionAll = (builder) => {
		const newBuilder = this.newBuilder();
		builder(newBuilder);
		newBuilder.state().isInnerStatement = true;
		this._sqlEasyState.unionStates.push({
			builderType: BuilderType.UnionAll,
			sqlEasyState: newBuilder.state(),
			raw: void 0
		});
		return this;
	};
	intersect = (builder) => {
		const newBuilder = this.newBuilder();
		builder(newBuilder);
		newBuilder.state().isInnerStatement = true;
		this._sqlEasyState.unionStates.push({
			builderType: BuilderType.Intersect,
			sqlEasyState: newBuilder.state(),
			raw: void 0
		});
		return this;
	};
	except = (builder) => {
		const newBuilder = this.newBuilder();
		builder(newBuilder);
		newBuilder.state().isInnerStatement = true;
		this._sqlEasyState.unionStates.push({
			builderType: BuilderType.Except,
			sqlEasyState: newBuilder.state(),
			raw: void 0
		});
		return this;
	};
	cte = (name, builder) => {
		const newBuilder = this.newBuilder();
		builder(newBuilder);
		newBuilder.state().isInnerStatement = true;
		this._sqlEasyState.cteStates.push({
			builderType: BuilderType.CteBuilder,
			name,
			recursive: false,
			sqlEasyState: newBuilder.state(),
			raw: void 0
		});
		return this;
	};
	cteRecursive = (name, builder) => {
		const newBuilder = this.newBuilder();
		builder(newBuilder);
		newBuilder.state().isInnerStatement = true;
		this._sqlEasyState.cteStates.push({
			builderType: BuilderType.CteBuilder,
			name,
			recursive: true,
			sqlEasyState: newBuilder.state(),
			raw: void 0
		});
		return this;
	};
	cteRaw = (name, raw) => {
		this._sqlEasyState.cteStates.push({
			builderType: BuilderType.CteRaw,
			name,
			recursive: false,
			sqlEasyState: void 0,
			raw
		});
		return this;
	};
};
//#endregion
//#region src/builder/default_join_on_builder.ts
var DefaultJoinOnBuilder = class {
	_states = [];
	_config;
	constructor(config) {
		this._config = config;
	}
	and = () => {
		this._states.push({
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
		this._states.push({
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
		this._states.push({
			joinOperator: JoinOperator.None,
			joinOnOperator: JoinOnOperator.GroupBegin,
			aliasLeft: void 0,
			columnLeft: void 0,
			aliasRight: void 0,
			columnRight: void 0,
			raw: void 0,
			valueRight: void 0
		});
		builder(this.newJoinOnBuilder());
		this._states.push({
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
		this._states.push({
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
		this._states.push({
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
		this._states.push({
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
		return this._states;
	};
};
//#endregion
//#region src/sqleasy/mssql/mssql_join_on_builder.ts
/** MSSQL {@link DefaultJoinOnBuilder} for constructing `JOIN ... ON` fragments. */
var MssqlJoinOnBuilder = class MssqlJoinOnBuilder extends DefaultJoinOnBuilder {
	_mssqlConfiguration;
	/** @param config - MSSQL dialect configuration used when emitting join conditions. */
	constructor(config) {
		super(config);
		this._mssqlConfiguration = config;
	}
	/** Returns a new join-on builder, reusing this configuration unless `config` is provided. */
	newJoinOnBuilder = (config) => {
		return new MssqlJoinOnBuilder(config ?? this._mssqlConfiguration);
	};
};
//#endregion
//#region src/enums/parser_mode.ts
let ParserMode = /* @__PURE__ */ function(ParserMode) {
	ParserMode[ParserMode["Raw"] = 0] = "Raw";
	ParserMode[ParserMode["Prepared"] = 1] = "Prepared";
	ParserMode[ParserMode["None"] = 2] = "None";
	return ParserMode;
}({});
//#endregion
//#region src/helpers/string_builder.ts
var StringBuilder = class {
	_parts = [];
	append(value) {
		this._parts.push(value);
		return this;
	}
	toString() {
		return this._parts.join("");
	}
};
//#endregion
//#region src/helpers/sql_helper.ts
var SqlHelper = class {
	_sb = new StringBuilder();
	_values = [];
	_config;
	_parserMode;
	constructor(config, parserMode) {
		this._config = config;
		this._parserMode = parserMode;
	}
	addDynamicValue = (value) => {
		if (this._parserMode === ParserMode.Prepared) {
			this._values.push(value);
			return this._config.preparedStatementPlaceholder();
		}
		return this.getValueStringFromDataType(value);
	};
	addSqlSnippet = (sql) => {
		this._sb.append(sql);
	};
	addSqlSnippetWithValues = (sqlString, values) => {
		this._values.push(...values);
		this.addSqlSnippet(sqlString);
	};
	clear = () => {
		this._sb = new StringBuilder();
		this._values = [];
	};
	getSql = () => {
		return this._sb.toString();
	};
	getSqlDebug = () => {
		let sqlString = this._sb.toString();
		const placeholder = this._config.preparedStatementPlaceholder();
		this._values.forEach((value) => {
			const valuePosition = sqlString.indexOf(placeholder);
			if (valuePosition === -1) return;
			sqlString = sqlString.substring(0, valuePosition) + this.getValueStringFromDataType(value) + sqlString.substring(valuePosition + placeholder.length);
		});
		return sqlString;
	};
	getValues = () => {
		if (this._values.length === 0) return [];
		return this._values.filter((value) => value !== null && value !== void 0);
	};
	getValueStringFromDataType = (value) => {
		if (value === null || value === void 0) return "";
		switch (typeof value) {
			case "string": return value;
			case "number": return value.toString();
			case "boolean": return value ? "true" : "false";
			case "object":
				if (value instanceof Date) return value.toISOString();
				return JSON.stringify(value);
			default: return value.toString();
		}
	};
};
//#endregion
//#region src/parser/default_cte.ts
const defaultCte = (state, config, mode) => {
	const sqlHelper = new SqlHelper(config, mode);
	if (state.cteStates.length === 0) return sqlHelper;
	if (state.cteStates.some((cte) => cte.recursive)) sqlHelper.addSqlSnippet("WITH RECURSIVE ");
	else sqlHelper.addSqlSnippet("WITH ");
	for (let i = 0; i < state.cteStates.length; i++) {
		const cteState = state.cteStates[i];
		sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + cteState.name + config.identifierDelimiters().end);
		sqlHelper.addSqlSnippet(" AS (");
		if (cteState.builderType === BuilderType.CteRaw) sqlHelper.addSqlSnippet(cteState.raw ?? "");
		else if (cteState.sqlEasyState) {
			const subHelper = defaultToSql(cteState.sqlEasyState, config, mode);
			sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
		}
		sqlHelper.addSqlSnippet(")");
		if (i < state.cteStates.length - 1) sqlHelper.addSqlSnippet(", ");
		else sqlHelper.addSqlSnippet(" ");
	}
	return sqlHelper;
};
//#endregion
//#region src/parser/default_delete.ts
const defaultDelete = (state, config, mode) => {
	const sqlHelper = new SqlHelper(config, mode);
	if (state.fromStates.length === 0) throw new ParserError(ParserArea.General, "DELETE requires a table");
	sqlHelper.addSqlSnippet("DELETE FROM ");
	const fromState = state.fromStates[0];
	if (fromState.owner && fromState.owner !== "") {
		sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + fromState.owner + config.identifierDelimiters().end);
		sqlHelper.addSqlSnippet(".");
	}
	sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + fromState.tableName + config.identifierDelimiters().end);
	if (fromState.alias && fromState.alias !== "") {
		sqlHelper.addSqlSnippet(" AS ");
		sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + fromState.alias + config.identifierDelimiters().end);
	}
	return sqlHelper;
};
//#endregion
//#region src/parser/default_from.ts
const defaultFrom = (state, config, mode) => {
	const sqlHelper = new SqlHelper(config, mode);
	if (state.fromStates.length === 0) throw new ParserError(ParserArea.From, "No tables to select from");
	sqlHelper.addSqlSnippet("FROM ");
	state.fromStates.forEach((fromState, i) => {
		if (fromState.builderType === BuilderType.FromRaw) {
			sqlHelper.addSqlSnippet(fromState.raw ?? "");
			if (i < state.fromStates.length - 1) sqlHelper.addSqlSnippet(", ");
			return;
		}
		if (fromState.builderType === BuilderType.FromTable) {
			if (fromState.owner !== "" && config.databaseType() === DatabaseType.Mysql) throw new ParserError(ParserArea.From, "MySQL does not support table owners");
			if (fromState.owner !== "") {
				sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + fromState.owner + config.identifierDelimiters().end);
				sqlHelper.addSqlSnippet(".");
			}
			sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + fromState.tableName + config.identifierDelimiters().end);
			if (fromState.alias !== "") {
				sqlHelper.addSqlSnippet(" AS ");
				sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + fromState.alias + config.identifierDelimiters().end);
			}
			if (i < state.fromStates.length - 1) sqlHelper.addSqlSnippet(", ");
			return;
		}
		if (fromState.builderType === BuilderType.FromBuilder) {
			const subHelper = defaultToSql(fromState.sqlEasyState, config, mode);
			sqlHelper.addSqlSnippet("(" + subHelper.getSql() + ")");
			if (fromState.alias !== "") {
				sqlHelper.addSqlSnippet(" AS ");
				sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + fromState.alias + config.identifierDelimiters().end);
			}
			if (i < state.fromStates.length - 1) sqlHelper.addSqlSnippet(", ");
		}
	});
	return sqlHelper;
};
//#endregion
//#region src/parser/default_group_by.ts
const defaultGroupBy = (state, config, mode) => {
	const sqlHelper = new SqlHelper(config, mode);
	if (state.groupByStates.length === 0) return sqlHelper;
	sqlHelper.addSqlSnippet("GROUP BY ");
	state.groupByStates.forEach((groupByState, i) => {
		if (groupByState.builderType === BuilderType.GroupByRaw) {
			sqlHelper.addSqlSnippet(groupByState.raw ?? "");
			if (i < state.groupByStates.length - 1) sqlHelper.addSqlSnippet(", ");
			return;
		}
		if (groupByState.builderType === BuilderType.GroupByColumn) {
			sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + groupByState.tableNameOrAlias + config.identifierDelimiters().end);
			sqlHelper.addSqlSnippet(".");
			sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + groupByState.columnName + config.identifierDelimiters().end);
			if (i < state.groupByStates.length - 1) sqlHelper.addSqlSnippet(", ");
			return;
		}
	});
	return sqlHelper;
};
//#endregion
//#region src/parser/default_having.ts
const defaultHaving = (state, config, mode) => {
	const sqlHelper = new SqlHelper(config, mode);
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
			sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + havingState.tableNameOrAlias + config.identifierDelimiters().end);
			sqlHelper.addSqlSnippet(".");
			sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + havingState.columnName + config.identifierDelimiters().end);
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
			}
			sqlHelper.addSqlSnippet(" ");
			sqlHelper.addSqlSnippet(sqlHelper.addDynamicValue(havingState.values[0]));
			if (i < state.havingStates.length - 1) sqlHelper.addSqlSnippet(" ");
			continue;
		}
	}
	return sqlHelper;
};
//#endregion
//#region src/parser/default_insert.ts
const defaultInsert = (state, config, mode) => {
	const sqlHelper = new SqlHelper(config, mode);
	if (!state.insertState) throw new ParserError(ParserArea.General, "No insert state provided");
	const insertState = state.insertState;
	if (insertState.raw) {
		sqlHelper.addSqlSnippet(insertState.raw);
		return sqlHelper;
	}
	sqlHelper.addSqlSnippet("INSERT INTO ");
	if (insertState.owner && insertState.owner !== "") {
		sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + insertState.owner + config.identifierDelimiters().end);
		sqlHelper.addSqlSnippet(".");
	}
	sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + insertState.tableName + config.identifierDelimiters().end);
	if (insertState.columns.length > 0) {
		sqlHelper.addSqlSnippet(" (");
		for (let i = 0; i < insertState.columns.length; i++) {
			sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + insertState.columns[i] + config.identifierDelimiters().end);
			if (i < insertState.columns.length - 1) sqlHelper.addSqlSnippet(", ");
		}
		sqlHelper.addSqlSnippet(")");
	}
	if (insertState.values.length > 0) {
		sqlHelper.addSqlSnippet(" VALUES ");
		for (let r = 0; r < insertState.values.length; r++) {
			sqlHelper.addSqlSnippet("(");
			for (let c = 0; c < insertState.values[r].length; c++) {
				sqlHelper.addSqlSnippet(sqlHelper.addDynamicValue(insertState.values[r][c]));
				if (c < insertState.values[r].length - 1) sqlHelper.addSqlSnippet(", ");
			}
			sqlHelper.addSqlSnippet(")");
			if (r < insertState.values.length - 1) sqlHelper.addSqlSnippet(", ");
		}
	}
	return sqlHelper;
};
//#endregion
//#region src/parser/default_join.ts
const defaultJoin = (state, config, mode) => {
	let sqlHelper = new SqlHelper(config, mode);
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
				sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + joinState.owner + config.identifierDelimiters().end);
				sqlHelper.addSqlSnippet(".");
			}
			sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + joinState.tableName + config.identifierDelimiters().end);
			if (joinState.alias !== "") {
				sqlHelper.addSqlSnippet(" AS ");
				sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + joinState.alias + config.identifierDelimiters().end);
			}
			sqlHelper = defaultJoinOns(sqlHelper, config, joinState.joinOnStates);
			if (i < state.joinStates.length - 1) sqlHelper.addSqlSnippet(" ");
			continue;
		}
		if (joinState.builderType === BuilderType.JoinBuilder) {
			const subHelper = defaultToSql(joinState.sqlEasyState, config, mode);
			sqlHelper.addSqlSnippet("(" + subHelper.getSql() + ")");
			if (joinState.alias !== "") {
				sqlHelper.addSqlSnippet(" AS ");
				sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + joinState.alias + config.identifierDelimiters().end);
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
		if (i === 0 && (joinOnStates[i].joinOnOperator === JoinOnOperator.And || joinOnStates[i].joinOnOperator === JoinOnOperator.Or)) throw new ParserError(ParserArea.Join, "First JOIN ON operator cannot be AND or OR");
		if (i === joinOnStates.length - 1 && (joinOnStates[i].joinOnOperator === JoinOnOperator.And || joinOnStates[i].joinOnOperator === JoinOnOperator.Or)) throw new ParserError(ParserArea.Join, "AND or OR cannot be used as the last JOIN ON operator");
		if ((joinOnStates[i].joinOnOperator === JoinOnOperator.And || joinOnStates[i].joinOnOperator === JoinOnOperator.Or) && (joinOnStates[i - 1].joinOnOperator === JoinOnOperator.And || joinOnStates[i - 1].joinOnOperator === JoinOnOperator.Or)) throw new ParserError(ParserArea.Join, "AND or OR cannot be used consecutively");
		if ((joinOnStates[i].joinOnOperator === JoinOnOperator.And || joinOnStates[i].joinOnOperator === JoinOnOperator.Or) && joinOnStates[i - 1].joinOnOperator === JoinOnOperator.GroupBegin) throw new ParserError(ParserArea.Join, "AND or OR cannot be used directly after a group begin");
		if (joinOnStates[i].joinOnOperator === JoinOnOperator.GroupBegin && i === joinOnStates.length - 1) throw new ParserError(ParserArea.Join, "Group begin cannot be the last JOIN ON operator");
		if (joinOnStates[i].joinOnOperator === JoinOnOperator.GroupEnd && i === 0) throw new ParserError(ParserArea.Join, "Group end cannot be the first JOIN ON operator");
		if (joinOnStates[i].joinOnOperator === JoinOnOperator.And) {
			sqlHelper.addSqlSnippet("AND");
			if (i < joinOnStates.length - 1) sqlHelper.addSqlSnippet(" ");
			continue;
		}
		if (joinOnStates[i].joinOnOperator === JoinOnOperator.Or) {
			sqlHelper.addSqlSnippet("OR");
			if (i < joinOnStates.length - 1) sqlHelper.addSqlSnippet(" ");
			continue;
		}
		if (joinOnStates[i].joinOnOperator === JoinOnOperator.GroupBegin) {
			sqlHelper.addSqlSnippet("(");
			continue;
		}
		if (joinOnStates[i].joinOnOperator === JoinOnOperator.GroupEnd) {
			sqlHelper.addSqlSnippet(")");
			if (i < joinOnStates.length - 1) sqlHelper.addSqlSnippet(" ");
			continue;
		}
		if (joinOnStates[i].joinOnOperator === JoinOnOperator.Raw) {
			sqlHelper.addSqlSnippet(joinOnStates[i].raw ?? "");
			if (i < joinOnStates.length - 1) sqlHelper.addSqlSnippet(" ");
			continue;
		}
		if (joinOnStates[i].joinOnOperator === JoinOnOperator.On) {
			sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + joinOnStates[i].aliasLeft + config.identifierDelimiters().end);
			sqlHelper.addSqlSnippet(".");
			sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + joinOnStates[i].columnLeft + config.identifierDelimiters().end);
			sqlHelper.addSqlSnippet(" ");
			switch (joinOnStates[i].joinOperator) {
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
			sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + joinOnStates[i].aliasRight + config.identifierDelimiters().end);
			sqlHelper.addSqlSnippet(".");
			sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + joinOnStates[i].columnRight + config.identifierDelimiters().end);
			if (i < joinOnStates.length - 1) sqlHelper.addSqlSnippet(" ");
			continue;
		}
		if (joinOnStates[i].joinOnOperator === JoinOnOperator.Value) {
			sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + joinOnStates[i].aliasLeft + config.identifierDelimiters().end);
			sqlHelper.addSqlSnippet(".");
			sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + joinOnStates[i].columnLeft + config.identifierDelimiters().end);
			sqlHelper.addSqlSnippet(" ");
			switch (joinOnStates[i].joinOperator) {
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
			sqlHelper.addSqlSnippet(sqlHelper.addDynamicValue(joinOnStates[i].valueRight));
			if (i < joinOnStates.length - 1) sqlHelper.addSqlSnippet(" ");
			continue;
		}
	}
	return sqlHelper;
};
//#endregion
//#region src/parser/default_limit_offset.ts
const defaultLimitOffset = (state, config, mode) => {
	const sqlHelper = new SqlHelper(config, mode);
	if (state.limit == 0 && state.offset == 0) return sqlHelper;
	if (config.databaseType() == DatabaseType.Mysql || config.databaseType() == DatabaseType.Postgres || config.databaseType() == DatabaseType.Sqlite) {
		if (state.limit > 0) {
			sqlHelper.addSqlSnippet("LIMIT ");
			sqlHelper.addSqlSnippet(state.limit.toString());
		}
		if (state.limit == 0 && !state.isInnerStatement && (state.whereStates === null || state.whereStates === void 0 || state.whereStates.length == 0)) {
			sqlHelper.addSqlSnippet("LIMIT ");
			sqlHelper.addSqlSnippet(config.runtimeConfiguration().maxRowsReturned.toString());
		}
		if (state.offset > 0) {
			if (state.limit > 0) sqlHelper.addSqlSnippet(" ");
			sqlHelper.addSqlSnippet(" OFFSET ");
			sqlHelper.addSqlSnippet(state.offset.toString());
		}
	}
	if (config.databaseType() == DatabaseType.Mssql) {
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
	if (state.offset > 0 && (state.orderByStates === null || state.orderByStates === void 0 || state.orderByStates.length == 0)) throw new ParserError(ParserArea.LimitOffset, "ORDER BY is required when using OFFSET");
	return sqlHelper;
};
//#endregion
//#region src/parser/default_order_by.ts
const defaultOrderBy = (state, config, mode) => {
	const sqlHelper = new SqlHelper(config, mode);
	if (state.orderByStates.length === 0) return sqlHelper;
	sqlHelper.addSqlSnippet("ORDER BY ");
	state.orderByStates.forEach((orderByState, i) => {
		if (orderByState.builderType === BuilderType.OrderByRaw) {
			sqlHelper.addSqlSnippet(orderByState.raw ?? "");
			if (i < state.orderByStates.length - 1) sqlHelper.addSqlSnippet(", ");
			return;
		}
		if (orderByState.builderType === BuilderType.OrderByColumn) {
			sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + orderByState.tableNameOrAlias + config.identifierDelimiters().end);
			sqlHelper.addSqlSnippet(".");
			sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + orderByState.columnName + config.identifierDelimiters().end);
			if (orderByState.direction === OrderByDirection.Ascending) sqlHelper.addSqlSnippet(" ASC");
			else sqlHelper.addSqlSnippet(" DESC");
			if (i < state.orderByStates.length - 1) sqlHelper.addSqlSnippet(", ");
			return;
		}
	});
	return sqlHelper;
};
//#endregion
//#region src/parser/default_select.ts
const defaultSelect = (state, config, mode, options) => {
	const sqlHelper = new SqlHelper(config, mode);
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
			sqlHelper.addSqlSnippet(`${config.identifierDelimiters().begin}${selectState.tableNameOrAlias}${config.identifierDelimiters().end}`);
			sqlHelper.addSqlSnippet(".");
			sqlHelper.addSqlSnippet(`${config.identifierDelimiters().begin}${selectState.columnName}${config.identifierDelimiters().end}`);
			if (selectState.alias !== "") {
				sqlHelper.addSqlSnippet(" AS ");
				sqlHelper.addSqlSnippet(`${config.identifierDelimiters().begin}${selectState.alias}${config.identifierDelimiters().end}`);
			}
			if (i < state.selectStates.length - 1) sqlHelper.addSqlSnippet(", ");
			continue;
		}
		if (selectState.builderType === BuilderType.SelectBuilder) {
			const subHelper = defaultToSql(selectState.sqlEasyState, config, mode);
			sqlHelper.addSqlSnippet(`(${subHelper.getSql()})`);
			if (selectState.alias !== "") {
				sqlHelper.addSqlSnippet(" AS ");
				sqlHelper.addSqlSnippet(`${config.identifierDelimiters().begin}${selectState.alias}${config.identifierDelimiters().end}`);
			}
			if (i < state.selectStates.length - 1) sqlHelper.addSqlSnippet(", ");
			continue;
		}
	}
	return sqlHelper;
};
//#endregion
//#region src/parser/default_union.ts
const defaultUnion = (state, config, mode, options) => {
	const sqlHelper = new SqlHelper(config, mode);
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
		else if (unionState.sqlEasyState) {
			const subHelper = defaultToSql(unionState.sqlEasyState, config, mode, options);
			sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
		}
		if (i < state.unionStates.length - 1) sqlHelper.addSqlSnippet(" ");
	}
	return sqlHelper;
};
//#endregion
//#region src/parser/default_update.ts
const defaultUpdate = (state, config, mode) => {
	const sqlHelper = new SqlHelper(config, mode);
	if (state.fromStates.length === 0) throw new ParserError(ParserArea.General, "UPDATE requires a table");
	if (state.updateStates.length === 0) throw new ParserError(ParserArea.General, "UPDATE requires at least one SET column");
	sqlHelper.addSqlSnippet("UPDATE ");
	const fromState = state.fromStates[0];
	if (fromState.owner && fromState.owner !== "") {
		sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + fromState.owner + config.identifierDelimiters().end);
		sqlHelper.addSqlSnippet(".");
	}
	sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + fromState.tableName + config.identifierDelimiters().end);
	if (fromState.alias && fromState.alias !== "") {
		sqlHelper.addSqlSnippet(" AS ");
		sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + fromState.alias + config.identifierDelimiters().end);
	}
	sqlHelper.addSqlSnippet(" SET ");
	for (let i = 0; i < state.updateStates.length; i++) {
		const updateState = state.updateStates[i];
		if (updateState.builderType === BuilderType.UpdateRaw) sqlHelper.addSqlSnippet(updateState.raw ?? "");
		else if (updateState.builderType === BuilderType.UpdateColumn) {
			sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + updateState.columnName + config.identifierDelimiters().end);
			sqlHelper.addSqlSnippet(" = ");
			sqlHelper.addSqlSnippet(sqlHelper.addDynamicValue(updateState.value));
		}
		if (i < state.updateStates.length - 1) sqlHelper.addSqlSnippet(", ");
	}
	return sqlHelper;
};
//#endregion
//#region src/parser/default_where.ts
const defaultWhere = (state, config, mode) => {
	const sqlHelper = new SqlHelper(config, mode);
	if (state.whereStates.length === 0) return sqlHelper;
	sqlHelper.addSqlSnippet("WHERE ");
	for (let i = 0; i < state.whereStates.length; i++) {
		if (i === 0 && (state.whereStates[i].builderType === BuilderType.And || state.whereStates[i].builderType === BuilderType.Or)) throw new ParserError(ParserArea.Where, "First WHERE operator cannot be AND or OR");
		if (i === state.whereStates.length - 1 && (state.whereStates[i].builderType === BuilderType.And || state.whereStates[i].builderType === BuilderType.Or)) throw new ParserError(ParserArea.Where, "AND or OR cannot be used as the last WHERE operator");
		if ((state.whereStates[i].builderType === BuilderType.And || state.whereStates[i].builderType === BuilderType.Or) && (state.whereStates[i - 1].builderType === BuilderType.And || state.whereStates[i - 1].builderType === BuilderType.Or)) throw new ParserError(ParserArea.Where, "AND or OR cannot be used consecutively");
		if ((state.whereStates[i].builderType === BuilderType.And || state.whereStates[i].builderType === BuilderType.Or) && state.whereStates[i - 1].builderType === BuilderType.WhereGroupBegin) throw new ParserError(ParserArea.Where, "AND or OR cannot be used directly after a group begin");
		if (state.whereStates[i].builderType === BuilderType.WhereGroupBegin && i === state.whereStates.length - 1) throw new ParserError(ParserArea.Where, "Group begin cannot be the last WHERE operator");
		if (state.whereStates[i].builderType === BuilderType.WhereGroupEnd && i === 0) throw new ParserError(ParserArea.Where, "Group end cannot be the first WHERE operator");
		if (state.whereStates[i].builderType === BuilderType.And) {
			sqlHelper.addSqlSnippet("AND");
			if (i < state.whereStates.length - 1) sqlHelper.addSqlSnippet(" ");
			continue;
		}
		if (state.whereStates[i].builderType === BuilderType.Or) {
			sqlHelper.addSqlSnippet("OR");
			if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) sqlHelper.addSqlSnippet(" ");
			continue;
		}
		if (state.whereStates[i].builderType === BuilderType.WhereGroupBegin) {
			sqlHelper.addSqlSnippet("(");
			continue;
		}
		if (state.whereStates[i].builderType === BuilderType.WhereGroupEnd) {
			sqlHelper.addSqlSnippet(")");
			if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) sqlHelper.addSqlSnippet(" ");
			continue;
		}
		if (state.whereStates[i].builderType === BuilderType.WhereRaw) {
			sqlHelper.addSqlSnippet(state.whereStates[i].raw ?? "");
			if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) sqlHelper.addSqlSnippet(" ");
			continue;
		}
		if (state.whereStates[i].builderType === BuilderType.Where) {
			sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + state.whereStates[i].tableNameOrAlias + config.identifierDelimiters().end);
			sqlHelper.addSqlSnippet(".");
			sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + state.whereStates[i].columnName + config.identifierDelimiters().end);
			sqlHelper.addSqlSnippet(" ");
			switch (state.whereStates[i].whereOperator) {
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
			}
			sqlHelper.addSqlSnippet(" ");
			sqlHelper.addSqlSnippet(sqlHelper.addDynamicValue(state.whereStates[i].values[0]));
			if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) sqlHelper.addSqlSnippet(" ");
			continue;
		}
		if (state.whereStates[i].builderType == BuilderType.WhereBetween) {
			sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + state.whereStates[i].tableNameOrAlias + config.identifierDelimiters().end);
			sqlHelper.addSqlSnippet(".");
			sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + state.whereStates[i].columnName + config.identifierDelimiters().end);
			sqlHelper.addSqlSnippet(" ");
			sqlHelper.addSqlSnippet("BETWEEN ");
			sqlHelper.addSqlSnippet(sqlHelper.addDynamicValue(state.whereStates[i].values[0]));
			sqlHelper.addSqlSnippet(" AND ");
			sqlHelper.addSqlSnippet(sqlHelper.addDynamicValue(state.whereStates[i].values[1]));
			if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) sqlHelper.addSqlSnippet(" ");
			continue;
		}
		if (state.whereStates[i].builderType == BuilderType.WhereExistsBuilder) {
			sqlHelper.addSqlSnippet("EXISTS (");
			const subHelper = defaultToSql(state.whereStates[i].sqlEasyState, config, mode);
			sqlHelper.addSqlSnippet(subHelper.getSql());
			sqlHelper.addSqlSnippet(")");
			if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) sqlHelper.addSqlSnippet(" ");
			continue;
		}
		if (state.whereStates[i].builderType == BuilderType.WhereInBuilder) {
			sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + state.whereStates[i].tableNameOrAlias + config.identifierDelimiters().end);
			sqlHelper.addSqlSnippet(".");
			sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + state.whereStates[i].columnName + config.identifierDelimiters().end);
			sqlHelper.addSqlSnippet(" IN (");
			const subHelper = defaultToSql(state.whereStates[i].sqlEasyState, config, mode);
			sqlHelper.addSqlSnippet(subHelper.getSql());
			sqlHelper.addSqlSnippet(")");
			if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) sqlHelper.addSqlSnippet(" ");
			continue;
		}
		if (state.whereStates[i].builderType == BuilderType.WhereInValues) {
			sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + state.whereStates[i].tableNameOrAlias + config.identifierDelimiters().end);
			sqlHelper.addSqlSnippet(".");
			sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + state.whereStates[i].columnName + config.identifierDelimiters().end);
			sqlHelper.addSqlSnippet(" IN (");
			for (let j = 0; j < state.whereStates[i].values.length; j++) {
				sqlHelper.addSqlSnippet(sqlHelper.addDynamicValue(state.whereStates[i].values[j]));
				if (j < state.whereStates[i].values.length - 1) sqlHelper.addSqlSnippet(", ");
			}
			sqlHelper.addSqlSnippet(")");
			if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) sqlHelper.addSqlSnippet(" ");
			continue;
		}
		if (state.whereStates[i].builderType == BuilderType.WhereNotExistsBuilder) {
			sqlHelper.addSqlSnippet("NOT EXISTS (");
			const subHelper = defaultToSql(state.whereStates[i].sqlEasyState, config, mode);
			sqlHelper.addSqlSnippet(subHelper.getSql());
			sqlHelper.addSqlSnippet(")");
			if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) sqlHelper.addSqlSnippet(" ");
			continue;
		}
		if (state.whereStates[i].builderType == BuilderType.WhereNotInBuilder) {
			sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + state.whereStates[i].tableNameOrAlias + config.identifierDelimiters().end);
			sqlHelper.addSqlSnippet(".");
			sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + state.whereStates[i].columnName + config.identifierDelimiters().end);
			sqlHelper.addSqlSnippet(" NOT IN (");
			const subHelper = defaultToSql(state.whereStates[i].sqlEasyState, config, mode);
			sqlHelper.addSqlSnippet(subHelper.getSql());
			sqlHelper.addSqlSnippet(")");
			if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) sqlHelper.addSqlSnippet(" ");
			continue;
		}
		if (state.whereStates[i].builderType == BuilderType.WhereNotInValues) {
			sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + state.whereStates[i].tableNameOrAlias + config.identifierDelimiters().end);
			sqlHelper.addSqlSnippet(".");
			sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + state.whereStates[i].columnName + config.identifierDelimiters().end);
			sqlHelper.addSqlSnippet(" NOT IN (");
			for (let j = 0; j < state.whereStates[i].values.length; j++) {
				sqlHelper.addSqlSnippet(sqlHelper.addDynamicValue(state.whereStates[i].values[j]));
				if (j < state.whereStates[i].values.length - 1) sqlHelper.addSqlSnippet(", ");
			}
			sqlHelper.addSqlSnippet(")");
			if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) sqlHelper.addSqlSnippet(" ");
			continue;
		}
		if (state.whereStates[i].builderType == BuilderType.WhereNotNull) {
			sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + state.whereStates[i].tableNameOrAlias + config.identifierDelimiters().end);
			sqlHelper.addSqlSnippet(".");
			sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + state.whereStates[i].columnName + config.identifierDelimiters().end);
			sqlHelper.addSqlSnippet(" IS NOT NULL");
			if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) sqlHelper.addSqlSnippet(" ");
			continue;
		}
		if (state.whereStates[i].builderType == BuilderType.WhereNull) {
			sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + state.whereStates[i].tableNameOrAlias + config.identifierDelimiters().end);
			sqlHelper.addSqlSnippet(".");
			sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + state.whereStates[i].columnName + config.identifierDelimiters().end);
			sqlHelper.addSqlSnippet(" IS NULL");
			if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) sqlHelper.addSqlSnippet(" ");
			continue;
		}
	}
	return sqlHelper;
};
//#endregion
//#region src/parser/default_to_sql.ts
const defaultToSql = (state, config, mode, options) => {
	const sqlHelper = new SqlHelper(config, mode);
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
//#endregion
//#region src/parser/default_parser.ts
var DefaultParser = class {
	_config;
	constructor(config) {
		this._config = config;
	}
	get config() {
		return this._config;
	}
	getToSqlOptions() {
		return {};
	}
	toSqlRaw = (state) => {
		return defaultToSql(state, this._config, ParserMode.Raw, this.getToSqlOptions()).getSqlDebug();
	};
	toSqlMultiRaw = (states, transactionState) => {
		let sqlRaw = "";
		if (transactionState === MultiBuilderTransactionState.TransactionOn) sqlRaw += this._config.transactionDelimiters().begin + "; ";
		for (const state of states) {
			const sql = this.toSqlRaw(state);
			sqlRaw += sql;
		}
		if (transactionState === MultiBuilderTransactionState.TransactionOn) sqlRaw += this._config.transactionDelimiters().end + "; ";
		return sqlRaw;
	};
};
//#endregion
//#region src/sqleasy/mssql/mssql_parser.ts
var MssqlParser = class extends DefaultParser {
	_mssqlConfiguration;
	constructor(config) {
		super(config);
		this._mssqlConfiguration = config;
	}
	getToSqlOptions() {
		return { beforeSelectColumns: (state, config, sqlHelper) => {
			if (state.customState !== null && state.customState !== void 0 && state.customState["top"] !== null && state.customState["top"] !== void 0 && state.customState["top"] > 0) {
				sqlHelper.addSqlSnippet("TOP ");
				sqlHelper.addSqlSnippet(`(${state.customState["top"]})`);
				sqlHelper.addSqlSnippet(" ");
			} else if (!state.isInnerStatement && state.limit === 0 && (!state.whereStates || state.whereStates.length === 0)) {
				sqlHelper.addSqlSnippet("TOP ");
				sqlHelper.addSqlSnippet(`(${config.runtimeConfiguration().maxRowsReturned})`);
				sqlHelper.addSqlSnippet(" ");
			}
		} };
	}
	toSql = (state) => {
		const paramsString = new SqlHelper(this._mssqlConfiguration, ParserMode.Prepared);
		const finalString = new SqlHelper(this._mssqlConfiguration, ParserMode.Prepared);
		const sqlHelper = defaultToSql(state, this._mssqlConfiguration, ParserMode.Prepared, this.getToSqlOptions());
		let sql = sqlHelper.getSql();
		sql = sql.replaceAll("'", "''");
		if (sql.length > 4e3) throw new ParserError(ParserArea.General, "SQL string is too long for Mssql prepared statement");
		let valueCounter = 0;
		for (const value of sqlHelper.getValues()) {
			const valuePosition = sql.indexOf(this._mssqlConfiguration.preparedStatementPlaceholder());
			if (valuePosition === -1) break;
			sql = sql.slice(0, valuePosition) + "@p" + valueCounter + sql.slice(valuePosition + 1);
			if (valueCounter > 0) paramsString.addSqlSnippet(", ");
			paramsString.addSqlSnippet("@p" + valueCounter + " " + this.getParameterType(value));
			valueCounter++;
		}
		if (paramsString.getSql().length > 4e3) throw new ParserError(ParserArea.General, "SQL string is too long for Mssql prepared statement");
		finalString.addSqlSnippet("SET NOCOUNT ON; ");
		finalString.addSqlSnippet("exec sp_executesql N'");
		finalString.addSqlSnippet(sql);
		finalString.addSqlSnippet("', N'");
		finalString.addSqlSnippet(paramsString.getSql());
		finalString.addSqlSnippet("', ");
		for (let i = 0; i < sqlHelper.getValues().length; i++) {
			if (i > 0) finalString.addSqlSnippet(", ");
			finalString.addSqlSnippet("@p" + i + " = " + finalString.getValueStringFromDataType(sqlHelper.getValues()[i]));
		}
		finalString.addSqlSnippet(";");
		return finalString.getSql();
	};
	toSqlMulti = (states, transactionState) => {
		const finalString = new SqlHelper(this._mssqlConfiguration, ParserMode.Prepared);
		if (transactionState === MultiBuilderTransactionState.TransactionOn) finalString.addSqlSnippet(this._mssqlConfiguration.transactionDelimiters().begin + "; ");
		for (const state of states) {
			const sql = this.toSql(state);
			finalString.addSqlSnippet(sql + " ");
		}
		if (transactionState === MultiBuilderTransactionState.TransactionOn) finalString.addSqlSnippet(this._mssqlConfiguration.transactionDelimiters().end + ";");
		return finalString.getSql();
	};
	getParameterType = (value) => {
		switch (typeof value) {
			case "string": return "nvarchar(max)";
			case "number": if (Number.isInteger(value)) if (value >= -128 && value <= 127) return "tinyint";
			else if (value >= -32768 && value <= 32767) return "smallint";
			else if (value >= -2147483648 && value <= 2147483647) return "int";
			else return "bigint";
			else return "float";
			case "boolean": return "bit";
			default: return "nvarchar(max)";
		}
	};
};
//#endregion
//#region src/sqleasy/mssql/mssql_builder.ts
/** MSSQL {@link DefaultBuilder}; creates dialect parsers and join-on builders and supports `TOP`. */
var MssqlBuilder = class MssqlBuilder extends DefaultBuilder {
	_mssqlConfig;
	/** @param config - MSSQL dialect configuration used for SQL generation. */
	constructor(config) {
		super(config);
		this._mssqlConfig = config;
	}
	/** Returns a new builder, reusing this configuration unless `config` is provided. */
	newBuilder = (config) => {
		return new MssqlBuilder(config ?? this._mssqlConfig);
	};
	/** Returns a new join-on builder for this dialect. */
	newJoinOnBuilder = (config) => {
		return new MssqlJoinOnBuilder(config ?? this._mssqlConfig);
	};
	/** Returns a new MSSQL parser instance. */
	newParser = (config) => {
		return new MssqlParser(config ?? this._mssqlConfig);
	};
	/** Removes a previously set `TOP` limit from builder state. */
	clearTop = () => {
		if (this.state().customState) delete this.state().customState["top"];
		return this;
	};
	/** Sets the `TOP` row limit for the generated `SELECT`. */
	top = (top) => {
		if (!this.state().customState) this.state().customState = {};
		this.state().customState["top"] = top;
		return this;
	};
};
//#endregion
//#region src/sqleasy/mssql/mssql_configuration.ts
/** {@link IConfiguration} for Microsoft SQL Server (delimiters, placeholders, default schema). */
var MssqlConfiguration = class {
	_mssqlRuntimeConfiguration;
	/** @param rc - Runtime options (e.g. row limits) bound to this dialect configuration. */
	constructor(rc) {
		this._mssqlRuntimeConfiguration = rc;
	}
	/** Returns {@link DatabaseType.Mssql}. */
	databaseType = () => {
		return DatabaseType.Mssql;
	};
	/** Default schema/owner for unqualified objects (`dbo`). */
	defaultOwner = () => {
		return "dbo";
	};
	/** Bracket delimiters for quoted identifiers. */
	identifierDelimiters = () => {
		return {
			begin: "[",
			end: "]"
		};
	};
	/** Placeholder character for parameterized SQL (`?`). */
	preparedStatementPlaceholder = () => {
		return "?";
	};
	/** Runtime options associated with this configuration. */
	runtimeConfiguration = () => {
		return this._mssqlRuntimeConfiguration;
	};
	/** Single-quote delimiter for string literals. */
	stringDelimiter = () => {
		return "'";
	};
	/** Keywords delimiting a transaction block for this dialect. */
	transactionDelimiters = () => {
		return {
			begin: "BEGIN TRANSACTION",
			end: "COMMIT TRANSACTION"
		};
	};
};
//#endregion
//#region src/builder/default_multi_builder.ts
var DefaultMultiBuilder = class {
	_config;
	_states = [];
	_transactionState = MultiBuilderTransactionState.TransactionOn;
	constructor(config) {
		this._config = config;
	}
	addBuilder = (builderName) => {
		const newBuilder = this.newBuilder();
		newBuilder.state().builderName = builderName;
		this._states.push(newBuilder.state());
		return newBuilder;
	};
	parse = () => {
		return this.newParser().toSqlMulti(this._states, this._transactionState);
	};
	parseRaw = () => {
		return this.newParser().toSqlMultiRaw(this._states, this._transactionState);
	};
	removeBuilder = (builderName) => {
		this._states = this._states.filter((state) => state.builderName !== builderName);
	};
	reorderBuilders = (builderNames) => {
		const newStates = [];
		builderNames.forEach((builderName) => {
			const state = this._states.find((state) => state.builderName === builderName);
			if (state) newStates.push(state);
		});
		this._states = newStates;
	};
	setTransactionState = (transactionState) => {
		this._transactionState = transactionState;
	};
	states = () => {
		return this._states;
	};
	transactionState = () => {
		return this._transactionState;
	};
};
//#endregion
//#region src/sqleasy/mssql/mssql_multi_builder.ts
/** MSSQL {@link DefaultMultiBuilder} for batching multiple statements with shared configuration. */
var MssqlMultiBuilder = class extends DefaultMultiBuilder {
	_mssqlConfiguration;
	/** @param config - MSSQL dialect configuration shared by child builders and parsers. */
	constructor(config) {
		super(config);
		this._mssqlConfiguration = config;
	}
	/** Creates a fresh {@link MssqlBuilder} using this multi-builder’s configuration. */
	newBuilder = () => {
		return new MssqlBuilder(this._mssqlConfiguration);
	};
	/** Creates a fresh {@link MssqlParser} using this multi-builder’s configuration. */
	newParser = () => {
		return new MssqlParser(this._mssqlConfiguration);
	};
};
//#endregion
//#region src/sqleasy/mssql/mssql_sqleasy.ts
/** Main entry point for Microsoft SQL Server; implements {@link ISqlEasy} for MSSQL builders and parsers. */
var MssqlSqlEasy = class {
	_mssqlConfiguration;
	/** @param rc - Optional runtime options; defaults to a new {@link RuntimeConfiguration} when omitted. */
	constructor(rc) {
		if (rc === null || rc === void 0) rc = new RuntimeConfiguration();
		this._mssqlConfiguration = new MssqlConfiguration(rc);
	}
	/** Returns the shared MSSQL dialect configuration for this instance. */
	configuration = () => {
		return this._mssqlConfiguration;
	};
	/** Creates a query builder, optionally with a one-off {@link RuntimeConfiguration}. */
	newBuilder = (rc) => {
		if (rc === null || rc === void 0) return new MssqlBuilder(this._mssqlConfiguration);
		return new MssqlBuilder(new MssqlConfiguration(rc));
	};
	/** Creates a multi-statement builder, optionally with a one-off {@link RuntimeConfiguration}. */
	newMultiBuilder = (rc) => {
		if (rc === null || rc === void 0) return new MssqlMultiBuilder(this._mssqlConfiguration);
		return new MssqlMultiBuilder(new MssqlConfiguration(rc));
	};
};
//#endregion
//#region src/sqleasy/mysql/mysql_join_on_builder.ts
/** MySQL {@link DefaultJoinOnBuilder} for constructing `JOIN ... ON` fragments. */
var MysqlJoinOnBuilder = class MysqlJoinOnBuilder extends DefaultJoinOnBuilder {
	_mysqlConfig;
	/** @param config - MySQL dialect configuration used when emitting join conditions. */
	constructor(config) {
		super(config);
		this._mysqlConfig = config;
	}
	/** Returns a new join-on builder, reusing this configuration unless `config` is provided. */
	newJoinOnBuilder = (config) => {
		return new MysqlJoinOnBuilder(config ?? this._mysqlConfig);
	};
};
//#endregion
//#region src/sqleasy/mysql/mysql_parser.ts
var MysqlParser = class extends DefaultParser {
	_mysqlConfiguration;
	constructor(config) {
		super(config);
		this._mysqlConfiguration = config;
	}
	toSql = (state) => {
		return defaultToSql(state, this._mysqlConfiguration, ParserMode.Prepared).getSql();
	};
	toSqlMulti = (states, transactionState) => {
		const finalString = new SqlHelper(this._mysqlConfiguration, ParserMode.Prepared);
		if (transactionState === MultiBuilderTransactionState.TransactionOn) finalString.addSqlSnippet(this._mysqlConfiguration.transactionDelimiters().begin + "; ");
		for (const state of states) {
			const sql = this.toSql(state);
			finalString.addSqlSnippet(sql);
		}
		if (transactionState === MultiBuilderTransactionState.TransactionOn) finalString.addSqlSnippet(this._mysqlConfiguration.transactionDelimiters().end + ";");
		return finalString.getSql();
	};
};
//#endregion
//#region src/sqleasy/mysql/mysql_builder.ts
/** MySQL {@link DefaultBuilder}; creates dialect parsers and join-on builders. */
var MysqlBuilder = class MysqlBuilder extends DefaultBuilder {
	_mysqlConfig;
	/** @param config - MySQL dialect configuration used for SQL generation. */
	constructor(config) {
		super(config);
		this._mysqlConfig = config;
	}
	/** Returns a new builder, reusing this configuration unless `config` is provided. */
	newBuilder = (config) => {
		return new MysqlBuilder(config ?? this._mysqlConfig);
	};
	/** Returns a new join-on builder for this dialect. */
	newJoinOnBuilder = (config) => {
		return new MysqlJoinOnBuilder(config ?? this._mysqlConfig);
	};
	/** Returns a new MySQL parser instance. */
	newParser = (config) => {
		return new MysqlParser(config ?? this._mysqlConfig);
	};
};
//#endregion
//#region src/sqleasy/mysql/mysql_configuration.ts
/** {@link IConfiguration} for MySQL (delimiters, placeholders, transactions). */
var MysqlConfiguration = class {
	_mysqlRuntimeConfiguration;
	/** @param rc - Runtime options (e.g. row limits) bound to this dialect configuration. */
	constructor(rc) {
		this._mysqlRuntimeConfiguration = rc;
	}
	/** Returns {@link DatabaseType.Mysql}. */
	databaseType = () => {
		return DatabaseType.Mysql;
	};
	/** Default owner for unqualified objects (empty for typical MySQL usage). */
	defaultOwner = () => {
		return "";
	};
	/** Backtick delimiters for quoted identifiers. */
	identifierDelimiters = () => {
		return {
			begin: "`",
			end: "`"
		};
	};
	/** Placeholder character for parameterized SQL (`?`). */
	preparedStatementPlaceholder = () => {
		return "?";
	};
	/** Runtime options associated with this configuration. */
	runtimeConfiguration = () => {
		return this._mysqlRuntimeConfiguration;
	};
	/** Single-quote delimiter for string literals. */
	stringDelimiter = () => {
		return "'";
	};
	/** Keywords delimiting a transaction block for this dialect. */
	transactionDelimiters = () => {
		return {
			begin: "START TRANSACTION",
			end: "COMMIT"
		};
	};
};
//#endregion
//#region src/sqleasy/mysql/mysql_multi_builder.ts
/** MySQL {@link DefaultMultiBuilder} for batching multiple statements with shared configuration. */
var MysqlMultiBuilder = class extends DefaultMultiBuilder {
	_mysqlConfig;
	/** @param config - MySQL dialect configuration shared by child builders and parsers. */
	constructor(config) {
		super(config);
		this._mysqlConfig = config;
	}
	/** Creates a fresh {@link MysqlBuilder} using this multi-builder’s configuration. */
	newBuilder = () => {
		return new MysqlBuilder(this._mysqlConfig);
	};
	/** Creates a fresh {@link MysqlParser} using this multi-builder’s configuration. */
	newParser = () => {
		return new MysqlParser(this._mysqlConfig);
	};
};
//#endregion
//#region src/sqleasy/mysql/mysql_sqleasy.ts
/** Main entry point for MySQL; implements {@link ISqlEasy} for MySQL builders and parsers. */
var MysqlSqlEasy = class {
	_mysqlConfiguration;
	/** @param rc - Optional runtime options; defaults to a new {@link RuntimeConfiguration} when omitted. */
	constructor(rc) {
		if (rc === null || rc === void 0) rc = new RuntimeConfiguration();
		this._mysqlConfiguration = new MysqlConfiguration(rc);
	}
	/** Returns the shared MySQL dialect configuration for this instance. */
	configuration = () => {
		return this._mysqlConfiguration;
	};
	/** Creates a query builder, optionally with a one-off {@link RuntimeConfiguration}. */
	newBuilder = (rc) => {
		if (rc === null || rc === void 0) return new MysqlBuilder(this._mysqlConfiguration);
		return new MysqlBuilder(new MysqlConfiguration(rc));
	};
	/** Creates a multi-statement builder, optionally with a one-off {@link RuntimeConfiguration}. */
	newMultiBuilder = (rc) => {
		if (rc === null || rc === void 0) return new MysqlMultiBuilder(this._mysqlConfiguration);
		return new MysqlMultiBuilder(new MysqlConfiguration(rc));
	};
};
//#endregion
//#region src/sqleasy/postgres/postgres_join_on_builder.ts
/** PostgreSQL {@link DefaultJoinOnBuilder} for constructing `JOIN ... ON` fragments. */
var PostgresJoinOnBuilder = class PostgresJoinOnBuilder extends DefaultJoinOnBuilder {
	_postgresConfig;
	/** @param config - PostgreSQL dialect configuration used when emitting join conditions. */
	constructor(config) {
		super(config);
		this._postgresConfig = config;
	}
	/** Returns a new join-on builder, reusing this configuration unless `config` is provided. */
	newJoinOnBuilder = (config) => {
		return new PostgresJoinOnBuilder(config ?? this._postgresConfig);
	};
};
//#endregion
//#region src/sqleasy/postgres/postgres_parser.ts
var PostgresParser = class extends DefaultParser {
	_postgresConfiguration;
	constructor(config) {
		super(config);
		this._postgresConfiguration = config;
	}
	toSql = (state) => {
		let sql = defaultToSql(state, this._postgresConfiguration, ParserMode.Prepared).getSql();
		const placeholder = this._postgresConfiguration.preparedStatementPlaceholder();
		let paramIndex = 1;
		let searchFrom = 0;
		while (true) {
			const pos = sql.indexOf(placeholder, searchFrom);
			if (pos === -1) break;
			const replacement = "$" + paramIndex;
			sql = sql.slice(0, pos) + replacement + sql.slice(pos + placeholder.length);
			searchFrom = pos + replacement.length;
			paramIndex++;
		}
		return sql;
	};
	toSqlMulti = (states, transactionState) => {
		const finalString = new SqlHelper(this._postgresConfiguration, ParserMode.Prepared);
		if (transactionState === MultiBuilderTransactionState.TransactionOn) finalString.addSqlSnippet(this._postgresConfiguration.transactionDelimiters().begin + "; ");
		for (const state of states) {
			const sql = this.toSql(state);
			finalString.addSqlSnippet(sql);
		}
		if (transactionState === MultiBuilderTransactionState.TransactionOn) finalString.addSqlSnippet(this._postgresConfiguration.transactionDelimiters().end + ";");
		return finalString.getSql();
	};
};
//#endregion
//#region src/sqleasy/postgres/postgres_builder.ts
/** PostgreSQL {@link DefaultBuilder}; creates dialect parsers and join-on builders. */
var PostgresBuilder = class PostgresBuilder extends DefaultBuilder {
	_postgresConfig;
	/** @param config - PostgreSQL dialect configuration used for SQL generation. */
	constructor(config) {
		super(config);
		this._postgresConfig = config;
	}
	/** Returns a new builder, reusing this configuration unless `config` is provided. */
	newBuilder = (config) => {
		return new PostgresBuilder(config ?? this._postgresConfig);
	};
	/** Returns a new join-on builder for this dialect. */
	newJoinOnBuilder = (config) => {
		return new PostgresJoinOnBuilder(config ?? this._postgresConfig);
	};
	/** Returns a new PostgreSQL parser instance. */
	newParser = (config) => {
		return new PostgresParser(config ?? this._postgresConfig);
	};
};
//#endregion
//#region src/sqleasy/postgres/postgres_configuration.ts
/** {@link IConfiguration} for PostgreSQL (delimiters, placeholders, default schema). */
var PostgresConfiguration = class {
	_postgresRuntimeConfiguration;
	/** @param rc - Runtime options (e.g. row limits) bound to this dialect configuration. */
	constructor(rc) {
		this._postgresRuntimeConfiguration = rc;
	}
	/** Returns {@link DatabaseType.Postgres}. */
	databaseType = () => {
		return DatabaseType.Postgres;
	};
	/** Default schema for unqualified objects (`public`). */
	defaultOwner = () => {
		return "public";
	};
	/** Double-quote delimiters for quoted identifiers. */
	identifierDelimiters = () => {
		return {
			begin: "\"",
			end: "\""
		};
	};
	/** Prefix for numbered prepared statement placeholders (`$`). */
	preparedStatementPlaceholder = () => {
		return "$";
	};
	/** Runtime options associated with this configuration. */
	runtimeConfiguration = () => {
		return this._postgresRuntimeConfiguration;
	};
	/** Single-quote delimiter for string literals. */
	stringDelimiter = () => {
		return "'";
	};
	/** Keywords delimiting a transaction block for this dialect. */
	transactionDelimiters = () => {
		return {
			begin: "BEGIN",
			end: "COMMIT"
		};
	};
};
//#endregion
//#region src/sqleasy/postgres/postgres_multi_builder.ts
/** PostgreSQL {@link DefaultMultiBuilder} for batching multiple statements with shared configuration. */
var PostgresMultiBuilder = class extends DefaultMultiBuilder {
	_postgresConfig;
	/** @param config - PostgreSQL dialect configuration shared by child builders and parsers. */
	constructor(config) {
		super(config);
		this._postgresConfig = config;
	}
	/** Creates a fresh {@link PostgresBuilder} using this multi-builder’s configuration. */
	newBuilder = () => {
		return new PostgresBuilder(this._postgresConfig);
	};
	/** Creates a fresh {@link PostgresParser} using this multi-builder’s configuration. */
	newParser = () => {
		return new PostgresParser(this._postgresConfig);
	};
};
//#endregion
//#region src/sqleasy/postgres/postgres_sqleasy.ts
/** Main entry point for PostgreSQL; implements {@link ISqlEasy} for Postgres builders and parsers. */
var PostgresSqlEasy = class {
	_postgresConfig;
	/** @param rc - Optional runtime options; defaults to a new {@link RuntimeConfiguration} when omitted. */
	constructor(rc) {
		if (rc === null || rc === void 0) rc = new RuntimeConfiguration();
		this._postgresConfig = new PostgresConfiguration(rc);
	}
	/** Returns the shared PostgreSQL dialect configuration for this instance. */
	configuration = () => {
		return this._postgresConfig;
	};
	/** Creates a query builder, optionally with a one-off {@link RuntimeConfiguration}. */
	newBuilder = (rc) => {
		if (rc === null || rc === void 0) return new PostgresBuilder(this._postgresConfig);
		return new PostgresBuilder(new PostgresConfiguration(rc));
	};
	/** Creates a multi-statement builder, optionally with a one-off {@link RuntimeConfiguration}. */
	newMultiBuilder = (rc) => {
		if (rc === null || rc === void 0) return new PostgresMultiBuilder(this._postgresConfig);
		return new PostgresMultiBuilder(new PostgresConfiguration(rc));
	};
};
//#endregion
//#region src/sqleasy/sqlite/sqlite_join_on_builder.ts
/** SQLite {@link DefaultJoinOnBuilder} for constructing `JOIN ... ON` fragments. */
var SqliteJoinOnBuilder = class SqliteJoinOnBuilder extends DefaultJoinOnBuilder {
	_sqliteConfig;
	/** @param config - SQLite dialect configuration used when emitting join conditions. */
	constructor(config) {
		super(config);
		this._sqliteConfig = config;
	}
	/** Returns a new join-on builder, reusing this configuration unless `config` is provided. */
	newJoinOnBuilder = (config) => {
		return new SqliteJoinOnBuilder(config ?? this._sqliteConfig);
	};
};
//#endregion
//#region src/sqleasy/sqlite/sqlite_parser.ts
var SqliteParser = class extends DefaultParser {
	_sqliteConfiguration;
	constructor(config) {
		super(config);
		this._sqliteConfiguration = config;
	}
	toSql = (state) => {
		return defaultToSql(state, this._sqliteConfiguration, ParserMode.Prepared).getSql();
	};
	toSqlMulti = (states, transactionState) => {
		const finalString = new SqlHelper(this._sqliteConfiguration, ParserMode.Prepared);
		if (transactionState === MultiBuilderTransactionState.TransactionOn) finalString.addSqlSnippet(this._sqliteConfiguration.transactionDelimiters().begin + "; ");
		for (const state of states) {
			const sql = this.toSql(state);
			finalString.addSqlSnippet(sql);
		}
		if (transactionState === MultiBuilderTransactionState.TransactionOn) finalString.addSqlSnippet(this._sqliteConfiguration.transactionDelimiters().end + ";");
		return finalString.getSql();
	};
};
//#endregion
//#region src/sqleasy/sqlite/sqlite_builder.ts
/** SQLite {@link DefaultBuilder}; creates dialect parsers and join-on builders. */
var SqliteBuilder = class SqliteBuilder extends DefaultBuilder {
	_sqliteConfig;
	/** @param config - SQLite dialect configuration used for SQL generation. */
	constructor(config) {
		super(config);
		this._sqliteConfig = config;
	}
	/** Returns a new builder, reusing this configuration unless `config` is provided. */
	newBuilder = (config) => {
		return new SqliteBuilder(config ?? this._sqliteConfig);
	};
	/** Returns a new join-on builder for this dialect. */
	newJoinOnBuilder = (config) => {
		return new SqliteJoinOnBuilder(config ?? this._sqliteConfig);
	};
	/** Returns a new SQLite parser instance. */
	newParser = (config) => {
		return new SqliteParser(config ?? this._sqliteConfig);
	};
};
//#endregion
//#region src/sqleasy/sqlite/sqlite_configuration.ts
/** {@link IConfiguration} for SQLite (delimiters, placeholders, transactions). */
var SqliteConfiguration = class {
	_sqliteRuntimeConfiguration;
	/** @param rc - Runtime options (e.g. row limits) bound to this dialect configuration. */
	constructor(rc) {
		this._sqliteRuntimeConfiguration = rc;
	}
	/** Returns {@link DatabaseType.Sqlite}. */
	databaseType = () => {
		return DatabaseType.Sqlite;
	};
	/** Default owner for unqualified objects (empty for SQLite). */
	defaultOwner = () => {
		return "";
	};
	/** Double-quote delimiters for quoted identifiers. */
	identifierDelimiters = () => {
		return {
			begin: "\"",
			end: "\""
		};
	};
	/** Placeholder character for parameterized SQL (`?`). */
	preparedStatementPlaceholder = () => {
		return "?";
	};
	/** Runtime options associated with this configuration. */
	runtimeConfiguration = () => {
		return this._sqliteRuntimeConfiguration;
	};
	/** Single-quote delimiter for string literals. */
	stringDelimiter = () => {
		return "'";
	};
	/** Keywords delimiting a transaction block for this dialect. */
	transactionDelimiters = () => {
		return {
			begin: "BEGIN",
			end: "COMMIT"
		};
	};
};
//#endregion
//#region src/sqleasy/sqlite/sqlite_multi_builder.ts
/** SQLite {@link DefaultMultiBuilder} for batching multiple statements with shared configuration. */
var SqliteMultiBuilder = class extends DefaultMultiBuilder {
	_sqliteConfig;
	/** @param config - SQLite dialect configuration shared by child builders and parsers. */
	constructor(config) {
		super(config);
		this._sqliteConfig = config;
	}
	/** Creates a fresh {@link SqliteBuilder} using this multi-builder’s configuration. */
	newBuilder = () => {
		return new SqliteBuilder(this._sqliteConfig);
	};
	/** Creates a fresh {@link SqliteParser} using this multi-builder’s configuration. */
	newParser = () => {
		return new SqliteParser(this._sqliteConfig);
	};
};
//#endregion
//#region src/sqleasy/sqlite/sqlite_sqleasy.ts
/** Main entry point for SQLite; implements {@link ISqlEasy} for SQLite builders and parsers. */
var SqliteSqlEasy = class {
	_sqliteConfiguration;
	/** @param rc - Optional runtime options; defaults to a new {@link RuntimeConfiguration} when omitted. */
	constructor(rc) {
		if (rc === null || rc === void 0) rc = new RuntimeConfiguration();
		this._sqliteConfiguration = new SqliteConfiguration(rc);
	}
	/** Returns the shared SQLite dialect configuration for this instance. */
	configuration = () => {
		return this._sqliteConfiguration;
	};
	/** Creates a query builder, optionally with a one-off {@link RuntimeConfiguration}. */
	newBuilder = (rc) => {
		if (rc === null || rc === void 0) return new SqliteBuilder(this._sqliteConfiguration);
		return new SqliteBuilder(new SqliteConfiguration(rc));
	};
	/** Creates a multi-statement builder, optionally with a one-off {@link RuntimeConfiguration}. */
	newMultiBuilder = (rc) => {
		if (rc === null || rc === void 0) return new SqliteMultiBuilder(this._sqliteConfiguration);
		return new SqliteMultiBuilder(new SqliteConfiguration(rc));
	};
};
//#endregion
//#region src/state/cte_state.ts
/**
* Holds state for a single WITH (CTE) clause entry: name, body, and recursion flag.
* Populated by the builder; exposed via {@link SqlEasyState.cteStates}.
*/
var CteState = class {
	/** Which builder variant produced this state. */
	builderType = BuilderType.None;
	/** CTE name as declared in WITH. */
	name = "";
	/** Whether this CTE is declared as RECURSIVE. */
	recursive = false;
	/** Nested query state for the CTE body, when not using raw SQL. */
	sqlEasyState = void 0;
	/** Raw SQL fragment for the CTE body when bypassing structured state. */
	raw = void 0;
};
//#endregion
//#region src/state/from_state.ts
/**
* Holds state for one FROM source (table, subquery, or raw).
* Populated by the builder; exposed via {@link SqlEasyState.fromStates}.
*/
var FromState = class {
	/** Which builder variant produced this state. */
	builderType = BuilderType.None;
	/** Schema or database owner qualifier for the table. */
	owner = void 0;
	/** Base table name when this source is a table. */
	tableName = void 0;
	/** Table or subquery alias in the FROM clause. */
	alias = void 0;
	/** Nested query state when this FROM entry is a subquery. */
	sqlEasyState = void 0;
	/** Raw SQL for this FROM fragment when not using structured fields. */
	raw = void 0;
};
//#endregion
//#region src/state/group_by_state.ts
/**
* Holds state for one GROUP BY expression (column or raw).
* Populated by the builder; exposed via {@link SqlEasyState.groupByStates}.
*/
var GroupByState = class {
	/** Which builder variant produced this state. */
	builderType = BuilderType.None;
	/** Table name or alias qualifying the grouped column. */
	tableNameOrAlias = void 0;
	/** Column name being grouped. */
	columnName = void 0;
	/** Raw SQL for this GROUP BY term when not using structured fields. */
	raw = void 0;
};
//#endregion
//#region src/state/having_state.ts
/**
* Holds state for one HAVING predicate (similar shape to WHERE).
* Populated by the builder; exposed via {@link SqlEasyState.havingStates}.
*/
var HavingState = class {
	/** Which builder variant produced this state. */
	builderType = BuilderType.None;
	/** Table name or alias qualifying the column in the predicate. */
	tableNameOrAlias = void 0;
	/** Column name in the HAVING expression. */
	columnName = void 0;
	/** Comparison or logical operator for this HAVING term. */
	whereOperator = WhereOperator.None;
	/** Raw SQL for this HAVING fragment when not using structured fields. */
	raw = void 0;
	/** Bound parameter values associated with this predicate. */
	values = [];
};
//#endregion
//#region src/state/join_on_state.ts
/**
* Holds state for one ON (or AND) join condition between two sides.
* Populated by the builder; nested under {@link JoinState.joinOnStates}.
*/
var JoinOnState = class {
	/** Alias of the left-hand column in the join condition. */
	aliasLeft = void 0;
	/** Left-hand column name. */
	columnLeft = void 0;
	/** Operator relating left and right (e.g. equals). */
	joinOperator = JoinOperator.Equals;
	/** Alias of the right-hand side (column or literal context). */
	aliasRight = void 0;
	/** Right-hand column name when the RHS is a column. */
	columnRight = void 0;
	/** AND/OR style combinator with the next join-on term. */
	joinOnOperator = JoinOnOperator.None;
	/** Raw SQL for this join condition when not using structured fields. */
	raw = void 0;
	/** Right-hand value when the RHS is a literal or parameter. */
	valueRight = void 0;
};
//#endregion
//#region src/state/join_state.ts
/**
* Holds state for one JOIN (table/subquery, type, and ON clauses).
* Populated by the builder; exposed via {@link SqlEasyState.joinStates}.
*/
var JoinState = class {
	/** Which builder variant produced this state. */
	builderType = BuilderType.None;
	/** INNER, LEFT, RIGHT, etc. */
	joinType = JoinType.Inner;
	/** Schema or owner for the joined table. */
	owner = void 0;
	/** Joined table name. */
	tableName = void 0;
	/** Alias for the joined relation. */
	alias = void 0;
	/** Nested query state when the join target is a subquery. */
	sqlEasyState = void 0;
	/** Raw SQL for the join target or full join fragment when applicable. */
	raw = void 0;
	/** Ordered ON/AND conditions for this join. */
	joinOnStates = [];
};
//#endregion
//#region src/state/order_by_state.ts
/**
* Holds state for one ORDER BY sort key and direction.
* Populated by the builder; exposed via {@link SqlEasyState.orderByStates}.
*/
var OrderByState = class {
	/** Which builder variant produced this state. */
	builderType = BuilderType.None;
	/** Table name or alias qualifying the sort column. */
	tableNameOrAlias = void 0;
	/** Column or expression name used for ordering. */
	columnName = void 0;
	/** ASC, DESC, or none. */
	direction = OrderByDirection.None;
	/** Raw SQL for this ORDER BY term when not using structured fields. */
	raw = void 0;
};
//#endregion
//#region src/state/select_state.ts
/**
* Holds state for one SELECT list item (column, subquery, alias, or raw).
* Populated by the builder; exposed via {@link SqlEasyState.selectStates}.
*/
var SelectState = class {
	/** Which builder variant produced this state. */
	builderType = BuilderType.None;
	/** Table name or alias qualifying the selected column. */
	tableNameOrAlias = void 0;
	/** Column name or expression identifier. */
	columnName = void 0;
	/** Output alias for this select item. */
	alias = void 0;
	/** Nested query state when this item is a scalar subquery. */
	sqlEasyState = void 0;
	/** Raw SQL for this select item when not using structured fields. */
	raw = void 0;
};
//#endregion
//#region src/state/union_state.ts
/**
* Holds state for one UNION (or similar) branch: nested query or raw SQL.
* Populated by the builder; exposed via {@link SqlEasyState.unionStates}.
*/
var UnionState = class {
	/** Which builder variant produced this state. */
	builderType = BuilderType.None;
	/** State for the branch query when not represented as raw SQL. */
	sqlEasyState = void 0;
	/** Raw SQL for this compound branch when applicable. */
	raw = void 0;
};
//#endregion
//#region src/state/update_state.ts
/**
* Holds state for one UPDATE SET assignment (column and value or raw).
* Populated by the builder; exposed via {@link SqlEasyState.updateStates}.
*/
var UpdateState = class {
	/** Which builder variant produced this state. */
	builderType = BuilderType.None;
	/** Target column name being updated. */
	columnName = void 0;
	/** New value or parameter placeholder binding. */
	value = void 0;
	/** Raw SQL for this SET fragment when not using structured fields. */
	raw = void 0;
};
//#endregion
//#region src/state/where_state.ts
/**
* Holds state for one WHERE predicate (column op value, subquery, or raw).
* Populated by the builder; exposed via {@link SqlEasyState.whereStates}.
*/
var WhereState = class {
	/** Which builder variant produced this state. */
	builderType = BuilderType.None;
	/** Table name or alias qualifying the column. */
	tableNameOrAlias = void 0;
	/** Column name in the predicate. */
	columnName = void 0;
	/** Comparison or logical operator for this term. */
	whereOperator = WhereOperator.None;
	/** Raw SQL for this WHERE fragment when not using structured fields. */
	raw = void 0;
	/** Nested query state when the RHS is a subquery. */
	sqlEasyState = void 0;
	/** Bound parameter values for this predicate. */
	values = [];
};
//#endregion
export { BuilderType, ConfigurationDelimiters, CteState, DatabaseType, FromState, GroupByState, HavingState, InsertState, JoinOnOperator, JoinOnState, JoinOperator, JoinState, JoinType, MssqlBuilder, MssqlConfiguration, MssqlJoinOnBuilder, MssqlMultiBuilder, MssqlSqlEasy, MultiBuilderTransactionState, MysqlBuilder, MysqlConfiguration, MysqlJoinOnBuilder, MysqlMultiBuilder, MysqlSqlEasy, OrderByDirection, OrderByState, ParserArea, ParserError, PostgresBuilder, PostgresConfiguration, PostgresJoinOnBuilder, PostgresMultiBuilder, PostgresSqlEasy, QueryType, RuntimeConfiguration, SelectState, SqlEasyState, SqliteBuilder, SqliteConfiguration, SqliteJoinOnBuilder, SqliteMultiBuilder, SqliteSqlEasy, UnionState, UpdateState, WhereOperator, WhereState };

//# sourceMappingURL=index.mjs.map