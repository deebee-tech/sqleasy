import { describe, expect, it } from "vitest";
import {
   MysqlSqlEasy,
   RuntimeConfiguration,
   DatabaseType,
   WhereOperator,
   MultiBuilderTransactionState,
} from "../../src";

describe("MysqlSqlEasy factory", () => {
   it("configuration returns MysqlConfiguration", () => {
      const sqlEasy = new MysqlSqlEasy();
      const config = sqlEasy.configuration();
      expect(config.databaseType()).toEqual(DatabaseType.Mysql);
      expect(config.defaultOwner()).toEqual("");
   });

   it("newBuilder with custom RuntimeConfiguration", () => {
      const sqlEasy = new MysqlSqlEasy();
      const rc = new RuntimeConfiguration();
      rc.maxRowsReturned = 500;
      const builder = sqlEasy.newBuilder(rc);
      builder.selectAll().fromTable("users", "u").limit(500);
      const sql = builder.parseRaw();
      expect(sql).toContain("LIMIT 500");
   });

   it("newMultiBuilder with custom RuntimeConfiguration", () => {
      const sqlEasy = new MysqlSqlEasy();
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
      const sqlEasy = new MysqlSqlEasy(rc);
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").limit(100);
      const sql = builder.parseRaw();
      expect(sql).toContain("LIMIT 100");
   });
});

describe("MysqlParser parse (prepared statements)", () => {
   it("parse with where returns ? placeholder", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder.selectAll().fromTable("users", "u").where("u", "id", WhereOperator.Equals, 42);
      const sql = builder.parse();
      expect(sql).toContain("?");
      expect(sql).not.toContain("42");
   });

   it("parse with multiple params", () => {
      const sqlEasy = new MysqlSqlEasy();
      const builder = sqlEasy.newBuilder();
      builder
         .selectAll()
         .fromTable("users", "u")
         .where("u", "id", WhereOperator.Equals, 42)
         .and()
         .where("u", "name", WhereOperator.Equals, "John");
      const sql = builder.parse();
      const count = (sql.match(/\?/g) || []).length;
      expect(count).toBe(2);
   });
});

describe("MysqlParser toSqlMulti (prepared)", () => {
   it("multi parse with transaction", () => {
      const sqlEasy = new MysqlSqlEasy();
      const multiBuilder = sqlEasy.newMultiBuilder();
      const b1 = multiBuilder.addBuilder("q1");
      b1.selectAll().fromTable("users", "u").where("u", "id", WhereOperator.Equals, 1);
      const sql = multiBuilder.parse();
      expect(sql).toContain("START TRANSACTION");
      expect(sql).toContain("COMMIT");
      expect(sql).toContain("?");
   });

   it("multi parse without transaction", () => {
      const sqlEasy = new MysqlSqlEasy();
      const multiBuilder = sqlEasy.newMultiBuilder();
      multiBuilder.setTransactionState(MultiBuilderTransactionState.TransactionOff);
      const b1 = multiBuilder.addBuilder("q1");
      b1.selectAll().fromTable("users", "u").where("u", "id", WhereOperator.Equals, 1);
      const sql = multiBuilder.parse();
      expect(sql).not.toContain("START TRANSACTION");
   });
});
