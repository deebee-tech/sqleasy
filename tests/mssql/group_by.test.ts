import { describe, expect, it } from 'vitest';
import { MssqlQuery, WhereOperator } from '../../src';

describe('MssqlQuery group by', () => {
  it('groupByColumn', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .selectColumn('u', 'status', 'status')
      .selectRaw('COUNT(*) AS cnt')
      .fromTable('users', 'u')
      .where('u', 'active', WhereOperator.Equals, 1)
      .groupByColumn('u', 'status');

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT [u].[status] AS [status], COUNT(*) AS cnt FROM [dbo].[users] AS [u] WHERE [u].[active] = 1 GROUP BY [u].[status];',
    );
  });

  it('groupByColumns (multiple)', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .selectColumn('u', 'status', 'status')
      .selectColumn('u', 'role', 'role')
      .selectRaw('COUNT(*) AS cnt')
      .fromTable('users', 'u')
      .where('u', 'active', WhereOperator.Equals, 1)
      .groupByColumns([
        { tableNameOrAlias: 'u', columnName: 'status' },
        { tableNameOrAlias: 'u', columnName: 'role' },
      ]);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT [u].[status] AS [status], [u].[role] AS [role], COUNT(*) AS cnt FROM [dbo].[users] AS [u] WHERE [u].[active] = 1 GROUP BY [u].[status], [u].[role];',
    );
  });

  it('groupByRaw', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .selectRaw('YEAR([u].[created_at]) AS yr')
      .selectRaw('COUNT(*) AS cnt')
      .fromTable('users', 'u')
      .where('u', 'active', WhereOperator.Equals, 1)
      .groupByRaw('YEAR([u].[created_at])');

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT YEAR([u].[created_at]) AS yr, COUNT(*) AS cnt FROM [dbo].[users] AS [u] WHERE [u].[active] = 1 GROUP BY YEAR([u].[created_at]);',
    );
  });

  it('GROUP BY with HAVING', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .selectColumn('u', 'status', 'status')
      .selectRaw('COUNT(*) AS cnt')
      .fromTable('users', 'u')
      .where('u', 'active', WhereOperator.Equals, 1)
      .groupByColumn('u', 'status')
      .having('u', 'status', WhereOperator.GreaterThan, 5);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT [u].[status] AS [status], COUNT(*) AS cnt FROM [dbo].[users] AS [u] WHERE [u].[active] = 1 GROUP BY [u].[status] HAVING [u].[status] > 5;',
    );
  });

  it('GROUP BY with HAVING raw', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .selectColumn('u', 'status', 'status')
      .selectRaw('COUNT(*) AS cnt')
      .fromTable('users', 'u')
      .where('u', 'active', WhereOperator.Equals, 1)
      .groupByColumn('u', 'status')
      .havingRaw('COUNT(*) > 10');

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT [u].[status] AS [status], COUNT(*) AS cnt FROM [dbo].[users] AS [u] WHERE [u].[active] = 1 GROUP BY [u].[status] HAVING COUNT(*) > 10;',
    );
  });
});
