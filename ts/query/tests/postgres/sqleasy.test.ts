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

  it('newBuilder accepts a one-off RuntimeConfiguration', () => {
    const query = new PostgresQuery();
    const rc = new RuntimeConfiguration();
    rc.customConfiguration = { timeout: 30 };
    const builder = query.newBuilder(rc);
    builder.selectAll().fromTable('users', 'u').limit(500);

    expect(builder.parseRaw()).toContain('LIMIT 500');
  });

  it('constructor carries customConfiguration into the dialect', () => {
    const rc = new RuntimeConfiguration();
    rc.customConfiguration = { timeout: 30 };
    const query = new PostgresQuery(rc);

    expect(query.configuration().runtimeConfiguration.customConfiguration).toEqual({ timeout: 30 });
  });
});
