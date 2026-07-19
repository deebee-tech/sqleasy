import { describe, expect, it } from 'vitest';
import { MssqlQuery, WhereOperator } from '../../src';

describe('MssqlQuery delete', () => {
  it('deleteFrom simple', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.deleteFrom('users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual('DELETE [u] FROM [dbo].[users] AS [u];');
  });

  it('deleteFromWithOwner', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.deleteFromWithOwner('sales', 'users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual('DELETE [u] FROM [sales].[users] AS [u];');
  });

  it('DELETE with WHERE', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.deleteFrom('users', 'u').where('u', 'id', WhereOperator.Equals, 1);

    const sql = builder.parseRaw();
    expect(sql).toEqual('DELETE [u] FROM [dbo].[users] AS [u] WHERE [u].[id] = 1;');
  });

  it('DELETE with multiple WHERE conditions', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .deleteFrom('users', 'u')
      .where('u', 'status', WhereOperator.Equals, 'deleted')
      .and()
      .where('u', 'age', WhereOperator.LessThan, 18);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'DELETE [u] FROM [dbo].[users] AS [u] WHERE [u].[status] = deleted AND [u].[age] < 18;',
    );
  });

  it('deleteFrom without alias', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.deleteFrom('users', '');

    const sql = builder.parseRaw();
    expect(sql).toEqual('DELETE FROM [dbo].[users];');
  });
});
