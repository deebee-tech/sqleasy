import { describe, expect, it } from 'vitest';
import {
  JoinOperator,
  JoinType,
  MssqlQuery,
  MysqlQuery,
  PostgresQuery,
  SqliteQuery,
} from '../../src';

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

/**
 * A null test cannot go through `onValue`: `= NULL` is never true, so passing null there yields a
 * predicate that silently matches nothing — a wrong answer with no error. WHERE has had
 * `whereNull`/`whereNotNull` since the beginning; the JOIN was simply asymmetric, and callers were
 * paying for it with hand-written `onRaw` fragments that also hand-quoted the identifier.
 */
describe('JOIN ON null tests', () => {
  it('onNull renders IS NULL', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('orders', 'o')
      .joinTable(JoinType.Left, 'customers', 'c', (j) => j.onNull('c', 'deleted_at'));

    expect(builder.parseRaw()).toContain('ON "c"."deleted_at" IS NULL');
  });

  it('onNotNull renders IS NOT NULL', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('orders', 'o')
      .joinTable(JoinType.Left, 'customers', 'c', (j) => j.onNotNull('c', 'email'));

    expect(builder.parseRaw()).toContain('ON "c"."email" IS NOT NULL');
  });

  it('composes with a preceding on() via the implicit AND', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('orders', 'o')
      .joinTable(JoinType.Left, 'customers', 'c', (j) =>
        j.on('o', 'customer_id', JoinOperator.Equals, 'c', 'id').onNotNull('c', 'email'),
      );

    expect(builder.parseRaw()).toContain(
      'ON "o"."customer_id" = "c"."id" AND "c"."email" IS NOT NULL',
    );
  });

  // The failure mode worth a test of its own: IS NULL takes no operand, so it must consume no
  // placeholder. Emitting one would shift every later parameter by one and misbind the whole query.
  it('binds no placeholder, leaving later parameters aligned', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('orders', 'o')
      .joinTable(JoinType.Left, 'customers', 'c', (j) =>
        j
          .onValue('c', 'tier', JoinOperator.Equals, 'gold')
          .and()
          .onNull('c', 'deleted_at')
          .and()
          .onValue('c', 'region', JoinOperator.Equals, 'emea'),
      );

    const { sql, params } = builder.parsePrepared();

    expect(sql).toContain('"c"."tier" = $1');
    expect(sql).toContain('"c"."deleted_at" IS NULL');
    expect(sql).toContain('"c"."region" = $2');
    expect(params).toEqual(['gold', 'emea']);
  });

  it.each([
    { name: 'MSSQL', query: () => new MssqlQuery(), expected: '[c].[deleted_at] IS NULL' },
    { name: 'MySQL', query: () => new MysqlQuery(), expected: '`c`.`deleted_at` IS NULL' },
    { name: 'Postgres', query: () => new PostgresQuery(), expected: '"c"."deleted_at" IS NULL' },
    { name: 'SQLite', query: () => new SqliteQuery(), expected: '"c"."deleted_at" IS NULL' },
  ])('$name quotes the identifier with its own delimiters', ({ query, expected }) => {
    const builder = query().newBuilder();
    builder
      .selectAll()
      .fromTable('orders', 'o')
      .joinTable(JoinType.Left, 'customers', 'c', (j) => j.onNull('c', 'deleted_at'));

    expect(builder.parseRaw()).toContain(expected);
  });
});
