import IsHelper from '@deebeetech/is-helper';
import StringBuilder from '@deebeetech/string-builder';

var BuilderType = /* @__PURE__ */ ((BuilderType2) => {
  BuilderType2[BuilderType2["And"] = 0] = "And";
  BuilderType2[BuilderType2["FromBuilder"] = 1] = "FromBuilder";
  BuilderType2[BuilderType2["FromTable"] = 2] = "FromTable";
  BuilderType2[BuilderType2["FromRaw"] = 3] = "FromRaw";
  BuilderType2[BuilderType2["JoinBuilder"] = 4] = "JoinBuilder";
  BuilderType2[BuilderType2["JoinRaw"] = 5] = "JoinRaw";
  BuilderType2[BuilderType2["JoinTable"] = 6] = "JoinTable";
  BuilderType2[BuilderType2["None"] = 7] = "None";
  BuilderType2[BuilderType2["Or"] = 8] = "Or";
  BuilderType2[BuilderType2["OrderByColumn"] = 9] = "OrderByColumn";
  BuilderType2[BuilderType2["OrderByRaw"] = 10] = "OrderByRaw";
  BuilderType2[BuilderType2["SelectAll"] = 11] = "SelectAll";
  BuilderType2[BuilderType2["SelectBuilder"] = 12] = "SelectBuilder";
  BuilderType2[BuilderType2["SelectColumn"] = 13] = "SelectColumn";
  BuilderType2[BuilderType2["SelectRaw"] = 14] = "SelectRaw";
  BuilderType2[BuilderType2["Where"] = 15] = "Where";
  BuilderType2[BuilderType2["WhereBetween"] = 16] = "WhereBetween";
  BuilderType2[BuilderType2["WhereGroupBegin"] = 17] = "WhereGroupBegin";
  BuilderType2[BuilderType2["WhereGroupBuilder"] = 18] = "WhereGroupBuilder";
  BuilderType2[BuilderType2["WhereGroupEnd"] = 19] = "WhereGroupEnd";
  BuilderType2[BuilderType2["WhereExistsBuilder"] = 20] = "WhereExistsBuilder";
  BuilderType2[BuilderType2["WhereInBuilder"] = 21] = "WhereInBuilder";
  BuilderType2[BuilderType2["WhereInValues"] = 22] = "WhereInValues";
  BuilderType2[BuilderType2["WhereNotExistsBuilder"] = 23] = "WhereNotExistsBuilder";
  BuilderType2[BuilderType2["WhereNotInBuilder"] = 24] = "WhereNotInBuilder";
  BuilderType2[BuilderType2["WhereNotInValues"] = 25] = "WhereNotInValues";
  BuilderType2[BuilderType2["WhereNotNull"] = 26] = "WhereNotNull";
  BuilderType2[BuilderType2["WhereNull"] = 27] = "WhereNull";
  BuilderType2[BuilderType2["WhereRaw"] = 28] = "WhereRaw";
  return BuilderType2;
})(BuilderType || {});

var JoinType = /* @__PURE__ */ ((JoinType2) => {
  JoinType2[JoinType2["Inner"] = 0] = "Inner";
  JoinType2[JoinType2["Left"] = 1] = "Left";
  JoinType2[JoinType2["LeftOuter"] = 2] = "LeftOuter";
  JoinType2[JoinType2["Right"] = 3] = "Right";
  JoinType2[JoinType2["RightOuter"] = 4] = "RightOuter";
  JoinType2[JoinType2["FullOuter"] = 5] = "FullOuter";
  JoinType2[JoinType2["Cross"] = 6] = "Cross";
  JoinType2[JoinType2["None"] = 7] = "None";
  return JoinType2;
})(JoinType || {});

var OrderByDirection = /* @__PURE__ */ ((OrderByDirection2) => {
  OrderByDirection2[OrderByDirection2["Ascending"] = 0] = "Ascending";
  OrderByDirection2[OrderByDirection2["Descending"] = 1] = "Descending";
  OrderByDirection2[OrderByDirection2["None"] = 2] = "None";
  return OrderByDirection2;
})(OrderByDirection || {});

var WhereOperator = /* @__PURE__ */ ((WhereOperator2) => {
  WhereOperator2[WhereOperator2["Equals"] = 0] = "Equals";
  WhereOperator2[WhereOperator2["NotEquals"] = 1] = "NotEquals";
  WhereOperator2[WhereOperator2["GreaterThan"] = 2] = "GreaterThan";
  WhereOperator2[WhereOperator2["GreaterThanOrEquals"] = 3] = "GreaterThanOrEquals";
  WhereOperator2[WhereOperator2["LessThan"] = 4] = "LessThan";
  WhereOperator2[WhereOperator2["LessThanOrEquals"] = 5] = "LessThanOrEquals";
  WhereOperator2[WhereOperator2["None"] = 6] = "None";
  return WhereOperator2;
})(WhereOperator || {});

