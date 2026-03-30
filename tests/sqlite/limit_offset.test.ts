import { describe, expect, it } from "vitest";
import { OrderByDirection, SqliteSqlEasy, WhereOperator } from "../../src";

describe("SqliteSqlEasy limit offset", () => {
   it("no default limit when no where clause and no explicit limit", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u";');
      expect(sql).not.toContain("LIMIT");
   });

   it("no limit when where clause present and no explicit limit", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" WHERE "u"."id" = 1;');
      expect(sql).not.toContain("LIMIT");
   });

   it("explicit limit", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").limit(10);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" LIMIT 10;');
   });

   it("explicit limit with where clause", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "status", WhereOperator.Equals, "active").limit(25);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" WHERE "u"."status" = active LIMIT 25;');
   });

   it("offset with limit", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .orderByColumn("u", "id", OrderByDirection.Ascending)
         .limit(10)
         .offset(5);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" ORDER BY "u"."id" ASC LIMIT 10  OFFSET 5;');
   });

   it("offset without explicit limit adds default limit", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").orderByColumn("u", "id", OrderByDirection.Ascending).offset(20);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" ORDER BY "u"."id" ASC LIMIT 1000 OFFSET 20;');
   });

   it("limit and offset - parse prepared", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .orderByColumn("u", "id", OrderByDirection.Ascending)
         .limit(10)
         .offset(5);

      const sql = builder.parse();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" ORDER BY "u"."id" ASC LIMIT 10  OFFSET 5;');
   });

   it("offset requires order by", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").limit(10).offset(5);

      expect(() => builder.parseRaw()).toThrow();
   });

   it("pagination pattern", () => {
      const sqlEasy = new SqliteSqlEasy();
      const pageSize = 20;
      const page = 3;
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .orderByColumn("u", "id", OrderByDirection.Ascending)
         .limit(pageSize)
         .offset((page - 1) * pageSize);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" ORDER BY "u"."id" ASC LIMIT 20  OFFSET 40;');
   });

   it("limit only without order by", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").limit(5);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" LIMIT 5;');
   });
});
