import { describe, expect, it } from "vitest";
import { MssqlSqlEasy, RuntimeConfiguration, DatabaseType } from "../../src";

describe("MssqlSqlEasy factory", () => {
   it("configuration returns MssqlConfiguration", () => {
      const sqlEasy = new MssqlSqlEasy();
      const config = sqlEasy.configuration();
      expect(config.databaseType()).toEqual(DatabaseType.Mssql);
      expect(config.defaultOwner()).toEqual("dbo");
   });

   it("newBuilder with custom RuntimeConfiguration", () => {
      const sqlEasy = new MssqlSqlEasy();
      const rc = new RuntimeConfiguration();
      rc.maxRowsReturned = 500;
      const builder = sqlEasy.newBuilder(rc);
      builder.selectAll().fromTable("users", "u");
      const sql = builder.parseRaw();
      expect(sql).toContain("TOP (500)");
   });

   it("newMultiBuilder with custom RuntimeConfiguration", () => {
      const sqlEasy = new MssqlSqlEasy();
      const rc = new RuntimeConfiguration();
      rc.maxRowsReturned = 200;
      const multiBuilder = sqlEasy.newMultiBuilder(rc);
      const b = multiBuilder.addBuilder("q1");
      b.selectAll().fromTable("users", "u");
      const sql = multiBuilder.parseRaw();
      expect(sql).toContain("TOP (200)");
   });

   it("constructor with custom RuntimeConfiguration", () => {
      const rc = new RuntimeConfiguration();
      rc.maxRowsReturned = 100;
      const sqlEasy = new MssqlSqlEasy(rc);
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u");
      const sql = builder.parseRaw();
      expect(sql).toContain("TOP (100)");
   });
});
