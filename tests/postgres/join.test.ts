import { describe, expect, it } from "vitest";
import { JoinOperator, JoinType, PostgresSqlEasy, WhereOperator } from "../../src";

describe("PostgresSqlEasy join", () => {
   it("inner join", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Inner, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" INNER JOIN "public"."orders" AS "o" ON "u"."id" = "o"."user_id";',
      );
   });

   it("left join", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Left, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" LEFT JOIN "public"."orders" AS "o" ON "u"."id" = "o"."user_id";',
      );
   });

   it("left outer join", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.LeftOuter, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" LEFT OUTER JOIN "public"."orders" AS "o" ON "u"."id" = "o"."user_id";',
      );
   });

   it("right join", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Right, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" RIGHT JOIN "public"."orders" AS "o" ON "u"."id" = "o"."user_id";',
      );
   });

   it("right outer join", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.RightOuter, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" RIGHT OUTER JOIN "public"."orders" AS "o" ON "u"."id" = "o"."user_id";',
      );
   });

   it("full outer join", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.FullOuter, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" FULL OUTER JOIN "public"."orders" AS "o" ON "u"."id" = "o"."user_id";',
      );
   });

   it("cross join", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Cross, "roles", "r", () => {});

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" CROSS JOIN "public"."roles" AS "r";');
   });

   it("join with multiple ON conditions (AND)", () => {
      const sqlEasy = new PostgresSqlEasy();
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
         'SELECT * FROM "public"."users" AS "u" INNER JOIN "public"."orders" AS "o" ON "u"."id" = "o"."user_id" AND "u"."tenant_id" = "o"."tenant_id";',
      );
   });

   it("join with OR condition", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Inner, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id")
               .or()
               .on("u", "alt_id", JoinOperator.Equals, "o", "user_id");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" INNER JOIN "public"."orders" AS "o" ON "u"."id" = "o"."user_id" OR "u"."alt_id" = "o"."user_id";',
      );
   });

   it("join with NotEquals operator", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Inner, "scores", "s", (jb) => {
            jb.on("u", "id", JoinOperator.NotEquals, "s", "excluded_user_id");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" INNER JOIN "public"."scores" AS "s" ON "u"."id" <> "s"."excluded_user_id";',
      );
   });

   it("join with GreaterThan operator", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Inner, "scores", "s", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "s", "user_id")
               .and()
               .on("s", "score", JoinOperator.GreaterThan, "u", "min_score");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" INNER JOIN "public"."scores" AS "s" ON "u"."id" = "s"."user_id" AND "s"."score" > "u"."min_score";',
      );
   });

   it("join with onValue", () => {
      const sqlEasy = new PostgresSqlEasy();
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
         'SELECT * FROM "public"."users" AS "u" INNER JOIN "public"."orders" AS "o" ON "u"."id" = "o"."user_id" AND "o"."status" = active;',
      );
   });

   it("join with onRaw", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Inner, "orders", "o", (jb) => {
            jb.onRaw('"u"."id" = "o"."user_id"');
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" INNER JOIN "public"."orders" AS "o" ON "u"."id" = "o"."user_id";',
      );
   });

   it("joinRaw", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinRaw('INNER JOIN "public"."orders" AS "o" ON "u"."id" = "o"."user_id"');

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" INNER JOIN "public"."orders" AS "o" ON "u"."id" = "o"."user_id";',
      );
   });

   it("joinRaws multiple", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinRaws([
            'INNER JOIN "public"."orders" AS "o" ON "u"."id" = "o"."user_id"',
            'LEFT JOIN "public"."products" AS "p" ON "o"."product_id" = "p"."id"',
         ]);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" INNER JOIN "public"."orders" AS "o" ON "u"."id" = "o"."user_id" LEFT JOIN "public"."products" AS "p" ON "o"."product_id" = "p"."id";',
      );
   });

   it("joinTableWithOwner", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTableWithOwner(JoinType.Inner, "sales", "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id");
         });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" INNER JOIN "sales"."orders" AS "o" ON "u"."id" = "o"."user_id";',
      );
   });

   it("multiple joins", () => {
      const sqlEasy = new PostgresSqlEasy();
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
         'SELECT * FROM "public"."users" AS "u" INNER JOIN "public"."orders" AS "o" ON "u"."id" = "o"."user_id" LEFT JOIN "public"."products" AS "p" ON "o"."product_id" = "p"."id";',
      );
   });

   it("joinWithBuilder subquery join", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinWithBuilder(
            JoinType.Inner,
            "recent_orders",
            (sb) => {
               sb.selectAll()
                  .fromTable("orders", "o")
                  .where("o", "created_at", WhereOperator.GreaterThan, "2024-01-01");
            },
            (jb) => {
               jb.on("u", "id", JoinOperator.Equals, "recent_orders", "user_id");
            },
         );

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" INNER JOIN (SELECT * FROM "public"."orders" AS "o" WHERE "o"."created_at" > 2024-01-01) AS "recent_orders" ON "u"."id" = "recent_orders"."user_id";',
      );
   });

   it("joinTables batch", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTables([
            {
               joinType: JoinType.Inner,
               tableName: "orders",
               alias: "o",
               joinOnBuilder: (jb) => {
                  jb.on("u", "id", JoinOperator.Equals, "o", "user_id");
               },
            },
            {
               joinType: JoinType.Left,
               tableName: "products",
               alias: "p",
               joinOnBuilder: (jb) => {
                  jb.on("o", "product_id", JoinOperator.Equals, "p", "id");
               },
            },
         ]);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" INNER JOIN "public"."orders" AS "o" ON "u"."id" = "o"."user_id" LEFT JOIN "public"."products" AS "p" ON "o"."product_id" = "p"."id";',
      );
   });

   it("joinTablesWithOwner batch", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTablesWithOwner([
            {
               joinType: JoinType.Inner,
               owner: "sales",
               tableName: "orders",
               alias: "o",
               joinOnBuilder: (jb) => {
                  jb.on("u", "id", JoinOperator.Equals, "o", "user_id");
               },
            },
            {
               joinType: JoinType.Left,
               owner: "inventory",
               tableName: "products",
               alias: "p",
               joinOnBuilder: (jb) => {
                  jb.on("o", "product_id", JoinOperator.Equals, "p", "id");
               },
            },
         ]);

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         'SELECT * FROM "public"."users" AS "u" INNER JOIN "sales"."orders" AS "o" ON "u"."id" = "o"."user_id" LEFT JOIN "inventory"."products" AS "p" ON "o"."product_id" = "p"."id";',
      );
   });

   it("join with parse() prepared statement for onValue", () => {
      const sqlEasy = new PostgresSqlEasy();
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
         'SELECT * FROM "public"."users" AS "u" INNER JOIN "public"."orders" AS "o" ON "u"."id" = "o"."user_id" AND "o"."status" = $1;',
      );
   });

   it("clearJoin resets join state", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .joinTable(JoinType.Inner, "orders", "o", (jb) => {
            jb.on("u", "id", JoinOperator.Equals, "o", "user_id");
         })
         .clearJoin();

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "public"."users" AS "u";');
   });
});
