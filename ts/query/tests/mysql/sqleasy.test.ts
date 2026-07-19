import { describe, expect, it } from 'vitest';
import { MysqlQuery, RuntimeConfiguration, DatabaseType, WhereOperator } from '../../src';

describe('MysqlQuery factory', () => {
  it('configuration returns MysqlConfiguration', () => {
    const query = new MysqlQuery();
    const config = query.configuration();
    expect(config.databaseType).toEqual(DatabaseType.Mysql);
    expect(config.defaultOwner).toEqual('');
  });

  it('newBuilder accepts a one-off RuntimeConfiguration', () => {
    const query = new MysqlQuery();
    const rc = new RuntimeConfiguration();
    rc.customConfiguration = { timeout: 30 };
    const builder = query.newBuilder(rc);
    builder.selectAll().fromTable('users', 'u').limit(500);

    expect(builder.parseRaw()).toContain('LIMIT 500');
  });

  it('constructor carries customConfiguration into the dialect', () => {
    const rc = new RuntimeConfiguration();
    rc.customConfiguration = { timeout: 30 };
    const query = new MysqlQuery(rc);

    expect(query.configuration().runtimeConfiguration.customConfiguration).toEqual({ timeout: 30 });
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
