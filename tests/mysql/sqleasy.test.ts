import { describe, expect, it } from 'vitest';
import { MysqlQuery, RuntimeConfiguration, DatabaseType, WhereOperator } from '../../src';

describe('MysqlQuery factory', () => {
  it('configuration returns MysqlConfiguration', () => {
    const query = new MysqlQuery();
    const config = query.configuration();
    expect(config.databaseType).toEqual(DatabaseType.Mysql);
    expect(config.defaultOwner).toEqual('');
  });

  it('newBuilder with custom RuntimeConfiguration', () => {
    const query = new MysqlQuery();
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
    const query = new MysqlQuery(rc);
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').limit(100);
    const sql = builder.parseRaw();
    expect(sql).toContain('LIMIT 100');
  });
});

describe('MysqlParser parse (prepared statements)', () => {
  it('parse with where returns ? placeholder', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').where('u', 'id', WhereOperator.Equals, 42);
    const sql = builder.parse();
    expect(sql).toContain('?');
    expect(sql).not.toContain('42');
  });

  it('parse with multiple params', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'id', WhereOperator.Equals, 42)
      .and()
      .where('u', 'name', WhereOperator.Equals, 'John');
    const sql = builder.parse();
    const count = (sql.match(/\?/g) || []).length;
    expect(count).toBe(2);
  });
});
