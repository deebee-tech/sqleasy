import { describe, expect, it } from 'vitest';
import { MssqlQuery, WhereOperator } from '../../src';

describe('MssqlQuery from', () => {
  it('fromTable single', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM [dbo].[users] AS [u];');
  });

  it('fromTables multiple', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTables([
      { tableName: 'users', alias: 'u' },
      { tableName: 'orders', alias: 'o' },
    ]);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM [dbo].[users] AS [u], [dbo].[orders] AS [o];');
  });

  it('fromTableWithOwner', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTableWithOwner('sales', 'users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM [sales].[users] AS [u];');
  });

  it('fromTablesWithOwner', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTablesWithOwner([
      { owner: 'sales', tableName: 'users', alias: 'u' },
      { owner: 'billing', tableName: 'orders', alias: 'o' },
    ]);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM [sales].[users] AS [u], [billing].[orders] AS [o];');
  });

  it('fromRaw', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromRaw('[dbo].[users] AS [u]');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM [dbo].[users] AS [u];');
  });

  it('fromRaws', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromRaws(['[dbo].[users] AS [u]', '[dbo].[orders] AS [o]']);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM [dbo].[users] AS [u], [dbo].[orders] AS [o];');
  });

  it('fromWithBuilder (derived table subquery)', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromWithBuilder('subq', (b) => {
      b.selectAll().fromTable('users', 'u').where('u', 'active', WhereOperator.Equals, 1);
    });

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM (SELECT * FROM [dbo].[users] AS [u] WHERE [u].[active] = 1) AS [subq];',
    );
  });

  it('fromTable without alias (empty string)', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', '');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM [dbo].[users];');
  });
});
