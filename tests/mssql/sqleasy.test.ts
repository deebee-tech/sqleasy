import { describe, expect, it } from 'vitest';
import { MssqlQuery, RuntimeConfiguration, DatabaseType } from '../../src';

describe('MssqlQuery factory', () => {
  it('configuration returns MssqlConfiguration', () => {
    const query = new MssqlQuery();
    const config = query.configuration();
    expect(config.databaseType).toEqual(DatabaseType.Mssql);
    expect(config.defaultOwner).toEqual('dbo');
  });

  it('newBuilder with custom RuntimeConfiguration', () => {
    const query = new MssqlQuery();
    const rc = new RuntimeConfiguration();
    rc.maxRowsReturned = 500;
    const builder = query.newBuilder(rc);
    builder.selectAll().fromTable('users', 'u');
    const sql = builder.parseRaw();
    expect(sql).toContain('TOP (500)');
  });

  it('constructor with custom RuntimeConfiguration', () => {
    const rc = new RuntimeConfiguration();
    rc.maxRowsReturned = 100;
    const query = new MssqlQuery(rc);
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u');
    const sql = builder.parseRaw();
    expect(sql).toContain('TOP (100)');
  });
});
