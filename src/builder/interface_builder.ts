import type { IConfiguration } from "../configuration/interface_configuration";
import type { JoinType } from "../enums/join_type";
import type { OrderByDirection } from "../enums/order_by_direction";
import type { WhereOperator } from "../enums/where_operator";
import type { IParser } from "../parser/interface_parser";
import type { SqlEasyState } from "../state/sqleasy_state";
import type { IJoinOnBuilder } from "./interface_join_on_builder";

/**
 * Fluent SQL query builder interface for constructing SELECT, INSERT, UPDATE,
 * and DELETE statements with type-safe method chaining.
 *
 * Obtain an instance via {@link ISqlEasy.newBuilder} rather than constructing directly.
 *
 * @template T The concrete builder type, returned from every method for fluent chaining
 * @template U The concrete join-on builder type used in JOIN callbacks
 * @template V The concrete parser type used to render SQL
 */
export interface IBuilder<T, U extends IJoinOnBuilder<U>, V extends IParser> {
   /** Inserts an explicit AND between WHERE conditions. */
   and(): T;

   /** Resets all builder state (SELECT, FROM, JOIN, WHERE, etc.) to defaults. */
   clearAll(): T;

   /** Removes all FROM clauses from the builder. */
   clearFrom(): T;

   /** Removes all GROUP BY clauses from the builder. */
   clearGroupBy(): T;

   /** Removes all HAVING clauses from the builder. */
   clearHaving(): T;

   /** Removes all JOIN clauses from the builder. */
   clearJoin(): T;

   /** Resets the LIMIT value to zero. */
   clearLimit(): T;

   /** Resets the OFFSET value to zero. */
   clearOffset(): T;

   /** Removes all ORDER BY clauses from the builder. */
   clearOrderBy(): T;

   /** Removes all SELECT columns/expressions from the builder. */
   clearSelect(): T;

   /** Removes all WHERE conditions from the builder. */
   clearWhere(): T;

   /**
    * Defines a Common Table Expression (CTE) built from a sub-query.
    *
    * @param name The CTE name referenced in the main query
    * @param builder Callback that receives a fresh builder to define the CTE query
    */
   cte(name: string, builder: (builder: T) => void): T;

   /**
    * Defines a CTE from a raw SQL string.
    *
    * @param name The CTE name referenced in the main query
    * @param raw The raw SQL for the CTE body
    */
   cteRaw(name: string, raw: string): T;

   /**
    * Defines a recursive CTE built from a sub-query.
    *
    * @param name The CTE name referenced in the main query
    * @param builder Callback that receives a fresh builder to define the recursive CTE query
    */
   cteRecursive(name: string, builder: (builder: T) => void): T;

   /**
    * Begins a DELETE statement targeting the specified table.
    *
    * @param tableName The table to delete from
    * @param alias The alias for the table
    */
   deleteFrom(tableName: string, alias: string): T;

   /**
    * Begins a DELETE statement targeting a table with an explicit schema/owner.
    *
    * @param owner The schema or owner name
    * @param tableName The table to delete from
    * @param alias The alias for the table
    */
   deleteFromWithOwner(owner: string, tableName: string, alias: string): T;

   /** Adds DISTINCT to the SELECT clause. */
   distinct(): T;

   /**
    * Appends an EXCEPT set operation using a sub-query.
    *
    * @param builder Callback that receives a fresh builder to define the EXCEPT query
    */
   except(builder: (builder: T) => void): T;

   /**
    * Adds a FROM clause from a raw SQL string.
    *
    * @param rawFrom The raw SQL fragment for the FROM clause
    */
   fromRaw(rawFrom: string): T;

   /**
    * Adds multiple FROM clauses from raw SQL strings.
    *
    * @param rawFroms Array of raw SQL fragments for the FROM clause
    */
   fromRaws(rawFroms: string[]): T;

   /**
    * Adds a FROM clause referencing a table by name with an alias.
    *
    * @param tableName The name of the table
    * @param alias The alias to use for the table in the query
    */
   fromTable(tableName: string, alias: string): T;

