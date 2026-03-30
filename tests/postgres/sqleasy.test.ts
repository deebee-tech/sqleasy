import { describe, expect, it } from "vitest";
import {
   PostgresSqlEasy,
   RuntimeConfiguration,
   DatabaseType,
   WhereOperator,
   MultiBuilderTransactionState,
} from "../../src";

describe("PostgresSqlEasy factory", () => {
   it("configuration returns PostgresConfiguration", () => {
      const sqlEasy = new PostgresSqlEasy();
      const config = sqlEasy.configuration();
      expect(config.databaseType()).toEqual(DatabaseType.Postgres);
      expect(config.defaultOwner()).toEqual("public");
      expect(config.stringDelimiter()).toEqual("'");
      expect(config.transactionDelimiters().begin).toEqual("BEGIN");
      expect(config.transactionDelimiters().end).toEqual("COMMIT");
   });

   it("newBuilder with custom RuntimeConfiguration", () => {
      const sqlEasy = new PostgresSqlEasy();
      const rc = new RuntimeConfiguration();
      rc.maxRowsReturned = 500;
      const builder = sqlEasy.newBuilder(rc);
      builder.selectAll().fromTable("users", "u").limit(500);
      const sql = builder.parseRaw();
      expect(sql).toContain("LIMIT 500");
   });

   it("newMultiBuilder with custom RuntimeConfiguration", () => {
      const sqlEasy = new PostgresSqlEasy();
      const rc = new RuntimeConfiguration();
      rc.maxRowsReturned = 200;
      const multiBuilder = sqlEasy.newMultiBuilder(rc);
      const b = multiBuilder.addBuilder("q1");
      b.selectAll().fromTable("users", "u").limit(200);
      const sql = multiBuilder.parseRaw();
      expect(sql).toContain("LIMIT 200");
   });

   it("constructor with custom RuntimeConfiguration", () => {
      const rc = new RuntimeConfiguration();
      rc.maxRowsReturned = 100;
      const sqlEasy = new PostgresSqlEasy(rc);
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").limit(100);
      const sql = builder.parseRaw();
      expect(sql).toContain("LIMIT 100");
   });
});

describe("PostgresParser toSqlMulti (prepared)", () => {
   it("multi parse without transaction", () => {
      const sqlEasy = new PostgresSqlEasy();
      const multiBuilder = sqlEasy.newMultiBuilder();
      multiBuilder.setTransactionState(MultiBuilderTransactionState.TransactionOff);
      const b1 = multiBuilder.addBuilder("q1");
      b1.selectAll().fromTable("users", "u").where("u", "id", WhereOperator.Equals, 1);
      const sql = multiBuilder.parse();
      expect(sql).not.toContain("BEGIN");
   });
});
