//#region src/configuration/configuration_delimiters.d.ts
declare class ConfigurationDelimiters {
  begin: string;
  end: string;
}
//#endregion
//#region src/configuration/runtime_configuration.d.ts
declare class RuntimeConfiguration {
  maxRowsReturned: number;
  customConfiguration: any | undefined;
}
//#endregion
//#region src/enums/database_type.d.ts
declare enum DatabaseType {
  Mssql = 0,
  Postgres = 1,
  Mysql = 2,
  Sqlite = 3,
  Unknown = 4
}
//#endregion
//#region src/configuration/interface_configuration.d.ts
interface IConfiguration {
  databaseType(): DatabaseType;
  defaultOwner(): string;
  identifierDelimiters(): ConfigurationDelimiters;
  preparedStatementPlaceholder(): string;
  runtimeConfiguration(): RuntimeConfiguration;
  stringDelimiter(): string;
  transactionDelimiters(): ConfigurationDelimiters;
}
//#endregion
//#region src/enums/join_type.d.ts
declare enum JoinType {
  Inner = 0,
  Left = 1,
  LeftOuter = 2,
  Right = 3,
  RightOuter = 4,
  FullOuter = 5,
  Cross = 6,
  None = 7
}
//#endregion
//#region src/enums/order_by_direction.d.ts
declare enum OrderByDirection {
  Ascending = 0,
  Descending = 1,
  None = 2
}
//#endregion
//#region src/enums/where_operator.d.ts
declare enum WhereOperator {
  Equals = 0,
  NotEquals = 1,
  GreaterThan = 2,
  GreaterThanOrEquals = 3,
  LessThan = 4,
  LessThanOrEquals = 5,
  None = 6
}
//#endregion
//#region src/enums/multi_builder_transaction_state.d.ts
declare enum MultiBuilderTransactionState {
  TransactionOn = 0,
  TransactionOff = 1,
  None = 2
}
//#endregion
//#region src/enums/builder_type.d.ts
declare enum BuilderType {
  And = 0,
  FromBuilder = 1,
  FromTable = 2,
  FromRaw = 3,
  GroupByColumn = 4,
  GroupByRaw = 5,
  Having = 6,
  HavingRaw = 7,
  InsertInto = 8,
  InsertRaw = 9,
  JoinBuilder = 10,
  JoinRaw = 11,
  JoinTable = 12,
  None = 13,
  Or = 14,
  OrderByColumn = 15,
  OrderByRaw = 16,
  SelectAll = 17,
  SelectBuilder = 18,
  SelectColumn = 19,
  SelectRaw = 20,
  UpdateTable = 21,
  UpdateColumn = 22,
  UpdateRaw = 23,
  DeleteFrom = 24,
  Union = 25,
  UnionAll = 26,
  Intersect = 27,
  Except = 28,
  CteBuilder = 29,
  CteRaw = 30,
  Where = 31,
  WhereBetween = 32,
  WhereGroupBegin = 33,
  WhereGroupBuilder = 34,
  WhereGroupEnd = 35,
  WhereExistsBuilder = 36,
  WhereInBuilder = 37,
  WhereInValues = 38,
  WhereNotExistsBuilder = 39,
  WhereNotInBuilder = 40,
  WhereNotInValues = 41,
  WhereNotNull = 42,
  WhereNull = 43,
  WhereRaw = 44
}
//#endregion
//#region src/state/cte_state.d.ts
declare class CteState {
  builderType: BuilderType;
  name: string;
  recursive: boolean;
  sqlEasyState: SqlEasyState | undefined;
  raw: string | undefined;
}
//#endregion
//#region src/state/from_state.d.ts
declare class FromState {
  builderType: BuilderType;
  owner: string | undefined;
  tableName: string | undefined;
  alias: string | undefined;
  sqlEasyState: SqlEasyState | undefined;
  raw: string | undefined;
}
//#endregion
//#region src/state/group_by_state.d.ts
declare class GroupByState {
  builderType: BuilderType;
  tableNameOrAlias: string | undefined;
  columnName: string | undefined;
  raw: string | undefined;
}
//#endregion
//#region src/state/having_state.d.ts
declare class HavingState {
  builderType: BuilderType;
  tableNameOrAlias: string | undefined;
  columnName: string | undefined;
  whereOperator: WhereOperator;
  raw: string | undefined;
  values: any[];
}
//#endregion
//#region src/state/insert_state.d.ts
declare class InsertState {
  owner: string | undefined;
  tableName: string | undefined;
  columns: string[];
  values: any[][];
  raw: string | undefined;
}
//#endregion
//#region src/enums/join_on_operator.d.ts
declare enum JoinOnOperator {
  GroupBegin = 0,
  GroupEnd = 1,
  On = 2,
  Raw = 3,
  Value = 4,
  And = 5,
  Or = 6,
  None = 7
}
//#endregion
//#region src/enums/join_operator.d.ts
declare enum JoinOperator {
  Equals = 0,
  NotEquals = 1,
  GreaterThan = 2,
  GreaterThanOrEquals = 3,
  LessThan = 4,
  LessThanOrEquals = 5,
  None = 6
}
//#endregion
//#region src/state/join_on_state.d.ts
declare class JoinOnState {
  aliasLeft: string | undefined;
  columnLeft: string | undefined;
  joinOperator: JoinOperator;
  aliasRight: string | undefined;
  columnRight: string | undefined;
  joinOnOperator: JoinOnOperator;
  raw: string | undefined;
  valueRight: any | undefined;
}
//#endregion
//#region src/state/join_state.d.ts
declare class JoinState {
  builderType: BuilderType;
  joinType: JoinType;
  owner: string | undefined;
  tableName: string | undefined;
  alias: string | undefined;
  sqlEasyState: SqlEasyState | undefined;
  raw: string | undefined;
  joinOnStates: JoinOnState[];
}
//#endregion
//#region src/state/order_by_state.d.ts
declare class OrderByState {
  builderType: BuilderType;
  tableNameOrAlias: string | undefined;
  columnName: string | undefined;
  direction: OrderByDirection;
  raw: string | undefined;
}
//#endregion
//#region src/state/select_state.d.ts
declare class SelectState {
  builderType: BuilderType;
  tableNameOrAlias: string | undefined;
  columnName: string | undefined;
  alias: string | undefined;
  sqlEasyState: SqlEasyState | undefined;
  raw: string | undefined;
}
//#endregion
//#region src/state/union_state.d.ts
declare class UnionState {
  builderType: BuilderType;
  sqlEasyState: SqlEasyState | undefined;
  raw: string | undefined;
}
//#endregion
//#region src/state/update_state.d.ts
declare class UpdateState {
  builderType: BuilderType;
  columnName: string | undefined;
  value: any;
  raw: string | undefined;
}
//#endregion
//#region src/state/where_state.d.ts
declare class WhereState {
  builderType: BuilderType;
  tableNameOrAlias: string | undefined;
  columnName: string | undefined;
  whereOperator: WhereOperator;
  raw: string | undefined;
  sqlEasyState: SqlEasyState | undefined;
  values: any[];
}
//#endregion
//#region src/enums/query_type.d.ts
declare enum QueryType {
  Select = 0,
  Insert = 1,
  Update = 2,
  Delete = 3
}
//#endregion
//#region src/state/sqleasy_state.d.ts
declare class SqlEasyState {
  builderName: string;
  queryType: QueryType;
  fromStates: FromState[];
  joinStates: JoinState[];
  whereStates: WhereState[];
  orderByStates: OrderByState[];
  selectStates: SelectState[];
  groupByStates: GroupByState[];
  havingStates: HavingState[];
  unionStates: UnionState[];
  cteStates: CteState[];
  insertState: InsertState | undefined;
  updateStates: UpdateState[];
  isInnerStatement: boolean;
  limit: number;
  offset: number;
  distinct: boolean;
  customState: any | undefined;
}
//#endregion
//#region src/parser/interface_parser.d.ts
interface IParser {
  toSql(state: SqlEasyState): string;
  toSqlMulti(states: SqlEasyState[], transactionState: MultiBuilderTransactionState): string;
  toSqlRaw(state: SqlEasyState): string;
  toSqlMultiRaw(states: SqlEasyState[], transactionState: MultiBuilderTransactionState): string;
}
//#endregion
//#region src/builder/interface_join_on_builder.d.ts
interface IJoinOnBuilder<T> {
  and(): T;
  newJoinOnBuilder(config?: IConfiguration): T;
  on(aliasLeft: string, columnLeft: string, joinOperator: JoinOperator, aliasRight: string, columnRight: string): T;
  onGroup(builder: (jb: T) => void): T;
  onRaw(raw: string): T;
  onValue(aliasLeft: string, columnLeft: string, joinOperator: JoinOperator, valueRight: any): T;
  or(): T;
  states(): JoinOnState[];
}
//#endregion
//#region src/builder/interface_builder.d.ts
interface IBuilder<T, U extends IJoinOnBuilder<U>, V extends IParser> {
  and(): T;
  clearAll(): T;
  clearFrom(): T;
  clearGroupBy(): T;
  clearHaving(): T;
  clearJoin(): T;
  clearLimit(): T;
  clearOffset(): T;
  clearOrderBy(): T;
  clearSelect(): T;
  clearWhere(): T;
  cte(name: string, builder: (builder: T) => void): T;
  cteRaw(name: string, raw: string): T;
  cteRecursive(name: string, builder: (builder: T) => void): T;
  deleteFrom(tableName: string, alias: string): T;
  deleteFromWithOwner(owner: string, tableName: string, alias: string): T;
  distinct(): T;
  except(builder: (builder: T) => void): T;
  fromRaw(rawFrom: string): T;
  fromRaws(rawFroms: string[]): T;
  fromTable(tableName: string, alias: string): T;
  fromTables(tables: {
    tableName: string;
    alias: string;
  }[]): T;
  fromTableWithOwner(owner: string, tableName: string, alias: string): T;
  fromTablesWithOwner(tablesWithOwner: {
    owner: string;
    tableName: string;
    alias: string;
  }[]): T;
  fromWithBuilder(alias: string, builder: (builder: T) => void): T;
  groupByColumn(tableNameOrAlias: string, columnName: string): T;
  groupByColumns(columns: {
    tableNameOrAlias: string;
    columnName: string;
  }[]): T;
  groupByRaw(rawGroupBy: string): T;
  groupByRaws(rawGroupBys: string[]): T;
  having(tableNameOrAlias: string, columnName: string, whereOperator: WhereOperator, value: any): T;
  havingRaw(rawHaving: string): T;
  havingRaws(rawHavings: string[]): T;
  insertInto(tableName: string): T;
  insertIntoWithOwner(owner: string, tableName: string): T;
  insertColumns(columns: string[]): T;
  insertValues(values: any[]): T;
  insertRaw(raw: string): T;
  intersect(builder: (builder: T) => void): T;
  joinRaw(rawJoin: string): T;
  joinRaws(rawJoins: string[]): T;
  joinTable(joinType: JoinType, tableName: string, alias: string, joinOnBuilder: (joinOnBuilder: U) => void): T;
  joinTables(joins: {
    joinType: JoinType;
    tableName: string;
    alias: string;
    joinOnBuilder: (joinOnBuilder: U) => void;
  }[]): T;
  joinTablesWithOwner(joins: {
    joinType: JoinType;
    owner: string;
    tableName: string;
    alias: string;
    joinOnBuilder: (joinOnBuilder: U) => void;
  }[]): T;
  joinTableWithOwner(joinType: JoinType, owner: string, tableName: string, alias: string, joinOnBuilder: (joinOnBuilder: U) => void): T;
  joinWithBuilder(joinType: JoinType, alias: string, builder: (builder: T) => void, joinOnBuilder: (joinOnBuilder: U) => void): T;
  limit(limit: number): T;
  newBuilder(config?: IConfiguration): T;
  newJoinOnBuilder(config?: IConfiguration): U;
  newParser(config?: IConfiguration): V;
  offset(offset: number): T;
  or(): T;
  orderByColumn(tableNameOrAlias: string, columnName: string, direction: OrderByDirection): T;
  orderByColumns(columns: {
    tableNameOrAlias: string;
    columnName: string;
    direction: OrderByDirection;
  }[]): T;
  orderByRaw(rawOrderBy: string): T;
  orderByRaws(rawOrderBys: string[]): T;
  parse(): string;
  parseRaw(): string;
  selectAll(): T;
  selectColumn(tableNameOrAlias: string, columnName: string, columnAlias: string): T;
  selectColumns(columns: {
    tableNameOrAlias: string;
    columnName: string;
    columnAlias: string;
  }[]): T;
  selectRaw(rawSelect: string): T;
  selectRaws(rawSelects: string[]): T;
  selectWithBuilder(alias: string, builder: (builder: T) => void): T;
  set(columnName: string, value: any): T;
  setColumns(columns: {
    columnName: string;
    value: any;
  }[]): T;
  setRaw(raw: string): T;
  state(): SqlEasyState;
  union(builder: (builder: T) => void): T;
  unionAll(builder: (builder: T) => void): T;
  updateTable(tableName: string, alias: string): T;
  updateTableWithOwner(owner: string, tableName: string, alias: string): T;
  where(tableNameOrAlias: string, columnName: string, whereOperator: WhereOperator, value: any): T;
  whereBetween(tableNameOrAlias: string, columnName: string, value1: any, value2: any): T;
  whereExistsWithBuilder(tableNameOrAlias: string, columnName: string, builder: (builder: T) => void): T;
  whereGroup(builder: (builder: T) => void): T;
  whereInWithBuilder(tableNameOrAlias: string, columnName: string, builder: (builder: T) => void): T;
  whereInValues(tableNameOrAlias: string, columnName: string, values: any[]): T;
  whereNotExistsWithBuilder(tableNameOrAlias: string, columnName: string, builder: (builder: T) => void): T;
  whereNotInWithBuilder(tableNameOrAlias: string, columnName: string, builder: (builder: T) => void): T;
  whereNotInValues(tableNameOrAlias: string, columnName: string, values: any[]): T;
  whereNotNull(tableNameOrAlias: string, columnName: string): T;
  whereNull(tableNameOrAlias: string, columnName: string): T;
  whereRaw(rawWhere: string): T;
  whereRaws(rawWheres: string[]): T;
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
//#region src/builder/interface_multi_builder.d.ts
interface IMultiBuilder<T extends IBuilder<T, U, V>, U extends IJoinOnBuilder<U>, V extends IParser> {
  addBuilder(builderName: string): T;
  parse(): string;
  parseRaw(): string;
  removeBuilder(builderName: string): void;
  reorderBuilders(builderNames: string[]): void;
  setTransactionState(transactionState: MultiBuilderTransactionState): void;
  states(): SqlEasyState[];
  transactionState(): MultiBuilderTransactionState;
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
//#region src/enums/datatype.d.ts
declare enum Datatype {
  Boolean = 0,
  DateTime = 1,
  Number = 2,
  String = 3,
  Unknown = 4
}
//#endregion
//#region src/enums/parser_area.d.ts
declare enum ParserArea {
  Select = "Select",
  From = "From",
  Join = "Join",
  Where = "Where",
  OrderBy = "OrderBy",
  LimitOffset = "LimitOffset",
  General = "General"
}
//#endregion
//#region src/enums/parser_mode.d.ts
declare enum ParserMode {
  Raw = 0,
  Prepared = 1,
  None = 2
}
//#endregion
//#region src/helpers/parser_error.d.ts
declare class ParserError extends Error {
  constructor(parserArea: ParserArea, message: string);
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
//#region src/parser/default_cte.d.ts
declare const defaultCte: (state: SqlEasyState, config: IConfiguration, mode: ParserMode) => SqlHelper;
//#endregion
//#region src/parser/default_delete.d.ts
declare const defaultDelete: (state: SqlEasyState, config: IConfiguration, mode: ParserMode) => SqlHelper;
//#endregion
//#region src/parser/default_from.d.ts
declare const defaultFrom: (state: SqlEasyState, config: IConfiguration, mode: ParserMode) => SqlHelper;
//#endregion
//#region src/parser/default_group_by.d.ts
declare const defaultGroupBy: (state: SqlEasyState, config: IConfiguration, mode: ParserMode) => SqlHelper;
//#endregion
//#region src/parser/default_having.d.ts
declare const defaultHaving: (state: SqlEasyState, config: IConfiguration, mode: ParserMode) => SqlHelper;
//#endregion
//#region src/parser/default_insert.d.ts
declare const defaultInsert: (state: SqlEasyState, config: IConfiguration, mode: ParserMode) => SqlHelper;
//#endregion
//#region src/parser/default_join.d.ts
declare const defaultJoin: (state: SqlEasyState, config: IConfiguration, mode: ParserMode) => SqlHelper;
//#endregion
//#region src/parser/default_limit_offset.d.ts
declare const defaultLimitOffset: (state: SqlEasyState, config: IConfiguration, mode: ParserMode) => SqlHelper;
//#endregion
//#region src/parser/default_order_by.d.ts
declare const defaultOrderBy: (state: SqlEasyState, config: IConfiguration, mode: ParserMode) => SqlHelper;
//#endregion
//#region src/parser/default_to_sql.d.ts
interface ToSqlOptions {
  beforeSelectColumns?: (state: SqlEasyState, config: IConfiguration, sqlHelper: SqlHelper) => void;
}
declare const defaultToSql: (state: SqlEasyState | undefined, config: IConfiguration, mode: ParserMode, options?: ToSqlOptions) => SqlHelper;
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
//#region src/parser/default_select.d.ts
declare const defaultSelect: (state: SqlEasyState, config: IConfiguration, mode: ParserMode, options?: ToSqlOptions) => SqlHelper;
//#endregion
//#region src/parser/default_union.d.ts
declare const defaultUnion: (state: SqlEasyState, config: IConfiguration, mode: ParserMode, options?: ToSqlOptions) => SqlHelper;
//#endregion
//#region src/parser/default_update.d.ts
declare const defaultUpdate: (state: SqlEasyState, config: IConfiguration, mode: ParserMode) => SqlHelper;
//#endregion
//#region src/parser/default_where.d.ts
declare const defaultWhere: (state: SqlEasyState, config: IConfiguration, mode: ParserMode) => SqlHelper;
//#endregion
//#region src/sqleasy/interface_sqleasy.d.ts
interface ISqlEasy<T extends IBuilder<T, U, W>, U extends IJoinOnBuilder<U>, V extends IMultiBuilder<T, U, W>, W extends IParser> {
  configuration(): IConfiguration;
  newBuilder(rc?: RuntimeConfiguration): T;
  newMultiBuilder(rc?: RuntimeConfiguration): V;
}
//#endregion
//#region src/sqleasy/mssql/mssql_configuration.d.ts
declare class MssqlConfiguration implements IConfiguration {
  private _mssqlRuntimeConfiguration;
  constructor(rc: RuntimeConfiguration);
  databaseType: () => DatabaseType;
  defaultOwner: () => string;
  identifierDelimiters: () => ConfigurationDelimiters;
  preparedStatementPlaceholder: () => string;
  runtimeConfiguration: () => RuntimeConfiguration;
  stringDelimiter: () => string;
  transactionDelimiters: () => ConfigurationDelimiters;
}
//#endregion
//#region src/sqleasy/mssql/mssql_join_on_builder.d.ts
declare class MssqlJoinOnBuilder extends DefaultJoinOnBuilder<MssqlJoinOnBuilder> {
  private _mssqlConfiguration;
  constructor(config: MssqlConfiguration);
  newJoinOnBuilder: (config?: IConfiguration) => MssqlJoinOnBuilder;
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
declare class MssqlBuilder extends DefaultBuilder<MssqlBuilder, MssqlJoinOnBuilder, MssqlParser> {
  private _mssqlConfig;
  constructor(config: MssqlConfiguration);
  newBuilder: (config?: IConfiguration) => MssqlBuilder;
  newJoinOnBuilder: (config?: IConfiguration) => MssqlJoinOnBuilder;
  newParser: (config?: IConfiguration) => MssqlParser;
  clearTop: () => MssqlBuilder;
  top: (top: number) => MssqlBuilder;
}
//#endregion
//#region src/sqleasy/mssql/mssql_multi_builder.d.ts
declare class MssqlMultiBuilder extends DefaultMultiBuilder<MssqlBuilder, MssqlJoinOnBuilder, MssqlParser> {
  private _mssqlConfiguration;
  constructor(config: MssqlConfiguration);
  newBuilder: () => MssqlBuilder;
  newParser: () => MssqlParser;
}
//#endregion
//#region src/sqleasy/mssql/mssql_sqleasy.d.ts
declare class MssqlSqlEasy implements ISqlEasy<MssqlBuilder, MssqlJoinOnBuilder, MssqlMultiBuilder, MssqlParser> {
  private _mssqlConfiguration;
  constructor(rc?: RuntimeConfiguration);
  configuration: () => MssqlConfiguration;
  newBuilder: (rc?: RuntimeConfiguration) => MssqlBuilder;
  newMultiBuilder: (rc?: RuntimeConfiguration) => MssqlMultiBuilder;
}
//#endregion
//#region src/sqleasy/mysql/mysql_configuration.d.ts
declare class MysqlConfiguration implements IConfiguration {
  private _mysqlRuntimeConfiguration;
  constructor(rc: RuntimeConfiguration);
  databaseType: () => DatabaseType;
  defaultOwner: () => string;
  identifierDelimiters: () => ConfigurationDelimiters;
  preparedStatementPlaceholder: () => string;
  runtimeConfiguration: () => RuntimeConfiguration;
  stringDelimiter: () => string;
  transactionDelimiters: () => ConfigurationDelimiters;
}
//#endregion
//#region src/sqleasy/mysql/mysql_join_on_builder.d.ts
declare class MysqlJoinOnBuilder extends DefaultJoinOnBuilder<MysqlJoinOnBuilder> {
  private _mysqlConfig;
  constructor(config: MysqlConfiguration);
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
declare class MysqlBuilder extends DefaultBuilder<MysqlBuilder, MysqlJoinOnBuilder, MysqlParser> {
  private _mysqlConfig;
  constructor(config: MysqlConfiguration);
  newBuilder: (config?: IConfiguration) => MysqlBuilder;
  newJoinOnBuilder: (config?: IConfiguration) => MysqlJoinOnBuilder;
  newParser: (config?: IConfiguration) => MysqlParser;
}
//#endregion
//#region src/sqleasy/mysql/mysql_multi_builder.d.ts
declare class MysqlMultiBuilder extends DefaultMultiBuilder<MysqlBuilder, MysqlJoinOnBuilder, MysqlParser> {
  private _mysqlConfig;
  constructor(config: MysqlConfiguration);
  newBuilder: () => MysqlBuilder;
  newParser: () => MysqlParser;
}
//#endregion
//#region src/sqleasy/mysql/mysql_sqleasy.d.ts
declare class MysqlSqlEasy implements ISqlEasy<MysqlBuilder, MysqlJoinOnBuilder, MysqlMultiBuilder, MysqlParser> {
  private _mysqlConfiguration;
  constructor(rc?: RuntimeConfiguration);
  configuration: () => MysqlConfiguration;
  newBuilder: (rc?: RuntimeConfiguration) => MysqlBuilder;
  newMultiBuilder: (rc?: RuntimeConfiguration) => MysqlMultiBuilder;
}
//#endregion
//#region src/sqleasy/postgres/postgres_configuration.d.ts
declare class PostgresConfiguration implements IConfiguration {
  private _postgresRuntimeConfiguration;
  constructor(rc: RuntimeConfiguration);
  databaseType: () => DatabaseType;
  defaultOwner: () => string;
  identifierDelimiters: () => ConfigurationDelimiters;
  preparedStatementPlaceholder: () => string;
  runtimeConfiguration: () => RuntimeConfiguration;
  stringDelimiter: () => string;
  transactionDelimiters: () => ConfigurationDelimiters;
}
//#endregion
//#region src/sqleasy/postgres/postgres_join_on_builder.d.ts
declare class PostgresJoinOnBuilder extends DefaultJoinOnBuilder<PostgresJoinOnBuilder> {
  private _postgresConfig;
  constructor(config: PostgresConfiguration);
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
declare class PostgresBuilder extends DefaultBuilder<PostgresBuilder, PostgresJoinOnBuilder, PostgresParser> {
  private _postgresConfig;
  constructor(config: PostgresConfiguration);
  newBuilder: (config?: IConfiguration) => PostgresBuilder;
  newJoinOnBuilder: (config?: IConfiguration) => PostgresJoinOnBuilder;
  newParser: (config?: IConfiguration) => PostgresParser;
}
//#endregion
//#region src/sqleasy/postgres/postgres_multi_builder.d.ts
declare class PostgresMultiBuilder extends DefaultMultiBuilder<PostgresBuilder, PostgresJoinOnBuilder, PostgresParser> {
  private _postgresConfig;
  constructor(config: PostgresConfiguration);
  newBuilder: () => PostgresBuilder;
  newParser: () => PostgresParser;
}
//#endregion
//#region src/sqleasy/postgres/postgres_sqleasy.d.ts
declare class PostgresSqlEasy implements ISqlEasy<PostgresBuilder, PostgresJoinOnBuilder, PostgresMultiBuilder, PostgresParser> {
  private _postgresConfig;
  constructor(rc?: RuntimeConfiguration);
  configuration: () => PostgresConfiguration;
  newBuilder: (rc?: RuntimeConfiguration) => PostgresBuilder;
  newMultiBuilder: (rc?: RuntimeConfiguration) => PostgresMultiBuilder;
}
//#endregion
//#region src/sqleasy/sqlite/sqlite_configuration.d.ts
declare class SqliteConfiguration implements IConfiguration {
  private _sqliteRuntimeConfiguration;
  constructor(rc: RuntimeConfiguration);
  databaseType: () => DatabaseType;
  defaultOwner: () => string;
  identifierDelimiters: () => ConfigurationDelimiters;
  preparedStatementPlaceholder: () => string;
  runtimeConfiguration: () => RuntimeConfiguration;
  stringDelimiter: () => string;
  transactionDelimiters: () => ConfigurationDelimiters;
}
//#endregion
//#region src/sqleasy/sqlite/sqlite_join_on_builder.d.ts
declare class SqliteJoinOnBuilder extends DefaultJoinOnBuilder<SqliteJoinOnBuilder> {
  private _sqliteConfig;
  constructor(config: SqliteConfiguration);
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
declare class SqliteBuilder extends DefaultBuilder<SqliteBuilder, SqliteJoinOnBuilder, SqliteParser> {
  private _sqliteConfig;
  constructor(config: SqliteConfiguration);
  newBuilder: (config?: IConfiguration) => SqliteBuilder;
  newJoinOnBuilder: (config?: IConfiguration) => SqliteJoinOnBuilder;
  newParser: (config?: IConfiguration) => SqliteParser;
}
//#endregion
//#region src/sqleasy/sqlite/sqlite_multi_builder.d.ts
declare class SqliteMultiBuilder extends DefaultMultiBuilder<SqliteBuilder, SqliteJoinOnBuilder, SqliteParser> {
  private _sqliteConfig;
  constructor(config: SqliteConfiguration);
  newBuilder: () => SqliteBuilder;
  newParser: () => SqliteParser;
}
//#endregion
//#region src/sqleasy/sqlite/sqlite_sqleasy.d.ts
declare class SqliteSqlEasy implements ISqlEasy<SqliteBuilder, SqliteJoinOnBuilder, SqliteMultiBuilder, SqliteParser> {
  private _sqliteConfiguration;
  constructor(rc?: RuntimeConfiguration);
  configuration: () => SqliteConfiguration;
  newBuilder: (rc?: RuntimeConfiguration) => SqliteBuilder;
  newMultiBuilder: (rc?: RuntimeConfiguration) => SqliteMultiBuilder;
}
//#endregion
export { BuilderType, ConfigurationDelimiters, CteState, DatabaseType, Datatype, DefaultBuilder, DefaultJoinOnBuilder, DefaultMultiBuilder, DefaultParser, FromState, GroupByState, HavingState, IBuilder, IConfiguration, IJoinOnBuilder, IMultiBuilder, IParser, ISqlEasy, InsertState, JoinOnOperator, JoinOnState, JoinOperator, JoinState, JoinType, MssqlBuilder, MssqlConfiguration, MssqlJoinOnBuilder, MssqlMultiBuilder, MssqlParser, MssqlSqlEasy, MultiBuilderTransactionState, MysqlBuilder, MysqlConfiguration, MysqlJoinOnBuilder, MysqlMultiBuilder, MysqlParser, MysqlSqlEasy, OrderByDirection, OrderByState, ParserArea, ParserError, ParserMode, PostgresBuilder, PostgresConfiguration, PostgresJoinOnBuilder, PostgresMultiBuilder, PostgresParser, PostgresSqlEasy, QueryType, RuntimeConfiguration, SelectState, SqlEasyState, SqlHelper, SqliteBuilder, SqliteConfiguration, SqliteJoinOnBuilder, SqliteMultiBuilder, SqliteParser, SqliteSqlEasy, ToSqlOptions, UnionState, UpdateState, WhereOperator, WhereState, defaultCte, defaultDelete, defaultFrom, defaultGroupBy, defaultHaving, defaultInsert, defaultJoin, defaultLimitOffset, defaultOrderBy, defaultSelect, defaultToSql, defaultUnion, defaultUpdate, defaultWhere };
//# sourceMappingURL=index.d.mts.map