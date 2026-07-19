import { describe, expect, it } from 'vitest';
import { MysqlQuery } from '../../src';

describe('MysqlQuery from', () => {
  it('fromTable with alias', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM `users` AS `u`;');
  });

  it('fromTable without alias', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', '');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM `users`;');
  });

  it('fromTables multiple tables', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTables([
      { tableName: 'users', alias: 'u' },
      { tableName: 'orders', alias: 'o' },
    ]);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM `users` AS `u`, `orders` AS `o`;');
  });

  it('fromRaw', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromRaw('`users` AS `u`');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM `users` AS `u`;');
  });

  it('fromRaws', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromRaws(['`users` AS `u`', '`orders` AS `o`']);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM `users` AS `u`, `orders` AS `o`;');
  });

  it('fromWithBuilder (subquery)', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromWithBuilder('sub', (fb) => {
      fb.selectAll().fromTable('users', 'u');
    });

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM (SELECT * FROM `users` AS `u`) AS `sub`;');
  });

  it('fromTableWithOwner with empty owner succeeds', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTableWithOwner('', 'users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM `users` AS `u`;');
  });

  it('fromTableWithOwner with non-empty owner throws', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTableWithOwner('mydb', 'users', 'u');

    expect(() => builder.parseRaw()).toThrow('MySQL does not support table owners');
  });

  it('fromTable combined with fromRaw', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').fromRaw('`orders` AS `o`');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM `users` AS `u`, `orders` AS `o`;');
  });
});
