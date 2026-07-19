import { describe, expect, it } from 'vitest';
import {
  FrameBoundType,
  FrameUnit,
  MssqlQuery,
  MysqlQuery,
  NullsOrder,
  OrderByDirection,
  PostgresQuery,
  SqliteQuery,
} from '../../src';

/**
 * Window functions (`OVER (PARTITION BY ... ORDER BY ... frame)`) are standard SQL and rendered
 * identically across all four dialects — `defaultWindow` has no dialect branching.
 */
describe('window functions', () => {
  it('renders PARTITION BY and ORDER BY', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectColumn('o', 'id', '')
      .selectWindow(
        'ROW_NUMBER()',
        (w) => w.partitionByColumn('o', 'customer_id').orderByColumn('o', 'created_at'),
        'rn',
      )
      .fromTable('orders', 'o');

    expect(builder.parseRaw()).toContain(
      'ROW_NUMBER() OVER (PARTITION BY "o"."customer_id" ORDER BY "o"."created_at") AS "rn"',
    );
  });

  it('omits the alias when none is given', () => {
    const builder = new PostgresQuery().newBuilder();
    builder.selectWindow('ROW_NUMBER()', (w) => w, '').fromTable('orders', 'o');

    expect(builder.parseRaw()).toBe('SELECT ROW_NUMBER() OVER () FROM "public"."orders" AS "o";');
  });

  it('renders a ROWS BETWEEN frame with numeric offsets', () => {
    const builder = new MysqlQuery().newBuilder();
    builder
      .selectColumn('o', 'id', '')
      .selectWindow(
        'AVG(`o`.`total`)',
        (w) =>
          w
            .orderByColumn('o', 'created_at')
            .frame(FrameUnit.Rows, FrameBoundType.Preceding, 1, FrameBoundType.Following, 1),
        'moving_avg',
      )
      .fromTable('orders', 'o');

    expect(builder.parseRaw()).toContain('ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING');
  });

  it('renders a single-bound frame as the SQL-standard shorthand (implicit AND CURRENT ROW)', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectWindow(
        'SUM("o"."total")',
        (w) => w.frame(FrameUnit.Rows, FrameBoundType.UnboundedPreceding),
        's',
      )
      .fromTable('orders', 'o');

    expect(builder.parseRaw()).toContain('ROWS UNBOUNDED PRECEDING');
    expect(builder.parseRaw()).not.toContain('BETWEEN');
  });

  it('renders a RANGE frame between two unbounded bounds', () => {
    const builder = new SqliteQuery().newBuilder();
    builder
      .selectWindow(
        'SUM("o"."total")',
        (w) =>
          w.frame(
            FrameUnit.Range,
            FrameBoundType.UnboundedPreceding,
            undefined,
            FrameBoundType.UnboundedFollowing,
          ),
        's',
      )
      .fromTable('orders', 'o');

    expect(builder.parseRaw()).toContain(
      'RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING',
    );
  });

  it('supports raw partition/order/frame fragments', () => {
    const builder = new MssqlQuery().newBuilder();
    builder
      .selectWindow(
        'RANK()',
        (w) => w.partitionByRaw('[region]').orderByRaw('[total] DESC').frameRaw('ROWS 3 PRECEDING'),
        'r',
      )
      .fromTable('orders', 'o');

    expect(builder.parseRaw()).toContain(
      'RANK() OVER (PARTITION BY [region] ORDER BY [total] DESC ROWS 3 PRECEDING) AS [r]',
    );
  });

  it('carries NULLS FIRST/LAST inside a window ORDER BY the same way the top-level ORDER BY does', () => {
    const pg = new PostgresQuery().newBuilder();
    pg.selectWindow(
      'ROW_NUMBER()',
      (w) => w.orderByColumn('o', 'shipped_at', OrderByDirection.Ascending, NullsOrder.Last),
      'rn',
    ).fromTable('orders', 'o');
    expect(pg.parseRaw()).toContain('ORDER BY "o"."shipped_at" ASC NULLS LAST');

    const mysql = new MysqlQuery().newBuilder();
    mysql
      .selectWindow(
        'ROW_NUMBER()',
        (w) => w.orderByColumn('o', 'shipped_at', OrderByDirection.Ascending, NullsOrder.Last),
        'rn',
      )
      .fromTable('orders', 'o');
    expect(mysql.parseRaw()).toContain(
      'ORDER BY CASE WHEN `o`.`shipped_at` IS NULL THEN 1 ELSE 0 END, `o`.`shipped_at` ASC',
    );
  });

  it('supports multiple PARTITION BY columns', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectWindow(
        'SUM("o"."total")',
        (w) =>
          w.partitionByColumns([
            { tableNameOrAlias: 'o', columnName: 'region' },
            { tableNameOrAlias: 'o', columnName: 'customer_id' },
          ]),
        's',
      )
      .fromTable('orders', 'o');

    expect(builder.parseRaw()).toContain('PARTITION BY "o"."region", "o"."customer_id"');
  });

  it('supports multiple window functions in the same SELECT list', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectColumn('o', 'id', '')
      .selectWindow('ROW_NUMBER()', (w) => w.orderByColumn('o', 'id'), 'rn')
      .selectWindow('RANK()', (w) => w.orderByColumn('o', 'id'), 'rk')
      .fromTable('orders', 'o');

    const sql = builder.parseRaw();
    expect(sql).toContain(
      'ROW_NUMBER() OVER (ORDER BY "o"."id") AS "rn", RANK() OVER (ORDER BY "o"."id") AS "rk"',
    );
  });
});
