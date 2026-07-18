import { describe, expect, it } from 'vitest';
import { MssqlQuery, MysqlQuery, PostgresQuery, SqliteQuery, WhereOperator } from '../../src';

/**
 * `INSERT INTO ... (cols) SELECT ...` — the row source is a nested query instead of a literal
 * `VALUES` list. Mutually exclusive with `insertValues` (mixing the two throws at parse time).
 */
describe('INSERT...SELECT', () => {
  it('renders SELECT immediately after the column list, in place of VALUES', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .insertInto('archive')
      .insertColumns(['id', 'total'])
      .insertSelect((sub) =>
        sub
          .selectColumn('o', 'id', '')
          .selectColumn('o', 'total', '')
          .fromTable('orders', 'o')
          .where('o', 'archived', WhereOperator.Equals, true),
      );

    expect(builder.parseRaw()).toBe(
      'INSERT INTO "public"."archive" ("id", "total") SELECT "o"."id", "o"."total" FROM "public"."orders" AS "o" WHERE "o"."archived" = true;',
    );
  });

  it('binds the SELECT source subquery values as ordinary bound params', () => {
    const builder = new MysqlQuery().newBuilder();
    builder
      .insertInto('archive')
      .insertColumns(['id'])
      .insertSelect((sub) =>
        sub
          .selectColumn('o', 'id', '')
          .fromTable('orders', 'o')
          .where('o', 'total', WhereOperator.GreaterThan, 100),
      );

    const { sql, params } = builder.parsePrepared();
    expect(sql).toBe(
      'INSERT INTO `archive` (`id`) SELECT `o`.`id` FROM `orders` AS `o` WHERE `o`.`total` > ?;',
    );
    expect(params).toEqual([100]);
  });

  it('throws when combined with insertValues', () => {
    const builder = new SqliteQuery().newBuilder();
    builder
      .insertInto('archive')
      .insertColumns(['id'])
      .insertValues([1])
      .insertSelect((sub) => sub.selectColumn('o', 'id', '').fromTable('orders', 'o'));

    expect(() => builder.parseRaw()).toThrow(
      'INSERT cannot combine a SELECT source with VALUES rows',
    );
  });

  it('composes with RETURNING / OUTPUT the same way a VALUES insert does', () => {
    const pg = new PostgresQuery().newBuilder();
    pg.insertInto('archive')
      .insertColumns(['id'])
      .insertSelect((sub) => sub.selectColumn('o', 'id', '').fromTable('orders', 'o'))
      .returning(['id']);
    expect(pg.parseRaw()).toContain('RETURNING "id"');

    const mssql = new MssqlQuery().newBuilder();
    mssql
      .insertInto('archive')
      .insertColumns(['id'])
      .insertSelect((sub) => sub.selectColumn('o', 'id', '').fromTable('orders', 'o'))
      .returning(['id']);
    expect(mssql.parseRaw()).toContain('OUTPUT INSERTED.[id]');
  });
});
