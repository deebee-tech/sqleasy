import { describe, expect, it } from 'vitest';
import { PostgresQuery, RuntimeConfiguration, DatabaseType } from '../../src';

describe('PostgresQuery factory', () => {
  it('configuration returns PostgresConfiguration', () => {
    const query = new PostgresQuery();
    const config = query.configuration();
    expect(config.databaseType).toEqual(DatabaseType.Postgres);
    expect(config.defaultOwner).toEqual('public');
    expect(config.transactionDelimiters.begin).toEqual('BEGIN');
    expect(config.transactionDelimiters.end).toEqual('COMMIT');
  });

  it('newBuilder with custom RuntimeConfiguration', () => {
    const query = new PostgresQuery();
    const rc = new RuntimeConfiguration();
    rc.maxRowsReturned = 500;
    const builder = query.newBuilder(rc);
    builder.selectAll().fromTable('users', 'u').limit(500);
    const sql = builder.parseRaw();
    expect(sql).toContain('LIMIT 500');
  });

  it('constructor with custom RuntimeConfiguration', () => {
    const rc = new RuntimeConfiguration();
    rc.maxRowsReturned = 100;
    const query = new PostgresQuery(rc);
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').limit(100);
    const sql = builder.parseRaw();
    expect(sql).toContain('LIMIT 100');
  });
});
