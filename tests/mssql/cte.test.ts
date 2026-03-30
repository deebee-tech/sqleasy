import { describe, expect, it } from "vitest";
import { MssqlSqlEasy, WhereOperator } from "../../src";

describe("MssqlSqlEasy cte", () => {
   it("simple CTE (WITH ... AS)", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .cte("active_users", (b) => {
            b.selectAll().fromTable("users", "u").where("u", "active", WhereOperator.Equals, 1);
         })
         .selectAll()
         .fromRaw("[active_users] AS [au]");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "WITH [active_users] AS (SELECT * FROM [dbo].[users] AS [u] WHERE [u].[active] = 1) SELECT TOP (1000) * FROM [active_users] AS [au];",
      );
   });

   it("multiple CTEs", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .cte("active_users", (b) => {
            b.selectAll().fromTable("users", "u").where("u", "active", WhereOperator.Equals, 1);
         })
         .cte("recent_orders", (b) => {
            b.selectAll().fromTable("orders", "o").where("o", "total", WhereOperator.GreaterThan, 100);
         })
         .selectAll()
         .fromRaw("[active_users] AS [au]");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "WITH [active_users] AS (SELECT * FROM [dbo].[users] AS [u] WHERE [u].[active] = 1), [recent_orders] AS (SELECT * FROM [dbo].[orders] AS [o] WHERE [o].[total] > 100) SELECT TOP (1000) * FROM [active_users] AS [au];",
      );
   });

   it("recursive CTE", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .cteRecursive("numbers", (b) => {
            b.selectRaw("1 AS n")
               .fromRaw("(SELECT 1 AS x) AS [dummy]")
               .unionAll((ub) => {
                  ub.selectRaw("[n] + 1 AS n").fromRaw("[numbers]").whereRaw("[n] < 10");
               });
         })
         .selectAll()
         .fromRaw("[numbers]");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "WITH RECURSIVE [numbers] AS (SELECT 1 AS n FROM (SELECT 1 AS x) AS [dummy] UNION ALL SELECT [n] + 1 AS n FROM [numbers] WHERE [n] < 10) SELECT TOP (1000) * FROM [numbers];",
      );
   });

   it("cteRaw", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.cteRaw("constants", "SELECT 1 AS one, 2 AS two").selectAll().fromRaw("[constants]");

      const sql = builder.parseRaw();
      expect(sql).toEqual("WITH [constants] AS (SELECT 1 AS one, 2 AS two) SELECT TOP (1000) * FROM [constants];");
   });

   it("CTE with joined query", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .cte("active_users", (b) => {
            b.selectColumn("u", "id", "id")
               .selectColumn("u", "name", "name")
               .fromTable("users", "u")
               .where("u", "active", WhereOperator.Equals, 1);
         })
         .selectAll()
         .fromRaw("[active_users] AS [au]")
         .where("au", "name", WhereOperator.Equals, "John");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "WITH [active_users] AS (SELECT [u].[id] AS [id], [u].[name] AS [name] FROM [dbo].[users] AS [u] WHERE [u].[active] = 1) SELECT * FROM [active_users] AS [au] WHERE [au].[name] = John;",
      );
   });
});
