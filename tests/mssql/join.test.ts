import { describe, expect, it } from "vitest";
import { JoinOperator, JoinType, MssqlSqlEasy, WhereOperator } from "../../src";

describe("MssqlSqlEasy join", () => {
   it("INNER JOIN with ON", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Inner, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id");
         })
         .where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM [dbo].[users] AS [u] INNER JOIN [dbo].[orders] AS [o] ON [u].[id] = [o].[user_id] WHERE [u].[id] = 1;",
      );
   });

   it("LEFT JOIN", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Left, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id");
         })
         .where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM [dbo].[users] AS [u] LEFT JOIN [dbo].[orders] AS [o] ON [u].[id] = [o].[user_id] WHERE [u].[id] = 1;",
      );
   });

   it("LEFT OUTER JOIN", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.LeftOuter, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id");
         })
         .where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM [dbo].[users] AS [u] LEFT OUTER JOIN [dbo].[orders] AS [o] ON [u].[id] = [o].[user_id] WHERE [u].[id] = 1;",
      );
   });

   it("RIGHT JOIN", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Right, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id");
         })
         .where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM [dbo].[users] AS [u] RIGHT JOIN [dbo].[orders] AS [o] ON [u].[id] = [o].[user_id] WHERE [u].[id] = 1;",
      );
   });

   it("FULL OUTER JOIN", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.FullOuter, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id");
         })
         .where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM [dbo].[users] AS [u] FULL OUTER JOIN [dbo].[orders] AS [o] ON [u].[id] = [o].[user_id] WHERE [u].[id] = 1;",
      );
   });

   it("CROSS JOIN", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Cross, "roles", "r", () => {})
         .where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM [dbo].[users] AS [u] CROSS JOIN [dbo].[roles] AS [r] WHERE [u].[id] = 1;");
   });

   it("joinTableWithOwner", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTableWithOwner(JoinType.Inner, "sales", "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id");
         })
         .where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM [dbo].[users] AS [u] INNER JOIN [sales].[orders] AS [o] ON [u].[id] = [o].[user_id] WHERE [u].[id] = 1;",
      );
   });

   it("joinRaw", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinRaw("INNER JOIN [dbo].[orders] AS [o] ON [u].[id] = [o].[user_id]")
         .where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM [dbo].[users] AS [u] INNER JOIN [dbo].[orders] AS [o] ON [u].[id] = [o].[user_id] WHERE [u].[id] = 1;",
      );
   });

   it("joinRaws", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinRaws([
            "INNER JOIN [dbo].[orders] AS [o] ON [u].[id] = [o].[user_id]",
            "LEFT JOIN [dbo].[products] AS [p] ON [o].[product_id] = [p].[id]",
         ])
         .where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM [dbo].[users] AS [u] INNER JOIN [dbo].[orders] AS [o] ON [u].[id] = [o].[user_id] LEFT JOIN [dbo].[products] AS [p] ON [o].[product_id] = [p].[id] WHERE [u].[id] = 1;",
      );
   });

   it("joinWithBuilder (subquery as join target)", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinWithBuilder(
            JoinType.Inner,
            "recent_orders",
            (b) => {
               b.selectAll().fromTable("orders", "o").where("o", "status", WhereOperator.Equals, "active");
            },
            (jb) => {
               jb.on("u", "id", JoinOperator.Equals, "recent_orders", "user_id");
            },
         )
         .where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM [dbo].[users] AS [u] INNER JOIN (SELECT * FROM [dbo].[orders] AS [o] WHERE [o].[status] = active) AS [recent_orders] ON [u].[id] = [recent_orders].[user_id] WHERE [u].[id] = 1;",
      );
   });

   it("ON with multiple conditions (AND)", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Inner, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id")
               .and()
               .on("u", "region", JoinOperator.Equals, "o", "region");
         })
         .where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM [dbo].[users] AS [u] INNER JOIN [dbo].[orders] AS [o] ON [u].[id] = [o].[user_id] AND [u].[region] = [o].[region] WHERE [u].[id] = 1;",
      );
   });

   it("ON with OR", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Inner, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id")
               .or()
               .on("u", "id", JoinOperator.Equals, "o", "alt_user_id");
         })
         .where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM [dbo].[users] AS [u] INNER JOIN [dbo].[orders] AS [o] ON [u].[id] = [o].[user_id] OR [u].[id] = [o].[alt_user_id] WHERE [u].[id] = 1;",
      );
   });

   it("ON with value (onValue)", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Inner, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id").and().onValue("o", "active", JoinOperator.Equals, 1);
         })
         .where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM [dbo].[users] AS [u] INNER JOIN [dbo].[orders] AS [o] ON [u].[id] = [o].[user_id] AND [o].[active] = 1 WHERE [u].[id] = 1;",
      );
   });

   it("ON with group (onGroup)", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Inner, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id")
               .and()
               .onGroup(() => {});
         })
         .where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM [dbo].[users] AS [u] INNER JOIN [dbo].[orders] AS [o] ON [u].[id] = [o].[user_id] AND () WHERE [u].[id] = 1;",
      );
   });

   it("ON with raw (onRaw)", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Inner, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id").and().onRaw("[o].[created_at] > GETDATE()");
         })
         .where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM [dbo].[users] AS [u] INNER JOIN [dbo].[orders] AS [o] ON [u].[id] = [o].[user_id] AND [o].[created_at] > GETDATE() WHERE [u].[id] = 1;",
      );
   });

   it("multiple joins", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Inner, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id");
         })
         .joinTable(JoinType.Left, "products", "p", (jb) => {
            jb.on("o", "product_id", JoinOperator.Equals, "p", "id");
         })
         .where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM [dbo].[users] AS [u] INNER JOIN [dbo].[orders] AS [o] ON [u].[id] = [o].[user_id] LEFT JOIN [dbo].[products] AS [p] ON [o].[product_id] = [p].[id] WHERE [u].[id] = 1;",
      );
   });
});
