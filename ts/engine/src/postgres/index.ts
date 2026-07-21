import { Pool, type PoolConfig } from 'pg';
import { normalizeRows, type ColumnKinds, type TemporalKind } from '../normalize';
import { explainBody } from '../explain-body';
import type {
  DbExecutor,
  ExecutorOptions,
  ExplainEstimate,
  PreparedSql,
  QueryResult,
  Row,
} from '../index';

/** Connection settings — any `pg` `PoolConfig`. Set `statement_timeout` here if you want a
 * per-connection ceiling, or pass {@link ExecutorOptions.statementTimeoutMs} to
 * {@link createPostgresExecutor}; the engine imposes none of its own. */
export type PostgresConfig = PoolConfig;

/** The root of `EXPLAIN (FORMAT JSON)`: cost/rows sit on the top plan; a sequential scan anywhere
 * in the tree (including `Parallel Seq Scan`) is the full-scan signal. */
type PgPlanNode = {
  'Node Type'?: string;
  'Total Cost'?: number;
  'Plan Rows'?: number;
  Plans?: PgPlanNode[];
};

const isSeqScanNode = (nodeType: string | undefined): boolean =>
  nodeType === 'Seq Scan' || nodeType === 'Parallel Seq Scan';

/** Parse `EXPLAIN (FORMAT JSON)` result rows into the normalized estimate. Exported for unit tests. */
export function parsePgPlan(rows: readonly unknown[]): ExplainEstimate {
  const root = (rows[0] as { 'QUERY PLAN'?: { Plan?: PgPlanNode }[] } | undefined)?.[
    'QUERY PLAN'
  ]?.[0]?.Plan;
  const seqScan = (n: PgPlanNode | undefined): boolean =>
    !!n && (isSeqScanNode(n['Node Type']) || (n.Plans ?? []).some(seqScan));
  return {
    cost: root?.['Total Cost'],
    rows: root?.['Plan Rows'],
    fullScan: seqScan(root),
    plan: JSON.stringify(root ?? {}).slice(0, 500),
  };
}

// The slice of `pg`'s result the executor reads. `pg`'s QueryResult is structurally assignable.
// `fields` carries each column's type OID, which is the ONLY place the temporal kind exists — every
// kind arrives in JavaScript as an indistinguishable `Date`.
type PgResultLike = {
  rows: unknown[];
  rowCount: number | null;
  fields?: { name: string; dataTypeID: number }[];
};

/**
 * Postgres type OIDs for the temporal columns, from `pg_type`. These are stable catalog constants,
 * not version-dependent.
 *
 * `timestamptz` (1184) is an INSTANT and must keep its designator; `timestamp` (1114) is a wall
 * clock and must not gain one; `date` (1082) has no time at all. Flattening the three into one form
 * is the bug this map exists to prevent — see the measurement in ../normalize.ts.
 */
const PG_TEMPORAL_OIDS: Readonly<Record<number, TemporalKind>> = {
  1082: 'date',
  1114: 'naive',
  1184: 'instant',
  // The ARRAY forms, carrying their ELEMENT's kind — `_date`, `_timestamp`, `_timestamptz`. Without
  // these a `timestamp[]` had no kind at all, so its Dates passed through raw and read differently
  // in every timezone: `["2024-04-01T14:00:00.000Z"]` in New_York, `["...T01:00:00.000Z"]` in Tokyo,
  // and a `date[]` landed on the WRONG DAY. The scalar bug, one level down and unfixed.
  1182: 'date',
  1115: 'naive',
  1185: 'instant',
};

/** The temporal kind of each column the driver reported one for. Empty when `fields` is absent. */
const temporalKinds = (res: PgResultLike): ColumnKinds =>
  new Map(
    (res.fields ?? []).flatMap((field) => {
      const kind = PG_TEMPORAL_OIDS[field.dataTypeID];
      return kind ? [[field.name, kind] as const] : [];
    }),
  );

const argsOf = (prepared: PreparedSql): unknown[] => (prepared.params ?? []) as unknown[];

const toResult = <T>(res: PgResultLike): QueryResult<T> => ({
  // Normalization is COLUMN-driven: only a column the driver typed as temporal is rewritten, and it
  // is rewritten into the form that column's type actually means. Exact numerics are left exactly as
  // the driver returned them: `pg` already hands back `bigint` and `numeric` as exact STRINGS, which
  // is the representation this engine deliberately standardized on — see the rationale on
  // `losslessNumericDefaults` in ../mysql/index.ts.
  rows: normalizeRows(res.rows, temporalKinds(res)) as T[],
  rowCount: res.rowCount ?? res.rows.length,
});

/**
 * Build a Postgres executor over an EXISTING pool — bring your own `pg` Pool to share one pool
 * across your app (or hand in a test double). {@link close} is a no-op: you own the pool's
 * lifetime. Prefer {@link createPostgresExecutor} when the engine should create and close the pool.
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
      // BEGIN/COMMIT actually wrap them. ROLLBACK on any error; release (or destroy) the client
      // no matter what.
      const client = await pool.connect();
      let destroy = false;
      try {
        await client.query('BEGIN');
        const results: QueryResult[] = [];
        for (const s of statements) {
          results.push(toResult(await client.query(s.sql, argsOf(s))));
        }
        await client.query('COMMIT');
        return results;
      } catch (err) {
        try {
          await client.query('ROLLBACK');
        } catch {
          // A failed ROLLBACK often means the connection is dead — do not return it to the pool.
          destroy = true;
        }
        throw err;
      } finally {
        client.release(destroy);
      }
    },

    async explain(prepared: PreparedSql): Promise<ExplainEstimate> {
      // Plain EXPLAIN never executes the statement (only EXPLAIN ANALYZE does).
      const res = await pool.query(
        `EXPLAIN (FORMAT JSON) ${explainBody(prepared.sql)}`,
        argsOf(prepared),
      );
      return parsePgPlan(res.rows);
    },

    async close(): Promise<void> {
      // Caller-owned pool — ending it here would take down every other user of the shared pool.
    },
  };
}

/**
 * A Postgres executor backed by a `pg` connection pool (placeholders: `$1`, `$2`, …). Accepts any
 * `{ sql, params }` — SQLEasy builders are one producer, not the only one. Pass
 * `{ statementTimeoutMs }` to merge a server-enforced `statement_timeout` into the pool config.
 * {@link close} ends the pool this factory created.
 */
export function createPostgresExecutor(
  config: PostgresConfig,
  opts: ExecutorOptions = {},
): DbExecutor {
  const pool = new Pool({
    ...config,
    // An explicit statementTimeoutMs wins; otherwise keep whatever the caller set in the config
    // (undefined leaves pg's default of no timeout).
    statement_timeout: opts.statementTimeoutMs ?? config.statement_timeout,
  });
  // An idle pooled client can emit 'error' asynchronously (the backend dropped the socket, a network
  // blip). With NO listener, `pg` re-emits it as an unhandled 'error' and crashes the whole process.
  // The pool discards the dead client and heals on the next acquire, so log-and-swallow is the job.
  pool.on('error', (err) => {
    // ponytail: console.error is the floor — swap for a structured logger if the app threads one in.
    console.error('[sqleasy-engine] idle postgres client error (pool will recover):', err);
  });
  const executor = createPostgresExecutorFromPool(pool);
  return {
    run: (prepared) => executor.run(prepared),
    transaction: (statements) => executor.transaction(statements),
    explain: (prepared) => executor.explain(prepared),
    async close() {
      await pool.end();
    },
  };
}
