import { describe, expect, it } from 'vitest';
import { MysqlQuery, PostgresQuery, SqliteQuery } from '../../src';

// MySQL has no conflict TARGET. `ON DUPLICATE KEY UPDATE` and `INSERT IGNORE` both fire on ANY
// unique or primary key, and neither production accepts a column list.
//
// Through 10.x, naming conflict columns on MySQL was silently discarded: the caller wrote "conflict
// on email" and got "conflict on any unique key". That is not a narrower or wider version of the
// same statement — it matches a DIFFERENT set of rows, and updates rows the caller never intended
// to touch if any other unique index collides. No error, no warning.
describe('MySQL refuses a conflict target it cannot express', () => {
  const rows = (b: ReturnType<MysqlQuery['newBuilder']>) =>
    b.insertInto('users').insertColumns(['email', 'name']).insertValues(['a@b.c', 'Ada']);

  it('refuses onConflictDoUpdate with conflict columns', () => {
    const b = new MysqlQuery().newBuilder();
    rows(b).onConflictDoUpdate(['email'], [{ columnName: 'name', value: 'Ada' }]);
    expect(() => b.parseRaw()).toThrow(/MySQL has no conflict target/);
  });

  it('refuses onConflictDoNothing with conflict columns', () => {
    const b = new MysqlQuery().newBuilder();
    rows(b).onConflictDoNothing(['email']);
    expect(() => b.parseRaw()).toThrow(/MySQL has no conflict target/);
  });

  // Without a target the statement is honest: MySQL really does mean "on any unique key", and the
  // caller has not been told otherwise.
  it('accepts onConflictDoUpdate with no conflict columns', () => {
    const b = new MysqlQuery().newBuilder();
    rows(b).onConflictDoUpdate([], [{ columnName: 'name', value: 'Ada' }]);
    expect(b.parseRaw()).toContain('ON DUPLICATE KEY UPDATE');
  });

  it('accepts onConflictDoNothing with no conflict columns', () => {
    const b = new MysqlQuery().newBuilder();
    rows(b).onConflictDoNothing([]);
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
