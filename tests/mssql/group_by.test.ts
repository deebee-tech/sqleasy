import { describe, expect, it } from "vitest";
import { MssqlSqlEasy, WhereOperator } from "../../src";

describe("MssqlSqlEasy group by", () => {
   it("groupByColumn", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "status", "status")
         .selectRaw("COUNT(*) AS cnt")
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, 1)
         .groupByColumn("u", "status");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT [u].[status] AS [status], COUNT(*) AS cnt FROM [dbo].[users] AS [u] WHERE [u].[active] = 1 GROUP BY [u].[status];",
      );
   });

   it("groupByColumns (multiple)", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "status", "status")
         .selectColumn("u", "role", "role")
         .selectRaw("COUNT(*) AS cnt")
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, 1)
         .groupByColumns([
            { tableNameOrAlias: "u", columnName: "status" },
            { tableNameOrAlias: "u", columnName: "role" },
         ]);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT [u].[status] AS [status], [u].[role] AS [role], COUNT(*) AS cnt FROM [dbo].[users] AS [u] WHERE [u].[active] = 1 GROUP BY [u].[status], [u].[role];",
      );
   });

   it("groupByRaw", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectRaw("YEAR([u].[created_at]) AS yr")
         .selectRaw("COUNT(*) AS cnt")
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, 1)
         .groupByRaw("YEAR([u].[created_at])");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT YEAR([u].[created_at]) AS yr, COUNT(*) AS cnt FROM [dbo].[users] AS [u] WHERE [u].[active] = 1 GROUP BY YEAR([u].[created_at]);",
      );
   });

   it("GROUP BY with HAVING", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "status", "status")
         .selectRaw("COUNT(*) AS cnt")
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, 1)
         .groupByColumn("u", "status")
         .having("u", "status", WhereOperator.GreaterThan, 5);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT [u].[status] AS [status], COUNT(*) AS cnt FROM [dbo].[users] AS [u] WHERE [u].[active] = 1 GROUP BY [u].[status] HAVING [u].[status] > 5;",
      );
   });

   it("GROUP BY with HAVING raw", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "status", "status")
         .selectRaw("COUNT(*) AS cnt")
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, 1)
         .groupByColumn("u", "status")
         .havingRaw("COUNT(*) > 10");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT [u].[status] AS [status], COUNT(*) AS cnt FROM [dbo].[users] AS [u] WHERE [u].[active] = 1 GROUP BY [u].[status] HAVING COUNT(*) > 10;",
      );
   });
});
