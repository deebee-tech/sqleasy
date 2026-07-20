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
 * `NULLS FIRST`/`NULLS LAST` on `ORDER BY`. Native on Postgres and SQLite 3.30+; MySQL and MSSQL
 * have no such syntax in any version and refuse.
 *
 * They used to synthesize it with a leading `CASE WHEN col IS NULL THEN ... END` sort key. That
 * produced the right row order, which is why it lasted — but it is an extra sort expression the
 * caller never wrote, and it is not cosmetic: an index that could have satisfied the ORDER BY no
 * longer can, so the engine sorts instead of scanning in order.
 *
 * {@link NullsOrder.None} is deliberately left alone. That is the dialect's own default placement,
 * and the dialects genuinely disagree about it — Postgres sorts NULLs last on ASC, the others
 * first. Forcing agreement would mean a `CASE WHEN` on EVERY sort term in the library, defeating
 * index-ordered scans for queries that never asked about NULLs at all.
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

  it('MySQL refuses NULLS LAST instead of synthesizing a CASE sort key', () => {
    const builder = new MysqlQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('orders', 'o')
      .orderByColumn('o', 'shipped_at', OrderByDirection.Ascending, NullsOrder.Last);

    expect(() => builder.parseRaw()).toThrow(/MySQL has no NULLS FIRST\/LAST/);
  });

  it('MSSQL refuses NULLS FIRST instead of synthesizing a CASE sort key', () => {
    const builder = new MssqlQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('orders', 'o')
      .orderByColumn('o', 'shipped_at', OrderByDirection.Descending, NullsOrder.First);

    expect(() => builder.parseRaw()).toThrow(/MSSQL has no NULLS FIRST\/LAST/);
  });

  // The synthesized sort key must not come back by any route.
  it('MySQL emits no CASE sort key anywhere once the placement is dropped', () => {
    const builder = new MysqlQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('orders', 'o')
      .orderByColumn('o', 'shipped_at', OrderByDirection.Ascending);

    const sql = builder.parseRaw();
    expect(sql).toContain('ORDER BY `o`.`shipped_at` ASC');
    expect(sql).not.toContain('CASE');
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

  // A window's OVER (ORDER BY ...) shares emitOrderByTerm with the top-level clause, so it must
  // refuse identically. Refusing in one place and synthesizing in the other would be the worst of
  // both — the same builder call meaning different things depending on where it appears.
  it('a window ORDER BY refuses the same way the top-level ORDER BY does', () => {
    const builder = new MysqlQuery().newBuilder();
    builder
      .selectWindow(
        'ROW_NUMBER()',
        (w) => w.orderByColumn('o', 'shipped_at', OrderByDirection.Ascending, NullsOrder.Last),
        'rn',
      )
      .fromTable('orders', 'o');

    expect(() => builder.parseRaw()).toThrow(/MySQL has no NULLS FIRST\/LAST/);
  });

  it('a window ORDER BY keeps native NULLS on Postgres', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectWindow(
        'ROW_NUMBER()',
        (w) => w.orderByColumn('o', 'shipped_at', OrderByDirection.Ascending, NullsOrder.Last),
        'rn',
      )
      .fromTable('orders', 'o');

    expect(builder.parseRaw()).toContain('ORDER BY "o"."shipped_at" ASC NULLS LAST');
  });
});
