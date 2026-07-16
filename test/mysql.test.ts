import type { Pool } from 'mysql2/promise';
import { describe, expect, it } from 'vitest';
import type { PreparedSql } from '../src/index';
import { createMysqlExecutor, createMysqlExecutorFromPool, parseMysqlPlan } from '../src/mysql';

// ─── parseMysqlPlan: pure, fed the JSON string EXPLAIN FORMAT=JSON returns ───────────────────────
describe('parseMysqlPlan', () => {
  it('reads query_cost + driving-table rows and flags an ALL scan', () => {
    const raw = JSON.stringify({
      query_block: {
        cost_info: { query_cost: '12.34' },
        table: { access_type: 'ALL', rows_examined_per_scan: 100 },
      },
    });
    const est = parseMysqlPlan(raw);
    expect(est.cost).toBe(12.34);
    expect(est.rows).toBe(100);
    expect(est.fullScan).toBe(true);
  });

  it('does not flag a scan when every table is an index access', () => {
    const raw = JSON.stringify({
      query_block: { table: { access_type: 'ref', rows_examined_per_scan: 2 } },
    });
    expect(parseMysqlPlan(raw).fullScan).toBe(false);
  });

  it('finds an ALL scan nested under a JOIN (nested_loop)', () => {
    const raw = JSON.stringify({
      query_block: {
        nested_loop: [
          { table: { access_type: 'eq_ref', rows_examined_per_scan: 1 } },
          { table: { access_type: 'ALL', rows_examined_per_scan: 500 } },
        ],
      },
    });
    expect(parseMysqlPlan(raw).fullScan).toBe(true);
  });

  // Verbatim `EXPLAIN FORMAT=JSON` structure from MySQL 8.4 (trimmed to the fields the parser
  // reads). A UNION's query_block contains NOTHING but union_result: no `table`, no `nested_loop`.
  // The walker used to stop at the wrappers it knew by name, so it found zero tables here and
  // reported a clean plan for a query scanning both branches end to end.
  const unionPlan = (accessTypes: [string, string]) =>
    JSON.stringify({
      query_block: {
        union_result: {
          table_name: '<union1,2>',
          access_type: 'ALL', // the temp table it reads back — NOT a base-table scan
          query_specifications: [
            {
              query_block: {
                cost_info: { query_cost: '20.25' },
                table: {
                  table_name: 'p1',
                  access_type: accessTypes[0],
                  rows_examined_per_scan: 200,
                },
              },
            },
            {
              query_block: {
                cost_info: { query_cost: '20.25' },
                table: {
                  table_name: 'p2',
                  access_type: accessTypes[1],
                  rows_examined_per_scan: 200,
                },
              },
            },
          ],
        },
      },
    });

  it('finds an ALL scan inside a UNION branch', () => {
    const est = parseMysqlPlan(unionPlan(['ALL', 'ALL']));
    expect(est.fullScan).toBe(true);
    expect(est.rows).toBe(200);
  });

  it('flags a UNION where only one branch scans', () => {
    expect(parseMysqlPlan(unionPlan(['const', 'ALL'])).fullScan).toBe(true);
  });

  it("does not mistake union_result's own ALL for a base-table scan", () => {
    // Both branches are const seeks. union_result still reports access_type ALL for the temporary
    // table it reads back; counting that would fail every UNION as a full scan.
    expect(parseMysqlPlan(unionPlan(['const', 'const'])).fullScan).toBe(false);
  });

  it('finds an ALL scan inside a materialized derived table', () => {
    // A derived table that cannot be merged (GROUP BY) hangs its real plan off the outer table node.
    const raw = JSON.stringify({
      query_block: {
        table: {
          table_name: 'd',
          access_type: 'ref',
          rows_examined_per_scan: 1,
          materialized_from_subquery: {
            query_block: {
              grouping_operation: {
                table: { table_name: 'p1', access_type: 'ALL', rows_examined_per_scan: 200 },
              },
            },
          },
        },
      },
    });
    expect(parseMysqlPlan(raw).fullScan).toBe(true);
  });

  it('finds an ALL scan inside an attached subquery', () => {
    const raw = JSON.stringify({
      query_block: {
        table: { table_name: 'p1', access_type: 'const', rows_examined_per_scan: 1 },
        attached_subqueries: [
          {
            query_block: {
              table: { table_name: 'p2', access_type: 'ALL', rows_examined_per_scan: 200 },
            },
          },
        ],
      },
    });
    expect(parseMysqlPlan(raw).fullScan).toBe(true);
  });

  it('finds an ALL scan inside a select-list subquery', () => {
    const raw = JSON.stringify({
      query_block: {
        table: { table_name: 'p1', access_type: 'const', rows_examined_per_scan: 1 },
        select_list_subqueries: [
          {
            query_block: {
              table: { table_name: 'p2', access_type: 'ALL', rows_examined_per_scan: 200 },
            },
          },
        ],
      },
    });
    expect(parseMysqlPlan(raw).fullScan).toBe(true);
  });

  it('returns an empty estimate for unparseable JSON instead of throwing', () => {
    const est = parseMysqlPlan('not json');
    expect(est.fullScan).toBe(false);
    expect(est.cost).toBeUndefined();
  });
});

// ─── transaction orchestration: a recording fake pool verifies the driver-call sequence ──────────
type Call = { sql: string; params?: unknown[] };

class FakeConn {
  events: string[] = [];
  queries: Call[] = [];
  released = false;
  constructor(private readonly failOn?: string) {}
  async beginTransaction() {
    this.events.push('begin');
  }
  async query(sql: string, params?: unknown[]) {
    this.queries.push({ sql, params });
    if (this.failOn && sql.includes(this.failOn)) throw new Error(`boom: ${sql}`);
    return [[], []];
  }
  async commit() {
    this.events.push('commit');
  }
  async rollback() {
    this.events.push('rollback');
  }
  release() {
    this.released = true;
  }
}

