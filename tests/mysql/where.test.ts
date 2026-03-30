import { describe, expect, it } from "vitest";
import { MysqlSqlEasy, WhereOperator } from "../../src";

describe("MysqlSqlEasy where", () => {
   it("where Equals", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM `users` AS `u` WHERE `u`.`id` = 1;");
   });

   it("where NotEquals", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "status", WhereOperator.NotEquals, "inactive");

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM `users` AS `u` WHERE `u`.`status` <> inactive;");
   });

   it("where GreaterThan", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "age", WhereOperator.GreaterThan, 18);

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM `users` AS `u` WHERE `u`.`age` > 18;");
   });

   it("where GreaterThanOrEquals", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "age", WhereOperator.GreaterThanOrEquals, 21);

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM `users` AS `u` WHERE `u`.`age` >= 21;");
   });

   it("where LessThan", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "age", WhereOperator.LessThan, 65);

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM `users` AS `u` WHERE `u`.`age` < 65;");
   });

   it("where LessThanOrEquals", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "age", WhereOperator.LessThanOrEquals, 30);

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM `users` AS `u` WHERE `u`.`age` <= 30;");
   });

   it("where with string value (not quoted in parseRaw)", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "name", WhereOperator.Equals, "Alice");

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM `users` AS `u` WHERE `u`.`name` = Alice;");
   });

   it("where with boolean value", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "active", WhereOperator.Equals, true);

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM `users` AS `u` WHERE `u`.`active` = true;");
   });

   it("where AND chaining", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "age", WhereOperator.GreaterThan, 18)
         .and()
         .where("u", "status", WhereOperator.Equals, "active");

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM `users` AS `u` WHERE `u`.`age` > 18 AND `u`.`status` = active;");
   });

   it("where OR chaining", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "role", WhereOperator.Equals, "admin")
         .or()
         .where("u", "role", WhereOperator.Equals, "superadmin");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM `users` AS `u` WHERE `u`.`role` = admin OR `u`.`role` = superadmin;",
      );
   });

   it("where mixed AND/OR", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "age", WhereOperator.GreaterThan, 18)
         .and()
         .where("u", "status", WhereOperator.Equals, "active")
         .or()
         .where("u", "role", WhereOperator.Equals, "admin");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM `users` AS `u` WHERE `u`.`age` > 18 AND `u`.`status` = active OR `u`.`role` = admin;",
      );
   });

   it("whereBetween", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").whereBetween("u", "age", 18, 65);

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM `users` AS `u` WHERE `u`.`age` BETWEEN 18 AND 65;");
   });

   it("whereNull", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").whereNull("u", "deleted_at");

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM `users` AS `u` WHERE `u`.`deleted_at` IS NULL;");
   });

   it("whereNotNull", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").whereNotNull("u", "email");

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM `users` AS `u` WHERE `u`.`email` IS NOT NULL;");
   });

   it("whereInValues", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").whereInValues("u", "id", [1, 2, 3]);

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM `users` AS `u` WHERE `u`.`id` IN (1, 2, 3);");
   });

   it("whereInValues with strings", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").whereInValues("u", "role", ["admin", "editor", "viewer"]);

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM `users` AS `u` WHERE `u`.`role` IN (admin, editor, viewer);");
   });

   it("whereNotInValues", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").whereNotInValues("u", "id", [4, 5, 6]);

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM `users` AS `u` WHERE `u`.`id` NOT IN (4, 5, 6);");
   });

   it("whereInWithBuilder", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereInWithBuilder("u", "id", (sb) => {
            sb.selectColumn("o", "user_id", "").fromTable("orders", "o");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM `users` AS `u` WHERE `u`.`id` IN (SELECT `o`.`user_id` FROM `orders` AS `o`);",
      );
   });

   it("whereNotInWithBuilder", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereNotInWithBuilder("u", "id", (sb) => {
            sb.selectColumn("b", "user_id", "").fromTable("banned_users", "b");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM `users` AS `u` WHERE `u`.`id` NOT IN (SELECT `b`.`user_id` FROM `banned_users` AS `b`);",
      );
   });

   it("whereExistsWithBuilder", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereExistsWithBuilder("u", "id", (sb) => {
            sb.selectRaw("1")
               .fromTable("orders", "o")
               .where("o", "user_id", WhereOperator.Equals, "u.id");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM `users` AS `u` WHERE EXISTS (SELECT 1 FROM `orders` AS `o` WHERE `o`.`user_id` = u.id);",
      );
   });

   it("whereNotExistsWithBuilder", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereNotExistsWithBuilder("u", "id", (sb) => {
            sb.selectRaw("1")
               .fromTable("orders", "o")
               .where("o", "user_id", WhereOperator.Equals, "u.id");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM `users` AS `u` WHERE NOT EXISTS (SELECT 1 FROM `orders` AS `o` WHERE `o`.`user_id` = u.id);",
      );
   });

   it("whereRaw", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").whereRaw("`u`.`age` > 18");

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM `users` AS `u` WHERE `u`.`age` > 18;");
   });

   it("whereRaws", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereRaw("`u`.`age` > 18")
         .and()
         .whereRaw("`u`.`status` = 'active'");

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM `users` AS `u` WHERE `u`.`age` > 18 AND `u`.`status` = 'active';");
   });

   it("whereGroup produces grouped parentheses", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, true)
         .and()
         .whereGroup((gb) => {
            gb.where("u", "role", WhereOperator.Equals, "admin")
               .or()
               .where("u", "role", WhereOperator.Equals, "editor");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM `users` AS `u` WHERE `u`.`active` = true AND ();",
      );
   });

   it("multiple where conditions combined", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "age", WhereOperator.GreaterThanOrEquals, 18)
         .and()
         .whereNotNull("u", "email")
         .and()
         .whereInValues("u", "role", ["admin", "editor"]);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT * FROM `users` AS `u` WHERE `u`.`age` >= 18 AND `u`.`email` IS NOT NULL AND `u`.`role` IN (admin, editor);",
      );
   });
});
