declare class ConfigurationDelimiters {
    begin: string;
    end: string;
}

declare class RuntimeConfiguration {
    maxRowsReturned: number;
    customConfiguration: any | undefined;
}

declare enum DatabaseType {
    Mssql = 0,
    Postgres = 1,
    Mysql = 2,
    Sqlite = 3,
    Unknown = 4
}

interface IConfiguration {
    databaseType(): DatabaseType;
    defaultOwner(): string;
    identifierDelimiters(): ConfigurationDelimiters;
    preparedStatementPlaceholder(): string;
    runtimeConfiguration(): RuntimeConfiguration;
    stringDelimiter(): string;
    transactionDelimiters(): ConfigurationDelimiters;
}

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

declare enum OrderByDirection {
    Ascending = 0,
    Descending = 1,
    None = 2
}

declare enum WhereOperator {
    Equals = 0,
    NotEquals = 1,
    GreaterThan = 2,
    GreaterThanOrEquals = 3,
    LessThan = 4,
    LessThanOrEquals = 5,
    None = 6
}

declare enum MultiBuilderTransactionState {
    TransactionOn = 0,
    TransactionOff = 1,
    None = 2
}

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

declare class FromState {
    builderType: BuilderType;
    owner: string | undefined;
    tableName: string | undefined;
    alias: string | undefined;
    sqlEasyState: SqlEasyState | undefined;
    raw: string | undefined;
}

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

declare enum JoinOperator {
    Equals = 0,
    NotEquals = 1,
    GreaterThan = 2,
    GreaterThanOrEquals = 3,
    LessThan = 4,
    LessThanOrEquals = 5,
    None = 6
}

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

declare class OrderByState {
    builderType: BuilderType;
    tableNameOrAlias: string | undefined;
    columnName: string | undefined;
    direction: OrderByDirection;
    raw: string | undefined;
}

declare class SelectState {
    builderType: BuilderType;
    tableNameOrAlias: string | undefined;
    columnName: string | undefined;
    alias: string | undefined;
    sqlEasyState: SqlEasyState | undefined;
    raw: string | undefined;
}

declare class WhereState {
    builderType: BuilderType;
    tableNameOrAlias: string | undefined;
    columnName: string | undefined;
    whereOperator: WhereOperator;
    raw: string | undefined;
    sqlEasyState: SqlEasyState | undefined;
    values: any[];
}

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

interface IParser {
    toSql(state: SqlEasyState): string;
    toSqlMulti(states: SqlEasyState[], transactionState: MultiBuilderTransactionState): string;
    toSqlRaw(state: SqlEasyState): string;
    toSqlMultiRaw(states: SqlEasyState[], transactionState: MultiBuilderTransactionState): string;
}

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

declare enum Datatype {
    Boolean = 0,
    DateTime = 1,
    Number = 2,
    String = 3,
    Unknown = 4
}

declare enum ParserArea {
    Select = 0,
    From = 1,
    Join = 2,
    Where = 3,
    OrderBy = 4,
    LimitOffset = 5,
    General = 6
}

declare enum ParserMode {
    Raw = 0,
    Prepared = 1,
    None = 2
}

declare class ParserError extends Error {
    constructor(parserArea: ParserArea, message: string);
}

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

declare const defaultFrom: (state: SqlEasyState, config: IConfiguration, mode: ParserMode) => SqlHelper;

declare const defaultJoin: (state: SqlEasyState, config: IConfiguration, mode: ParserMode) => SqlHelper;

declare const defaultLimitOffset: (state: SqlEasyState, config: IConfiguration, mode: ParserMode) => SqlHelper;

declare const defaultOrderBy: (state: SqlEasyState, config: IConfiguration, mode: ParserMode) => SqlHelper;

declare abstract class DefaultParser {
    private _config;
    constructor(config: IConfiguration);
    abstract toSql(state: SqlEasyState): string;
    abstract toSqlMulti(states: SqlEasyState[], transactionState: MultiBuilderTransactionState): string;
    toSqlRaw: (state: SqlEasyState) => string;
    toSqlMultiRaw: (states: SqlEasyState[], transactionState: MultiBuilderTransactionState) => string;
}

declare const defaultSelect: (state: SqlEasyState, config: IConfiguration, mode: ParserMode) => SqlHelper;

declare const defaultToSql: (state: SqlEasyState | undefined, config: IConfiguration, mode: ParserMode) => SqlHelper;

declare const defaultWhere: (state: SqlEasyState, config: IConfiguration, mode: ParserMode) => SqlHelper;

interface ISqlEasy<T extends IBuilder<T, U, W>, U extends IJoinOnBuilder<U>, V extends IMultiBuilder<T, U, W>, W extends IParser> {
    configuration(): IConfiguration;
    newBuilder(rc?: RuntimeConfiguration): T;
    newMultiBuilder(rc?: RuntimeConfiguration): V;
}

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

declare class MssqlJoinOnBuilder extends DefaultJoinOnBuilder<MssqlJoinOnBuilder> {
    private _mssqlConfiguration;
    constructor(config: MssqlConfiguration);
    newJoinOnBuilder: () => MssqlJoinOnBuilder;
}

declare class MssqlParser extends DefaultParser {
    private _mssqlConfiguration;
    constructor(config: MssqlConfiguration);
    toSql: (state: SqlEasyState) => string;
    toSqlMulti: (_states: SqlEasyState[], _transactionState: MultiBuilderTransactionState) => string;
    private getParameterType;
}

declare class MssqlBuilder extends DefaultBuilder<MssqlBuilder, MssqlJoinOnBuilder, MssqlParser> {
    private _mssqlConfig;
    constructor(config: MssqlConfiguration);
    newBuilder: () => MssqlBuilder;
    newJoinOnBuilder: () => MssqlJoinOnBuilder;
    newParser: () => MssqlParser;
    clearTop: () => MssqlBuilder;
    top: (top: number) => MssqlBuilder;
}

