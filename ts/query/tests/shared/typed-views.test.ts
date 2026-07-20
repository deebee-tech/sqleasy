import { describe, expect, it } from 'vitest';
import { MssqlQuery, PostgresQuery } from '../../src';
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

  // The views are static types over the one runtime class; a facade hands back the narrow type but
  // the object is a real QueryBuilder, so shared behaviour still runs. (Facade return types are not
  // switched yet — that is the next step; this pins the mechanism first.)
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
