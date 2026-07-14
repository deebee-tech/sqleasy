import type { Dialect } from '../configuration/configuration';
import { BuilderType } from '../enums/builder-type';
import { JoinType } from '../enums/join-type';
import { OrderByDirection } from '../enums/order-by-direction';
import { QueryType } from '../enums/query-type';
import { WhereOperator } from '../enums/where-operator';
import type { PreparedSql } from '../parser/to-sql';
import { parse, parsePrepared, parseRaw } from '../parser/to-sql';
import { createInsertState } from '../state/insert';
import { createQueryState, type QueryState } from '../state/query';
import { JoinOnBuilder } from './join-on';

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

  constructor(config: Dialect) {
    this.#config = config;
  }

  /** A fresh builder sharing this builder's dialect — the parent of every subquery. */
  #child = (): QueryBuilder => new QueryBuilder(this.#config);

  /** Returns the dialect configuration backing this builder. */
  public configuration = (): Dialect => {
    return this.#config;
  };

  public and = (): this => {
    this.#state.whereStates.push({
      builderType: BuilderType.And,
      tableNameOrAlias: undefined,
      columnName: undefined,
      whereOperator: WhereOperator.None,
      raw: undefined,
      subquery: undefined,
      values: [],
    });

    return this;
  };

  public clearAll = (): this => {
    this.#state = createQueryState();
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
    return this;
  };

  public clearJoin = (): this => {
    this.#state.joinStates = [];
    return this;
  };

  public clearLimit = (): this => {
    this.#state.limit = 0;
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
    return this;
  };

  public clearWhere = (): this => {
    this.#state.whereStates = [];
    return this;
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

  public limit = (limit: number): this => {
    this.#state.limit = limit;
    return this;
  };

  public offset = (offset: number): this => {
    this.#state.offset = offset;
    return this;
  };

  public or = (): this => {
    this.#state.whereStates.push({
      builderType: BuilderType.Or,
      tableNameOrAlias: undefined,
      columnName: undefined,
      whereOperator: WhereOperator.None,
      raw: undefined,
      subquery: undefined,
      values: [],
    });

    return this;
  };

  public orderByColumn = (
    tableNameOrAlias: string,
    columnName: string,
    direction: OrderByDirection,
  ): this => {
    this.#state.orderByStates.push({
      builderType: BuilderType.OrderByColumn,
      tableNameOrAlias: tableNameOrAlias,
      columnName: columnName,
      direction: direction,
      raw: undefined,
    });

    return this;
  };

  public orderByColumns = (
    columns: {
      tableNameOrAlias: string;
      columnName: string;
      direction: OrderByDirection;
    }[],
  ): this => {
    columns.forEach((column) => {
      this.orderByColumn(column.tableNameOrAlias, column.columnName, column.direction);
    });

    return this;
  };

  public orderByRaw = (rawOrderBy: string): this => {
    this.#state.orderByStates.push({
      builderType: BuilderType.OrderByRaw,
      tableNameOrAlias: undefined,
      columnName: undefined,
      direction: OrderByDirection.Ascending,
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
    this.#state.selectStates.push({
      builderType: BuilderType.SelectAll,
      tableNameOrAlias: undefined,
      columnName: undefined,
      alias: undefined,
      subquery: undefined,
      raw: undefined,
    });

    return this;
  };

  public selectColumn = (
    tableNameOrAlias: string,
    columnName: string,
    columnAlias: string,
  ): this => {
    this.#state.selectStates.push({
      builderType: BuilderType.SelectColumn,
      tableNameOrAlias: tableNameOrAlias,
      columnName: columnName,
      alias: columnAlias,
      subquery: undefined,
      raw: undefined,
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
    this.#state.selectStates.push({
      builderType: BuilderType.SelectRaw,
      tableNameOrAlias: undefined,
      columnName: undefined,
      alias: undefined,
      subquery: undefined,
      raw: rawSelect,
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

  public whereExistsWithBuilder = (
    tableNameOrAlias: string,
    columnName: string,
    builder: (builder: QueryBuilder) => void,
  ): this => {
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

  public whereGroup(builder: (builder: QueryBuilder) => void): this {
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

  public whereNotExistsWithBuilder = (
    tableNameOrAlias: string,
    columnName: string,
    builder: (builder: QueryBuilder) => void,
  ): this => {
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

  public whereNotInWithBuilder = (
    tableNameOrAlias: string,
    columnName: string,
    builder: (builder: QueryBuilder) => void,
  ): this => {
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

  public groupByColumn = (tableNameOrAlias: string, columnName: string): this => {
    this.#state.groupByStates.push({
      builderType: BuilderType.GroupByColumn,
      tableNameOrAlias: tableNameOrAlias,
      columnName: columnName,
      raw: undefined,
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
    });

    return this;
  };

  public groupByRaws = (rawGroupBys: string[]): this => {
    rawGroupBys.forEach((rawGroupBy) => {
      this.groupByRaw(rawGroupBy);
    });

    return this;
  };

  public having = (
    tableNameOrAlias: string,
    columnName: string,
    whereOperator: WhereOperator,
    value: any,
  ): this => {
    this.#state.havingStates.push({
      builderType: BuilderType.Having,
      tableNameOrAlias: tableNameOrAlias,
      columnName: columnName,
      whereOperator: whereOperator,
      raw: undefined,
      values: [value],
    });

    return this;
  };

  public havingRaw = (rawHaving: string): this => {
    this.#state.havingStates.push({
      builderType: BuilderType.HavingRaw,
      tableNameOrAlias: undefined,
      columnName: undefined,
      whereOperator: WhereOperator.None,
      raw: rawHaving,
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
    this.#state.insertState.columns = columns;

    return this;
  };

  public insertValues = (values: any[]): this => {
    if (!this.#state.insertState) {
      this.#state.insertState = createInsertState();
    }
    this.#state.insertState.values.push(values);

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

  public cte = (name: string, builder: (builder: QueryBuilder) => void): this => {
    const child = this.#child();
    builder(child);
    child.state().isInnerStatement = true;

    this.#state.cteStates.push({
      builderType: BuilderType.CteBuilder,
      name: name,
      recursive: false,
      subquery: child.state(),
      raw: undefined,
    });

    return this;
  };

  public cteRecursive = (name: string, builder: (builder: QueryBuilder) => void): this => {
    const child = this.#child();
    builder(child);
    child.state().isInnerStatement = true;

    this.#state.cteStates.push({
      builderType: BuilderType.CteBuilder,
      name: name,
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
}
