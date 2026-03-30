import type { IConfiguration } from "../configuration/interface_configuration";
import { BuilderType } from "../enums/builder_type";
import { JoinType } from "../enums/join_type";
import { OrderByDirection } from "../enums/order_by_direction";
import { QueryType } from "../enums/query_type";
import { WhereOperator } from "../enums/where_operator";
import type { IParser } from "../parser/interface_parser";
import { InsertState } from "../state/insert_state";
import { SqlEasyState } from "../state/sqleasy_state";
import type { IBuilder } from "./interface_builder";
import type { IJoinOnBuilder } from "./interface_join_on_builder";

export abstract class DefaultBuilder<
   T extends IBuilder<T, U, V>,
   U extends IJoinOnBuilder<U>,
   V extends IParser,
> implements IBuilder<T, U, V> {
   private _sqlEasyState: SqlEasyState = new SqlEasyState();
   private _config: IConfiguration;

   constructor(config: IConfiguration) {
      this._config = config;
   }

   public abstract newBuilder(config?: IConfiguration): T;
   public abstract newJoinOnBuilder(config?: IConfiguration): U;
   public abstract newParser(config?: IConfiguration): V;

   public and = (): T => {
      this._sqlEasyState.whereStates.push({
         builderType: BuilderType.And,
         tableNameOrAlias: undefined,
         columnName: undefined,
         whereOperator: WhereOperator.None,
         raw: undefined,
         sqlEasyState: undefined,
         values: [],
      });

      return this as unknown as T;
   };

   public clearAll = (): T => {
      this._sqlEasyState = new SqlEasyState();
      return this as unknown as T;
   };

   public clearFrom = (): T => {
      this._sqlEasyState.fromStates = [];
      return this as unknown as T;
   };

   public clearGroupBy = (): T => {
      this._sqlEasyState.groupByStates = [];
      return this as unknown as T;
   };

   public clearHaving = (): T => {
      this._sqlEasyState.havingStates = [];
      return this as unknown as T;
   };

   public clearJoin = (): T => {
      this._sqlEasyState.joinStates = [];
      return this as unknown as T;
   };

   public clearLimit = (): T => {
      this._sqlEasyState.limit = 0;
      return this as unknown as T;
   };

   public clearOffset = (): T => {
      this._sqlEasyState.offset = 0;
      return this as unknown as T;
   };

   public clearOrderBy = (): T => {
      this._sqlEasyState.orderByStates = [];
      return this as unknown as T;
   };

   public clearSelect = (): T => {
      this._sqlEasyState.selectStates = [];
      return this as unknown as T;
   };

   public clearWhere = (): T => {
      this._sqlEasyState.whereStates = [];
      return this as unknown as T;
   };

   public distinct = (): T => {
      this._sqlEasyState.distinct = true;
      return this as unknown as T;
   };

   public fromRaw = (rawFrom: string): T => {
      this._sqlEasyState.fromStates.push({
         builderType: BuilderType.FromRaw,
         owner: undefined,
         tableName: undefined,
         alias: undefined,
         sqlEasyState: undefined,
         raw: rawFrom,
      });
      return this as unknown as T;
   };

   public fromRaws = (rawFroms: string[]): T => {
      rawFroms.forEach((rawFrom) => {
         this.fromRaw(rawFrom);
      });
      return this as unknown as T;
   };

   public fromTable = (tableName: string, alias: string): T => {
      this._sqlEasyState.fromStates.push({
         builderType: BuilderType.FromTable,
         owner: this._config.defaultOwner(),
         tableName: tableName,
         alias: alias,
         sqlEasyState: undefined,
         raw: undefined,
      });
      return this as unknown as T;
   };

   public fromTables = (tables: { tableName: string; alias: string }[]): T => {
      tables.forEach((table) => {
         this.fromTable(table.tableName, table.alias);
      });
      return this as unknown as T;
   };

   public fromTableWithOwner = (owner: string, tableName: string, alias: string): T => {
      this._sqlEasyState.fromStates.push({
         builderType: BuilderType.FromTable,
         owner: owner,
         tableName: tableName,
         alias: alias,
         sqlEasyState: undefined,
         raw: undefined,
      });
      return this as unknown as T;
   };

   public fromTablesWithOwner = (tables: { owner: string; tableName: string; alias: string }[]): T => {
      tables.forEach((table) => {
         this.fromTableWithOwner(table.owner, table.tableName, table.alias);
      });
      return this as unknown as T;
   };

   public fromWithBuilder = (alias: string, builder: (builder: T) => void): T => {
      const newBuilder = this.newBuilder();
      builder(newBuilder);
      newBuilder.state().isInnerStatement = true;

      this._sqlEasyState.fromStates.push({
         builderType: BuilderType.FromBuilder,
         owner: undefined,
         tableName: undefined,
         alias: alias,
         sqlEasyState: newBuilder.state(),
         raw: undefined,
      });

      return this as unknown as T;
   };

   public joinRaw = (rawJoin: string): T => {
      this._sqlEasyState.joinStates.push({
         builderType: BuilderType.JoinRaw,
         joinType: JoinType.None,
         owner: undefined,
         tableName: undefined,
         alias: undefined,
         sqlEasyState: undefined,
         raw: rawJoin,
         joinOnStates: [],
      });

      return this as unknown as T;
   };

   public joinRaws = (rawJoins: string[]): T => {
      rawJoins.forEach((rawJoin) => {
         this.joinRaw(rawJoin);
      });

      return this as unknown as T;
   };

   public joinTable = (
      joinType: JoinType,
      tableName: string,
      alias: string,
      joinOnBuilder: (joinOnBuilder: U) => void,
   ): T => {
      const joinOnBuilderInstance = this.newJoinOnBuilder();
      joinOnBuilder(joinOnBuilderInstance);

      this._sqlEasyState.joinStates.push({
         builderType: BuilderType.JoinTable,
         joinType: joinType,
         owner: this._config.defaultOwner(),
         tableName: tableName,
         alias: alias,
         sqlEasyState: undefined,
         raw: undefined,
         joinOnStates: joinOnBuilderInstance.states(),
      });

      return this as unknown as T;
   };

   public joinTables = (
      joins: {
         joinType: JoinType;
         tableName: string;
         alias: string;
         joinOnBuilder: (joinOnBuilder: U) => void;
      }[],
   ): T => {
      for (const join of joins) {
         this.joinTable(join.joinType, join.tableName, join.alias, join.joinOnBuilder);
      }
      return this as unknown as T;
   };

   public joinTablesWithOwner = (
      joins: {
         joinType: JoinType;
         owner: string;
         tableName: string;
         alias: string;
         joinOnBuilder: (joinOnBuilder: U) => void;
      }[],
   ): T => {
      for (const join of joins) {
         this.joinTableWithOwner(join.joinType, join.owner, join.tableName, join.alias, join.joinOnBuilder);
      }
      return this as unknown as T;
   };

   public joinTableWithOwner = (
      joinType: JoinType,
      owner: string,
      tableName: string,
      alias: string,
      joinOnBuilder: (joinOnBuilder: U) => void,
   ): T => {
      const joinOnBuilderInstance = this.newJoinOnBuilder();
      joinOnBuilder(joinOnBuilderInstance);

      this._sqlEasyState.joinStates.push({
         builderType: BuilderType.JoinTable,
         joinType: joinType,
         owner: owner,
         tableName: tableName,
         alias: alias,
         sqlEasyState: undefined,
         raw: undefined,
         joinOnStates: joinOnBuilderInstance.states(),
      });

      return this as unknown as T;
   };

   public joinWithBuilder = (
      joinType: JoinType,
      alias: string,
      builder: (builder: T) => void,
      joinOnBuilder: (joinOnBuilder: U) => void,
   ): T => {
      const newBuilder = this.newBuilder();

      builder(newBuilder);
      newBuilder.state().isInnerStatement = true;

      const newJoinOnBuilder = this.newJoinOnBuilder();
      joinOnBuilder(newJoinOnBuilder);

      this._sqlEasyState.joinStates.push({
         builderType: BuilderType.JoinBuilder,
         joinType: joinType,
         owner: undefined,
         tableName: undefined,
         alias: alias,
         sqlEasyState: newBuilder.state(),
         raw: undefined,
         joinOnStates: newJoinOnBuilder.states(),
      });

      return this as unknown as T;
   };

   public limit = (limit: number): T => {
      this._sqlEasyState.limit = limit;
      return this as unknown as T;
   };

   public offset = (offset: number): T => {
      this._sqlEasyState.offset = offset;
      return this as unknown as T;
   };

   public or = (): T => {
      this._sqlEasyState.whereStates.push({
         builderType: BuilderType.Or,
         tableNameOrAlias: undefined,
         columnName: undefined,
         whereOperator: WhereOperator.None,
         raw: undefined,
         sqlEasyState: undefined,
         values: [],
      });

      return this as unknown as T;
   };

   public orderByColumn = (tableNameOrAlias: string, columnName: string, direction: OrderByDirection): T => {
      this._sqlEasyState.orderByStates.push({
         builderType: BuilderType.OrderByColumn,
         tableNameOrAlias: tableNameOrAlias,
         columnName: columnName,
         direction: direction,
         raw: undefined,
      });

      return this as unknown as T;
   };

   public orderByColumns = (
      columns: {
         tableNameOrAlias: string;
         columnName: string;
         direction: OrderByDirection;
      }[],
   ): T => {
      columns.forEach((column) => {
         this.orderByColumn(column.tableNameOrAlias, column.columnName, column.direction);
      });

      return this as unknown as T;
   };

   public orderByRaw = (rawOrderBy: string): T => {
      this._sqlEasyState.orderByStates.push({
         builderType: BuilderType.OrderByRaw,
         tableNameOrAlias: undefined,
         columnName: undefined,
         direction: OrderByDirection.Ascending,
         raw: rawOrderBy,
      });

      return this as unknown as T;
   };

   public orderByRaws = (rawOrderBys: string[]): T => {
      rawOrderBys.forEach((rawOrderBy) => {
         this.orderByRaw(rawOrderBy);
      });

      return this as unknown as T;
   };

   public parse = (): string => {
      const parser = this.newParser();
      return parser.toSql(this.state());
   };

   public parseRaw = (): string => {
      const parser = this.newParser();
      return parser.toSqlRaw(this.state());
   };

   public selectAll = (): T => {
      this._sqlEasyState.selectStates.push({
         builderType: BuilderType.SelectAll,
         tableNameOrAlias: undefined,
         columnName: undefined,
         alias: undefined,
         sqlEasyState: undefined,
         raw: undefined,
      });

      return this as unknown as T;
   };

   public selectColumn = (tableNameOrAlias: string, columnName: string, columnAlias: string): T => {
      this._sqlEasyState.selectStates.push({
         builderType: BuilderType.SelectColumn,
         tableNameOrAlias: tableNameOrAlias,
         columnName: columnName,
         alias: columnAlias,
         sqlEasyState: undefined,
         raw: undefined,
      });

      return this as unknown as T;
   };

   public selectColumns = (
      columns: {
         tableNameOrAlias: string;
         columnName: string;
         columnAlias: string;
      }[],
   ): T => {
      columns.forEach((column) => {
         this.selectColumn(column.tableNameOrAlias, column.columnName, column.columnAlias);
      });

      return this as unknown as T;
   };

   public selectRaw = (rawSelect: string): T => {
      this._sqlEasyState.selectStates.push({
         builderType: BuilderType.SelectRaw,
         tableNameOrAlias: undefined,
         columnName: undefined,
         alias: undefined,
         sqlEasyState: undefined,
         raw: rawSelect,
      });

      return this as unknown as T;
   };

   public selectRaws = (rawSelects: string[]): T => {
      rawSelects.forEach((rawSelect) => {
         this.selectRaw(rawSelect);
      });

      return this as unknown as T;
   };

   public selectWithBuilder = (alias: string, builder: (builder: T) => void): T => {
      const newBuilder = this.newBuilder();

      builder(newBuilder);
      newBuilder.state().isInnerStatement = true;

      this._sqlEasyState.selectStates.push({
         builderType: BuilderType.SelectBuilder,
         tableNameOrAlias: undefined,
         columnName: undefined,
         alias: alias,
         sqlEasyState: newBuilder.state(),
         raw: undefined,
      });

      return this as unknown as T;
   };

   public state = (): SqlEasyState => {
      return this._sqlEasyState;
   };

   public where = (tableNameOrAlias: string, columnName: string, whereOperator: WhereOperator, value: any): T => {
      this._sqlEasyState.whereStates.push({
         builderType: BuilderType.Where,
         tableNameOrAlias: tableNameOrAlias,
         columnName: columnName,
         whereOperator: whereOperator,
         raw: undefined,
         sqlEasyState: undefined,
         values: [value],
      });

      return this as unknown as T;
   };

   public whereBetween = (tableNameOrAlias: string, columnName: string, value1: any, value2: any): T => {
      this._sqlEasyState.whereStates.push({
         builderType: BuilderType.WhereBetween,
         tableNameOrAlias: tableNameOrAlias,
         columnName: columnName,
         whereOperator: WhereOperator.Equals,
         raw: undefined,
         sqlEasyState: undefined,
         values: [value1, value2],
      });

      return this as unknown as T;
   };

   public whereExistsWithBuilder = (tableNameOrAlias: string, columnName: string, builder: (builder: T) => void): T => {
      const newBuilder = this.newBuilder();
      builder(newBuilder);
      newBuilder.state().isInnerStatement = true;

      this._sqlEasyState.whereStates.push({
         builderType: BuilderType.WhereExistsBuilder,
         tableNameOrAlias: tableNameOrAlias,
         columnName: columnName,
         whereOperator: WhereOperator.None,
         raw: undefined,
         sqlEasyState: newBuilder.state(),
         values: [],
      });

      return this as unknown as T;
   };

   public whereGroup(builder: (builder: T) => void): T {
      this._sqlEasyState.whereStates.push({
         builderType: BuilderType.WhereGroupBegin,
         tableNameOrAlias: undefined,
         columnName: undefined,
         whereOperator: WhereOperator.None,
         raw: undefined,
         values: [],
         sqlEasyState: undefined,
      });

      const newBuilder = this.newBuilder();
      builder(newBuilder);
      newBuilder.state().isInnerStatement = true;

      this._sqlEasyState.whereStates.push({
         builderType: BuilderType.WhereGroupBuilder,
         tableNameOrAlias: undefined,
         columnName: undefined,
         whereOperator: WhereOperator.None,
         raw: undefined,
         values: [],
         sqlEasyState: newBuilder.state(),
      });

      this._sqlEasyState.whereStates.push({
         builderType: BuilderType.WhereGroupEnd,
         tableNameOrAlias: "",
         columnName: "",
         whereOperator: WhereOperator.None,
         raw: "",
         values: [],
         sqlEasyState: newBuilder.state(),
      });

      return this as unknown as T;
   }

   public whereInWithBuilder = (tableNameOrAlias: string, columnName: string, builder: (builder: T) => void): T => {
      const newBuilder = this.newBuilder();
      builder(newBuilder);
      newBuilder.state().isInnerStatement = true;

      this._sqlEasyState.whereStates.push({
         builderType: BuilderType.WhereInBuilder,
         tableNameOrAlias: tableNameOrAlias,
         columnName: columnName,
         whereOperator: WhereOperator.None,
         raw: undefined,
         sqlEasyState: newBuilder.state(),
         values: [],
      });

      return this as unknown as T;
   };

   public whereInValues = (tableNameOrAlias: string, columnName: string, values: any[]): T => {
      this._sqlEasyState.whereStates.push({
         builderType: BuilderType.WhereInValues,
         tableNameOrAlias: tableNameOrAlias,
         columnName: columnName,
         whereOperator: WhereOperator.None,
         raw: undefined,
         sqlEasyState: undefined,
         values: values,
      });

      return this as unknown as T;
   };

   public whereNotExistsWithBuilder = (
      tableNameOrAlias: string,
      columnName: string,
      builder: (builder: T) => void,
   ): T => {
      const newBuilder = this.newBuilder();
      builder(newBuilder);
      newBuilder.state().isInnerStatement = true;

      this._sqlEasyState.whereStates.push({
         builderType: BuilderType.WhereNotExistsBuilder,
         tableNameOrAlias: tableNameOrAlias,
         columnName: columnName,
         whereOperator: WhereOperator.None,
         raw: undefined,
         sqlEasyState: newBuilder.state(),
         values: [],
      });

      return this as unknown as T;
   };

   public whereNotInWithBuilder = (tableNameOrAlias: string, columnName: string, builder: (builder: T) => void): T => {
      const newBuilder = this.newBuilder();
      builder(newBuilder);
      newBuilder.state().isInnerStatement = true;

      this._sqlEasyState.whereStates.push({
         builderType: BuilderType.WhereNotInBuilder,
         tableNameOrAlias: tableNameOrAlias,
         columnName: columnName,
         whereOperator: WhereOperator.None,
         raw: undefined,
         sqlEasyState: newBuilder.state(),
         values: [],
      });

      return this as unknown as T;
   };

   public whereNotInValues = (tableNameOrAlias: string, columnName: string, values: any[]): T => {
      this._sqlEasyState.whereStates.push({
         builderType: BuilderType.WhereNotInValues,
         tableNameOrAlias: tableNameOrAlias,
         columnName: columnName,
         whereOperator: WhereOperator.None,
         raw: undefined,
         sqlEasyState: undefined,
         values: values,
      });

      return this as unknown as T;
   };

   public whereNotNull = (tableNameOrAlias: string, columnName: string): T => {
      this._sqlEasyState.whereStates.push({
         builderType: BuilderType.WhereNotNull,
         tableNameOrAlias: tableNameOrAlias,
         columnName: columnName,
         whereOperator: WhereOperator.None,
         raw: undefined,
         sqlEasyState: undefined,
         values: [],
      });

      return this as unknown as T;
   };

   public whereNull = (tableNameOrAlias: string, columnName: string): T => {
      this._sqlEasyState.whereStates.push({
         builderType: BuilderType.WhereNull,
         tableNameOrAlias: tableNameOrAlias,
         columnName: columnName,
         whereOperator: WhereOperator.None,
         raw: undefined,
         sqlEasyState: undefined,
         values: [],
      });

      return this as unknown as T;
   };

   public whereRaw = (rawWhere: string): T => {
      this._sqlEasyState.whereStates.push({
         builderType: BuilderType.WhereRaw,
         tableNameOrAlias: undefined,
         columnName: undefined,
         whereOperator: WhereOperator.None,
         raw: rawWhere,
         sqlEasyState: undefined,
         values: [],
      });

      return this as unknown as T;
   };

   public whereRaws = (rawWheres: string[]): T => {
      rawWheres.forEach((rawWhere) => {
         this.whereRaw(rawWhere);
      });

      return this as unknown as T;
   };

   public groupByColumn = (tableNameOrAlias: string, columnName: string): T => {
      this._sqlEasyState.groupByStates.push({
         builderType: BuilderType.GroupByColumn,
         tableNameOrAlias: tableNameOrAlias,
         columnName: columnName,
         raw: undefined,
      });

      return this as unknown as T;
   };

   public groupByColumns = (columns: { tableNameOrAlias: string; columnName: string }[]): T => {
      columns.forEach((column) => {
         this.groupByColumn(column.tableNameOrAlias, column.columnName);
      });

      return this as unknown as T;
   };

   public groupByRaw = (rawGroupBy: string): T => {
      this._sqlEasyState.groupByStates.push({
         builderType: BuilderType.GroupByRaw,
         tableNameOrAlias: undefined,
         columnName: undefined,
         raw: rawGroupBy,
      });

      return this as unknown as T;
   };

   public groupByRaws = (rawGroupBys: string[]): T => {
      rawGroupBys.forEach((rawGroupBy) => {
         this.groupByRaw(rawGroupBy);
      });

      return this as unknown as T;
   };

   public having = (tableNameOrAlias: string, columnName: string, whereOperator: WhereOperator, value: any): T => {
      this._sqlEasyState.havingStates.push({
         builderType: BuilderType.Having,
         tableNameOrAlias: tableNameOrAlias,
         columnName: columnName,
         whereOperator: whereOperator,
         raw: undefined,
         values: [value],
      });

      return this as unknown as T;
   };

   public havingRaw = (rawHaving: string): T => {
      this._sqlEasyState.havingStates.push({
         builderType: BuilderType.HavingRaw,
         tableNameOrAlias: undefined,
         columnName: undefined,
         whereOperator: WhereOperator.None,
         raw: rawHaving,
         values: [],
      });

      return this as unknown as T;
   };

   public havingRaws = (rawHavings: string[]): T => {
      rawHavings.forEach((rawHaving) => {
         this.havingRaw(rawHaving);
      });

      return this as unknown as T;
   };

   public insertInto = (tableName: string): T => {
      this._sqlEasyState.queryType = QueryType.Insert;
      if (!this._sqlEasyState.insertState) {
         this._sqlEasyState.insertState = new InsertState();
      }
      this._sqlEasyState.insertState.owner = this._config.defaultOwner();
      this._sqlEasyState.insertState.tableName = tableName;

      return this as unknown as T;
   };

   public insertIntoWithOwner = (owner: string, tableName: string): T => {
      this._sqlEasyState.queryType = QueryType.Insert;
      if (!this._sqlEasyState.insertState) {
         this._sqlEasyState.insertState = new InsertState();
      }
      this._sqlEasyState.insertState.owner = owner;
      this._sqlEasyState.insertState.tableName = tableName;

      return this as unknown as T;
   };

   public insertColumns = (columns: string[]): T => {
      if (!this._sqlEasyState.insertState) {
         this._sqlEasyState.insertState = new InsertState();
      }
      this._sqlEasyState.insertState.columns = columns;

      return this as unknown as T;
   };

   public insertValues = (values: any[]): T => {
      if (!this._sqlEasyState.insertState) {
         this._sqlEasyState.insertState = new InsertState();
      }
      this._sqlEasyState.insertState.values.push(values);

      return this as unknown as T;
   };

   public insertRaw = (raw: string): T => {
      this._sqlEasyState.queryType = QueryType.Insert;
      if (!this._sqlEasyState.insertState) {
         this._sqlEasyState.insertState = new InsertState();
      }
      this._sqlEasyState.insertState.raw = raw;

      return this as unknown as T;
   };

   public updateTable = (tableName: string, alias: string): T => {
      this._sqlEasyState.queryType = QueryType.Update;
      this._sqlEasyState.fromStates.push({
         builderType: BuilderType.FromTable,
         owner: this._config.defaultOwner(),
         tableName: tableName,
         alias: alias,
         sqlEasyState: undefined,
         raw: undefined,
      });

      return this as unknown as T;
   };

   public updateTableWithOwner = (owner: string, tableName: string, alias: string): T => {
      this._sqlEasyState.queryType = QueryType.Update;
      this._sqlEasyState.fromStates.push({
         builderType: BuilderType.FromTable,
         owner: owner,
         tableName: tableName,
         alias: alias,
         sqlEasyState: undefined,
         raw: undefined,
      });

      return this as unknown as T;
   };

   public set = (columnName: string, value: any): T => {
      this._sqlEasyState.updateStates.push({
         builderType: BuilderType.UpdateColumn,
         columnName: columnName,
         value: value,
         raw: undefined,
      });

      return this as unknown as T;
   };

   public setColumns = (columns: { columnName: string; value: any }[]): T => {
      columns.forEach((column) => {
         this.set(column.columnName, column.value);
      });

      return this as unknown as T;
   };

   public setRaw = (raw: string): T => {
      this._sqlEasyState.updateStates.push({
         builderType: BuilderType.UpdateRaw,
         columnName: undefined,
         value: undefined,
         raw: raw,
      });

      return this as unknown as T;
   };

   public deleteFrom = (tableName: string, alias: string): T => {
      this._sqlEasyState.queryType = QueryType.Delete;
      this._sqlEasyState.fromStates.push({
         builderType: BuilderType.FromTable,
         owner: this._config.defaultOwner(),
         tableName: tableName,
         alias: alias,
         sqlEasyState: undefined,
         raw: undefined,
      });

      return this as unknown as T;
   };

   public deleteFromWithOwner = (owner: string, tableName: string, alias: string): T => {
      this._sqlEasyState.queryType = QueryType.Delete;
      this._sqlEasyState.fromStates.push({
         builderType: BuilderType.FromTable,
         owner: owner,
         tableName: tableName,
         alias: alias,
         sqlEasyState: undefined,
         raw: undefined,
      });

      return this as unknown as T;
   };

   public union = (builder: (builder: T) => void): T => {
      const newBuilder = this.newBuilder();
      builder(newBuilder);
      newBuilder.state().isInnerStatement = true;

      this._sqlEasyState.unionStates.push({
         builderType: BuilderType.Union,
         sqlEasyState: newBuilder.state(),
         raw: undefined,
      });

      return this as unknown as T;
   };

   public unionAll = (builder: (builder: T) => void): T => {
      const newBuilder = this.newBuilder();
      builder(newBuilder);
      newBuilder.state().isInnerStatement = true;

      this._sqlEasyState.unionStates.push({
         builderType: BuilderType.UnionAll,
         sqlEasyState: newBuilder.state(),
         raw: undefined,
      });

      return this as unknown as T;
   };

   public intersect = (builder: (builder: T) => void): T => {
      const newBuilder = this.newBuilder();
      builder(newBuilder);
      newBuilder.state().isInnerStatement = true;

      this._sqlEasyState.unionStates.push({
         builderType: BuilderType.Intersect,
         sqlEasyState: newBuilder.state(),
         raw: undefined,
      });

      return this as unknown as T;
   };

   public except = (builder: (builder: T) => void): T => {
      const newBuilder = this.newBuilder();
      builder(newBuilder);
      newBuilder.state().isInnerStatement = true;

      this._sqlEasyState.unionStates.push({
         builderType: BuilderType.Except,
         sqlEasyState: newBuilder.state(),
         raw: undefined,
      });

      return this as unknown as T;
   };

   public cte = (name: string, builder: (builder: T) => void): T => {
      const newBuilder = this.newBuilder();
      builder(newBuilder);
      newBuilder.state().isInnerStatement = true;

      this._sqlEasyState.cteStates.push({
         builderType: BuilderType.CteBuilder,
         name: name,
         recursive: false,
         sqlEasyState: newBuilder.state(),
         raw: undefined,
      });

      return this as unknown as T;
   };

   public cteRecursive = (name: string, builder: (builder: T) => void): T => {
      const newBuilder = this.newBuilder();
      builder(newBuilder);
      newBuilder.state().isInnerStatement = true;

      this._sqlEasyState.cteStates.push({
         builderType: BuilderType.CteBuilder,
         name: name,
         recursive: true,
         sqlEasyState: newBuilder.state(),
         raw: undefined,
      });

      return this as unknown as T;
   };

   public cteRaw = (name: string, raw: string): T => {
      this._sqlEasyState.cteStates.push({
         builderType: BuilderType.CteRaw,
         name: name,
         recursive: false,
         sqlEasyState: undefined,
         raw: raw,
      });

      return this as unknown as T;
   };
}
