import { describe, expect, it } from 'vitest';
import {
  MssqlQuery,
  MysqlQuery,
  OrderByDirection,
  PostgresQuery,
  SqliteQuery,
  WhereOperator,
} from '../../src';

/**
 * SQLEasy emits the query it was asked for, however unbounded. A row cap is the caller's policy, and
 * one applied behind their back is a truncation they never wrote.
 *
 * Through 6.x a `maxRowsReturned` cap defaulted to 1000 and fired on an "unbounded outer query" — but
 * only ever coherently on MSSQL. `SELECT * FROM users` collected a `TOP (1000)` there while the same
 * query on Postgres returned every row; add an `.offset()` and Postgres/MySQL/SQLite suddenly capped
 * at `LIMIT 1000` too. The knob was removed in 7.0.0 rather than made consistent.
 *
 * These cases are cross-dialect on purpose: the old cap lived in two places that disagreed, so a
 * regression is far likelier to reappear on one dialect than on all four.
 */
describe('no automatic row cap', () => {
  const dialects = [
    { name: 'postgres', build: () => new PostgresQuery().newBuilder() },
    { name: 'mysql', build: () => new MysqlQuery().newBuilder() },
    { name: 'sqlite', build: () => new SqliteQuery().newBuilder() },
    { name: 'mssql', build: () => new MssqlQuery().newBuilder() },
  ];

  for (const { name, build } of dialects) {
    it(`emits no cap on a bare unbounded select (${name})`, () => {
      const builder = build();
      builder.selectAll().fromTable('users', 'u');

      const sql = builder.parseRaw();
      expect(sql).not.toMatch(/\bTOP\b/);
      expect(sql).not.toMatch(/\bLIMIT\b/);
      expect(sql).not.toMatch(/\bFETCH\b/);
      expect(sql).not.toContain('1000');
    });

    it(`emits no cap on an unbounded select with a WHERE (${name})`, () => {
      const builder = build();
      builder.selectAll().fromTable('users', 'u').where('u', 'active', WhereOperator.Equals, 1);

      const sql = builder.parseRaw();
      expect(sql).not.toMatch(/\bTOP\b/);
      expect(sql).not.toMatch(/\bLIMIT\b/);
      expect(sql).not.toMatch(/\bFETCH\b/);
    });

    // "Skip n, return the rest." MySQL and SQLite cannot spell that without a limit in front of it,
    // so they emit their own unbounded sentinel — which caps nothing. What none of them may do is
    // quietly reinstate 1000.
    it(`caps nothing on an offset without a limit (${name})`, () => {
      const builder = build();
      builder
        .selectAll()
        .fromTable('users', 'u')
        .orderByColumn('u', 'id', OrderByDirection.Ascending)
        .offset(20);

      const sql = builder.parseRaw();
      expect(sql).toContain('OFFSET 20');
      expect(sql).not.toContain('1000');
      expect(sql).not.toMatch(/\bTOP\b/);
      expect(sql).not.toMatch(/\bFETCH\b/);
    });
  }
});
