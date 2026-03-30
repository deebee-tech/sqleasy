import { describe, expect, it } from "vitest";
import { MysqlSqlEasy, WhereOperator } from "../../src";

describe("MysqlSqlEasy CTE", () => {
   it("simple CTE", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .cte("active_users", (cb) => {
            cb.selectAll().fromTable("users", "u").where("u", "active", WhereOperator.Equals, true);
         })
         .selectAll()
         .fromTable("active_users", "au");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "WITH `active_users` AS (SELECT * FROM `users` AS `u` WHERE `u`.`active` = true) " +
            "SELECT * FROM `active_users` AS `au`;",
      );
   });

   it("multiple CTEs", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .cte("active_users", (cb) => {
            cb.selectAll().fromTable("users", "u").where("u", "active", WhereOperator.Equals, true);
         })
         .cte("recent_orders", (cb) => {
            cb.selectAll().fromTable("orders", "o").where("o", "year", WhereOperator.Equals, 2024);
         })
         .selectAll()
         .fromTable("active_users", "au");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "WITH `active_users` AS (SELECT * FROM `users` AS `u` WHERE `u`.`active` = true), " +
            "`recent_orders` AS (SELECT * FROM `orders` AS `o` WHERE `o`.`year` = 2024) " +
            "SELECT * FROM `active_users` AS `au`;",
      );
   });

   it("recursive CTE", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .cteRecursive("numbers", (cb) => {
            cb.selectRaw("1 AS n").fromRaw("DUAL");
         })
         .selectAll()
         .fromTable("numbers", "");

      const sql = builder.parseRaw();
      expect(sql).toEqual("WITH RECURSIVE `numbers` AS (SELECT 1 AS n FROM DUAL) SELECT * FROM `numbers`;");
   });

   it("recursive CTE mixed with non-recursive uses WITH RECURSIVE", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .cte("base", (cb) => {
            cb.selectAll().fromTable("categories", "c");
         })
         .cteRecursive("tree", (cb) => {
            cb.selectAll().fromTable("base", "b");
         })
         .selectAll()
         .fromTable("tree", "t");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "WITH RECURSIVE `base` AS (SELECT * FROM `categories` AS `c`), " +
            "`tree` AS (SELECT * FROM `base` AS `b`) " +
            "SELECT * FROM `tree` AS `t`;",
      );
   });

   it("cteRaw", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.cteRaw("my_cte", "SELECT 1 AS id, 'test' AS name").selectAll().fromTable("my_cte", "m");

      const sql = builder.parseRaw();
      expect(sql).toEqual("WITH `my_cte` AS (SELECT 1 AS id, 'test' AS name) SELECT * FROM `my_cte` AS `m`;");
   });

   it("CTE with complex inner query", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .cte("user_orders", (cb) => {
            cb.selectColumn("u", "id", "user_id")
               .selectRaw("COUNT(*) AS order_count")
               .fromTable("users", "u")
               .fromTable("orders", "o")
               .where("u", "id", WhereOperator.Equals, "o.user_id")
               .groupByColumn("u", "id");
         })
         .selectAll()
         .fromTable("user_orders", "uo")
         .where("uo", "order_count", WhereOperator.GreaterThan, 5);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "WITH `user_orders` AS (SELECT `u`.`id` AS `user_id`, COUNT(*) AS order_count " +
            "FROM `users` AS `u`, `orders` AS `o` " +
            "WHERE `u`.`id` = o.user_id " +
            "GROUP BY `u`.`id`) " +
            "SELECT * FROM `user_orders` AS `uo` WHERE `uo`.`order_count` > 5;",
      );
   });
});
