import { describe, expect, it } from "vitest";
import { MultiBuilderTransactionState, PostgresSqlEasy, WhereOperator } from "../../src";

describe("PostgresSqlEasy multi builder", () => {
   it("multi builder with transaction", () => {
      const sqlEasy = new PostgresSqlEasy();
      const multi = sqlEasy.newMultiBuilder();

      const b1 = multi.addBuilder("insert_user");
      b1.insertInto("users").insertColumns(["name", "email"]).insertValues(["John", "john@example.com"]);

      const b2 = multi.addBuilder("insert_order");
      b2.insertInto("orders").insertColumns(["user_id", "product"]).insertValues([1, "Widget"]);

      const sql = multi.parseRaw();
      expect(sql).toEqual(
         'BEGIN; INSERT INTO "public"."users" ("name", "email") VALUES (John, john@example.com);INSERT INTO "public"."orders" ("user_id", "product") VALUES (1, Widget);COMMIT; ',
      );
   });

   it("multi builder without transaction", () => {
      const sqlEasy = new PostgresSqlEasy();
      const multi = sqlEasy.newMultiBuilder();
      multi.setTransactionState(MultiBuilderTransactionState.TransactionOff);

      const b1 = multi.addBuilder("select_users");
      b1.selectAll().fromTable("users", "u").where("u", "active", WhereOperator.Equals, true);

      const b2 = multi.addBuilder("select_orders");
      b2.selectAll().fromTable("orders", "o").where("o", "status", WhereOperator.Equals, "pending");

      const sql = multi.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" WHERE "u"."active" = true;SELECT * FROM "public"."orders" AS "o" WHERE "o"."status" = pending;',
      );
   });

   it("multi builder with transaction parse() prepared statement", () => {
      const sqlEasy = new PostgresSqlEasy();
      const multi = sqlEasy.newMultiBuilder();

      const b1 = multi.addBuilder("insert_user");
      b1.insertInto("users").insertColumns(["name", "email"]).insertValues(["John", "john@example.com"]);

      const b2 = multi.addBuilder("update_count");
      b2.updateTable("stats", "s").set("user_count", 100).where("s", "id", WhereOperator.Equals, 1);

      const sql = multi.parse();
      expect(sql).toEqual(
         'BEGIN; INSERT INTO "public"."users" ("name", "email") VALUES ($1, $2);UPDATE "public"."stats" AS "s" SET "user_count" = $1 WHERE "s"."id" = $2;COMMIT;',
      );
   });

   it("multi builder removeBuilder", () => {
      const sqlEasy = new PostgresSqlEasy();
      const multi = sqlEasy.newMultiBuilder();
      multi.setTransactionState(MultiBuilderTransactionState.TransactionOff);

      const b1 = multi.addBuilder("first");
      b1.selectAll().fromTable("users", "u").where("u", "active", WhereOperator.Equals, true);

      const b2 = multi.addBuilder("second");
      b2.selectAll().fromTable("orders", "o").where("o", "status", WhereOperator.Equals, "pending");

      multi.removeBuilder("first");

      const sql = multi.parseRaw();
      expect(sql).toEqual('SELECT * FROM "public"."orders" AS "o" WHERE "o"."status" = pending;');
   });

   it("multi builder reorderBuilders", () => {
      const sqlEasy = new PostgresSqlEasy();
      const multi = sqlEasy.newMultiBuilder();
      multi.setTransactionState(MultiBuilderTransactionState.TransactionOff);

      const b1 = multi.addBuilder("first");
      b1.selectAll().fromTable("users", "u").where("u", "active", WhereOperator.Equals, true);

      const b2 = multi.addBuilder("second");
      b2.selectAll().fromTable("orders", "o").where("o", "status", WhereOperator.Equals, "pending");

      multi.reorderBuilders(["second", "first"]);

      const sql = multi.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."orders" AS "o" WHERE "o"."status" = pending;SELECT * FROM "public"."users" AS "u" WHERE "u"."active" = true;',
      );
   });

   it("multi builder default transaction state is on", () => {
      const sqlEasy = new PostgresSqlEasy();
      const multi = sqlEasy.newMultiBuilder();

      expect(multi.transactionState()).toEqual(MultiBuilderTransactionState.TransactionOn);
   });

   it("multi builder with mixed query types", () => {
      const sqlEasy = new PostgresSqlEasy();
      const multi = sqlEasy.newMultiBuilder();

      const b1 = multi.addBuilder("insert");
      b1.insertInto("users").insertColumns(["name"]).insertValues(["NewUser"]);

      const b2 = multi.addBuilder("update");
      b2.updateTable("counters", "c").set("total", 42).where("c", "name", WhereOperator.Equals, "users");

      const b3 = multi.addBuilder("delete");
      b3.deleteFrom("temp_data", "t").where("t", "expired", WhereOperator.Equals, true);

      const sql = multi.parseRaw();
      expect(sql).toEqual(
         'BEGIN; INSERT INTO "public"."users" ("name") VALUES (NewUser);UPDATE "public"."counters" AS "c" SET "total" = 42 WHERE "c"."name" = users;DELETE FROM "public"."temp_data" AS "t" WHERE "t"."expired" = true;COMMIT; ',
      );
   });

   it("multi builder BEGIN/COMMIT delimiters for postgres", () => {
      const sqlEasy = new PostgresSqlEasy();
      const multi = sqlEasy.newMultiBuilder();

      const b1 = multi.addBuilder("op1");
      b1.insertInto("logs").insertColumns(["message"]).insertValues(["test"]);

      const sql = multi.parseRaw();
      expect(sql).toContain("BEGIN;");
      expect(sql).toContain("COMMIT;");
   });
});
