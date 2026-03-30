import { describe, expect, it } from "vitest";
import { SqliteSqlEasy } from "../../src";

describe("SqliteSqlEasy insert", () => {
   it("insert single row", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .insertInto("users")
         .insertColumns(["name", "email"])
         .insertValues(["John", "john@example.com"]);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'INSERT INTO "users" ("name", "email") VALUES (John, john@example.com);',
      );
   });

   it("insert single row - parse prepared", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .insertInto("users")
         .insertColumns(["name", "email"])
         .insertValues(["John", "john@example.com"]);

      const sql = builder.parse();
      expect(sql).toEqual(
         'INSERT INTO "users" ("name", "email") VALUES (?, ?);',
      );
   });

   it("insert with numeric values", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .insertInto("users")
         .insertColumns(["name", "age", "score"])
         .insertValues(["Alice", 25, 99.5]);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'INSERT INTO "users" ("name", "age", "score") VALUES (Alice, 25, 99.5);',
      );
   });

   it("insert multiple rows", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .insertInto("users")
         .insertColumns(["name", "email"])
         .insertValues(["John", "john@example.com"])
         .insertValues(["Jane", "jane@example.com"]);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'INSERT INTO "users" ("name", "email") VALUES (John, john@example.com), (Jane, jane@example.com);',
      );
   });

   it("insert multiple rows - parse prepared", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .insertInto("users")
         .insertColumns(["name", "email"])
         .insertValues(["John", "john@example.com"])
         .insertValues(["Jane", "jane@example.com"]);

      const sql = builder.parse();
      expect(sql).toEqual(
         'INSERT INTO "users" ("name", "email") VALUES (?, ?), (?, ?);',
      );
   });

   it("insert raw", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .insertInto("users")
         .insertRaw('INSERT INTO "users" ("name") VALUES (\'test\')');

      const sql = builder.parseRaw();
      expect(sql).toEqual("INSERT INTO \"users\" (\"name\") VALUES ('test');");
   });

   it("insert with boolean values", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .insertInto("users")
         .insertColumns(["name", "active"])
         .insertValues(["Bob", true]);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'INSERT INTO "users" ("name", "active") VALUES (Bob, true);',
      );
   });

   it("insert without owner prefix (SQLite default)", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .insertInto("users")
         .insertColumns(["name"])
         .insertValues(["Test"]);

      const sql = builder.parseRaw();
      expect(sql).not.toContain('"".');
      expect(sql).toEqual('INSERT INTO "users" ("name") VALUES (Test);');
   });

   it("insert with explicit owner", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .insertIntoWithOwner("main", "users")
         .insertColumns(["name"])
         .insertValues(["Test"]);

      const sql = builder.parseRaw();
      expect(sql).toEqual('INSERT INTO "main"."users" ("name") VALUES (Test);');
   });

   it("insert three rows with three columns", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .insertInto("products")
         .insertColumns(["name", "price", "quantity"])
         .insertValues(["Widget", 9.99, 100])
         .insertValues(["Gadget", 24.99, 50])
         .insertValues(["Gizmo", 14.99, 75]);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'INSERT INTO "products" ("name", "price", "quantity") VALUES (Widget, 9.99, 100), (Gadget, 24.99, 50), (Gizmo, 14.99, 75);',
      );
   });

   it("insert three rows - parse prepared placeholders", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .insertInto("products")
         .insertColumns(["name", "price", "quantity"])
         .insertValues(["Widget", 9.99, 100])
         .insertValues(["Gadget", 24.99, 50])
         .insertValues(["Gizmo", 14.99, 75]);

      const sql = builder.parse();
      expect(sql).toEqual(
         'INSERT INTO "products" ("name", "price", "quantity") VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?);',
      );
   });
});
