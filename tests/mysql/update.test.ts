import { describe, expect, it } from "vitest";
import { MysqlSqlEasy, WhereOperator } from "../../src";

describe("MysqlSqlEasy update", () => {
   it("updateTable with set", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.updateTable("users", "u").set("name", "Alice");

      const sql = builder.parseRaw();
      expect(sql).toEqual("UPDATE `users` AS `u` SET `name` = Alice;");
   });

   it("updateTable with multiple set", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.updateTable("users", "u").set("name", "Alice").set("email", "alice@example.com");

      const sql = builder.parseRaw();
      expect(sql).toEqual("UPDATE `users` AS `u` SET `name` = Alice, `email` = alice@example.com;");
   });

   it("updateTable with setColumns", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.updateTable("users", "u").setColumns([
         { columnName: "name", value: "Bob" },
         { columnName: "age", value: 30 },
         { columnName: "active", value: true },
      ]);

      const sql = builder.parseRaw();
      expect(sql).toEqual("UPDATE `users` AS `u` SET `name` = Bob, `age` = 30, `active` = true;");
   });

   it("updateTable with setRaw", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.updateTable("users", "u").setRaw("`login_count` = `login_count` + 1");

      const sql = builder.parseRaw();
      expect(sql).toEqual("UPDATE `users` AS `u` SET `login_count` = `login_count` + 1;");
   });

   it("updateTable with WHERE", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.updateTable("users", "u").set("status", "inactive").where("u", "id", WhereOperator.Equals, 42);

      const sql = builder.parseRaw();
      expect(sql).toEqual("UPDATE `users` AS `u` SET `status` = inactive WHERE `u`.`id` = 42;");
   });

   it("updateTable with multiple WHERE conditions", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .updateTable("users", "u")
         .set("active", false)
         .where("u", "last_login", WhereOperator.LessThan, "2024-01-01")
         .and()
         .where("u", "role", WhereOperator.NotEquals, "admin");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "UPDATE `users` AS `u` SET `active` = false WHERE `u`.`last_login` < 2024-01-01 AND `u`.`role` <> admin;",
      );
   });

   it("updateTable without alias", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.updateTable("users", "").set("name", "Alice");

      const sql = builder.parseRaw();
      expect(sql).toEqual("UPDATE `users` SET `name` = Alice;");
   });

   it("updateTable with mixed set and setRaw", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.updateTable("users", "u").set("name", "Alice").setRaw("`updated_at` = NOW()");

      const sql = builder.parseRaw();
      expect(sql).toEqual("UPDATE `users` AS `u` SET `name` = Alice, `updated_at` = NOW();");
   });
});
