import { describe, expect, it } from "vitest";
import { MssqlSqlEasy, WhereOperator } from "../../src";

describe("MssqlSqlEasy top", () => {
   it("top(10) - explicit TOP", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").top(10);

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT TOP (10) * FROM [dbo].[users] AS [u];");
   });

   it("clearTop reverts to safety net", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").top(10).clearTop();

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT TOP (1000) * FROM [dbo].[users] AS [u];");
   });

   it("TOP safety net (maxRowsReturned=1000 when no WHERE/no limit/not inner)", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT TOP (1000) * FROM [dbo].[users] AS [u];");
   });

   it("no TOP when WHERE clause present", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM [dbo].[users] AS [u] WHERE [u].[id] = 1;");
   });

   it("no TOP when isInnerStatement (subquery)", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereInWithBuilder("u", "id", (b) => {
            b.selectColumn("o", "user_id", "").fromTable("orders", "o");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM [dbo].[users] AS [u] WHERE [u].[id] IN (SELECT [o].[user_id] FROM [dbo].[orders] AS [o]);",
      );
   });

   it("explicit TOP with WHERE (TOP overrides safety net)", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").top(5).where("u", "active", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT TOP (5) * FROM [dbo].[users] AS [u] WHERE [u].[active] = 1;");
   });

   it("no TOP when limit is set", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").limit(10);

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM [dbo].[users] AS [u] OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY;");
   });
});
