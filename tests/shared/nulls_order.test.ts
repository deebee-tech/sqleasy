import { describe, expect, it } from 'vitest';
import {
  MssqlQuery,
  MysqlQuery,
  NullsOrder,
  OrderByDirection,
  PostgresQuery,
  SqliteQuery,
} from '../../src';

/**
 * `NULLS FIRST`/`NULLS LAST` on `ORDER BY`. Native on Postgres/SQLite; emulated on MySQL/MSSQL
 * with a leading `CASE WHEN col IS NULL THEN ... END` sort key (see `emitOrderByTerm`).
 */
describe('ORDER BY NULLS FIRST/LAST', () => {
  it('Postgres renders native NULLS LAST', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('orders', 'o')
      .orderByColumn('o', 'shipped_at', OrderByDirection.Ascending, NullsOrder.Last);

    expect(builder.parseRaw()).toContain('ORDER BY "o"."shipped_at" ASC NULLS LAST');
  });

  it('SQLite renders native NULLS FIRST', () => {
    const builder = new SqliteQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('orders', 'o')
      .orderByColumn('o', 'shipped_at', OrderByDirection.Descending, NullsOrder.First);

    expect(builder.parseRaw()).toContain('ORDER BY "o"."shipped_at" DESC NULLS FIRST');
  });

  it('MySQL emulates NULLS LAST with a CASE sort key', () => {
    const builder = new MysqlQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('orders', 'o')
      .orderByColumn('o', 'shipped_at', OrderByDirection.Ascending, NullsOrder.Last);

    expect(builder.parseRaw()).toContain(
      'ORDER BY CASE WHEN `o`.`shipped_at` IS NULL THEN 1 ELSE 0 END, `o`.`shipped_at` ASC',
    );
  });

  it('MSSQL emulates NULLS FIRST with a CASE sort key', () => {
    const builder = new MssqlQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('orders', 'o')
      .orderByColumn('o', 'shipped_at', OrderByDirection.Descending, NullsOrder.First);

    expect(builder.parseRaw()).toContain(
      'ORDER BY CASE WHEN [o].[shipped_at] IS NULL THEN 0 ELSE 1 END, [o].[shipped_at] DESC',
    );
  });

  it('defaults to NullsOrder.None and changes nothing when omitted', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('orders', 'o')
      .orderByColumn('o', 'shipped_at', OrderByDirection.Ascending);

    expect(builder.parseRaw()).toContain('ORDER BY "o"."shipped_at" ASC;');
    expect(builder.parseRaw()).not.toContain('NULLS');
    expect(builder.parseRaw()).not.toContain('CASE');
  });

  it('nulls placement is independent per ORDER BY term', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('orders', 'o')
      .orderByColumn('o', 'customer_id', OrderByDirection.Ascending)
      .orderByColumn('o', 'shipped_at', OrderByDirection.Ascending, NullsOrder.Last);

    expect(builder.parseRaw()).toContain(
      'ORDER BY "o"."customer_id" ASC, "o"."shipped_at" ASC NULLS LAST',
    );
  });

  it('orderByColumns supports nulls per column too', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('orders', 'o')
      .orderByColumns([
        { tableNameOrAlias: 'o', columnName: 'customer_id', direction: OrderByDirection.Ascending },
        {
          tableNameOrAlias: 'o',
          columnName: 'shipped_at',
          direction: OrderByDirection.Ascending,
          nulls: NullsOrder.Last,
        },
      ]);

    expect(builder.parseRaw()).toContain(
      'ORDER BY "o"."customer_id" ASC, "o"."shipped_at" ASC NULLS LAST',
    );
  });

  it('a window ORDER BY sorts NULLs the same way the top-level ORDER BY does', () => {
    const builder = new MysqlQuery().newBuilder();
    builder
      .selectWindow(
        'ROW_NUMBER()',
        (w) => w.orderByColumn('o', 'shipped_at', OrderByDirection.Ascending, NullsOrder.Last),
        'rn',
      )
      .fromTable('orders', 'o');

    expect(builder.parseRaw()).toContain(
      'ORDER BY CASE WHEN `o`.`shipped_at` IS NULL THEN 1 ELSE 0 END, `o`.`shipped_at` ASC',
    );
  });
});
