import { describe, expect, it } from "vitest";
import { MultiBuilderTransactionState, SqliteSqlEasy, WhereOperator } from "../../src";

describe("SqliteSqlEasy multi builder", () => {
   it("multi builder with transaction on", () => {
      const sqlEasy = new SqliteSqlEasy();
      const multi = sqlEasy.newMultiBuilder();

      const b1 = multi.addBuilder("insert_user");
      b1.insertInto("users").insertColumns(["name", "email"]).insertValues(["John", "john@example.com"]);

      const b2 = multi.addBuilder("insert_order");
      b2.insertInto("orders").insertColumns(["user_id", "total"]).insertValues([1, 99.99]);

      const sql = multi.parseRaw();
      expect(sql).toEqual(
         'BEGIN; INSERT INTO "users" ("name", "email") VALUES (John, john@example.com);INSERT INTO "orders" ("user_id", "total") VALUES (1, 99.99);COMMIT; ',
      );
   });

   it("multi builder with transaction on - parse prepared", () => {
      const sqlEasy = new SqliteSqlEasy();
      const multi = sqlEasy.newMultiBuilder();

      const b1 = multi.addBuilder("insert_user");
      b1.insertInto("users").insertColumns(["name", "email"]).insertValues(["John", "john@example.com"]);

      const b2 = multi.addBuilder("insert_order");
      b2.insertInto("orders").insertColumns(["user_id", "total"]).insertValues([1, 99.99]);

      const sql = multi.parse();
      expect(sql).toEqual(
         'BEGIN; INSERT INTO "users" ("name", "email") VALUES (?, ?);INSERT INTO "orders" ("user_id", "total") VALUES (?, ?);COMMIT;',
      );
   });

   it("multi builder with transaction off", () => {
      const sqlEasy = new SqliteSqlEasy();
      const multi = sqlEasy.newMultiBuilder();
      multi.setTransactionState(MultiBuilderTransactionState.TransactionOff);

      const b1 = multi.addBuilder("insert_user");
      b1.insertInto("users").insertColumns(["name"]).insertValues(["Alice"]);

      const b2 = multi.addBuilder("update_user");
      b2.updateTable("users", "u").set("status", "active").where("u", "name", WhereOperator.Equals, "Alice");

      const sql = multi.parseRaw();
      expect(sql).toEqual(
         'INSERT INTO "users" ("name") VALUES (Alice);UPDATE "users" AS "u" SET "status" = active WHERE "u"."name" = Alice;',
      );
   });

   it("multi builder default transaction state is on", () => {
      const sqlEasy = new SqliteSqlEasy();
      const multi = sqlEasy.newMultiBuilder();

      expect(multi.transactionState()).toEqual(MultiBuilderTransactionState.TransactionOn);
   });

   it("multi builder remove builder", () => {
      const sqlEasy = new SqliteSqlEasy();
      const multi = sqlEasy.newMultiBuilder();
      multi.setTransactionState(MultiBuilderTransactionState.TransactionOff);

      const b1 = multi.addBuilder("first");
      b1.insertInto("users").insertColumns(["name"]).insertValues(["A"]);

      const b2 = multi.addBuilder("second");
      b2.insertInto("users").insertColumns(["name"]).insertValues(["B"]);

      multi.removeBuilder("first");

      const sql = multi.parseRaw();
      expect(sql).toEqual('INSERT INTO "users" ("name") VALUES (B);');
   });

   it("multi builder reorder builders", () => {
      const sqlEasy = new SqliteSqlEasy();
      const multi = sqlEasy.newMultiBuilder();
      multi.setTransactionState(MultiBuilderTransactionState.TransactionOff);

      const b1 = multi.addBuilder("first");
      b1.insertInto("users").insertColumns(["name"]).insertValues(["A"]);

      const b2 = multi.addBuilder("second");
      b2.insertInto("users").insertColumns(["name"]).insertValues(["B"]);

      multi.reorderBuilders(["second", "first"]);

      const sql = multi.parseRaw();
      expect(sql).toEqual('INSERT INTO "users" ("name") VALUES (B);INSERT INTO "users" ("name") VALUES (A);');
   });

   it("multi builder with select and insert", () => {
      const sqlEasy = new SqliteSqlEasy();
      const multi = sqlEasy.newMultiBuilder();

      const b1 = multi.addBuilder("select_users");
      b1.selectAll().fromTable("users", "u");

      const b2 = multi.addBuilder("insert_log");
      b2.insertInto("audit_log").insertColumns(["action", "timestamp"]).insertValues(["user_query", "2024-01-01"]);

      const sql = multi.parseRaw();
      expect(sql).toEqual(
         'BEGIN; SELECT * FROM "users" AS "u";INSERT INTO "audit_log" ("action", "timestamp") VALUES (user_query, 2024-01-01);COMMIT; ',
      );
   });

   it("multi builder uses BEGIN/COMMIT for SQLite transactions", () => {
      const sqlEasy = new SqliteSqlEasy();
      const multi = sqlEasy.newMultiBuilder();

      const b1 = multi.addBuilder("test");
      b1.insertInto("test").insertColumns(["id"]).insertValues([1]);

      const sql = multi.parseRaw();
      expect(sql).toContain("BEGIN;");
      expect(sql).toContain("COMMIT;");
   });

   it("multi builder with delete", () => {
      const sqlEasy = new SqliteSqlEasy();
      const multi = sqlEasy.newMultiBuilder();
      multi.setTransactionState(MultiBuilderTransactionState.TransactionOff);

      const b1 = multi.addBuilder("delete_old");
      b1.deleteFrom("sessions", "s").where("s", "expired", WhereOperator.Equals, true);

      const b2 = multi.addBuilder("insert_new");
      b2.insertInto("sessions").insertColumns(["user_id", "token"]).insertValues([1, "abc123"]);

      const sql = multi.parseRaw();
      expect(sql).toEqual(
         'DELETE FROM "sessions" AS "s" WHERE "s"."expired" = true;INSERT INTO "sessions" ("user_id", "token") VALUES (1, abc123);',
      );
   });
});
