import type { Dialect } from '../configuration/configuration';
import { BuilderType } from '../enums/builder-type';
import { CallKind } from '../enums/call-kind';
import { CallParamDirection } from '../enums/call-param-direction';
import { CallReturnIntent } from '../enums/call-return-intent';
import { FullTextMode } from '../enums/full-text-mode';
import { HintKind } from '../enums/hint-kind';
import { JsonExtractMode } from '../enums/json-extract-mode';
import { ParserArea } from '../enums/parser-area';
import { JoinType } from '../enums/join-type';
import { NullsOrder } from '../enums/nulls-order';
import { OrderByDirection } from '../enums/order-by-direction';
import { QueryType } from '../enums/query-type';
import { RowLockMode } from '../enums/row-lock-mode';
import { RowLockWait } from '../enums/row-lock-wait';
import { UpsertAction } from '../enums/upsert-action';
import { WhereOperator } from '../enums/where-operator';
import { ParserError } from '../helpers/parser-error';
import type { PreparedSql } from '../parser/to-sql';
import { parse, parsePrepared, parseRaw } from '../parser/to-sql';
import type { CallState } from '../state/call';
import { createInsertState } from '../state/insert';
import { createQueryState, type QueryState } from '../state/query';
import { JoinOnBuilder } from './join-on';
import { WindowBuilder } from './window';

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
export class QueryBuilder {
  #state: QueryState = createQueryState();
  #config: Dialect;
  /** Where `and()` / `or()` append — flips when WHERE vs HAVING predicates are added. */
  #combinatorTarget: 'where' | 'having' = 'where';

  constructor(config: Dialect) {
    this.#config = config;
  }

  /** A fresh builder sharing this builder's dialect — the parent of every subquery. */
  #child = (): QueryBuilder => new QueryBuilder(this.#config);

