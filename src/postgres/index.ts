import { Pool, type PoolConfig } from 'pg';
import type { DbExecutor, ExplainEstimate, PreparedSql, QueryResult, Row } from '../index';

/** Connection settings — any `pg` `PoolConfig`. Set `statement_timeout` here if you want a
 * per-connection ceiling; the engine imposes none of its own. */
export type PostgresConfig = PoolConfig;

/** The root of `EXPLAIN (FORMAT JSON)`: cost/rows sit on the top plan; a `Seq Scan` anywhere in the
 * tree is the full-scan signal. */
type PgPlanNode = {
  'Node Type'?: string;
  'Total Cost'?: number;
  'Plan Rows'?: number;
  Plans?: PgPlanNode[];
};

/** Parse `EXPLAIN (FORMAT JSON)` result rows into the normalized estimate. Exported for unit tests. */
export function parsePgPlan(rows: readonly unknown[]): ExplainEstimate {
  const root = (rows[0] as { 'QUERY PLAN'?: { Plan?: PgPlanNode }[] } | undefined)?.[
    'QUERY PLAN'
  ]?.[0]?.Plan;
  const seqScan = (n: PgPlanNode | undefined): boolean =>
    !!n && (n['Node Type'] === 'Seq Scan' || (n.Plans ?? []).some(seqScan));
  return {
    cost: root?.['Total Cost'],
    rows: root?.['Plan Rows'],
    fullScan: seqScan(root),
    plan: JSON.stringify(root ?? {}).slice(0, 500),
  };
}

// The slice of `pg`'s result the executor reads. `pg`'s QueryResult is structurally assignable.
type PgResultLike = { rows: unknown[]; rowCount: number | null };

const argsOf = (prepared: PreparedSql): unknown[] => (prepared.params ?? []) as unknown[];

const toResult = <T>(res: PgResultLike): QueryResult<T> => ({
  rows: res.rows as T[],
  rowCount: res.rowCount ?? res.rows.length,
});

/**
 * Build a Postgres executor over an EXISTING pool — bring your own `pg` Pool to share one pool
 * across your app (or hand in a test double). {@link createPostgresExecutor} is the usual entry.
 */
export function createPostgresExecutorFromPool(pool: Pool): DbExecutor {
  return {
    async run<T = Row>(prepared: PreparedSql): Promise<QueryResult<T>> {
      return toResult<T>(await pool.query(prepared.sql, argsOf(prepared)));
    },

    async transaction(statements: readonly PreparedSql[]): Promise<QueryResult[]> {
      // Postgres's extended protocol runs exactly ONE statement per parameterized query() — so a
      // batch is NEVER concatenated into one string (its placeholders restart per statement and
      // would misbind). Each statement runs on its own, inside a single checked-out connection so
      // BEGIN/COMMIT actually wrap them. ROLLBACK on any error; release the client no matter what.
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const results: QueryResult[] = [];
        for (const s of statements) {
          results.push(toResult(await client.query(s.sql, argsOf(s))));
        }
        await client.query('COMMIT');
        return results;
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw err;
      } finally {
        client.release();
      }
    },

    async explain(prepared: PreparedSql): Promise<ExplainEstimate> {
      // Plain EXPLAIN never executes the statement (only EXPLAIN ANALYZE does).
      const res = await pool.query(`EXPLAIN (FORMAT JSON) ${prepared.sql}`, argsOf(prepared));
      return parsePgPlan(res.rows);
    },

    async close(): Promise<void> {
      await pool.end();
    },
  };
}

/**
 * A Postgres executor backed by a `pg` connection pool (placeholders: `$1`, `$2`, …). Feed it the
 * `{ sql, params }` a `PostgresQuery` builder emits.
 */
export function createPostgresExecutor(config: PostgresConfig): DbExecutor {
  return createPostgresExecutorFromPool(new Pool(config));
}
