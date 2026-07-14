import { describe, expect, it } from 'vitest';
import { MysqlQuery } from '../../src';

describe('MysqlQuery select', () => {
  it('select all', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM `users` AS `u`;');
  });

  it('select column with alias', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder.selectColumn('u', 'id', 'user_id').fromTable('users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT `u`.`id` AS `user_id` FROM `users` AS `u`;');
  });

  it('select column without alias', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder.selectColumn('u', 'id', '').fromTable('users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT `u`.`id` FROM `users` AS `u`;');
  });

  it('select multiple columns', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectColumns([
        { tableNameOrAlias: 'u', columnName: 'id', columnAlias: 'user_id' },
        { tableNameOrAlias: 'u', columnName: 'name', columnAlias: '' },
        { tableNameOrAlias: 'u', columnName: 'email', columnAlias: 'user_email' },
      ])
      .fromTable('users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT `u`.`id` AS `user_id`, `u`.`name`, `u`.`email` AS `user_email` FROM `users` AS `u`;',
    );
  });

  it('selectRaw', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder.selectRaw('COUNT(*) AS total').fromTable('users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT COUNT(*) AS total FROM `users` AS `u`;');
  });

  it('selectRaws', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder.selectRaws(['COUNT(*) AS total', 'MAX(`u`.`age`) AS max_age']).fromTable('users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT COUNT(*) AS total, MAX(`u`.`age`) AS max_age FROM `users` AS `u`;');
  });

  it('selectWithBuilder (subquery)', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .selectWithBuilder('order_count', (sb) => {
        sb.selectRaw('COUNT(*)').fromTable('orders', 'o');
      })
      .fromTable('users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT *, (SELECT COUNT(*) FROM `orders` AS `o`) AS `order_count` FROM `users` AS `u`;',
    );
  });

  it('distinct', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder.distinct().selectColumn('u', 'name', '').fromTable('users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT DISTINCT `u`.`name` FROM `users` AS `u`;');
  });

  it('distinct with multiple columns', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .distinct()
      .selectColumns([
        { tableNameOrAlias: 'u', columnName: 'name', columnAlias: '' },
        { tableNameOrAlias: 'u', columnName: 'email', columnAlias: '' },
      ])
      .fromTable('users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT DISTINCT `u`.`name`, `u`.`email` FROM `users` AS `u`;');
  });

  it('select all with selectColumn combined', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().selectColumn('u', 'id', 'user_id').fromTable('users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT *, `u`.`id` AS `user_id` FROM `users` AS `u`;');
  });
});
