import { describe, expect, it } from "vitest";
import {
   SqliteSqlEasy,
   RuntimeConfiguration,
   DatabaseType,
   WhereOperator,
   MultiBuilderTransactionState,
} from "../../src";

describe("SqliteSqlEasy factory", () => {
   it("configuration returns SqliteConfiguration", () => {
      const sqlEasy = new SqliteSqlEasy();
      const config = sqlEasy.configuration();
      expect(config.databaseType()).toEqual(DatabaseType.Sqlite);
      expect(config.defaultOwner()).toEqual("");
   });

   it("newBuilder with custom RuntimeConfiguration", () => {
      const sqlEasy = new SqliteSqlEasy();
      const rc = new RuntimeConfiguration();
      rc.maxRowsReturned = 500;
      const builder = sqlEasy.newBuilder(rc);
      builder.selectAll().fromTable("users", "u").limit(500);
      const sql = builder.parseRaw();
      expect(sql).toContain("LIMIT 500");
   });

   it("newMultiBuilder with custom RuntimeConfiguration", () => {
      const sqlEasy = new SqliteSqlEasy();
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
      const sqlEasy = new SqliteSqlEasy(rc);
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").limit(100);
      const sql = builder.parseRaw();
      expect(sql).toContain("LIMIT 100");
   });
});

describe("SqliteParser parse (prepared statements)", () => {
   it("parse with where returns ? placeholder", () => {
      const sqlEasy = new SqliteSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "id", WhereOperator.Equals, 42);
      const sql = builder.parse();
      expect(sql).toContain("?");
      expect(sql).not.toContain("42");
   });
});

describe("SqliteParser toSqlMulti (prepared)", () => {
   it("multi parse with transaction", () => {
      const sqlEasy = new SqliteSqlEasy();
      const multiBuilder = sqlEasy.newMultiBuilder();
      const b1 = multiBuilder.addBuilder("q1");
      b1.selectAll().fromTable("users", "u").where("u", "id", WhereOperator.Equals, 1);
      const sql = multiBuilder.parse();
      expect(sql).toContain("BEGIN");
      expect(sql).toContain("COMMIT");
   });

   it("multi parse without transaction", () => {
      const sqlEasy = new SqliteSqlEasy();
      const multiBuilder = sqlEasy.newMultiBuilder();
      multiBuilder.setTransactionState(MultiBuilderTransactionState.TransactionOff);
      const b1 = multiBuilder.addBuilder("q1");
      b1.selectAll().fromTable("users", "u").where("u", "id", WhereOperator.Equals, 1);
      const sql = multiBuilder.parse();
      expect(sql).not.toContain("BEGIN");
   });
});
