import { describe, expect, it } from "vitest";
import { MssqlSqlEasy, WhereOperator } from "../../src";

describe("MssqlSqlEasy where", () => {
   it("where with Equals", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM [dbo].[users] AS [u] WHERE [u].[id] = 1;");
   });

   it("where with NotEquals", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "status", WhereOperator.NotEquals, "inactive");

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM [dbo].[users] AS [u] WHERE [u].[status] <> inactive;");
   });

   it("where with GreaterThan", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "age", WhereOperator.GreaterThan, 18);

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM [dbo].[users] AS [u] WHERE [u].[age] > 18;");
   });

   it("where with GreaterThanOrEquals", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "age", WhereOperator.GreaterThanOrEquals, 21);

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM [dbo].[users] AS [u] WHERE [u].[age] >= 21;");
   });

   it("where with LessThan", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "age", WhereOperator.LessThan, 65);

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM [dbo].[users] AS [u] WHERE [u].[age] < 65;");
   });

   it("where with LessThanOrEquals", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "score", WhereOperator.LessThanOrEquals, 100);

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM [dbo].[users] AS [u] WHERE [u].[score] <= 100;");
   });

   it("whereBetween", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").whereBetween("u", "age", 18, 65);

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM [dbo].[users] AS [u] WHERE [u].[age] BETWEEN 18 AND 65;");
   });

   it("whereNull", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").whereNull("u", "deleted_at");

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM [dbo].[users] AS [u] WHERE [u].[deleted_at] IS NULL;");
   });

   it("whereNotNull", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").whereNotNull("u", "email");

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM [dbo].[users] AS [u] WHERE [u].[email] IS NOT NULL;");
   });

   it("whereInValues", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").whereInValues("u", "id", [1, 2, 3]);

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM [dbo].[users] AS [u] WHERE [u].[id] IN (1, 2, 3);");
   });

   it("whereNotInValues", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").whereNotInValues("u", "status", ["deleted", "banned"]);

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM [dbo].[users] AS [u] WHERE [u].[status] NOT IN (deleted, banned);");
   });

   it("whereInWithBuilder", () => {
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

   it("whereNotInWithBuilder", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereNotInWithBuilder("u", "id", (b) => {
            b.selectColumn("bl", "user_id", "").fromTable("blacklist", "bl");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM [dbo].[users] AS [u] WHERE [u].[id] NOT IN (SELECT [bl].[user_id] FROM [dbo].[blacklist] AS [bl]);",
      );
   });

   it("whereExistsWithBuilder", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereExistsWithBuilder("u", "id", (b) => {
            b.selectRaw("1").fromTable("orders", "o").whereRaw("[o].[user_id] = [u].[id]");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM [dbo].[users] AS [u] WHERE EXISTS (SELECT 1 FROM [dbo].[orders] AS [o] WHERE [o].[user_id] = [u].[id]);",
      );
   });

   it("whereNotExistsWithBuilder", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereNotExistsWithBuilder("u", "id", (b) => {
            b.selectRaw("1").fromTable("orders", "o").whereRaw("[o].[user_id] = [u].[id]");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM [dbo].[users] AS [u] WHERE NOT EXISTS (SELECT 1 FROM [dbo].[orders] AS [o] WHERE [o].[user_id] = [u].[id]);",
      );
   });

   it("whereGroup (nested parentheses)", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, 1)
         .and()
         .whereGroup(() => {});

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM [dbo].[users] AS [u] WHERE [u].[active] = 1 AND ();");
   });

   it("whereRaw", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").whereRaw("[u].[created_at] > GETDATE()");

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM [dbo].[users] AS [u] WHERE [u].[created_at] > GETDATE();");
   });

   it("AND/OR chaining", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "age", WhereOperator.GreaterThan, 18)
         .and()
         .where("u", "status", WhereOperator.Equals, "active")
         .or()
         .where("u", "role", WhereOperator.Equals, "admin");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM [dbo].[users] AS [u] WHERE [u].[age] > 18 AND [u].[status] = active OR [u].[role] = admin;",
      );
   });

   it("multiple WHERE conditions with AND", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "age", WhereOperator.GreaterThanOrEquals, 21)
         .and()
         .where("u", "status", WhereOperator.Equals, "active")
         .and()
         .whereNotNull("u", "email");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM [dbo].[users] AS [u] WHERE [u].[age] >= 21 AND [u].[status] = active AND [u].[email] IS NOT NULL;",
      );
   });

   it("whereInValues with string values", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").whereInValues("u", "status", ["active", "pending", "review"]);

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM [dbo].[users] AS [u] WHERE [u].[status] IN (active, pending, review);");
   });
});
