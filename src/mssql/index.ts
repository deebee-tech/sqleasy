// `mssql` is CommonJS and Node's ESM loader can't see its named exports — import the default and
// destructure. (pg/mysql2/@libsql expose named exports fine.)
import mssql from 'mssql';
import type { config as MssqlDriverConfig, IResult } from 'mssql';
import { trimExplainSql } from '../explain-body';
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
 * Parse trailing `sp_executesql` value assignments (`@p0 = N'%an%', @p1 = 1`) into a name→value map.
 * Values keep their original T-SQL spelling so they can be inlined into `DECLARE … = …`.
 */
function readAssignments(sql: string, from: number): Map<string, string> {
  const map = new Map<string, string>();
  let i = from;
  while (i < sql.length) {
    while (i < sql.length && /[\s,]/.test(sql[i]!)) i++;
    const name = /^@\w+/i.exec(sql.slice(i));
    if (!name) break;
    i += name[0].length;
    while (i < sql.length && /\s/.test(sql[i]!)) i++;
    if (sql[i] !== '=') break;
    i++;
    while (i < sql.length && /\s/.test(sql[i]!)) i++;
    // N'…' / '…' string, or a bare token (number, NULL, …) up to the next comma/semicolon/end.
    if (sql[i] === 'N' && sql[i + 1] === "'") {
      const lit = readLiteral(sql, i + 2);
      if (!lit) break;
      map.set(name[0].toLowerCase(), `N'${lit.text.replace(/'/g, "''")}'`);
      i = lit.end;
      continue;
    }
    if (sql[i] === "'") {
      const lit = readLiteral(sql, i + 1);
      if (!lit) break;
      map.set(name[0].toLowerCase(), `'${lit.text.replace(/'/g, "''")}'`);
      i = lit.end;
      continue;
    }
    const token = /^[^,;]+/.exec(sql.slice(i));
    if (!token) break;
    map.set(name[0].toLowerCase(), token[0].trim());
    i += token[0].length;
  }
  return map;
}

/** Merge `DECLARE` types with `sp_executesql` assignments: `@p0 int` + `@p0 = 1` → `@p0 int = 1`. */
function declsWithDefaults(decls: string, assigns: Map<string, string>): string {
  return decls
    .split(',')
    .map((part) => {
      const trimmed = part.trim();
      const name = /^(@\w+)/i.exec(trimmed)?.[1];
      if (!name) return trimmed;
      const value = assigns.get(name.toLowerCase());
      return value ? `${trimmed} = ${value}` : trimmed;
    })
    .join(', ');
}

/**
 * Turn an `sp_executesql` batch into something SHOWPLAN can actually cost.
 *
 * `sp_executesql` wrappers (SQLEasy or hand-written) must be lifted: SHOWPLAN does NOT compile
 * dynamic SQL, so explaining the EXEC yields a plan with no cost. When the wrapper declares
 * parameters, re-DECLARE them and keep assigned values when present so selectivity reaches the
 * planner. Accepts `exec` / `EXECUTE` and `N'…'` string forms. Not a wrapped statement ⇒ returned
 * unchanged (after {@link explainBody} normalization by the caller).
 */
