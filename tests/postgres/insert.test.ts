import { describe, expect, it } from "vitest";
import { PostgresSqlEasy } from "../../src";

describe("PostgresSqlEasy insert", () => {
   it("insert single row", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .insertInto("users")
         .insertColumns(["name", "email", "age"])
         .insertValues(["John", "john@example.com", 30]);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'INSERT INTO "public"."users" ("name", "email", "age") VALUES (John, john@example.com, 30);',
      );
   });

   it("insert multiple rows", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .insertInto("users")
         .insertColumns(["name", "email"])
         .insertValues(["John", "john@example.com"])
         .insertValues(["Jane", "jane@example.com"]);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'INSERT INTO "public"."users" ("name", "email") VALUES (John, john@example.com), (Jane, jane@example.com);',
      );
   });

   it("insert with custom owner", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .insertIntoWithOwner("sales", "orders")
         .insertColumns(["product_id", "quantity"])
         .insertValues([101, 5]);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'INSERT INTO "sales"."orders" ("product_id", "quantity") VALUES (101, 5);',
      );
   });

   it("insertRaw", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.insertRaw('INSERT INTO "public"."users" ("name") VALUES (\'Test\')');

      const sql = builder.parseRaw();
      expect(sql).toEqual('INSERT INTO "public"."users" ("name") VALUES (\'Test\');');
   });

   it("insert with boolean and null-like values", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .insertInto("users")
         .insertColumns(["name", "active", "age"])
         .insertValues(["John", true, 25]);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'INSERT INTO "public"."users" ("name", "active", "age") VALUES (John, true, 25);',
      );
   });

   it("insert with parse() - $1, $2, $3 placeholders", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .insertInto("users")
         .insertColumns(["name", "email", "age"])
         .insertValues(["John", "john@example.com", 30]);

      const sql = builder.parse();
      expect(sql).toEqual(
         'INSERT INTO "public"."users" ("name", "email", "age") VALUES ($1, $2, $3);',
      );
   });

   it("insert multiple rows with parse() - sequential placeholders", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .insertInto("users")
         .insertColumns(["name", "email"])
         .insertValues(["John", "john@example.com"])
         .insertValues(["Jane", "jane@example.com"]);

      const sql = builder.parse();
      expect(sql).toEqual(
         'INSERT INTO "public"."users" ("name", "email") VALUES ($1, $2), ($3, $4);',
      );
   });

   it("insert without columns", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.insertInto("users").insertValues(["John", "john@example.com", 30]);

      const sql = builder.parseRaw();
      expect(sql).toEqual('INSERT INTO "public"."users" VALUES (John, john@example.com, 30);');
   });
});
