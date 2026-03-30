import { describe, expect, it } from "vitest";
import { SqlHelper } from "../../src/helpers/sql_helper";
import { MssqlConfiguration } from "../../src/sqleasy/mssql/mssql_configuration";
import { MysqlConfiguration } from "../../src/sqleasy/mysql/mysql_configuration";
import { PostgresConfiguration } from "../../src/sqleasy/postgres/postgres_configuration";
import { RuntimeConfiguration } from "../../src/configuration/runtime_configuration";
import { ParserMode } from "../../src/enums/parser_mode";

describe("SqlHelper", () => {
   const rc = new RuntimeConfiguration();
   const mssqlConfig = new MssqlConfiguration(rc);
   const mysqlConfig = new MysqlConfiguration(rc);
   const postgresConfig = new PostgresConfiguration(rc);

   describe("addSqlSnippet", () => {
      it("appends SQL correctly", () => {
         const helper = new SqlHelper(mssqlConfig, ParserMode.Prepared);
         helper.addSqlSnippet("SELECT ");
         helper.addSqlSnippet("* FROM users");
         expect(helper.getSql()).toBe("SELECT * FROM users");
      });

      it("appends multiple snippets in sequence", () => {
         const helper = new SqlHelper(mssqlConfig, ParserMode.Prepared);
         helper.addSqlSnippet("A");
         helper.addSqlSnippet("B");
         helper.addSqlSnippet("C");
         expect(helper.getSql()).toBe("ABC");
      });
   });

   describe("addDynamicValue", () => {
      it("in Prepared mode pushes value and returns ? placeholder (MSSQL)", () => {
         const helper = new SqlHelper(mssqlConfig, ParserMode.Prepared);
         const placeholder = helper.addDynamicValue("test");
         expect(placeholder).toBe("?");
         expect(helper.getValues()).toEqual(["test"]);
      });

      it("in Prepared mode pushes value and returns ? placeholder (MySQL)", () => {
         const helper = new SqlHelper(mysqlConfig, ParserMode.Prepared);
         const placeholder = helper.addDynamicValue(42);
         expect(placeholder).toBe("?");
         expect(helper.getValues()).toEqual([42]);
      });

      it("in Prepared mode pushes value and returns $ placeholder (Postgres)", () => {
         const helper = new SqlHelper(postgresConfig, ParserMode.Prepared);
         const placeholder = helper.addDynamicValue("hello");
         expect(placeholder).toBe("$");
         expect(helper.getValues()).toEqual(["hello"]);
      });

      it("in Raw mode returns value string inline for a string", () => {
         const helper = new SqlHelper(mssqlConfig, ParserMode.Raw);
         const result = helper.addDynamicValue("inline");
         expect(result).toBe("inline");
         expect(helper.getValues()).toEqual([]);
      });

      it("in Raw mode returns value string inline for a number", () => {
         const helper = new SqlHelper(mssqlConfig, ParserMode.Raw);
         const result = helper.addDynamicValue(123);
         expect(result).toBe("123");
         expect(helper.getValues()).toEqual([]);
      });

      it("in Raw mode returns value string inline for a boolean", () => {
         const helper = new SqlHelper(mssqlConfig, ParserMode.Raw);
         expect(helper.addDynamicValue(true)).toBe("true");
         expect(helper.addDynamicValue(false)).toBe("false");
      });

      it("accumulates multiple values in Prepared mode", () => {
         const helper = new SqlHelper(mssqlConfig, ParserMode.Prepared);
         helper.addDynamicValue("a");
         helper.addDynamicValue("b");
         helper.addDynamicValue("c");
         expect(helper.getValues()).toEqual(["a", "b", "c"]);
      });
   });

   describe("addSqlSnippetWithValues", () => {
      it("merges values correctly by spreading the array", () => {
         const helper = new SqlHelper(mssqlConfig, ParserMode.Prepared);
         helper.addSqlSnippetWithValues("WHERE id = ? AND name = ?", [1, "test"]);
         expect(helper.getSql()).toBe("WHERE id = ? AND name = ?");
         expect(helper.getValues()).toEqual([1, "test"]);
      });

      it("appends to existing values", () => {
         const helper = new SqlHelper(mssqlConfig, ParserMode.Prepared);
         helper.addDynamicValue("existing");
         helper.addSqlSnippetWithValues("AND x = ?", [42]);
         expect(helper.getValues()).toEqual(["existing", 42]);
      });
   });

   describe("getSql", () => {
      it("returns combined SQL string", () => {
         const helper = new SqlHelper(mssqlConfig, ParserMode.Prepared);
         helper.addSqlSnippet("SELECT * ");
         helper.addSqlSnippet("FROM users ");
         helper.addSqlSnippet("WHERE id = ?");
         expect(helper.getSql()).toBe("SELECT * FROM users WHERE id = ?");
      });

      it("returns empty string when no snippets added", () => {
         const helper = new SqlHelper(mssqlConfig, ParserMode.Prepared);
         expect(helper.getSql()).toBe("");
      });
   });

   describe("getSqlDebug", () => {
      it("replaces ? placeholders with values (MSSQL)", () => {
         const helper = new SqlHelper(mssqlConfig, ParserMode.Prepared);
         helper.addSqlSnippet("SELECT * FROM users WHERE id = ");
         const p1 = helper.addDynamicValue("42");
         helper.addSqlSnippet(p1 + " AND name = ");
         const p2 = helper.addDynamicValue("Alice");
         helper.addSqlSnippet(p2);
         expect(helper.getSqlDebug()).toBe("SELECT * FROM users WHERE id = 42 AND name = Alice");
      });

      it("replaces $ placeholders with values (Postgres)", () => {
         const helper = new SqlHelper(postgresConfig, ParserMode.Prepared);
         helper.addSqlSnippet("SELECT * FROM users WHERE id = ");
         const p1 = helper.addDynamicValue("42");
         helper.addSqlSnippet(p1 + " AND name = ");
         const p2 = helper.addDynamicValue("Alice");
         helper.addSqlSnippet(p2);
         expect(helper.getSqlDebug()).toBe("SELECT * FROM users WHERE id = 42 AND name = Alice");
      });

      it("returns SQL unchanged when no placeholders exist", () => {
         const helper = new SqlHelper(mssqlConfig, ParserMode.Raw);
         helper.addSqlSnippet("SELECT * FROM users");
         expect(helper.getSqlDebug()).toBe("SELECT * FROM users");
      });
   });

   describe("getValues", () => {
      it("returns non-null values", () => {
         const helper = new SqlHelper(mssqlConfig, ParserMode.Prepared);
         helper.addDynamicValue("keep");
         helper.addDynamicValue(null);
         helper.addDynamicValue(42);
         helper.addDynamicValue(undefined);
         helper.addDynamicValue("also_keep");
         expect(helper.getValues()).toEqual(["keep", 42, "also_keep"]);
      });

      it("returns empty array when no values exist", () => {
         const helper = new SqlHelper(mssqlConfig, ParserMode.Prepared);
         expect(helper.getValues()).toEqual([]);
      });
   });

   describe("getValueStringFromDataType", () => {
      it("handles string values", () => {
         const helper = new SqlHelper(mssqlConfig, ParserMode.Raw);
         expect(helper.getValueStringFromDataType("hello")).toBe("hello");
      });

      it("handles number values", () => {
         const helper = new SqlHelper(mssqlConfig, ParserMode.Raw);
         expect(helper.getValueStringFromDataType(42)).toBe("42");
         expect(helper.getValueStringFromDataType(3.14)).toBe("3.14");
         expect(helper.getValueStringFromDataType(0)).toBe("0");
      });

      it("handles boolean values", () => {
         const helper = new SqlHelper(mssqlConfig, ParserMode.Raw);
         expect(helper.getValueStringFromDataType(true)).toBe("true");
         expect(helper.getValueStringFromDataType(false)).toBe("false");
      });

      it("handles Date values", () => {
         const helper = new SqlHelper(mssqlConfig, ParserMode.Raw);
         const date = new Date("2024-01-15T12:00:00.000Z");
         expect(helper.getValueStringFromDataType(date)).toBe("2024-01-15T12:00:00.000Z");
      });

      it("handles object values via JSON.stringify", () => {
         const helper = new SqlHelper(mssqlConfig, ParserMode.Raw);
         const obj = { key: "value" };
         expect(helper.getValueStringFromDataType(obj)).toBe('{"key":"value"}');
      });

      it("handles array values via JSON.stringify", () => {
         const helper = new SqlHelper(mssqlConfig, ParserMode.Raw);
         expect(helper.getValueStringFromDataType([1, 2, 3])).toBe("[1,2,3]");
      });

      it("handles null by returning empty string", () => {
         const helper = new SqlHelper(mssqlConfig, ParserMode.Raw);
         expect(helper.getValueStringFromDataType(null)).toBe("");
      });

      it("handles undefined by returning empty string", () => {
         const helper = new SqlHelper(mssqlConfig, ParserMode.Raw);
         expect(helper.getValueStringFromDataType(undefined)).toBe("");
      });
   });

   describe("clear", () => {
      it("resets SQL and values", () => {
         const helper = new SqlHelper(mssqlConfig, ParserMode.Prepared);
         helper.addSqlSnippet("SELECT * FROM users WHERE id = ");
         helper.addDynamicValue(1);
         expect(helper.getSql()).not.toBe("");
         expect(helper.getValues()).not.toEqual([]);

         helper.clear();
         expect(helper.getSql()).toBe("");
         expect(helper.getValues()).toEqual([]);
      });

      it("allows reuse after clearing", () => {
         const helper = new SqlHelper(mssqlConfig, ParserMode.Prepared);
         helper.addSqlSnippet("first");
         helper.clear();
         helper.addSqlSnippet("second");
         expect(helper.getSql()).toBe("second");
      });
   });
});
