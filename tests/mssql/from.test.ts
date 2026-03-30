import { describe, expect, it } from "vitest";
import { MssqlSqlEasy, WhereOperator } from "../../src";

describe("MssqlSqlEasy from", () => {
   it("fromTable single", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT TOP (1000) * FROM [dbo].[users] AS [u];");
   });

   it("fromTables multiple", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTables([
         { tableName: "users", alias: "u" },
         { tableName: "orders", alias: "o" },
      ]);

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT TOP (1000) * FROM [dbo].[users] AS [u], [dbo].[orders] AS [o];");
   });

   it("fromTableWithOwner", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTableWithOwner("sales", "users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT TOP (1000) * FROM [sales].[users] AS [u];");
   });

   it("fromTablesWithOwner", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTablesWithOwner([
         { owner: "sales", tableName: "users", alias: "u" },
         { owner: "billing", tableName: "orders", alias: "o" },
      ]);

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT TOP (1000) * FROM [sales].[users] AS [u], [billing].[orders] AS [o];");
   });

   it("fromRaw", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromRaw("[dbo].[users] AS [u]");

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT TOP (1000) * FROM [dbo].[users] AS [u];");
   });

   it("fromRaws", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromRaws(["[dbo].[users] AS [u]", "[dbo].[orders] AS [o]"]);

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT TOP (1000) * FROM [dbo].[users] AS [u], [dbo].[orders] AS [o];");
   });

   it("fromWithBuilder (derived table subquery)", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromWithBuilder("subq", (b) => {
         b.selectAll().fromTable("users", "u").where("u", "active", WhereOperator.Equals, 1);
      });

      const sql = builder.parseRaw();
      expect(sql).toEqual(
         "SELECT TOP (1000) * FROM (SELECT * FROM [dbo].[users] AS [u] WHERE [u].[active] = 1) AS [subq];",
      );
   });

   it("fromTable without alias (empty string)", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "");

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT TOP (1000) * FROM [dbo].[users];");
   });
});
