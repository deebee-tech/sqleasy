// `mssql` is CommonJS and Node's ESM loader can't see its named exports — import the default and
// destructure. (pg/mysql2/@libsql expose named exports fine.)
import mssql from 'mssql';
import type { config as MssqlDriverConfig, IResult } from 'mssql';
import type { DbExecutor, ExplainEstimate, PreparedSql, QueryResult, Row } from '../index';

const { ConnectionPool, Transaction, Request } = mssql;

/** Connection settings — any `mssql` config object, or a raw connection string. */
export type MssqlConfig = MssqlDriverConfig | { connectionString: string };

/** Read the T-SQL string literal starting at `from` (just past the opening quote), honouring `''`
 * escapes. Returns the unescaped text and the index just past the closing quote. */
function readLiteral(sql: string, from: number): { text: string; end: number } | undefined {
  let out = '';
  for (let i = from; i < sql.length; i++) {
    if (sql[i] !== "'") {
      out += sql[i];
      continue;
    }
    if (sql[i + 1] === "'") {
      out += "'";
      i++;
      continue;
    }
    return { text: out, end: i + 1 };
  }
  return undefined; // unterminated — caller falls back to the raw batch
}

/**
 * Turn the mssql dialect's output into something SHOWPLAN can actually cost.
 *
 * It emits `SET NOCOUNT ON; exec sp_executesql N'<select>', N'<decls>'[, @p0 = …];`. SHOWPLAN does
 * NOT compile dynamic SQL, so explaining the EXEC yields a plan with no cost — the inner statement
 * must be lifted out. When it has parameters, that inner statement references `@p0`, undeclared
 * outside sp_executesql, so re-declare them. The assigned VALUES are dropped on purpose: a cost
 * estimate doesn't need them. Not a wrapped statement ⇒ returned unchanged.
 */
export function toExplainableBatch(sql: string): string {
  const m = /exec\s+sp_executesql\s+N'/i.exec(sql);
  if (!m) return sql;
  const inner = readLiteral(sql, m.index + m[0].length);
  if (!inner) return sql;
  const decl = /^\s*,\s*N'/.exec(sql.slice(inner.end));
  const decls = decl ? readLiteral(sql, inner.end + decl[0].length)?.text.trim() : '';
  return decls ? `DECLARE ${decls};\n${inner.text}` : inner.text;
}

/** Parse a SHOWPLAN_XML document into the normalized estimate. Exported for unit tests. */
export function parsePlanXml(xml: string): ExplainEstimate {
  // A batch holds one <StmtSimple> per statement (the injected DECLARE, SET NOCOUNT ON, the SELECT).
  // Take the most expensive — never blindly the first, which is usually a costless preamble.
  let best: { cost: number; rows?: number } | undefined;
  for (const [tag] of xml.matchAll(/<StmtSimple\b[^>]*>/g)) {
    const cost = Number(/StatementSubTreeCost="([\d.eE+-]+)"/.exec(tag)?.[1]);
    if (!Number.isFinite(cost) || (best && cost <= best.cost)) continue;
    const rows = Number(/StatementEstRows="([\d.eE+-]+)"/.exec(tag)?.[1]);
    best = { cost, rows: Number.isFinite(rows) ? rows : undefined };
  }
  return {
    cost: best?.cost,
    rows: best?.rows,
    fullScan: /PhysicalOp="(?:Table Scan|Clustered Index Scan|Index Scan)"/.test(xml),
    plan: xml.slice(0, 500),
  };
}

const toResult = <T>(result: IResult<unknown>): QueryResult<T> => ({
  rows: (result.recordset ?? []) as unknown as T[],
  rowCount: result.recordset ? result.recordset.length : (result.rowsAffected?.[0] ?? 0),
});

// The bits of an mssql Request the executor uses.
type SqlRequest = {
  input(name: string, value: unknown): unknown;
  query<T = Row>(sql: string): Promise<IResult<T>>;
  batch<T = Row>(sql: string): Promise<IResult<T>>;
};

