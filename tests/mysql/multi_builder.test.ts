import { describe, expect, it } from "vitest";
import { MultiBuilderTransactionState, MysqlSqlEasy, WhereOperator } from "../../src";

describe("MysqlSqlEasy multi builder", () => {
   it("multiple builders with transaction on (default)", () => {
      const sqlEasy = new MysqlSqlEasy();
      const multiBuilder = sqlEasy.newMultiBuilder();

      const b1 = multiBuilder.addBuilder("query1");
      b1.selectAll().fromTable("users", "u");

      const b2 = multiBuilder.addBuilder("query2");
      b2.selectAll().fromTable("orders", "o");

      const sql = multiBuilder.parseRaw();
      expect(sql).toEqual("START TRANSACTION; SELECT * FROM `users` AS `u`;SELECT * FROM `orders` AS `o`;COMMIT; ");
   });

   it("multiple builders with transaction off", () => {
      const sqlEasy = new MysqlSqlEasy();
      const multiBuilder = sqlEasy.newMultiBuilder();
      multiBuilder.setTransactionState(MultiBuilderTransactionState.TransactionOff);

      const b1 = multiBuilder.addBuilder("query1");
      b1.selectAll().fromTable("users", "u");

      const b2 = multiBuilder.addBuilder("query2");
      b2.selectAll().fromTable("orders", "o");

      const sql = multiBuilder.parseRaw();
      expect(sql).toEqual("SELECT * FROM `users` AS `u`;SELECT * FROM `orders` AS `o`;");
   });

   it("single builder with transaction on", () => {
      const sqlEasy = new MysqlSqlEasy();
      const multiBuilder = sqlEasy.newMultiBuilder();

      const b1 = multiBuilder.addBuilder("query1");
      b1.selectAll().fromTable("users", "u");

      const sql = multiBuilder.parseRaw();
      expect(sql).toEqual("START TRANSACTION; SELECT * FROM `users` AS `u`;COMMIT; ");
   });

   it("mixed query types in multi builder", () => {
      const sqlEasy = new MysqlSqlEasy();
      const multiBuilder = sqlEasy.newMultiBuilder();

      const b1 = multiBuilder.addBuilder("insert");
      b1.insertInto("users").insertColumns(["name", "email"]).insertValues(["Alice", "alice@test.com"]);

      const b2 = multiBuilder.addBuilder("select");
      b2.selectAll().fromTable("users", "u");

      const sql = multiBuilder.parseRaw();
      expect(sql).toEqual(
         "START TRANSACTION; " +
            "INSERT INTO `users` (`name`, `email`) VALUES (Alice, alice@test.com);" +
            "SELECT * FROM `users` AS `u`;" +
            "COMMIT; ",
      );
   });

   it("removeBuilder", () => {
      const sqlEasy = new MysqlSqlEasy();
      const multiBuilder = sqlEasy.newMultiBuilder();
      multiBuilder.setTransactionState(MultiBuilderTransactionState.TransactionOff);

      const b1 = multiBuilder.addBuilder("query1");
      b1.selectAll().fromTable("users", "u");

      const b2 = multiBuilder.addBuilder("query2");
      b2.selectAll().fromTable("orders", "o");

      multiBuilder.removeBuilder("query1");

      const sql = multiBuilder.parseRaw();
      expect(sql).toEqual("SELECT * FROM `orders` AS `o`;");
   });

   it("reorderBuilders", () => {
      const sqlEasy = new MysqlSqlEasy();
      const multiBuilder = sqlEasy.newMultiBuilder();
      multiBuilder.setTransactionState(MultiBuilderTransactionState.TransactionOff);

      const b1 = multiBuilder.addBuilder("first");
      b1.selectAll().fromTable("users", "u");

      const b2 = multiBuilder.addBuilder("second");
      b2.selectAll().fromTable("orders", "o");

      multiBuilder.reorderBuilders(["second", "first"]);

      const sql = multiBuilder.parseRaw();
      expect(sql).toEqual("SELECT * FROM `orders` AS `o`;SELECT * FROM `users` AS `u`;");
   });

   it("transactionState getter", () => {
      const sqlEasy = new MysqlSqlEasy();
      const multiBuilder = sqlEasy.newMultiBuilder();

      expect(multiBuilder.transactionState()).toEqual(MultiBuilderTransactionState.TransactionOn);

      multiBuilder.setTransactionState(MultiBuilderTransactionState.TransactionOff);
      expect(multiBuilder.transactionState()).toEqual(MultiBuilderTransactionState.TransactionOff);
   });

   it("multi builder with update and delete", () => {
      const sqlEasy = new MysqlSqlEasy();
      const multiBuilder = sqlEasy.newMultiBuilder();

      const b1 = multiBuilder.addBuilder("update");
      b1.updateTable("users", "u").set("active", false).where("u", "id", WhereOperator.Equals, 1);

      const b2 = multiBuilder.addBuilder("delete");
      b2.deleteFrom("sessions", "s").where("s", "user_id", WhereOperator.Equals, 1);

      const sql = multiBuilder.parseRaw();
      expect(sql).toEqual(
         "START TRANSACTION; " +
            "UPDATE `users` AS `u` SET `active` = false WHERE `u`.`id` = 1;" +
            "DELETE FROM `sessions` AS `s` WHERE `s`.`user_id` = 1;" +
            "COMMIT; ",
      );
   });

   it("states returns all builder states", () => {
      const sqlEasy = new MysqlSqlEasy();
      const multiBuilder = sqlEasy.newMultiBuilder();

      multiBuilder.addBuilder("q1");
      multiBuilder.addBuilder("q2");

      expect(multiBuilder.states()).toHaveLength(2);
      expect(multiBuilder.states()[0].builderName).toEqual("q1");
      expect(multiBuilder.states()[1].builderName).toEqual("q2");
   });
});
