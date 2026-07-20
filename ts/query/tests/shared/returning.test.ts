import { describe, expect, it } from 'vitest';
import { MssqlQuery, MysqlQuery, PostgresQuery, SqliteQuery, WhereOperator } from '../../src';
import type { QueryBuilder } from '../../src';

describe('RETURNING / OUTPUT', () => {
  describe('INSERT', () => {
    it('Postgres/SQLite append a trailing RETURNING clause', () => {
      const pg = new PostgresQuery().newBuilder();
      pg.insertInto('users')
        .insertColumns(['name'])
        .insertValues(['Ada'])
        .returning(['id', 'name']);
      expect(pg.parseRaw()).toEqual(
        'INSERT INTO "public"."users" ("name") VALUES (Ada) RETURNING "id", "name";',
      );

      const sqlite = new SqliteQuery().newBuilder();
      sqlite.insertInto('users').insertColumns(['name']).insertValues(['Ada']).returning(['id']);
      expect(sqlite.parseRaw()).toEqual(
        'INSERT INTO "users" ("name") VALUES (Ada) RETURNING "id";',
      );
    });

    it('MSSQL emits OUTPUT INSERTED.… before VALUES', () => {
      const builder = new MssqlQuery().newBuilder();
      builder
        .insertInto('users')
        .insertColumns(['name'])
        .insertValues(['Ada'])
        .returning(['id', 'name']);

      expect(builder.parseRaw()).toEqual(
        'INSERT INTO [dbo].[users] ([name]) OUTPUT INSERTED.[id], INSERTED.[name] VALUES (Ada);',
      );
    });

    it('MySQL has no RETURNING and throws', () => {
      const builder = new MysqlQuery().newBuilder() as unknown as QueryBuilder;
      builder.insertInto('users').insertColumns(['name']).insertValues(['Ada']).returning(['id']);

      expect(() => builder.parsePrepared()).toThrow('Insert: MySQL does not support RETURNING');
    });

    it('returningRaw emits the raw expression verbatim', () => {
      const builder = new PostgresQuery().newBuilder();
      builder
        .insertInto('users')
        .insertColumns(['name'])
        .insertValues(['Ada'])
        .returningRaw('id, LOWER(name) AS name_lower');

      expect(builder.parseRaw()).toEqual(
        'INSERT INTO "public"."users" ("name") VALUES (Ada) RETURNING id, LOWER(name) AS name_lower;',
      );
    });

    it('returning with no columns throws', () => {
      const builder = new PostgresQuery().newBuilder();
      builder.insertInto('users').insertColumns(['name']).insertValues(['Ada']).returning([]);

      expect(() => builder.parsePrepared()).toThrow(
        'RETURNING/OUTPUT requires at least one column',
      );
    });
  });

  describe('UPDATE', () => {
    it('Postgres appends RETURNING after WHERE', () => {
      const builder = new PostgresQuery().newBuilder();
      builder.updateTable('users', 'u').set('active', false).returning(['id']);

      expect(builder.parseRaw()).toEqual(
        'UPDATE "public"."users" AS "u" SET "active" = false RETURNING "id";',
      );
    });

    it('MSSQL emits OUTPUT INSERTED.… after SET and before WHERE', () => {
      const builder = new MssqlQuery().newBuilder();
      builder
        .updateTable('users', 'u')
        .set('active', false)
        .where('u', 'id', WhereOperator.Equals, 1)
        .returning(['id']);

      expect(builder.parseRaw()).toContain('SET [active] = false OUTPUT INSERTED.[id] FROM');
    });
  });

  describe('DELETE', () => {
    it('Postgres appends RETURNING after WHERE', () => {
      const builder = new PostgresQuery().newBuilder();
      builder.deleteFrom('users', 'u').returning(['id']);

      expect(builder.parseRaw()).toEqual('DELETE FROM "public"."users" AS "u" RETURNING "id";');
    });

    it('MSSQL (unaliased) emits OUTPUT DELETED.… before WHERE', () => {
      const builder = new MssqlQuery().newBuilder();
      builder.deleteFrom('users', '').returning(['id']);

      expect(builder.parseRaw()).toEqual('DELETE FROM [dbo].[users] OUTPUT DELETED.[id];');
    });

    it('MSSQL (aliased) emits OUTPUT DELETED.… between the target alias and FROM', () => {
      const builder = new MssqlQuery().newBuilder();
      builder.deleteFrom('users', 'u').returning(['id']);

      expect(builder.parseRaw()).toEqual(
        'DELETE [u] OUTPUT DELETED.[id] FROM [dbo].[users] AS [u];',
      );
    });
  });

  it('RETURNING/OUTPUT is refused on a SELECT', () => {
    const builder = new PostgresQuery().newBuilder();
    builder.selectAll().fromTable('users', 'u').returning(['id']);

    expect(() => builder.parsePrepared()).toThrow(
      'RETURNING/OUTPUT requires INSERT, UPDATE, or DELETE',
    );
  });

  it('clearReturning removes a previously set clause', () => {
    const builder = new PostgresQuery().newBuilder();
    builder.insertInto('users').insertColumns(['name']).insertValues(['Ada']).returning(['id']);
    builder.clearReturning();

    expect(builder.parseRaw()).toEqual('INSERT INTO "public"."users" ("name") VALUES (Ada);');
  });
});
