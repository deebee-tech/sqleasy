import { describe, expect, it } from 'vitest';
import { SqliteQuery, WhereOperator } from '../../src';

describe('SqliteQuery delete', () => {
  it('delete from table', () => {
    const query = new SqliteQuery();
    const builder = query.newBuilder();
    builder.deleteFrom('users', 'u').where('u', 'id', WhereOperator.Equals, 1);

    const sql = builder.parseRaw();
    expect(sql).toEqual('DELETE FROM "users" AS "u" WHERE "u"."id" = 1;');
  });

  it('delete from table - parse prepared', () => {
    const query = new SqliteQuery();
    const builder = query.newBuilder();
    builder.deleteFrom('users', 'u').where('u', 'id', WhereOperator.Equals, 1);

    const sql = builder.parse();
    expect(sql).toEqual('DELETE FROM "users" AS "u" WHERE "u"."id" = ?;');
  });

  it('delete with multiple where conditions', () => {
    const query = new SqliteQuery();
    const builder = query.newBuilder();
    builder
      .deleteFrom('users', 'u')
      .where('u', 'status', WhereOperator.Equals, 'inactive')
      .and()
      .where('u', 'age', WhereOperator.LessThan, 18);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'DELETE FROM "users" AS "u" WHERE "u"."status" = inactive AND "u"."age" < 18;',
    );
  });

  it('delete with OR condition', () => {
    const query = new SqliteQuery();
    const builder = query.newBuilder();
    builder
      .deleteFrom('sessions', 's')
      .where('s', 'expired', WhereOperator.Equals, true)
      .or()
      .where('s', 'user_id', WhereOperator.Equals, 0);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'DELETE FROM "sessions" AS "s" WHERE "s"."expired" = true OR "s"."user_id" = 0;',
    );
  });

  it('delete without alias', () => {
    const query = new SqliteQuery();
    const builder = query.newBuilder();
    builder
      .deleteFrom('temp_data', '')
      .where('temp_data', 'created_at', WhereOperator.LessThan, '2024-01-01');

    const sql = builder.parseRaw();
    expect(sql).toEqual('DELETE FROM "temp_data" WHERE "temp_data"."created_at" < 2024-01-01;');
  });

  it('delete with where null', () => {
    const query = new SqliteQuery();
    const builder = query.newBuilder();
    builder.deleteFrom('users', 'u').whereNull('u', 'email');

    const sql = builder.parseRaw();
    expect(sql).toEqual('DELETE FROM "users" AS "u" WHERE "u"."email" IS NULL;');
  });

  it('delete with where in values', () => {
    const query = new SqliteQuery();
    const builder = query.newBuilder();
    builder.deleteFrom('users', 'u').whereInValues('u', 'id', [1, 2, 3]);

    const sql = builder.parseRaw();
    expect(sql).toEqual('DELETE FROM "users" AS "u" WHERE "u"."id" IN (1, 2, 3);');
  });

  it('delete with where in values - parse prepared', () => {
    const query = new SqliteQuery();
    const builder = query.newBuilder();
    builder.deleteFrom('users', 'u').whereInValues('u', 'id', [1, 2, 3]);

    const sql = builder.parse();
    expect(sql).toEqual('DELETE FROM "users" AS "u" WHERE "u"."id" IN (?, ?, ?);');
  });

  it('delete without owner prefix', () => {
    const query = new SqliteQuery();
    const builder = query.newBuilder();
    builder.deleteFrom('users', 'u').where('u', 'id', WhereOperator.Equals, 1);

    const sql = builder.parseRaw();
    expect(sql).not.toContain('"".');
  });

  it('delete with explicit owner', () => {
    const query = new SqliteQuery();
    const builder = query.newBuilder();
    builder.deleteFromWithOwner('main', 'users', 'u').where('u', 'id', WhereOperator.Equals, 1);

    const sql = builder.parseRaw();
    expect(sql).toEqual('DELETE FROM "main"."users" AS "u" WHERE "u"."id" = 1;');
  });

  it('delete with where between', () => {
    const query = new SqliteQuery();
    const builder = query.newBuilder();
    builder.deleteFrom('logs', 'l').whereBetween('l', 'id', 100, 200);

    const sql = builder.parseRaw();
    expect(sql).toEqual('DELETE FROM "logs" AS "l" WHERE "l"."id" BETWEEN 100 AND 200;');
  });
});
