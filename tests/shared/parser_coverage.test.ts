import { describe, expect, it } from "vitest";
import { SqliteSqlEasy, PostgresSqlEasy, WhereOperator, QueryType, JoinType, JoinOperator } from "../../src";
import { SqlHelper } from "../../src/helpers/sql_helper";
import { SqliteConfiguration } from "../../src/sqleasy/sqlite/sqlite_configuration";
import { PostgresConfiguration } from "../../src/sqleasy/postgres/postgres_configuration";
import { RuntimeConfiguration } from "../../src/configuration/runtime_configuration";
import { SqliteJoinOnBuilder } from "../../src/sqleasy/sqlite/sqlite_join_on_builder";
import { PostgresJoinOnBuilder } from "../../src/sqleasy/postgres/postgres_join_on_builder";
import { BuilderType } from "../../src/enums/builder_type";
import { JoinOnOperator } from "../../src/enums/join_on_operator";
import { WhereOperator as WO } from "../../src/enums/where_operator";
import { ParserMode } from "../../src/enums/parser_mode";

describe("Parser coverage edge cases", () => {
   describe("default_from.ts", () => {
      it("throws when no FROM tables specified for a SELECT", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder.selectAll();

         expect(() => builder.parseRaw()).toThrow("No tables to select from");
      });

      it("fromWithBuilder followed by fromTable produces trailing comma", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder
            .selectAll()
            .fromWithBuilder("sub", (sb) => {
               sb.selectAll().fromTable("users", "u");
            })
            .fromTable("orders", "o");

         const sql = builder.parseRaw();
         expect(sql).toEqual(
            'SELECT * FROM (SELECT * FROM "users" AS "u") AS "sub", "orders" AS "o";',
         );
      });
   });

   describe("default_select.ts", () => {
      it("throws when no select states are present", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder.fromTable("users", "u");

         expect(() => builder.parseRaw()).toThrow(
            "Select statement must have at least one select state",
         );
      });

      it("selectWithBuilder followed by selectColumn produces trailing comma", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder
            .selectWithBuilder("total", (sb) => {
               sb.selectRaw("COUNT(*)").fromTable("orders", "o");
            })
            .selectColumn("u", "name", "")
            .fromTable("users", "u");

         const sql = builder.parseRaw();
         expect(sql).toEqual(
            'SELECT (SELECT COUNT(*) FROM "orders" AS "o") AS "total", "u"."name" FROM "users" AS "u";',
         );
      });
   });

   describe("sql_helper.ts", () => {
      it("getSqlDebug with more values than placeholders skips extra values", () => {
         const rc = new RuntimeConfiguration();
         const config = new SqliteConfiguration(rc);
         const helper = new SqlHelper(config, ParserMode.Prepared);

         helper.addSqlSnippet("SELECT * FROM users WHERE id = ");
         const p1 = helper.addDynamicValue(42);
         helper.addSqlSnippet(p1);
         helper.addDynamicValue(99);

         const debug = helper.getSqlDebug();
         expect(debug).toEqual("SELECT * FROM users WHERE id = 42");
      });

      it("getValueStringFromDataType with symbol type hits default branch", () => {
         const rc = new RuntimeConfiguration();
         const config = new SqliteConfiguration(rc);
         const helper = new SqlHelper(config, ParserMode.Raw);

         const sym = Symbol("test");
         const result = helper.getValueStringFromDataType(sym);
         expect(result).toEqual("Symbol(test)");
      });

      it("getValueStringFromDataType with bigint type hits default branch", () => {
         const rc = new RuntimeConfiguration();
         const config = new SqliteConfiguration(rc);
         const helper = new SqlHelper(config, ParserMode.Raw);

         const big = BigInt(9007199254740991);
         const result = helper.getValueStringFromDataType(big);
         expect(result).toEqual("9007199254740991");
      });
   });

   describe("default_order_by.ts", () => {
      it("returns empty SQL when no orderBy states exist", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder.selectAll().fromTable("users", "u");

         const sql = builder.parseRaw();
         expect(sql).not.toContain("ORDER BY");
      });
   });

   describe("default_cte.ts", () => {
      it("returns empty SQL when no CTE states exist", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder.selectAll().fromTable("users", "u");

         const sql = builder.parseRaw();
         expect(sql).not.toContain("WITH");
      });
   });

   describe("default_group_by.ts", () => {
      it("returns empty SQL when no groupBy states exist", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder.selectAll().fromTable("users", "u");

         const sql = builder.parseRaw();
         expect(sql).not.toContain("GROUP BY");
      });
   });

   describe("default_delete.ts", () => {
      it("throws when delete has no from table", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();

         builder.selectAll();
         builder.state().queryType = QueryType.Delete;
         builder.state().fromStates = [];

         expect(() => builder.parseRaw()).toThrow("DELETE requires a table");
      });
   });

   describe("default_insert.ts", () => {
      it("throws when no insert state is provided", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();

         builder.state().queryType = QueryType.Insert;
         builder.state().insertState = undefined;

         expect(() => builder.parseRaw()).toThrow("No insert state provided");
      });
   });

   describe("default_update.ts", () => {
      it("throws when update has no from table", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();

         builder.updateTable("users", "u");
         builder.state().fromStates = [];

         expect(() => builder.parseRaw()).toThrow("UPDATE requires a table");
      });

      it("throws when update has no SET columns", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();

         builder.updateTable("users", "u");
         builder.state().updateStates = [];

         expect(() => builder.parseRaw()).toThrow(
            "UPDATE requires at least one SET column",
         );
      });
   });

   describe("default_having.ts", () => {
      it("throws when HAVING used without GROUP BY", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder
            .selectAll()
            .fromTable("users", "u")
            .having("u", "id", WhereOperator.Equals, 1);

         expect(() => builder.parseRaw()).toThrow(
            "HAVING requires a GROUP BY clause",
         );
      });

      it("returns empty SQL when no having states exist", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder
            .selectColumn("u", "status", "")
            .selectRaw("COUNT(*) AS cnt")
            .fromTable("users", "u")
            .groupByColumn("u", "status");

         const sql = builder.parseRaw();
         expect(sql).not.toContain("HAVING");
      });
   });

   describe("default_where.ts", () => {
      it("throws when first WHERE operator is AND", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder.selectAll().fromTable("users", "u").and();

         expect(() => builder.parseRaw()).toThrow(
            "First WHERE operator cannot be AND or OR",
         );
      });

      it("throws when first WHERE operator is OR", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder.selectAll().fromTable("users", "u").or();

         expect(() => builder.parseRaw()).toThrow(
            "First WHERE operator cannot be AND or OR",
         );
      });

      it("throws when AND is used as last WHERE operator", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder
            .selectAll()
            .fromTable("users", "u")
            .where("u", "id", WhereOperator.Equals, 1)
            .and();

         expect(() => builder.parseRaw()).toThrow(
            "AND or OR cannot be used as the last WHERE operator",
         );
      });

      it("throws when OR is used as last WHERE operator", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder
            .selectAll()
            .fromTable("users", "u")
            .where("u", "id", WhereOperator.Equals, 1)
            .or();

         expect(() => builder.parseRaw()).toThrow(
            "AND or OR cannot be used as the last WHERE operator",
         );
      });

      it("throws when AND is used consecutively", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder
            .selectAll()
            .fromTable("users", "u")
            .where("u", "id", WhereOperator.Equals, 1)
            .and()
            .and()
            .where("u", "name", WhereOperator.Equals, "test");

         expect(() => builder.parseRaw()).toThrow(
            "AND or OR cannot be used consecutively",
         );
      });

      it("throws when OR is used consecutively", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder
            .selectAll()
            .fromTable("users", "u")
            .where("u", "id", WhereOperator.Equals, 1)
            .or()
            .or()
            .where("u", "name", WhereOperator.Equals, "test");

         expect(() => builder.parseRaw()).toThrow(
            "AND or OR cannot be used consecutively",
         );
      });

      it("throws when AND or OR is the last WHERE operator", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder
            .selectAll()
            .fromTable("users", "u")
            .where("u", "id", WhereOperator.Equals, 1)
            .and();

         expect(() => builder.parseRaw()).toThrow(
            "AND or OR cannot be used as the last WHERE operator",
         );
      });

      it("throws when AND is used after group begin", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder.selectAll().fromTable("users", "u");
         builder.state().whereStates.push(
            { builderType: BuilderType.WhereGroupBegin, tableNameOrAlias: undefined, columnName: undefined, whereOperator: WO.None, raw: undefined, sqlEasyState: undefined, values: [] },
            { builderType: BuilderType.And, tableNameOrAlias: undefined, columnName: undefined, whereOperator: WO.None, raw: undefined, sqlEasyState: undefined, values: [] },
            { builderType: BuilderType.Where, tableNameOrAlias: "u", columnName: "id", whereOperator: WO.Equals, raw: undefined, sqlEasyState: undefined, values: [1] },
         );

         expect(() => builder.parseRaw()).toThrow(
            "AND or OR cannot be used directly after a group begin",
         );
      });

      it("throws when group begin is the last operator", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder.selectAll().fromTable("users", "u");
         builder.state().whereStates.push(
            { builderType: BuilderType.WhereGroupBegin, tableNameOrAlias: undefined, columnName: undefined, whereOperator: WO.None, raw: undefined, sqlEasyState: undefined, values: [] },
         );

         expect(() => builder.parseRaw()).toThrow(
            "Group begin cannot be the last WHERE operator",
         );
      });

      it("throws when group end is the first operator", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder.selectAll().fromTable("users", "u");
         builder.state().whereStates.push(
            { builderType: BuilderType.WhereGroupEnd, tableNameOrAlias: undefined, columnName: undefined, whereOperator: WO.None, raw: undefined, sqlEasyState: undefined, values: [] },
         );

         expect(() => builder.parseRaw()).toThrow(
            "Group end cannot be the first WHERE operator",
         );
      });

      it("group end followed by another group end suppresses trailing space", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder.selectAll().fromTable("users", "u")
            .where("u", "id", WhereOperator.Equals, 1);
         builder.state().whereStates.push(
            { builderType: BuilderType.WhereGroupEnd, tableNameOrAlias: "", columnName: "", whereOperator: WO.None, raw: "", sqlEasyState: undefined, values: [] },
            { builderType: BuilderType.WhereGroupEnd, tableNameOrAlias: "", columnName: "", whereOperator: WO.None, raw: "", sqlEasyState: undefined, values: [] },
         );

         const sql = builder.parseRaw();
         expect(sql).toContain("))");
      });
   });

   describe("JoinOnBuilder config override", () => {
      it("SQLite newJoinOnBuilder with config override", () => {
         const rc = new RuntimeConfiguration();
         const config = new SqliteConfiguration(rc);
         const jb = new SqliteJoinOnBuilder(config);
         const rc2 = new RuntimeConfiguration();
         const config2 = new SqliteConfiguration(rc2);
         const jb2 = jb.newJoinOnBuilder(config2);
         expect(jb2).toBeInstanceOf(SqliteJoinOnBuilder);
      });

      it("Postgres newJoinOnBuilder with config override", () => {
         const rc = new RuntimeConfiguration();
         const config = new PostgresConfiguration(rc);
         const jb = new PostgresJoinOnBuilder(config);
         const rc2 = new RuntimeConfiguration();
         const config2 = new PostgresConfiguration(rc2);
         const jb2 = jb.newJoinOnBuilder(config2);
         expect(jb2).toBeInstanceOf(PostgresJoinOnBuilder);
      });
   });

   describe("Postgres configuration full coverage", () => {
      it("covers stringDelimiter and transactionDelimiters", () => {
         const rc = new RuntimeConfiguration();
         const config = new PostgresConfiguration(rc);
         expect(config.stringDelimiter()).toEqual("'");
         expect(config.transactionDelimiters().begin).toEqual("BEGIN");
         expect(config.transactionDelimiters().end).toEqual("COMMIT");
      });
   });

   describe("defaultJoin validation errors", () => {
      it("throws when first ON operator is AND", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder.selectAll().fromTable("users", "u");
         builder.state().joinStates.push({
            builderType: BuilderType.JoinTable,
            joinType: JoinType.Inner,
            owner: "",
            tableName: "orders",
            alias: "o",
            sqlEasyState: undefined,
            raw: undefined,
            joinOnStates: [
               { joinOperator: JoinOperator.None, joinOnOperator: JoinOnOperator.And, aliasLeft: undefined, columnLeft: undefined, aliasRight: undefined, columnRight: undefined, raw: undefined, valueRight: undefined },
            ],
         });

         expect(() => builder.parseRaw()).toThrow("First JOIN ON operator cannot be AND or OR");
      });

      it("throws when last ON operator is AND", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder.selectAll().fromTable("users", "u");
         builder.state().joinStates.push({
            builderType: BuilderType.JoinTable,
            joinType: JoinType.Inner,
            owner: "",
            tableName: "orders",
            alias: "o",
            sqlEasyState: undefined,
            raw: undefined,
            joinOnStates: [
               { joinOperator: JoinOperator.Equals, joinOnOperator: JoinOnOperator.On, aliasLeft: "u", columnLeft: "id", aliasRight: "o", columnRight: "user_id", raw: undefined, valueRight: undefined },
               { joinOperator: JoinOperator.None, joinOnOperator: JoinOnOperator.And, aliasLeft: undefined, columnLeft: undefined, aliasRight: undefined, columnRight: undefined, raw: undefined, valueRight: undefined },
            ],
         });

         expect(() => builder.parseRaw()).toThrow("AND or OR cannot be used as the last JOIN ON operator");
      });

      it("throws when AND used consecutively in ON", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder.selectAll().fromTable("users", "u");
         builder.state().joinStates.push({
            builderType: BuilderType.JoinTable,
            joinType: JoinType.Inner,
            owner: "",
            tableName: "orders",
            alias: "o",
            sqlEasyState: undefined,
            raw: undefined,
            joinOnStates: [
               { joinOperator: JoinOperator.Equals, joinOnOperator: JoinOnOperator.On, aliasLeft: "u", columnLeft: "id", aliasRight: "o", columnRight: "user_id", raw: undefined, valueRight: undefined },
               { joinOperator: JoinOperator.None, joinOnOperator: JoinOnOperator.And, aliasLeft: undefined, columnLeft: undefined, aliasRight: undefined, columnRight: undefined, raw: undefined, valueRight: undefined },
               { joinOperator: JoinOperator.None, joinOnOperator: JoinOnOperator.And, aliasLeft: undefined, columnLeft: undefined, aliasRight: undefined, columnRight: undefined, raw: undefined, valueRight: undefined },
               { joinOperator: JoinOperator.Equals, joinOnOperator: JoinOnOperator.On, aliasLeft: "u", columnLeft: "id2", aliasRight: "o", columnRight: "id2", raw: undefined, valueRight: undefined },
            ],
         });

         expect(() => builder.parseRaw()).toThrow("AND or OR cannot be used consecutively");
      });

      it("throws when AND used after group begin in ON", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder.selectAll().fromTable("users", "u");
         builder.state().joinStates.push({
            builderType: BuilderType.JoinTable,
            joinType: JoinType.Inner,
            owner: "",
            tableName: "orders",
            alias: "o",
            sqlEasyState: undefined,
            raw: undefined,
            joinOnStates: [
               { joinOperator: JoinOperator.None, joinOnOperator: JoinOnOperator.GroupBegin, aliasLeft: undefined, columnLeft: undefined, aliasRight: undefined, columnRight: undefined, raw: undefined, valueRight: undefined },
               { joinOperator: JoinOperator.None, joinOnOperator: JoinOnOperator.And, aliasLeft: undefined, columnLeft: undefined, aliasRight: undefined, columnRight: undefined, raw: undefined, valueRight: undefined },
               { joinOperator: JoinOperator.Equals, joinOnOperator: JoinOnOperator.On, aliasLeft: "u", columnLeft: "id", aliasRight: "o", columnRight: "uid", raw: undefined, valueRight: undefined },
            ],
         });

         expect(() => builder.parseRaw()).toThrow("AND or OR cannot be used directly after a group begin");
      });

      it("throws when group begin is last ON operator", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder.selectAll().fromTable("users", "u");
         builder.state().joinStates.push({
            builderType: BuilderType.JoinTable,
            joinType: JoinType.Inner,
            owner: "",
            tableName: "orders",
            alias: "o",
            sqlEasyState: undefined,
            raw: undefined,
            joinOnStates: [
               { joinOperator: JoinOperator.None, joinOnOperator: JoinOnOperator.GroupBegin, aliasLeft: undefined, columnLeft: undefined, aliasRight: undefined, columnRight: undefined, raw: undefined, valueRight: undefined },
            ],
         });

         expect(() => builder.parseRaw()).toThrow("Group begin cannot be the last JOIN ON operator");
      });

      it("throws when group end is first ON operator", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder.selectAll().fromTable("users", "u");
         builder.state().joinStates.push({
            builderType: BuilderType.JoinTable,
            joinType: JoinType.Inner,
            owner: "",
            tableName: "orders",
            alias: "o",
            sqlEasyState: undefined,
            raw: undefined,
            joinOnStates: [
               { joinOperator: JoinOperator.None, joinOnOperator: JoinOnOperator.GroupEnd, aliasLeft: undefined, columnLeft: undefined, aliasRight: undefined, columnRight: undefined, raw: undefined, valueRight: undefined },
            ],
         });

         expect(() => builder.parseRaw()).toThrow("Group end cannot be the first JOIN ON operator");
      });

      it("group end followed by another state adds trailing space", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder.selectAll().fromTable("users", "u");
         builder.state().joinStates.push({
            builderType: BuilderType.JoinTable,
            joinType: JoinType.Inner,
            owner: "",
            tableName: "orders",
            alias: "o",
            sqlEasyState: undefined,
            raw: undefined,
            joinOnStates: [
               { joinOperator: JoinOperator.Equals, joinOnOperator: JoinOnOperator.On, aliasLeft: "u", columnLeft: "id", aliasRight: "o", columnRight: "uid", raw: undefined, valueRight: undefined },
               { joinOperator: JoinOperator.None, joinOnOperator: JoinOnOperator.And, aliasLeft: undefined, columnLeft: undefined, aliasRight: undefined, columnRight: undefined, raw: undefined, valueRight: undefined },
               { joinOperator: JoinOperator.None, joinOnOperator: JoinOnOperator.GroupBegin, aliasLeft: undefined, columnLeft: undefined, aliasRight: undefined, columnRight: undefined, raw: undefined, valueRight: undefined },
               { joinOperator: JoinOperator.Equals, joinOnOperator: JoinOnOperator.On, aliasLeft: "o", columnLeft: "active", aliasRight: "u", columnRight: "active", raw: undefined, valueRight: undefined },
               { joinOperator: JoinOperator.None, joinOnOperator: JoinOnOperator.GroupEnd, aliasLeft: undefined, columnLeft: undefined, aliasRight: undefined, columnRight: undefined, raw: undefined, valueRight: undefined },
            ],
         });

         const sql = builder.parseRaw();
         expect(sql).toContain("ON ");
         expect(sql).toContain("(");
         expect(sql).toContain(")");
      });

      it("raw ON followed by another state adds trailing space", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder.selectAll().fromTable("users", "u")
            .joinTable(JoinType.Inner, "orders", "o", (jb) => {
               jb.onRaw("1 = 1").and().on("u", "id", JoinOperator.Equals, "o", "uid");
            });

         const sql = builder.parseRaw();
         expect(sql).toContain("ON 1 = 1 AND");
      });
   });

   describe("default_having edge cases", () => {
      it("having AND between conditions", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder
            .selectColumn("u", "role", "")
            .selectRaw("COUNT(*) AS cnt")
            .fromTable("users", "u")
            .groupByColumn("u", "role");
         builder.state().havingStates.push(
            { builderType: BuilderType.Having, tableNameOrAlias: "u", columnName: "role", whereOperator: WO.Equals, raw: undefined, values: ["admin"] },
            { builderType: BuilderType.And, tableNameOrAlias: undefined, columnName: undefined, whereOperator: WO.None, raw: undefined, values: [] },
            { builderType: BuilderType.Having, tableNameOrAlias: "u", columnName: "cnt", whereOperator: WO.GreaterThan, raw: undefined, values: [5] },
         );

         const sql = builder.parseRaw();
         expect(sql).toContain("HAVING");
         expect(sql).toContain("AND");
      });

      it("having OR between conditions", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder
            .selectColumn("u", "role", "")
            .selectRaw("COUNT(*) AS cnt")
            .fromTable("users", "u")
            .groupByColumn("u", "role");
         builder.state().havingStates.push(
            { builderType: BuilderType.Having, tableNameOrAlias: "u", columnName: "role", whereOperator: WO.Equals, raw: undefined, values: ["admin"] },
            { builderType: BuilderType.Or, tableNameOrAlias: undefined, columnName: undefined, whereOperator: WO.None, raw: undefined, values: [] },
            { builderType: BuilderType.Having, tableNameOrAlias: "u", columnName: "cnt", whereOperator: WO.LessThan, raw: undefined, values: [10] },
         );

         const sql = builder.parseRaw();
         expect(sql).toContain("HAVING");
         expect(sql).toContain("OR");
      });

      it("throws when first having operator is AND", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder.selectRaw("COUNT(*) AS cnt").fromTable("users", "u").groupByColumn("u", "role");
         builder.state().havingStates.push(
            { builderType: BuilderType.And, tableNameOrAlias: undefined, columnName: undefined, whereOperator: WO.None, raw: undefined, values: [] },
         );

         expect(() => builder.parseRaw()).toThrow("First HAVING operator cannot be AND or OR");
      });
   });

   describe("default_parser protected config getter", () => {
      it("parser uses config from getter", () => {
         const sqlEasy = new PostgresSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder.selectAll().fromTable("users", "u")
            .where("u", "id", WhereOperator.Equals, 1);
         const sql = builder.parseRaw();
         expect(sql).toContain('"public"');
      });
   });

   describe("builder insertIntoWithOwner and deleteFromWithOwner", () => {
      it("insertIntoWithOwner sets owner correctly", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder.insertIntoWithOwner("main", "users").insertColumns(["name"]).insertValues(["John"]);
         const sql = builder.parseRaw();
         expect(sql).toContain('"main"."users"');
      });

      it("deleteFromWithOwner sets owner correctly", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder.deleteFromWithOwner("main", "users", "u")
            .where("u", "id", WhereOperator.Equals, 1);
         const sql = builder.parseRaw();
         expect(sql).toContain('"main"."users"');
      });

      it("updateTableWithOwner sets owner correctly", () => {
         const sqlEasy = new SqliteSqlEasy();
         const builder = sqlEasy.newBuilder();
         builder.updateTableWithOwner("main", "users", "u")
            .set("name", "Jane")
            .where("u", "id", WhereOperator.Equals, 1);
         const sql = builder.parseRaw();
         expect(sql).toContain('"main"."users"');
      });
   });
});
