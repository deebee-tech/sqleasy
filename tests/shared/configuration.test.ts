import { describe, expect, it } from "vitest";
import { MssqlConfiguration } from "../../src/sqleasy/mssql/mssql_configuration";
import { MysqlConfiguration } from "../../src/sqleasy/mysql/mysql_configuration";
import { PostgresConfiguration } from "../../src/sqleasy/postgres/postgres_configuration";
import { SqliteConfiguration } from "../../src/sqleasy/sqlite/sqlite_configuration";
import { RuntimeConfiguration } from "../../src/configuration/runtime_configuration";
import { DatabaseType } from "../../src/enums/database_type";

describe("Configuration", () => {
   const rc = new RuntimeConfiguration();

   describe("MssqlConfiguration", () => {
      const config = new MssqlConfiguration(rc);

      it("databaseType returns Mssql", () => {
         expect(config.databaseType()).toBe(DatabaseType.Mssql);
      });

      it("defaultOwner returns dbo", () => {
         expect(config.defaultOwner()).toBe("dbo");
      });

      it("identifierDelimiters returns [ and ]", () => {
         const delimiters = config.identifierDelimiters();
         expect(delimiters.begin).toBe("[");
         expect(delimiters.end).toBe("]");
      });

      it("preparedStatementPlaceholder returns ?", () => {
         expect(config.preparedStatementPlaceholder()).toBe("?");
      });

      it("stringDelimiter returns single quote", () => {
         expect(config.stringDelimiter()).toBe("'");
      });

      it("transactionDelimiters returns BEGIN TRANSACTION / COMMIT TRANSACTION", () => {
         const delimiters = config.transactionDelimiters();
         expect(delimiters.begin).toBe("BEGIN TRANSACTION");
         expect(delimiters.end).toBe("COMMIT TRANSACTION");
      });
   });

   describe("MysqlConfiguration", () => {
      const config = new MysqlConfiguration(rc);

      it("databaseType returns Mysql", () => {
         expect(config.databaseType()).toBe(DatabaseType.Mysql);
      });

      it("defaultOwner returns empty string", () => {
         expect(config.defaultOwner()).toBe("");
      });

      it("identifierDelimiters returns backticks", () => {
         const delimiters = config.identifierDelimiters();
         expect(delimiters.begin).toBe("`");
         expect(delimiters.end).toBe("`");
      });

      it("preparedStatementPlaceholder returns ?", () => {
         expect(config.preparedStatementPlaceholder()).toBe("?");
      });

      it("stringDelimiter returns single quote", () => {
         expect(config.stringDelimiter()).toBe("'");
      });

      it("transactionDelimiters returns START TRANSACTION / COMMIT", () => {
         const delimiters = config.transactionDelimiters();
         expect(delimiters.begin).toBe("START TRANSACTION");
         expect(delimiters.end).toBe("COMMIT");
      });
   });

   describe("PostgresConfiguration", () => {
      const config = new PostgresConfiguration(rc);

      it("databaseType returns Postgres", () => {
         expect(config.databaseType()).toBe(DatabaseType.Postgres);
      });

      it("defaultOwner returns public", () => {
         expect(config.defaultOwner()).toBe("public");
      });

      it("identifierDelimiters returns double quotes", () => {
         const delimiters = config.identifierDelimiters();
         expect(delimiters.begin).toBe('"');
         expect(delimiters.end).toBe('"');
      });

      it("preparedStatementPlaceholder returns $", () => {
         expect(config.preparedStatementPlaceholder()).toBe("$");
      });

      it("stringDelimiter returns single quote", () => {
         expect(config.stringDelimiter()).toBe("'");
      });

      it("transactionDelimiters returns BEGIN / COMMIT", () => {
         const delimiters = config.transactionDelimiters();
         expect(delimiters.begin).toBe("BEGIN");
         expect(delimiters.end).toBe("COMMIT");
      });
   });

   describe("SqliteConfiguration", () => {
      const config = new SqliteConfiguration(rc);

      it("databaseType returns Sqlite", () => {
         expect(config.databaseType()).toBe(DatabaseType.Sqlite);
      });

      it("defaultOwner returns empty string", () => {
         expect(config.defaultOwner()).toBe("");
      });

      it("identifierDelimiters returns double quotes", () => {
         const delimiters = config.identifierDelimiters();
         expect(delimiters.begin).toBe('"');
         expect(delimiters.end).toBe('"');
      });

      it("preparedStatementPlaceholder returns ?", () => {
         expect(config.preparedStatementPlaceholder()).toBe("?");
      });

      it("stringDelimiter returns single quote", () => {
         expect(config.stringDelimiter()).toBe("'");
      });

      it("transactionDelimiters returns BEGIN / COMMIT", () => {
         const delimiters = config.transactionDelimiters();
         expect(delimiters.begin).toBe("BEGIN");
         expect(delimiters.end).toBe("COMMIT");
      });
   });

   describe("RuntimeConfiguration", () => {
      it("has default maxRowsReturned of 1000", () => {
         const defaultRc = new RuntimeConfiguration();
         expect(defaultRc.maxRowsReturned).toBe(1000);
      });

      it("has default customConfiguration of undefined", () => {
         const defaultRc = new RuntimeConfiguration();
         expect(defaultRc.customConfiguration).toBeUndefined();
      });

      it("accepts custom maxRowsReturned", () => {
         const customRc = new RuntimeConfiguration();
         customRc.maxRowsReturned = 500;
         expect(customRc.maxRowsReturned).toBe(500);
      });

      it("accepts custom customConfiguration", () => {
         const customRc = new RuntimeConfiguration();
         customRc.customConfiguration = { timeout: 30 };
         expect(customRc.customConfiguration).toEqual({ timeout: 30 });
      });

      it("passes through to configuration runtimeConfiguration()", () => {
         const customRc = new RuntimeConfiguration();
         customRc.maxRowsReturned = 250;
         const config = new MssqlConfiguration(customRc);
         expect(config.runtimeConfiguration().maxRowsReturned).toBe(250);
      });
   });
});
