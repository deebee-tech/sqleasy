import { normalizeRows, type ColumnKinds, type TemporalKind } from '../normalize';
import {
  createPool,
  type Pool,
  type PoolConnection,
  type PoolOptions,
  type ResultSetHeader,
} from 'mysql2/promise';
import { explainBody } from '../explain-body';
import type {
  DbExecutor,
  ExecutorOptions,
  ExplainEstimate,
  PreparedSql,
  QueryResult,
  Row,
} from '../index';

/** Connection settings — any `mysql2` `PoolOptions`. */
export type MysqlConfig = PoolOptions;

/** `EXPLAIN FORMAT=JSON` shape — only the bits we read. A `table` node is not always a direct child
 * of `query_block`: a JOIN nests it under `nested_loop[]`, ORDER BY under `ordering_operation`, etc. */
type MysqlTable = { access_type?: string; rows_examined_per_scan?: number };
type MysqlPlan = { query_block?: { cost_info?: { query_cost?: string } } };

/**
 * Every `table` node in the plan, however deeply it is nested.
 *
 * This walks generically instead of naming the wrappers it knows about. Enumerating them is what
 * broke it before: it recursed `nested_loop`/`ordering_operation`/`grouping_operation`/
 * `duplicates_removal` and stopped there, so a UNION — whose `query_block` holds nothing but
 * `union_result.query_specifications[]` — yielded zero tables and reported `fullScan: false` while
 * scanning both branches. Verified against real MySQL 8.4, the wrappers that can hide a table are at
 * least: union_result.query_specifications[], materialized_from_subquery, attached_subqueries[],
 * select_list_subqueries[], optimized_away_subqueries[], having_subqueries[] and
 * order_by_subqueries[]. Naming those would just move the cliff to the next node MySQL adds.
 *
 * Collection stays keyed on the `table` PROPERTY, which is the one thing that reliably marks a table
 * node. That deliberately excludes `union_result` itself: it carries `access_type: "ALL"` for the
 * temporary table it reads back, which is not a base-table scan and must not be reported as one.
 */
function tablesOf(node: unknown): MysqlTable[] {
  if (Array.isArray(node)) return node.flatMap(tablesOf);
  if (node === null || typeof node !== 'object') return [];
  return Object.entries(node).flatMap(([key, value]) =>
    // Recurse into the table too — a materialized derived table hangs its inner plan off it.
    key === 'table' && value !== null && typeof value === 'object'
      ? [value as MysqlTable, ...tablesOf(value)]
      : tablesOf(value),
  );
}

/** Full-table or full-index scan access types — portable "this will hurt" signals. */
const isFullScanAccess = (accessType: string | undefined): boolean =>
  accessType === 'ALL' || accessType === 'index';

/** Parse `EXPLAIN FORMAT=JSON` output into the normalized estimate. Exported for unit tests. */
export function parseMysqlPlan(raw: string): ExplainEstimate {
  let plan: MysqlPlan = {};
  try {
    plan = JSON.parse(raw || '{}') as MysqlPlan;
  } catch {
    // Unparseable plan — an empty estimate beats throwing.
  }
  const cost = Number(plan.query_block?.cost_info?.query_cost);
  const tables = tablesOf(plan.query_block);
  return {
    cost: Number.isFinite(cost) ? cost : undefined,
    // The driving (first) table's scanned rows.
    rows: tables[0]?.rows_examined_per_scan,
    // `ALL` = full table scan; `index` = full index scan — either hurts like a full read.
    fullScan: tables.some((t) => isFullScanAccess(t.access_type)),
    plan: (raw ?? '').slice(0, 500),
  };
}

const argsOf = (prepared: PreparedSql): unknown[] => (prepared.params ?? []) as unknown[];

