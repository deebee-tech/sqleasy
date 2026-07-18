import { describe, expect, it } from 'vitest';
import { MssqlQuery, MysqlQuery, PostgresQuery, SqliteQuery } from '../../src';

/**
 * `WITH name (col1, col2) AS (...)` — an explicit CTE column list. Standard SQL, rendered
 * identically across all four dialects (only the `RECURSIVE` keyword itself differs on MSSQL).
 */
describe('CTE column lists', () => {
  it('omits the column list when none is given (unchanged behaviour)', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .cte('recent', (sub) => sub.selectAll().fromTable('orders', 'o'))
      .selectAll()
      .fromTable('recent', 'r');

    expect(builder.parseRaw()).toContain('WITH "recent" AS (');
  });

  it('renders an explicit column list on a plain CTE', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .cte(
        'recent',
        (sub) =>
          sub.selectColumn('o', 'id', '').selectColumn('o', 'total', '').fromTable('orders', 'o'),
        ['id', 'total'],
      )
      .selectAll()
      .fromTable('recent', 'r');

    expect(builder.parseRaw()).toContain('WITH "recent" ("id", "total") AS (');
  });

  it('renders an explicit column list on a recursive CTE, after the RECURSIVE keyword', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .cteRecursive('counter', (sub) => sub.selectRaw('1').fromTable('seed', 's'), ['n'])
      .selectAll()
      .fromTable('counter', 'c');

    expect(builder.parseRaw()).toContain('WITH RECURSIVE "counter" ("n") AS (');
  });

  it('keeps the column list on MSSQL even though RECURSIVE is a bare WITH there', () => {
    const builder = new MssqlQuery().newBuilder();
    builder
      .cteRecursive('counter', (sub) => sub.selectRaw('1').fromTable('seed', 's'), ['n'])
      .selectAll()
      .fromTable('counter', 'c');

    expect(builder.parseRaw()).toContain('WITH [counter] ([n]) AS (');
    expect(builder.parseRaw()).not.toContain('RECURSIVE');
  });

  it('quotes each column in the list per-dialect', () => {
    const mysql = new MysqlQuery().newBuilder();
    mysql
      .cte('recent', (sub) => sub.selectAll().fromTable('orders', 'o'), ['id', 'total'])
      .selectAll()
      .fromTable('recent', 'r');
    expect(mysql.parseRaw()).toContain('WITH `recent` (`id`, `total`) AS (');

    const sqlite = new SqliteQuery().newBuilder();
    sqlite
      .cte('recent', (sub) => sub.selectAll().fromTable('orders', 'o'), ['id', 'total'])
      .selectAll()
      .fromTable('recent', 'r');
    expect(sqlite.parseRaw()).toContain('WITH "recent" ("id", "total") AS (');
  });
});
