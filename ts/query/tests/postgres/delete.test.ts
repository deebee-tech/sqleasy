import { describe, expect, it } from 'vitest';
import { PostgresQuery, WhereOperator } from '../../src';

describe('PostgresQuery delete', () => {
  it('delete with where condition', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder.deleteFrom('users', 'u').where('u', 'id', WhereOperator.Equals, 1);

    const sql = builder.parseRaw();
    expect(sql).toEqual('DELETE FROM "public"."users" AS "u" WHERE "u"."id" = 1;');
  });

  it('delete without alias', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder.deleteFrom('users', '').where('users', 'id', WhereOperator.Equals, 1);

    const sql = builder.parseRaw();
    expect(sql).toEqual('DELETE FROM "public"."users" WHERE "users"."id" = 1;');
  });

  it('delete with custom owner', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder.deleteFromWithOwner('sales', 'orders', 'o').where('o', 'id', WhereOperator.Equals, 100);

    const sql = builder.parseRaw();
    expect(sql).toEqual('DELETE FROM "sales"."orders" AS "o" WHERE "o"."id" = 100;');
  });

  it('delete with multiple where conditions', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder
      .deleteFrom('users', 'u')
      .where('u', 'active', WhereOperator.Equals, false)
      .and()
      .where('u', 'last_login', WhereOperator.LessThan, '2020-01-01');

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'DELETE FROM "public"."users" AS "u" WHERE "u"."active" = false AND "u"."last_login" < 2020-01-01;',
    );
  });

  it('delete without where clause', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder.deleteFrom('temp_data', 't');

    const sql = builder.parseRaw();
    expect(sql).toEqual('DELETE FROM "public"."temp_data" AS "t";');
  });

  it('delete with whereNull', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder.deleteFrom('users', 'u').whereNull('u', 'email');

    const sql = builder.parseRaw();
    expect(sql).toEqual('DELETE FROM "public"."users" AS "u" WHERE "u"."email" IS NULL;');
  });

  it('delete with whereInValues', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder.deleteFrom('users', 'u').whereInValues('u', 'id', [1, 2, 3]);

    const sql = builder.parseRaw();
    expect(sql).toEqual('DELETE FROM "public"."users" AS "u" WHERE "u"."id" IN (1, 2, 3);');
  });

  it('delete with parse() - $1 placeholder', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder.deleteFrom('users', 'u').where('u', 'id', WhereOperator.Equals, 1);

    const sql = builder.parse();
    expect(sql).toEqual('DELETE FROM "public"."users" AS "u" WHERE "u"."id" = $1;');
  });

  it('delete with multiple conditions parse() - sequential placeholders', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder
      .deleteFrom('users', 'u')
      .where('u', 'active', WhereOperator.Equals, false)
      .and()
      .where('u', 'created_at', WhereOperator.LessThan, '2020-01-01');

    const sql = builder.parse();
    expect(sql).toEqual(
      'DELETE FROM "public"."users" AS "u" WHERE "u"."active" = $1 AND "u"."created_at" < $2;',
    );
  });
});