/** SQLEasy's mssql dialect emits a self-contained `… exec sp_executesql N'…'` batch. */
const isExecuteSqlBatch = (sql: string): boolean => /\bexec\s+sp_executesql\b/i.test(sql);

/**
 * Run one prepared statement on a fresh request.
 *
 * A pre-formed `exec sp_executesql` batch (what SQLEasy's mssql dialect emits) MUST go through
 * `batch()`: `query()` re-wraps its argument in ANOTHER `sp_executesql`, which is wrong for a
 * pre-formed batch and, inside a transaction, silently drops statements. Everything else — a plain
 * statement, or one with `@pN` params to bind (the introspection reader) — goes through `query()`,
 * which returns a recordset and binds params. No `?`→`@p` rewriting: mssql has no positional `?`.
 */
const exec = <T = Row>(request: SqlRequest, prepared: PreparedSql): Promise<IResult<T>> => {
  if (isExecuteSqlBatch(prepared.sql)) return request.batch<T>(prepared.sql);
  (prepared.params ?? []).forEach((value, i) => request.input(`p${i}`, value));
  return request.query<T>(prepared.sql);
};

/**
 * A SQL Server executor backed by an `mssql` connection pool. Feed it the self-contained
 * `sp_executesql` batch a `MssqlQuery` builder emits (its `params` is always `[]`).
 */
export function createMssqlExecutor(config: MssqlConfig): DbExecutor {
  const makePool = () =>
    new ConnectionPool('connectionString' in config ? config.connectionString : config);
  let pool = makePool();

  // Single-flight connect that RECOVERS. Caching a rejected `pool.connect()` promise would brick the
  // pool forever (a DB restart / blip): every later query awaits the same settled rejection. So reset
  // the gate and rebuild the pool on failure, and the next call retries. (pg/mysql self-heal
  // per-acquire; mssql caches connect, so it alone needs this.)
  let ready: Promise<unknown> | undefined;
  const ensureReady = () =>
    (ready ??= pool.connect().catch((e: unknown) => {
      ready = undefined;
      const dead = pool;
      pool = makePool();
      void dead.close().catch(() => {});
      throw e;
    }));

  return {
    async run<T = Row>(prepared: PreparedSql): Promise<QueryResult<T>> {
      await ensureReady();
      return toResult<T>(await exec<T>(pool.request(), prepared));
    },

    async transaction(statements: readonly PreparedSql[]): Promise<QueryResult[]> {
      await ensureReady();
      const tx = new Transaction(pool);
      await tx.begin();
      try {
        const results: QueryResult[] = [];
        for (const s of statements) {
          results.push(toResult(await exec(new Request(tx), s)));
        }
        await tx.commit();
        return results;
      } catch (err) {
        await tx.rollback().catch(() => {});
        throw err;
      }
    },

    async explain(prepared: PreparedSql): Promise<ExplainEstimate> {
      await ensureReady();
      // SQL Server has no EXPLAIN. The estimated plan comes from SET SHOWPLAN_XML, which (a) must be
      // the ONLY statement in its batch and (b) is SESSION state — so the SET and the query must run
      // on the SAME connection. A transaction pins one connection for both; the finally block always
      // clears the flag and releases it, so SHOWPLAN never leaks onto a connection serving reads.
      const tx = new Transaction(pool);
      await tx.begin();
      try {
        await new Request(tx).batch('SET SHOWPLAN_XML ON');
        const res = await new Request(tx).batch(toExplainableBatch(prepared.sql));
        const first = res.recordset?.[0] as Row | undefined;
        return parsePlanXml(String(first ? Object.values(first)[0] : ''));
      } finally {
        await new Request(tx).batch('SET SHOWPLAN_XML OFF').catch(() => {});
        await tx.rollback().catch(() => {});
      }
    },

    async close(): Promise<void> {
      await (ready?.catch(() => {}) ?? Promise.resolve());
      await pool.close();
    },
  };
}
