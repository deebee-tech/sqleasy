import { describe, expect, it } from "vitest";
import { PostgresSqlEasy, WhereOperator } from "../../src";

describe("PostgresSqlEasy where", () => {
   it("where equals", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "id", WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" WHERE "u"."id" = 1;');
   });

   it("where not equals", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "status", WhereOperator.NotEquals, "inactive");

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" WHERE "u"."status" <> inactive;');
   });

   it("where greater than", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "age", WhereOperator.GreaterThan, 18);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" WHERE "u"."age" > 18;');
   });

   it("where greater than or equals", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "age", WhereOperator.GreaterThanOrEquals, 21);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" WHERE "u"."age" >= 21;');
   });

   it("where less than", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "age", WhereOperator.LessThan, 65);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" WHERE "u"."age" < 65;');
   });

   it("where less than or equals", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "age", WhereOperator.LessThanOrEquals, 30);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" WHERE "u"."age" <= 30;');
   });

   it("where with AND", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "age", WhereOperator.GreaterThan, 18)
         .and()
         .where("u", "active", WhereOperator.Equals, true);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" WHERE "u"."age" > 18 AND "u"."active" = true;',
      );
   });

   it("where with OR", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "role", WhereOperator.Equals, "admin")
         .or()
         .where("u", "role", WhereOperator.Equals, "superadmin");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" WHERE "u"."role" = admin OR "u"."role" = superadmin;',
      );
   });

   it("whereBetween", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereBetween("u", "age", 18, 65);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" WHERE "u"."age" BETWEEN 18 AND 65;',
      );
   });

   it("whereNull", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereNull("u", "deleted_at");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" WHERE "u"."deleted_at" IS NULL;',
      );
   });

   it("whereNotNull", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereNotNull("u", "email");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" WHERE "u"."email" IS NOT NULL;',
      );
   });

   it("whereInValues", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereInValues("u", "id", [1, 2, 3]);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" WHERE "u"."id" IN (1, 2, 3);',
      );
   });

   it("whereNotInValues", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereNotInValues("u", "status", ["banned", "suspended"]);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" WHERE "u"."status" NOT IN (banned, suspended);',
      );
   });

   it("whereInWithBuilder subquery", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereInWithBuilder("u", "id", (sb) => {
            sb.selectColumn("o", "user_id", "").fromTable("orders", "o");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" WHERE "u"."id" IN (SELECT "o"."user_id" FROM "public"."orders" AS "o");',
      );
   });

   it("whereNotInWithBuilder subquery", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereNotInWithBuilder("u", "id", (sb) => {
            sb.selectColumn("b", "user_id", "").fromTable("blacklist", "b");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" WHERE "u"."id" NOT IN (SELECT "b"."user_id" FROM "public"."blacklist" AS "b");',
      );
   });

   it("whereExistsWithBuilder", () => {
      const sqlEasy = new PostgresSqlEasy();
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
         'SELECT * FROM "public"."users" AS "u" WHERE EXISTS (SELECT 1 FROM "public"."orders" AS "o" WHERE "o"."user_id" = 1);',
      );
   });

   it("whereNotExistsWithBuilder", () => {
      const sqlEasy = new PostgresSqlEasy();
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
         'SELECT * FROM "public"."users" AS "u" WHERE NOT EXISTS (SELECT 1 FROM "public"."orders" AS "o" WHERE "o"."user_id" = 1);',
      );
   });

   it("whereRaw", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereRaw('"u"."age" > 18');

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" WHERE "u"."age" > 18;');
   });

   it("whereRaws multiple with AND", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereRaw('"u"."age" > 18')
         .and()
         .whereRaw('"u"."active" = true');

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" WHERE "u"."age" > 18 AND "u"."active" = true;',
      );
   });

   it("where with boolean value", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, false);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" WHERE "u"."active" = false;');
   });

   it("where equals with parse() - $1 placeholder", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "id", WhereOperator.Equals, 42);

      const sql = builder.parse();
      expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" WHERE "u"."id" = $1;');
   });

   it("where multiple conditions with parse() - $1, $2 placeholders", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "age", WhereOperator.GreaterThan, 18)
         .and()
         .where("u", "active", WhereOperator.Equals, true);

      const sql = builder.parse();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" WHERE "u"."age" > $1 AND "u"."active" = $2;',
      );
   });

   it("whereBetween with parse() - $1, $2 placeholders", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereBetween("u", "age", 18, 65);

      const sql = builder.parse();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" WHERE "u"."age" BETWEEN $1 AND $2;',
      );
   });

   it("whereInValues with parse() - $1, $2, $3 placeholders", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereInValues("u", "id", [1, 2, 3]);

      const sql = builder.parse();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" WHERE "u"."id" IN ($1, $2, $3);',
      );
   });

   it("complex where with parse() - multiple numbered placeholders", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "name", WhereOperator.Equals, "John")
         .and()
         .where("u", "age", WhereOperator.GreaterThan, 25)
         .and()
         .whereBetween("u", "score", 80, 100);

      const sql = builder.parse();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" WHERE "u"."name" = $1 AND "u"."age" > $2 AND "u"."score" BETWEEN $3 AND $4;',
      );
   });

   it("clearWhere resets where state", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "id", WhereOperator.Equals, 1)
         .clearWhere()
         .where("u", "id", WhereOperator.Equals, 2);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" WHERE "u"."id" = 2;');
   });

   it("whereNotInValues with parse() - $1, $2 placeholders", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .whereNotInValues("u", "status", ["banned", "suspended"]);

      const sql = builder.parse();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" WHERE "u"."status" NOT IN ($1, $2);',
      );
   });
});
