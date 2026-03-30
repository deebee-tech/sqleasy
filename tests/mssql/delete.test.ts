import { describe, expect, it } from "vitest";
import { MssqlSqlEasy, WhereOperator } from "../../src";

describe("MssqlSqlEasy delete", () => {
   it("deleteFrom simple", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.deleteFrom("users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual("DELETE FROM [dbo].[users] AS [u];");
   });

   it("deleteFromWithOwner", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.deleteFromWithOwner("sales", "users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual("DELETE FROM [sales].[users] AS [u];");
   });

   it("DELETE with WHERE", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.deleteFrom("users", "u").where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual("DELETE FROM [dbo].[users] AS [u] WHERE [u].[id] = 1;");
   });

   it("DELETE with multiple WHERE conditions", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .deleteFrom("users", "u")
         .where("u", "status", WhereOperator.Equals, "deleted")
         .and()
         .where("u", "age", WhereOperator.LessThan, 18);

      const sql = builder.parseRaw();
      expect(sql).toEqual("DELETE FROM [dbo].[users] AS [u] WHERE [u].[status] = deleted AND [u].[age] < 18;");
   });

   it("deleteFrom without alias", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.deleteFrom("users", "");

      const sql = builder.parseRaw();
      expect(sql).toEqual("DELETE FROM [dbo].[users];");
   });
});
