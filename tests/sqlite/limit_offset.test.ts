import { describe, expect, it } from 'vitest';
import { OrderByDirection, SqliteQuery, WhereOperator } from '../../src';

describe('SqliteQuery limit offset', () => {
  it('no default limit when no where clause and no explicit limit', () => {
    const query = new SqliteQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM "users" AS "u";');
    expect(sql).not.toContain('LIMIT');
  });

  it('no limit when where clause present and no explicit limit', () => {
    const query = new SqliteQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').where('u', 'id', WhereOperator.Equals, 1);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM "users" AS "u" WHERE "u"."id" = 1;');
    expect(sql).not.toContain('LIMIT');
  });

  it('explicit limit', () => {
    const query = new SqliteQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').limit(10);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM "users" AS "u" LIMIT 10;');
  });

  it('explicit limit with where clause', () => {
    const query = new SqliteQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'status', WhereOperator.Equals, 'active')
      .limit(25);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM "users" AS "u" WHERE "u"."status" = active LIMIT 25;');
  });

  it('offset with limit', () => {
    const query = new SqliteQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .orderByColumn('u', 'id', OrderByDirection.Ascending)
      .limit(10)
      .offset(5);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM "users" AS "u" ORDER BY "u"."id" ASC LIMIT 10  OFFSET 5;');
  });

  it('offset without explicit limit adds default limit', () => {
    const query = new SqliteQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .orderByColumn('u', 'id', OrderByDirection.Ascending)
      .offset(20);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM "users" AS "u" ORDER BY "u"."id" ASC LIMIT 1000 OFFSET 20;');
  });

  // A WHERE suppresses the LIMIT 1000 safety net, but SQLite has no standalone OFFSET — a bare
  // `OFFSET 20` is a syntax error. `LIMIT -1` is SQLite's "no upper bound" idiom, so this still
  // means "skip 20, return the rest".
  it('offset with a where clause emits a sentinel LIMIT -1 rather than a bare OFFSET', () => {
    const query = new SqliteQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'active', WhereOperator.Equals, 1)
      .orderByColumn('u', 'id', OrderByDirection.Ascending)
      .offset(20);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM "users" AS "u" WHERE "u"."active" = 1 ORDER BY "u"."id" ASC LIMIT -1 OFFSET 20;',
    );
  });

  it('limit and offset - parse prepared', () => {
    const query = new SqliteQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .orderByColumn('u', 'id', OrderByDirection.Ascending)
      .limit(10)
      .offset(5);

    const sql = builder.parse();
    expect(sql).toEqual('SELECT * FROM "users" AS "u" ORDER BY "u"."id" ASC LIMIT 10  OFFSET 5;');
  });

  it('offset requires order by', () => {
    const query = new SqliteQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').limit(10).offset(5);

    expect(() => builder.parseRaw()).toThrow();
  });

  it('pagination pattern', () => {
    const query = new SqliteQuery();
    const pageSize = 20;
    const page = 3;
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .orderByColumn('u', 'id', OrderByDirection.Ascending)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM "users" AS "u" ORDER BY "u"."id" ASC LIMIT 20  OFFSET 40;');
  });

  it('limit only without order by', () => {
    const query = new SqliteQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').limit(5);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM "users" AS "u" LIMIT 5;');
  });
});
