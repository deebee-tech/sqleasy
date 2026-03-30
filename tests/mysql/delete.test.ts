import { describe, expect, it } from "vitest";
import { MysqlSqlEasy, WhereOperator } from "../../src";

describe("MysqlSqlEasy delete", () => {
   it("deleteFrom", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.deleteFrom("users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual("DELETE FROM `users` AS `u`;");
   });

   it("deleteFrom without alias", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.deleteFrom("users", "");

      const sql = builder.parseRaw();
      expect(sql).toEqual("DELETE FROM `users`;");
   });

   it("deleteFrom with WHERE", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.deleteFrom("users", "u").where("u", "id", WhereOperator.Equals, 42);

      const sql = builder.parseRaw();
      expect(sql).toEqual("DELETE FROM `users` AS `u` WHERE `u`.`id` = 42;");
   });

   it("deleteFrom with multiple WHERE conditions", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .deleteFrom("users", "u")
         .where("u", "active", WhereOperator.Equals, false)
         .and()
         .where("u", "last_login", WhereOperator.LessThan, "2023-01-01");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "DELETE FROM `users` AS `u` WHERE `u`.`active` = false AND `u`.`last_login` < 2023-01-01;",
      );
   });

   it("deleteFrom with whereNull", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.deleteFrom("sessions", "s").whereNull("s", "expired_at");

      const sql = builder.parseRaw();
      expect(sql).toEqual("DELETE FROM `sessions` AS `s` WHERE `s`.`expired_at` IS NULL;");
   });

   it("deleteFrom with whereInValues", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.deleteFrom("users", "u").whereInValues("u", "id", [1, 2, 3]);

      const sql = builder.parseRaw();
      expect(sql).toEqual("DELETE FROM `users` AS `u` WHERE `u`.`id` IN (1, 2, 3);");
   });
});
