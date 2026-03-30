import { describe, expect, it } from "vitest";
import { SqliteSqlEasy, WhereOperator } from "../../src";

describe("SqliteSqlEasy union", () => {
   it("union", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "name", "")
         .fromTable("users", "u")
         .where("u", "status", WhereOperator.Equals, "active")
         .union((ub) => {
            ub.selectColumn("u", "name", "")
               .fromTable("users", "u")
               .where("u", "status", WhereOperator.Equals, "pending");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT "u"."name" FROM "users" AS "u" WHERE "u"."status" = active UNION SELECT "u"."name" FROM "users" AS "u" WHERE "u"."status" = pending;',
      );
   });

   it("union - parse prepared", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "name", "")
         .fromTable("users", "u")
         .where("u", "status", WhereOperator.Equals, "active")
         .union((ub) => {
            ub.selectColumn("u", "name", "")
               .fromTable("users", "u")
               .where("u", "status", WhereOperator.Equals, "pending");
         });

      const sql = builder.parse();
      expect(sql).toEqual(
         'SELECT "u"."name" FROM "users" AS "u" WHERE "u"."status" = ? UNION SELECT "u"."name" FROM "users" AS "u" WHERE "u"."status" = ?;',
      );
   });

   it("union all", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "name", "")
         .fromTable("users", "u")
         .where("u", "type", WhereOperator.Equals, "A")
         .unionAll((ub) => {
            ub.selectColumn("u", "name", "")
               .fromTable("users", "u")
               .where("u", "type", WhereOperator.Equals, "B");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT "u"."name" FROM "users" AS "u" WHERE "u"."type" = A UNION ALL SELECT "u"."name" FROM "users" AS "u" WHERE "u"."type" = B;',
      );
   });

   it("intersect", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "name", "")
         .fromTable("users", "u")
         .where("u", "age", WhereOperator.GreaterThan, 18)
         .intersect((ib) => {
            ib.selectColumn("u", "name", "")
               .fromTable("users", "u")
               .where("u", "status", WhereOperator.Equals, "active");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT "u"."name" FROM "users" AS "u" WHERE "u"."age" > 18 INTERSECT SELECT "u"."name" FROM "users" AS "u" WHERE "u"."status" = active;',
      );
   });

   it("except", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "id", "")
         .fromTable("users", "u")
         .where("u", "status", WhereOperator.Equals, "active")
         .except((eb) => {
            eb.selectColumn("b", "user_id", "")
               .fromTable("banned_users", "b")
               .where("b", "banned", WhereOperator.Equals, true);
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT "u"."id" FROM "users" AS "u" WHERE "u"."status" = active EXCEPT SELECT "b"."user_id" FROM "banned_users" AS "b" WHERE "b"."banned" = true;',
      );
   });

   it("multiple unions", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "name", "")
         .fromTable("users", "u")
         .where("u", "type", WhereOperator.Equals, "A")
         .union((ub) => {
            ub.selectColumn("u", "name", "")
               .fromTable("users", "u")
               .where("u", "type", WhereOperator.Equals, "B");
         })
         .union((ub) => {
            ub.selectColumn("u", "name", "")
               .fromTable("users", "u")
               .where("u", "type", WhereOperator.Equals, "C");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT "u"."name" FROM "users" AS "u" WHERE "u"."type" = A UNION SELECT "u"."name" FROM "users" AS "u" WHERE "u"."type" = B UNION SELECT "u"."name" FROM "users" AS "u" WHERE "u"."type" = C;',
      );
   });

   it("union with limit", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "name", "")
         .selectColumn("u", "age", "")
         .fromTable("users", "u")
         .where("u", "status", WhereOperator.Equals, "active")
         .union((ub) => {
            ub.selectColumn("u", "name", "")
               .selectColumn("u", "age", "")
               .fromTable("users", "u")
               .where("u", "status", WhereOperator.Equals, "pending");
         })
         .limit(10);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT "u"."name", "u"."age" FROM "users" AS "u" WHERE "u"."status" = active UNION SELECT "u"."name", "u"."age" FROM "users" AS "u" WHERE "u"."status" = pending LIMIT 10;',
      );
   });
});
