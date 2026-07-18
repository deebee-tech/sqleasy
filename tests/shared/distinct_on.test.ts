import { describe, expect, it } from 'vitest';
import { MssqlQuery, MysqlQuery, PostgresQuery, SqliteQuery } from '../../src';

/** `DISTINCT ON (...)` — Postgres-only; every other dialect has no equivalent and throws. */
describe('DISTINCT ON', () => {
  it('renders a single column', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .distinctOn([{ tableNameOrAlias: 'o', columnName: 'customer_id' }])
      .selectAll()
      .fromTable('orders', 'o');

    expect(builder.parseRaw()).toBe(
      'SELECT DISTINCT ON ("o"."customer_id") * FROM "public"."orders" AS "o";',
    );
  });

  it('renders multiple columns in order', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .distinctOn([
        { tableNameOrAlias: 'o', columnName: 'customer_id' },
        { tableNameOrAlias: 'o', columnName: 'region' },
      ])
      .selectAll()
      .fromTable('orders', 'o');

    expect(builder.parseRaw()).toContain('DISTINCT ON ("o"."customer_id", "o"."region")');
  });

  it('throws on MySQL, MSSQL, and SQLite', () => {
    for (const Query of [MysqlQuery, MssqlQuery, SqliteQuery]) {
      const builder = new Query().newBuilder();
      builder
        .distinctOn([{ tableNameOrAlias: 'o', columnName: 'customer_id' }])
        .selectAll()
        .fromTable('orders', 'o');

      expect(() => builder.parseRaw()).toThrow('DISTINCT ON is only supported on Postgres');
    }
  });

  it('throws when combined with distinct()', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .distinct()
      .distinctOn([{ tableNameOrAlias: 'o', columnName: 'customer_id' }])
      .selectAll()
      .fromTable('orders', 'o');

    expect(() => builder.parseRaw()).toThrow('Cannot combine distinct() with distinctOn()');
  });

  it('clearDistinctOn removes it and clearSelect resets it too', () => {
    const withCleared = new PostgresQuery().newBuilder();
    withCleared
      .distinctOn([{ tableNameOrAlias: 'o', columnName: 'customer_id' }])
      .clearDistinctOn()
      .selectAll()
      .fromTable('orders', 'o');
    expect(withCleared.parseRaw()).not.toContain('DISTINCT');

    const withClearSelect = new PostgresQuery().newBuilder();
    withClearSelect
      .distinctOn([{ tableNameOrAlias: 'o', columnName: 'customer_id' }])
      .clearSelect()
      .selectAll()
      .fromTable('orders', 'o');
    expect(withClearSelect.parseRaw()).not.toContain('DISTINCT');
  });
});
