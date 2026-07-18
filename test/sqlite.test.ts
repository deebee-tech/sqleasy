import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { DbExecutor } from '../src/index';
import { createSqliteExecutor } from '../src/sqlite';

/**
 * Real, in-memory libSQL — these exercise actual execution, transactions, and rollback, not mocks.
 * The transaction/rollback pair is the crux of the whole engine design: a batch commits atomically
 * or leaves nothing behind.
 */
describe('sqlite executor (libsql, in-memory)', () => {
  let db: DbExecutor;

  const fresh = async (): Promise<void> => {
    db = createSqliteExecutor({ url: ':memory:' });
    await db.run({ sql: 'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);' });
  };

  afterEach(async () => {
    await db?.close();
  });

  it('run() binds params and returns rows', async () => {
    await fresh();
    await db.run({ sql: 'INSERT INTO users (id, name) VALUES (?, ?);', params: [1, 'Ada'] });

    const res = await db.run<{ id: number; name: string }>({
      sql: 'SELECT id, name FROM users WHERE name = ?;',
      params: ['Ada'],
    });

    expect(res.rows).toEqual([{ id: 1, name: 'Ada' }]);
    expect(res.rowCount).toBe(1);
  });

  it('run() reports the affected row count for writes', async () => {
    await fresh();
    const res = await db.run({
      sql: 'INSERT INTO users (id, name) VALUES (?, ?);',
      params: [1, 'Ada'],
    });
    expect(res.rows).toEqual([]);
    expect(res.rowCount).toBe(1);
  });

  it('transaction() commits every statement atomically and returns each result in order', async () => {
    await fresh();
    const results = await db.transaction([
      { sql: 'INSERT INTO users (id, name) VALUES (?, ?);', params: [1, 'Ada'] },
      { sql: 'INSERT INTO users (id, name) VALUES (?, ?);', params: [2, 'Grace'] },
    ]);

    expect(results).toHaveLength(2);
    expect(results[0]!.rowCount).toBe(1);
    expect(results[1]!.rowCount).toBe(1);

    const count = await db.run<{ n: number }>({ sql: 'SELECT COUNT(*) AS n FROM users;' });
    expect(count.rows[0]!.n).toBe(2);
  });

  it('transaction() rolls back ALL statements when one fails (atomicity)', async () => {
    await fresh();
    await expect(
      db.transaction([
        { sql: 'INSERT INTO users (id, name) VALUES (?, ?);', params: [1, 'Ada'] },
        // Duplicate primary key — the second statement fails, so the whole batch must roll back.
        { sql: 'INSERT INTO users (id, name) VALUES (?, ?);', params: [1, 'Dup'] },
      ]),
    ).rejects.toThrow();

    const count = await db.run<{ n: number }>({ sql: 'SELECT COUNT(*) AS n FROM users;' });
    // The first insert must NOT have persisted — the transaction rolled back as a unit.
    expect(count.rows[0]!.n).toBe(0);
  });

  it('explain() returns a best-effort plan and flags a full table scan', async () => {
    await fresh();
    const est = await db.explain({ sql: 'SELECT * FROM users WHERE name = ?;', params: ['Ada'] });
    expect(typeof est.plan).toBe('string');
    // No index on `name`, so the planner reports a SCAN.
    expect(est.fullScan).toBe(true);
  });

  it('explain() reports fullScan false when an index seek is used', async () => {
    await fresh();
    await db.run({ sql: 'CREATE INDEX idx_users_name ON users(name);' });
    await db.run({ sql: 'INSERT INTO users (id, name) VALUES (?, ?);', params: [1, 'Ada'] });
    const est = await db.explain({ sql: 'SELECT * FROM users WHERE name = ?;', params: ['Ada'] });
    expect(est.fullScan).toBe(false);
  });

  it('explain() rejects multi-statement SQL', async () => {
    await fresh();
    await expect(db.explain({ sql: 'SELECT 1; SELECT 2;' })).rejects.toThrow(/single statement/);
  });

  it('runs the exact { sql, params } a SQLEasy SqliteQuery emits', async () => {
    await fresh();
    // Verbatim SqliteQuery().newBuilder() output: double-quoted identifiers, positional `?`.
    const insert = { sql: 'INSERT INTO "users" ("id", "name") VALUES (?, ?);', params: [7, 'Ada'] };
    expect((await db.run(insert)).rowCount).toBe(1);

    const res = await db.run<{ name: string }>({
      sql: 'SELECT name FROM users WHERE id = ?;',
      params: [7],
    });
    expect(res.rows[0]!.name).toBe('Ada');
  });
});

describe('sqlite busy retry (local file)', () => {
  // busy_timeout is 5s and retries add more — allow the lock wait to resolve.
  it('waits out a brief SQLITE_BUSY on a file database', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'sqleasy-engine-'));
    const file = join(dir, 'busy.db');
    const holder = createSqliteExecutor({ file });
    const contender = createSqliteExecutor({ file });
    try {
      await holder.run({ sql: 'CREATE TABLE t (id INTEGER PRIMARY KEY);' });
      // Hold an exclusive write lock, then release it so the contender's busy wait/retry succeeds.
      await holder.run({ sql: 'BEGIN IMMEDIATE;' });
      const insert = contender.run({ sql: 'INSERT INTO t (id) VALUES (1);' });
      await new Promise((r) => setTimeout(r, 100));
      await holder.run({ sql: 'COMMIT;' });
      await expect(insert).resolves.toMatchObject({ rowCount: 1 });
    } finally {
      await holder.close();
      await contender.close();
      rmSync(dir, { recursive: true, force: true });
    }
  }, 20_000);
});
