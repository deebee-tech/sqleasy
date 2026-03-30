import { describe, expect, it } from "vitest";
import { SqliteSqlEasy } from "../../src";

describe("SqliteSqlEasy select", () => {
   it("select all", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u";');
   });

   it("select all - parse prepared", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u");

      const sql = builder.parse();
      expect(sql).toEqual('SELECT * FROM "users" AS "u";');
   });

   it("select single column", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectColumn("u", "name", "").fromTable("users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT "u"."name" FROM "users" AS "u";');
   });

   it("select single column with alias", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectColumn("u", "name", "user_name").fromTable("users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT "u"."name" AS "user_name" FROM "users" AS "u";');
   });

   it("select multiple columns", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumns([
            { tableNameOrAlias: "u", columnName: "id", columnAlias: "" },
            { tableNameOrAlias: "u", columnName: "name", columnAlias: "user_name" },
            { tableNameOrAlias: "u", columnName: "email", columnAlias: "" },
         ])
         .fromTable("users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT "u"."id", "u"."name" AS "user_name", "u"."email" FROM "users" AS "u";',
      );
   });

   it("select raw", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectRaw("COUNT(*) AS total").fromTable("users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT COUNT(*) AS total FROM "users" AS "u";');
   });

   it("select multiple raws", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectRaws(["COUNT(*) AS total", "MAX(age) AS max_age"]).fromTable("users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT COUNT(*) AS total, MAX(age) AS max_age FROM "users" AS "u";');
   });

   it("select with builder (subquery)", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .selectWithBuilder("sub_count", (sb) => {
            sb.selectRaw("COUNT(*)").fromTable("orders", "o");
         })
         .fromTable("users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT *, (SELECT COUNT(*) FROM "orders" AS "o") AS "sub_count" FROM "users" AS "u";',
      );
   });

   it("select distinct", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().distinct().fromTable("users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT DISTINCT * FROM "users" AS "u";');
   });

   it("select distinct with columns", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "name", "")
         .selectColumn("u", "email", "")
         .distinct()
         .fromTable("users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT DISTINCT "u"."name", "u"."email" FROM "users" AS "u";');
   });

   it("select all and column combined", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .selectColumn("u", "id", "user_id")
         .fromTable("users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT *, "u"."id" AS "user_id" FROM "users" AS "u";');
   });
});
