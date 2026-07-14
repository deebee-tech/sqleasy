import { describe, expect, it } from 'vitest';
import { MysqlQuery, OrderByDirection } from '../../src';

describe('MysqlQuery order by', () => {
  it('order by ascending', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .orderByColumn('u', 'name', OrderByDirection.Ascending);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM `users` AS `u` ORDER BY `u`.`name` ASC;');
  });

  it('order by descending', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .orderByColumn('u', 'created_at', OrderByDirection.Descending);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM `users` AS `u` ORDER BY `u`.`created_at` DESC;');
  });

  it('order by multiple columns', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .orderByColumn('u', 'last_name', OrderByDirection.Ascending)
      .orderByColumn('u', 'first_name', OrderByDirection.Ascending);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM `users` AS `u` ORDER BY `u`.`last_name` ASC, `u`.`first_name` ASC;',
    );
  });

  it('orderByColumns', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .orderByColumns([
        { tableNameOrAlias: 'u', columnName: 'last_name', direction: OrderByDirection.Ascending },
        { tableNameOrAlias: 'u', columnName: 'age', direction: OrderByDirection.Descending },
      ]);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM `users` AS `u` ORDER BY `u`.`last_name` ASC, `u`.`age` DESC;',
    );
  });

  it('orderByRaw', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .orderByRaw("FIELD(`u`.`status`, 'active', 'pending', 'inactive')");

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      "SELECT * FROM `users` AS `u` ORDER BY FIELD(`u`.`status`, 'active', 'pending', 'inactive');",
    );
  });

  it('orderByRaws', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .orderByRaws(['`u`.`last_name` ASC', '`u`.`first_name` DESC']);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM `users` AS `u` ORDER BY `u`.`last_name` ASC, `u`.`first_name` DESC;',
    );
  });

  it('mixed orderByColumn and orderByRaw', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .orderByColumn('u', 'name', OrderByDirection.Ascending)
      .orderByRaw('RAND()');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM `users` AS `u` ORDER BY `u`.`name` ASC, RAND();');
  });
});
