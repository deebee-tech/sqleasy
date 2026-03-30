import { describe, expect, it } from "vitest";
import { MysqlSqlEasy } from "../../src";

describe("MysqlSqlEasy union", () => {
   it("UNION", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "name", "")
         .fromTable("users", "u")
         .union((ub) => {
            ub.selectColumn("c", "name", "").fromTable("customers", "c");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT `u`.`name` FROM `users` AS `u` UNION SELECT `c`.`name` FROM `customers` AS `c`;",
      );
   });

   it("UNION ALL", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "name", "")
         .fromTable("users", "u")
         .unionAll((ub) => {
            ub.selectColumn("c", "name", "").fromTable("customers", "c");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT `u`.`name` FROM `users` AS `u` UNION ALL SELECT `c`.`name` FROM `customers` AS `c`;",
      );
   });

   it("INTERSECT", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "email", "")
         .fromTable("users", "u")
         .intersect((ib) => {
            ib.selectColumn("s", "email", "").fromTable("subscribers", "s");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT `u`.`email` FROM `users` AS `u` INTERSECT SELECT `s`.`email` FROM `subscribers` AS `s`;",
      );
   });

   it("EXCEPT", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "email", "")
         .fromTable("users", "u")
         .except((eb) => {
            eb.selectColumn("b", "email", "").fromTable("blocked", "b");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT `u`.`email` FROM `users` AS `u` EXCEPT SELECT `b`.`email` FROM `blocked` AS `b`;",
      );
   });

   it("multiple UNIONs", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "name", "")
         .fromTable("users", "u")
         .union((ub) => {
            ub.selectColumn("c", "name", "").fromTable("customers", "c");
         })
         .union((ub) => {
            ub.selectColumn("e", "name", "").fromTable("employees", "e");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT `u`.`name` FROM `users` AS `u` " +
            "UNION SELECT `c`.`name` FROM `customers` AS `c` " +
            "UNION SELECT `e`.`name` FROM `employees` AS `e`;",
      );
   });

   it("UNION with UNION ALL combined", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "name", "")
         .fromTable("users", "u")
         .union((ub) => {
            ub.selectColumn("c", "name", "").fromTable("customers", "c");
         })
         .unionAll((ub) => {
            ub.selectColumn("e", "name", "").fromTable("employees", "e");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT `u`.`name` FROM `users` AS `u` " +
            "UNION SELECT `c`.`name` FROM `customers` AS `c` " +
            "UNION ALL SELECT `e`.`name` FROM `employees` AS `e`;",
      );
   });
});
