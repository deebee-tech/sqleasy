import { describe, expect, it } from "vitest";
import { MssqlSqlEasy, WhereOperator } from "../../src";

describe("MssqlSqlEasy select", () => {
   it("select all (with TOP 1000 safety net)", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT TOP (1000) * FROM [dbo].[users] AS [u];");
   });

   it("select all with WHERE (no TOP safety net)", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM [dbo].[users] AS [u] WHERE [u].[id] = 1;");
   });

   it("selectColumn with alias", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectColumn("u", "name", "userName").fromTable("users", "u").where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT [u].[name] AS [userName] FROM [dbo].[users] AS [u] WHERE [u].[id] = 1;");
   });

   it("selectColumn without alias (empty string)", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectColumn("u", "name", "").fromTable("users", "u").where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT [u].[name] FROM [dbo].[users] AS [u] WHERE [u].[id] = 1;");
   });

   it("selectColumns (multiple)", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumns([
            { tableNameOrAlias: "u", columnName: "id", columnAlias: "userId" },
            { tableNameOrAlias: "u", columnName: "name", columnAlias: "userName" },
            { tableNameOrAlias: "u", columnName: "email", columnAlias: "" },
         ])
         .fromTable("users", "u")
         .where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT [u].[id] AS [userId], [u].[name] AS [userName], [u].[email] FROM [dbo].[users] AS [u] WHERE [u].[id] = 1;",
      );
   });

   it("selectRaw", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectRaw("COUNT(*) AS total").fromTable("users", "u").where("u", "active", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT COUNT(*) AS total FROM [dbo].[users] AS [u] WHERE [u].[active] = 1;");
   });

   it("selectRaws", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectRaws(["COUNT(*) AS total", "MAX([u].[age]) AS maxAge"])
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT COUNT(*) AS total, MAX([u].[age]) AS maxAge FROM [dbo].[users] AS [u] WHERE [u].[active] = 1;",
      );
   });

   it("selectWithBuilder (subquery in SELECT)", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "name", "userName")
         .selectWithBuilder("orderCount", (b) => {
            b.selectRaw("COUNT(*)").fromTable("orders", "o").whereRaw("[o].[user_id] = [u].[id]");
         })
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT [u].[name] AS [userName], (SELECT COUNT(*) FROM [dbo].[orders] AS [o] WHERE [o].[user_id] = [u].[id]) AS [orderCount] FROM [dbo].[users] AS [u] WHERE [u].[active] = 1;",
      );
   });

   it("distinct", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.distinct().selectAll().fromTable("users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT DISTINCT TOP (1000) * FROM [dbo].[users] AS [u];");
   });

   it("distinct with top", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.distinct().selectAll().fromTable("users", "u").top(10);

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT DISTINCT TOP (10) * FROM [dbo].[users] AS [u];");
   });
});

describe("MssqlSqlEasy parse (prepared statements)", () => {
   it("parse select with where - sp_executesql format", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "id", WhereOperator.Equals, 42);

      const sql = builder.parse();
      expect(sql).toContain("exec sp_executesql");
      expect(sql).toContain("@p0 tinyint");
      expect(sql).toContain("@p0 = 42");
   });

   it("parse with string parameter", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "name", WhereOperator.Equals, "John");

      const sql = builder.parse();
      expect(sql).toContain("@p0 nvarchar(max)");
      expect(sql).toContain("@p0 = John");
   });

   it("parse with multiple parameters of different types", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "id", WhereOperator.Equals, 42)
         .and()
         .where("u", "active", WhereOperator.Equals, true);

      const sql = builder.parse();
      expect(sql).toContain("@p0 tinyint");
      expect(sql).toContain("@p1 bit");
      expect(sql).toContain(", @p1 = true");
   });

   it("parse with boolean parameter", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "active", WhereOperator.Equals, true);

      const sql = builder.parse();
      expect(sql).toContain("@p0 bit");
   });

   it("parse with float parameter", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "score", WhereOperator.Equals, 3.14);

      const sql = builder.parse();
      expect(sql).toContain("@p0 float");
   });

   it("parse with tinyint value (0-127)", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "status", WhereOperator.Equals, 5);

      const sql = builder.parse();
      expect(sql).toContain("@p0 tinyint");
   });

   it("parse with smallint value (128-32767)", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "code", WhereOperator.Equals, 1000);

      const sql = builder.parse();
      expect(sql).toContain("@p0 smallint");
   });

   it("parse with bigint value", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "bigId", WhereOperator.Equals, 9999999999);

      const sql = builder.parse();
      expect(sql).toContain("@p0 bigint");
   });

   it("parse with negative tinyint", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "val", WhereOperator.Equals, -100);

      const sql = builder.parse();
      expect(sql).toContain("@p0 tinyint");
   });

   it("parse with default type (object/unknown)", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "data", WhereOperator.Equals, Symbol("test"));

      const sql = builder.parse();
      expect(sql).toContain("@p0 nvarchar(max)");
   });
});
