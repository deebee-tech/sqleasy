import { describe, expect, it } from "vitest";
import { MssqlSqlEasy, OrderByDirection, WhereOperator } from "../../src";

describe("MssqlSqlEasy limit/offset", () => {
   it("limit only (OFFSET 0 ROWS FETCH NEXT)", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "active", WhereOperator.Equals, 1).limit(10);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM [dbo].[users] AS [u] WHERE [u].[active] = 1 OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY;",
      );
   });

   it("limit and offset (requires ORDER BY)", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, 1)
         .orderByColumn("u", "id", OrderByDirection.Ascending)
         .limit(10)
         .offset(20);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM [dbo].[users] AS [u] WHERE [u].[active] = 1 ORDER BY [u].[id] ASC OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY;",
      );
   });

   it("offset only (requires ORDER BY)", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, 1)
         .orderByColumn("u", "id", OrderByDirection.Ascending)
         .offset(20);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM [dbo].[users] AS [u] WHERE [u].[active] = 1 ORDER BY [u].[id] ASC OFFSET 20 ROWS;",
      );
   });

   it("TOP + LIMIT/OFFSET throws error", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").top(10).limit(5);

      expect(() => builder.parseRaw()).toThrow();
   });

   it("offset without ORDER BY throws error", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "active", WhereOperator.Equals, 1).offset(20);

      expect(() => builder.parseRaw()).toThrow();
   });
});
