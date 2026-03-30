import { describe, expect, it } from "vitest";
import { PostgresSqlEasy, WhereOperator } from "../../src";

describe("PostgresSqlEasy union", () => {
   it("union two queries", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "name", "")
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, true)
         .union((ub) => {
            ub.selectColumn("a", "name", "").fromTable("admins", "a").where("a", "active", WhereOperator.Equals, true);
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT "u"."name" FROM "public"."users" AS "u" WHERE "u"."active" = true UNION SELECT "a"."name" FROM "public"."admins" AS "a" WHERE "a"."active" = true;',
      );
   });

   it("union all", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "name", "")
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, true)
         .unionAll((ub) => {
            ub.selectColumn("a", "name", "").fromTable("admins", "a").where("a", "active", WhereOperator.Equals, true);
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT "u"."name" FROM "public"."users" AS "u" WHERE "u"."active" = true UNION ALL SELECT "a"."name" FROM "public"."admins" AS "a" WHERE "a"."active" = true;',
      );
   });

   it("intersect", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "id", "")
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, true)
         .intersect((ib) => {
            ib.selectColumn("p", "user_id", "")
               .fromTable("premium_users", "p")
               .where("p", "tier", WhereOperator.Equals, "gold");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT "u"."id" FROM "public"."users" AS "u" WHERE "u"."active" = true INTERSECT SELECT "p"."user_id" FROM "public"."premium_users" AS "p" WHERE "p"."tier" = gold;',
      );
   });

   it("except", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "id", "")
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, true)
         .except((eb) => {
            eb.selectColumn("b", "user_id", "").fromTable("banned_users", "b");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT "u"."id" FROM "public"."users" AS "u" WHERE "u"."active" = true EXCEPT SELECT "b"."user_id" FROM "public"."banned_users" AS "b";',
      );
   });

   it("multiple unions", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "name", "")
         .selectColumn("u", "email", "")
         .fromTable("users", "u")
         .where("u", "type", WhereOperator.Equals, "customer")
         .union((ub) => {
            ub.selectColumn("a", "name", "")
               .selectColumn("a", "email", "")
               .fromTable("admins", "a")
               .where("a", "type", WhereOperator.Equals, "staff");
         })
         .union((ub) => {
            ub.selectColumn("g", "name", "")
               .selectColumn("g", "email", "")
               .fromTable("guests", "g")
               .where("g", "type", WhereOperator.Equals, "visitor");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT "u"."name", "u"."email" FROM "public"."users" AS "u" WHERE "u"."type" = customer UNION SELECT "a"."name", "a"."email" FROM "public"."admins" AS "a" WHERE "a"."type" = staff UNION SELECT "g"."name", "g"."email" FROM "public"."guests" AS "g" WHERE "g"."type" = visitor;',
      );
   });

   it("union with parse() - $1, $2 placeholders", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "name", "")
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, true)
         .union((ub) => {
            ub.selectColumn("a", "name", "").fromTable("admins", "a").where("a", "active", WhereOperator.Equals, true);
         });

      const sql = builder.parse();
      expect(sql).toEqual(
         'SELECT "u"."name" FROM "public"."users" AS "u" WHERE "u"."active" = $1 UNION SELECT "a"."name" FROM "public"."admins" AS "a" WHERE "a"."active" = $2;',
      );
   });
});
