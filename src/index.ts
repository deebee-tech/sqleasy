/**
 * Core, driver-agnostic types for the SQLEasy engine.
 *
 * This entry point pulls in NO database driver — importing it is free. Pick a dialect executor from
 * its own subpath (`@deebeetech/sqleasy-engine/sqlite`, `/postgres`, …); each one imports only its
 * own driver, so you install and load just the drivers you use.
 */

/** A single result-set row, keyed by column name. */
export type Row = Record<string, unknown>;

/**
 * A prepared statement and its ordered bound parameters — exactly the shape SQLEasy's
 * `parsePrepared()` and `MultiBuilder.preparedStatements()` return.
 *
 * Structural on purpose: the engine accepts any `{ sql, params }`, so it never depends on the
 * builder. `params` is optional/empty for SQL that carries its own values (e.g. SQLEasy's MSSQL
 * `sp_executesql`, whose `params` is always `[]`).
 */
export type PreparedSql = {
  sql: string;
  params?: readonly unknown[];
};

/** The outcome of executing one statement. */
export type QueryResult<T = Row> = {
  rows: T[];
  /** Rows returned (SELECT) or affected (INSERT/UPDATE/DELETE). */
  rowCount: number;
};

/**
 * The planner's estimate for a statement, obtained WITHOUT executing it. `cost` is in the dialect's
 * own units and is NOT comparable across dialects — gate on `rows`/`fullScan` when you need one rule
 * for all four. Best-effort: a backend supplies only what its planner exposes (SQLite has no
 * numbers at all, only the plan shape).
 */
export type ExplainEstimate = {
  /** Planner cost in the dialect's own units. Absent when the backend reports none (SQLite). */
  cost?: number;
  /** Estimated rows the plan produces. Absent when the backend reports none (SQLite). */
  rows?: number;
  /** The plan reads a whole table instead of seeking an index — the portable "this will hurt" signal. */
  fullScan: boolean;
  /** A short raw-plan excerpt, for display and debugging. */
  plan: string;
};

/**
 * Executes prepared SQL against one database.
 *
 * Obtain one from a dialect subpath (`createSqliteExecutor`, `createPostgresExecutor`, …). Pick the
 * executor whose dialect matches the SQL you built, so placeholders and quoting line up — the engine
 * runs what it is given verbatim and does not rewrite dialects.
 */
export type DbExecutor = {
  /** Run one prepared statement and return its rows. */
  run<T = Row>(prepared: PreparedSql): Promise<QueryResult<T>>;
  /**
   * Run several prepared statements as ONE atomic transaction: commit on success, roll back on any
   * error. This is how you execute a SQLEasy `MultiBuilder` — pass `multi.preparedStatements()`.
   * Statements run in order, each as its own prepared statement (never concatenated into one string,
   * which would misbind: placeholder numbering restarts per statement), and each statement's result
   * is returned in the same order.
   */
  transaction(statements: readonly PreparedSql[]): Promise<QueryResult[]>;
  /** Ask the planner what a statement would cost WITHOUT running it. Best-effort per backend. */
  explain(prepared: PreparedSql): Promise<ExplainEstimate>;
  /** Close the underlying connection/pool. */
  close(): Promise<void>;
};
