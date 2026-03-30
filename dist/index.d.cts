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
  JoinBuilder = 4,
  JoinRaw = 5,
  JoinTable = 6,
  None = 7,
  Or = 8,
  OrderByColumn = 9,
  OrderByRaw = 10,
  SelectAll = 11,
  SelectBuilder = 12,
  SelectColumn = 13,
  SelectRaw = 14,
  Where = 15,
  WhereBetween = 16,
  WhereGroupBegin = 17,
  WhereGroupBuilder = 18,
  WhereGroupEnd = 19,
  WhereExistsBuilder = 20,
  WhereInBuilder = 21,
  WhereInValues = 22,
  WhereNotExistsBuilder = 23,
  WhereNotInBuilder = 24,
  WhereNotInValues = 25,
  WhereNotNull = 26,
  WhereNull = 27,
  WhereRaw = 28
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
//#region src/state/sqleasy_state.d.ts
declare class SqlEasyState {
  builderName: string;
  fromStates: FromState[];
  joinStates: JoinState[];
  whereStates: WhereState[];
  orderByStates: OrderByState[];
  selectStates: SelectState[];
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
  newJoinOnBuilder(config: IConfiguration): T;
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
  clearJoin(): T;
  clearLimit(): T;
  clearOffset(): T;
  clearOrderBy(): T;
  clearSelect(): T;
  clearWhere(): T;
  distinct(): T;
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
  newBuilder(config: IConfiguration): T;
  newJoinOnBuilder(config: IConfiguration): U;
  newParser(config: IConfiguration): V;
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
  state(): SqlEasyState;
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
  abstract newBuilder(): T;
  abstract newJoinOnBuilder(): U;
  abstract newParser(): V;
  and: () => T;
  clearAll: () => T;
  clearFrom: () => T;
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
}
//#endregion
//#region src/builder/default_join_on_builder.d.ts
declare abstract class DefaultJoinOnBuilder<T extends IJoinOnBuilder<T>> implements IJoinOnBuilder<T> {
  private _states;
  private _config;
  constructor(config: IConfiguration);
  abstract newJoinOnBuilder(): T;
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
  Select = 0,
  From = 1,
  Join = 2,
  Where = 3,
  OrderBy = 4,
  LimitOffset = 5,
  General = 6
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
  addSqlSnippetWithValues: (sqlString: string, value: any) => void;
  clear: () => void;
  getSql: () => string;
  getSqlDebug: () => string;
  getValues: () => any[];
  getValueStringFromDataType: (value: any) => string;
}
//#endregion
//#region src/parser/default_from.d.ts
declare const defaultFrom: (state: SqlEasyState, config: IConfiguration, mode: ParserMode) => SqlHelper;
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
//#region src/parser/default_parser.d.ts
declare abstract class DefaultParser {
  private _config;
  constructor(config: IConfiguration);
  abstract toSql(state: SqlEasyState): string;
  abstract toSqlMulti(states: SqlEasyState[], transactionState: MultiBuilderTransactionState): string;
  toSqlRaw: (state: SqlEasyState) => string;
  toSqlMultiRaw: (states: SqlEasyState[], transactionState: MultiBuilderTransactionState) => string;
}
//#endregion
//#region src/parser/default_select.d.ts
declare const defaultSelect: (state: SqlEasyState, config: IConfiguration, mode: ParserMode) => SqlHelper;
//#endregion
//#region src/parser/default_to_sql.d.ts
declare const defaultToSql: (state: SqlEasyState | undefined, config: IConfiguration, mode: ParserMode) => SqlHelper;
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
  newJoinOnBuilder: () => MssqlJoinOnBuilder;
}
//#endregion
//#region src/sqleasy/mssql/mssql_parser.d.ts
declare class MssqlParser extends DefaultParser {
  private _mssqlConfiguration;
  constructor(config: MssqlConfiguration);
  toSql: (state: SqlEasyState) => string;
  toSqlMulti: (_states: SqlEasyState[], _transactionState: MultiBuilderTransactionState) => string;
  private getParameterType;
}
//#endregion
//#region src/sqleasy/mssql/mssql_builder.d.ts
declare class MssqlBuilder extends DefaultBuilder<MssqlBuilder, MssqlJoinOnBuilder, MssqlParser> {
  private _mssqlConfig;
  constructor(config: MssqlConfiguration);
  newBuilder: () => MssqlBuilder;
  newJoinOnBuilder: () => MssqlJoinOnBuilder;
  newParser: () => MssqlParser;
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
  newJoinOnBuilder: () => MysqlJoinOnBuilder;
}
//#endregion
//#region src/sqleasy/mysql/mysql_parser.d.ts
declare class MysqlParser extends DefaultParser {
  private _mysqlConfiguration;
  constructor(config: MysqlConfiguration);
  toSql: (_state: SqlEasyState) => string;
  toSqlMulti: (_states: SqlEasyState[], _transactionState: MultiBuilderTransactionState) => string;
}
//#endregion
//#region src/sqleasy/mysql/mysql_builder.d.ts
declare class MysqlBuilder extends DefaultBuilder<MysqlBuilder, MysqlJoinOnBuilder, MysqlParser> {
  private _mysqlConfig;
  constructor(config: MysqlConfiguration);
  newBuilder: () => MysqlBuilder;
  newJoinOnBuilder: () => MysqlJoinOnBuilder;
  newParser: () => MysqlParser;
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
  private _mssqlConfiguration;
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
  newJoinOnBuilder: () => PostgresJoinOnBuilder;
}
//#endregion
//#region src/sqleasy/postgres/postgres_parser.d.ts
declare class PostgresParser extends DefaultParser {
  private _postgresConfiguration;
  constructor(config: PostgresConfiguration);
  toSql: (_state: SqlEasyState) => string;
  toSqlMulti: (_states: SqlEasyState[], _transactionState: MultiBuilderTransactionState) => string;
}
//#endregion
//#region src/sqleasy/postgres/postgres_builder.d.ts
declare class PostgresBuilder extends DefaultBuilder<PostgresBuilder, PostgresJoinOnBuilder, PostgresParser> {
  private _postgresConfig;
  constructor(config: PostgresConfiguration);
  newBuilder: () => PostgresBuilder;
  newJoinOnBuilder: () => PostgresJoinOnBuilder;
  newParser: () => PostgresParser;
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
export { BuilderType, ConfigurationDelimiters, DatabaseType, Datatype, DefaultBuilder, DefaultJoinOnBuilder, DefaultMultiBuilder, DefaultParser, FromState, IBuilder, IConfiguration, IJoinOnBuilder, IMultiBuilder, IParser, ISqlEasy, JoinOnOperator, JoinOnState, JoinOperator, JoinState, JoinType, MssqlBuilder, MssqlConfiguration, MssqlJoinOnBuilder, MssqlMultiBuilder, MssqlParser, MssqlSqlEasy, MultiBuilderTransactionState, MysqlBuilder, MysqlConfiguration, MysqlJoinOnBuilder, MysqlMultiBuilder, MysqlParser, MysqlSqlEasy, OrderByDirection, OrderByState, ParserArea, ParserError, ParserMode, PostgresBuilder, PostgresConfiguration, PostgresJoinOnBuilder, PostgresMultiBuilder, PostgresParser, PostgresSqlEasy, RuntimeConfiguration, SelectState, SqlEasyState, SqlHelper, WhereOperator, WhereState, defaultFrom, defaultJoin, defaultLimitOffset, defaultOrderBy, defaultSelect, defaultToSql, defaultWhere };
//# sourceMappingURL=index.d.cts.map