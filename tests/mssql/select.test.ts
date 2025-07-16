import { describe, expect, it } from "vitest";
import { MssqlSqlEasy } from "../../src";

describe("MssqlSqlEasy select", () => {
   it("select all", () => {
      const sqlEasy = new MssqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u");

      const sql = builder.parseRaw();
      expect(sql).toEqual("SELECT * FROM [dbo].[users] AS [u];");
   });
});
