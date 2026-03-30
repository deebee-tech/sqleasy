import { describe, expect, it } from "vitest";
import { SqliteSqlEasy } from "../../src";

describe("SqliteSqlEasy from", () => {
   it("from single table", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u";');
   });

   it("from single table without alias", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "");

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users";');
   });

   it("from multiple tables", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTables([
         { tableName: "users", alias: "u" },
         { tableName: "orders", alias: "o" },
      ]);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u", "orders" AS "o";');
   });

   it("from raw", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromRaw('"users" AS "u"');

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u";');
   });

   it("from multiple raws", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromRaws(['"users" AS "u"', '"orders" AS "o"']);

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u", "orders" AS "o";');
   });

   it("from with builder (subquery)", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromWithBuilder("sub", (sb) => {
         sb.selectAll().fromTable("users", "u");
      });

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM (SELECT * FROM "users" AS "u") AS "sub";');
   });

   it("from table with empty owner (SQLite default)", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTableWithOwner("", "users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "users" AS "u";');
   });

   it("from table with explicit owner", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTableWithOwner("main", "users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual('SELECT * FROM "main"."users" AS "u";');
   });
});
