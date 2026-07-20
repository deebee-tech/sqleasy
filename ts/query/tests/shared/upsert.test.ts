import { describe, expect, it } from 'vitest';
import { MssqlQuery, MysqlQuery, PostgresQuery, SqliteQuery } from '../../src';

describe('Upsert (INSERT conflict clause)', () => {
  describe('onConflictDoNothing', () => {
    it('Postgres/SQLite emit ON CONFLICT (...) DO NOTHING', () => {
      const pg = new PostgresQuery().newBuilder();
      pg.insertInto('users')
        .insertColumns(['email'])
        .insertValues(['ada@example.com'])
        .onConflictDoNothing(['email']);
      expect(pg.parseRaw()).toEqual(
        'INSERT INTO "public"."users" ("email") VALUES (ada@example.com) ON CONFLICT ("email") DO NOTHING;',
      );

      const sqlite = new SqliteQuery().newBuilder();
      sqlite
        .insertInto('users')
        .insertColumns(['email'])
        .insertValues(['ada@example.com'])
        .onConflictDoNothing(['email']);
      expect(sqlite.parseRaw()).toEqual(
        'INSERT INTO "users" ("email") VALUES (ada@example.com) ON CONFLICT ("email") DO NOTHING;',
      );
    });

    it('a bare ON CONFLICT DO NOTHING is allowed with no conflict columns', () => {
      const builder = new PostgresQuery().newBuilder();
      builder
        .insertInto('users')
        .insertColumns(['email'])
        .insertValues(['ada@example.com'])
        .onConflictDoNothing();

      expect(builder.parseRaw()).toEqual(
        'INSERT INTO "public"."users" ("email") VALUES (ada@example.com) ON CONFLICT DO NOTHING;',
      );
    });

    it('MySQL rewrites to an INSERT IGNORE prefix', () => {
      const builder = new MysqlQuery().newBuilder();
      builder
        .insertInto('users')
        .insertColumns(['email'])
        .insertValues(['ada@example.com'])
        .onConflictDoNothing();

      expect(builder.parseRaw()).toEqual(
        'INSERT IGNORE INTO `users` (`email`) VALUES (ada@example.com);',
      );
    });

    // This case previously passed `['email']` and asserted the same output, i.e. it pinned the
    // conflict target being silently discarded. MySQL has no conflict target at all: INSERT IGNORE
    // fires on ANY unique key, so naming a column asked for something the engine cannot express.
    it('MySQL refuses a named conflict target rather than ignoring it', () => {
      const builder = new MysqlQuery().newBuilder();
      builder
        .insertInto('users')
        .insertColumns(['email'])
        .insertValues(['ada@example.com'])
        .onConflictDoNothing(['email']);

      expect(() => builder.parseRaw()).toThrow(/MySQL has no conflict target/);
    });

    // T-SQL has no upsert primitive. This asserted a synthesized MERGE — a different statement,
    // un-hinted and therefore race-prone at READ COMMITTED, which the caller never wrote.
    it('MSSQL refuses onConflictDoNothing rather than synthesizing a MERGE', () => {
      const builder = new MssqlQuery().newBuilder();
      builder
        .insertInto('users')
        .insertColumns(['email'])
        .insertValues(['ada@example.com'])
        .onConflictDoNothing();

      expect(() => builder.parseRaw()).toThrow(/MSSQL has no upsert/);
    });
  });

  describe('onConflictDoUpdate', () => {
    it('Postgres/SQLite emit ON CONFLICT (...) DO UPDATE SET ...', () => {
      const builder = new PostgresQuery().newBuilder();
      builder
        .insertInto('users')
        .insertColumns(['email', 'name'])
        .insertValues(['ada@example.com', 'Ada'])
        .onConflictDoUpdate(['email'], [{ columnName: 'name', value: 'Ada Lovelace' }]);

      expect(builder.parseRaw()).toEqual(
        'INSERT INTO "public"."users" ("email", "name") VALUES (ada@example.com, Ada) ' +
          'ON CONFLICT ("email") DO UPDATE SET "name" = Ada Lovelace;',
      );
    });

    it('MySQL emits ON DUPLICATE KEY UPDATE, ignoring conflictColumns', () => {
      const builder = new MysqlQuery().newBuilder();
      builder
        .insertInto('users')
        .insertColumns(['email', 'name'])
        .insertValues(['ada@example.com', 'Ada'])
        .onConflictDoUpdate([], [{ columnName: 'name', value: 'Ada Lovelace' }]);

      expect(builder.parseRaw()).toEqual(
        'INSERT INTO `users` (`email`, `name`) VALUES (ada@example.com, Ada) ' +
          'ON DUPLICATE KEY UPDATE `name` = Ada Lovelace;',
      );
    });

    it('Postgres/SQLite require at least one conflict column for DO UPDATE', () => {
      const builder = new PostgresQuery().newBuilder();
      builder
        .insertInto('users')
        .insertColumns(['email'])
        .insertValues(['ada@example.com'])
        .onConflictDoUpdate([], [{ columnName: 'email', value: 'ada@example.com' }]);

      expect(() => builder.parsePrepared()).toThrow(
        'ON CONFLICT DO UPDATE requires at least one conflict column',
      );
    });

    it('onConflictDoUpdateRaw emits a raw SET list', () => {
      const builder = new PostgresQuery().newBuilder();
      builder
        .insertInto('users')
        .insertColumns(['email', 'hits'])
        .insertValues(['ada@example.com', 1])
        .onConflictDoUpdateRaw(['email'], 'hits = users.hits + 1');

      expect(builder.parseRaw()).toEqual(
        'INSERT INTO "public"."users" ("email", "hits") VALUES (ada@example.com, 1) ' +
          'ON CONFLICT ("email") DO UPDATE SET hits = users.hits + 1;',
      );
    });

    it('MSSQL refuses onConflictDoUpdate rather than synthesizing a MERGE', () => {
      const builder = new MssqlQuery().newBuilder();
      builder
        .insertInto('users')
        .insertColumns(['email', 'name'])
        .insertValues(['ada@example.com', 'Ada'])
        .onConflictDoUpdate([], [{ columnName: 'name', value: 'Ada' }]);

      expect(() => builder.parseRaw()).toThrow(/MERGE, which is a different statement/);
    });
  });

  it('upsert requires INSERT', () => {
    const builder = new PostgresQuery().newBuilder();
    builder.selectAll().fromTable('users', 'u').onConflictDoNothing();

    expect(() => builder.parsePrepared()).toThrow('Upsert (ON CONFLICT) requires INSERT');
  });

  it('clearUpsert removes a previously configured conflict clause', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .insertInto('users')
      .insertColumns(['email'])
      .insertValues(['ada@example.com'])
      .onConflictDoNothing(['email']);
    builder.clearUpsert();

    expect(builder.parseRaw()).toEqual(
      'INSERT INTO "public"."users" ("email") VALUES (ada@example.com);',
    );
  });

  it('clearInsert also clears the upsert clause', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .insertInto('users')
      .insertColumns(['email'])
      .insertValues(['ada@example.com'])
      .onConflictDoNothing(['email']);
    builder.clearInsert();

    expect(builder.state().upsertState).toBeUndefined();
  });
});
