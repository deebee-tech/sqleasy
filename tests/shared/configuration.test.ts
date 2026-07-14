import { describe, expect, it } from 'vitest';
import { mssqlConfiguration } from '../../src/dialects/mssql/configuration';
import { mysqlConfiguration } from '../../src/dialects/mysql/configuration';
import { postgresConfiguration } from '../../src/dialects/postgres/configuration';
import { sqliteConfiguration } from '../../src/dialects/sqlite/configuration';
import { RuntimeConfiguration } from '../../src/configuration/runtime';
import { DatabaseType } from '../../src/enums/database-type';

describe('Configuration', () => {
  const rc = new RuntimeConfiguration();

  describe('mssqlConfiguration', () => {
    const config = mssqlConfiguration(rc);

    it('databaseType returns Mssql', () => {
      expect(config.databaseType).toBe(DatabaseType.Mssql);
    });

    it('defaultOwner returns dbo', () => {
      expect(config.defaultOwner).toBe('dbo');
    });

    it('identifierDelimiters returns [ and ]', () => {
      const delimiters = config.identifierDelimiters;
      expect(delimiters.begin).toBe('[');
      expect(delimiters.end).toBe(']');
    });

    it('preparedStatementPlaceholder returns ?', () => {
      expect(config.preparedStatementPlaceholder).toBe('?');
    });

    it('transactionDelimiters returns BEGIN TRANSACTION / COMMIT TRANSACTION', () => {
      const delimiters = config.transactionDelimiters;
      expect(delimiters.begin).toBe('BEGIN TRANSACTION');
      expect(delimiters.end).toBe('COMMIT TRANSACTION');
    });
  });

  describe('mysqlConfiguration', () => {
    const config = mysqlConfiguration(rc);

    it('databaseType returns Mysql', () => {
      expect(config.databaseType).toBe(DatabaseType.Mysql);
    });

    it('defaultOwner returns empty string', () => {
      expect(config.defaultOwner).toBe('');
    });

    it('identifierDelimiters returns backticks', () => {
      const delimiters = config.identifierDelimiters;
      expect(delimiters.begin).toBe('`');
      expect(delimiters.end).toBe('`');
    });

    it('preparedStatementPlaceholder returns ?', () => {
      expect(config.preparedStatementPlaceholder).toBe('?');
    });

    it('transactionDelimiters returns START TRANSACTION / COMMIT', () => {
      const delimiters = config.transactionDelimiters;
      expect(delimiters.begin).toBe('START TRANSACTION');
      expect(delimiters.end).toBe('COMMIT');
    });
  });

  describe('postgresConfiguration', () => {
    const config = postgresConfiguration(rc);

    it('databaseType returns Postgres', () => {
      expect(config.databaseType).toBe(DatabaseType.Postgres);
    });

    it('defaultOwner returns public', () => {
      expect(config.defaultOwner).toBe('public');
    });

    it('identifierDelimiters returns double quotes', () => {
      const delimiters = config.identifierDelimiters;
      expect(delimiters.begin).toBe('"');
      expect(delimiters.end).toBe('"');
    });

    it('preparedStatementPlaceholder returns $', () => {
      expect(config.preparedStatementPlaceholder).toBe('$');
    });

    it('transactionDelimiters returns BEGIN / COMMIT', () => {
      const delimiters = config.transactionDelimiters;
      expect(delimiters.begin).toBe('BEGIN');
      expect(delimiters.end).toBe('COMMIT');
    });
  });

  describe('sqliteConfiguration', () => {
    const config = sqliteConfiguration(rc);

    it('databaseType returns Sqlite', () => {
      expect(config.databaseType).toBe(DatabaseType.Sqlite);
    });

    it('defaultOwner returns empty string', () => {
      expect(config.defaultOwner).toBe('');
    });

    it('identifierDelimiters returns double quotes', () => {
      const delimiters = config.identifierDelimiters;
      expect(delimiters.begin).toBe('"');
      expect(delimiters.end).toBe('"');
    });

    it('preparedStatementPlaceholder returns ?', () => {
      expect(config.preparedStatementPlaceholder).toBe('?');
    });

    it('transactionDelimiters returns BEGIN / COMMIT', () => {
      const delimiters = config.transactionDelimiters;
      expect(delimiters.begin).toBe('BEGIN');
      expect(delimiters.end).toBe('COMMIT');
    });
  });

  describe('RuntimeConfiguration', () => {
    it('has default maxRowsReturned of 1000', () => {
      const defaultRc = new RuntimeConfiguration();
      expect(defaultRc.maxRowsReturned).toBe(1000);
    });

    it('has default customConfiguration of undefined', () => {
      const defaultRc = new RuntimeConfiguration();
      expect(defaultRc.customConfiguration).toBeUndefined();
    });

    it('accepts custom maxRowsReturned', () => {
      const customRc = new RuntimeConfiguration();
      customRc.maxRowsReturned = 500;
      expect(customRc.maxRowsReturned).toBe(500);
    });

    it('accepts custom customConfiguration', () => {
      const customRc = new RuntimeConfiguration();
      customRc.customConfiguration = { timeout: 30 };
      expect(customRc.customConfiguration).toEqual({ timeout: 30 });
    });

    it('passes through to configuration runtimeConfiguration', () => {
      const customRc = new RuntimeConfiguration();
      customRc.maxRowsReturned = 250;
      const config = mssqlConfiguration(customRc);
      expect(config.runtimeConfiguration.maxRowsReturned).toBe(250);
    });
  });
});