var __defProp$v = Object.defineProperty;
var __defNormalProp$v = (obj, key, value) => key in obj ? __defProp$v(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$v = (obj, key, value) => __defNormalProp$v(obj, typeof key !== "symbol" ? key + "" : key, value);
class SqlEasyState {
  constructor() {
    __publicField$v(this, "builderName", "");
    __publicField$v(this, "fromStates", []);
    __publicField$v(this, "joinStates", []);
    __publicField$v(this, "whereStates", []);
    __publicField$v(this, "orderByStates", []);
    __publicField$v(this, "selectStates", []);
    __publicField$v(this, "isInnerStatement", false);
    __publicField$v(this, "limit", 0);
    __publicField$v(this, "offset", 0);
    __publicField$v(this, "distinct", false);
    __publicField$v(this, "customState");
  }
}

var __defProp$u = Object.defineProperty;
var __defNormalProp$u = (obj, key, value) => key in obj ? __defProp$u(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$u = (obj, key, value) => __defNormalProp$u(obj, typeof key !== "symbol" ? key + "" : key, value);
class DefaultBuilder {
  constructor(config) {
    __publicField$u(this, "_sqlEasyState", new SqlEasyState());
    __publicField$u(this, "_config");
    __publicField$u(this, "and", () => {
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
    });
    __publicField$u(this, "clearAll", () => {
      this._sqlEasyState = new SqlEasyState();
      return this;
    });
    __publicField$u(this, "clearFrom", () => {
      this._sqlEasyState.fromStates = [];
      return this;
    });
    __publicField$u(this, "clearJoin", () => {
      this._sqlEasyState.joinStates = [];
      return this;
    });
    __publicField$u(this, "clearLimit", () => {
      this._sqlEasyState.limit = 0;
      return this;
    });
    __publicField$u(this, "clearOffset", () => {
      this._sqlEasyState.offset = 0;
      return this;
    });
    __publicField$u(this, "clearOrderBy", () => {
      this._sqlEasyState.orderByStates = [];
      return this;
    });
    __publicField$u(this, "clearSelect", () => {
      this._sqlEasyState.selectStates = [];
      return this;
    });
    __publicField$u(this, "clearWhere", () => {
      this._sqlEasyState.whereStates = [];
      return this;
    });
    __publicField$u(this, "distinct", () => {
      this._sqlEasyState.distinct = true;
      return this;
    });
    __publicField$u(this, "fromRaw", (rawFrom) => {
      this._sqlEasyState.fromStates.push({
        builderType: BuilderType.FromRaw,
        owner: void 0,
        tableName: void 0,
        alias: void 0,
        sqlEasyState: void 0,
        raw: rawFrom
      });
      return this;
    });
    __publicField$u(this, "fromRaws", (rawFroms) => {
      rawFroms.forEach((rawFrom) => {
        this.fromRaw(rawFrom);
      });
      return this;
    });
    __publicField$u(this, "fromTable", (tableName, alias) => {
      this._sqlEasyState.fromStates.push({
        builderType: BuilderType.FromTable,
        owner: this._config.defaultOwner(),
        tableName,
        alias,
        sqlEasyState: void 0,
        raw: void 0
      });
      return this;
    });
    __publicField$u(this, "fromTables", (tables) => {
      tables.forEach((table) => {
        this.fromTable(table.tableName, table.alias);
      });
      return this;
    });
    __publicField$u(this, "fromTableWithOwner", (owner, tableName, alias) => {
      this._sqlEasyState.fromStates.push({
        builderType: BuilderType.FromTable,
        owner,
        tableName,
        alias,
        sqlEasyState: void 0,
        raw: void 0
      });
      return this;
    });
    __publicField$u(this, "fromTablesWithOwner", (tables) => {
      tables.forEach((table) => {
        this.fromTableWithOwner(table.owner, table.tableName, table.alias);
      });
      return this;
    });
    __publicField$u(this, "fromWithBuilder", (alias, builder) => {
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
    });
    __publicField$u(this, "joinRaw", (rawJoin) => {
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
    });
    __publicField$u(this, "joinRaws", (rawJoins) => {
      rawJoins.forEach((rawJoin) => {
        this.joinRaw(rawJoin);
      });
      return this;
    });
    __publicField$u(this, "joinTable", (joinType, tableName, alias, joinOnBuilder) => {
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
    });
    __publicField$u(this, "joinTables", (joins) => {
      for (const join of joins) {
        this.joinTable(join.joinType, join.tableName, join.alias, join.joinOnBuilder);
      }
      return this;
    });
    __publicField$u(this, "joinTablesWithOwner", (joins) => {
      for (const join of joins) {
        this.joinTableWithOwner(join.joinType, join.owner, join.tableName, join.alias, join.joinOnBuilder);
      }
      return this;
    });
    __publicField$u(this, "joinTableWithOwner", (joinType, owner, tableName, alias, joinOnBuilder) => {
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
    });
    __publicField$u(this, "joinWithBuilder", (joinType, alias, builder, joinOnBuilder) => {
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
    });
    __publicField$u(this, "limit", (limit) => {
      this._sqlEasyState.limit = limit;
      return this;
    });
    __publicField$u(this, "offset", (offset) => {
      this._sqlEasyState.offset = offset;
      return this;
    });
    __publicField$u(this, "or", () => {
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
    });
    __publicField$u(this, "orderByColumn", (tableNameOrAlias, columnName, direction) => {
      this._sqlEasyState.orderByStates.push({
        builderType: BuilderType.OrderByColumn,
        tableNameOrAlias,
        columnName,
        direction,
        raw: void 0
      });
      return this;
    });
    __publicField$u(this, "orderByColumns", (columns) => {
      columns.forEach((column) => {
        this.orderByColumn(column.tableNameOrAlias, column.columnName, column.direction);
      });
      return this;
    });
    __publicField$u(this, "orderByRaw", (rawOrderBy) => {
      this._sqlEasyState.orderByStates.push({
        builderType: BuilderType.OrderByRaw,
        tableNameOrAlias: void 0,
        columnName: void 0,
        direction: OrderByDirection.Ascending,
        raw: rawOrderBy
      });
      return this;
    });
    __publicField$u(this, "orderByRaws", (rawOrderBys) => {
      rawOrderBys.forEach((rawOrderBy) => {
        this.orderByRaw(rawOrderBy);
      });
      return this;
    });
    __publicField$u(this, "parse", () => {
      const parser = this.newParser();
      return parser.toSql(this.state());
    });
    __publicField$u(this, "parseRaw", () => {
      const parser = this.newParser();
      return parser.toSqlRaw(this.state());
    });
    __publicField$u(this, "selectAll", () => {
      this._sqlEasyState.selectStates.push({
        builderType: BuilderType.SelectAll,
        tableNameOrAlias: void 0,
        columnName: void 0,
        alias: void 0,
        sqlEasyState: void 0,
        raw: void 0
      });
      return this;
    });
    __publicField$u(this, "selectColumn", (tableNameOrAlias, columnName, columnAlias) => {
      this._sqlEasyState.selectStates.push({
        builderType: BuilderType.SelectColumn,
        tableNameOrAlias,
        columnName,
        alias: columnAlias,
        sqlEasyState: void 0,
        raw: void 0
      });
      return this;
    });
    __publicField$u(this, "selectColumns", (columns) => {
      columns.forEach((column) => {
        this.selectColumn(column.tableNameOrAlias, column.columnName, column.columnAlias);
      });
      return this;
    });
    __publicField$u(this, "selectRaw", (rawSelect) => {
      this._sqlEasyState.selectStates.push({
        builderType: BuilderType.SelectRaw,
        tableNameOrAlias: void 0,
        columnName: void 0,
        alias: void 0,
        sqlEasyState: void 0,
        raw: rawSelect
      });
      return this;
    });
    __publicField$u(this, "selectRaws", (rawSelects) => {
      rawSelects.forEach((rawSelect) => {
        this.selectRaw(rawSelect);
      });
      return this;
    });
    __publicField$u(this, "selectWithBuilder", (alias, builder) => {
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
    });
    __publicField$u(this, "state", () => {
      return this._sqlEasyState;
    });
    __publicField$u(this, "where", (tableNameOrAlias, columnName, whereOperator, value) => {
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
    });
    __publicField$u(this, "whereBetween", (tableNameOrAlias, columnName, value1, value2) => {
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
    });
    __publicField$u(this, "whereExistsWithBuilder", (tableNameOrAlias, columnName, builder) => {
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
    });
    __publicField$u(this, "whereInWithBuilder", (tableNameOrAlias, columnName, builder) => {
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
    });
    __publicField$u(this, "whereInValues", (tableNameOrAlias, columnName, values) => {
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
    });
    __publicField$u(this, "whereNotExistsWithBuilder", (tableNameOrAlias, columnName, builder) => {
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
    });
    __publicField$u(this, "whereNotInWithBuilder", (tableNameOrAlias, columnName, builder) => {
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
    });
    __publicField$u(this, "whereNotInValues", (tableNameOrAlias, columnName, values) => {
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
    });
    __publicField$u(this, "whereNotNull", (tableNameOrAlias, columnName) => {
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
    });
    __publicField$u(this, "whereNull", (tableNameOrAlias, columnName) => {
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
    });
    __publicField$u(this, "whereRaw", (rawWhere) => {
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
    });
    __publicField$u(this, "whereRaws", (rawWheres) => {
      rawWheres.forEach((rawWhere) => {
        this.whereRaw(rawWhere);
      });
      return this;
    });
    this._config = config;
  }
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
}

var JoinOnOperator = /* @__PURE__ */ ((JoinOnOperator2) => {
  JoinOnOperator2[JoinOnOperator2["GroupBegin"] = 0] = "GroupBegin";
  JoinOnOperator2[JoinOnOperator2["GroupEnd"] = 1] = "GroupEnd";
  JoinOnOperator2[JoinOnOperator2["On"] = 2] = "On";
  JoinOnOperator2[JoinOnOperator2["Raw"] = 3] = "Raw";
  JoinOnOperator2[JoinOnOperator2["Value"] = 4] = "Value";
  JoinOnOperator2[JoinOnOperator2["And"] = 5] = "And";
  JoinOnOperator2[JoinOnOperator2["Or"] = 6] = "Or";
  JoinOnOperator2[JoinOnOperator2["None"] = 7] = "None";
  return JoinOnOperator2;
})(JoinOnOperator || {});

var JoinOperator = /* @__PURE__ */ ((JoinOperator2) => {
  JoinOperator2[JoinOperator2["Equals"] = 0] = "Equals";
  JoinOperator2[JoinOperator2["NotEquals"] = 1] = "NotEquals";
  JoinOperator2[JoinOperator2["GreaterThan"] = 2] = "GreaterThan";
  JoinOperator2[JoinOperator2["GreaterThanOrEquals"] = 3] = "GreaterThanOrEquals";
  JoinOperator2[JoinOperator2["LessThan"] = 4] = "LessThan";
  JoinOperator2[JoinOperator2["LessThanOrEquals"] = 5] = "LessThanOrEquals";
  JoinOperator2[JoinOperator2["None"] = 6] = "None";
  return JoinOperator2;
})(JoinOperator || {});

var __defProp$t = Object.defineProperty;
var __defNormalProp$t = (obj, key, value) => key in obj ? __defProp$t(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$t = (obj, key, value) => __defNormalProp$t(obj, typeof key !== "symbol" ? key + "" : key, value);
class DefaultJoinOnBuilder {
  constructor(config) {
    __publicField$t(this, "_states", []);
    __publicField$t(this, "_config");
    __publicField$t(this, "and", () => {
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
    });
    __publicField$t(this, "on", (aliasLeft, columnLeft, joinOperator, aliasRight, columnRight) => {
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
    });
    __publicField$t(this, "onGroup", (builder) => {
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
      const newBuilder = this.newJoinOnBuilder();
      builder(newBuilder);
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
    });
    __publicField$t(this, "onRaw", (raw) => {
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
    });
    __publicField$t(this, "onValue", (aliasLeft, columnLeft, joinOperator, valueRight) => {
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
    });
    __publicField$t(this, "or", () => {
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
    });
    __publicField$t(this, "states", () => {
      return this._states;
    });
    this._config = config;
  }
}

var MultiBuilderTransactionState = /* @__PURE__ */ ((MultiBuilderTransactionState2) => {
  MultiBuilderTransactionState2[MultiBuilderTransactionState2["TransactionOn"] = 0] = "TransactionOn";
  MultiBuilderTransactionState2[MultiBuilderTransactionState2["TransactionOff"] = 1] = "TransactionOff";
  MultiBuilderTransactionState2[MultiBuilderTransactionState2["None"] = 2] = "None";
  return MultiBuilderTransactionState2;
})(MultiBuilderTransactionState || {});

var __defProp$s = Object.defineProperty;
var __defNormalProp$s = (obj, key, value) => key in obj ? __defProp$s(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$s = (obj, key, value) => __defNormalProp$s(obj, typeof key !== "symbol" ? key + "" : key, value);
class DefaultMultiBuilder {
  constructor(config) {
    __publicField$s(this, "_config");
    __publicField$s(this, "_states", []);
    __publicField$s(this, "_transactionState", MultiBuilderTransactionState.TransactionOn);
    __publicField$s(this, "addBuilder", (builderName) => {
      const newBuilder = this.newBuilder();
      newBuilder.state().builderName = builderName;
      this._states.push(newBuilder.state());
      return newBuilder;
    });
    __publicField$s(this, "parse", () => {
      const parser = this.newParser();
      const sql = parser.toSqlMulti(this._states, this._transactionState);
      return sql;
    });
    __publicField$s(this, "parseRaw", () => {
      const parser = this.newParser();
      const sql = parser.toSqlMultiRaw(this._states, this._transactionState);
      return sql;
    });
    __publicField$s(this, "removeBuilder", (builderName) => {
      this._states = this._states.filter((state) => state.builderName !== builderName);
    });
    __publicField$s(this, "reorderBuilders", (builderNames) => {
      const newStates = [];
      builderNames.forEach((builderName) => {
        const state = this._states.find((state2) => state2.builderName === builderName);
        if (state) {
          newStates.push(state);
        }
      });
      this._states = newStates;
    });
    __publicField$s(this, "setTransactionState", (transactionState) => {
      this._transactionState = transactionState;
    });
    __publicField$s(this, "states", () => {
      return this._states;
    });
    __publicField$s(this, "transactionState", () => {
      return this._transactionState;
    });
    this._config = config;
  }
}

var __defProp$r = Object.defineProperty;
var __defNormalProp$r = (obj, key, value) => key in obj ? __defProp$r(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$r = (obj, key, value) => __defNormalProp$r(obj, typeof key !== "symbol" ? key + "" : key, value);
class ConfigurationDelimiters {
  constructor() {
    __publicField$r(this, "begin", "");
    __publicField$r(this, "end", "");
  }
}

var __defProp$q = Object.defineProperty;
var __defNormalProp$q = (obj, key, value) => key in obj ? __defProp$q(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$q = (obj, key, value) => __defNormalProp$q(obj, typeof key !== "symbol" ? key + "" : key, value);
class RuntimeConfiguration {
  constructor() {
    __publicField$q(this, "maxRowsReturned", 1e3);
    __publicField$q(this, "customConfiguration");
  }
}

var DatabaseType = /* @__PURE__ */ ((DatabaseType2) => {
  DatabaseType2[DatabaseType2["Mssql"] = 0] = "Mssql";
  DatabaseType2[DatabaseType2["Postgres"] = 1] = "Postgres";
  DatabaseType2[DatabaseType2["Mysql"] = 2] = "Mysql";
  DatabaseType2[DatabaseType2["Sqlite"] = 3] = "Sqlite";
  DatabaseType2[DatabaseType2["Unknown"] = 4] = "Unknown";
  return DatabaseType2;
})(DatabaseType || {});

var Datatype = /* @__PURE__ */ ((Datatype2) => {
  Datatype2[Datatype2["Boolean"] = 0] = "Boolean";
  Datatype2[Datatype2["DateTime"] = 1] = "DateTime";
  Datatype2[Datatype2["Number"] = 2] = "Number";
  Datatype2[Datatype2["String"] = 3] = "String";
  Datatype2[Datatype2["Unknown"] = 4] = "Unknown";
  return Datatype2;
})(Datatype || {});

var ParserArea = /* @__PURE__ */ ((ParserArea2) => {
  ParserArea2[ParserArea2["Select"] = 0] = "Select";
  ParserArea2[ParserArea2["From"] = 1] = "From";
  ParserArea2[ParserArea2["Join"] = 2] = "Join";
  ParserArea2[ParserArea2["Where"] = 3] = "Where";
  ParserArea2[ParserArea2["OrderBy"] = 4] = "OrderBy";
  ParserArea2[ParserArea2["LimitOffset"] = 5] = "LimitOffset";
  ParserArea2[ParserArea2["General"] = 6] = "General";
  return ParserArea2;
})(ParserArea || {});

var ParserMode = /* @__PURE__ */ ((ParserMode2) => {
  ParserMode2[ParserMode2["Raw"] = 0] = "Raw";
  ParserMode2[ParserMode2["Prepared"] = 1] = "Prepared";
  ParserMode2[ParserMode2["None"] = 2] = "None";
  return ParserMode2;
})(ParserMode || {});

class ParserError extends Error {
  constructor(parserArea, message) {
    const finalMessage = `${parserArea}: ${message}`;
    super(finalMessage);
    this.name = "SqlEasyParserError";
  }
}

var __defProp$p = Object.defineProperty;
var __defNormalProp$p = (obj, key, value) => key in obj ? __defProp$p(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$p = (obj, key, value) => __defNormalProp$p(obj, typeof key !== "symbol" ? key + "" : key, value);
class SqlHelper {
  constructor(config, parserMode) {
    __publicField$p(this, "_sb", new StringBuilder());
    __publicField$p(this, "_values", []);
    __publicField$p(this, "_config");
    __publicField$p(this, "_parserMode");
    __publicField$p(this, "addDynamicValue", (value) => {
      if (this._parserMode === ParserMode.Prepared) {
        this._values.push(value);
        return this._config.preparedStatementPlaceholder();
      }
      return this.getValueStringFromDataType(value);
    });
    __publicField$p(this, "addSqlSnippet", (sql) => {
      this._sb.append(sql);
    });
    __publicField$p(this, "addSqlSnippetWithValues", (sqlString, value) => {
      this._values.push(value);
      this.addSqlSnippet(sqlString);
    });
    __publicField$p(this, "clear", () => {
      this._sb = new StringBuilder();
      this._values = [];
    });
    __publicField$p(this, "getSql", () => {
      return this._sb.toString();
    });
    __publicField$p(this, "getSqlDebug", () => {
      let sqlString = this._sb.toString();
      this._values.forEach((value) => {
        const valuePosition = sqlString.indexOf(this._config.preparedStatementPlaceholder());
        if (valuePosition === -1) {
          return;
        }
        sqlString = sqlString.substring(0, valuePosition) + value + sqlString.substring(valuePosition + 1);
      });
      return sqlString;
    });
    __publicField$p(this, "getValues", () => {
      if (this._values.length === 0) {
        return [];
      }
      return this._values.filter((value) => !IsHelper.isNullOrUndefined(value));
    });
    __publicField$p(this, "getValueStringFromDataType", (value) => {
      if (value === null || value === void 0) {
        return "";
      }
      switch (typeof value) {
        case "string":
          return value;
        case "number":
          return value.toString();
        case "boolean":
          return value ? "true" : "false";
        case "object":
          if (value instanceof Date) {
            return value.toISOString();
          }
          return JSON.stringify(value);
        default:
          return value.toString();
      }
    });
    this._config = config;
    this._parserMode = parserMode;
  }
}

const defaultJoin = (state, config, mode) => {
  let sqlHelper = new SqlHelper(config, mode);
  if (state.joinStates.length === 0) {
    return sqlHelper;
  }
  for (let i = 0; i < state.joinStates.length; i++) {
    const joinState = state.joinStates[i];
    if (joinState.builderType === BuilderType.JoinRaw) {
      sqlHelper.addSqlSnippet(joinState.raw ?? "");
      if (i < state.joinStates.length - 1) {
        sqlHelper.addSqlSnippet(" ");
      }
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
        sqlHelper.addSqlSnippet(
          config.identifierDelimiters().begin + joinState.owner + config.identifierDelimiters().end
        );
        sqlHelper.addSqlSnippet(".");
      }
      sqlHelper.addSqlSnippet(
        config.identifierDelimiters().begin + joinState.tableName + config.identifierDelimiters().end
      );
      if (joinState.alias !== "") {
        sqlHelper.addSqlSnippet(" AS ");
        sqlHelper.addSqlSnippet(
          config.identifierDelimiters().begin + joinState.alias + config.identifierDelimiters().end
        );
      }
      sqlHelper = defaultJoinOns(sqlHelper, config, joinState.joinOnStates);
      if (i < state.joinStates.length - 1) {
        sqlHelper.addSqlSnippet(" ");
      }
      continue;
    }
    if (joinState.builderType === BuilderType.JoinBuilder) {
      const subHelper = defaultToSql(joinState.sqlEasyState, config, mode);
      sqlHelper.addSqlSnippet("(" + subHelper.getSql() + ")");
      if (joinState.alias !== "") {
        sqlHelper.addSqlSnippet(" AS ");
        sqlHelper.addSqlSnippet(
          config.identifierDelimiters().begin + joinState.alias + config.identifierDelimiters().end
        );
      }
      sqlHelper = defaultJoinOns(sqlHelper, config, joinState.joinOnStates);
      if (i < state.joinStates.length - 1) {
        sqlHelper.addSqlSnippet(" ");
      }
    }
  }
  return sqlHelper;
};
const defaultJoinOns = (sqlHelper, config, joinOnStates) => {
  if (joinOnStates.length === 0) {
    return sqlHelper;
  }
  sqlHelper.addSqlSnippet(" ON ");
  for (let i = 0; i < joinOnStates.length; i++) {
    if (i === 0 && (joinOnStates[i].joinOnOperator === JoinOnOperator.And || joinOnStates[i].joinOnOperator === JoinOnOperator.Or)) {
      throw new ParserError(ParserArea.Join, "First JOIN ON operator cannot be AND or OR");
    }
    if (i === joinOnStates.length - 1 && (joinOnStates[i].joinOnOperator === JoinOnOperator.And || joinOnStates[i].joinOnOperator === JoinOnOperator.Or)) {
      throw new ParserError(ParserArea.Join, "AND or OR cannot be used as the last JOIN ON operator");
    }
    if ((joinOnStates[i].joinOnOperator === JoinOnOperator.And || joinOnStates[i].joinOnOperator === JoinOnOperator.Or) && (joinOnStates[i - 1].joinOnOperator === JoinOnOperator.And || joinOnStates[i - 1].joinOnOperator === JoinOnOperator.Or)) {
      throw new ParserError(ParserArea.Join, "AND or OR cannot be used consecutively");
    }
    if ((joinOnStates[i].joinOnOperator === JoinOnOperator.And || joinOnStates[i].joinOnOperator === JoinOnOperator.Or) && joinOnStates[i - 1].joinOnOperator === JoinOnOperator.GroupBegin) {
      throw new ParserError(ParserArea.Join, "AND or OR cannot be used directly after a group begin");
    }
    if (joinOnStates[i].joinOnOperator === JoinOnOperator.GroupBegin && i === joinOnStates.length - 1) {
      throw new ParserError(ParserArea.Join, "Group begin cannot be the last JOIN ON operator");
    }
    if (joinOnStates[i].joinOnOperator === JoinOnOperator.GroupEnd && i === 0) {
      throw new ParserError(ParserArea.Join, "Group end cannot be the first JOIN ON operator");
    }
    if (joinOnStates[i].joinOnOperator === JoinOnOperator.And) {
      sqlHelper.addSqlSnippet("AND");
      if (i < joinOnStates.length - 1) {
        sqlHelper.addSqlSnippet(" ");
      }
      continue;
    }
    if (joinOnStates[i].joinOnOperator === JoinOnOperator.Or) {
      sqlHelper.addSqlSnippet("OR");
      if (i < joinOnStates.length - 1) {
        sqlHelper.addSqlSnippet(" ");
      }
      continue;
    }
    if (joinOnStates[i].joinOnOperator === JoinOnOperator.GroupBegin) {
      sqlHelper.addSqlSnippet("(");
      continue;
    }
    if (joinOnStates[i].joinOnOperator === JoinOnOperator.GroupEnd) {
      sqlHelper.addSqlSnippet(")");
      if (i < joinOnStates.length - 1) {
        sqlHelper.addSqlSnippet(" ");
      }
      continue;
    }
    if (joinOnStates[i].joinOnOperator === JoinOnOperator.Raw) {
      sqlHelper.addSqlSnippet(joinOnStates[i].raw ?? "");
      if (i < joinOnStates.length - 1) {
        sqlHelper.addSqlSnippet(" ");
      }
      continue;
    }
    if (joinOnStates[i].joinOnOperator === JoinOnOperator.On) {
      sqlHelper.addSqlSnippet(
        config.identifierDelimiters().begin + joinOnStates[i].aliasLeft + config.identifierDelimiters().end
      );
      sqlHelper.addSqlSnippet(".");
      sqlHelper.addSqlSnippet(
        config.identifierDelimiters().begin + joinOnStates[i].columnLeft + config.identifierDelimiters().end
      );
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
      sqlHelper.addSqlSnippet(
        config.identifierDelimiters().begin + joinOnStates[i].aliasRight + config.identifierDelimiters().end
      );
      sqlHelper.addSqlSnippet(".");
      sqlHelper.addSqlSnippet(
        config.identifierDelimiters().begin + joinOnStates[i].columnRight + config.identifierDelimiters().end
      );
      if (i < joinOnStates.length - 1) {
        sqlHelper.addSqlSnippet(" ");
      }
      continue;
    }
    if (joinOnStates[i].joinOnOperator === JoinOnOperator.Value) {
      sqlHelper.addSqlSnippet(
        config.identifierDelimiters().begin + joinOnStates[i].aliasLeft + config.identifierDelimiters().end
      );
      sqlHelper.addSqlSnippet(".");
      sqlHelper.addSqlSnippet(
        config.identifierDelimiters().begin + joinOnStates[i].columnLeft + config.identifierDelimiters().end
      );
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
      if (i < joinOnStates.length - 1) {
        sqlHelper.addSqlSnippet(" ");
      }
      continue;
    }
  }
  return sqlHelper;
};

const defaultLimitOffset = (state, config, mode) => {
  const sqlHelper = new SqlHelper(config, mode);
  if (state.limit == 0 && state.offset == 0) {
    return sqlHelper;
  }
  if (config.databaseType() == DatabaseType.Mysql || config.databaseType() == DatabaseType.Postgres) {
    if (state.limit > 0) {
      sqlHelper.addSqlSnippet("LIMIT ");
      sqlHelper.addSqlSnippet(state.limit.toString());
    }
    if (state.limit == 0 && !state.isInnerStatement && (IsHelper.isNullOrUndefined(state.whereStates) || state.whereStates.length == 0)) {
      sqlHelper.addSqlSnippet("LIMIT ");
      sqlHelper.addSqlSnippet(config.runtimeConfiguration().maxRowsReturned.toString());
    }
    if (state.offset > 0) {
      if (state.limit > 0) {
        sqlHelper.addSqlSnippet(" ");
      }
      sqlHelper.addSqlSnippet(" OFFSET ");
      sqlHelper.addSqlSnippet(state.offset.toString());
    }
  }
  if (config.databaseType() == DatabaseType.Mssql) {
    if (!IsHelper.isNullOrUndefined(state.customState) && !IsHelper.isNullOrUndefined(state.customState["top"]) && (state.limit > 0 || state.offset > 0)) {
      throw new ParserError(
        ParserArea.LimitOffset,
        "MSSQL should not use both TOP and LIMIT/OFFSET in the same query"
      );
    }
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
  if (state.offset > 0 && (IsHelper.isNullOrUndefined(state.orderByStates) || state.orderByStates.length == 0)) {
    throw new ParserError(ParserArea.LimitOffset, "ORDER BY is required when using OFFSET");
  }
  return sqlHelper;
};

const defaultOrderBy = (state, config, mode) => {
  const sqlHelper = new SqlHelper(config, mode);
  if (state.orderByStates.length === 0) {
    return sqlHelper;
  }
  sqlHelper.addSqlSnippet("ORDER BY ");
  state.orderByStates.forEach((orderByState, i) => {
    if (orderByState.builderType === BuilderType.OrderByRaw) {
      sqlHelper.addSqlSnippet(orderByState.raw ?? "");
      if (i < state.orderByStates.length - 1) {
        sqlHelper.addSqlSnippet(", ");
      }
      return;
    }
    if (orderByState.builderType === BuilderType.OrderByColumn) {
      sqlHelper.addSqlSnippet(
        config.identifierDelimiters().begin + orderByState.tableNameOrAlias + config.identifierDelimiters().end
      );
      sqlHelper.addSqlSnippet(".");
      sqlHelper.addSqlSnippet(
        config.identifierDelimiters().begin + orderByState.columnName + config.identifierDelimiters().end
      );
      if (orderByState.direction === OrderByDirection.Ascending) {
        sqlHelper.addSqlSnippet(" ASC");
      } else {
        sqlHelper.addSqlSnippet(" DESC");
      }
      if (i < state.orderByStates.length - 1) {
        sqlHelper.addSqlSnippet(", ");
      }
      return;
    }
  });
  return sqlHelper;
};

const defaultSelect = (state, config, mode) => {
  const sqlHelper = new SqlHelper(config, mode);
  if (state.selectStates.length === 0) {
    throw new ParserError(ParserArea.Select, "Select statement must have at least one select state");
  }
  sqlHelper.addSqlSnippet("SELECT ");
  if (state.distinct) {
    sqlHelper.addSqlSnippet("DISTINCT ");
  }
  if (config.databaseType() === DatabaseType.Mssql) {
    if (!IsHelper.isNullOrUndefined(state.customState) && !IsHelper.isNullOrUndefined(state.customState["top"]) && state.customState["top"] > 0) {
      sqlHelper.addSqlSnippet("TOP ");
      sqlHelper.addSqlSnippet(`(${state.customState["top"]})`);
      sqlHelper.addSqlSnippet(" ");
    }
    if (!IsHelper.isNullOrUndefined(state.customState) && IsHelper.isNullOrUndefined(state.customState["top"]) && !state.isInnerStatement && state.limit === 0 && (!state.whereStates || state.whereStates.length === 0)) {
      sqlHelper.addSqlSnippet("TOP ");
      sqlHelper.addSqlSnippet(`(${config.runtimeConfiguration().maxRowsReturned})`);
      sqlHelper.addSqlSnippet(" ");
    }
  }
  for (let i = 0; i < state.selectStates.length; i++) {
    const selectState = state.selectStates[i];
    if (selectState.builderType === BuilderType.SelectAll) {
      sqlHelper.addSqlSnippet("*");
      if (i < state.selectStates.length - 1) {
        sqlHelper.addSqlSnippet(", ");
      }
    }
    if (selectState.builderType === BuilderType.SelectRaw) {
      sqlHelper.addSqlSnippet(selectState.raw ?? "");
      if (i < state.selectStates.length - 1) {
        sqlHelper.addSqlSnippet(", ");
      }
      continue;
    }
    if (selectState.builderType === BuilderType.SelectColumn) {
      sqlHelper.addSqlSnippet(
        `${config.identifierDelimiters().begin}${selectState.tableNameOrAlias}${config.identifierDelimiters().end}`
      );
      sqlHelper.addSqlSnippet(".");
      sqlHelper.addSqlSnippet(
        `${config.identifierDelimiters().begin}${selectState.columnName}${config.identifierDelimiters().end}`
      );
      if (selectState.alias !== "") {
        sqlHelper.addSqlSnippet(" AS ");
        sqlHelper.addSqlSnippet(
          `${config.identifierDelimiters().begin}${selectState.alias}${config.identifierDelimiters().end}`
        );
      }
      if (i < state.selectStates.length - 1) {
        sqlHelper.addSqlSnippet(", ");
      }
      continue;
    }
    if (selectState.builderType === BuilderType.SelectBuilder) {
      const subHelper = defaultToSql(selectState.sqlEasyState, config, mode);
      sqlHelper.addSqlSnippet(`(${subHelper.getSql()})`);
      if (selectState.alias !== "") {
        sqlHelper.addSqlSnippet(" AS ");
        sqlHelper.addSqlSnippet(
          `${config.identifierDelimiters().begin}${selectState.alias}${config.identifierDelimiters().end}`
        );
      }
      if (i < state.selectStates.length - 1) {
        sqlHelper.addSqlSnippet(", ");
      }
      continue;
    }
  }
  return sqlHelper;
};

const defaultWhere = (state, config, mode) => {
  const sqlHelper = new SqlHelper(config, mode);
  if (state.whereStates.length === 0) {
    return sqlHelper;
  }
  sqlHelper.addSqlSnippet("WHERE ");
  for (let i = 0; i < state.whereStates.length; i++) {
    if (i === 0 && (state.whereStates[i].builderType === BuilderType.And || state.whereStates[i].builderType === BuilderType.Or)) {
      throw new ParserError(ParserArea.Where, "First WHERE operator cannot be AND or OR");
    }
    if (i === state.whereStates.length - 1 && (state.whereStates[i].builderType === BuilderType.And || state.whereStates[i].builderType === BuilderType.Or)) {
      throw new ParserError(ParserArea.Where, "AND or OR cannot be used as the last WHERE operator");
    }
    if ((state.whereStates[i].builderType === BuilderType.And || state.whereStates[i].builderType === BuilderType.Or) && (state.whereStates[i - 1].builderType === BuilderType.And || state.whereStates[i - 1].builderType === BuilderType.Or)) {
      throw new ParserError(ParserArea.Where, "AND or OR cannot be used consecutively");
    }
    if ((state.whereStates[i].builderType === BuilderType.And || state.whereStates[i].builderType === BuilderType.Or) && state.whereStates[i - 1].builderType === BuilderType.WhereGroupBegin) {
      throw new ParserError(ParserArea.Where, "AND or OR cannot be used directly after a group begin");
    }
    if (state.whereStates[i].builderType === BuilderType.WhereGroupBegin && i === state.whereStates.length - 1) {
      throw new ParserError(ParserArea.Where, "Group begin cannot be the last WHERE operator");
    }
    if (state.whereStates[i].builderType === BuilderType.WhereGroupEnd && i === 0) {
      throw new ParserError(ParserArea.Where, "Group end cannot be the first WHERE operator");
    }
    if (state.whereStates[i].builderType === BuilderType.And) {
      sqlHelper.addSqlSnippet("AND");
      if (i < state.whereStates.length - 1) {
        sqlHelper.addSqlSnippet(" ");
      }
      continue;
    }
    if (state.whereStates[i].builderType === BuilderType.Or) {
      sqlHelper.addSqlSnippet("OR");
      if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) {
        sqlHelper.addSqlSnippet(" ");
      }
      continue;
    }
    if (state.whereStates[i].builderType === BuilderType.WhereGroupBegin) {
      sqlHelper.addSqlSnippet("(");
      continue;
    }
    if (state.whereStates[i].builderType === BuilderType.WhereGroupEnd) {
      sqlHelper.addSqlSnippet(")");
      if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) {
        sqlHelper.addSqlSnippet(" ");
      }
      continue;
    }
    if (state.whereStates[i].builderType === BuilderType.WhereRaw) {
      sqlHelper.addSqlSnippet(state.whereStates[i].raw ?? "");
      if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) {
        sqlHelper.addSqlSnippet(" ");
      }
      continue;
    }
    if (state.whereStates[i].builderType === BuilderType.Where) {
      sqlHelper.addSqlSnippet(
        config.identifierDelimiters().begin + state.whereStates[i].tableNameOrAlias + config.identifierDelimiters().end
      );
      sqlHelper.addSqlSnippet(".");
      sqlHelper.addSqlSnippet(
        config.identifierDelimiters().begin + state.whereStates[i].columnName + config.identifierDelimiters().end
      );
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
      if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) {
        sqlHelper.addSqlSnippet(" ");
      }
      continue;
    }
    if (state.whereStates[i].builderType == BuilderType.WhereBetween) {
      sqlHelper.addSqlSnippet(
        config.identifierDelimiters().begin + state.whereStates[i].tableNameOrAlias + config.identifierDelimiters().end
      );
      sqlHelper.addSqlSnippet(".");
      sqlHelper.addSqlSnippet(
        config.identifierDelimiters().begin + state.whereStates[i].columnName + config.identifierDelimiters().end
      );
      sqlHelper.addSqlSnippet(" ");
      sqlHelper.addSqlSnippet("BETWEEN ");
      sqlHelper.addSqlSnippet(sqlHelper.addDynamicValue(state.whereStates[i].values[0]));
      sqlHelper.addSqlSnippet(" AND ");
      sqlHelper.addSqlSnippet(sqlHelper.addDynamicValue(state.whereStates[i].values[1]));
      if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) {
        sqlHelper.addSqlSnippet(" ");
      }
      continue;
    }
    if (state.whereStates[i].builderType == BuilderType.WhereExistsBuilder) {
      sqlHelper.addSqlSnippet("EXISTS (");
      const subHelper = defaultToSql(state.whereStates[i].sqlEasyState, config, mode);
      sqlHelper.addSqlSnippet(subHelper.getSql());
      sqlHelper.addSqlSnippet(")");
      if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) {
        sqlHelper.addSqlSnippet(" ");
      }
      continue;
    }
    if (state.whereStates[i].builderType == BuilderType.WhereInBuilder) {
      sqlHelper.addSqlSnippet(
        config.identifierDelimiters().begin + state.whereStates[i].tableNameOrAlias + config.identifierDelimiters().end
      );
      sqlHelper.addSqlSnippet(".");
      sqlHelper.addSqlSnippet(
        config.identifierDelimiters().begin + state.whereStates[i].columnName + config.identifierDelimiters().end
      );
      sqlHelper.addSqlSnippet(" IN (");
      const subHelper = defaultToSql(state.whereStates[i].sqlEasyState, config, mode);
      sqlHelper.addSqlSnippet(subHelper.getSql());
      sqlHelper.addSqlSnippet(")");
      if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) {
        sqlHelper.addSqlSnippet(" ");
      }
      continue;
    }
    if (state.whereStates[i].builderType == BuilderType.WhereInValues) {
      sqlHelper.addSqlSnippet(
        config.identifierDelimiters().begin + state.whereStates[i].tableNameOrAlias + config.identifierDelimiters().end
      );
      sqlHelper.addSqlSnippet(".");
      sqlHelper.addSqlSnippet(
        config.identifierDelimiters().begin + state.whereStates[i].columnName + config.identifierDelimiters().end
      );
      sqlHelper.addSqlSnippet(" IN (");
      for (let j = 0; j < state.whereStates[i].values.length; j++) {
        sqlHelper.addSqlSnippet(sqlHelper.addDynamicValue(state.whereStates[i].values[j]));
        if (j < state.whereStates[i].values.length - 1) {
          sqlHelper.addSqlSnippet(", ");
        }
      }
      sqlHelper.addSqlSnippet(")");
      if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) {
        sqlHelper.addSqlSnippet(" ");
      }
      continue;
    }
    if (state.whereStates[i].builderType == BuilderType.WhereNotExistsBuilder) {
      sqlHelper.addSqlSnippet("NOT EXISTS (");
      const subHelper = defaultToSql(state.whereStates[i].sqlEasyState, config, mode);
      sqlHelper.addSqlSnippet(subHelper.getSql());
      sqlHelper.addSqlSnippet(")");
      if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) {
        sqlHelper.addSqlSnippet(" ");
      }
      continue;
    }
    if (state.whereStates[i].builderType == BuilderType.WhereNotInBuilder) {
      sqlHelper.addSqlSnippet(
        config.identifierDelimiters().begin + state.whereStates[i].tableNameOrAlias + config.identifierDelimiters().end
      );
      sqlHelper.addSqlSnippet(".");
      sqlHelper.addSqlSnippet(
        config.identifierDelimiters().begin + state.whereStates[i].columnName + config.identifierDelimiters().end
      );
      sqlHelper.addSqlSnippet(" NOT IN (");
      const subHelper = defaultToSql(state.whereStates[i].sqlEasyState, config, mode);
      sqlHelper.addSqlSnippet(subHelper.getSql());
      sqlHelper.addSqlSnippet(")");
      if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) {
        sqlHelper.addSqlSnippet(" ");
      }
      continue;
    }
    if (state.whereStates[i].builderType == BuilderType.WhereNotInValues) {
      sqlHelper.addSqlSnippet(
        config.identifierDelimiters().begin + state.whereStates[i].tableNameOrAlias + config.identifierDelimiters().end
      );
      sqlHelper.addSqlSnippet(".");
      sqlHelper.addSqlSnippet(
        config.identifierDelimiters().begin + state.whereStates[i].columnName + config.identifierDelimiters().end
      );
      sqlHelper.addSqlSnippet(" NOT IN (");
      for (let j = 0; j < state.whereStates[i].values.length; j++) {
        sqlHelper.addSqlSnippet(sqlHelper.addDynamicValue(state.whereStates[i].values[j]));
        if (j < state.whereStates[i].values.length - 1) {
          sqlHelper.addSqlSnippet(", ");
        }
      }
      sqlHelper.addSqlSnippet(")");
      if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) {
        sqlHelper.addSqlSnippet(" ");
      }
      continue;
    }
    if (state.whereStates[i].builderType == BuilderType.WhereNotNull) {
      sqlHelper.addSqlSnippet(
        config.identifierDelimiters().begin + state.whereStates[i].tableNameOrAlias + config.identifierDelimiters().end
      );
      sqlHelper.addSqlSnippet(".");
      sqlHelper.addSqlSnippet(
        config.identifierDelimiters().begin + state.whereStates[i].columnName + config.identifierDelimiters().end
      );
      sqlHelper.addSqlSnippet(" IS NOT NULL");
      if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) {
        sqlHelper.addSqlSnippet(" ");
      }
      continue;
    }
    if (state.whereStates[i].builderType == BuilderType.WhereNull) {
      sqlHelper.addSqlSnippet(
        config.identifierDelimiters().begin + state.whereStates[i].tableNameOrAlias + config.identifierDelimiters().end
      );
      sqlHelper.addSqlSnippet(".");
      sqlHelper.addSqlSnippet(
        config.identifierDelimiters().begin + state.whereStates[i].columnName + config.identifierDelimiters().end
      );
      sqlHelper.addSqlSnippet(" IS NULL");
      if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) {
        sqlHelper.addSqlSnippet(" ");
      }
      continue;
    }
  }
  return sqlHelper;
};