/**
 * MySQL protocol column types for the temporal columns, from `mysql_com.h`. mysql2 reports these on
 * each field as `columnType`.
 *
 * `DATETIME` (12) is a wall clock with no zone — which is exactly why the harness seed uses DATETIME
 * and not TIMESTAMP. `DATE` (10) and its legacy `NEWDATE` (14) have no time component.
 *
 * ── WHY `TIMESTAMP` (7) IS 'naive' AND NOT 'instant' ──
 * MySQL genuinely stores a `TIMESTAMP` as UTC, so on paper it is an instant. In practice the instant
 * cannot survive the trip: the server converts it into the SESSION time zone and puts zone-less
 * digits on the wire, and `mysql2` then builds a `Date` by reading those digits in the READER's zone.
 * The two zones are unrelated, so the resulting `Date` points at an arbitrary instant. Measured on
 * one stored row, `TIMESTAMP '2024-04-01 10:00:00`:
 *
 *     TZ=America/New_York  ->  "2024-04-01T14:00:00Z"   <- same row,
 *     TZ=Asia/Tokyo        ->  "2024-04-01T01:00:00Z"      two different instants
 *
 * Calling that an instant would assert a point in time nobody stored — the precise failure this
 * whole module exists to prevent, and it was here for a few hours because MySQL's own documentation
 * says "stored as UTC" and the harness seed has no TIMESTAMP column to contradict it.
 *
 * 'naive' reports the digits the session actually handed over and asserts NO zone, which is exactly
 * true and (as the `dt` column above shows) independent of the reader's `TZ`. A caller who needs the
 * instant must know the session zone, which is information this layer does not have and will not
 * invent. See {@link canonicalInstant} for the case where an offset genuinely does survive.
 */
const MYSQL_TEMPORAL_TYPES: Readonly<Record<number, TemporalKind>> = {
  7: 'naive',
  10: 'date',
  12: 'naive',
  14: 'date',
};

/** The temporal kind of each column mysql2 typed. Empty when the driver reported no fields. */
const temporalKinds = (fields: unknown): ColumnKinds =>
  new Map(
    (Array.isArray(fields) ? (fields as { name?: string; columnType?: number }[]) : []).flatMap(
      (field) => {
        const kind = field.columnType == null ? undefined : MYSQL_TEMPORAL_TYPES[field.columnType];
        return kind && field.name ? [[field.name, kind] as const] : [];
      },
    ),
  );

// mysql2's query() resolves to `[rows | ResultSetHeader, fields]`. SELECT → an array of rows; a
// write → a ResultSetHeader carrying affectedRows. `fields` is the only carrier of the temporal
// kind — DATE, DATETIME and TIMESTAMP all arrive as an indistinguishable `Date`.
const toResult = <T>(result: unknown, fields?: unknown): QueryResult<T> => {
  if (Array.isArray(result)) {
    return { rows: normalizeRows(result, temporalKinds(fields)) as T[], rowCount: result.length };
  }
  return { rows: [], rowCount: (result as ResultSetHeader).affectedRows ?? 0 };
};

/**
 * Options for a MySQL executor.
 *
 * @deprecated Use the shared {@link ExecutorOptions} — this is now an alias for it. MySQL realizes
 * `statementTimeoutMs` as a per-query client timeout: on expiry `mysql2` destroys the connection,
 * which makes the server kill the running statement (MySQL has no pool-level query-timeout config).
 */
export type MysqlExecutorOptions = ExecutorOptions;

/**
 * Build a MySQL executor over an EXISTING pool — bring your own `mysql2` Pool to share one across
 * your app (or hand in a test double). {@link close} is a no-op: you own the pool's lifetime.
 * Prefer {@link createMysqlExecutor} when the engine should create and close the pool.
 *
 * **BIGINT precision is yours to configure on this path.** `mysql2` fixes its value-decoding
 * behaviour when the pool is created, so a pool handed in here was already built and this factory
 * cannot change it. Set `supportBigNumbers: true` and `bigNumberStrings: true` on your own pool, or
 * any BIGINT past 2^53-1 is decoded through a JavaScript double and comes back with different
 * digits — no error, just a wrong number. {@link createMysqlExecutor} applies both by default
 * because it owns the pool it builds.
 */
