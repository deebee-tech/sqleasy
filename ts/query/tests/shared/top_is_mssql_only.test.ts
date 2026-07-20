import { describe, expect, it } from 'vitest';
import { MssqlQuery, MysqlQuery, OrderByDirection, PostgresQuery, SqliteQuery } from '../../src';
import type { QueryBuilder } from '../../src';

// `TOP` is a T-SQL keyword and nothing else, so `.top(n)` is MSSQL-only. Through 10.x it was
// SILENTLY DISCARDED on the other three dialects: `toSqlOptionsFor` returned `{}` for them and the
// row cap the caller explicitly wrote vanished with no error and no emitted clause.
//
// The corpus did not catch it — it PINNED it, in a case named "top is silently ignored by the
// non-mssql dialects". That is why these assertions are hand-written: the goldens are generated from
// the implementation and are not an independent check of it.
//
// A row cap IS reachable on all four dialects. It is spelled `.limit(n)`.
describe('top() is MSSQL-only', () => {
  const others = [
    ['MySQL', () => new MysqlQuery().newBuilder()],
    ['Postgres', () => new PostgresQuery().newBuilder()],
    ['SQLite', () => new SqliteQuery().newBuilder()],
  ] as const;

  for (const [name, make] of others) {
    // A NOTE on the wrong-dialect calls below: the per-engine builder TYPE no longer exposes the
    // method being refused (that compile-time absence is proven in typed-views.test.ts). These
    // tests verify the RUNTIME floor instead — a caller who reaches the method by bypassing the
    // type (plain JS, or another language port) must still be refused — so they cast to the wide
    // QueryBuilder to reach it.
    it(`${name} refuses top() instead of discarding it`, () => {
      const b = make() as unknown as QueryBuilder;
      b.selectAll().fromTable('users', 'u').top(5);
      expect(() => b.parseRaw()).toThrow(new RegExp(`${name} has no TOP clause`));
    });

    // Presence, not positivity. `.top(0)` is still the caller asking for a TOP, and silently
    // ignoring it would be the same defect in miniature.
    it(`${name} refuses top(0) too — presence, not positivity`, () => {
      const b = make() as unknown as QueryBuilder;
      b.selectAll().fromTable('users', 'u').top(0);
      expect(() => b.parseRaw()).toThrow(/has no TOP clause/);
    });

    it(`${name} accepts limit() as the portable row cap`, () => {
      const b = make();
      b.selectAll()
        .fromTable('users', 'u')
        .orderByColumn('u', 'id', OrderByDirection.Ascending)
        .limit(5);
      expect(b.parseRaw()).toContain('LIMIT 5');
    });

    // The guard sits at the top of defaultToSql rather than in the SELECT hook, so it must fire on
    // the paths that never reach that hook.
    it(`${name} refuses top() through parsePrepared, not just parseRaw`, () => {
      const b = make() as unknown as QueryBuilder;
      b.selectAll().fromTable('users', 'u').top(5);
      expect(() => b.parsePrepared()).toThrow(/has no TOP clause/);
    });

    it(`${name} refuses top() inside a derived-table body`, () => {
      const b = make();
      b.selectAll().fromWithBuilder('sub', (inner) => {
        inner.selectAll().fromTable('users', 'u').top(5);
      });
      expect(() => b.parseRaw()).toThrow(/has no TOP clause/);
    });

    it(`${name} accepts a query once clearTop() removes the request`, () => {
      const b = make() as unknown as QueryBuilder;
      b.selectAll().fromTable('users', 'u').top(5).clearTop();
      expect(b.parseRaw()).not.toContain('TOP');
    });
  }

  it('MSSQL still emits TOP', () => {
    const b = new MssqlQuery().newBuilder();
    b.selectAll().fromTable('users', 'u').top(5);
    expect(b.parseRaw()).toEqual('SELECT TOP (5) * FROM [dbo].[users] AS [u];');
  });
});

// WITH TIES is expressible ONLY on TOP in T-SQL: `<offset_fetch>` terminates in a mandatory `ONLY`,
// and TOP admits no offset, so no production joins the two. Through 10.x MSSQL emitted
// `OFFSET 0 ROWS FETCH NEXT n ROWS WITH TIES`, which SQL Server cannot parse — the corpus pinned it
// green because it was checked against our own emitter and never against a server.
describe('MSSQL limitWithTies renders through TOP', () => {
  const ordered = () => {
    const b = new MssqlQuery().newBuilder();
    b.selectColumn('o', 'id', '')
      .fromTable('orders', 'o')
      .orderByColumn('o', 'total', OrderByDirection.Descending);
    return b;
  };

  it('emits TOP (n) WITH TIES, not OFFSET/FETCH', () => {
    const b = ordered();
    b.limitWithTies(5);
    const sql = b.parseRaw();
    expect(sql).toEqual(
      'SELECT TOP (5) WITH TIES [o].[id] FROM [dbo].[orders] AS [o] ORDER BY [o].[total] DESC;',
    );
    expect(sql).not.toContain('FETCH NEXT');
    expect(sql).not.toContain('OFFSET');
  });

  it('leaves no stray space where the trailing clause used to be', () => {
    const b = ordered();
    b.limitWithTies(5);
    expect(b.parseRaw()).not.toContain(' ;');
  });

  it('refuses WITH TIES combined with OFFSET — TOP admits no offset', () => {
    const b = ordered();
    b.limitWithTies(5).offset(10);
    expect(() => b.parseRaw()).toThrow(/cannot combine WITH TIES and OFFSET/);
  });

  // Rejected by the builder rather than the parser: `limitWithTies` delegates to `limit`, which
  // fails fast on a non-positive value. The parser keeps its own guard as defense in depth.
  it('still requires a positive limit, refused at the builder', () => {
    const b = ordered();
    expect(() => b.limitWithTies(0)).toThrow(/LIMIT must be a positive integer/);
  });

  it('still requires an ORDER BY', () => {
    const b = new MssqlQuery().newBuilder();
    b.selectAll().fromTable('orders', 'o').limitWithTies(5);
    expect(() => b.parseRaw()).toThrow(/ORDER BY is required when using WITH TIES/);
  });

  // Postgres spells the same capability differently and keeps it; MySQL and SQLite have no form of
  // it at all and refuse. Three engines, three honest answers.
  it('Postgres keeps FETCH FIRST … WITH TIES', () => {
    const b = new PostgresQuery().newBuilder();
    b.selectColumn('o', 'id', '')
      .fromTable('orders', 'o')
      .orderByColumn('o', 'total', OrderByDirection.Descending)
      .limitWithTies(5);
    expect(b.parseRaw()).toContain('FETCH FIRST 5 ROWS WITH TIES');
  });
});
