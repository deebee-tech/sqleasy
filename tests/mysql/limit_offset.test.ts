import { describe, expect, it } from 'vitest';
import { MysqlQuery, OrderByDirection, WhereOperator } from '../../src';

describe('MysqlQuery limit offset', () => {
  it('LIMIT only', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').limit(10);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM `users` AS `u` LIMIT 10;');
  });

  it('LIMIT with OFFSET', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .orderByColumn('u', 'id', OrderByDirection.Ascending)
      .limit(10)
      .offset(5);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM `users` AS `u` ORDER BY `u`.`id` ASC LIMIT 10  OFFSET 5;');
  });

  it('OFFSET only with ORDER BY (default LIMIT applied)', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .orderByColumn('u', 'id', OrderByDirection.Ascending)
      .offset(20);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM `users` AS `u` ORDER BY `u`.`id` ASC LIMIT 1000 OFFSET 20;');
  });

  it('OFFSET with WHERE skips default LIMIT', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'active', WhereOperator.Equals, true)
      .orderByColumn('u', 'id', OrderByDirection.Ascending)
      .offset(20);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM `users` AS `u` WHERE `u`.`active` = true ORDER BY `u`.`id` ASC  OFFSET 20;',
    );
  });

  it('OFFSET without ORDER BY throws error', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').offset(20);

    expect(() => builder.parseRaw()).toThrow('ORDER BY is required when using OFFSET');
  });

  it('LIMIT 1', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').limit(1);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM `users` AS `u` LIMIT 1;');
  });

  it('large LIMIT and OFFSET', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .orderByColumn('u', 'id', OrderByDirection.Ascending)
      .limit(1000)
      .offset(5000);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM `users` AS `u` ORDER BY `u`.`id` ASC LIMIT 1000  OFFSET 5000;',
    );
  });

  it('no LIMIT or OFFSET produces no clause', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM `users` AS `u`;');
  });
});
