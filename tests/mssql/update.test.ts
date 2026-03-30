import { describe, expect, it } from "vitest";
import { MssqlSqlEasy, WhereOperator } from "../../src";

describe("MssqlSqlEasy update", () => {
   it("updateTable with set", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.updateTable("users", "u").set("name", "John");

      const sql = builder.parseRaw();
      expect(sql).toEqual("UPDATE [dbo].[users] AS [u] SET [name] = John;");
   });

   it("updateTableWithOwner with set", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.updateTableWithOwner("sales", "users", "u").set("name", "John");

      const sql = builder.parseRaw();
      expect(sql).toEqual("UPDATE [sales].[users] AS [u] SET [name] = John;");
   });

   it("setColumns (multiple)", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.updateTable("users", "u").setColumns([
         { columnName: "name", value: "John" },
         { columnName: "email", value: "john@example.com" },
         { columnName: "age", value: 30 },
      ]);

      const sql = builder.parseRaw();
      expect(sql).toEqual("UPDATE [dbo].[users] AS [u] SET [name] = John, [email] = john@example.com, [age] = 30;");
   });

   it("setRaw", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.updateTable("users", "u").setRaw("[counter] = [counter] + 1");

      const sql = builder.parseRaw();
      expect(sql).toEqual("UPDATE [dbo].[users] AS [u] SET [counter] = [counter] + 1;");
   });

   it("UPDATE with WHERE", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.updateTable("users", "u").set("name", "John").where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual("UPDATE [dbo].[users] AS [u] SET [name] = John WHERE [u].[id] = 1;");
   });

   it("UPDATE with multiple SET and WHERE", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .updateTable("users", "u")
         .set("name", "John")
         .set("active", true)
         .where("u", "id", WhereOperator.Equals, 1)
         .and()
         .where("u", "status", WhereOperator.NotEquals, "deleted");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "UPDATE [dbo].[users] AS [u] SET [name] = John, [active] = true WHERE [u].[id] = 1 AND [u].[status] <> deleted;",
      );
   });

   it("UPDATE with setRaw and set combined", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .updateTable("users", "u")
         .set("name", "John")
         .setRaw("[updated_at] = GETDATE()")
         .where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "UPDATE [dbo].[users] AS [u] SET [name] = John, [updated_at] = GETDATE() WHERE [u].[id] = 1;",
      );
   });
});
