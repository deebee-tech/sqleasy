import type { Pool } from 'pg';
import { afterEach, describe, expect, it } from 'vitest';
import type { PreparedSql } from '../src/index';
import {
  createPostgresExecutor,
  createPostgresExecutorFromPool,
  parsePgPlan,
} from '../src/postgres';

// ─── parsePgPlan: pure, fed real EXPLAIN (FORMAT JSON) shapes the pg driver already parses ───────
describe('parsePgPlan', () => {
  it('pulls cost/rows off the top plan and flags a Seq Scan', () => {
    const rows = [
      {
        'QUERY PLAN': [{ Plan: { 'Node Type': 'Seq Scan', 'Total Cost': 25.88, 'Plan Rows': 6 } }],
      },
    ];
    const est = parsePgPlan(rows);
    expect(est.cost).toBe(25.88);
    expect(est.rows).toBe(6);
    expect(est.fullScan).toBe(true);
    expect(est.plan).toContain('Seq Scan');
  });

  it('does not flag a full scan when the plan only seeks indexes', () => {
    const rows = [
      {
        'QUERY PLAN': [
          {
            Plan: {
              'Node Type': 'Aggregate',
              'Total Cost': 30.1,
              'Plan Rows': 1,
              Plans: [{ 'Node Type': 'Index Scan', 'Total Cost': 8.3, 'Plan Rows': 2 }],
            },
          },
        ],
      },
    ];
    expect(parsePgPlan(rows).fullScan).toBe(false);
  });

  it('detects a Seq Scan nested deeper in the tree', () => {
    const rows = [
      {
        'QUERY PLAN': [
          {
            Plan: {
              'Node Type': 'Aggregate',
              Plans: [{ 'Node Type': 'Seq Scan', 'Total Cost': 12.0, 'Plan Rows': 3 }],
            },
          },
        ],
      },
    ];
    expect(parsePgPlan(rows).fullScan).toBe(true);
  });

  it('survives an empty/absent plan', () => {
    expect(parsePgPlan([]).fullScan).toBe(false);
    expect(parsePgPlan([{}]).fullScan).toBe(false);
  });
});

// ─── transaction orchestration: a recording fake pool verifies the exact driver-call sequence ────
// This is what the executor is responsible for (Postgres's own atomicity is a given). The fake
// records every query on the pool and on the checked-out client, so the sequence is asserted
// deterministically — no database required.
type Call = { sql: string; params?: unknown[] };

class FakeClient {
  released = false;
  constructor(
    private readonly log: Call[],
    private readonly failOn?: string,
  ) {}
  async query(sql: string, params?: unknown[]) {
    this.log.push({ sql, params });
    if (this.failOn && sql.includes(this.failOn)) throw new Error(`boom: ${sql}`);
    return { rows: [], rowCount: 1 };
  }
  release() {
    this.released = true;
  }
}

class FakePool {
  poolQueries: Call[] = [];
  clientQueries: Call[] = [];
  lastClient?: FakeClient;
  constructor(private readonly failOn?: string) {}
  async query(sql: string, params?: unknown[]) {
    this.poolQueries.push({ sql, params });
    return { rows: [{ ok: 1 }], rowCount: 1 };
  }
  async connect() {
    this.lastClient = new FakeClient(this.clientQueries, this.failOn);
    return this.lastClient;
  }
  async end() {}
}

const asPool = (fake: FakePool): Pool => fake as unknown as Pool;
const stmts: PreparedSql[] = [
  { sql: 'INSERT INTO t VALUES ($1);', params: [1] },
  { sql: 'UPDATE t SET a = $1;', params: [2] },
];

describe('postgres transaction orchestration', () => {
  it('run() executes one statement on the pool and maps rows/rowCount', async () => {
    const pool = new FakePool();
    const db = createPostgresExecutorFromPool(asPool(pool));
    const res = await db.run({ sql: 'SELECT 1;', params: [] });
    expect(pool.poolQueries).toEqual([{ sql: 'SELECT 1;', params: [] }]);
    expect(res).toEqual({ rows: [{ ok: 1 }], rowCount: 1 });
  });

  it('transaction() runs BEGIN, each statement on the client, then COMMIT, and releases', async () => {
    const pool = new FakePool();
    const db = createPostgresExecutorFromPool(asPool(pool));

    const results = await db.transaction(stmts);

    // Each statement runs as its OWN query on the client — never concatenated.
    expect(pool.clientQueries.map((c) => c.sql)).toEqual([
      'BEGIN',
      'INSERT INTO t VALUES ($1);',
      'UPDATE t SET a = $1;',
      'COMMIT',
    ]);
    expect(pool.clientQueries[1]!.params).toEqual([1]);
    expect(pool.lastClient!.released).toBe(true);
    expect(results).toHaveLength(2);
  });

  it('transaction() ROLLBACKs (not COMMITs) and still releases when a statement fails', async () => {
    const pool = new FakePool('UPDATE');
    const db = createPostgresExecutorFromPool(asPool(pool));

    await expect(db.transaction(stmts)).rejects.toThrow();

    const sqls = pool.clientQueries.map((c) => c.sql);
    expect(sqls).toContain('BEGIN');
    expect(sqls).toContain('ROLLBACK');
    expect(sqls).not.toContain('COMMIT');
    // The client is released even on the failure path — no leaked connection.
    expect(pool.lastClient!.released).toBe(true);
  });
});

// ─── real Postgres: runs only when DATABASE_URL is set (a CI service); skipped locally ───────────
const DATABASE_URL = process.env['DATABASE_URL'];

describe.skipIf(!DATABASE_URL)('postgres executor (real database)', () => {
  const db = createPostgresExecutor({ connectionString: DATABASE_URL });
  const setup = async () => {
    await db.run({ sql: 'DROP TABLE IF EXISTS _sqleasy_engine_it;' });
    await db.run({ sql: 'CREATE TABLE _sqleasy_engine_it (id INT PRIMARY KEY, name TEXT);' });
  };

  afterEach(async () => {
    await db.run({ sql: 'DROP TABLE IF EXISTS _sqleasy_engine_it;' }).catch(() => {});
  });

  it('binds params and commits a transaction atomically', async () => {
    await setup();
    await db.transaction([
      { sql: 'INSERT INTO _sqleasy_engine_it (id, name) VALUES ($1, $2);', params: [1, 'Ada'] },
      { sql: 'INSERT INTO _sqleasy_engine_it (id, name) VALUES ($1, $2);', params: [2, 'Grace'] },
    ]);
    const res = await db.run<{ n: number }>({
      sql: 'SELECT COUNT(*)::int AS n FROM _sqleasy_engine_it;',
    });
    expect(res.rows[0]!.n).toBe(2);
  });

  it('rolls the whole transaction back when a statement fails', async () => {
    await setup();
    await expect(
      db.transaction([
        { sql: 'INSERT INTO _sqleasy_engine_it (id, name) VALUES ($1, $2);', params: [1, 'Ada'] },
        { sql: 'INSERT INTO _sqleasy_engine_it (id, name) VALUES ($1, $2);', params: [1, 'Dup'] },
      ]),
    ).rejects.toThrow();
    const res = await db.run<{ n: number }>({
      sql: 'SELECT COUNT(*)::int AS n FROM _sqleasy_engine_it;',
    });
    expect(res.rows[0]!.n).toBe(0);
  });

  it('explain() reports a full scan on an unindexed filter', async () => {
    await setup();
    const est = await db.explain({
      sql: 'SELECT * FROM _sqleasy_engine_it WHERE name = $1;',
      params: ['Ada'],
    });
    expect(est.fullScan).toBe(true);
  });
});