const defaultToSql = (state, config, mode) => {
  const sqlHelper = new SqlHelper(config, mode);
  if (IsHelper.isNullOrUndefined(state)) {
    throw new ParserError(ParserArea.General, "No state provided");
  }
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
  if (!state.isInnerStatement) {
    sqlHelper.addSqlSnippet(";");
  }
  return sqlHelper;
};

const defaultFrom = (state, config, mode) => {
  const sqlHelper = new SqlHelper(config, mode);
  if (state.fromStates.length === 0) {
    throw new ParserError(ParserArea.From, "No tables to select from");
  }
  sqlHelper.addSqlSnippet("FROM ");
  state.fromStates.forEach((fromState, i) => {
    if (fromState.builderType === BuilderType.FromRaw) {
      sqlHelper.addSqlSnippet(fromState.raw ?? "");
      if (i < state.fromStates.length - 1) {
        sqlHelper.addSqlSnippet(", ");
      }
      return;
    }
    if (fromState.builderType === BuilderType.FromTable) {
      if (fromState.owner !== "" && config.databaseType() === DatabaseType.Mysql) {
        throw new ParserError(ParserArea.From, "MySQL does not support table owners");
      }
      if (fromState.owner !== "") {
        sqlHelper.addSqlSnippet(
          config.identifierDelimiters().begin + fromState.owner + config.identifierDelimiters().end
        );
        sqlHelper.addSqlSnippet(".");
      }
      sqlHelper.addSqlSnippet(
        config.identifierDelimiters().begin + fromState.tableName + config.identifierDelimiters().end
      );
      if (fromState.alias !== "") {
        sqlHelper.addSqlSnippet(" AS ");
        sqlHelper.addSqlSnippet(
          config.identifierDelimiters().begin + fromState.alias + config.identifierDelimiters().end
        );
      }
      if (i < state.fromStates.length - 1) {
        sqlHelper.addSqlSnippet(", ");
      }
      return;
    }
    if (fromState.builderType === BuilderType.FromBuilder) {
      const subHelper = defaultToSql(fromState.sqlEasyState, config, mode);
      sqlHelper.addSqlSnippet("(" + subHelper.getSql() + ")");
      if (fromState.alias !== "") {
        sqlHelper.addSqlSnippet(" AS ");
        sqlHelper.addSqlSnippet(
          config.identifierDelimiters().begin + fromState.alias + config.identifierDelimiters().end
        );
      }
      if (i < state.fromStates.length - 1) {
        sqlHelper.addSqlSnippet(", ");
      }
    }
  });
  return sqlHelper;
};

