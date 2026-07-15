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
