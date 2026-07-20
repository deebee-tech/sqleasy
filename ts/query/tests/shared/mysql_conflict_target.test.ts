import { describe, expect, it } from 'vitest';
import { MysqlQuery, PostgresQuery, SqliteQuery } from '../../src';
import type { QueryBuilder } from '../../src';

// MySQL has no conflict TARGET. `ON DUPLICATE KEY UPDATE` and `INSERT IGNORE` both fire on ANY
// unique or primary key, and neither production accepts a column list.
//
// Through 10.x, naming conflict columns on MySQL was silently discarded: the caller wrote "conflict
// on email" and got "conflict on any unique key". That is not a narrower or wider version of the
// same statement — it matches a DIFFERENT set of rows, and updates rows the caller never intended
// to touch if any other unique index collides. No error, no warning.
describe('MySQL refuses a conflict target it cannot express', () => {
  const rows = (b: QueryBuilder) =>
    b.insertInto('users').insertColumns(['email', 'name']).insertValues(['a@b.c', 'Ada']);

  // The MySQL view's own spellings — insertIgnore()/onDuplicateKeyUpdate() — take NO conflict target,
  // so one cannot even be written (compile-time honesty). These two reach the generic onConflict*
  // through the wide builder to prove the RUNTIME floor still refuses a named target.
  it('refuses onConflictDoUpdate with conflict columns', () => {
    const b = new MysqlQuery().newBuilder() as unknown as QueryBuilder;
    rows(b).onConflictDoUpdate(['email'], [{ columnName: 'name', value: 'Ada' }]);
    expect(() => b.parseRaw()).toThrow(/MySQL has no conflict target/);
  });

  it('refuses onConflictDoNothing with conflict columns', () => {
    const b = new MysqlQuery().newBuilder() as unknown as QueryBuilder;
    rows(b).onConflictDoNothing(['email']);
    expect(() => b.parseRaw()).toThrow(/MySQL has no conflict target/);
  });

  // The engine-native spellings are honest by construction — no target to discard.
  it('onDuplicateKeyUpdate() emits ON DUPLICATE KEY UPDATE', () => {
    const b = new MysqlQuery().newBuilder();
    b.insertInto('users')
      .insertColumns(['email', 'name'])
      .insertValues(['a@b.c', 'Ada'])
      .onDuplicateKeyUpdate([{ columnName: 'name', value: 'Ada' }]);
    expect(b.parseRaw()).toContain('ON DUPLICATE KEY UPDATE');
  });

  it('insertIgnore() emits INSERT IGNORE', () => {
    const b = new MysqlQuery().newBuilder();
    b.insertInto('users')
      .insertColumns(['email', 'name'])
      .insertValues(['a@b.c', 'Ada'])
      .insertIgnore();
    expect(b.parseRaw()).toContain('INSERT IGNORE');
  });
});

// Postgres and SQLite have a real conflict target and keep it — the capability exists there, so
// refusing it would be the opposite error.
describe('Postgres and SQLite keep the conflict target', () => {
  it('Postgres emits ON CONFLICT (col)', () => {
    const b = new PostgresQuery().newBuilder();
    b.insertInto('users')
      .insertColumns(['email', 'name'])
      .insertValues(['a@b.c', 'Ada'])
      .onConflictDoUpdate(['email'], [{ columnName: 'name', value: 'Ada' }]);
    const sql = b.parseRaw();
    expect(sql).toContain('ON CONFLICT');
    expect(sql).toContain('"email"');
  });

  it('SQLite emits ON CONFLICT (col)', () => {
    const b = new SqliteQuery().newBuilder();
    b.insertInto('users')
      .insertColumns(['email', 'name'])
      .insertValues(['a@b.c', 'Ada'])
      .onConflictDoNothing(['email']);
    const sql = b.parseRaw();
    expect(sql).toContain('ON CONFLICT');
    expect(sql).toContain('"email"');
  });
});
