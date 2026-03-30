import { describe, expect, it } from "vitest";
import { OrderByDirection, PostgresSqlEasy, WhereOperator } from "../../src";

describe("PostgresSqlEasy limit offset", () => {
   it("no default limit when no where clause", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "public"."users" AS "u";');
   });

   it("no limit when where clause present", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" WHERE "u"."id" = 1;');
   });

   it("explicit limit", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, true)
         .limit(10);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" WHERE "u"."active" = true LIMIT 10;',
      );
   });

   it("limit and offset with order by", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, true)
         .orderByColumn("u", "id", OrderByDirection.Ascending)
         .limit(10)
         .offset(5);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" WHERE "u"."active" = true ORDER BY "u"."id" ASC LIMIT 10  OFFSET 5;',
      );
   });

   it("offset only with order by", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, true)
         .orderByColumn("u", "id", OrderByDirection.Ascending)
         .offset(20);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" WHERE "u"."active" = true ORDER BY "u"."id" ASC  OFFSET 20;',
      );
   });

   it("offset without order by throws error", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, true)
         .offset(20);

      expect(() => builder.parseRaw()).toThrow();
   });

   it("limit and offset with parse() prepared statement", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, true)
         .orderByColumn("u", "id", OrderByDirection.Ascending)
         .limit(10)
         .offset(5);

      const sql = builder.parse();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" WHERE "u"."active" = $1 ORDER BY "u"."id" ASC LIMIT 10  OFFSET 5;',
      );
   });

   it("clearLimit removes limit", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, true)
         .limit(10)
         .clearLimit();

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" WHERE "u"."active" = true;',
      );
   });

   it("clearOffset removes offset", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, true)
         .orderByColumn("u", "id", OrderByDirection.Ascending)
         .limit(10)
         .offset(5)
         .clearOffset();

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" WHERE "u"."active" = true ORDER BY "u"."id" ASC LIMIT 10;',
      );
   });

   it("limit without where clause", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .limit(50);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" LIMIT 50;');
   });
});