   /**
    * Adds multiple FROM clauses referencing tables by name with aliases.
    *
    * @param tables Array of table definitions with `tableName` and `alias`
    */
   fromTables(
      tables: {
         tableName: string;
         alias: string;
      }[],
   ): T;

   /**
    * Adds a FROM clause referencing a table with an explicit schema/owner.
    *
    * @param owner The schema or owner name
    * @param tableName The name of the table
    * @param alias The alias to use for the table in the query
    */
   fromTableWithOwner(owner: string, tableName: string, alias: string): T;

   /**
    * Adds multiple FROM clauses referencing tables with explicit schema/owner.
    *
    * @param tablesWithOwner Array of table definitions with `owner`, `tableName`, and `alias`
    */
   fromTablesWithOwner(
      tablesWithOwner: {
         owner: string;
         tableName: string;
         alias: string;
      }[],
   ): T;

   /**
    * Adds a derived table (sub-query) to the FROM clause.
    *
    * @param alias The alias for the derived table
    * @param builder Callback that receives a fresh builder to define the sub-query
    */
   fromWithBuilder(alias: string, builder: (builder: T) => void): T;

   /**
    * Adds a GROUP BY clause for a single column.
    *
    * @param tableNameOrAlias The table name or alias qualifying the column
    * @param columnName The column to group by
    */
   groupByColumn(tableNameOrAlias: string, columnName: string): T;

   /**
    * Adds GROUP BY clauses for multiple columns.
    *
    * @param columns Array of column definitions with `tableNameOrAlias` and `columnName`
    */
   groupByColumns(columns: { tableNameOrAlias: string; columnName: string }[]): T;

   /**
    * Adds a GROUP BY clause from a raw SQL string.
    *
    * @param rawGroupBy The raw SQL fragment
    */
   groupByRaw(rawGroupBy: string): T;

   /**
    * Adds multiple GROUP BY clauses from raw SQL strings.
    *
    * @param rawGroupBys Array of raw SQL fragments
    */
   groupByRaws(rawGroupBys: string[]): T;

   /**
    * Adds a HAVING condition on a column.
    *
    * @param tableNameOrAlias The table name or alias qualifying the column
    * @param columnName The column to filter on
    * @param whereOperator The comparison operator
    * @param value The value to compare against
    */
   having(tableNameOrAlias: string, columnName: string, whereOperator: WhereOperator, value: any): T;

   /**
    * Adds a HAVING clause from a raw SQL string.
    *
    * @param rawHaving The raw SQL fragment
    */
   havingRaw(rawHaving: string): T;

   /**
    * Adds multiple HAVING clauses from raw SQL strings.
    *
    * @param rawHavings Array of raw SQL fragments
    */
   havingRaws(rawHavings: string[]): T;

   /**
    * Begins an INSERT statement targeting the specified table.
    *
    * @param tableName The table to insert into
    */
   insertInto(tableName: string): T;

   /**
    * Begins an INSERT statement targeting a table with an explicit schema/owner.
    *
    * @param owner The schema or owner name
    * @param tableName The table to insert into
    */
   insertIntoWithOwner(owner: string, tableName: string): T;

   /**
    * Sets the column names for an INSERT statement.
    *
    * @param columns Array of column names
    */
   insertColumns(columns: string[]): T;

   /**
    * Adds a row of values to the INSERT statement. Call multiple times for multi-row inserts.
    *
    * @param values Array of values corresponding to the insert columns
    */
   insertValues(values: any[]): T;

   /**
    * Sets the INSERT statement body from a raw SQL string.
    *
    * @param raw The raw SQL for the INSERT body
    */
   insertRaw(raw: string): T;

   /**
    * Appends an INTERSECT set operation using a sub-query.
    *
    * @param builder Callback that receives a fresh builder to define the INTERSECT query
    */
   intersect(builder: (builder: T) => void): T;

