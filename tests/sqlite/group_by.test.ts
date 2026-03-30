import { describe, expect, it } from "vitest";
import { SqliteSqlEasy, WhereOperator } from "../../src";

describe("SqliteSqlEasy group by", () => {
   it("group by single column", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "status", "")
         .selectRaw("COUNT(*) AS count")
         .fromTable("users", "u")
         .groupByColumn("u", "status");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT "u"."status", COUNT(*) AS count FROM "users" AS "u" GROUP BY "u"."status";',
      );
   });

   it("group by multiple columns", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "department", "")
         .selectColumn("u", "role", "")
         .selectRaw("COUNT(*) AS count")
         .fromTable("users", "u")
         .groupByColumns([
            { tableNameOrAlias: "u", columnName: "department" },
            { tableNameOrAlias: "u", columnName: "role" },
         ]);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT "u"."department", "u"."role", COUNT(*) AS count FROM "users" AS "u" GROUP BY "u"."department", "u"."role";',
      );
   });

   it("group by raw", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectRaw("strftime('%Y', created_at) AS year")
         .selectRaw("COUNT(*) AS count")
         .fromTable("users", "u")
         .groupByRaw("strftime('%Y', created_at)");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT strftime('%Y', created_at) AS year, COUNT(*) AS count FROM \"users\" AS \"u\" GROUP BY strftime('%Y', created_at);",
      );
   });

   it("group by multiple raws", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectRaw("strftime('%Y', created_at) AS year")
         .selectRaw("strftime('%m', created_at) AS month")
         .selectRaw("COUNT(*) AS count")
         .fromTable("users", "u")
         .groupByRaws(["strftime('%Y', created_at)", "strftime('%m', created_at)"]);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT strftime('%Y', created_at) AS year, strftime('%m', created_at) AS month, COUNT(*) AS count FROM \"users\" AS \"u\" GROUP BY strftime('%Y', created_at), strftime('%m', created_at);",
      );
   });

   it("group by with having", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "department", "")
         .selectRaw("COUNT(*) AS count")
         .fromTable("users", "u")
         .groupByColumn("u", "department")
         .having("u", "count", WhereOperator.GreaterThan, 5);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT "u"."department", COUNT(*) AS count FROM "users" AS "u" GROUP BY "u"."department" HAVING "u"."count" > 5;',
      );
   });

   it("group by with having - parse prepared", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "department", "")
         .selectRaw("COUNT(*) AS count")
         .fromTable("users", "u")
         .groupByColumn("u", "department")
         .having("u", "count", WhereOperator.GreaterThan, 5);

      const sql = builder.parse();
      expect(sql).toEqual(
         'SELECT "u"."department", COUNT(*) AS count FROM "users" AS "u" GROUP BY "u"."department" HAVING "u"."count" > ?;',
      );
   });

   it("group by with having raw", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "status", "")
         .selectRaw("COUNT(*) AS count")
         .fromTable("users", "u")
         .groupByColumn("u", "status")
         .havingRaw("COUNT(*) > 10");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT "u"."status", COUNT(*) AS count FROM "users" AS "u" GROUP BY "u"."status" HAVING COUNT(*) > 10;',
      );
   });

   it("group by with having multiple raws", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "status", "")
         .selectRaw("COUNT(*) AS count")
         .fromTable("users", "u")
         .groupByColumn("u", "status")
         .havingRaws(["COUNT(*) > 10", "SUM(amount) < 1000"]);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT "u"."status", COUNT(*) AS count FROM "users" AS "u" GROUP BY "u"."status" HAVING COUNT(*) > 10 SUM(amount) < 1000;',
      );
   });

   it("group by with having using havingRaw for AND", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "department", "")
         .selectRaw("COUNT(*) AS count")
         .selectRaw("AVG(age) AS avg_age")
         .fromTable("users", "u")
         .groupByColumn("u", "department")
         .havingRaw('COUNT(*) > 5 AND AVG("u"."age") < 40');

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT "u"."department", COUNT(*) AS count, AVG(age) AS avg_age FROM "users" AS "u" GROUP BY "u"."department" HAVING COUNT(*) > 5 AND AVG("u"."age") < 40;',
      );
   });

   it("group by with where and having", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "department", "")
         .selectRaw("COUNT(*) AS count")
         .fromTable("users", "u")
         .where("u", "status", WhereOperator.Equals, "active")
         .groupByColumn("u", "department")
         .having("u", "count", WhereOperator.GreaterThan, 3);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT "u"."department", COUNT(*) AS count FROM "users" AS "u" WHERE "u"."status" = active GROUP BY "u"."department" HAVING "u"."count" > 3;',
      );
   });

   it("having with NotEquals", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "status", "")
         .selectRaw("COUNT(*) AS cnt")
         .fromTable("users", "u")
         .groupByColumn("u", "status")
         .having("u", "status", WhereOperator.NotEquals, "inactive");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT "u"."status", COUNT(*) AS cnt FROM "users" AS "u" GROUP BY "u"."status" HAVING "u"."status" <> inactive;',
      );
   });

   it("having with Equals", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "status", "")
         .selectRaw("COUNT(*) AS cnt")
         .fromTable("users", "u")
         .groupByColumn("u", "status")
         .having("u", "status", WhereOperator.Equals, "active");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT "u"."status", COUNT(*) AS cnt FROM "users" AS "u" GROUP BY "u"."status" HAVING "u"."status" = active;',
      );
   });

   it("having with GreaterThanOrEquals", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "dept", "")
         .selectRaw("COUNT(*) AS cnt")
         .fromTable("users", "u")
         .groupByColumn("u", "dept")
         .having("u", "cnt", WhereOperator.GreaterThanOrEquals, 10);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT "u"."dept", COUNT(*) AS cnt FROM "users" AS "u" GROUP BY "u"."dept" HAVING "u"."cnt" >= 10;',
      );
   });

   it("having with LessThan", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "dept", "")
         .selectRaw("COUNT(*) AS cnt")
         .fromTable("users", "u")
         .groupByColumn("u", "dept")
         .having("u", "cnt", WhereOperator.LessThan, 100);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT "u"."dept", COUNT(*) AS cnt FROM "users" AS "u" GROUP BY "u"."dept" HAVING "u"."cnt" < 100;',
      );
   });

   it("having with LessThanOrEquals", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "dept", "")
         .selectRaw("COUNT(*) AS cnt")
         .fromTable("users", "u")
         .groupByColumn("u", "dept")
         .having("u", "cnt", WhereOperator.LessThanOrEquals, 50);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT "u"."dept", COUNT(*) AS cnt FROM "users" AS "u" GROUP BY "u"."dept" HAVING "u"."cnt" <= 50;',
      );
   });

   it("having followed by havingRaw produces trailing space between conditions", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "role", "")
         .selectRaw("COUNT(*) AS cnt")
         .fromTable("users", "u")
         .groupByColumn("u", "role")
         .having("u", "role", WhereOperator.Equals, "admin")
         .havingRaw("AND COUNT(*) > 5");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT "u"."role", COUNT(*) AS cnt FROM "users" AS "u" GROUP BY "u"."role" HAVING "u"."role" = admin AND COUNT(*) > 5;',
      );
   });

   it("multiple havingRaw conditions produce trailing spaces between them", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "dept", "")
         .selectRaw("COUNT(*) AS cnt")
         .fromTable("users", "u")
         .groupByColumn("u", "dept")
         .havingRaw("COUNT(*) > 2")
         .havingRaw("AND SUM(amount) < 1000")
         .havingRaw("AND AVG(age) > 18");

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT "u"."dept", COUNT(*) AS cnt FROM "users" AS "u" GROUP BY "u"."dept" HAVING COUNT(*) > 2 AND SUM(amount) < 1000 AND AVG(age) > 18;',
      );
   });

   it("having with prepared statement", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectColumn("u", "status", "")
         .selectRaw("COUNT(*) AS cnt")
         .fromTable("users", "u")
         .groupByColumn("u", "status")
         .having("u", "cnt", WhereOperator.NotEquals, 0);

      const sql = builder.parse();
      expect(sql).toEqual(
         'SELECT "u"."status", COUNT(*) AS cnt FROM "users" AS "u" GROUP BY "u"."status" HAVING "u"."cnt" <> ?;',
      );
   });
});
