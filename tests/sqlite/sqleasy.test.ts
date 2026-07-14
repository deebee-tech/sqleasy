import { describe, expect, it } from 'vitest';
import { SqliteQuery, RuntimeConfiguration, DatabaseType, WhereOperator } from '../../src';

describe('SqliteQuery factory', () => {
  it('configuration returns SqliteConfiguration', () => {
    const query = new SqliteQuery();
    const config = query.configuration();
    expect(config.databaseType).toEqual(DatabaseType.Sqlite);
    expect(config.defaultOwner).toEqual('');
  });

  it('newBuilder with custom RuntimeConfiguration', () => {
    const query = new SqliteQuery();
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
    const query = new SqliteQuery(rc);
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').limit(100);
    const sql = builder.parseRaw();
    expect(sql).toContain('LIMIT 100');
  });
});

describe('SqliteParser parse (prepared statements)', () => {
  it('parse with where returns ? placeholder', () => {
    const query = new SqliteQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').where('u', 'id', WhereOperator.Equals, 42);
    const sql = builder.parse();
    expect(sql).toContain('?');
    expect(sql).not.toContain('42');
  });
});
