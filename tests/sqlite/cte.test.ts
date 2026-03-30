import { describe, expect, it } from "vitest";
import { SqliteSqlEasy, WhereOperator } from "../../src";

describe("SqliteSqlEasy CTE", () => {
   it("basic CTE", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .cte("active_users", (cb) => {
            cb.selectAll().fromTable("users", "u").where("u", "status", WhereOperator.Equals, "active");
         })
         .selectAll()
         .fromTable("active_users", "au");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'WITH "active_users" AS (SELECT * FROM "users" AS "u" WHERE "u"."status" = active) SELECT * FROM "active_users" AS "au";',
      );
   });

   it("basic CTE - parse prepared", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .cte("active_users", (cb) => {
            cb.selectAll().fromTable("users", "u").where("u", "status", WhereOperator.Equals, "active");
         })
         .selectAll()
         .fromTable("active_users", "au");

      const sql = builder.parse();
      expect(sql).toEqual(
         'WITH "active_users" AS (SELECT * FROM "users" AS "u" WHERE "u"."status" = ?) SELECT * FROM "active_users" AS "au";',
      );
   });

   it("multiple CTEs", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .cte("active_users", (cb) => {
            cb.selectAll().fromTable("users", "u").where("u", "status", WhereOperator.Equals, "active");
         })
         .cte("recent_orders", (cb) => {
            cb.selectAll().fromTable("orders", "o").where("o", "year", WhereOperator.Equals, 2024);
         })
         .selectAll()
         .fromTable("active_users", "au");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'WITH "active_users" AS (SELECT * FROM "users" AS "u" WHERE "u"."status" = active), "recent_orders" AS (SELECT * FROM "orders" AS "o" WHERE "o"."year" = 2024) SELECT * FROM "active_users" AS "au";',
      );
   });

   it("recursive CTE", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .cteRecursive("numbers", (cb) => {
            cb.selectRaw("1 AS n")
               .fromTable("dual", "d")
               .union((ub) => {
                  ub.selectRaw("n + 1").fromTable("numbers", "").where("numbers", "n", WhereOperator.LessThan, 10);
               });
         })
         .selectAll()
         .fromTable("numbers", "");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'WITH RECURSIVE "numbers" AS (SELECT 1 AS n FROM "dual" AS "d" UNION SELECT n + 1 FROM "numbers" WHERE "numbers"."n" < 10) SELECT * FROM "numbers";',
      );
   });

   it("cteRaw", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.cteRaw("my_cte", "SELECT 1 AS id, 'test' AS name").selectAll().fromTable("my_cte", "");

      const sql = builder.parseRaw();
      expect(sql).toEqual('WITH "my_cte" AS (SELECT 1 AS id, \'test\' AS name) SELECT * FROM "my_cte";');
   });

   it("CTE with where on outer query", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .cte("active_users", (cb) => {
            cb.selectColumn("u", "id", "")
               .selectColumn("u", "name", "")
               .fromTable("users", "u")
               .where("u", "status", WhereOperator.Equals, "active");
         })
         .selectAll()
         .fromTable("active_users", "au")
         .where("au", "id", WhereOperator.GreaterThan, 0);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'WITH "active_users" AS (SELECT "u"."id", "u"."name" FROM "users" AS "u" WHERE "u"."status" = active) SELECT * FROM "active_users" AS "au" WHERE "au"."id" > 0;',
      );
   });

   it("recursive CTE with non-recursive CTE mixed uses WITH RECURSIVE", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .cte("base", (cb) => {
            cb.selectRaw("1 AS val").fromTable("dual", "d");
         })
         .cteRecursive("counter", (cb) => {
            cb.selectRaw("1 AS n")
               .fromTable("dual", "d")
               .union((ub) => {
                  ub.selectRaw("n + 1").fromTable("counter", "").where("counter", "n", WhereOperator.LessThan, 5);
               });
         })
         .selectAll()
         .fromTable("counter", "");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'WITH RECURSIVE "base" AS (SELECT 1 AS val FROM "dual" AS "d"), "counter" AS (SELECT 1 AS n FROM "dual" AS "d" UNION SELECT n + 1 FROM "counter" WHERE "counter"."n" < 5) SELECT * FROM "counter";',
      );
   });
});
