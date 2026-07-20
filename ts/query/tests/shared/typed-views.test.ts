import { describe, expect, it } from 'vitest';
import { MssqlQuery, MysqlQuery, PostgresQuery, SqliteQuery } from '../../src';
import type {
  MssqlQueryBuilder,
  MysqlQueryBuilder,
  PostgresQueryBuilder,
  SqliteQueryBuilder,
} from '../../src';

/**
 * COMPILE-TIME test. The assertions that matter here are the `@ts-expect-error` lines: `tsc --noEmit`
 * (the `typecheck` gate, which includes this file) fails if any of them stops being an error — i.e.
 * if a dialect-exclusive method ever becomes reachable on the wrong engine's view.
 *
 * This is the acceptance criterion for the whole typed surface: hit the dot on the wrong engine and
 * the method is not there. `top()` is the canonical case — MSSQL has it, the others do not.
 */
describe('per-engine typed views', () => {
  it('exposes dialect-exclusive methods only on their own view (compile-time)', () => {
    const mssql = null as unknown as MssqlQueryBuilder;
    const postgres = null as unknown as PostgresQueryBuilder;
    const mysql = null as unknown as MysqlQueryBuilder;
    const sqlite = null as unknown as SqliteQueryBuilder;

    // top() / merge() are MSSQL-only. Present on the MSSQL view:
    void (() => mssql.top(5));
    void (() => mssql.merge(() => {}));
    // and absent everywhere else:
    // @ts-expect-error top is MSSQL-only
    void (() => postgres.top(5));
    // @ts-expect-error top is MSSQL-only
    void (() => mysql.top(5));
    // @ts-expect-error top is MSSQL-only
    void (() => sqlite.top(5));
    // @ts-expect-error merge is MSSQL-only
    void (() => postgres.merge(() => {}));

    // distinctOn() is Postgres-only. Present on Postgres:
    void (() => postgres.distinctOn([{ tableNameOrAlias: 'u', columnName: 'id' }]));
    // absent on MSSQL:
    // @ts-expect-error distinctOn is Postgres-only
    void (() => mssql.distinctOn([{ tableNameOrAlias: 'u', columnName: 'id' }]));

    // Narrowing survives chaining — a shared method returns the SAME narrow view, so the exclusive
    // method is still reachable (or still absent) after it.
    void (() => mssql.selectAll().fromTable('users', 'u').top(5));
    // @ts-expect-error still MSSQL-only after chaining through shared methods
    void (() => postgres.selectAll().fromTable('users', 'u').top(5));

    expect(true).toBe(true); // the real assertions are the @ts-expect-error lines above
  });

  // One representative newly-adjudicated absence per dialect — the full set lives in
  // typed-views.ts, each grounded in a hard runtime refusal. These pin the compile-time ceiling so a
  // method can never be quietly re-added to a view it does not belong on.
  it('the wider per-dialect adjudications hold at compile time', () => {
    const mssql = null as unknown as MssqlQueryBuilder;
    const postgres = null as unknown as PostgresQueryBuilder;
    const mysql = null as unknown as MysqlQueryBuilder;
    const sqlite = null as unknown as SqliteQueryBuilder;

    // MSSQL: no shared row lock, no upsert.
    // @ts-expect-error forShare is absent on MSSQL (no shared row lock)
    void (() => mssql.forShare());
    // @ts-expect-error onConflictDoUpdate is absent on MSSQL (no upsert; MERGE is separate)
    void (() => mssql.onConflictDoUpdate([], []));
    // Engine-native rename: MSSQL spells the lock family updlock*, so forUpdate* are hidden here…
    // @ts-expect-error forUpdate is renamed to updlock on MSSQL
    void (() => mssql.forUpdate());
    // …and updlock* is what MSSQL exposes instead:
    void (() => mssql.updlock());
    void (() => mssql.updlockNowait());
    void (() => mssql.updlockSkipLocked());
    // updlock is MSSQL-only:
    // @ts-expect-error updlock is MSSQL-only
    void (() => postgres.updlock());

    // MySQL: no RETURNING, no WITH TIES, no table functions.
    // @ts-expect-error returning is absent on MySQL
    void (() => mysql.returning(['id']));
    // @ts-expect-error limitWithTies is absent on MySQL
    void (() => mysql.limitWithTies(5));
    // …but MySQL keeps its own index hints:
    void (() => mysql.hintUseIndex('u', 'idx'));
    // Engine-native rename: MySQL spells upsert insertIgnore/onDuplicateKeyUpdate, so onConflict* are
    // hidden here…
    // @ts-expect-error onConflictDoNothing is renamed to insertIgnore on MySQL
    void (() => mysql.onConflictDoNothing());
    // …and the MySQL spellings (no conflict-target parameter) are what it exposes:
    void (() => mysql.insertIgnore());
    void (() => mysql.onDuplicateKeyUpdate([{ columnName: 'n', value: 1 }]));
    void (() => mysql.onDuplicateKeyUpdateRaw('n = n + 1'));
    // and those are MySQL-only:
    // @ts-expect-error insertIgnore is MySQL-only
    void (() => postgres.insertIgnore());

    // Postgres: no MySQL index hints.
    // @ts-expect-error hintUseIndex is absent on Postgres (MySQL-only)
    void (() => postgres.hintUseIndex('u', 'idx'));
    // …but Postgres keeps its wide surface, e.g. RETURNING, row locks, and the portable onConflict*:
    void (() => postgres.returning(['id']));
    void (() => postgres.forUpdate());
    void (() => postgres.onConflictDoNothing());

    // SQLite: the narrowest — no procs, no row locks, no LATERAL/APPLY, no grouping extensions.
    // @ts-expect-error callProcedure is absent on SQLite
    void (() => sqlite.callProcedure('p'));
    // @ts-expect-error forUpdate is absent on SQLite (no row locking at all)
    void (() => sqlite.forUpdate());
    // @ts-expect-error groupByRollup is absent on SQLite
    void (() => sqlite.groupByRollup());
    // …but SQLite keeps the shared core:
    void (() => sqlite.selectAll().fromTable('users', 'u').limit(5));

    expect(true).toBe(true);
  });

  // The user-facing proof: a facade hands back the NARROW view, so the ceiling holds through the
  // real entry point, not just when a view type is written by hand.
  it('the dialect facades hand back the narrow view (compile-time)', () => {
    void (() => new MssqlQuery().newBuilder().top(5));
    void (() => new PostgresQuery().newBuilder().distinctOn([]));
    // @ts-expect-error top() is MSSQL-only — absent on the type PostgresQuery.newBuilder() returns
    void (() => new PostgresQuery().newBuilder().top(5));
    // @ts-expect-error top() is MSSQL-only — absent on MySQL's builder
    void (() => new MysqlQuery().newBuilder().top(5));
    // @ts-expect-error merge() is MSSQL-only — absent on SQLite's builder
    void (() => new SqliteQuery().newBuilder().merge(() => {}));
    // @ts-expect-error distinctOn() is Postgres-only — absent on MSSQL's builder
    void (() => new MssqlQuery().newBuilder().distinctOn([]));

    expect(true).toBe(true);
  });

  // The ceiling holds ONE LEVEL DOWN. A subquery runs on the same engine, so the `inner` builder a
  // callback receives is the SAME narrow view — a wrong-dialect method is just as absent inside the
  // callback as at the top level. Without the callback-param rewrite, `inner` would be the wide
  // QueryBuilder and top() would wrongly autocomplete inside a Postgres subquery.
  it('narrows the inner builder inside a subquery callback (compile-time)', () => {
    // Present on MSSQL, inside and out:
    void (() =>
      new MssqlQuery().newBuilder().fromWithBuilder('sub', (inner) => {
        inner.selectAll().fromTable('users', 'u').top(5);
      }));

    // Absent inside a Postgres subquery, exactly as at the top level:
    void (() =>
      new PostgresQuery().newBuilder().fromWithBuilder('sub', (inner) => {
        // @ts-expect-error top() is MSSQL-only — absent on the inner Postgres view too
        inner.top(5);
      }));

    // And absent inside a nested whereExists on SQLite:
    void (() =>
      new SqliteQuery().newBuilder().whereExists((inner) => {
        // @ts-expect-error forUpdate() is absent on SQLite — including one level down
        inner.forUpdate();
      }));

    // The ceiling also holds inside a MERGE USING (SELECT …) subquery. MERGE is MSSQL-only, so its
    // using-select builder is the MSSQL view — a Postgres-only method is absent there too.
    void (() =>
      new MssqlQuery().newBuilder().merge((m) =>
        m.usingSelect('s', (sub) => {
          // @ts-expect-error distinctOn is Postgres-only — absent on the inner MSSQL view
          sub.distinctOn([]);
        }),
      ));

    expect(true).toBe(true);
  });

  // The views are static types over the one runtime class; the object a facade returns is a real
  // QueryBuilder, so shared (and each engine's own) behaviour still runs.
  it('a shared method still runs on the concrete builder', () => {
    const sql = new MssqlQuery().newBuilder().selectAll().fromTable('users', 'u').top(5).parseRaw();
    expect(sql).toContain('TOP (5)');

    const pg = new PostgresQuery()
      .newBuilder()
      .selectAll()
      .fromTable('users', 'u')
      .distinctOn([{ tableNameOrAlias: 'u', columnName: 'id' }])
      .parseRaw();
    expect(pg).toContain('DISTINCT ON');
  });
});