var __defProp$o = Object.defineProperty;
var __defNormalProp$o = (obj, key, value) => key in obj ? __defProp$o(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$o = (obj, key, value) => __defNormalProp$o(obj, typeof key !== "symbol" ? key + "" : key, value);
class DefaultParser {
  constructor(config) {
    __publicField$o(this, "_config");
    __publicField$o(this, "toSqlRaw", (state) => {
      const sqlHelper = defaultToSql(state, this._config, ParserMode.Raw);
      return sqlHelper.getSqlDebug();
    });
    __publicField$o(this, "toSqlMultiRaw", (states, transactionState) => {
      let sqlRaw = "";
      if (transactionState === MultiBuilderTransactionState.TransactionOn) {
        sqlRaw += this._config.transactionDelimiters().begin + "; ";
      }
      for (const state of states) {
        const sql = this.toSqlRaw(state);
        sqlRaw += sql;
      }
      if (transactionState === MultiBuilderTransactionState.TransactionOn) {
        sqlRaw += this._config.transactionDelimiters().end + "; ";
      }
      return sqlRaw;
    });
    this._config = config;
  }
}

var __defProp$n = Object.defineProperty;
var __defNormalProp$n = (obj, key, value) => key in obj ? __defProp$n(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$n = (obj, key, value) => __defNormalProp$n(obj, typeof key !== "symbol" ? key + "" : key, value);
class MssqlJoinOnBuilder extends DefaultJoinOnBuilder {
  constructor(config) {
    super(config);
    __publicField$n(this, "_mssqlConfiguration");
    __publicField$n(this, "newJoinOnBuilder", () => {
      return new MssqlJoinOnBuilder(this._mssqlConfiguration);
    });
    this._mssqlConfiguration = config;
  }
}

var __defProp$m = Object.defineProperty;
var __defNormalProp$m = (obj, key, value) => key in obj ? __defProp$m(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$m = (obj, key, value) => __defNormalProp$m(obj, typeof key !== "symbol" ? key + "" : key, value);
class MssqlParser extends DefaultParser {
  constructor(config) {
    super(config);
    __publicField$m(this, "_mssqlConfiguration");
    __publicField$m(this, "toSql", (state) => {
      const paramsString = new SqlHelper(this._mssqlConfiguration, ParserMode.Prepared);
      const finalString = new SqlHelper(this._mssqlConfiguration, ParserMode.Prepared);
      const sqlHelper = defaultToSql(state, this._mssqlConfiguration, ParserMode.Prepared);
      let sql = sqlHelper.getSql();
      sql = sql.replaceAll("'", "''");
      if (sql.length > 4e3) {
        throw new ParserError(ParserArea.General, "SQL string is too long for Mssql prepared statement");
      }
      let valueCounter = 0;
      for (const value of sqlHelper.getValues()) {
        const valuePosition = sql.indexOf(this._mssqlConfiguration.preparedStatementPlaceholder());
        if (valuePosition === -1) {
          break;
        }
        sql = sql.slice(0, valuePosition) + "@p" + valueCounter + sql.slice(valuePosition + 1);
        if (valueCounter > 0) {
          paramsString.addSqlSnippet(", ");
        }
        paramsString.addSqlSnippet("@p" + valueCounter + " " + this.getParameterType(value));
        valueCounter++;
      }
      if (paramsString.getSql().length > 4e3) {
        throw new ParserError(ParserArea.General, "SQL string is too long for Mssql prepared statement");
      }
      finalString.addSqlSnippet("SET NOCOUNT ON; ");
      finalString.addSqlSnippet("exec sp_executesql N'");
      finalString.addSqlSnippet(sql);
      finalString.addSqlSnippet("', N'");
      finalString.addSqlSnippet(paramsString.getSql());
      finalString.addSqlSnippet("', ");
      for (let i = 0; i < sqlHelper.getValues().length; i++) {
        if (i > 0) {
          finalString.addSqlSnippet(", ");
        }
        finalString.addSqlSnippet("@p" + i + " = " + finalString.getValueStringFromDataType(sqlHelper.getValues()[i]));
      }
      finalString.addSqlSnippet(";");
      return finalString.getSql();
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    __publicField$m(this, "toSqlMulti", (_states, _transactionState) => {
      throw new ParserError(ParserArea.General, "toSqlMulti not implemented for MssqlParser");
    });
    __publicField$m(this, "getParameterType", (value) => {
      const typeOf = typeof value;
      switch (typeOf) {
        case "string":
          return "nvarchar(max)";
        case "number":
          if (Number.isInteger(value)) {
            if (value >= -128 && value <= 127) {
              return "tinyint";
            } else if (value >= -32768 && value <= 32767) {
              return "smallint";
            } else if (value >= -2147483648 && value <= 2147483647) {
              return "int";
            } else {
              return "bigint";
            }
          } else {
            return "float";
          }
        case "boolean":
          return "bit";
        default:
          return "nvarchar(max)";
      }
    });
    this._mssqlConfiguration = config;
  }
}

var __defProp$l = Object.defineProperty;
var __defNormalProp$l = (obj, key, value) => key in obj ? __defProp$l(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$l = (obj, key, value) => __defNormalProp$l(obj, typeof key !== "symbol" ? key + "" : key, value);
class MssqlBuilder extends DefaultBuilder {
  constructor(config) {
    super(config);
    __publicField$l(this, "_mssqlConfig");
    __publicField$l(this, "newBuilder", () => {
      return new MssqlBuilder(this._mssqlConfig);
    });
    __publicField$l(this, "newJoinOnBuilder", () => {
      return new MssqlJoinOnBuilder(this._mssqlConfig);
    });
    __publicField$l(this, "newParser", () => {
      return new MssqlParser(this._mssqlConfig);
    });
    __publicField$l(this, "clearTop", () => {
      delete this.state().customState["top"];
      return this;
    });
    __publicField$l(this, "top", (top) => {
      this.state().customState["top"] = top;
      return this;
    });
    this._mssqlConfig = config;
  }
}

var __defProp$k = Object.defineProperty;
var __defNormalProp$k = (obj, key, value) => key in obj ? __defProp$k(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$k = (obj, key, value) => __defNormalProp$k(obj, typeof key !== "symbol" ? key + "" : key, value);
class MssqlConfiguration {
  constructor(rc) {
    __publicField$k(this, "_mssqlRuntimeConfiguration");
    __publicField$k(this, "databaseType", () => {
      return DatabaseType.Mssql;
    });
    __publicField$k(this, "defaultOwner", () => {
      return "dbo";
    });
    __publicField$k(this, "identifierDelimiters", () => {
      return {
        begin: "[",
        end: "]"
      };
    });
    __publicField$k(this, "preparedStatementPlaceholder", () => {
      return "?";
    });
    __publicField$k(this, "runtimeConfiguration", () => {
      return this._mssqlRuntimeConfiguration;
    });
    __publicField$k(this, "stringDelimiter", () => {
      return "'";
    });
    __publicField$k(this, "transactionDelimiters", () => {
      return {
        begin: "BEGIN TRANSACTION",
        end: "COMMIT TRANSACTION"
      };
    });
    this._mssqlRuntimeConfiguration = rc;
  }
}

var __defProp$j = Object.defineProperty;
var __defNormalProp$j = (obj, key, value) => key in obj ? __defProp$j(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$j = (obj, key, value) => __defNormalProp$j(obj, typeof key !== "symbol" ? key + "" : key, value);
class MssqlMultiBuilder extends DefaultMultiBuilder {
  constructor(config) {
    super(config);
    __publicField$j(this, "_mssqlConfiguration");
    __publicField$j(this, "newBuilder", () => {
      return new MssqlBuilder(this._mssqlConfiguration);
    });
    __publicField$j(this, "newParser", () => {
      return new MssqlParser(this._mssqlConfiguration);
    });
    this._mssqlConfiguration = config;
  }
}

var __defProp$i = Object.defineProperty;
var __defNormalProp$i = (obj, key, value) => key in obj ? __defProp$i(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$i = (obj, key, value) => __defNormalProp$i(obj, typeof key !== "symbol" ? key + "" : key, value);
class MssqlSqlEasy {
  constructor(rc) {
    __publicField$i(this, "_mssqlConfiguration");
    __publicField$i(this, "configuration", () => {
      return this._mssqlConfiguration;
    });
    __publicField$i(this, "newBuilder", (rc) => {
      if (IsHelper.isNullOrUndefined(rc)) {
        return new MssqlBuilder(this._mssqlConfiguration);
      }
      return new MssqlBuilder(new MssqlConfiguration(rc));
    });
    __publicField$i(this, "newMultiBuilder", (rc) => {
      if (IsHelper.isNullOrUndefined(rc)) {
        return new MssqlMultiBuilder(this._mssqlConfiguration);
      }
      return new MssqlMultiBuilder(new MssqlConfiguration(rc));
    });
    if (IsHelper.isNullOrUndefined(rc)) {
      rc = new RuntimeConfiguration();
    }
    this._mssqlConfiguration = new MssqlConfiguration(rc);
  }
}

var __defProp$h = Object.defineProperty;
var __defNormalProp$h = (obj, key, value) => key in obj ? __defProp$h(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$h = (obj, key, value) => __defNormalProp$h(obj, typeof key !== "symbol" ? key + "" : key, value);
class MysqlJoinOnBuilder extends DefaultJoinOnBuilder {
  constructor(config) {
    super(config);
    __publicField$h(this, "_mysqlConfig");
    __publicField$h(this, "newJoinOnBuilder", () => {
      return new MysqlJoinOnBuilder(this._mysqlConfig);
    });
    this._mysqlConfig = config;
  }
}

var __defProp$g = Object.defineProperty;
var __defNormalProp$g = (obj, key, value) => key in obj ? __defProp$g(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$g = (obj, key, value) => __defNormalProp$g(obj, typeof key !== "symbol" ? key + "" : key, value);
class MysqlParser extends DefaultParser {
  constructor(config) {
    super(config);
    __publicField$g(this, "_mysqlConfiguration");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    __publicField$g(this, "toSql", (_state) => {
      throw new ParserError(ParserArea.General, "toSql not implemented for MysqlParser");
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    __publicField$g(this, "toSqlMulti", (_states, _transactionState) => {
      throw new ParserError(ParserArea.General, "toSqlMulti not implemented for MysqlParser");
    });
    this._mysqlConfiguration = config;
  }
}

var __defProp$f = Object.defineProperty;
var __defNormalProp$f = (obj, key, value) => key in obj ? __defProp$f(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$f = (obj, key, value) => __defNormalProp$f(obj, typeof key !== "symbol" ? key + "" : key, value);
class MysqlBuilder extends DefaultBuilder {
  constructor(config) {
    super(config);
    __publicField$f(this, "_mysqlConfig");
    __publicField$f(this, "newBuilder", () => {
      return new MysqlBuilder(this._mysqlConfig);
    });
    __publicField$f(this, "newJoinOnBuilder", () => {
      return new MysqlJoinOnBuilder(this._mysqlConfig);
    });
    __publicField$f(this, "newParser", () => {
      return new MysqlParser(this._mysqlConfig);
    });
    this._mysqlConfig = config;
  }
}

var __defProp$e = Object.defineProperty;
var __defNormalProp$e = (obj, key, value) => key in obj ? __defProp$e(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$e = (obj, key, value) => __defNormalProp$e(obj, typeof key !== "symbol" ? key + "" : key, value);
class MysqlConfiguration {
  constructor(rc) {
    __publicField$e(this, "_mysqlRuntimeConfiguration");
    __publicField$e(this, "databaseType", () => {
      return DatabaseType.Mysql;
    });
    __publicField$e(this, "defaultOwner", () => {
      return "";
    });
    __publicField$e(this, "identifierDelimiters", () => {
      return {
        begin: "`",
        end: "`"
      };
    });
    __publicField$e(this, "preparedStatementPlaceholder", () => {
      return "?";
    });
    __publicField$e(this, "runtimeConfiguration", () => {
      return this._mysqlRuntimeConfiguration;
    });
    __publicField$e(this, "stringDelimiter", () => {
      return "'";
    });
    __publicField$e(this, "transactionDelimiters", () => {
      return {
        begin: "START TRANSACTION",
        end: "COMMIT"
      };
    });
    this._mysqlRuntimeConfiguration = rc;
  }
}

var __defProp$d = Object.defineProperty;
var __defNormalProp$d = (obj, key, value) => key in obj ? __defProp$d(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$d = (obj, key, value) => __defNormalProp$d(obj, typeof key !== "symbol" ? key + "" : key, value);
class MysqlMultiBuilder extends DefaultMultiBuilder {
  constructor(config) {
    super(config);
    __publicField$d(this, "_mysqlConfig");
    __publicField$d(this, "newBuilder", () => {
      return new MysqlBuilder(this._mysqlConfig);
    });
    __publicField$d(this, "newParser", () => {
      return new MysqlParser(this._mysqlConfig);
    });
    this._mysqlConfig = config;
  }
}

var __defProp$c = Object.defineProperty;
var __defNormalProp$c = (obj, key, value) => key in obj ? __defProp$c(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$c = (obj, key, value) => __defNormalProp$c(obj, typeof key !== "symbol" ? key + "" : key, value);
class MysqlSqlEasy {
  constructor(rc) {
    __publicField$c(this, "_mssqlConfiguration");
    __publicField$c(this, "configuration", () => {
      return this._mssqlConfiguration;
    });
    __publicField$c(this, "newBuilder", (rc) => {
      if (IsHelper.isNullOrUndefined(rc)) {
        return new MysqlBuilder(this._mssqlConfiguration);
      }
      return new MysqlBuilder(new MysqlConfiguration(rc));
    });
    __publicField$c(this, "newMultiBuilder", (rc) => {
      if (IsHelper.isNullOrUndefined(rc)) {
        return new MysqlMultiBuilder(this._mssqlConfiguration);
      }
      return new MysqlMultiBuilder(new MysqlConfiguration(rc));
    });
    if (IsHelper.isNullOrUndefined(rc)) {
      rc = new RuntimeConfiguration();
    }
    this._mssqlConfiguration = new MysqlConfiguration(rc);
  }
}

var __defProp$b = Object.defineProperty;
var __defNormalProp$b = (obj, key, value) => key in obj ? __defProp$b(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$b = (obj, key, value) => __defNormalProp$b(obj, typeof key !== "symbol" ? key + "" : key, value);
class PostgresJoinOnBuilder extends DefaultJoinOnBuilder {
  constructor(config) {
    super(config);
    __publicField$b(this, "_postgresConfig");
    __publicField$b(this, "newJoinOnBuilder", () => {
      return new PostgresJoinOnBuilder(this._postgresConfig);
    });
    this._postgresConfig = config;
  }
}

var __defProp$a = Object.defineProperty;
var __defNormalProp$a = (obj, key, value) => key in obj ? __defProp$a(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$a = (obj, key, value) => __defNormalProp$a(obj, typeof key !== "symbol" ? key + "" : key, value);
class PostgresParser extends DefaultParser {
  constructor(config) {
    super(config);
    __publicField$a(this, "_postgresConfiguration");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    __publicField$a(this, "toSql", (_state) => {
      throw new ParserError(ParserArea.General, "toSql not implemented for PostgresParser");
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    __publicField$a(this, "toSqlMulti", (_states, _transactionState) => {
      throw new ParserError(ParserArea.General, "toSqlMulti not implemented for PostgresParser");
    });
    this._postgresConfiguration = config;
  }
}

var __defProp$9 = Object.defineProperty;
var __defNormalProp$9 = (obj, key, value) => key in obj ? __defProp$9(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$9 = (obj, key, value) => __defNormalProp$9(obj, typeof key !== "symbol" ? key + "" : key, value);
class PostgresBuilder extends DefaultBuilder {
  constructor(config) {
    super(config);
    __publicField$9(this, "_postgresConfig");
    __publicField$9(this, "newBuilder", () => {
      return new PostgresBuilder(this._postgresConfig);
    });
    __publicField$9(this, "newJoinOnBuilder", () => {
      return new PostgresJoinOnBuilder(this._postgresConfig);
    });
    __publicField$9(this, "newParser", () => {
      return new PostgresParser(this._postgresConfig);
    });
    this._postgresConfig = config;
  }
}

var __defProp$8 = Object.defineProperty;
var __defNormalProp$8 = (obj, key, value) => key in obj ? __defProp$8(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$8 = (obj, key, value) => __defNormalProp$8(obj, typeof key !== "symbol" ? key + "" : key, value);
class PostgresConfiguration {
  constructor(rc) {
    __publicField$8(this, "_postgresRuntimeConfiguration");
    __publicField$8(this, "databaseType", () => {
      return DatabaseType.Postgres;
    });
    __publicField$8(this, "defaultOwner", () => {
      return "public";
    });
    __publicField$8(this, "identifierDelimiters", () => {
      return {
        begin: '"',
        end: '"'
      };
    });
    __publicField$8(this, "preparedStatementPlaceholder", () => {
      return "$";
    });
    __publicField$8(this, "runtimeConfiguration", () => {
      return this._postgresRuntimeConfiguration;
    });
    __publicField$8(this, "stringDelimiter", () => {
      return "'";
    });
    __publicField$8(this, "transactionDelimiters", () => {
      return {
        begin: "BEGIN",
        end: "COMMIT"
      };
    });
    this._postgresRuntimeConfiguration = rc;
  }
}

var __defProp$7 = Object.defineProperty;
var __defNormalProp$7 = (obj, key, value) => key in obj ? __defProp$7(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$7 = (obj, key, value) => __defNormalProp$7(obj, typeof key !== "symbol" ? key + "" : key, value);
class PostgresMultiBuilder extends DefaultMultiBuilder {
  constructor(config) {
    super(config);
    __publicField$7(this, "_postgresConfig");
    __publicField$7(this, "newBuilder", () => {
      return new PostgresBuilder(this._postgresConfig);
    });
    __publicField$7(this, "newParser", () => {
      return new PostgresParser(this._postgresConfig);
    });
    this._postgresConfig = config;
  }
}

var __defProp$6 = Object.defineProperty;
var __defNormalProp$6 = (obj, key, value) => key in obj ? __defProp$6(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$6 = (obj, key, value) => __defNormalProp$6(obj, typeof key !== "symbol" ? key + "" : key, value);
class PostgresSqlEasy {
  constructor(rc) {
    __publicField$6(this, "_postgresConfig");
    __publicField$6(this, "configuration", () => {
      return this._postgresConfig;
    });
    __publicField$6(this, "newBuilder", (rc) => {
      if (IsHelper.isNullOrUndefined(rc)) {
        return new PostgresBuilder(this._postgresConfig);
      }
      return new PostgresBuilder(new PostgresConfiguration(rc));
    });
    __publicField$6(this, "newMultiBuilder", (rc) => {
      if (IsHelper.isNullOrUndefined(rc)) {
        return new PostgresMultiBuilder(this._postgresConfig);
      }
      return new PostgresMultiBuilder(new PostgresConfiguration(rc));
    });
    if (IsHelper.isNullOrUndefined(rc)) {
      rc = new RuntimeConfiguration();
    }
    this._postgresConfig = new PostgresConfiguration(rc);
  }
}

var __defProp$5 = Object.defineProperty;
var __defNormalProp$5 = (obj, key, value) => key in obj ? __defProp$5(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$5 = (obj, key, value) => __defNormalProp$5(obj, typeof key !== "symbol" ? key + "" : key, value);
class FromState {
  constructor() {
    __publicField$5(this, "builderType", BuilderType.None);
    __publicField$5(this, "owner");
    __publicField$5(this, "tableName");
    __publicField$5(this, "alias");
    __publicField$5(this, "sqlEasyState");
    __publicField$5(this, "raw");
  }
}

var __defProp$4 = Object.defineProperty;
var __defNormalProp$4 = (obj, key, value) => key in obj ? __defProp$4(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$4 = (obj, key, value) => __defNormalProp$4(obj, typeof key !== "symbol" ? key + "" : key, value);
class JoinOnState {
  constructor() {
    __publicField$4(this, "aliasLeft");
    __publicField$4(this, "columnLeft");
    __publicField$4(this, "joinOperator", JoinOperator.Equals);
    __publicField$4(this, "aliasRight");
    __publicField$4(this, "columnRight");
    __publicField$4(this, "joinOnOperator", JoinOnOperator.None);
    __publicField$4(this, "raw");
    __publicField$4(this, "valueRight");
  }
}

var __defProp$3 = Object.defineProperty;
var __defNormalProp$3 = (obj, key, value) => key in obj ? __defProp$3(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$3 = (obj, key, value) => __defNormalProp$3(obj, typeof key !== "symbol" ? key + "" : key, value);
class JoinState {
  constructor() {
    __publicField$3(this, "builderType", BuilderType.None);
    __publicField$3(this, "joinType", JoinType.Inner);
    __publicField$3(this, "owner");
    __publicField$3(this, "tableName");
    __publicField$3(this, "alias");
    __publicField$3(this, "sqlEasyState");
    __publicField$3(this, "raw");
    __publicField$3(this, "joinOnStates", []);
  }
}

var __defProp$2 = Object.defineProperty;
var __defNormalProp$2 = (obj, key, value) => key in obj ? __defProp$2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$2 = (obj, key, value) => __defNormalProp$2(obj, typeof key !== "symbol" ? key + "" : key, value);
class OrderByState {
  constructor() {
    __publicField$2(this, "builderType", BuilderType.None);
    __publicField$2(this, "tableNameOrAlias");
    __publicField$2(this, "columnName");
    __publicField$2(this, "direction", OrderByDirection.None);
    __publicField$2(this, "raw");
  }
}

var __defProp$1 = Object.defineProperty;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$1 = (obj, key, value) => __defNormalProp$1(obj, typeof key !== "symbol" ? key + "" : key, value);
class SelectState {
  constructor() {
    __publicField$1(this, "builderType", BuilderType.None);
    __publicField$1(this, "tableNameOrAlias");
    __publicField$1(this, "columnName");
    __publicField$1(this, "alias");
    __publicField$1(this, "sqlEasyState");
    __publicField$1(this, "raw");
  }
}

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
class WhereState {
  constructor() {
    __publicField(this, "builderType", BuilderType.None);
    __publicField(this, "tableNameOrAlias");
    __publicField(this, "columnName");
    __publicField(this, "whereOperator", WhereOperator.None);
    __publicField(this, "raw");
    __publicField(this, "sqlEasyState");
    __publicField(this, "values", []);
  }
}

export { BuilderType, ConfigurationDelimiters, DatabaseType, Datatype, DefaultBuilder, DefaultJoinOnBuilder, DefaultMultiBuilder, DefaultParser, FromState, JoinOnOperator, JoinOnState, JoinOperator, JoinState, JoinType, MssqlBuilder, MssqlConfiguration, MssqlJoinOnBuilder, MssqlMultiBuilder, MssqlParser, MssqlSqlEasy, MultiBuilderTransactionState, MysqlBuilder, MysqlConfiguration, MysqlJoinOnBuilder, MysqlMultiBuilder, MysqlParser, MysqlSqlEasy, OrderByDirection, OrderByState, ParserArea, ParserError, ParserMode, PostgresBuilder, PostgresConfiguration, PostgresJoinOnBuilder, PostgresMultiBuilder, PostgresParser, PostgresSqlEasy, RuntimeConfiguration, SelectState, SqlEasyState, SqlHelper, WhereOperator, WhereState, defaultFrom, defaultJoin, defaultLimitOffset, defaultOrderBy, defaultSelect, defaultToSql, defaultWhere };
//# sourceMappingURL=index.js.map
