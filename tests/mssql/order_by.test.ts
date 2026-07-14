import { describe, expect, it } from 'vitest';
import { MssqlQuery, OrderByDirection, WhereOperator } from '../../src';

describe('MssqlQuery order by', () => {
  it('orderByColumn ASC', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'active', WhereOperator.Equals, 1)
      .orderByColumn('u', 'name', OrderByDirection.Ascending);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM [dbo].[users] AS [u] WHERE [u].[active] = 1 ORDER BY [u].[name] ASC;',
    );
  });

  it('orderByColumn DESC', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'active', WhereOperator.Equals, 1)
      .orderByColumn('u', 'created_at', OrderByDirection.Descending);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM [dbo].[users] AS [u] WHERE [u].[active] = 1 ORDER BY [u].[created_at] DESC;',
    );
  });

  it('orderByColumns (multiple)', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'active', WhereOperator.Equals, 1)
      .orderByColumns([
        { tableNameOrAlias: 'u', columnName: 'last_name', direction: OrderByDirection.Ascending },
        { tableNameOrAlias: 'u', columnName: 'first_name', direction: OrderByDirection.Ascending },
        { tableNameOrAlias: 'u', columnName: 'created_at', direction: OrderByDirection.Descending },
      ]);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM [dbo].[users] AS [u] WHERE [u].[active] = 1 ORDER BY [u].[last_name] ASC, [u].[first_name] ASC, [u].[created_at] DESC;',
    );
  });

  it('orderByRaw', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'active', WhereOperator.Equals, 1)
      .orderByRaw('NEWID()');

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM [dbo].[users] AS [u] WHERE [u].[active] = 1 ORDER BY NEWID();',
    );
  });

  it('orderByRaws (multiple raw)', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'active', WhereOperator.Equals, 1)
      .orderByRaws(['[u].[name] ASC', 'NEWID()']);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM [dbo].[users] AS [u] WHERE [u].[active] = 1 ORDER BY [u].[name] ASC, NEWID();',
    );
  });
});