export function createMysqlExecutorFromPool(
  pool: Pool,
  opts: MysqlExecutorOptions = {},
): DbExecutor {
  const { statementTimeoutMs } = opts;
  // mysql2 has no pool-level query timeout — apply it per statement via the object form, on both the
  // pool (run/explain) and a checked-out connection (transaction).
  const query = (target: Pool | PoolConnection, sql: string, args: unknown[]) =>
    statementTimeoutMs != null
      ? target.query({ sql, timeout: statementTimeoutMs }, args)
      : target.query(sql, args);

  return {
    async run<T = Row>(prepared: PreparedSql): Promise<QueryResult<T>> {
      const [result, fields] = await query(pool, prepared.sql, argsOf(prepared));
      return toResult<T>(result, fields);
    },

    async transaction(statements: readonly PreparedSql[]): Promise<QueryResult[]> {
      // Driver-level transaction on a single pinned connection — beginTransaction/commit/rollback
      // speak the protocol correctly (no `multipleStatements`, no concatenation). Each statement
      // runs on its own; ROLLBACK on any error; release (or destroy) the connection no matter what.
      const conn = await pool.getConnection();
      let destroy = false;
      try {
        await conn.beginTransaction();
        const results: QueryResult[] = [];
        for (const s of statements) {
          const [result, fields] = await query(conn, s.sql, argsOf(s));
          results.push(toResult(result, fields));
        }
        await conn.commit();
        return results;
      } catch (err) {
        try {
          await conn.rollback();
        } catch {
          // A failed rollback often means the connection is dead — destroy instead of pooling it.
          destroy = true;
        }
        throw err;
      } finally {
        if (destroy) conn.destroy();
        else conn.release();
      }
    },

    async explain(prepared: PreparedSql): Promise<ExplainEstimate> {
      // EXPLAIN never executes the statement; FORMAT=JSON is the only form carrying a cost estimate.
      const [rows] = await query(
        pool,
        `EXPLAIN FORMAT=JSON ${explainBody(prepared.sql)}`,
        argsOf(prepared),
      );
      const raw = Array.isArray(rows) ? (rows[0] as { EXPLAIN?: string } | undefined)?.EXPLAIN : '';
      return parseMysqlPlan(raw ?? '');
    },

    async close(): Promise<void> {
      // Caller-owned pool — ending it here would take down every other user of the shared pool.
    },
  };
}

/**
 * A MySQL / MariaDB executor backed by a `mysql2` connection pool (placeholders: `?`). Accepts any
 * `{ sql, params }` — SQLEasy builders are one producer, not the only one. Pass
 * `{ statementTimeoutMs }` for a per-statement ceiling (MySQL has no pool-level knob for it).
 * {@link close} ends the pool this factory created.
 */
/**
 * Pool options that make MySQL hand back large integers without losing digits.
 *
 * `mysql2` decodes BIGINT into a JavaScript number by default, and a JS number is a double: every
 * value above 2^53-1 silently loses precision. A snowflake ID, a bigint primary key past ~9.007e15,
 * or a bigint money-in-cents column all come back subtly wrong with no error anywhere — the read
 * succeeds and the digits are simply different.
 *
 * `supportBigNumbers` makes the driver notice the case; `bigNumberStrings` makes it return those
 * values as STRINGS rather than as `BigInt`. String is the deliberate choice: it is JSON-safe,
 * it matches how the MSSQL driver now returns exact-numeric values, and a `BigInt` cannot be mixed
 * with a number in arithmetic without throwing, which would turn a silent corruption into a
 * confusing runtime error one layer further out.
 *
 * This is BREAKING for any caller doing arithmetic on a value from a BIGINT column: it now arrives
 * as a string. The alternative is continuing to return a number that is quietly wrong.
 *
 * **It applies to EVERY value in a BIGINT-typed column, not only the ones past 2^53-1.** `mysql2`
 * decides by the column's protocol type, never by the magnitude of the value in front of it, so a
 * BIGINT primary key of `1` arrives as `"1"`. The reach is wider than it looks, because MySQL types
 * several results BIGINT that nobody declared that way — measured against the harness:
 *
 *     SELECT COUNT(*) AS n FROM orders   ->   { n: "3" }        <- a string, not the number 3
 *
 * So any caller comparing a BIGINT key with `===` against a number, or reading an aggregate count
 * without coercing, is affected. That is the honest cost of the guarantee: mysql2 offers no way to
 * stringify conditionally, and picking the threshold ourselves would mean decoding through the very
 * double this exists to avoid.
 *
 * NOTE the asymmetry with {@link createMysqlExecutorFromPool}: a caller-supplied pool was built
 * before this factory ever saw it, so these defaults cannot be applied there. That path documents
 * the requirement instead of silently under-delivering it.
 */
const losslessNumericDefaults = {
  supportBigNumbers: true,
  bigNumberStrings: true,
} as const;

export function createMysqlExecutor(
  config: MysqlConfig,
  opts: MysqlExecutorOptions = {},
): DbExecutor {
  // Caller-supplied values win: someone who deliberately sets `bigNumberStrings: false` has made an
  // informed choice, and overriding it would be its own kind of dishonesty.
  const pool = createPool({ ...losslessNumericDefaults, ...config });
  const executor = createMysqlExecutorFromPool(pool, opts);
  return {
    run: (prepared) => executor.run(prepared),
    transaction: (statements) => executor.transaction(statements),
    explain: (prepared) => executor.explain(prepared),
    async close() {
      await pool.end();
    },
  };
}
