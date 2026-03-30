import { describe, expect, it } from "vitest";
import { MssqlSqlEasy, MultiBuilderTransactionState, WhereOperator } from "../../src";

describe("MssqlSqlEasy multi builder", () => {
   it("multiple builders parsed together (with transaction)", () => {
      const sqlEasy = new MssqlSqlEasy();
      const multi = sqlEasy.newMultiBuilder();

      const b1 = multi.addBuilder("b1");
      b1.selectAll().fromTable("users", "u");

      const b2 = multi.addBuilder("b2");
      b2.selectAll().fromTable("orders", "o");

      const sql = multi.parseRaw();
      expect(sql).toEqual(
         "BEGIN TRANSACTION; SELECT TOP (1000) * FROM [dbo].[users] AS [u];SELECT TOP (1000) * FROM [dbo].[orders] AS [o];COMMIT TRANSACTION; ",
      );
   });

   it("transaction off", () => {
      const sqlEasy = new MssqlSqlEasy();
      const multi = sqlEasy.newMultiBuilder();
      multi.setTransactionState(MultiBuilderTransactionState.TransactionOff);

      const b1 = multi.addBuilder("b1");
      b1.selectAll().fromTable("users", "u").where("u", "active", WhereOperator.Equals, 1);

      const b2 = multi.addBuilder("b2");
      b2.selectAll().fromTable("orders", "o").where("o", "total", WhereOperator.GreaterThan, 100);

      const sql = multi.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM [dbo].[users] AS [u] WHERE [u].[active] = 1;SELECT * FROM [dbo].[orders] AS [o] WHERE [o].[total] > 100;",
      );
   });

   it("removeBuilder", () => {
      const sqlEasy = new MssqlSqlEasy();
      const multi = sqlEasy.newMultiBuilder();
      multi.setTransactionState(MultiBuilderTransactionState.TransactionOff);

      const b1 = multi.addBuilder("b1");
      b1.selectAll().fromTable("users", "u").where("u", "active", WhereOperator.Equals, 1);

      const b2 = multi.addBuilder("b2");
      b2.selectAll().fromTable("orders", "o").where("o", "total", WhereOperator.GreaterThan, 100);

      multi.removeBuilder("b1");

      const sql = multi.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM [dbo].[orders] AS [o] WHERE [o].[total] > 100;",
      );
   });

   it("reorderBuilders", () => {
      const sqlEasy = new MssqlSqlEasy();
      const multi = sqlEasy.newMultiBuilder();
      multi.setTransactionState(MultiBuilderTransactionState.TransactionOff);

      const b1 = multi.addBuilder("b1");
      b1.selectAll().fromTable("users", "u").where("u", "active", WhereOperator.Equals, 1);

      const b2 = multi.addBuilder("b2");
      b2.selectAll().fromTable("orders", "o").where("o", "total", WhereOperator.GreaterThan, 100);

      multi.reorderBuilders(["b2", "b1"]);

      const sql = multi.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM [dbo].[orders] AS [o] WHERE [o].[total] > 100;SELECT * FROM [dbo].[users] AS [u] WHERE [u].[active] = 1;",
      );
   });

   it("multi builder with insert and update", () => {
      const sqlEasy = new MssqlSqlEasy();
      const multi = sqlEasy.newMultiBuilder();

      const insertBuilder = multi.addBuilder("insert");
      insertBuilder.insertInto("users").insertColumns(["name", "email"]).insertValues(["John", "john@example.com"]);

      const updateBuilder = multi.addBuilder("update");
      updateBuilder
         .updateTable("users", "u")
         .set("active", true)
         .where("u", "name", WhereOperator.Equals, "John");

      const sql = multi.parseRaw();
      expect(sql).toEqual(
         "BEGIN TRANSACTION; INSERT INTO [dbo].[users] ([name], [email]) VALUES (John, john@example.com);UPDATE [dbo].[users] AS [u] SET [active] = true WHERE [u].[name] = John;COMMIT TRANSACTION; ",
      );
   });

   it("multi builder with delete", () => {
      const sqlEasy = new MssqlSqlEasy();
      const multi = sqlEasy.newMultiBuilder();
      multi.setTransactionState(MultiBuilderTransactionState.TransactionOff);

      const b1 = multi.addBuilder("delete_orders");
      b1.deleteFrom("orders", "o").where("o", "user_id", WhereOperator.Equals, 1);

      const b2 = multi.addBuilder("delete_user");
      b2.deleteFrom("users", "u").where("u", "id", WhereOperator.Equals, 1);

      const sql = multi.parseRaw();
      expect(sql).toEqual(
         "DELETE FROM [dbo].[orders] AS [o] WHERE [o].[user_id] = 1;DELETE FROM [dbo].[users] AS [u] WHERE [u].[id] = 1;",
      );
   });

   it("transaction state defaults to TransactionOn", () => {
      const sqlEasy = new MssqlSqlEasy();
      const multi = sqlEasy.newMultiBuilder();

      expect(multi.transactionState()).toEqual(MultiBuilderTransactionState.TransactionOn);
   });

   it("reorderBuilders with subset of builders", () => {
      const sqlEasy = new MssqlSqlEasy();
      const multi = sqlEasy.newMultiBuilder();
      multi.setTransactionState(MultiBuilderTransactionState.TransactionOff);

      multi.addBuilder("b1").selectAll().fromTable("users", "u").where("u", "id", WhereOperator.Equals, 1);
      multi.addBuilder("b2").selectAll().fromTable("orders", "o").where("o", "id", WhereOperator.Equals, 2);
      multi.addBuilder("b3").selectAll().fromTable("products", "p").where("p", "id", WhereOperator.Equals, 3);

      multi.reorderBuilders(["b3", "b1"]);

      const sql = multi.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM [dbo].[products] AS [p] WHERE [p].[id] = 3;SELECT * FROM [dbo].[users] AS [u] WHERE [u].[id] = 1;",
      );
   });
});

describe("MssqlSqlEasy multi builder parse (prepared)", () => {
   it("multi parse with transaction", () => {
      const sqlEasy = new MssqlSqlEasy();
      const multiBuilder = sqlEasy.newMultiBuilder();
      const b1 = multiBuilder.addBuilder("q1");
      b1.selectAll().fromTable("users", "u").where("u", "id", WhereOperator.Equals, 1);

      const sql = multiBuilder.parse();
      expect(sql).toContain("BEGIN TRANSACTION");
      expect(sql).toContain("COMMIT TRANSACTION");
      expect(sql).toContain("exec sp_executesql");
   });
});
