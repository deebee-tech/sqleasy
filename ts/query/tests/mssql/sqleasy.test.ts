import { describe, expect, it } from 'vitest';
import { MssqlQuery, OrderByDirection, RuntimeConfiguration, DatabaseType } from '../../src';

describe('MssqlQuery factory', () => {
  it('configuration returns MssqlConfiguration', () => {
    const query = new MssqlQuery();
    const config = query.configuration();
    expect(config.databaseType).toEqual(DatabaseType.Mssql);
    expect(config.defaultOwner).toEqual('dbo');
  });

  it('newBuilder accepts a one-off RuntimeConfiguration', () => {
    const query = new MssqlQuery();
    const rc = new RuntimeConfiguration();
    rc.customConfiguration = { timeout: 30 };
    const builder = query.newBuilder(rc);
    builder
      .selectAll()
      .fromTable('users', 'u')
      .orderByColumn('u', 'id', OrderByDirection.Ascending)
      .limit(500);

    expect(builder.parseRaw()).toContain('FETCH NEXT 500 ROWS ONLY');
  });

  it('constructor carries customConfiguration into the dialect', () => {
    const rc = new RuntimeConfiguration();
    rc.customConfiguration = { timeout: 30 };
    const query = new MssqlQuery(rc);

    expect(query.configuration().runtimeConfiguration.customConfiguration).toEqual({ timeout: 30 });
  });
});
