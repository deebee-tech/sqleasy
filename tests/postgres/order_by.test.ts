import { describe, expect, it } from "vitest";
import { OrderByDirection, PostgresSqlEasy, WhereOperator } from "../../src";

describe("PostgresSqlEasy order by", () => {
   it("order by single column ascending", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, true)
         .orderByColumn("u", "name", OrderByDirection.Ascending);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" WHERE "u"."active" = true ORDER BY "u"."name" ASC;');
   });

   it("order by single column descending", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, true)
         .orderByColumn("u", "created_at", OrderByDirection.Descending);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" WHERE "u"."active" = true ORDER BY "u"."created_at" DESC;',
      );
   });

   it("order by multiple columns", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, true)
         .orderByColumns([
            { tableNameOrAlias: "u", columnName: "last_name", direction: OrderByDirection.Ascending },
            { tableNameOrAlias: "u", columnName: "first_name", direction: OrderByDirection.Ascending },
            { tableNameOrAlias: "u", columnName: "created_at", direction: OrderByDirection.Descending },
         ]);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" WHERE "u"."active" = true ORDER BY "u"."last_name" ASC, "u"."first_name" ASC, "u"."created_at" DESC;',
      );
   });

   it("orderByRaw", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, true)
         .orderByRaw("RANDOM()");

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" WHERE "u"."active" = true ORDER BY RANDOM();');
   });

   it("orderByRaws multiple", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, true)
         .orderByRaws(["CASE WHEN role = 'admin' THEN 0 ELSE 1 END", '"u"."name" ASC']);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" WHERE "u"."active" = true ORDER BY CASE WHEN role = \'admin\' THEN 0 ELSE 1 END, "u"."name" ASC;',
      );
   });

   it("mixed orderByColumn and orderByRaw", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, true)
         .orderByColumn("u", "name", OrderByDirection.Ascending)
         .orderByRaw("RANDOM()");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" WHERE "u"."active" = true ORDER BY "u"."name" ASC, RANDOM();',
      );
   });

   it("order by with parse() prepared statement", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, true)
         .orderByColumn("u", "name", OrderByDirection.Ascending);

      const sql = builder.parse();
      expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" WHERE "u"."active" = $1 ORDER BY "u"."name" ASC;');
   });

   it("clearOrderBy resets order by state", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, true)
         .orderByColumn("u", "name", OrderByDirection.Ascending)
         .clearOrderBy()
         .orderByColumn("u", "id", OrderByDirection.Descending);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" WHERE "u"."active" = true ORDER BY "u"."id" DESC;');
   });
});
