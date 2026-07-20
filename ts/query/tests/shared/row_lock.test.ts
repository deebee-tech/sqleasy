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
      const builder = new SqliteQuery().newBuilder();
      builder.selectAll().fromTable('users', 'u').forUpdate();

      expect(() => builder.parsePrepared()).toThrow(
        'SQLite does not support row locking (FOR UPDATE/FOR SHARE)',
      );
    });

    it('MSSQL emits a WITH (UPDLOCK, ROWLOCK) table hint instead of a trailing clause', () => {
      const builder = new MssqlQuery().newBuilder();
      builder.selectAll().fromTable('users', 'u').forUpdate();

      expect(builder.parseRaw()).toEqual(
        'SELECT * FROM [dbo].[users] AS [u] WITH (UPDLOCK, ROWLOCK);',
      );
    });

    it('MSSQL forShare emits a WITH (HOLDLOCK, ROWLOCK) hint', () => {
      const builder = new MssqlQuery().newBuilder();
      builder.selectAll().fromTable('users', 'u').forShare();

      expect(builder.parseRaw()).toEqual(
        'SELECT * FROM [dbo].[users] AS [u] WITH (HOLDLOCK, ROWLOCK);',
      );
    });

    it('MSSQL forUpdateNowait adds NOWAIT to the table hint', () => {
      const builder = new MssqlQuery().newBuilder();
      builder.selectAll().fromTable('users', 'u').forUpdateNowait();

      expect(builder.parseRaw()).toEqual(
        'SELECT * FROM [dbo].[users] AS [u] WITH (UPDLOCK, ROWLOCK, NOWAIT);',
      );
    });

    it('MSSQL forShareSkipLocked adds READPAST to the table hint', () => {
      const builder = new MssqlQuery().newBuilder();
      builder.selectAll().fromTable('users', 'u').forShareSkipLocked();

      expect(builder.parseRaw()).toEqual(
        'SELECT * FROM [dbo].[users] AS [u] WITH (HOLDLOCK, ROWLOCK, READPAST);',
      );
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
        .forUpdate();

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