  #pushCombinator = (builderType: typeof BuilderType.And | typeof BuilderType.Or): this => {
    if (this.#combinatorTarget === 'having') {
      this.#state.havingStates.push({
        builderType,
        tableNameOrAlias: undefined,
        columnName: undefined,
        whereOperator: WhereOperator.None,
        raw: undefined,
        subquery: undefined,
        values: [],
      });
      return this;
    }

    this.#state.whereStates.push({
      builderType,
      tableNameOrAlias: undefined,
      columnName: undefined,
      whereOperator: WhereOperator.None,
      raw: undefined,
      subquery: undefined,
      values: [],
    });

    return this;
  };

  /** Returns the dialect configuration backing this builder. */
  public configuration = (): Dialect => {
    return this.#config;
  };

  public and = (): this => this.#pushCombinator(BuilderType.And);

  public or = (): this => this.#pushCombinator(BuilderType.Or);

  public clearAll = (): this => {
    this.#state = createQueryState();
    this.#combinatorTarget = 'where';
    return this;
  };

  public clearFrom = (): this => {
    this.#state.fromStates = [];
    return this;
  };

  public clearGroupBy = (): this => {
    this.#state.groupByStates = [];
    return this;
  };

  public clearHaving = (): this => {
    this.#state.havingStates = [];
    this.#combinatorTarget = 'where';
    return this;
  };

  public clearJoin = (): this => {
    this.#state.joinStates = [];
    return this;
  };

  public clearLimit = (): this => {
    this.#state.limit = 0;
    this.#state.limitWithTies = false;
    return this;
  };

  public clearOffset = (): this => {
    this.#state.offset = 0;
    return this;
  };

  public clearOrderBy = (): this => {
    this.#state.orderByStates = [];
    return this;
  };

  public clearSelect = (): this => {
    this.#state.selectStates = [];
    this.#state.distinct = false;
    this.#state.distinctOnColumns = undefined;
    return this;
  };

  public clearDistinct = (): this => {
    this.#state.distinct = false;
    return this;
  };

  /**
   * Postgres-only `DISTINCT ON (...)`: keeps only the first row (per the query's `ORDER BY`)
   * for each distinct combination of the given columns. Mutually exclusive with {@link distinct}
   * — combining them throws at parse time. Throws on every other dialect, which has no equivalent.
   */
  public distinctOn = (columns: { tableNameOrAlias: string; columnName: string }[]): this => {
    this.#state.distinctOnColumns = columns.map((column) => ({
      tableNameOrAlias: column.tableNameOrAlias,
      columnName: column.columnName,
    }));
    return this;
  };

  public clearDistinctOn = (): this => {
    this.#state.distinctOnColumns = undefined;
    return this;
  };

  public clearWhere = (): this => {
    this.#state.whereStates = [];
    return this;
  };

  public clearCte = (): this => {
    this.#state.cteStates = [];
    return this;
  };

  public clearUnion = (): this => {
    this.#state.unionStates = [];
    return this;
  };

  public clearInsert = (): this => {
    this.#state.insertState = undefined;
    this.#state.upsertState = undefined;
    if (this.#state.queryType === QueryType.Insert) {
      this.#state.queryType = QueryType.Select;
    }
    return this;
  };

  public clearUpdate = (): this => {
    this.#state.updateStates = [];
    this.#clearMutationTarget();
    if (this.#state.queryType === QueryType.Update) {
      this.#state.queryType = QueryType.Select;
    }
    return this;
  };

  /** Clears the DELETE target table and resets sticky Delete query type. */
  public clearDelete = (): this => {
    this.#clearMutationTarget();
    if (this.#state.queryType === QueryType.Delete) {
      this.#state.queryType = QueryType.Select;
    }
    return this;
  };

  #clearMutationTarget = (): void => {
    if (this.#state.mutationTargetIndex !== undefined) {
      this.#state.fromStates.splice(this.#state.mutationTargetIndex, 1);
      this.#state.mutationTargetIndex = undefined;
    }
  };

  #markSelectQuery = (): void => {
    if (
      this.#state.queryType === QueryType.Delete ||
      this.#state.queryType === QueryType.Update ||
      this.#state.queryType === QueryType.Insert ||
      this.#state.queryType === QueryType.Call
    ) {
      this.#state.queryType = QueryType.Select;
      this.#state.mutationTargetIndex = undefined;
    }
  };

  public distinct = (): this => {
    this.#state.distinct = true;
    return this;
  };

  public fromRaw = (rawFrom: string): this => {
    this.#state.fromStates.push({
      builderType: BuilderType.FromRaw,
      owner: undefined,
      tableName: undefined,
      alias: undefined,
      subquery: undefined,
      raw: rawFrom,
    });
    return this;
  };

  public fromRaws = (rawFroms: string[]): this => {
    rawFroms.forEach((rawFrom) => {
      this.fromRaw(rawFrom);
    });
    return this;
  };

  public fromTable = (tableName: string, alias: string): this => {
    this.#state.fromStates.push({
      builderType: BuilderType.FromTable,
      owner: this.#config.defaultOwner,
      tableName: tableName,
      alias: alias,
      subquery: undefined,
      raw: undefined,
    });
    return this;
  };

  public fromTables = (tables: { tableName: string; alias: string }[]): this => {
    tables.forEach((table) => {
      this.fromTable(table.tableName, table.alias);
    });
    return this;
  };

  public fromTableWithOwner = (owner: string, tableName: string, alias: string): this => {
    this.#state.fromStates.push({
      builderType: BuilderType.FromTable,
      owner: owner,
      tableName: tableName,
      alias: alias,
      subquery: undefined,
      raw: undefined,
    });
    return this;
  };

  public fromTablesWithOwner = (
    tables: { owner: string; tableName: string; alias: string }[],
  ): this => {
    tables.forEach((table) => {
      this.fromTableWithOwner(table.owner, table.tableName, table.alias);
    });
    return this;
  };

  public fromWithBuilder = (alias: string, builder: (builder: QueryBuilder) => void): this => {
    const child = this.#child();
    builder(child);
    child.state().isInnerStatement = true;

    this.#state.fromStates.push({
      builderType: BuilderType.FromBuilder,
      owner: undefined,
      tableName: undefined,
      alias: alias,
      subquery: child.state(),
      raw: undefined,
    });

    return this;
  };

  /** Postgres/MySQL `FROM LATERAL (subquery) AS alias`. MSSQL/SQLite throw — use APPLY on MSSQL. */
  public fromLateral = (alias: string, builder: (builder: QueryBuilder) => void): this => {
    const child = this.#child();
    builder(child);
    child.state().isInnerStatement = true;

    this.#state.fromStates.push({
      builderType: BuilderType.FromLateral,
      owner: undefined,
      tableName: undefined,
      alias: alias,
      subquery: child.state(),
      raw: undefined,
      functionName: undefined,
      functionParams: undefined,
    });

    return this;
  };

  /**
   * Table-valued / set-returning function in the FROM clause (`FROM fn(...) AS alias`).
   * Dialect-specific: Postgres/MSSQL TVFs, SQLite helpers like `json_each`.
   */
  public fromTableFunction = (
    functionName: string,
    alias: string,
    params: any[] = [],
  ): this => {
    this.#state.fromStates.push({
      builderType: BuilderType.FromFunction,
      owner: this.#config.defaultOwner,
      tableName: undefined,
      alias: alias,
      subquery: undefined,
      raw: undefined,
      functionName: functionName,
      functionParams: [...params],
    });

    return this;
  };

  /** {@link fromTableFunction} with an explicit schema/owner qualifier. */
  public fromTableFunctionWithOwner = (
    owner: string,
    functionName: string,
    alias: string,
    params: any[] = [],
  ): this => {
    this.#state.fromStates.push({
      builderType: BuilderType.FromFunction,
      owner: owner,
      tableName: undefined,
      alias: alias,
      subquery: undefined,
      raw: undefined,
      functionName: functionName,
      functionParams: [...params],
    });

    return this;
  };

  /** Raw-SQL table source when structured TVF helpers are insufficient. */
  public fromFunctionRaw = (rawFrom: string, alias: string): this => {
    this.#state.fromStates.push({
      builderType: BuilderType.FromRaw,
      owner: undefined,
      tableName: undefined,
      alias: alias,
      subquery: undefined,
      raw: rawFrom,
      functionName: undefined,
      functionParams: undefined,
    });

    return this;
  };

  public joinRaw = (rawJoin: string): this => {
    this.#state.joinStates.push({
      builderType: BuilderType.JoinRaw,
      joinType: JoinType.None,
      owner: undefined,
      tableName: undefined,
      alias: undefined,
      subquery: undefined,
      raw: rawJoin,
      joinOnStates: [],
    });

    return this;
  };

  public joinRaws = (rawJoins: string[]): this => {
    rawJoins.forEach((rawJoin) => {
      this.joinRaw(rawJoin);
    });

    return this;
  };

  public joinTable = (
    joinType: JoinType,
    tableName: string,
    alias: string,
    joinOnBuilder: (joinOnBuilder: JoinOnBuilder) => void,
  ): this => {
    const joinOnBuilderInstance = new JoinOnBuilder(this.#config);
    joinOnBuilder(joinOnBuilderInstance);

    this.#state.joinStates.push({
      builderType: BuilderType.JoinTable,
      joinType: joinType,
      owner: this.#config.defaultOwner,
      tableName: tableName,
      alias: alias,
      subquery: undefined,
      raw: undefined,
      joinOnStates: joinOnBuilderInstance.states(),
    });

    return this;
  };

  public joinTables = (
    joins: {
      joinType: JoinType;
      tableName: string;
      alias: string;
      joinOnBuilder: (joinOnBuilder: JoinOnBuilder) => void;
    }[],
  ): this => {
    for (const join of joins) {
      this.joinTable(join.joinType, join.tableName, join.alias, join.joinOnBuilder);
    }
    return this;
  };

  public joinTablesWithOwner = (
    joins: {
      joinType: JoinType;
      owner: string;
      tableName: string;
      alias: string;
      joinOnBuilder: (joinOnBuilder: JoinOnBuilder) => void;
    }[],
  ): this => {
    for (const join of joins) {
      this.joinTableWithOwner(
        join.joinType,
        join.owner,
        join.tableName,
        join.alias,
        join.joinOnBuilder,
      );
    }
    return this;
  };

  public joinTableWithOwner = (
    joinType: JoinType,
    owner: string,
    tableName: string,
    alias: string,
    joinOnBuilder: (joinOnBuilder: JoinOnBuilder) => void,
  ): this => {
    const joinOnBuilderInstance = new JoinOnBuilder(this.#config);
    joinOnBuilder(joinOnBuilderInstance);

    this.#state.joinStates.push({
      builderType: BuilderType.JoinTable,
      joinType: joinType,
      owner: owner,
      tableName: tableName,
      alias: alias,
      subquery: undefined,
      raw: undefined,
      joinOnStates: joinOnBuilderInstance.states(),
    });

    return this;
  };

  public joinWithBuilder = (
    joinType: JoinType,
    alias: string,
    builder: (builder: QueryBuilder) => void,
    joinOnBuilder: (joinOnBuilder: JoinOnBuilder) => void,
  ): this => {
    const child = this.#child();

    builder(child);
    child.state().isInnerStatement = true;

    const newJoinOnBuilder = new JoinOnBuilder(this.#config);
    joinOnBuilder(newJoinOnBuilder);

    this.#state.joinStates.push({
      builderType: BuilderType.JoinBuilder,
      joinType: joinType,
      owner: undefined,
      tableName: undefined,
      alias: alias,
      subquery: child.state(),
      raw: undefined,
      joinOnStates: newJoinOnBuilder.states(),
    });

    return this;
  };

  /** MSSQL `CROSS APPLY` / Postgres+MySQL `CROSS JOIN LATERAL`. SQLite throws. */
  public joinCrossApply = (
    alias: string,
    builder: (builder: QueryBuilder) => void,
    joinOnBuilder?: (joinOnBuilder: JoinOnBuilder) => void,
  ): this => {
    return this.#joinApply(JoinType.CrossApply, alias, builder, joinOnBuilder);
  };

  /** MSSQL `OUTER APPLY` / Postgres+MySQL `LEFT JOIN LATERAL`. SQLite throws. */
  public joinOuterApply = (
    alias: string,
    builder: (builder: QueryBuilder) => void,
    joinOnBuilder?: (joinOnBuilder: JoinOnBuilder) => void,
  ): this => {
    return this.#joinApply(JoinType.OuterApply, alias, builder, joinOnBuilder);
  };

  /** Postgres/MySQL `JOIN LATERAL (subquery) AS alias ON ...`. MSSQL/SQLite throw. */
  public joinLateral = (
    alias: string,
    builder: (builder: QueryBuilder) => void,
    joinOnBuilder: (joinOnBuilder: JoinOnBuilder) => void,
  ): this => {
    return this.#joinApply(JoinType.Lateral, alias, builder, joinOnBuilder);
  };

  #joinApply = (
    joinType: typeof JoinType.CrossApply | typeof JoinType.OuterApply | typeof JoinType.Lateral,
    alias: string,
    builder: (builder: QueryBuilder) => void,
    joinOnBuilder?: (joinOnBuilder: JoinOnBuilder) => void,
  ): this => {
    const child = this.#child();
    builder(child);
    child.state().isInnerStatement = true;

    const joinOnBuilderInstance = new JoinOnBuilder(this.#config);
    if (joinOnBuilder) {
      joinOnBuilder(joinOnBuilderInstance);
    }

    this.#state.joinStates.push({
      builderType: BuilderType.JoinBuilder,
      joinType: joinType,
      owner: undefined,
      tableName: undefined,
      alias: alias,
      subquery: child.state(),
      raw: undefined,
      joinOnStates: joinOnBuilderInstance.states(),
    });

    return this;
  };

  public limit = (limit: number): this => {
    if (!Number.isFinite(limit) || limit <= 0 || !Number.isInteger(limit)) {
      throw new ParserError(ParserArea.LimitOffset, 'LIMIT must be a positive integer');
    }
    this.#state.limit = limit;
    return this;
  };

  /**
   * Limits rows and includes tied rows at the cutoff (`FETCH FIRST n ROWS WITH TIES` and dialect
   * equivalents). Requires `ORDER BY` under the same rules as {@link limit}.
   */
  public limitWithTies = (limit: number): this => {
    this.limit(limit);
    this.#state.limitWithTies = true;
    return this;
  };

  public clearLimitWithTies = (): this => {
    this.#state.limitWithTies = false;
    return this;
  };

  public offset = (offset: number): this => {
    this.#state.offset = offset;
    return this;
  };

  public orderByColumn = (
    tableNameOrAlias: string,
    columnName: string,
    direction: OrderByDirection,
    nulls: NullsOrder = NullsOrder.None,
  ): this => {
    this.#state.orderByStates.push({
      builderType: BuilderType.OrderByColumn,
      tableNameOrAlias: tableNameOrAlias,
      columnName: columnName,
      direction: direction,
      nulls: nulls,
      raw: undefined,
    });

    return this;
  };

  public orderByColumns = (
    columns: {
      tableNameOrAlias: string;
      columnName: string;
      direction: OrderByDirection;
      nulls?: NullsOrder;
    }[],
  ): this => {
    columns.forEach((column) => {
      this.orderByColumn(
        column.tableNameOrAlias,
        column.columnName,
        column.direction,
        column.nulls ?? NullsOrder.None,
      );
    });

    return this;
  };

  public orderByRaw = (rawOrderBy: string): this => {
    this.#state.orderByStates.push({
      builderType: BuilderType.OrderByRaw,
      tableNameOrAlias: undefined,
      columnName: undefined,
      direction: OrderByDirection.Ascending,
      nulls: NullsOrder.None,
      raw: rawOrderBy,
    });

    return this;
  };

  public orderByRaws = (rawOrderBys: string[]): this => {
    rawOrderBys.forEach((rawOrderBy) => {
      this.orderByRaw(rawOrderBy);
    });

    return this;
  };

  /** DEBUG / TEST rendering (placeholders as text). NOT execution-safe — run {@link parsePrepared}. */
  public parse = (): string => {
    return parse(this.state(), this.#config);
  };

  /** The ONLY execution-safe render: parameterized SQL + ordered bound values. Use this to run. */
  public parsePrepared = (): PreparedSql => {
    return parsePrepared(this.state(), this.#config);
  };

  /** DEBUG / TEST rendering with values inlined UNQUOTED. NOT execution-safe — run {@link parsePrepared}. */
  public parseRaw = (): string => {
    return parseRaw(this.state(), this.#config);
  };

  public selectAll = (): this => {
    this.#markSelectQuery();
    this.#state.selectStates.push({
      builderType: BuilderType.SelectAll,
      tableNameOrAlias: undefined,
      columnName: undefined,
      alias: undefined,
      subquery: undefined,
      raw: undefined,
      window: undefined,
    });

    return this;
  };

  public selectColumn = (
    tableNameOrAlias: string,
    columnName: string,
    columnAlias: string,
  ): this => {
    this.#markSelectQuery();
    this.#state.selectStates.push({
      builderType: BuilderType.SelectColumn,
      tableNameOrAlias: tableNameOrAlias,
      columnName: columnName,
      alias: columnAlias,
      subquery: undefined,
      raw: undefined,
      window: undefined,
    });

    return this;
  };

  public selectColumns = (
    columns: {
      tableNameOrAlias: string;
      columnName: string;
      columnAlias: string;
    }[],
  ): this => {
    columns.forEach((column) => {
      this.selectColumn(column.tableNameOrAlias, column.columnName, column.columnAlias);
    });

    return this;
  };

  public selectRaw = (rawSelect: string): this => {
    this.#markSelectQuery();
    this.#state.selectStates.push({
      builderType: BuilderType.SelectRaw,
      tableNameOrAlias: undefined,
      columnName: undefined,
      alias: undefined,
      subquery: undefined,
      raw: rawSelect,
      window: undefined,
    });

    return this;
  };

  public selectRaws = (rawSelects: string[]): this => {
    rawSelects.forEach((rawSelect) => {
      this.selectRaw(rawSelect);
    });

    return this;
  };

  public selectWithBuilder = (alias: string, builder: (builder: QueryBuilder) => void): this => {
    this.#markSelectQuery();
    const child = this.#child();

    builder(child);
    child.state().isInnerStatement = true;

    this.#state.selectStates.push({
      builderType: BuilderType.SelectBuilder,
      tableNameOrAlias: undefined,
      columnName: undefined,
      alias: alias,
      subquery: child.state(),
      raw: undefined,
      window: undefined,
    });

    return this;
  };

  /**
   * Adds a window function to the SELECT list: `fn OVER (...)`. `fn` is the function's call
   * expression, emitted verbatim (e.g. `'ROW_NUMBER()'`, `'SUM("o"."amount")'`) — like
   * {@link selectRaw}, it is not quoted/escaped, so quote any identifiers inside it yourself.
   * The `OVER` clause itself (`PARTITION BY`/`ORDER BY`/frame) is structured, via {@link WindowBuilder}.
   */
  public selectWindow = (
    fn: string,
    over: (builder: WindowBuilder) => void,
    alias: string,
  ): this => {
    this.#markSelectQuery();
    const windowBuilder = new WindowBuilder();
    over(windowBuilder);

    this.#state.selectStates.push({
      builderType: BuilderType.SelectWindow,
      tableNameOrAlias: undefined,
      columnName: undefined,
      alias: alias,
      subquery: undefined,
      raw: fn,
      window: windowBuilder.state(),
    });

    return this;
  };

  /**
   * Dialect-aware JSON path extraction in the SELECT list (`->`/`->>`/`JSON_EXTRACT`/`JSON_VALUE`).
   */
  public selectJsonExtract = (
    tableNameOrAlias: string,
    columnName: string,
    path: string,
    mode: JsonExtractMode = JsonExtractMode.Text,
    alias: string = '',
  ): this => {
    this.#markSelectQuery();
    this.#state.selectStates.push({
      builderType: BuilderType.SelectJsonExtract,
      tableNameOrAlias: tableNameOrAlias,
      columnName: columnName,
      alias: alias,
      subquery: undefined,
      raw: undefined,
      window: undefined,
      jsonPath: path,
      jsonExtractMode: mode,
    });

    return this;
  };

  public state = (): QueryState => {
    return this.#state;
  };

  public where = (
    tableNameOrAlias: string,
    columnName: string,
    whereOperator: WhereOperator,
    value: any,
  ): this => {
    this.#combinatorTarget = 'where';
    this.#state.whereStates.push({
      builderType: BuilderType.Where,
      tableNameOrAlias: tableNameOrAlias,
      columnName: columnName,
      whereOperator: whereOperator,
      raw: undefined,
      subquery: undefined,
      values: [value],
    });

    return this;
  };

  public whereBetween = (
    tableNameOrAlias: string,
    columnName: string,
    value1: any,
    value2: any,
  ): this => {
    this.#combinatorTarget = 'where';
    this.#state.whereStates.push({
      builderType: BuilderType.WhereBetween,
      tableNameOrAlias: tableNameOrAlias,
      columnName: columnName,
      whereOperator: WhereOperator.Equals,
      raw: undefined,
      subquery: undefined,
      values: [value1, value2],
    });

    return this;
  };

  /**
   * @param tableNameOrAlias - Unused: `EXISTS (subquery)` never references the outer column.
   *   Kept for wire parity with the golden corpus; prefer {@link whereExists} in new code.
   * @param columnName - Unused; see `tableNameOrAlias`.
   */
  public whereExistsWithBuilder = (
    tableNameOrAlias: string,
    columnName: string,
    builder: (builder: QueryBuilder) => void,
  ): this => {
    this.#combinatorTarget = 'where';
    const child = this.#child();
    builder(child);
    child.state().isInnerStatement = true;

    this.#state.whereStates.push({
      builderType: BuilderType.WhereExistsBuilder,
      tableNameOrAlias: tableNameOrAlias,
      columnName: columnName,
      whereOperator: WhereOperator.None,
      raw: undefined,
      subquery: child.state(),
      values: [],
    });

    return this;
  };

  /** `WHERE EXISTS (subquery)` — the same clause as {@link whereExistsWithBuilder} without its unused table/column parameters. */
  public whereExists = (builder: (builder: QueryBuilder) => void): this => {
    this.#combinatorTarget = 'where';
    const child = this.#child();
    builder(child);
    child.state().isInnerStatement = true;

    this.#state.whereStates.push({
      builderType: BuilderType.WhereExistsBuilder,
      tableNameOrAlias: undefined,
      columnName: undefined,
      whereOperator: WhereOperator.None,
      raw: undefined,
      subquery: child.state(),
      values: [],
    });

    return this;
  };

  public whereGroup(builder: (builder: QueryBuilder) => void): this {
    this.#combinatorTarget = 'where';
    this.#state.whereStates.push({
      builderType: BuilderType.WhereGroupBegin,
      tableNameOrAlias: undefined,
      columnName: undefined,
      whereOperator: WhereOperator.None,
      raw: undefined,
      values: [],
      subquery: undefined,
    });

    const child = this.#child();
    builder(child);
    child.state().isInnerStatement = true;

    if (child.state().whereStates.length === 0) {
      throw new ParserError(ParserArea.Where, 'WHERE group cannot be empty');
    }

    this.#state.whereStates.push({
      builderType: BuilderType.WhereGroupBuilder,
      tableNameOrAlias: undefined,
      columnName: undefined,
      whereOperator: WhereOperator.None,
      raw: undefined,
      values: [],
      subquery: child.state(),
    });

    this.#state.whereStates.push({
      builderType: BuilderType.WhereGroupEnd,
      tableNameOrAlias: '',
      columnName: '',
      whereOperator: WhereOperator.None,
      raw: '',
      values: [],
      subquery: child.state(),
    });

    return this;
  }

  public whereInWithBuilder = (
    tableNameOrAlias: string,
    columnName: string,
    builder: (builder: QueryBuilder) => void,
  ): this => {
    this.#combinatorTarget = 'where';
    const child = this.#child();
    builder(child);
    child.state().isInnerStatement = true;

    this.#state.whereStates.push({
      builderType: BuilderType.WhereInBuilder,
      tableNameOrAlias: tableNameOrAlias,
      columnName: columnName,
      whereOperator: WhereOperator.None,
      raw: undefined,
      subquery: child.state(),
      values: [],
    });

    return this;
  };

  public whereInValues = (tableNameOrAlias: string, columnName: string, values: any[]): this => {
    this.#combinatorTarget = 'where';
    values = [...values];
    this.#state.whereStates.push({
      builderType: BuilderType.WhereInValues,
      tableNameOrAlias: tableNameOrAlias,
      columnName: columnName,
      whereOperator: WhereOperator.None,
      raw: undefined,
      subquery: undefined,
      values: values,
    });

    return this;
  };

  /**
   * @param tableNameOrAlias - Unused: `NOT EXISTS (subquery)` never references the outer column.
   *   Kept for wire parity with the golden corpus; prefer {@link whereNotExists} in new code.
   * @param columnName - Unused; see `tableNameOrAlias`.
   */
  public whereNotExistsWithBuilder = (
    tableNameOrAlias: string,
    columnName: string,
    builder: (builder: QueryBuilder) => void,
  ): this => {
    this.#combinatorTarget = 'where';
    const child = this.#child();
    builder(child);
    child.state().isInnerStatement = true;

    this.#state.whereStates.push({
      builderType: BuilderType.WhereNotExistsBuilder,
      tableNameOrAlias: tableNameOrAlias,
      columnName: columnName,
      whereOperator: WhereOperator.None,
      raw: undefined,
      subquery: child.state(),
      values: [],
    });

    return this;
  };

  /** `WHERE NOT EXISTS (subquery)` — the same clause as {@link whereNotExistsWithBuilder} without its unused table/column parameters. */
  public whereNotExists = (builder: (builder: QueryBuilder) => void): this => {
    this.#combinatorTarget = 'where';
    const child = this.#child();
    builder(child);
    child.state().isInnerStatement = true;

    this.#state.whereStates.push({
      builderType: BuilderType.WhereNotExistsBuilder,
      tableNameOrAlias: undefined,
      columnName: undefined,
      whereOperator: WhereOperator.None,
      raw: undefined,
      subquery: child.state(),
      values: [],
    });

    return this;
  };

  public whereNotInWithBuilder = (
    tableNameOrAlias: string,
    columnName: string,
    builder: (builder: QueryBuilder) => void,
  ): this => {
    this.#combinatorTarget = 'where';
    const child = this.#child();
    builder(child);
    child.state().isInnerStatement = true;

    this.#state.whereStates.push({
      builderType: BuilderType.WhereNotInBuilder,
      tableNameOrAlias: tableNameOrAlias,
      columnName: columnName,
      whereOperator: WhereOperator.None,
      raw: undefined,
      subquery: child.state(),
      values: [],
    });

    return this;
  };

  public whereNotInValues = (tableNameOrAlias: string, columnName: string, values: any[]): this => {
    this.#combinatorTarget = 'where';
    values = [...values];
    this.#state.whereStates.push({
      builderType: BuilderType.WhereNotInValues,
      tableNameOrAlias: tableNameOrAlias,
      columnName: columnName,
      whereOperator: WhereOperator.None,
      raw: undefined,
      subquery: undefined,
      values: values,
    });

    return this;
  };

  public whereNotNull = (tableNameOrAlias: string, columnName: string): this => {
    this.#combinatorTarget = 'where';
    this.#state.whereStates.push({
      builderType: BuilderType.WhereNotNull,
      tableNameOrAlias: tableNameOrAlias,
      columnName: columnName,
      whereOperator: WhereOperator.None,
      raw: undefined,
      subquery: undefined,
      values: [],
    });

    return this;
  };

  public whereNull = (tableNameOrAlias: string, columnName: string): this => {
    this.#combinatorTarget = 'where';
    this.#state.whereStates.push({
      builderType: BuilderType.WhereNull,
      tableNameOrAlias: tableNameOrAlias,
      columnName: columnName,
      whereOperator: WhereOperator.None,
      raw: undefined,
      subquery: undefined,
      values: [],
    });

    return this;
  };

  public whereRaw = (rawWhere: string): this => {
    this.#combinatorTarget = 'where';
    this.#state.whereStates.push({
      builderType: BuilderType.WhereRaw,
      tableNameOrAlias: undefined,
      columnName: undefined,
      whereOperator: WhereOperator.None,
      raw: rawWhere,
      subquery: undefined,
      values: [],
    });

    return this;
  };

  public whereRaws = (rawWheres: string[]): this => {
    rawWheres.forEach((rawWhere) => {
      this.whereRaw(rawWhere);
    });

    return this;
  };

  /** Compare a dialect-specific JSON path extraction against a bound value. */
  public whereJsonExtract = (
    tableNameOrAlias: string,
    columnName: string,
    path: string,
    mode: JsonExtractMode,
    whereOperator: WhereOperator,
    value: any,
  ): this => {
    this.#combinatorTarget = 'where';
    this.#state.whereStates.push({
      builderType: BuilderType.WhereJsonExtract,
      tableNameOrAlias,
      columnName,
      whereOperator,
      raw: undefined,
      subquery: undefined,
      values: [value],
      jsonPath: path,
      jsonExtractMode: mode,
      fullTextMode: undefined,
      fullTextColumns: undefined,
    });
    return this;
  };

  /** JSON containment (`@>` / `JSON_CONTAINS`) against a bound JSON document. */
  public whereJsonContains = (tableNameOrAlias: string, columnName: string, value: any): this => {
    this.#combinatorTarget = 'where';
    this.#state.whereStates.push({
      builderType: BuilderType.WhereJsonContains,
      tableNameOrAlias,
      columnName,
      whereOperator: WhereOperator.None,
      raw: undefined,
      subquery: undefined,
      values: [value],
      jsonPath: undefined,
      jsonExtractMode: undefined,
      fullTextMode: undefined,
      fullTextColumns: undefined,
    });
    return this;
  };

  /** Dialect-aware full-text predicate over one or more columns. */
  public whereMatch = (
    columns: { tableNameOrAlias: string; columnName: string }[],
    query: string,
    mode: FullTextMode = FullTextMode.Natural,
  ): this => {
    this.#combinatorTarget = 'where';
    this.#state.whereStates.push({
      builderType: BuilderType.WhereFullText,
      tableNameOrAlias: undefined,
      columnName: undefined,
      whereOperator: WhereOperator.None,
      raw: undefined,
      subquery: undefined,
      values: [query],
      jsonPath: undefined,
      jsonExtractMode: undefined,
      fullTextMode: mode,
      fullTextColumns: columns.map((column) => ({
        tableNameOrAlias: column.tableNameOrAlias,
        columnName: column.columnName,
      })),
    });
    return this;
  };

  /** Raw full-text SQL when structured {@link whereMatch} cannot express the predicate. */
  public whereMatchRaw = (rawWhere: string): this => this.whereRaw(rawWhere);

  public groupByColumn = (tableNameOrAlias: string, columnName: string): this => {
    this.#state.groupByStates.push({
      builderType: BuilderType.GroupByColumn,
      tableNameOrAlias: tableNameOrAlias,
      columnName: columnName,
      raw: undefined,
      groupingSets: undefined,
    });

    return this;
  };

  public groupByColumns = (columns: { tableNameOrAlias: string; columnName: string }[]): this => {
    columns.forEach((column) => {
      this.groupByColumn(column.tableNameOrAlias, column.columnName);
    });

    return this;
  };

  public groupByRaw = (rawGroupBy: string): this => {
    this.#state.groupByStates.push({
      builderType: BuilderType.GroupByRaw,
      tableNameOrAlias: undefined,
      columnName: undefined,
      raw: rawGroupBy,
      groupingSets: undefined,
    });

    return this;
  };

  public groupByRaws = (rawGroupBys: string[]): this => {
    rawGroupBys.forEach((rawGroupBy) => {
      this.groupByRaw(rawGroupBy);
    });

    return this;
  };

  /** `GROUP BY ROLLUP (...)` (MySQL: trailing `WITH ROLLUP` when columns were already grouped). */
  public groupByRollup = (
    columns: { tableNameOrAlias: string; columnName: string }[] = [],
  ): this => {
    this.#state.groupByStates.push({
      builderType: BuilderType.GroupByRollup,
      tableNameOrAlias: undefined,
      columnName: undefined,
      raw: undefined,
      groupingSets: columns.length > 0 ? [columns] : undefined,
    });
    return this;
  };

  /** `GROUP BY CUBE (...)` — not supported on MySQL (throws at parse time). */
  public groupByCube = (columns: { tableNameOrAlias: string; columnName: string }[] = []): this => {
    this.#state.groupByStates.push({
      builderType: BuilderType.GroupByCube,
      tableNameOrAlias: undefined,
      columnName: undefined,
      raw: undefined,
      groupingSets: columns.length > 0 ? [columns] : undefined,
    });
    return this;
  };

  /** `GROUP BY GROUPING SETS ((...), (...))` — not supported on MySQL (throws at parse time). */
  public groupByGroupingSets = (
    sets: { tableNameOrAlias: string; columnName: string }[][],
  ): this => {
    this.#state.groupByStates.push({
      builderType: BuilderType.GroupByGroupingSets,
      tableNameOrAlias: undefined,
      columnName: undefined,
      raw: undefined,
      groupingSets: sets,
    });
    return this;
  };

  public having = (
    tableNameOrAlias: string,
    columnName: string,
    whereOperator: WhereOperator,
    value: any,
  ): this => {
    this.#combinatorTarget = 'having';
    this.#state.havingStates.push({
      builderType: BuilderType.Having,
      tableNameOrAlias: tableNameOrAlias,
      columnName: columnName,
      whereOperator: whereOperator,
      raw: undefined,
      subquery: undefined,
      values: [value],
    });

    return this;
  };

  public havingRaw = (rawHaving: string): this => {
    this.#combinatorTarget = 'having';
    this.#state.havingStates.push({
      builderType: BuilderType.HavingRaw,
      tableNameOrAlias: undefined,
      columnName: undefined,
      whereOperator: WhereOperator.None,
      raw: rawHaving,
      subquery: undefined,
      values: [],
    });

    return this;
  };

  public havingRaws = (rawHavings: string[]): this => {
    rawHavings.forEach((rawHaving) => {
      this.havingRaw(rawHaving);
    });

    return this;
  };

  public havingJsonExtract = (
    tableNameOrAlias: string,
    columnName: string,
    path: string,
    mode: JsonExtractMode,
    whereOperator: WhereOperator,
    value: any,
  ): this => {
    this.#combinatorTarget = 'having';
    this.#state.havingStates.push({
      builderType: BuilderType.HavingJsonExtract,
      tableNameOrAlias,
      columnName,
      whereOperator,
      raw: undefined,
      subquery: undefined,
      values: [value],
      jsonPath: path,
      jsonExtractMode: mode,
      fullTextMode: undefined,
      fullTextColumns: undefined,
    });
    return this;
  };

  public havingJsonContains = (tableNameOrAlias: string, columnName: string, value: any): this => {
    this.#combinatorTarget = 'having';
    this.#state.havingStates.push({
      builderType: BuilderType.HavingJsonContains,
      tableNameOrAlias,
      columnName,
      whereOperator: WhereOperator.None,
      raw: undefined,
      subquery: undefined,
      values: [value],
      jsonPath: undefined,
      jsonExtractMode: undefined,
      fullTextMode: undefined,
      fullTextColumns: undefined,
    });
    return this;
  };

  public havingMatch = (
    columns: { tableNameOrAlias: string; columnName: string }[],
    query: string,
    mode: FullTextMode = FullTextMode.Natural,
  ): this => {
    this.#combinatorTarget = 'having';
    this.#state.havingStates.push({
      builderType: BuilderType.HavingFullText,
      tableNameOrAlias: undefined,
      columnName: undefined,
      whereOperator: WhereOperator.None,
      raw: undefined,
      subquery: undefined,
      values: [query],
      jsonPath: undefined,
      jsonExtractMode: undefined,
      fullTextMode: mode,
      fullTextColumns: columns.map((column) => ({
        tableNameOrAlias: column.tableNameOrAlias,
        columnName: column.columnName,
      })),
    });
    return this;
  };

  public havingBetween = (
    tableNameOrAlias: string,
    columnName: string,
    value1: any,
    value2: any,
  ): this => {
    this.#combinatorTarget = 'having';
    this.#state.havingStates.push({
      builderType: BuilderType.HavingBetween,
      tableNameOrAlias: tableNameOrAlias,
      columnName: columnName,
      whereOperator: WhereOperator.Equals,
      raw: undefined,
      subquery: undefined,
      values: [value1, value2],
    });

    return this;
  };

  /** `HAVING EXISTS (subquery)` — mirrors {@link whereExists} for the HAVING clause. */
  public havingExists = (builder: (builder: QueryBuilder) => void): this => {
    this.#combinatorTarget = 'having';
    const child = this.#child();
    builder(child);
    child.state().isInnerStatement = true;

    this.#state.havingStates.push({
      builderType: BuilderType.HavingExistsBuilder,
      tableNameOrAlias: undefined,
      columnName: undefined,
      whereOperator: WhereOperator.None,
      raw: undefined,
      subquery: child.state(),
      values: [],
    });

    return this;
  };

  /** `HAVING NOT EXISTS (subquery)` — mirrors {@link whereNotExists} for the HAVING clause. */
  public havingNotExists = (builder: (builder: QueryBuilder) => void): this => {
    this.#combinatorTarget = 'having';
    const child = this.#child();
    builder(child);
    child.state().isInnerStatement = true;

    this.#state.havingStates.push({
      builderType: BuilderType.HavingNotExistsBuilder,
      tableNameOrAlias: undefined,
      columnName: undefined,
      whereOperator: WhereOperator.None,
      raw: undefined,
      subquery: child.state(),
      values: [],
    });

    return this;
  };

  /** Opens a parenthesized HAVING group — mirrors {@link whereGroup} for the HAVING clause. */
  public havingGroup(builder: (builder: QueryBuilder) => void): this {
    this.#combinatorTarget = 'having';
    this.#state.havingStates.push({
      builderType: BuilderType.HavingGroupBegin,
      tableNameOrAlias: undefined,
      columnName: undefined,
      whereOperator: WhereOperator.None,
      raw: undefined,
      values: [],
      subquery: undefined,
    });

    const child = this.#child();
    builder(child);
    child.state().isInnerStatement = true;

    if (child.state().havingStates.length === 0) {
      throw new ParserError(ParserArea.Having, 'HAVING group cannot be empty');
    }

    this.#state.havingStates.push({
      builderType: BuilderType.HavingGroupBuilder,
      tableNameOrAlias: undefined,
      columnName: undefined,
      whereOperator: WhereOperator.None,
      raw: undefined,
      values: [],
      subquery: child.state(),
    });

    this.#state.havingStates.push({
      builderType: BuilderType.HavingGroupEnd,
      tableNameOrAlias: '',
      columnName: '',
      whereOperator: WhereOperator.None,
      raw: '',
      values: [],
      subquery: child.state(),
    });

    return this;
  }

  public havingInWithBuilder = (
    tableNameOrAlias: string,
    columnName: string,
    builder: (builder: QueryBuilder) => void,
  ): this => {
    this.#combinatorTarget = 'having';
    const child = this.#child();
    builder(child);
    child.state().isInnerStatement = true;

    this.#state.havingStates.push({
      builderType: BuilderType.HavingInBuilder,
      tableNameOrAlias: tableNameOrAlias,
      columnName: columnName,
      whereOperator: WhereOperator.None,
      raw: undefined,
      subquery: child.state(),
      values: [],
    });

    return this;
  };

  public havingInValues = (tableNameOrAlias: string, columnName: string, values: any[]): this => {
    this.#combinatorTarget = 'having';
    values = [...values];
    this.#state.havingStates.push({
      builderType: BuilderType.HavingInValues,
      tableNameOrAlias: tableNameOrAlias,
      columnName: columnName,
      whereOperator: WhereOperator.None,
      raw: undefined,
      subquery: undefined,
      values: values,
    });

    return this;
  };

  public havingNotInWithBuilder = (
    tableNameOrAlias: string,
    columnName: string,
    builder: (builder: QueryBuilder) => void,
  ): this => {
    this.#combinatorTarget = 'having';
    const child = this.#child();
    builder(child);
    child.state().isInnerStatement = true;

    this.#state.havingStates.push({
      builderType: BuilderType.HavingNotInBuilder,
      tableNameOrAlias: tableNameOrAlias,
      columnName: columnName,
      whereOperator: WhereOperator.None,
      raw: undefined,
      subquery: child.state(),
      values: [],
    });

    return this;
  };

  public havingNotInValues = (
    tableNameOrAlias: string,
    columnName: string,
    values: any[],
  ): this => {
    this.#combinatorTarget = 'having';
    values = [...values];
    this.#state.havingStates.push({
      builderType: BuilderType.HavingNotInValues,
      tableNameOrAlias: tableNameOrAlias,
      columnName: columnName,
      whereOperator: WhereOperator.None,
      raw: undefined,
      subquery: undefined,
      values: values,
    });

    return this;
  };

  public havingNotNull = (tableNameOrAlias: string, columnName: string): this => {
    this.#combinatorTarget = 'having';
    this.#state.havingStates.push({
      builderType: BuilderType.HavingNotNull,
      tableNameOrAlias: tableNameOrAlias,
      columnName: columnName,
      whereOperator: WhereOperator.None,
      raw: undefined,
      subquery: undefined,
      values: [],
    });

    return this;
  };

  public havingNull = (tableNameOrAlias: string, columnName: string): this => {
    this.#combinatorTarget = 'having';
    this.#state.havingStates.push({
      builderType: BuilderType.HavingNull,
      tableNameOrAlias: tableNameOrAlias,
      columnName: columnName,
      whereOperator: WhereOperator.None,
      raw: undefined,
      subquery: undefined,
      values: [],
    });

    return this;
  };

  public insertInto = (tableName: string): this => {
    this.#state.queryType = QueryType.Insert;
    if (!this.#state.insertState) {
      this.#state.insertState = createInsertState();
    }
    this.#state.insertState.owner = this.#config.defaultOwner;
    this.#state.insertState.tableName = tableName;

    return this;
  };

  public insertIntoWithOwner = (owner: string, tableName: string): this => {
    this.#state.queryType = QueryType.Insert;
    if (!this.#state.insertState) {
      this.#state.insertState = createInsertState();
    }
    this.#state.insertState.owner = owner;
    this.#state.insertState.tableName = tableName;

    return this;
  };

  public insertColumns = (columns: string[]): this => {
    if (!this.#state.insertState) {
      this.#state.insertState = createInsertState();
    }
    this.#state.insertState.columns = [...columns];

    return this;
  };

  public insertValues = (values: any[]): this => {
    if (!this.#state.insertState) {
      this.#state.insertState = createInsertState();
    }
    this.#state.insertState.values.push([...values]);

    return this;
  };

  public insertRaw = (raw: string): this => {
    this.#state.queryType = QueryType.Insert;
    if (!this.#state.insertState) {
      this.#state.insertState = createInsertState();
    }
    this.#state.insertState.raw = raw;

    return this;
  };

  /**
   * `INSERT ... SELECT`: the row values come from a sub-query instead of a literal `VALUES`
   * list. Mutually exclusive with {@link insertValues} — providing both throws at parse time.
   */
  public insertSelect = (builder: (builder: QueryBuilder) => void): this => {
    this.#state.queryType = QueryType.Insert;
    if (!this.#state.insertState) {
      this.#state.insertState = createInsertState();
    }

    const child = this.#child();
    builder(child);
    child.state().isInnerStatement = true;

    this.#state.insertState.selectSubquery = child.state();

    return this;
  };

  public updateTable = (tableName: string, alias: string): this => {
    this.#state.queryType = QueryType.Update;
    this.#state.fromStates.push({
      builderType: BuilderType.FromTable,
      owner: this.#config.defaultOwner,
      tableName: tableName,
      alias: alias,
      subquery: undefined,
      raw: undefined,
    });
    this.#state.mutationTargetIndex = this.#state.fromStates.length - 1;

    return this;
  };

  public updateTableWithOwner = (owner: string, tableName: string, alias: string): this => {
    this.#state.queryType = QueryType.Update;
    this.#state.fromStates.push({
      builderType: BuilderType.FromTable,
      owner: owner,
      tableName: tableName,
      alias: alias,
      subquery: undefined,
      raw: undefined,
    });
    this.#state.mutationTargetIndex = this.#state.fromStates.length - 1;

    return this;
  };

  public set = (columnName: string, value: any): this => {
    this.#state.updateStates.push({
      builderType: BuilderType.UpdateColumn,
      columnName: columnName,
      value: value,
      raw: undefined,
    });

    return this;
  };

  public setColumns = (columns: { columnName: string; value: any }[]): this => {
    columns.forEach((column) => {
      this.set(column.columnName, column.value);
    });

    return this;
  };

  public setRaw = (raw: string): this => {
    this.#state.updateStates.push({
      builderType: BuilderType.UpdateRaw,
      columnName: undefined,
      value: undefined,
      raw: raw,
    });

    return this;
  };

  public deleteFrom = (tableName: string, alias: string): this => {
    this.#state.queryType = QueryType.Delete;
    this.#state.fromStates.push({
      builderType: BuilderType.FromTable,
      owner: this.#config.defaultOwner,
      tableName: tableName,
      alias: alias,
      subquery: undefined,
      raw: undefined,
    });
    this.#state.mutationTargetIndex = this.#state.fromStates.length - 1;

    return this;
  };

  public deleteFromWithOwner = (owner: string, tableName: string, alias: string): this => {
    this.#state.queryType = QueryType.Delete;
    this.#state.fromStates.push({
      builderType: BuilderType.FromTable,
      owner: owner,
      tableName: tableName,
      alias: alias,
      subquery: undefined,
      raw: undefined,
    });
    this.#state.mutationTargetIndex = this.#state.fromStates.length - 1;

    return this;
  };

  public union = (builder: (builder: QueryBuilder) => void): this => {
    const child = this.#child();
    builder(child);
    child.state().isInnerStatement = true;

    this.#state.unionStates.push({
      builderType: BuilderType.Union,
      subquery: child.state(),
      raw: undefined,
    });

    return this;
  };

  public unionAll = (builder: (builder: QueryBuilder) => void): this => {
    const child = this.#child();
    builder(child);
    child.state().isInnerStatement = true;

    this.#state.unionStates.push({
      builderType: BuilderType.UnionAll,
      subquery: child.state(),
      raw: undefined,
    });

    return this;
  };

  public intersect = (builder: (builder: QueryBuilder) => void): this => {
    const child = this.#child();
    builder(child);
    child.state().isInnerStatement = true;

    this.#state.unionStates.push({
      builderType: BuilderType.Intersect,
      subquery: child.state(),
      raw: undefined,
    });

    return this;
  };

  public except = (builder: (builder: QueryBuilder) => void): this => {
    const child = this.#child();
    builder(child);
    child.state().isInnerStatement = true;

    this.#state.unionStates.push({
      builderType: BuilderType.Except,
      subquery: child.state(),
      raw: undefined,
    });

    return this;
  };

  /** @param columns - Optional explicit column list: `WITH name (col1, col2) AS (...)`. Omit/empty leaves it out. */
  public cte = (
    name: string,
    builder: (builder: QueryBuilder) => void,
    columns: string[] = [],
  ): this => {
    const child = this.#child();
    builder(child);
    child.state().isInnerStatement = true;

    this.#state.cteStates.push({
      builderType: BuilderType.CteBuilder,
      name: name,
      columns: [...columns],
      recursive: false,
      subquery: child.state(),
      raw: undefined,
    });

    return this;
  };

  /** @param columns - Optional explicit column list — see {@link cte}. Recursive CTEs commonly need one, since the recursive member's SELECT list can't always be inferred from the anchor alone. */
  public cteRecursive = (
    name: string,
    builder: (builder: QueryBuilder) => void,
    columns: string[] = [],
  ): this => {
    const child = this.#child();
    builder(child);
    child.state().isInnerStatement = true;

    this.#state.cteStates.push({
      builderType: BuilderType.CteBuilder,
      name: name,
      columns: [...columns],
      recursive: true,
      subquery: child.state(),
      raw: undefined,
    });

    return this;
  };

  public cteRaw = (name: string, raw: string): this => {
    this.#state.cteStates.push({
      builderType: BuilderType.CteRaw,
      name: name,
      columns: [],
      recursive: false,
      subquery: undefined,
      raw: raw,
    });

    return this;
  };

  /** Removes a previously set `TOP` limit from builder state (MSSQL). */
  public clearTop = (): this => {
    if (this.#state.customState) {
      delete this.#state.customState['top'];
      if (Object.keys(this.#state.customState).length === 0) {
        this.#state.customState = undefined;
      }
    }
    return this;
  };

  /** Sets the `TOP` row limit for the generated `SELECT` (MSSQL; ignored by other dialects). */
  public top = (top: number): this => {
    if (!this.#state.customState) {
      this.#state.customState = {};
    }
    this.#state.customState['top'] = top;
    return this;
  };

  /**
   * Returns the given columns from an INSERT/UPDATE/DELETE: PG/SQLite `RETURNING`, MSSQL
   * `OUTPUT INSERTED.…`/`OUTPUT DELETED.…`. MySQL has no equivalent and throws at parse time.
   */
  public returning = (columns: string[]): this => {
    this.#state.returningState = { columns: [...columns], raw: undefined };
    return this;
  };

  /** Raw-SQL form of {@link returning} for expressions the structured column list cannot express. */
  public returningRaw = (raw: string): this => {
    this.#state.returningState = { columns: [], raw };
    return this;
  };

  public clearReturning = (): this => {
    this.#state.returningState = undefined;
    return this;
  };

  /**
   * INSERT conflict clause: silently skip conflicting rows (PG/SQLite `ON CONFLICT ... DO
   * NOTHING`, MySQL `INSERT IGNORE`). On MSSQL, upsert is emitted as a `MERGE` statement.
   *
   * @param conflictColumns - Conflict target for PG/SQLite. Ignored on MySQL, which infers the
   *   conflicting key from the table's own constraints; kept so one call shape works everywhere.
   */
  public onConflictDoNothing = (conflictColumns: string[] = []): this => {
    this.#state.upsertState = {
      action: UpsertAction.DoNothing,
      conflictColumns: [...conflictColumns],
      updateColumns: [],
      updateRaw: undefined,
    };
    return this;
  };

  /**
   * INSERT conflict clause: update the existing row (PG/SQLite `ON CONFLICT ... DO UPDATE SET`,
   * MySQL `ON DUPLICATE KEY UPDATE`). On MSSQL, upsert is emitted as a `MERGE` statement.
   *
   * @param conflictColumns - Conflict target for PG/SQLite. Ignored on MySQL; see {@link onConflictDoNothing}.
   */
  public onConflictDoUpdate = (
    conflictColumns: string[],
    updates: { columnName: string; value: any }[],
  ): this => {
    this.#state.upsertState = {
      action: UpsertAction.DoUpdate,
      conflictColumns: [...conflictColumns],
      updateColumns: updates.map((update) => ({
        columnName: update.columnName,
        value: update.value,
      })),
      updateRaw: undefined,
    };
    return this;
  };

  /** Raw-SQL form of {@link onConflictDoUpdate}'s SET list for expressions columns can't express. */
  public onConflictDoUpdateRaw = (conflictColumns: string[], raw: string): this => {
    this.#state.upsertState = {
      action: UpsertAction.DoUpdate,
      conflictColumns: [...conflictColumns],
      updateColumns: [],
      updateRaw: raw,
    };
    return this;
  };

  public clearUpsert = (): this => {
    this.#state.upsertState = undefined;
    return this;
  };

  /** Exclusive row lock on the SELECT's result rows (`FOR UPDATE`; MSSQL `WITH (UPDLOCK, ROWLOCK)`). */
  public forUpdate = (): this => {
    this.#state.rowLock = { mode: RowLockMode.ForUpdate, wait: RowLockWait.Default };
    return this;
  };

  /** {@link forUpdate}, failing immediately instead of waiting on an already-locked row. */
  public forUpdateNowait = (): this => {
    this.#state.rowLock = { mode: RowLockMode.ForUpdate, wait: RowLockWait.Nowait };
    return this;
  };

  /** {@link forUpdate}, silently skipping already-locked rows instead of waiting. */
  public forUpdateSkipLocked = (): this => {
    this.#state.rowLock = { mode: RowLockMode.ForUpdate, wait: RowLockWait.SkipLocked };
    return this;
  };

  /** Shared row lock on the SELECT's result rows (`FOR SHARE`; MSSQL `WITH (HOLDLOCK, ROWLOCK)`). */
  public forShare = (): this => {
    this.#state.rowLock = { mode: RowLockMode.ForShare, wait: RowLockWait.Default };
    return this;
  };

  /** {@link forShare}, failing immediately instead of waiting on an already-locked row. */
  public forShareNowait = (): this => {
    this.#state.rowLock = { mode: RowLockMode.ForShare, wait: RowLockWait.Nowait };
    return this;
  };

  /** {@link forShare}, silently skipping already-locked rows instead of waiting. */
  public forShareSkipLocked = (): this => {
    this.#state.rowLock = { mode: RowLockMode.ForShare, wait: RowLockWait.SkipLocked };
    return this;
  };

  public clearRowLock = (): this => {
    this.#state.rowLock = undefined;
    return this;
  };

  /** MySQL `USE INDEX (index)` on a FROM/JOIN table alias. Other dialects throw at parse time. */
  public hintUseIndex = (tableNameOrAlias: string, indexName: string): this => {
    (this.#state.hintStates ??= []).push({
      kind: HintKind.UseIndex,
      tableNameOrAlias,
      indexName,
      optionText: undefined,
      raw: undefined,
    });
    return this;
  };

  /** MySQL `FORCE INDEX (index)` on a FROM/JOIN table alias. */
  public hintForceIndex = (tableNameOrAlias: string, indexName: string): this => {
    (this.#state.hintStates ??= []).push({
      kind: HintKind.ForceIndex,
      tableNameOrAlias,
      indexName,
      optionText: undefined,
      raw: undefined,
    });
    return this;
  };

  /** MSSQL trailing `OPTION (...)` clause, e.g. `hintMssqlOption('RECOMPILE')`. */
  public hintMssqlOption = (optionText: string): this => {
    (this.#state.hintStates ??= []).push({
      kind: HintKind.MssqlOption,
      tableNameOrAlias: undefined,
      indexName: undefined,
      optionText,
      raw: undefined,
    });
    return this;
  };

  /**
   * Documented raw hint escape hatch — caller owns dialect correctness (e.g. Postgres
   * `/*+ SeqScan(users) *\/` comments, optimizer-specific syntax).
   */
  public hintRaw = (rawHint: string): this => {
    (this.#state.hintStates ??= []).push({
      kind: HintKind.Raw,
      tableNameOrAlias: undefined,
      indexName: undefined,
      optionText: undefined,
      raw: rawHint,
    });
    return this;
  };

  public clearHints = (): this => {
    this.#state.hintStates = [];
    return this;
  };

  #requireCallState = (): CallState => {
    if (!this.#state.callState) {
      throw new ParserError(
        ParserArea.Call,
        'call a procParam* method only after callProcedure/callFunction',
      );
    }
    return this.#state.callState;
  };

  /** Invokes a stored procedure: Postgres/MySQL `CALL`, MSSQL `EXEC`. Not supported on SQLite. */
  public callProcedure = (name: string): this => {
    this.#state.queryType = QueryType.Call;
    this.#state.callState = {
      kind: CallKind.Procedure,
      owner: this.#config.defaultOwner,
      name: name,
      returnIntent: CallReturnIntent.Void,
      params: [],
    };
    return this;
  };

  /** {@link callProcedure}, qualified with an explicit schema/owner. */
  public callProcedureWithOwner = (owner: string, name: string): this => {
    this.#state.queryType = QueryType.Call;
    this.#state.callState = {
      kind: CallKind.Procedure,
      owner: owner,
      name: name,
      returnIntent: CallReturnIntent.Void,
      params: [],
    };
    return this;
  };

  /**
   * Invokes a stored function as an expression: `SELECT name(...)` (or, with
   * {@link CallReturnIntent.ResultSet}, `SELECT * FROM name(...)` for a set-returning /
   * table-valued function — refused on MySQL, which has none). Not supported on SQLite.
   */
  public callFunction = (
    name: string,
    returnIntent: CallReturnIntent = CallReturnIntent.Scalar,
  ): this => {
    if (returnIntent === CallReturnIntent.Void) {
      throw new ParserError(
        ParserArea.Call,
        'callFunction requires CallReturnIntent.Scalar or CallReturnIntent.ResultSet',
      );
    }
    this.#state.queryType = QueryType.Call;
    this.#state.callState = {
      kind: CallKind.Function,
      owner: this.#config.defaultOwner,
      name: name,
      returnIntent: returnIntent,
      params: [],
    };
    return this;
  };

  /** {@link callFunction}, qualified with an explicit schema/owner. */
  public callFunctionWithOwner = (
    owner: string,
    name: string,
    returnIntent: CallReturnIntent = CallReturnIntent.Scalar,
  ): this => {
    if (returnIntent === CallReturnIntent.Void) {
      throw new ParserError(
        ParserArea.Call,
        'callFunction requires CallReturnIntent.Scalar or CallReturnIntent.ResultSet',
      );
    }
    this.#state.queryType = QueryType.Call;
    this.#state.callState = {
      kind: CallKind.Function,
      owner: owner,
      name: name,
      returnIntent: returnIntent,
      params: [],
    };
    return this;
  };

  /** Appends a positional IN argument. */
  public procParam = (value: any): this => {
    this.#requireCallState().params.push({
      direction: CallParamDirection.In,
      name: undefined,
      value: value,
      sqlType: undefined,
      raw: undefined,
    });
    return this;
  };

  /** Appends several positional IN arguments in order. */
  public procParams = (values: any[]): this => {
    values.forEach((value) => this.procParam(value));
    return this;
  };

  /**
   * Appends a named IN argument (Postgres `name := value`, MSSQL `@name = value`). Not supported
   * on MySQL, which has no named-argument call syntax — throws at parse time.
   */
  public procParamNamed = (name: string, value: any): this => {
    this.#requireCallState().params.push({
      direction: CallParamDirection.In,
      name: name,
      value: value,
      sqlType: undefined,
      raw: undefined,
    });
    return this;
  };

  /** Appends a positional argument as raw SQL, emitted verbatim (e.g. a computed expression). */
  public procParamRaw = (raw: string): this => {
    this.#requireCallState().params.push({
      direction: CallParamDirection.In,
      name: undefined,
      value: undefined,
      sqlType: undefined,
      raw: raw,
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
  public procParamOut = (name: string, sqlType?: string): this => {
    this.#requireCallState().params.push({
      direction: CallParamDirection.Out,
      name: name,
      value: undefined,
      sqlType: sqlType,
      raw: undefined,
    });
    return this;
  };

  /** {@link procParamOut}, additionally seeding the variable/argument with an initial `value`. */
  public procParamInOut = (name: string, value: any, sqlType?: string): this => {
    this.#requireCallState().params.push({
      direction: CallParamDirection.InOut,
      name: name,
      value: value,
      sqlType: sqlType,
      raw: undefined,
    });
    return this;
  };

  /** Clears a previously configured procedure/function call. */
  public clearCall = (): this => {
    this.#state.callState = undefined;
    if (this.#state.queryType === QueryType.Call) {
      this.#state.queryType = QueryType.Select;
    }
    return this;
  };
}
