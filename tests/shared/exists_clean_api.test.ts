import { describe, expect, it } from 'vitest';
import { PostgresQuery, WhereOperator } from '../../src';

/**
 * `whereExists`/`whereNotExists` render the same `EXISTS (subquery)` clause as
 * `whereExistsWithBuilder`/`whereNotExistsWithBuilder`, minus the table/column parameters those
 * never use (kept only for wire parity with the golden corpus).
 */
describe('whereExists / whereNotExists (cleaner EXISTS API)', () => {
  it('whereExists renders EXISTS with no unused table/column', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .whereExists((sub) => {
        sub.selectAll().fromTable('orders', 'o').where('o', 'user_id', WhereOperator.Equals, 1);
      });

    expect(builder.parseRaw()).toEqual(
      'SELECT * FROM "public"."users" AS "u" WHERE EXISTS (SELECT * FROM "public"."orders" AS "o" WHERE "o"."user_id" = 1);',
    );
  });

  it('whereNotExists renders NOT EXISTS with no unused table/column', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .whereNotExists((sub) => {
        sub.selectAll().fromTable('orders', 'o');
      });

    expect(builder.parseRaw()).toEqual(
      'SELECT * FROM "public"."users" AS "u" WHERE NOT EXISTS (SELECT * FROM "public"."orders" AS "o");',
    );
  });

  it('renders identically to whereExistsWithBuilder for the same subquery', () => {
    const withUnused = new PostgresQuery().newBuilder();
    withUnused
      .selectAll()
      .fromTable('users', 'u')
      .whereExistsWithBuilder('u', 'id', (sub) => {
        sub.selectAll().fromTable('orders', 'o');
      });

    const clean = new PostgresQuery().newBuilder();
    clean
      .selectAll()
      .fromTable('users', 'u')
      .whereExists((sub) => {
        sub.selectAll().fromTable('orders', 'o');
      });

    expect(clean.parseRaw()).toEqual(withUnused.parseRaw());
  });

  it('whereExists composes with AND/OR and groups', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'active', WhereOperator.Equals, true)
      .and()
      .whereExists((sub) => {
        sub.selectAll().fromTable('orders', 'o');
      });

    expect(builder.parseRaw()).toContain('WHERE "u"."active" = true AND EXISTS (SELECT');
  });
});
