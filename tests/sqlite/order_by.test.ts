import { describe, expect, it } from "vitest";
import { OrderByDirection, SqliteSqlEasy } from "../../src";

describe("SqliteSqlEasy order by", () => {
   it("order by single column ascending", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").orderByColumn("u", "name", OrderByDirection.Ascending);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" ORDER BY "u"."name" ASC;');
   });

   it("order by single column descending", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").orderByColumn("u", "created_at", OrderByDirection.Descending);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" ORDER BY "u"."created_at" DESC;');
   });

   it("order by multiple columns", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .orderByColumns([
            { tableNameOrAlias: "u", columnName: "last_name", direction: OrderByDirection.Ascending },
            { tableNameOrAlias: "u", columnName: "first_name", direction: OrderByDirection.Ascending },
         ]);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" ORDER BY "u"."last_name" ASC, "u"."first_name" ASC;');
   });

   it("order by mixed directions", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .orderByColumn("u", "priority", OrderByDirection.Descending)
         .orderByColumn("u", "name", OrderByDirection.Ascending);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" ORDER BY "u"."priority" DESC, "u"."name" ASC;');
   });

   it("order by raw", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").orderByRaw("RANDOM()");

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" ORDER BY RANDOM();');
   });

   it("order by multiple raws", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").orderByRaws(["RANDOM()", '"u"."name" ASC']);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" ORDER BY RANDOM(), "u"."name" ASC;');
   });

   it("order by with parse prepared", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").orderByColumn("u", "name", OrderByDirection.Ascending);

      const sql = builder.parse();
      expect(sql).toEqual('SELECT * FROM "users" AS "u" ORDER BY "u"."name" ASC;');
   });
});