export function toExplainableBatch(sql: string): string {
  const m = /exec(?:ute)?\s+sp_executesql\s+N'/i.exec(sql);
  if (!m) return sql;
  const inner = readLiteral(sql, m.index + m[0].length);
  if (!inner) return sql;
  const decl = /^\s*,\s*N'/.exec(sql.slice(inner.end));
  if (!decl) return inner.text;
  const declsLit = readLiteral(sql, inner.end + decl[0].length);
  if (!declsLit) return inner.text;
  const decls = declsLit.text.trim();
  if (!decls) return inner.text;
  const assigns = readAssignments(sql, declsLit.end);
  return `DECLARE ${declsWithDefaults(decls, assigns)};\n${inner.text}`;
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

/**
 * Some SQL producers (including SQLEasy's mssql dialect) prefix `SET NOCOUNT ON;`. NOCOUNT
 * suppresses the DONE row counts that tedious reads, so `rowsAffected` came back `[]` and every
 * INSERT/UPDATE/DELETE routed through here reported `rowCount: 0` — a write that plainly
 * succeeded looked like it had touched nothing.
 *
 * Rewritten rather than stripped: forcing OFF also corrects a session that already had NOCOUNT ON,
 * whereas removing the prefix would just inherit whatever the connection was left in. The match is
 * anchored at the start of the batch, so it cannot fire on the same text inside a string literal —
 * the reason this file refuses to rewrite `?` placeholders by scanning.
 */
export const withRowCounts = (sql: string): string =>
  sql.replace(/^\s*SET\s+NOCOUNT\s+ON\s*;/i, 'SET NOCOUNT OFF;');

// Bind params (if any) as @p0..@pN. Callers passing bound values must reference @p0.. in their SQL
// (mssql has no positional `?`). No `?`→`@p` rewriting — that scan corrupts a `?` inside a string
// literal. query() re-wraps its argument in sp_executesql, which is harmless for both a plain
// statement and a pre-formed batch (verified against real SQL Server: two sp_executesql inserts in
// a transaction commit both).
type BindableRequest = { input(name: string, value: unknown): unknown };
const bindParams = <R extends BindableRequest>(request: R, params?: readonly unknown[]): R => {
  (params ?? []).forEach((value, i) => request.input(`p${i}`, value));
  return request;
};

/**
 * A SQL Server executor backed by an `mssql` connection pool. Accepts any `{ sql, params }` —
 * including self-contained `sp_executesql` batches and plain parameterized SQL using `@p0`… with
 * `params` bound via {@link Request.input}. There is no `FromPool` variant: this executor owns the
 * pool so it can rebuild it after a failed connect (mssql caches a rejected connect promise).
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

  /** Retire the current pool so a poisoned connection (e.g. SHOWPLAN stuck ON) cannot be reused. */
  const retirePool = () => {
    ready = undefined;
    const dead = pool;
    pool = makePool();
    void dead.close().catch(() => {});
  };

  return {
    async run<T = Row>(prepared: PreparedSql): Promise<QueryResult<T>> {
      await ensureReady();
      const request = bindParams(pool.request(), prepared.params);
      return toResult<T>(await request.query(withRowCounts(prepared.sql)));
    },

    async transaction(statements: readonly PreparedSql[]): Promise<QueryResult[]> {
      await ensureReady();
      const tx = new Transaction(pool);
      await tx.begin();
      try {
        const results: QueryResult[] = [];
        for (const s of statements) {
          const request = bindParams(new Request(tx), s.params);
          results.push(toResult(await request.query(withRowCounts(s.sql))));
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
      // on the SAME connection. A transaction pins one connection for both. If OFF fails, the pool
      // is retired so a SHOWPLAN-stuck connection cannot serve later run()/transaction() calls.
      const tx = new Transaction(pool);
      await tx.begin();
      let retire = false;
      try {
        await new Request(tx).batch('SET SHOWPLAN_XML ON');
        const request = bindParams(new Request(tx), prepared.params);
        // Lift sp_executesql first (batches often start with SET NOCOUNT ON; …). The lift may be a
        // short DECLARE+SELECT batch — trim only; do not reject multi-statement the way PG/MySQL do.
        const res = await request.batch(trimExplainSql(toExplainableBatch(prepared.sql)));
        const first = res.recordset?.[0] as Row | undefined;
        return parsePlanXml(String(first ? Object.values(first)[0] : ''));
      } finally {
        try {
          await new Request(tx).batch('SET SHOWPLAN_XML OFF');
        } catch {
          retire = true;
        }
        await tx.rollback().catch(() => {});
        if (retire) retirePool();
      }
    },

    async close(): Promise<void> {
      await (ready?.catch(() => {}) ?? Promise.resolve());
      await pool.close();
    },
  };
}