declare class MssqlMultiBuilder extends DefaultMultiBuilder<MssqlBuilder, MssqlJoinOnBuilder, MssqlParser> {
    private _mssqlConfiguration;
    constructor(config: MssqlConfiguration);
    newBuilder: () => MssqlBuilder;
    newParser: () => MssqlParser;
}

declare class MssqlSqlEasy implements ISqlEasy<MssqlBuilder, MssqlJoinOnBuilder, MssqlMultiBuilder, MssqlParser> {
    private _mssqlConfiguration;
    constructor(rc?: RuntimeConfiguration);
    configuration: () => MssqlConfiguration;
    newBuilder: (rc?: RuntimeConfiguration) => MssqlBuilder;
    newMultiBuilder: (rc?: RuntimeConfiguration) => MssqlMultiBuilder;
}

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

declare class MysqlJoinOnBuilder extends DefaultJoinOnBuilder<MysqlJoinOnBuilder> {
    private _mysqlConfig;
    constructor(config: MysqlConfiguration);
    newJoinOnBuilder: () => MysqlJoinOnBuilder;
}

declare class MysqlParser extends DefaultParser {
    private _mysqlConfiguration;
    constructor(config: MysqlConfiguration);
    toSql: (_state: SqlEasyState) => string;
    toSqlMulti: (_states: SqlEasyState[], _transactionState: MultiBuilderTransactionState) => string;
}

declare class MysqlBuilder extends DefaultBuilder<MysqlBuilder, MysqlJoinOnBuilder, MysqlParser> {
    private _mysqlConfig;
    constructor(config: MysqlConfiguration);
    newBuilder: () => MysqlBuilder;
    newJoinOnBuilder: () => MysqlJoinOnBuilder;
    newParser: () => MysqlParser;
}

declare class MysqlMultiBuilder extends DefaultMultiBuilder<MysqlBuilder, MysqlJoinOnBuilder, MysqlParser> {
    private _mysqlConfig;
    constructor(config: MysqlConfiguration);
    newBuilder: () => MysqlBuilder;
    newParser: () => MysqlParser;
}

declare class MysqlSqlEasy implements ISqlEasy<MysqlBuilder, MysqlJoinOnBuilder, MysqlMultiBuilder, MysqlParser> {
    private _mssqlConfiguration;
    constructor(rc?: RuntimeConfiguration);
    configuration: () => MysqlConfiguration;
    newBuilder: (rc?: RuntimeConfiguration) => MysqlBuilder;
    newMultiBuilder: (rc?: RuntimeConfiguration) => MysqlMultiBuilder;
}

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

declare class PostgresJoinOnBuilder extends DefaultJoinOnBuilder<PostgresJoinOnBuilder> {
    private _postgresConfig;
    constructor(config: PostgresConfiguration);
    newJoinOnBuilder: () => PostgresJoinOnBuilder;
}

declare class PostgresParser extends DefaultParser {
    private _postgresConfiguration;
    constructor(config: PostgresConfiguration);
    toSql: (_state: SqlEasyState) => string;
    toSqlMulti: (_states: SqlEasyState[], _transactionState: MultiBuilderTransactionState) => string;
}

declare class PostgresBuilder extends DefaultBuilder<PostgresBuilder, PostgresJoinOnBuilder, PostgresParser> {
    private _postgresConfig;
    constructor(config: PostgresConfiguration);
    newBuilder: () => PostgresBuilder;
    newJoinOnBuilder: () => PostgresJoinOnBuilder;
    newParser: () => PostgresParser;
}

declare class PostgresMultiBuilder extends DefaultMultiBuilder<PostgresBuilder, PostgresJoinOnBuilder, PostgresParser> {
    private _postgresConfig;
    constructor(config: PostgresConfiguration);
    newBuilder: () => PostgresBuilder;
    newParser: () => PostgresParser;
}

declare class PostgresSqlEasy implements ISqlEasy<PostgresBuilder, PostgresJoinOnBuilder, PostgresMultiBuilder, PostgresParser> {
    private _postgresConfig;
    constructor(rc?: RuntimeConfiguration);
    configuration: () => PostgresConfiguration;
    newBuilder: (rc?: RuntimeConfiguration) => PostgresBuilder;
    newMultiBuilder: (rc?: RuntimeConfiguration) => PostgresMultiBuilder;
}

export { BuilderType, ConfigurationDelimiters, DatabaseType, Datatype, DefaultBuilder, DefaultJoinOnBuilder, DefaultMultiBuilder, DefaultParser, FromState, JoinOnOperator, JoinOnState, JoinOperator, JoinState, JoinType, MssqlBuilder, MssqlConfiguration, MssqlJoinOnBuilder, MssqlMultiBuilder, MssqlParser, MssqlSqlEasy, MultiBuilderTransactionState, MysqlBuilder, MysqlConfiguration, MysqlJoinOnBuilder, MysqlMultiBuilder, MysqlParser, MysqlSqlEasy, OrderByDirection, OrderByState, ParserArea, ParserError, ParserMode, PostgresBuilder, PostgresConfiguration, PostgresJoinOnBuilder, PostgresMultiBuilder, PostgresParser, PostgresSqlEasy, RuntimeConfiguration, SelectState, SqlEasyState, SqlHelper, WhereOperator, WhereState, defaultFrom, defaultJoin, defaultLimitOffset, defaultOrderBy, defaultSelect, defaultToSql, defaultWhere };
export type { IBuilder, IConfiguration, IJoinOnBuilder, IMultiBuilder, IParser, ISqlEasy };
