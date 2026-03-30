import StringBuilder from "@deebeetech/string-builder";
//#region src/enums/builder_type.ts
let BuilderType = /* @__PURE__ */ function(BuilderType) {
	BuilderType[BuilderType["And"] = 0] = "And";
	BuilderType[BuilderType["FromBuilder"] = 1] = "FromBuilder";
	BuilderType[BuilderType["FromTable"] = 2] = "FromTable";
	BuilderType[BuilderType["FromRaw"] = 3] = "FromRaw";
	BuilderType[BuilderType["JoinBuilder"] = 4] = "JoinBuilder";
	BuilderType[BuilderType["JoinRaw"] = 5] = "JoinRaw";
	BuilderType[BuilderType["JoinTable"] = 6] = "JoinTable";
	BuilderType[BuilderType["None"] = 7] = "None";
	BuilderType[BuilderType["Or"] = 8] = "Or";
	BuilderType[BuilderType["OrderByColumn"] = 9] = "OrderByColumn";
	BuilderType[BuilderType["OrderByRaw"] = 10] = "OrderByRaw";
	BuilderType[BuilderType["SelectAll"] = 11] = "SelectAll";
	BuilderType[BuilderType["SelectBuilder"] = 12] = "SelectBuilder";
	BuilderType[BuilderType["SelectColumn"] = 13] = "SelectColumn";
	BuilderType[BuilderType["SelectRaw"] = 14] = "SelectRaw";
	BuilderType[BuilderType["Where"] = 15] = "Where";
	BuilderType[BuilderType["WhereBetween"] = 16] = "WhereBetween";
	BuilderType[BuilderType["WhereGroupBegin"] = 17] = "WhereGroupBegin";
	BuilderType[BuilderType["WhereGroupBuilder"] = 18] = "WhereGroupBuilder";
	BuilderType[BuilderType["WhereGroupEnd"] = 19] = "WhereGroupEnd";
	BuilderType[BuilderType["WhereExistsBuilder"] = 20] = "WhereExistsBuilder";
	BuilderType[BuilderType["WhereInBuilder"] = 21] = "WhereInBuilder";
	BuilderType[BuilderType["WhereInValues"] = 22] = "WhereInValues";
	BuilderType[BuilderType["WhereNotExistsBuilder"] = 23] = "WhereNotExistsBuilder";
	BuilderType[BuilderType["WhereNotInBuilder"] = 24] = "WhereNotInBuilder";
	BuilderType[BuilderType["WhereNotInValues"] = 25] = "WhereNotInValues";
	BuilderType[BuilderType["WhereNotNull"] = 26] = "WhereNotNull";
	BuilderType[BuilderType["WhereNull"] = 27] = "WhereNull";
	BuilderType[BuilderType["WhereRaw"] = 28] = "WhereRaw";
	return BuilderType;
}({});
//#endregion
//#region src/enums/join_type.ts
let JoinType = /* @__PURE__ */ function(JoinType) {
	JoinType[JoinType["Inner"] = 0] = "Inner";
	JoinType[JoinType["Left"] = 1] = "Left";
	JoinType[JoinType["LeftOuter"] = 2] = "LeftOuter";
	JoinType[JoinType["Right"] = 3] = "Right";
	JoinType[JoinType["RightOuter"] = 4] = "RightOuter";
	JoinType[JoinType["FullOuter"] = 5] = "FullOuter";
	JoinType[JoinType["Cross"] = 6] = "Cross";
	JoinType[JoinType["None"] = 7] = "None";
	return JoinType;
}({});
//#endregion
//#region src/enums/order_by_direction.ts
let OrderByDirection = /* @__PURE__ */ function(OrderByDirection) {
	OrderByDirection[OrderByDirection["Ascending"] = 0] = "Ascending";
	OrderByDirection[OrderByDirection["Descending"] = 1] = "Descending";
	OrderByDirection[OrderByDirection["None"] = 2] = "None";
	return OrderByDirection;
}({});
//#endregion
//#region src/enums/where_operator.ts
let WhereOperator = /* @__PURE__ */ function(WhereOperator) {
	WhereOperator[WhereOperator["Equals"] = 0] = "Equals";
	WhereOperator[WhereOperator["NotEquals"] = 1] = "NotEquals";
	WhereOperator[WhereOperator["GreaterThan"] = 2] = "GreaterThan";
	WhereOperator[WhereOperator["GreaterThanOrEquals"] = 3] = "GreaterThanOrEquals";
	WhereOperator[WhereOperator["LessThan"] = 4] = "LessThan";
	WhereOperator[WhereOperator["LessThanOrEquals"] = 5] = "LessThanOrEquals";
	WhereOperator[WhereOperator["None"] = 6] = "None";
	return WhereOperator;
}({});
//#endregion
//#region src/state/sqleasy_state.ts
var SqlEasyState = class {
	builderName = "";
	fromStates = [];
	joinStates = [];
	whereStates = [];
	orderByStates = [];
	selectStates = [];
	isInnerStatement = false;
	limit = 0;
	offset = 0;
	distinct = false;
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
};
//#endregion
//#region src/enums/join_on_operator.ts
let JoinOnOperator = /* @__PURE__ */ function(JoinOnOperator) {
	JoinOnOperator[JoinOnOperator["GroupBegin"] = 0] = "GroupBegin";
	JoinOnOperator[JoinOnOperator["GroupEnd"] = 1] = "GroupEnd";
	JoinOnOperator[JoinOnOperator["On"] = 2] = "On";
	JoinOnOperator[JoinOnOperator["Raw"] = 3] = "Raw";
	JoinOnOperator[JoinOnOperator["Value"] = 4] = "Value";
	JoinOnOperator[JoinOnOperator["And"] = 5] = "And";
	JoinOnOperator[JoinOnOperator["Or"] = 6] = "Or";
	JoinOnOperator[JoinOnOperator["None"] = 7] = "None";
	return JoinOnOperator;
}({});
//#endregion
//#region src/enums/join_operator.ts
let JoinOperator = /* @__PURE__ */ function(JoinOperator) {
	JoinOperator[JoinOperator["Equals"] = 0] = "Equals";
	JoinOperator[JoinOperator["NotEquals"] = 1] = "NotEquals";
	JoinOperator[JoinOperator["GreaterThan"] = 2] = "GreaterThan";
	JoinOperator[JoinOperator["GreaterThanOrEquals"] = 3] = "GreaterThanOrEquals";
	JoinOperator[JoinOperator["LessThan"] = 4] = "LessThan";
	JoinOperator[JoinOperator["LessThanOrEquals"] = 5] = "LessThanOrEquals";
	JoinOperator[JoinOperator["None"] = 6] = "None";
	return JoinOperator;
}({});
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
//#region src/enums/multi_builder_transaction_state.ts
let MultiBuilderTransactionState = /* @__PURE__ */ function(MultiBuilderTransactionState) {
	MultiBuilderTransactionState[MultiBuilderTransactionState["TransactionOn"] = 0] = "TransactionOn";
	MultiBuilderTransactionState[MultiBuilderTransactionState["TransactionOff"] = 1] = "TransactionOff";
	MultiBuilderTransactionState[MultiBuilderTransactionState["None"] = 2] = "None";
	return MultiBuilderTransactionState;
}({});
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
//#region src/configuration/configuration_delimiters.ts
var ConfigurationDelimiters = class {
	begin = "";
	end = "";
};
//#endregion
//#region src/configuration/runtime_configuration.ts
var RuntimeConfiguration = class {
	maxRowsReturned = 1e3;
	customConfiguration = void 0;
};
//#endregion
//#region src/enums/database_type.ts
let DatabaseType = /* @__PURE__ */ function(DatabaseType) {
	DatabaseType[DatabaseType["Mssql"] = 0] = "Mssql";
	DatabaseType[DatabaseType["Postgres"] = 1] = "Postgres";
	DatabaseType[DatabaseType["Mysql"] = 2] = "Mysql";
	DatabaseType[DatabaseType["Sqlite"] = 3] = "Sqlite";
	DatabaseType[DatabaseType["Unknown"] = 4] = "Unknown";
	return DatabaseType;
}({});
//#endregion
//#region src/enums/datatype.ts
let Datatype = /* @__PURE__ */ function(Datatype) {
	Datatype[Datatype["Boolean"] = 0] = "Boolean";
	Datatype[Datatype["DateTime"] = 1] = "DateTime";
	Datatype[Datatype["Number"] = 2] = "Number";
	Datatype[Datatype["String"] = 3] = "String";
	Datatype[Datatype["Unknown"] = 4] = "Unknown";
	return Datatype;
}({});
//#endregion
//#region src/enums/parser_area.ts
let ParserArea = /* @__PURE__ */ function(ParserArea) {
	ParserArea[ParserArea["Select"] = 0] = "Select";
	ParserArea[ParserArea["From"] = 1] = "From";
	ParserArea[ParserArea["Join"] = 2] = "Join";
	ParserArea[ParserArea["Where"] = 3] = "Where";
	ParserArea[ParserArea["OrderBy"] = 4] = "OrderBy";
	ParserArea[ParserArea["LimitOffset"] = 5] = "LimitOffset";
	ParserArea[ParserArea["General"] = 6] = "General";
	return ParserArea;
}({});
//#endregion
//#region src/enums/parser_mode.ts
let ParserMode = /* @__PURE__ */ function(ParserMode) {
	ParserMode[ParserMode["Raw"] = 0] = "Raw";
	ParserMode[ParserMode["Prepared"] = 1] = "Prepared";
	ParserMode[ParserMode["None"] = 2] = "None";
	return ParserMode;
}({});
//#endregion
//#region src/helpers/parser_error.ts
var ParserError = class extends Error {
	constructor(parserArea, message) {
		const finalMessage = `${parserArea}: ${message}`;
		super(finalMessage);
		this.name = "SqlEasyParserError";
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
	addSqlSnippetWithValues = (sqlString, value) => {
		this._values.push(value);
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
		this._values.forEach((value) => {
			const valuePosition = sqlString.indexOf(this._config.preparedStatementPlaceholder());
			if (valuePosition === -1) return;
			sqlString = sqlString.substring(0, valuePosition) + value + sqlString.substring(valuePosition + 1);
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
	if (config.databaseType() == DatabaseType.Mysql || config.databaseType() == DatabaseType.Postgres) {
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
const defaultSelect = (state, config, mode) => {
	const sqlHelper = new SqlHelper(config, mode);
	if (state.selectStates.length === 0) throw new ParserError(ParserArea.Select, "Select statement must have at least one select state");
	sqlHelper.addSqlSnippet("SELECT ");
	if (state.distinct) sqlHelper.addSqlSnippet("DISTINCT ");
	if (config.databaseType() === DatabaseType.Mssql) {
		if (state.customState !== null && state.customState !== void 0 && state.customState["top"] !== null && state.customState["top"] !== void 0 && state.customState["top"] > 0) {
			sqlHelper.addSqlSnippet("TOP ");
			sqlHelper.addSqlSnippet(`(${state.customState["top"]})`);
			sqlHelper.addSqlSnippet(" ");
		}
		if (state.customState !== null && state.customState !== void 0 && (state.customState["top"] === null || state.customState["top"] === void 0) && !state.isInnerStatement && state.limit === 0 && (!state.whereStates || state.whereStates.length === 0)) {
			sqlHelper.addSqlSnippet("TOP ");
			sqlHelper.addSqlSnippet(`(${config.runtimeConfiguration().maxRowsReturned})`);
			sqlHelper.addSqlSnippet(" ");
		}
	}
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
const defaultToSql = (state, config, mode) => {
	const sqlHelper = new SqlHelper(config, mode);
	if (state === null || state === void 0) throw new ParserError(ParserArea.General, "No state provided");
	const sel = defaultSelect(state, config, mode);
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
//#region src/parser/default_parser.ts
var DefaultParser = class {
	_config;
	constructor(config) {
		this._config = config;
	}
	toSqlRaw = (state) => {
		return defaultToSql(state, this._config, ParserMode.Raw).getSqlDebug();
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
//#region src/sqleasy/mssql/mssql_join_on_builder.ts
var MssqlJoinOnBuilder = class MssqlJoinOnBuilder extends DefaultJoinOnBuilder {
	_mssqlConfiguration;
	constructor(config) {
		super(config);
		this._mssqlConfiguration = config;
	}
	newJoinOnBuilder = () => {
		return new MssqlJoinOnBuilder(this._mssqlConfiguration);
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
	toSql = (state) => {
		const paramsString = new SqlHelper(this._mssqlConfiguration, ParserMode.Prepared);
		const finalString = new SqlHelper(this._mssqlConfiguration, ParserMode.Prepared);
		const sqlHelper = defaultToSql(state, this._mssqlConfiguration, ParserMode.Prepared);
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
	toSqlMulti = (_states, _transactionState) => {
		throw new ParserError(ParserArea.General, "toSqlMulti not implemented for MssqlParser");
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
var MssqlBuilder = class MssqlBuilder extends DefaultBuilder {
	_mssqlConfig;
	constructor(config) {
		super(config);
		this._mssqlConfig = config;
	}
	newBuilder = () => {
		return new MssqlBuilder(this._mssqlConfig);
	};
	newJoinOnBuilder = () => {
		return new MssqlJoinOnBuilder(this._mssqlConfig);
	};
	newParser = () => {
		return new MssqlParser(this._mssqlConfig);
	};
	clearTop = () => {
		delete this.state().customState["top"];
		return this;
	};
	top = (top) => {
		this.state().customState["top"] = top;
		return this;
	};
};
//#endregion
//#region src/sqleasy/mssql/mssql_configuration.ts
var MssqlConfiguration = class {
	_mssqlRuntimeConfiguration;
	constructor(rc) {
		this._mssqlRuntimeConfiguration = rc;
	}
	databaseType = () => {
		return DatabaseType.Mssql;
	};
	defaultOwner = () => {
		return "dbo";
	};
	identifierDelimiters = () => {
		return {
			begin: "[",
			end: "]"
		};
	};
	preparedStatementPlaceholder = () => {
		return "?";
	};
	runtimeConfiguration = () => {
		return this._mssqlRuntimeConfiguration;
	};
	stringDelimiter = () => {
		return "'";
	};
	transactionDelimiters = () => {
		return {
			begin: "BEGIN TRANSACTION",
			end: "COMMIT TRANSACTION"
		};
	};
};
//#endregion
//#region src/sqleasy/mssql/mssql_multi_builder.ts
var MssqlMultiBuilder = class extends DefaultMultiBuilder {
	_mssqlConfiguration;
	constructor(config) {
		super(config);
		this._mssqlConfiguration = config;
	}
	newBuilder = () => {
		return new MssqlBuilder(this._mssqlConfiguration);
	};
	newParser = () => {
		return new MssqlParser(this._mssqlConfiguration);
	};
};
//#endregion
//#region src/sqleasy/mssql/mssql_sqleasy.ts
var MssqlSqlEasy = class {
	_mssqlConfiguration;
	constructor(rc) {
		if (rc === null || rc === void 0) rc = new RuntimeConfiguration();
		this._mssqlConfiguration = new MssqlConfiguration(rc);
	}
	configuration = () => {
		return this._mssqlConfiguration;
	};
	newBuilder = (rc) => {
		if (rc === null || rc === void 0) return new MssqlBuilder(this._mssqlConfiguration);
		return new MssqlBuilder(new MssqlConfiguration(rc));
	};
	newMultiBuilder = (rc) => {
		if (rc === null || rc === void 0) return new MssqlMultiBuilder(this._mssqlConfiguration);
		return new MssqlMultiBuilder(new MssqlConfiguration(rc));
	};
};
//#endregion
//#region src/sqleasy/mysql/mysql_join_on_builder.ts
var MysqlJoinOnBuilder = class MysqlJoinOnBuilder extends DefaultJoinOnBuilder {
	_mysqlConfig;
	constructor(config) {
		super(config);
		this._mysqlConfig = config;
	}
	newJoinOnBuilder = () => {
		return new MysqlJoinOnBuilder(this._mysqlConfig);
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
	toSql = (_state) => {
		throw new ParserError(ParserArea.General, "toSql not implemented for MysqlParser");
	};
	toSqlMulti = (_states, _transactionState) => {
		throw new ParserError(ParserArea.General, "toSqlMulti not implemented for MysqlParser");
	};
};
//#endregion
//#region src/sqleasy/mysql/mysql_builder.ts
var MysqlBuilder = class MysqlBuilder extends DefaultBuilder {
	_mysqlConfig;
	constructor(config) {
		super(config);
		this._mysqlConfig = config;
	}
	newBuilder = () => {
		return new MysqlBuilder(this._mysqlConfig);
	};
	newJoinOnBuilder = () => {
		return new MysqlJoinOnBuilder(this._mysqlConfig);
	};
	newParser = () => {
		return new MysqlParser(this._mysqlConfig);
	};
};
//#endregion
//#region src/sqleasy/mysql/mysql_configuration.ts
var MysqlConfiguration = class {
	_mysqlRuntimeConfiguration;
	constructor(rc) {
		this._mysqlRuntimeConfiguration = rc;
	}
	databaseType = () => {
		return DatabaseType.Mysql;
	};
	defaultOwner = () => {
		return "";
	};
	identifierDelimiters = () => {
		return {
			begin: "`",
			end: "`"
		};
	};
	preparedStatementPlaceholder = () => {
		return "?";
	};
	runtimeConfiguration = () => {
		return this._mysqlRuntimeConfiguration;
	};
	stringDelimiter = () => {
		return "'";
	};
	transactionDelimiters = () => {
		return {
			begin: "START TRANSACTION",
			end: "COMMIT"
		};
	};
};
//#endregion
//#region src/sqleasy/mysql/mysql_multi_builder.ts
var MysqlMultiBuilder = class extends DefaultMultiBuilder {
	_mysqlConfig;
	constructor(config) {
		super(config);
		this._mysqlConfig = config;
	}
	newBuilder = () => {
		return new MysqlBuilder(this._mysqlConfig);
	};
	newParser = () => {
		return new MysqlParser(this._mysqlConfig);
	};
};
//#endregion
//#region src/sqleasy/mysql/mysql_sqleasy.ts
var MysqlSqlEasy = class {
	_mssqlConfiguration;
	constructor(rc) {
		if (rc === null || rc === void 0) rc = new RuntimeConfiguration();
		this._mssqlConfiguration = new MysqlConfiguration(rc);
	}
	configuration = () => {
		return this._mssqlConfiguration;
	};
	newBuilder = (rc) => {
		if (rc === null || rc === void 0) return new MysqlBuilder(this._mssqlConfiguration);
		return new MysqlBuilder(new MysqlConfiguration(rc));
	};
	newMultiBuilder = (rc) => {
		if (rc === null || rc === void 0) return new MysqlMultiBuilder(this._mssqlConfiguration);
		return new MysqlMultiBuilder(new MysqlConfiguration(rc));
	};
};
//#endregion
//#region src/sqleasy/postgres/postgres_join_on_builder.ts
var PostgresJoinOnBuilder = class PostgresJoinOnBuilder extends DefaultJoinOnBuilder {
	_postgresConfig;
	constructor(config) {
		super(config);
		this._postgresConfig = config;
	}
	newJoinOnBuilder = () => {
		return new PostgresJoinOnBuilder(this._postgresConfig);
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
	toSql = (_state) => {
		throw new ParserError(ParserArea.General, "toSql not implemented for PostgresParser");
	};
	toSqlMulti = (_states, _transactionState) => {
		throw new ParserError(ParserArea.General, "toSqlMulti not implemented for PostgresParser");
	};
};
//#endregion
//#region src/sqleasy/postgres/postgres_builder.ts
var PostgresBuilder = class PostgresBuilder extends DefaultBuilder {
	_postgresConfig;
	constructor(config) {
		super(config);
		this._postgresConfig = config;
	}
	newBuilder = () => {
		return new PostgresBuilder(this._postgresConfig);
	};
	newJoinOnBuilder = () => {
		return new PostgresJoinOnBuilder(this._postgresConfig);
	};
	newParser = () => {
		return new PostgresParser(this._postgresConfig);
	};
};
//#endregion
//#region src/sqleasy/postgres/postgres_configuration.ts
var PostgresConfiguration = class {
	_postgresRuntimeConfiguration;
	constructor(rc) {
		this._postgresRuntimeConfiguration = rc;
	}
	databaseType = () => {
		return DatabaseType.Postgres;
	};
	defaultOwner = () => {
		return "public";
	};
	identifierDelimiters = () => {
		return {
			begin: "\"",
			end: "\""
		};
	};
	preparedStatementPlaceholder = () => {
		return "$";
	};
	runtimeConfiguration = () => {
		return this._postgresRuntimeConfiguration;
	};
	stringDelimiter = () => {
		return "'";
	};
	transactionDelimiters = () => {
		return {
			begin: "BEGIN",
			end: "COMMIT"
		};
	};
};
//#endregion
//#region src/sqleasy/postgres/postgres_multi_builder.ts
var PostgresMultiBuilder = class extends DefaultMultiBuilder {
	_postgresConfig;
	constructor(config) {
		super(config);
		this._postgresConfig = config;
	}
	newBuilder = () => {
		return new PostgresBuilder(this._postgresConfig);
	};
	newParser = () => {
		return new PostgresParser(this._postgresConfig);
	};
};
//#endregion
//#region src/sqleasy/postgres/postgres_sqleasy.ts
var PostgresSqlEasy = class {
	_postgresConfig;
	constructor(rc) {
		if (rc === null || rc === void 0) rc = new RuntimeConfiguration();
		this._postgresConfig = new PostgresConfiguration(rc);
	}
	configuration = () => {
		return this._postgresConfig;
	};
	newBuilder = (rc) => {
		if (rc === null || rc === void 0) return new PostgresBuilder(this._postgresConfig);
		return new PostgresBuilder(new PostgresConfiguration(rc));
	};
	newMultiBuilder = (rc) => {
		if (rc === null || rc === void 0) return new PostgresMultiBuilder(this._postgresConfig);
		return new PostgresMultiBuilder(new PostgresConfiguration(rc));
	};
};
//#endregion
//#region src/state/from_state.ts
var FromState = class {
	builderType = BuilderType.None;
	owner = void 0;
	tableName = void 0;
	alias = void 0;
	sqlEasyState = void 0;
	raw = void 0;
};
//#endregion
//#region src/state/join_on_state.ts
var JoinOnState = class {
	aliasLeft = void 0;
	columnLeft = void 0;
	joinOperator = JoinOperator.Equals;
	aliasRight = void 0;
	columnRight = void 0;
	joinOnOperator = JoinOnOperator.None;
	raw = void 0;
	valueRight = void 0;
};
//#endregion
//#region src/state/join_state.ts
var JoinState = class {
	builderType = BuilderType.None;
	joinType = JoinType.Inner;
	owner = void 0;
	tableName = void 0;
	alias = void 0;
	sqlEasyState = void 0;
	raw = void 0;
	joinOnStates = [];
};
//#endregion
//#region src/state/order_by_state.ts
var OrderByState = class {
	builderType = BuilderType.None;
	tableNameOrAlias = void 0;
	columnName = void 0;
	direction = OrderByDirection.None;
	raw = void 0;
};
//#endregion
//#region src/state/select_state.ts
var SelectState = class {
	builderType = BuilderType.None;
	tableNameOrAlias = void 0;
	columnName = void 0;
	alias = void 0;
	sqlEasyState = void 0;
	raw = void 0;
};
//#endregion
//#region src/state/where_state.ts
var WhereState = class {
	builderType = BuilderType.None;
	tableNameOrAlias = void 0;
	columnName = void 0;
	whereOperator = WhereOperator.None;
	raw = void 0;
	sqlEasyState = void 0;
	values = [];
};
//#endregion
export { BuilderType, ConfigurationDelimiters, DatabaseType, Datatype, DefaultBuilder, DefaultJoinOnBuilder, DefaultMultiBuilder, DefaultParser, FromState, JoinOnOperator, JoinOnState, JoinOperator, JoinState, JoinType, MssqlBuilder, MssqlConfiguration, MssqlJoinOnBuilder, MssqlMultiBuilder, MssqlParser, MssqlSqlEasy, MultiBuilderTransactionState, MysqlBuilder, MysqlConfiguration, MysqlJoinOnBuilder, MysqlMultiBuilder, MysqlParser, MysqlSqlEasy, OrderByDirection, OrderByState, ParserArea, ParserError, ParserMode, PostgresBuilder, PostgresConfiguration, PostgresJoinOnBuilder, PostgresMultiBuilder, PostgresParser, PostgresSqlEasy, RuntimeConfiguration, SelectState, SqlEasyState, SqlHelper, WhereOperator, WhereState, defaultFrom, defaultJoin, defaultLimitOffset, defaultOrderBy, defaultSelect, defaultToSql, defaultWhere };

//# sourceMappingURL=index.mjs.map