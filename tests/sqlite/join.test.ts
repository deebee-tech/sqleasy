import { describe, expect, it } from "vitest";
import { JoinOperator, JoinType, SqliteSqlEasy } from "../../src";

describe("SqliteSqlEasy join", () => {
   it("inner join", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Inner, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" INNER JOIN "orders" AS "o" ON "u"."id" = "o"."user_id";',
      );
   });

   it("left join", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Left, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" LEFT JOIN "orders" AS "o" ON "u"."id" = "o"."user_id";',
      );
   });

   it("left outer join", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.LeftOuter, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" LEFT OUTER JOIN "orders" AS "o" ON "u"."id" = "o"."user_id";',
      );
   });

   it("right join", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Right, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" RIGHT JOIN "orders" AS "o" ON "u"."id" = "o"."user_id";',
      );
   });

   it("right outer join", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.RightOuter, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" RIGHT OUTER JOIN "orders" AS "o" ON "u"."id" = "o"."user_id";',
      );
   });

   it("full outer join", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.FullOuter, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" FULL OUTER JOIN "orders" AS "o" ON "u"."id" = "o"."user_id";',
      );
   });

   it("cross join", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Cross, "colors", "c", () => {});

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" CROSS JOIN "colors" AS "c";',
      );
   });

   it("join with multiple ON conditions (AND)", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Inner, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id")
               .and()
               .on("u", "tenant_id", JoinOperator.Equals, "o", "tenant_id");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" INNER JOIN "orders" AS "o" ON "u"."id" = "o"."user_id" AND "u"."tenant_id" = "o"."tenant_id";',
      );
   });

   it("join with OR condition", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Inner, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id")
               .or()
               .on("u", "alt_id", JoinOperator.Equals, "o", "alt_user_id");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" INNER JOIN "orders" AS "o" ON "u"."id" = "o"."user_id" OR "u"."alt_id" = "o"."alt_user_id";',
      );
   });

   it("join with value comparison", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Inner, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id")
               .and()
               .onValue("o", "status", JoinOperator.Equals, "active");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" INNER JOIN "orders" AS "o" ON "u"."id" = "o"."user_id" AND "o"."status" = active;',
      );
   });

   it("join with value comparison - parse prepared", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Inner, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id")
               .and()
               .onValue("o", "status", JoinOperator.Equals, "active");
         });

      const sql = builder.parse();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" INNER JOIN "orders" AS "o" ON "u"."id" = "o"."user_id" AND "o"."status" = ?;',
      );
   });

   it("join with not equals operator", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Inner, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.NotEquals, "o", "user_id");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" INNER JOIN "orders" AS "o" ON "u"."id" <> "o"."user_id";',
      );
   });

   it("join with greater than operator", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Inner, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.GreaterThan, "o", "user_id");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" INNER JOIN "orders" AS "o" ON "u"."id" > "o"."user_id";',
      );
   });

   it("join with less than or equals operator", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Inner, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.LessThanOrEquals, "o", "user_id");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" INNER JOIN "orders" AS "o" ON "u"."id" <= "o"."user_id";',
      );
   });

   it("multiple joins", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Inner, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id");
         })
         .joinTable(JoinType.Left, "products", "p", (jb) => {
            jb.on("o", "product_id", JoinOperator.Equals, "p", "id");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" INNER JOIN "orders" AS "o" ON "u"."id" = "o"."user_id" LEFT JOIN "products" AS "p" ON "o"."product_id" = "p"."id";',
      );
   });

   it("join raw", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinRaw('INNER JOIN "orders" AS "o" ON "u"."id" = "o"."user_id"');

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" INNER JOIN "orders" AS "o" ON "u"."id" = "o"."user_id";',
      );
   });

   it("join on raw", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Inner, "orders", "o", (jb) => {
            jb.onRaw('"u"."id" = "o"."user_id"');
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" INNER JOIN "orders" AS "o" ON "u"."id" = "o"."user_id";',
      );
   });

   it("join with subquery builder", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinWithBuilder(
            JoinType.Inner,
            "recent_orders",
            (sb) => {
               sb.selectAll().fromTable("orders", "o");
            },
            (jb) => {
               jb.on("u", "id", JoinOperator.Equals, "recent_orders", "user_id");
            },
         );

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" INNER JOIN (SELECT * FROM "orders" AS "o") AS "recent_orders" ON "u"."id" = "recent_orders"."user_id";',
      );
   });

   it("join onValue with NotEquals operator", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Inner, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id")
               .and()
               .onValue("o", "status", JoinOperator.NotEquals, "cancelled");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" INNER JOIN "orders" AS "o" ON "u"."id" = "o"."user_id" AND "o"."status" <> cancelled;',
      );
   });

   it("join onValue with GreaterThan operator", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Inner, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id")
               .and()
               .onValue("o", "amount", JoinOperator.GreaterThan, 100);
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" INNER JOIN "orders" AS "o" ON "u"."id" = "o"."user_id" AND "o"."amount" > 100;',
      );
   });

   it("join onValue with GreaterThanOrEquals operator", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Inner, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id")
               .and()
               .onValue("o", "amount", JoinOperator.GreaterThanOrEquals, 50);
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" INNER JOIN "orders" AS "o" ON "u"."id" = "o"."user_id" AND "o"."amount" >= 50;',
      );
   });

   it("join onValue with LessThan operator", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Inner, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id")
               .and()
               .onValue("o", "amount", JoinOperator.LessThan, 1000);
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" INNER JOIN "orders" AS "o" ON "u"."id" = "o"."user_id" AND "o"."amount" < 1000;',
      );
   });

   it("join onValue with LessThanOrEquals operator", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Inner, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id")
               .and()
               .onValue("o", "amount", JoinOperator.LessThanOrEquals, 500);
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" INNER JOIN "orders" AS "o" ON "u"."id" = "o"."user_id" AND "o"."amount" <= 500;',
      );
   });

   it("join onValue followed by another join (trailing space on onValue)", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Inner, "orders", "o", (jb) => {
            jb.onValue("o", "active", JoinOperator.Equals, true)
               .and()
               .on("u", "id", JoinOperator.Equals, "o", "user_id");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" INNER JOIN "orders" AS "o" ON "o"."active" = true AND "u"."id" = "o"."user_id";',
      );
   });

   it("join onValue with prepared statement", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Inner, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id")
               .and()
               .onValue("o", "amount", JoinOperator.GreaterThanOrEquals, 50);
         });

      const sql = builder.parse();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" INNER JOIN "orders" AS "o" ON "u"."id" = "o"."user_id" AND "o"."amount" >= ?;',
      );
   });

   it("join with GreaterThanOrEquals on column comparison", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Inner, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.GreaterThanOrEquals, "o", "user_id");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" INNER JOIN "orders" AS "o" ON "u"."id" >= "o"."user_id";',
      );
   });

   it("join with LessThan on column comparison", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Inner, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.LessThan, "o", "user_id");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "users" AS "u" INNER JOIN "orders" AS "o" ON "u"."id" < "o"."user_id";',
      );
   });
});
