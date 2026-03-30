import { describe, expect, it } from "vitest";
import { PostgresSqlEasy, WhereOperator } from "../../src";

describe("PostgresSqlEasy from", () => {
   it("fromTable with default public owner", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "public"."users" AS "u";');
   });

   it("fromTable without alias", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "");

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "public"."users";');
   });

   it("fromTables multiple tables", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTables([
         { tableName: "users", alias: "u" },
         { tableName: "orders", alias: "o" },
      ]);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "public"."users" AS "u", "public"."orders" AS "o";');
   });

   it("fromTableWithOwner custom schema", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTableWithOwner("sales", "orders", "o");

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "sales"."orders" AS "o";');
   });

   it("fromTablesWithOwner multiple tables with owners", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTablesWithOwner([
         { owner: "public", tableName: "users", alias: "u" },
         { owner: "sales", tableName: "orders", alias: "o" },
      ]);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "public"."users" AS "u", "sales"."orders" AS "o";');
   });

   it("fromRaw", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromRaw('"public"."users" AS "u"');

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "public"."users" AS "u";');
   });

   it("fromRaws multiple raw sources", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromRaws(['"public"."users" AS "u"', '"public"."orders" AS "o"']);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "public"."users" AS "u", "public"."orders" AS "o";');
   });

   it("fromWithBuilder subquery", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromWithBuilder("sub", (sb) => {
         sb.selectAll().fromTable("users", "u").where("u", "active", WhereOperator.Equals, true);
      });

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM (SELECT * FROM "public"."users" AS "u" WHERE "u"."active" = true) AS "sub";');
   });

   it("fromTable with parse() prepared statement", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u");

      const sql = builder.parse();
      expect(sql).toEqual('SELECT * FROM "public"."users" AS "u";');
   });

   it("fromWithBuilder subquery with parse()", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromWithBuilder("sub", (sb) => {
         sb.selectAll().fromTable("users", "u").where("u", "active", WhereOperator.Equals, true);
      });

      const sql = builder.parse();
      expect(sql).toEqual('SELECT * FROM (SELECT * FROM "public"."users" AS "u" WHERE "u"."active" = $1) AS "sub";');
   });

   it("clearFrom resets from state", () => {
      const sqlEasy = new PostgresSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("orders", "o").clearFrom().fromTable("users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "public"."users" AS "u";');
   });
});
