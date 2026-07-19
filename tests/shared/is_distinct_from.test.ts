import { describe, expect, it } from 'vitest';
import { MssqlQuery, MysqlQuery, PostgresQuery, SqliteQuery, WhereOperator } from '../../src';

/**
 * `IS DISTINCT FROM` / `IS NOT DISTINCT FROM` — null-safe (in)equality. Native on Postgres/SQLite;
 * MySQL rewrites via its native `<=>` null-safe equality operator; MSSQL (no native operator)
 * rewrites to plain null-safe SQL, sound because the compared value is always a bound literal whose
 * null-ness is known at build time.
 */
describe('IS DISTINCT FROM / IS NOT DISTINCT FROM', () => {
  it('Postgres renders IS DISTINCT FROM natively', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('orders', 'o')
      .where('o', 'status', WhereOperator.IsDistinctFrom, 'shipped');

    const { sql, params } = builder.parsePrepared();
    expect(sql).toContain('WHERE "o"."status" IS DISTINCT FROM $1');
    expect(params).toEqual(['shipped']);
  });

  it('Postgres renders IS NOT DISTINCT FROM natively', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('orders', 'o')
      .where('o', 'status', WhereOperator.IsNotDistinctFrom, 'shipped');

    expect(builder.parseRaw()).toContain('WHERE "o"."status" IS NOT DISTINCT FROM shipped');
  });

  it('SQLite renders both natively too', () => {
    const distinct = new SqliteQuery().newBuilder();
    distinct
      .selectAll()
      .fromTable('orders', 'o')
      .where('o', 'status', WhereOperator.IsDistinctFrom, 'shipped');
    expect(distinct.parseRaw()).toContain('IS DISTINCT FROM shipped');

    const notDistinct = new SqliteQuery().newBuilder();
    notDistinct
      .selectAll()
      .fromTable('orders', 'o')
      .where('o', 'status', WhereOperator.IsNotDistinctFrom, 'shipped');
    expect(notDistinct.parseRaw()).toContain('IS NOT DISTINCT FROM shipped');
  });

  it('MySQL rewrites IS NOT DISTINCT FROM to its native <=> operator', () => {
    const builder = new MysqlQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('orders', 'o')
      .where('o', 'status', WhereOperator.IsNotDistinctFrom, 'shipped');

    const { sql, params } = builder.parsePrepared();
    expect(sql).toContain('WHERE `o`.`status` <=> ?');
    expect(params).toEqual(['shipped']);
  });

  it('MySQL rewrites IS DISTINCT FROM to NOT (a <=> b)', () => {
    const builder = new MysqlQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('orders', 'o')
      .where('o', 'status', WhereOperator.IsDistinctFrom, 'shipped');

    expect(builder.parseRaw()).toContain('WHERE NOT (`o`.`status` <=> shipped)');
  });

  it('MSSQL rewrites a non-null value to plain null-safe SQL', () => {
    const distinct = new MssqlQuery().newBuilder();
    distinct
      .selectAll()
      .fromTable('orders', 'o')
      .where('o', 'status', WhereOperator.IsDistinctFrom, 'shipped');
    // `col IS DISTINCT FROM <lit>` ⇔ `(col <> <lit> OR col IS NULL)`.
    expect(distinct.parseRaw()).toContain('WHERE ([o].[status] <> ');
    expect(distinct.parseRaw()).toContain(' OR [o].[status] IS NULL)');

    const notDistinct = new MssqlQuery().newBuilder();
    notDistinct
      .selectAll()
      .fromTable('orders', 'o')
      .where('o', 'status', WhereOperator.IsNotDistinctFrom, 'shipped');
    // `col IS NOT DISTINCT FROM <lit>` ⇔ `col = <lit>`.
    expect(notDistinct.parseRaw()).toContain('WHERE [o].[status] = ');
    expect(notDistinct.parseRaw()).not.toContain('DISTINCT');
  });

  it('MSSQL folds a NULL value to IS [NOT] NULL', () => {
    const distinct = new MssqlQuery().newBuilder();
    distinct
      .selectAll()
      .fromTable('orders', 'o')
      .where('o', 'shipped_at', WhereOperator.IsDistinctFrom, null);
    expect(distinct.parseRaw()).toContain('WHERE [o].[shipped_at] IS NOT NULL');

    const notDistinct = new MssqlQuery().newBuilder();
    notDistinct
      .selectAll()
      .fromTable('orders', 'o')
      .where('o', 'shipped_at', WhereOperator.IsNotDistinctFrom, null);
    expect(notDistinct.parseRaw()).toContain('WHERE [o].[shipped_at] IS NULL');
  });

  it('is shared between WHERE and HAVING via the same comparison core', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectColumn('o', 'customer_id', '')
      .fromTable('orders', 'o')
      .groupByColumn('o', 'customer_id')
      .having('o', 'customer_id', WhereOperator.IsDistinctFrom, 0);

    expect(builder.parseRaw()).toContain('HAVING "o"."customer_id" IS DISTINCT FROM 0');
  });

  it('does not get the col=NULL -> IS NULL rewrite, since it is already null-safe', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('orders', 'o')
      .where('o', 'shipped_at', WhereOperator.IsNotDistinctFrom, null);

    expect(builder.parseRaw()).toContain('WHERE "o"."shipped_at" IS NOT DISTINCT FROM ');
    expect(builder.parseRaw()).not.toContain('IS NULL');
  });
});
