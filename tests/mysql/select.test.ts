import { describe, expect, it } from "vitest";
import { MysqlSqlEasy } from "../../src";

describe("MysqlSqlEasy select", () => {
   it("select all", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM `users` AS `u`;");
   });

   it("select column with alias", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectColumn("u", "id", "user_id").fromTable("users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT `u`.`id` AS `user_id` FROM `users` AS `u`;");
   });

   it("select column without alias", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectColumn("u", "id", "").fromTable("users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT `u`.`id` FROM `users` AS `u`;");
   });

   it("select multiple columns", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumns([
            { tableNameOrAlias: "u", columnName: "id", columnAlias: "user_id" },
            { tableNameOrAlias: "u", columnName: "name", columnAlias: "" },
            { tableNameOrAlias: "u", columnName: "email", columnAlias: "user_email" },
         ])
         .fromTable("users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT `u`.`id` AS `user_id`, `u`.`name`, `u`.`email` AS `user_email` FROM `users` AS `u`;",
      );
   });

   it("selectRaw", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectRaw("COUNT(*) AS total").fromTable("users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT COUNT(*) AS total FROM `users` AS `u`;");
   });

   it("selectRaws", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectRaws(["COUNT(*) AS total", "MAX(`u`.`age`) AS max_age"]).fromTable("users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT COUNT(*) AS total, MAX(`u`.`age`) AS max_age FROM `users` AS `u`;");
   });

   it("selectWithBuilder (subquery)", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .selectWithBuilder("order_count", (sb) => {
            sb.selectRaw("COUNT(*)").fromTable("orders", "o");
         })
         .fromTable("users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT *, (SELECT COUNT(*) FROM `orders` AS `o`) AS `order_count` FROM `users` AS `u`;",
      );
   });

   it("distinct", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.distinct().selectColumn("u", "name", "").fromTable("users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT DISTINCT `u`.`name` FROM `users` AS `u`;");
   });

   it("distinct with multiple columns", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .distinct()
         .selectColumns([
            { tableNameOrAlias: "u", columnName: "name", columnAlias: "" },
            { tableNameOrAlias: "u", columnName: "email", columnAlias: "" },
         ])
         .fromTable("users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT DISTINCT `u`.`name`, `u`.`email` FROM `users` AS `u`;");
   });

   it("select all with selectColumn combined", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().selectColumn("u", "id", "user_id").fromTable("users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT *, `u`.`id` AS `user_id` FROM `users` AS `u`;");
   });
});
