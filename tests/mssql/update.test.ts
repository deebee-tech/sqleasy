import { describe, expect, it } from 'vitest';
import { MssqlQuery, WhereOperator } from '../../src';

describe('MssqlQuery update', () => {
  it('updateTable with set', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.updateTable('users', 'u').set('name', 'John');

    const sql = builder.parseRaw();
    expect(sql).toEqual('UPDATE [u] SET [name] = John FROM [dbo].[users] AS [u];');
  });

  it('updateTableWithOwner with set', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.updateTableWithOwner('sales', 'users', 'u').set('name', 'John');

    const sql = builder.parseRaw();
    expect(sql).toEqual('UPDATE [u] SET [name] = John FROM [sales].[users] AS [u];');
  });

  it('setColumns (multiple)', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.updateTable('users', 'u').setColumns([
      { columnName: 'name', value: 'John' },
      { columnName: 'email', value: 'john@example.com' },
      { columnName: 'age', value: 30 },
    ]);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'UPDATE [u] SET [name] = John, [email] = john@example.com, [age] = 30 FROM [dbo].[users] AS [u];',
    );
  });

  it('setRaw', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.updateTable('users', 'u').setRaw('[counter] = [counter] + 1');

    const sql = builder.parseRaw();
    expect(sql).toEqual('UPDATE [u] SET [counter] = [counter] + 1 FROM [dbo].[users] AS [u];');
  });

  it('UPDATE with WHERE', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.updateTable('users', 'u').set('name', 'John').where('u', 'id', WhereOperator.Equals, 1);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'UPDATE [u] SET [name] = John FROM [dbo].[users] AS [u] WHERE [u].[id] = 1;',
    );
  });

  it('UPDATE with multiple SET and WHERE', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .updateTable('users', 'u')
      .set('name', 'John')
      .set('active', true)
      .where('u', 'id', WhereOperator.Equals, 1)
      .and()
      .where('u', 'status', WhereOperator.NotEquals, 'deleted');

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'UPDATE [u] SET [name] = John, [active] = true FROM [dbo].[users] AS [u] WHERE [u].[id] = 1 AND [u].[status] <> deleted;',
    );
  });

  it('UPDATE with setRaw and set combined', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .updateTable('users', 'u')
      .set('name', 'John')
      .setRaw('[updated_at] = GETDATE()')
      .where('u', 'id', WhereOperator.Equals, 1);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'UPDATE [u] SET [name] = John, [updated_at] = GETDATE() FROM [dbo].[users] AS [u] WHERE [u].[id] = 1;',
    );
  });
});
