import { describe, expect, it } from 'vitest';
import { MssqlQuery, OrderByDirection, WhereOperator } from '../../src';

describe('MssqlQuery top', () => {
  it('top(10) - explicit TOP', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').top(10);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT TOP (10) * FROM [dbo].[users] AS [u];');
  });

  it('clearTop removes the TOP entirely', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').top(10).clearTop();

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM [dbo].[users] AS [u];');
    expect(sql).not.toContain('TOP');
  });

  // Through 6.x an unbounded outer query silently collected a `TOP (1000)` from the automatic
  // `maxRowsReturned` cap. The cap is gone: a row limit is the caller's policy, and one applied
  // behind their back is a truncation they never wrote. This pins that it never comes back.
  it('emits no automatic TOP on an unbounded query', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM [dbo].[users] AS [u];');
    expect(sql).not.toContain('TOP');
  });

  it('no TOP when WHERE clause present', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').where('u', 'id', WhereOperator.Equals, 1);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM [dbo].[users] AS [u] WHERE [u].[id] = 1;');
  });

  it('no TOP when isInnerStatement (subquery)', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .whereInWithBuilder('u', 'id', (b) => {
        b.selectColumn('o', 'user_id', '').fromTable('orders', 'o');
      });

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM [dbo].[users] AS [u] WHERE [u].[id] IN (SELECT [o].[user_id] FROM [dbo].[orders] AS [o]);',
    );
  });

  it('explicit TOP with WHERE', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .top(5)
      .where('u', 'active', WhereOperator.Equals, 1);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT TOP (5) * FROM [dbo].[users] AS [u] WHERE [u].[active] = 1;');
  });

  it('no TOP when limit is set', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .orderByColumn('u', 'id', OrderByDirection.Ascending)
      .limit(10);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM [dbo].[users] AS [u] ORDER BY [u].[id] ASC OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY;',
    );
  });

  // "Skip 20 and return the rest" is exactly what the caller asked for, and T-SQL spells it with a
  // bare OFFSET. Through 6.x this collected a `FETCH NEXT 1000 ROWS ONLY` from the automatic cap,
  // which quietly turned "the rest" into "the next 1000".
  it('offset without a limit emits a bare OFFSET and no FETCH', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .orderByColumn('u', 'id', OrderByDirection.Ascending)
      .offset(20);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM [dbo].[users] AS [u] ORDER BY [u].[id] ASC OFFSET 20 ROWS;');
    expect(sql).not.toContain('TOP');
    expect(sql).not.toContain('FETCH');
  });
});
