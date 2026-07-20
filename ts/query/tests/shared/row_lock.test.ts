import { describe, expect, it } from 'vitest';
import {
  JoinOperator,
  JoinType,
  MssqlQuery,
  MysqlQuery,
  OrderByDirection,
  PostgresQuery,
  SqliteQuery,
} from '../../src';
import type { QueryBuilder } from '../../src';

describe('Row locks (FOR UPDATE / FOR SHARE)', () => {
  describe('forUpdate / forShare', () => {
    it('Postgres/MySQL append a trailing FOR UPDATE clause', () => {
      const pg = new PostgresQuery().newBuilder();
      pg.selectAll().fromTable('users', 'u').forUpdate();
      expect(pg.parseRaw()).toEqual('SELECT * FROM "public"."users" AS "u" FOR UPDATE;');

      const mysql = new MysqlQuery().newBuilder();
      mysql.selectAll().fromTable('users', '').forShare();
      expect(mysql.parseRaw()).toEqual('SELECT * FROM `users` FOR SHARE;');
    });

    it('forUpdateNowait/forShareNowait append NOWAIT', () => {
      const builder = new PostgresQuery().newBuilder();
      builder.selectAll().fromTable('users', 'u').forUpdateNowait();
      expect(builder.parseRaw()).toEqual(
        'SELECT * FROM "public"."users" AS "u" FOR UPDATE NOWAIT;',
      );
    });

    it('forUpdateSkipLocked/forShareSkipLocked append SKIP LOCKED', () => {
      const builder = new PostgresQuery().newBuilder();
      builder.selectAll().fromTable('users', 'u').forShareSkipLocked();
      expect(builder.parseRaw()).toEqual(
        'SELECT * FROM "public"."users" AS "u" FOR SHARE SKIP LOCKED;',
      );
    });

    it('trailing FOR UPDATE/FOR SHARE comes after ORDER BY/LIMIT', () => {
      const builder = new PostgresQuery().newBuilder();
      builder
        .selectAll()
        .fromTable('users', 'u')
        .orderByColumn('u', 'id', OrderByDirection.Ascending)
        .limit(10)
        .forUpdate();

      expect(builder.parseRaw()).toEqual(
        'SELECT * FROM "public"."users" AS "u" ORDER BY "u"."id" ASC LIMIT 10 FOR UPDATE;',
      );
    });

    it('SQLite has no row locking and throws', () => {
      const builder = new SqliteQuery().newBuilder() as unknown as QueryBuilder;
      builder.selectAll().fromTable('users', 'u').forUpdate();

      expect(() => builder.parsePrepared()).toThrow(
        'SQLite does not support row locking (FOR UPDATE/FOR SHARE)',
      );
    });

    it('MSSQL emits a WITH (UPDLOCK, ROWLOCK) table hint instead of a trailing clause', () => {
      const builder = new MssqlQuery().newBuilder();
      builder.selectAll().fromTable('users', 'u').updlock();

      expect(builder.parseRaw()).toEqual(
        'SELECT * FROM [dbo].[users] AS [u] WITH (UPDLOCK, ROWLOCK);',
      );
    });

    // These previously asserted `WITH (HOLDLOCK, ROWLOCK)`. HOLDLOCK is a SYNONYM FOR SERIALIZABLE
    // — it takes key-range locks that prevent phantom inserts, which FOR SHARE does not do — so
    // emitting it silently escalated the caller's isolation level. T-SQL's hint taxonomy has no
    // shared-mode counterpart to UPDLOCK at all.
    it('MSSQL refuses forShare rather than escalating to SERIALIZABLE', () => {
      const builder = new MssqlQuery().newBuilder() as unknown as QueryBuilder;
      builder.selectAll().fromTable('users', 'u').forShare();

      expect(() => builder.parseRaw()).toThrow(/MSSQL has no shared row lock/);
    });

    it('MSSQL refuses forShareSkipLocked for the same reason', () => {
      const builder = new MssqlQuery().newBuilder() as unknown as QueryBuilder;
      builder.selectAll().fromTable('users', 'u').forShareSkipLocked();

      expect(() => builder.parseRaw()).toThrow(/HOLDLOCK is a SERIALIZABLE isolation hint/);
    });

    // updlock() is MSSQL's spelling: UPDLOCK, ROWLOCK is Microsoft's own documented idiom for it.
    it('MSSQL updlock() emits WITH (UPDLOCK, ROWLOCK)', () => {
      const builder = new MssqlQuery().newBuilder();
      builder.selectAll().fromTable('users', 'u').updlock();

      expect(builder.parseRaw()).toContain('WITH (UPDLOCK, ROWLOCK)');
    });

    // This test previously asserted that ONLY the FROM table carried a hint — its name even said
    // "even alongside a JOIN", which reads as deliberate. It was pinning a data-integrity bug:
    // a T-SQL locking hint binds to a single table reference, so the joined table was read at plain
    // READ COMMITTED while the caller believed the whole result was locked.
    it('MSSQL applies the hint to every table reference, including joined ones', () => {
      const builder = new MssqlQuery().newBuilder();
      builder
        .selectAll()
        .fromTable('users', 'u')
        .joinTable(JoinType.Inner, 'orders', 'o', (j) => {
          j.on('u', 'id', JoinOperator.Equals, 'o', 'user_id');
        })
        .updlock();

      expect(builder.parseRaw()).toEqual(
        'SELECT * FROM [dbo].[users] AS [u] WITH (UPDLOCK, ROWLOCK) ' +
          'INNER JOIN [dbo].[orders] AS [o] WITH (UPDLOCK, ROWLOCK) ON [u].[id] = [o].[user_id];',
      );
    });
  });

  it('FOR UPDATE/FOR SHARE is refused outside a SELECT', () => {
    const builder = new PostgresQuery().newBuilder();
    builder.insertInto('users').insertColumns(['name']).insertValues(['Ada']);
    builder.forUpdate();

    expect(() => builder.parsePrepared()).toThrow('FOR UPDATE/FOR SHARE requires a SELECT query');
  });

  it('clearRowLock removes a previously configured lock', () => {
    const builder = new PostgresQuery().newBuilder();
    builder.selectAll().fromTable('users', 'u').forUpdate();
    builder.clearRowLock();

    expect(builder.parseRaw()).toEqual('SELECT * FROM "public"."users" AS "u";');
  });
});