   /**
    * Adds a JOIN clause from a raw SQL string.
    *
    * @param rawJoin The raw SQL fragment for the JOIN
    */
   joinRaw(rawJoin: string): T;

   /**
    * Adds multiple JOIN clauses from raw SQL strings.
    *
    * @param rawJoins Array of raw SQL fragments for the JOINs
    */
   joinRaws(rawJoins: string[]): T;

   /**
    * Adds a typed JOIN to another table with ON conditions defined via a callback.
    *
    * @param joinType The type of join (INNER, LEFT, RIGHT, etc.)
    * @param tableName The table to join
    * @param alias The alias for the joined table
    * @param joinOnBuilder Callback that receives a join-on builder to define ON conditions
    */
   joinTable(joinType: JoinType, tableName: string, alias: string, joinOnBuilder: (joinOnBuilder: U) => void): T;

   /**
    * Adds multiple typed JOINs to other tables.
    *
    * @param joins Array of join definitions with `joinType`, `tableName`, `alias`, and `joinOnBuilder` callback
    */
   joinTables(
      joins: {
         joinType: JoinType;
         tableName: string;
         alias: string;
         joinOnBuilder: (joinOnBuilder: U) => void;
      }[],
   ): T;

   /**
    * Adds multiple typed JOINs to tables with explicit schema/owner.
    *
    * @param joins Array of join definitions with `joinType`, `owner`, `tableName`, `alias`, and `joinOnBuilder` callback
    */
   joinTablesWithOwner(
      joins: {
         joinType: JoinType;
         owner: string;
         tableName: string;
         alias: string;
         joinOnBuilder: (joinOnBuilder: U) => void;
      }[],
   ): T;

   /**
    * Adds a typed JOIN to a table with an explicit schema/owner and ON conditions.
    *
    * @param joinType The type of join (INNER, LEFT, RIGHT, etc.)
    * @param owner The schema or owner name
    * @param tableName The table to join
    * @param alias The alias for the joined table
    * @param joinOnBuilder Callback that receives a join-on builder to define ON conditions
    */
   joinTableWithOwner(
      joinType: JoinType,
      owner: string,
      tableName: string,
      alias: string,
      joinOnBuilder: (joinOnBuilder: U) => void,
   ): T;

   /**
    * Adds a JOIN to a derived table (sub-query) with ON conditions.
    *
    * @param joinType The type of join (INNER, LEFT, RIGHT, etc.)
    * @param alias The alias for the derived table
    * @param builder Callback that receives a fresh builder to define the sub-query
    * @param joinOnBuilder Callback that receives a join-on builder to define ON conditions
    */
   joinWithBuilder(
      joinType: JoinType,
      alias: string,
      builder: (builder: T) => void,
      joinOnBuilder: (joinOnBuilder: U) => void,
   ): T;

   /**
    * Sets the maximum number of rows to return.
    *
    * @param limit The row limit
    */
   limit(limit: number): T;

   /**
    * Creates a new builder instance, optionally with a different configuration.
    *
    * @param config Optional configuration override
    */
   newBuilder(config?: IConfiguration): T;

   /**
    * Creates a new join-on builder instance, optionally with a different configuration.
    *
    * @param config Optional configuration override
    */
   newJoinOnBuilder(config?: IConfiguration): U;

   /**
    * Creates a new parser instance, optionally with a different configuration.
    *
    * @param config Optional configuration override
    */
   newParser(config?: IConfiguration): V;

   /**
    * Sets the number of rows to skip before returning results.
    *
    * @param offset The row offset
    */
   offset(offset: number): T;

   /** Inserts an explicit OR between WHERE conditions. */
   or(): T;

   /**
    * Adds an ORDER BY clause for a single column.
    *
    * @param tableNameOrAlias The table name or alias qualifying the column
    * @param columnName The column to order by
    * @param direction The sort direction (ascending or descending)
    */
   orderByColumn(tableNameOrAlias: string, columnName: string, direction: OrderByDirection): T;

