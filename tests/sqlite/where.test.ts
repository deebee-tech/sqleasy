import { describe, expect, it } from "vitest";
import { SqliteSqlEasy, WhereOperator } from "../../src";

describe("SqliteSqlEasy where", () => {
   it("where equals", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" WHERE "u"."id" = 1;');
   });

   it("where equals - parse prepared", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parse();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" WHERE "u"."id" = ?;');
   });

   it("where not equals", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "status", WhereOperator.NotEquals, "inactive");

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" WHERE "u"."status" <> inactive;');
   });

   it("where greater than", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "age", WhereOperator.GreaterThan, 18);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" WHERE "u"."age" > 18;');
   });

   it("where greater than or equals", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "age", WhereOperator.GreaterThanOrEquals, 21);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" WHERE "u"."age" >= 21;');
   });

   it("where less than", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "age", WhereOperator.LessThan, 65);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" WHERE "u"."age" < 65;');
   });

   it("where less than or equals", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "age", WhereOperator.LessThanOrEquals, 30);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" WHERE "u"."age" <= 30;');
   });

   it("where with AND", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "age", WhereOperator.GreaterThan, 18)
         .and()
         .where("u", "status", WhereOperator.Equals, "active");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" WHERE "u"."age" > 18 AND "u"."status" = active;',
      );
   });

   it("where with OR", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "role", WhereOperator.Equals, "admin")
         .or()
         .where("u", "role", WhereOperator.Equals, "superadmin");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" WHERE "u"."role" = admin OR "u"."role" = superadmin;',
      );
   });

   it("where between", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").whereBetween("u", "age", 18, 65);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" WHERE "u"."age" BETWEEN 18 AND 65;');
   });

   it("where between - parse prepared", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").whereBetween("u", "age", 18, 65);

      const sql = builder.parse();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" WHERE "u"."age" BETWEEN ? AND ?;');
   });

   it("where null", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").whereNull("u", "deleted_at");

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" WHERE "u"."deleted_at" IS NULL;');
   });

   it("where not null", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").whereNotNull("u", "email");

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" WHERE "u"."email" IS NOT NULL;');
   });

   it("where in values", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").whereInValues("u", "id", [1, 2, 3]);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" WHERE "u"."id" IN (1, 2, 3);');
   });

   it("where in values - parse prepared", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").whereInValues("u", "id", [1, 2, 3]);

      const sql = builder.parse();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" WHERE "u"."id" IN (?, ?, ?);');
   });

   it("where not in values", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").whereNotInValues("u", "id", [4, 5, 6]);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" WHERE "u"."id" NOT IN (4, 5, 6);');
   });

   it("where in with builder (subquery)", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereInWithBuilder("u", "id", (sb) => {
            sb.selectColumn("o", "user_id", "").fromTable("orders", "o");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" WHERE "u"."id" IN (SELECT "o"."user_id" FROM "orders" AS "o");',
      );
   });

   it("where not in with builder", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereNotInWithBuilder("u", "id", (sb) => {
            sb.selectColumn("b", "user_id", "").fromTable("banned_users", "b");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" WHERE "u"."id" NOT IN (SELECT "b"."user_id" FROM "banned_users" AS "b");',
      );
   });

   it("where exists with builder", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereExistsWithBuilder("u", "id", (sb) => {
            sb.selectRaw("1")
               .fromTable("orders", "o")
               .where("o", "user_id", WhereOperator.Equals, 1);
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" WHERE EXISTS (SELECT 1 FROM "orders" AS "o" WHERE "o"."user_id" = 1);',
      );
   });

   it("where not exists with builder", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereNotExistsWithBuilder("u", "id", (sb) => {
            sb.selectRaw("1")
               .fromTable("orders", "o")
               .where("o", "user_id", WhereOperator.Equals, 1);
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" WHERE NOT EXISTS (SELECT 1 FROM "orders" AS "o" WHERE "o"."user_id" = 1);',
      );
   });

   it("where raw", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").whereRaw('"u"."age" > 18');

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" WHERE "u"."age" > 18;');
   });

   it("where multiple raws", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereRaws(['"u"."age" > 18', '"u"."status" = \'active\'']);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" WHERE "u"."age" > 18 "u"."status" = \'active\';',
      );
   });

   it("where with string value - parseRaw does not quote strings", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "name", WhereOperator.Equals, "John");

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" WHERE "u"."name" = John;');
   });

   it("where with string value - parse prepared uses placeholder", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "name", WhereOperator.Equals, "John");

      const sql = builder.parse();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" WHERE "u"."name" = ?;');
   });

   it("where with boolean value", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "active", WhereOperator.Equals, true);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" WHERE "u"."active" = true;');
   });

   it("complex where with multiple conditions", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "age", WhereOperator.GreaterThanOrEquals, 18)
         .and()
         .where("u", "age", WhereOperator.LessThan, 65)
         .and()
         .whereNotNull("u", "email");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" WHERE "u"."age" >= 18 AND "u"."age" < 65 AND "u"."email" IS NOT NULL;',
      );
   });

   it("where removes default limit", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).not.toContain("LIMIT");
   });

   it("where not in values - parse prepared", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").whereNotInValues("u", "id", [4, 5]);

      const sql = builder.parse();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" WHERE "u"."id" NOT IN (?, ?);');
   });

   it("where exists - parse prepared", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereExistsWithBuilder("u", "id", (sb) => {
            sb.selectRaw("1")
               .fromTable("orders", "o")
               .where("o", "user_id", WhereOperator.Equals, 1);
         });

      const sql = builder.parse();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" WHERE EXISTS (SELECT 1 FROM "orders" AS "o" WHERE "o"."user_id" = ?);',
      );
   });

   it("where between - parse prepared", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereBetween("u", "created_at", "2024-01-01", "2024-12-31");

      const sql = builder.parse();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" WHERE "u"."created_at" BETWEEN ? AND ?;',
      );
   });

   it("whereNotInWithBuilder followed by AND and another where (trailing space)", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereNotInWithBuilder("u", "id", (sb) => {
            sb.selectColumn("b", "user_id", "").fromTable("banned", "b");
         })
         .and()
         .where("u", "status", WhereOperator.Equals, "active");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" WHERE "u"."id" NOT IN (SELECT "b"."user_id" FROM "banned" AS "b") AND "u"."status" = active;',
      );
   });

   it("whereNotInValues followed by AND and another where (trailing space)", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereNotInValues("u", "id", [4, 5, 6])
         .and()
         .where("u", "status", WhereOperator.Equals, "active");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" WHERE "u"."id" NOT IN (4, 5, 6) AND "u"."status" = active;',
      );
   });

   it("whereNull followed by AND and another where (trailing space)", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereNull("u", "deleted_at")
         .and()
         .where("u", "status", WhereOperator.Equals, "active");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" WHERE "u"."deleted_at" IS NULL AND "u"."status" = active;',
      );
   });

   it("whereInWithBuilder followed by AND and another where (trailing space)", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereInWithBuilder("u", "id", (sb) => {
            sb.selectColumn("o", "user_id", "").fromTable("orders", "o");
         })
         .and()
         .where("u", "active", WhereOperator.Equals, true);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" WHERE "u"."id" IN (SELECT "o"."user_id" FROM "orders" AS "o") AND "u"."active" = true;',
      );
   });

   it("whereInValues followed by AND and another where (trailing space)", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereInValues("u", "id", [1, 2, 3])
         .and()
         .where("u", "active", WhereOperator.Equals, true);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" WHERE "u"."id" IN (1, 2, 3) AND "u"."active" = true;',
      );
   });

   it("whereNotNull followed by AND and another where (trailing space)", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereNotNull("u", "email")
         .and()
         .where("u", "active", WhereOperator.Equals, true);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" WHERE "u"."email" IS NOT NULL AND "u"."active" = true;',
      );
   });

   it("whereExistsWithBuilder followed by AND and another where (trailing space)", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereExistsWithBuilder("u", "id", (sb) => {
            sb.selectRaw("1").fromTable("orders", "o");
         })
         .and()
         .where("u", "active", WhereOperator.Equals, true);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" WHERE EXISTS (SELECT 1 FROM "orders" AS "o") AND "u"."active" = true;',
      );
   });

   it("whereNotExistsWithBuilder followed by AND and another where (trailing space)", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereNotExistsWithBuilder("u", "id", (sb) => {
            sb.selectRaw("1").fromTable("banned", "b");
         })
         .and()
         .where("u", "active", WhereOperator.Equals, true);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" WHERE NOT EXISTS (SELECT 1 FROM "banned" AS "b") AND "u"."active" = true;',
      );
   });

   it("whereBetween followed by AND and another where (trailing space)", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereBetween("u", "age", 18, 65)
         .and()
         .where("u", "active", WhereOperator.Equals, true);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" WHERE "u"."age" BETWEEN 18 AND 65 AND "u"."active" = true;',
      );
   });
});