class FakePool {
  poolQueries: Call[] = [];
  lastConn?: FakeConn;
  constructor(private readonly failOn?: string) {}
  async query(sql: string, params?: unknown[]) {
    this.poolQueries.push({ sql, params });
    return [[{ ok: 1 }], []];
  }
  async getConnection() {
    this.lastConn = new FakeConn(this.failOn);
    return this.lastConn;
  }
  async end() {}
}

const asPool = (fake: FakePool): Pool => fake as unknown as Pool;
const stmts: PreparedSql[] = [
  { sql: 'INSERT INTO t VALUES (?);', params: [1] },
  { sql: 'UPDATE t SET a = ?;', params: [2] },
];

describe('mysql transaction orchestration', () => {
  it('run() executes one statement on the pool and maps a SELECT result', async () => {
    const pool = new FakePool();
    const db = createMysqlExecutorFromPool(asPool(pool));
    const res = await db.run({ sql: 'SELECT 1;', params: [] });
    expect(pool.poolQueries).toEqual([{ sql: 'SELECT 1;', params: [] }]);
    expect(res).toEqual({ rows: [{ ok: 1 }], rowCount: 1 });
  });

  it('transaction() begins, runs each statement on the connection, commits, and releases', async () => {
    const pool = new FakePool();
    const db = createMysqlExecutorFromPool(asPool(pool));

    const results = await db.transaction(stmts);

    expect(pool.lastConn!.events).toEqual(['begin', 'commit']);
    expect(pool.lastConn!.queries.map((c) => c.sql)).toEqual([
      'INSERT INTO t VALUES (?);',
      'UPDATE t SET a = ?;',
    ]);
    expect(pool.lastConn!.queries[0]!.params).toEqual([1]);
    expect(pool.lastConn!.released).toBe(true);
    expect(results).toHaveLength(2);
  });

  it('transaction() rolls back (not commits) and still releases when a statement fails', async () => {
    const pool = new FakePool('UPDATE');
    const db = createMysqlExecutorFromPool(asPool(pool));

    await expect(db.transaction(stmts)).rejects.toThrow();

    expect(pool.lastConn!.events).toContain('begin');
    expect(pool.lastConn!.events).toContain('rollback');
    expect(pool.lastConn!.events).not.toContain('commit');
    expect(pool.lastConn!.released).toBe(true);
  });
});

// ─── statementTimeoutMs: mysql has no pool-level knob, so it wraps each query in { sql, timeout } ──
describe('mysql statementTimeoutMs', () => {
  const firstQueryArg = async (opts?: { statementTimeoutMs?: number }): Promise<unknown> => {
    let firstArg: unknown;
    const pool = {
      query: async (arg: unknown) => {
        firstArg = arg;
        return [[{ ok: 1 }], []];
      },
      end: async () => {},
    } as unknown as Pool;
    await createMysqlExecutorFromPool(pool, opts).run({ sql: 'SELECT 1;', params: [] });
    return firstArg;
  };

  it('wraps the statement in { sql, timeout } when statementTimeoutMs is set', async () => {
    expect(await firstQueryArg({ statementTimeoutMs: 30_000 })).toEqual({
      sql: 'SELECT 1;',
      timeout: 30_000,
    });
  });

  it('passes plain sql (no timeout wrapper) when the option is omitted', async () => {
    expect(await firstQueryArg()).toBe('SELECT 1;');
  });
});

// ─── real MySQL: runs only when MYSQL_URL is set (a CI service); skipped locally ─────────────────
const MYSQL_URL = process.env['MYSQL_URL'];

describe.skipIf(!MYSQL_URL)('mysql executor (real database)', () => {
  const db = createMysqlExecutor({ uri: MYSQL_URL });

  it('commits a transaction atomically and rolls back on failure', async () => {
    await db.run({ sql: 'DROP TABLE IF EXISTS _sqleasy_engine_it;' });
    await db.run({ sql: 'CREATE TABLE _sqleasy_engine_it (id INT PRIMARY KEY, name TEXT);' });
    try {
      await db.transaction([
        { sql: 'INSERT INTO _sqleasy_engine_it (id, name) VALUES (?, ?);', params: [1, 'Ada'] },
        { sql: 'INSERT INTO _sqleasy_engine_it (id, name) VALUES (?, ?);', params: [2, 'Grace'] },
      ]);
      const committed = await db.run<{ n: number }>({
        sql: 'SELECT COUNT(*) AS n FROM _sqleasy_engine_it;',
      });
      expect(Number(committed.rows[0]!.n)).toBe(2);

      await expect(
        db.transaction([
          { sql: 'INSERT INTO _sqleasy_engine_it (id, name) VALUES (?, ?);', params: [3, 'Bob'] },
          { sql: 'INSERT INTO _sqleasy_engine_it (id, name) VALUES (?, ?);', params: [1, 'Dup'] },
        ]),
      ).rejects.toThrow();
      const afterRollback = await db.run<{ n: number }>({
        sql: 'SELECT COUNT(*) AS n FROM _sqleasy_engine_it;',
      });
      // Bob (id 3) must be gone — the failed transaction rolled back as a unit.
      expect(Number(afterRollback.rows[0]!.n)).toBe(2);
    } finally {
      await db.run({ sql: 'DROP TABLE IF EXISTS _sqleasy_engine_it;' }).catch(() => {});
    }
  });
});
