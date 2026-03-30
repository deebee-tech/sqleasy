import { describe, expect, it } from "vitest";
import { PostgresSqlEasy, WhereOperator } from "../../src";

describe("PostgresSqlEasy update", () => {
   it("update single column", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.updateTable("users", "u").set("name", "John Updated").where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual('UPDATE "public"."users" AS "u" SET "name" = John Updated WHERE "u"."id" = 1;');
   });

   it("update multiple columns", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .updateTable("users", "u")
         .set("name", "John Updated")
         .set("email", "john.updated@example.com")
         .set("age", 31)
         .where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'UPDATE "public"."users" AS "u" SET "name" = John Updated, "email" = john.updated@example.com, "age" = 31 WHERE "u"."id" = 1;',
      );
   });

   it("update with setColumns", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .updateTable("users", "u")
         .setColumns([
            { columnName: "name", value: "Jane" },
            { columnName: "active", value: true },
         ])
         .where("u", "id", WhereOperator.Equals, 5);

      const sql = builder.parseRaw();
      expect(sql).toEqual('UPDATE "public"."users" AS "u" SET "name" = Jane, "active" = true WHERE "u"."id" = 5;');
   });

   it("update with setRaw", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .updateTable("users", "u")
         .setRaw('"login_count" = "login_count" + 1')
         .where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual('UPDATE "public"."users" AS "u" SET "login_count" = "login_count" + 1 WHERE "u"."id" = 1;');
   });

   it("update with custom owner", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .updateTableWithOwner("sales", "orders", "o")
         .set("status", "shipped")
         .where("o", "id", WhereOperator.Equals, 100);

      const sql = builder.parseRaw();
      expect(sql).toEqual('UPDATE "sales"."orders" AS "o" SET "status" = shipped WHERE "o"."id" = 100;');
   });

   it("update without alias", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.updateTable("users", "").set("active", false).where("users", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual('UPDATE "public"."users" SET "active" = false WHERE "users"."id" = 1;');
   });

   it("update with multiple where conditions", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .updateTable("users", "u")
         .set("status", "inactive")
         .where("u", "last_login", WhereOperator.LessThan, "2023-01-01")
         .and()
         .where("u", "active", WhereOperator.Equals, true);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'UPDATE "public"."users" AS "u" SET "status" = inactive WHERE "u"."last_login" < 2023-01-01 AND "u"."active" = true;',
      );
   });

   it("update with parse() - $1, $2 placeholders", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.updateTable("users", "u").set("name", "John Updated").where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parse();
      expect(sql).toEqual('UPDATE "public"."users" AS "u" SET "name" = $1 WHERE "u"."id" = $2;');
   });

   it("update multiple columns with parse() - sequential placeholders", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .updateTable("users", "u")
         .set("name", "John Updated")
         .set("age", 31)
         .where("u", "id", WhereOperator.Equals, 1)
         .and()
         .where("u", "active", WhereOperator.Equals, true);

      const sql = builder.parse();
      expect(sql).toEqual(
         'UPDATE "public"."users" AS "u" SET "name" = $1, "age" = $2 WHERE "u"."id" = $3 AND "u"."active" = $4;',
      );
   });
});