   /**
    * Adds ORDER BY clauses for multiple columns.
    *
    * @param columns Array of column definitions with `tableNameOrAlias`, `columnName`, and `direction`
    */
   orderByColumns(
      columns: {
         tableNameOrAlias: string;
         columnName: string;
         direction: OrderByDirection;
      }[],
   ): T;

   /**
    * Adds an ORDER BY clause from a raw SQL string.
    *
    * @param rawOrderBy The raw SQL fragment
    */
   orderByRaw(rawOrderBy: string): T;

   /**
    * Adds multiple ORDER BY clauses from raw SQL strings.
    *
    * @param rawOrderBys Array of raw SQL fragments
    */
   orderByRaws(rawOrderBys: string[]): T;

   /**
    * Renders the built query as a prepared SQL string with parameter placeholders.
    * The placeholder style is dialect-specific (e.g. `?` for MySQL/MSSQL, `$` for Postgres).
    */
   parse(): string;

   /**
    * Renders the built query as a raw SQL string with values inlined.
    * Useful for debugging or contexts where prepared statements are not supported.
    */
   parseRaw(): string;

   /** Adds `SELECT *` to the query. */
   selectAll(): T;

   /**
    * Adds a single column to the SELECT clause.
    *
    * @param tableNameOrAlias The table name or alias qualifying the column
    * @param columnName The column name
    * @param columnAlias The alias for the column in the result set (empty string for no alias)
    */
   selectColumn(tableNameOrAlias: string, columnName: string, columnAlias: string): T;

   /**
    * Adds multiple columns to the SELECT clause.
    *
    * @param columns Array of column definitions with `tableNameOrAlias`, `columnName`, and `columnAlias`
    */
   selectColumns(
      columns: {
         tableNameOrAlias: string;
         columnName: string;
         columnAlias: string;
      }[],
   ): T;

   /**
    * Adds a raw SQL expression to the SELECT clause.
    *
    * @param rawSelect The raw SQL expression (e.g. `"COUNT(*) AS total"`)
    */
   selectRaw(rawSelect: string): T;

   /**
    * Adds multiple raw SQL expressions to the SELECT clause.
    *
    * @param rawSelects Array of raw SQL expressions
    */
   selectRaws(rawSelects: string[]): T;

   /**
    * Adds a scalar sub-query to the SELECT clause.
    *
    * @param alias The alias for the sub-query result column
    * @param builder Callback that receives a fresh builder to define the sub-query
    */
   selectWithBuilder(alias: string, builder: (builder: T) => void): T;

   /**
    * Adds a SET clause for an UPDATE statement, setting a column to a value.
    *
    * @param columnName The column to update
    * @param value The new value
    */
   set(columnName: string, value: any): T;

   /**
    * Adds multiple SET clauses for an UPDATE statement.
    *
    * @param columns Array of column/value pairs with `columnName` and `value`
    */
   setColumns(columns: { columnName: string; value: any }[]): T;

   /**
    * Adds a raw SQL SET clause for an UPDATE statement.
    *
    * @param raw The raw SQL fragment for the SET clause
    */
   setRaw(raw: string): T;

   /** Returns the internal {@link SqlEasyState} representing the current builder state. */
   state(): SqlEasyState;

   /**
    * Appends a UNION set operation using a sub-query.
    *
    * @param builder Callback that receives a fresh builder to define the UNION query
    */
   union(builder: (builder: T) => void): T;

   /**
    * Appends a UNION ALL set operation using a sub-query.
    *
    * @param builder Callback that receives a fresh builder to define the UNION ALL query
    */
   unionAll(builder: (builder: T) => void): T;

   /**
    * Begins an UPDATE statement targeting the specified table.
    *
    * @param tableName The table to update
    * @param alias The alias for the table
    */
   updateTable(tableName: string, alias: string): T;

   /**
    * Begins an UPDATE statement targeting a table with an explicit schema/owner.
    *
    * @param owner The schema or owner name
    * @param tableName The table to update
    * @param alias The alias for the table
    */
   updateTableWithOwner(owner: string, tableName: string, alias: string): T;

