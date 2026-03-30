import { describe, expect, it } from "vitest";
import { MssqlSqlEasy, WhereOperator } from "../../src";

describe("MssqlSqlEasy union", () => {
   it("UNION two queries", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "name", "name")
         .fromTable("users", "u")
         .where("u", "status", WhereOperator.Equals, "active")
         .union((b) => {
            b.selectColumn("u", "name", "name")
               .fromTable("users", "u")
               .where("u", "status", WhereOperator.Equals, "pending");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT [u].[name] AS [name] FROM [dbo].[users] AS [u] WHERE [u].[status] = active UNION SELECT [u].[name] AS [name] FROM [dbo].[users] AS [u] WHERE [u].[status] = pending;",
      );
   });

   it("UNION ALL", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "name", "name")
         .fromTable("users", "u")
         .where("u", "status", WhereOperator.Equals, "active")
         .unionAll((b) => {
            b.selectColumn("u", "name", "name")
               .fromTable("users", "u")
               .where("u", "status", WhereOperator.Equals, "pending");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT [u].[name] AS [name] FROM [dbo].[users] AS [u] WHERE [u].[status] = active UNION ALL SELECT [u].[name] AS [name] FROM [dbo].[users] AS [u] WHERE [u].[status] = pending;",
      );
   });

   it("INTERSECT", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "id", "id")
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, 1)
         .intersect((b) => {
            b.selectColumn("o", "user_id", "id")
               .fromTable("orders", "o")
               .where("o", "total", WhereOperator.GreaterThan, 100);
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT [u].[id] AS [id] FROM [dbo].[users] AS [u] WHERE [u].[active] = 1 INTERSECT SELECT [o].[user_id] AS [id] FROM [dbo].[orders] AS [o] WHERE [o].[total] > 100;",
      );
   });

   it("EXCEPT", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "id", "id")
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, 1)
         .except((b) => {
            b.selectColumn("bl", "user_id", "id")
               .fromTable("blacklist", "bl")
               .where("bl", "reason", WhereOperator.Equals, "spam");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT [u].[id] AS [id] FROM [dbo].[users] AS [u] WHERE [u].[active] = 1 EXCEPT SELECT [bl].[user_id] AS [id] FROM [dbo].[blacklist] AS [bl] WHERE [bl].[reason] = spam;",
      );
   });

   it("multiple UNION operations", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "name", "name")
         .fromTable("users", "u")
         .where("u", "status", WhereOperator.Equals, "active")
         .union((b) => {
            b.selectColumn("u", "name", "name")
               .fromTable("users", "u")
               .where("u", "status", WhereOperator.Equals, "pending");
         })
         .union((b) => {
            b.selectColumn("u", "name", "name")
               .fromTable("users", "u")
               .where("u", "status", WhereOperator.Equals, "review");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT [u].[name] AS [name] FROM [dbo].[users] AS [u] WHERE [u].[status] = active UNION SELECT [u].[name] AS [name] FROM [dbo].[users] AS [u] WHERE [u].[status] = pending UNION SELECT [u].[name] AS [name] FROM [dbo].[users] AS [u] WHERE [u].[status] = review;",
      );
   });
});
