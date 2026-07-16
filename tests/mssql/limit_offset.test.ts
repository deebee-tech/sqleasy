import { describe, expect, it } from 'vitest';
import { MssqlQuery, OrderByDirection, WhereOperator } from '../../src';

describe('MssqlQuery limit/offset', () => {
  // `.limit()` is pagination and renders as OFFSET/FETCH, which T-SQL only accepts alongside an
  // ORDER BY (Msg 102). Without one this used to emit `OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY` and
  // the server rejected the statement. `.top(n)` is the unordered row cap.
  it('limit without ORDER BY throws rather than emitting invalid OFFSET/FETCH', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'active', WhereOperator.Equals, 1)
      .limit(10);

    expect(() => builder.parseRaw()).toThrow('ORDER BY is required when using LIMIT on MSSQL');
  });

  it('limit only with an ORDER BY (OFFSET 0 ROWS FETCH NEXT)', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'active', WhereOperator.Equals, 1)
      .orderByColumn('u', 'id', OrderByDirection.Ascending)
      .limit(10);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM [dbo].[users] AS [u] WHERE [u].[active] = 1 ORDER BY [u].[id] ASC OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY;',
    );
  });

  // T-SQL spells "skip 5, return the rest" as a bare `OFFSET 5 ROWS`. Nothing is appended: through
  // 6.x the automatic cap added a `FETCH NEXT 1000 ROWS ONLY` here, silently rewriting "the rest"
  // into "the next 1000".
  it('offset with no limit emits a bare OFFSET, with no FETCH and no TOP', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .orderByColumn('u', 'id', OrderByDirection.Ascending)
      .offset(5);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM [dbo].[users] AS [u] ORDER BY [u].[id] ASC OFFSET 5 ROWS;');
    expect(sql).not.toContain('TOP');
    expect(sql).not.toContain('FETCH');
  });

  it('limit and offset (requires ORDER BY)', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'active', WhereOperator.Equals, 1)
      .orderByColumn('u', 'id', OrderByDirection.Ascending)
      .limit(10)
      .offset(20);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM [dbo].[users] AS [u] WHERE [u].[active] = 1 ORDER BY [u].[id] ASC OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY;',
    );
  });

  it('offset only (requires ORDER BY)', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'active', WhereOperator.Equals, 1)
      .orderByColumn('u', 'id', OrderByDirection.Ascending)
      .offset(20);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM [dbo].[users] AS [u] WHERE [u].[active] = 1 ORDER BY [u].[id] ASC OFFSET 20 ROWS;',
    );
  });

  it('TOP + LIMIT/OFFSET throws error', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').top(10).limit(5);

    expect(() => builder.parseRaw()).toThrow();
  });

  it('offset without ORDER BY throws error', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'active', WhereOperator.Equals, 1)
      .offset(20);

    expect(() => builder.parseRaw()).toThrow();
  });
});