   /**
    * Adds a WHERE condition comparing a column to a value.
    *
    * @param tableNameOrAlias The table name or alias qualifying the column
    * @param columnName The column to filter on
    * @param whereOperator The comparison operator
    * @param value The value to compare against
    */
   where(tableNameOrAlias: string, columnName: string, whereOperator: WhereOperator, value: any): T;

   /**
    * Adds a WHERE BETWEEN condition.
    *
    * @param tableNameOrAlias The table name or alias qualifying the column
    * @param columnName The column to filter on
    * @param value1 The lower bound
    * @param value2 The upper bound
    */
   whereBetween(tableNameOrAlias: string, columnName: string, value1: any, value2: any): T;

   /**
    * Adds a WHERE EXISTS condition using a correlated sub-query.
    *
    * @param tableNameOrAlias The table name or alias qualifying the column
    * @param columnName The column name
    * @param builder Callback that receives a fresh builder to define the sub-query
    */
   whereExistsWithBuilder(tableNameOrAlias: string, columnName: string, builder: (builder: T) => void): T;

   /**
    * Groups WHERE conditions inside parentheses for precedence control.
    *
    * @param builder Callback that receives a fresh builder to define the grouped conditions
    */
   whereGroup(builder: (builder: T) => void): T;

   /**
    * Adds a WHERE IN condition using a sub-query.
    *
    * @param tableNameOrAlias The table name or alias qualifying the column
    * @param columnName The column to filter on
    * @param builder Callback that receives a fresh builder to define the sub-query
    */
   whereInWithBuilder(tableNameOrAlias: string, columnName: string, builder: (builder: T) => void): T;

   /**
    * Adds a WHERE IN condition with an explicit list of values.
    *
    * @param tableNameOrAlias The table name or alias qualifying the column
    * @param columnName The column to filter on
    * @param values The list of values
    */
   whereInValues(tableNameOrAlias: string, columnName: string, values: any[]): T;

   /**
    * Adds a WHERE NOT EXISTS condition using a correlated sub-query.
    *
    * @param tableNameOrAlias The table name or alias qualifying the column
    * @param columnName The column name
    * @param builder Callback that receives a fresh builder to define the sub-query
    */
   whereNotExistsWithBuilder(tableNameOrAlias: string, columnName: string, builder: (builder: T) => void): T;

   /**
    * Adds a WHERE NOT IN condition using a sub-query.
    *
    * @param tableNameOrAlias The table name or alias qualifying the column
    * @param columnName The column to filter on
    * @param builder Callback that receives a fresh builder to define the sub-query
    */
   whereNotInWithBuilder(tableNameOrAlias: string, columnName: string, builder: (builder: T) => void): T;

   /**
    * Adds a WHERE NOT IN condition with an explicit list of values.
    *
    * @param tableNameOrAlias The table name or alias qualifying the column
    * @param columnName The column to filter on
    * @param values The list of values
    */
   whereNotInValues(tableNameOrAlias: string, columnName: string, values: any[]): T;

   /**
    * Adds a WHERE column IS NOT NULL condition.
    *
    * @param tableNameOrAlias The table name or alias qualifying the column
    * @param columnName The column to check
    */
   whereNotNull(tableNameOrAlias: string, columnName: string): T;

   /**
    * Adds a WHERE column IS NULL condition.
    *
    * @param tableNameOrAlias The table name or alias qualifying the column
    * @param columnName The column to check
    */
   whereNull(tableNameOrAlias: string, columnName: string): T;

   /**
    * Adds a WHERE clause from a raw SQL string.
    *
    * @param rawWhere The raw SQL fragment
    */
   whereRaw(rawWhere: string): T;

   /**
    * Adds multiple WHERE clauses from raw SQL strings.
    *
    * @param rawWheres Array of raw SQL fragments
    */
   whereRaws(rawWheres: string[]): T;
}
