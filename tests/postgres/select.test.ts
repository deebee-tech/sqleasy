import { describe, expect, it } from 'vitest';
import { PostgresQuery, WhereOperator } from '../../src';

describe('PostgresQuery select', () => {
  it('select all', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM "public"."users" AS "u";');
  });

  it('select all with where clause', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').where('u', 'active', WhereOperator.Equals, true);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" WHERE "u"."active" = true;');
  });

  it('selectColumn without alias', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder.selectColumn('u', 'id', '').fromTable('users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT "u"."id" FROM "public"."users" AS "u";');
  });

  it('selectColumn with alias', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder.selectColumn('u', 'id', 'userId').fromTable('users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT "u"."id" AS "userId" FROM "public"."users" AS "u";');
  });

  it('selectColumns multiple', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder
      .selectColumns([
        { tableNameOrAlias: 'u', columnName: 'id', columnAlias: '' },
        { tableNameOrAlias: 'u', columnName: 'name', columnAlias: 'userName' },
        { tableNameOrAlias: 'u', columnName: 'email', columnAlias: '' },
      ])
      .fromTable('users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT "u"."id", "u"."name" AS "userName", "u"."email" FROM "public"."users" AS "u";',
    );
  });

  it('selectRaw', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder.selectRaw('COUNT(*) AS total').fromTable('users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT COUNT(*) AS total FROM "public"."users" AS "u";');
  });

  it('selectRaws multiple', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder.selectRaws(['COUNT(*) AS total', 'MAX(age) AS maxAge']).fromTable('users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT COUNT(*) AS total, MAX(age) AS maxAge FROM "public"."users" AS "u";',
    );
  });

  it('selectWithBuilder subquery', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .selectWithBuilder('orderCount', (sb) => {
        sb.selectRaw('COUNT(*)')
          .fromTable('orders', 'o')
          .where('o', 'user_id', WhereOperator.Equals, 1);
      })
      .fromTable('users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT *, (SELECT COUNT(*) FROM "public"."orders" AS "o" WHERE "o"."user_id" = 1) AS "orderCount" FROM "public"."users" AS "u";',
    );
  });

  it('distinct', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder.distinct().selectColumn('u', 'name', '').fromTable('users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT DISTINCT "u"."name" FROM "public"."users" AS "u";');
  });

  it('select all with parse() prepared statement', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u');

    const sql = builder.parse();
    expect(sql).toEqual('SELECT * FROM "public"."users" AS "u";');
  });

  it('selectColumn with parse() prepared statement', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder
      .selectColumn('u', 'id', '')
      .selectColumn('u', 'name', 'userName')
      .fromTable('users', 'u');

    const sql = builder.parse();
    expect(sql).toEqual('SELECT "u"."id", "u"."name" AS "userName" FROM "public"."users" AS "u";');
  });

  it('mixed selectAll and selectColumn', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder.selectAll().selectColumn('u', 'name', 'userName').fromTable('users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT *, "u"."name" AS "userName" FROM "public"."users" AS "u";');
  });

  it('clearSelect resets select state', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder.selectColumn('u', 'id', '').clearSelect().selectAll().fromTable('users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM "public"."users" AS "u";');
  });
});
