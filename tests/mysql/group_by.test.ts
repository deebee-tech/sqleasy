import { describe, expect, it } from "vitest";
import { MysqlSqlEasy, WhereOperator } from "../../src";

describe("MysqlSqlEasy group by", () => {
   it("groupByColumn", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectRaw("COUNT(*) AS total").selectColumn("u", "role", "").fromTable("users", "u").groupByColumn("u", "role");

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT COUNT(*) AS total, `u`.`role` FROM `users` AS `u` GROUP BY `u`.`role`;");
   });

   it("groupByColumns", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectRaw("COUNT(*) AS total")
         .selectColumn("u", "role", "")
         .selectColumn("u", "status", "")
         .fromTable("users", "u")
         .groupByColumns([
            { tableNameOrAlias: "u", columnName: "role" },
            { tableNameOrAlias: "u", columnName: "status" },
         ]);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT COUNT(*) AS total, `u`.`role`, `u`.`status` FROM `users` AS `u` GROUP BY `u`.`role`, `u`.`status`;",
      );
   });

   it("groupByRaw", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectRaw("COUNT(*) AS total")
         .selectRaw("YEAR(`u`.`created_at`) AS yr")
         .fromTable("users", "u")
         .groupByRaw("YEAR(`u`.`created_at`)");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT COUNT(*) AS total, YEAR(`u`.`created_at`) AS yr FROM `users` AS `u` GROUP BY YEAR(`u`.`created_at`);",
      );
   });

   it("groupByRaws", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectRaw("COUNT(*) AS total")
         .fromTable("users", "u")
         .groupByRaws(["YEAR(`u`.`created_at`)", "MONTH(`u`.`created_at`)"]);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT COUNT(*) AS total FROM `users` AS `u` GROUP BY YEAR(`u`.`created_at`), MONTH(`u`.`created_at`);",
      );
   });

   it("groupBy with HAVING", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectRaw("COUNT(*) AS total")
         .selectColumn("u", "role", "")
         .fromTable("users", "u")
         .groupByColumn("u", "role")
         .having("u", "role", WhereOperator.GreaterThan, 5);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT COUNT(*) AS total, `u`.`role` FROM `users` AS `u` GROUP BY `u`.`role` HAVING `u`.`role` > 5;",
      );
   });

   it("groupBy with havingRaw", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectRaw("COUNT(*) AS total")
         .selectColumn("u", "role", "")
         .fromTable("users", "u")
         .groupByColumn("u", "role")
         .havingRaw("COUNT(*) > 10");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT COUNT(*) AS total, `u`.`role` FROM `users` AS `u` GROUP BY `u`.`role` HAVING COUNT(*) > 10;",
      );
   });

   it("HAVING without GROUP BY throws", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectRaw("COUNT(*) AS total")
         .fromTable("users", "u")
         .having("u", "role", WhereOperator.GreaterThan, 5);

      expect(() => builder.parseRaw()).toThrow("HAVING requires a GROUP BY clause");
   });

   it("groupBy with WHERE and HAVING", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectRaw("COUNT(*) AS total")
         .selectColumn("u", "role", "")
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, true)
         .groupByColumn("u", "role")
         .having("u", "role", WhereOperator.GreaterThan, 2);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT COUNT(*) AS total, `u`.`role` FROM `users` AS `u` WHERE `u`.`active` = true GROUP BY `u`.`role` HAVING `u`.`role` > 2;",
      );
   });
});
