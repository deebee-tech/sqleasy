import { describe, expect, it } from 'vitest';
import { SqliteQuery, WhereOperator } from '../../src';

describe('SqliteQuery from', () => {
  it('from single table', () => {
    const query = new SqliteQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM "users" AS "u";');
  });

  it('from single table without alias', () => {
    const query = new SqliteQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', '');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM "users";');
  });

  it('from multiple tables', () => {
    const query = new SqliteQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTables([
      { tableName: 'users', alias: 'u' },
      { tableName: 'orders', alias: 'o' },
    ]);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM "users" AS "u", "orders" AS "o";');
  });

  it('from raw', () => {
    const query = new SqliteQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromRaw('"users" AS "u"');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM "users" AS "u";');
  });

  it('from multiple raws', () => {
    const query = new SqliteQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromRaws(['"users" AS "u"', '"orders" AS "o"']);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM "users" AS "u", "orders" AS "o";');
  });

  it('from with builder (subquery)', () => {
    const query = new SqliteQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromWithBuilder('sub', (sb) => {
      sb.selectAll().fromTable('users', 'u');
    });

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM (SELECT * FROM "users" AS "u") AS "sub";');
  });

  it('from-builder subquery carries its bound values into the prepared params', () => {
    const query = new SqliteQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromWithBuilder('sub', (sb) => {
      sb.selectAll().fromTable('users', 'u').where('u', 'active', WhereOperator.NotEquals, 0);
    });

    const { sql, params } = builder.parsePrepared();
    // The subquery emits a `?` placeholder; its value MUST ride along in params. Dropping it binds
    // NULL, so e.g. a filtered bounded-count derived-table matches zero rows. Regression.
    expect(sql).toContain('<>');
    expect(params).toEqual([0]);
  });

  it('from table with empty owner (SQLite default)', () => {
    const query = new SqliteQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTableWithOwner('', 'users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM "users" AS "u";');
  });

  it('from table with explicit owner', () => {
    const query = new SqliteQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTableWithOwner('main', 'users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM "main"."users" AS "u";');
  });
});
