import { describe, expect, it } from "vitest";
import { SqliteSqlEasy, WhereOperator } from "../../src";

describe("SqliteSqlEasy update", () => {
   it("update single column", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .updateTable("users", "u")
         .set("name", "John")
         .where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'UPDATE "users" AS "u" SET "name" = John WHERE "u"."id" = 1;',
      );
   });

   it("update single column - parse prepared", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .updateTable("users", "u")
         .set("name", "John")
         .where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parse();
      expect(sql).toEqual(
         'UPDATE "users" AS "u" SET "name" = ? WHERE "u"."id" = ?;',
      );
   });

   it("update multiple columns with set", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .updateTable("users", "u")
         .set("name", "John")
         .set("email", "john@example.com")
         .where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'UPDATE "users" AS "u" SET "name" = John, "email" = john@example.com WHERE "u"."id" = 1;',
      );
   });

   it("update with setColumns", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .updateTable("users", "u")
         .setColumns([
            { columnName: "name", value: "Jane" },
            { columnName: "age", value: 30 },
            { columnName: "active", value: true },
         ])
         .where("u", "id", WhereOperator.Equals, 2);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'UPDATE "users" AS "u" SET "name" = Jane, "age" = 30, "active" = true WHERE "u"."id" = 2;',
      );
   });

   it("update with setColumns - parse prepared", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .updateTable("users", "u")
         .setColumns([
            { columnName: "name", value: "Jane" },
            { columnName: "age", value: 30 },
         ])
         .where("u", "id", WhereOperator.Equals, 2);

      const sql = builder.parse();
      expect(sql).toEqual(
         'UPDATE "users" AS "u" SET "name" = ?, "age" = ? WHERE "u"."id" = ?;',
      );
   });

   it("update with setRaw", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .updateTable("users", "u")
         .setRaw('"counter" = "counter" + 1')
         .where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'UPDATE "users" AS "u" SET "counter" = "counter" + 1 WHERE "u"."id" = 1;',
      );
   });

   it("update with complex where", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .updateTable("users", "u")
         .set("status", "inactive")
         .where("u", "last_login", WhereOperator.LessThan, "2024-01-01")
         .and()
         .where("u", "status", WhereOperator.Equals, "active");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'UPDATE "users" AS "u" SET "status" = inactive WHERE "u"."last_login" < 2024-01-01 AND "u"."status" = active;',
      );
   });

   it("update without owner prefix", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .updateTable("users", "u")
         .set("name", "Test")
         .where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).not.toContain('"".');
   });

   it("update with explicit owner", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .updateTableWithOwner("main", "users", "u")
         .set("name", "Test")
         .where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'UPDATE "main"."users" AS "u" SET "name" = Test WHERE "u"."id" = 1;',
      );
   });

   it("update with numeric value", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .updateTable("products", "p")
         .set("price", 19.99)
         .where("p", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'UPDATE "products" AS "p" SET "price" = 19.99 WHERE "p"."id" = 1;',
      );
   });
});
