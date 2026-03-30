import { describe, expect, it } from "vitest";
import { PostgresSqlEasy, WhereOperator } from "../../src";

describe("PostgresSqlEasy CTE", () => {
   it("simple CTE", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .cte("active_users", (cb) => {
            cb.selectAll()
               .fromTable("users", "u")
               .where("u", "active", WhereOperator.Equals, true);
         })
         .selectAll()
         .fromRaw('"active_users" AS "au"');

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'WITH "active_users" AS (SELECT * FROM "public"."users" AS "u" WHERE "u"."active" = true) SELECT * FROM "active_users" AS "au";',
      );
   });

   it("multiple CTEs", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .cte("active_users", (cb) => {
            cb.selectAll()
               .fromTable("users", "u")
               .where("u", "active", WhereOperator.Equals, true);
         })
         .cte("user_orders", (cb) => {
            cb.selectAll()
               .fromTable("orders", "o")
               .where("o", "status", WhereOperator.Equals, "pending");
         })
         .selectAll()
         .fromRaw('"active_users" AS "au"');

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'WITH "active_users" AS (SELECT * FROM "public"."users" AS "u" WHERE "u"."active" = true), "user_orders" AS (SELECT * FROM "public"."orders" AS "o" WHERE "o"."status" = pending) SELECT * FROM "active_users" AS "au";',
      );
   });

   it("recursive CTE", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .cteRecursive("hierarchy", (cb) => {
            cb.selectColumn("e", "id", "")
               .selectColumn("e", "name", "")
               .selectColumn("e", "manager_id", "")
               .fromTable("employees", "e")
               .where("e", "manager_id", WhereOperator.Equals, 1);
         })
         .selectAll()
         .fromRaw('"hierarchy" AS "h"');

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'WITH RECURSIVE "hierarchy" AS (SELECT "e"."id", "e"."name", "e"."manager_id" FROM "public"."employees" AS "e" WHERE "e"."manager_id" = 1) SELECT * FROM "hierarchy" AS "h";',
      );
   });

   it("cteRaw", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .cteRaw("stats", 'SELECT COUNT(*) AS cnt FROM "public"."users" AS "u"')
         .selectAll()
         .fromRaw('"stats" AS "s"');

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'WITH "stats" AS (SELECT COUNT(*) AS cnt FROM "public"."users" AS "u") SELECT * FROM "stats" AS "s";',
      );
   });

   it("CTE with parse() - prepared statement placeholders", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .cte("active_users", (cb) => {
            cb.selectAll()
               .fromTable("users", "u")
               .where("u", "active", WhereOperator.Equals, true);
         })
         .selectAll()
         .fromRaw('"active_users" AS "au"')
         .where("au", "age", WhereOperator.GreaterThan, 18);

      const sql = builder.parse();
      expect(sql).toEqual(
         'WITH "active_users" AS (SELECT * FROM "public"."users" AS "u" WHERE "u"."active" = $1) SELECT * FROM "active_users" AS "au" WHERE "au"."age" > $2;',
      );
   });

   it("mixed recursive and non-recursive CTEs uses RECURSIVE keyword", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .cte("base_users", (cb) => {
            cb.selectAll()
               .fromTable("users", "u")
               .where("u", "active", WhereOperator.Equals, true);
         })
         .cteRecursive("hierarchy", (cb) => {
            cb.selectColumn("e", "id", "")
               .selectColumn("e", "name", "")
               .fromTable("employees", "e")
               .where("e", "level", WhereOperator.Equals, 1);
         })
         .selectAll()
         .fromRaw('"base_users" AS "bu"');

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'WITH RECURSIVE "base_users" AS (SELECT * FROM "public"."users" AS "u" WHERE "u"."active" = true), "hierarchy" AS (SELECT "e"."id", "e"."name" FROM "public"."employees" AS "e" WHERE "e"."level" = 1) SELECT * FROM "base_users" AS "bu";',
      );
   });
});
