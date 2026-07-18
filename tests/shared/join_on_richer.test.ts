import { describe, expect, it } from 'vitest';
import { JoinOperator, JoinType, PostgresQuery } from '../../src';

/**
 * Richer JOIN ON predicates: `LIKE`/`NOT LIKE` (via the existing `on`/`onValue`), and the new
 * `onIn`/`onNotIn`/`onBetween`/`onNotBetween`.
 */
describe('richer JOIN ON predicates', () => {
  it('supports LIKE between two columns', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('products', 'p')
      .joinTable(JoinType.Inner, 'categories', 'c', (j) =>
        j.on('p', 'name', JoinOperator.Like, 'c', 'name_pattern'),
      );

    expect(builder.parseRaw()).toContain('ON "p"."name" LIKE "c"."name_pattern"');
  });

  it('supports NOT LIKE against a bound value', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('products', 'p')
      .joinTable(JoinType.Inner, 'categories', 'c', (j) =>
        j.onValue('p', 'name', JoinOperator.NotLike, 'test%'),
      );

    const { sql, params } = builder.parsePrepared();
    expect(sql).toContain('ON "p"."name" NOT LIKE $1');
    expect(params).toEqual(['test%']);
  });

  it('onIn renders and binds an IN list', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('orders', 'o')
      .joinTable(JoinType.Inner, 'customers', 'c', (j) => j.onIn('c', 'tier', [1, 2, 3]));

    const { sql, params } = builder.parsePrepared();
    expect(sql).toContain('ON "c"."tier" IN ($1, $2, $3)');
    expect(params).toEqual([1, 2, 3]);
  });

  it('onNotIn renders and binds a NOT IN list', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('orders', 'o')
      .joinTable(JoinType.Inner, 'customers', 'c', (j) => j.onNotIn('c', 'tier', [0]));

    expect(builder.parseRaw()).toContain('ON "c"."tier" NOT IN (0)');
  });

  it('onBetween renders and binds both bounds', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('orders', 'o')
      .joinTable(JoinType.Inner, 'customers', 'c', (j) => j.onBetween('c', 'tier', 1, 5));

    const { sql, params } = builder.parsePrepared();
    expect(sql).toContain('ON "c"."tier" BETWEEN $1 AND $2');
    expect(params).toEqual([1, 5]);
  });

  it('onNotBetween composes with a preceding on() via the implicit AND', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('orders', 'o')
      .joinTable(JoinType.Inner, 'customers', 'c', (j) =>
        j.on('o', 'customer_id', JoinOperator.Equals, 'c', 'id').onNotBetween('c', 'tier', 1, 3),
      );

    expect(builder.parseRaw()).toContain(
      'ON "o"."customer_id" = "c"."id" AND "c"."tier" NOT BETWEEN 1 AND 3',
    );
  });
});
