import { describe, expect, it } from 'vitest';
import { MssqlQuery, MysqlQuery, PostgresQuery, SqliteQuery, WhereOperator } from '../../src';

/**
 * `ILIKE` is a Postgres operator and exists nowhere else.
 *
 * This file previously asserted the opposite: that MySQL, SQLite and MSSQL rewrite it to
 * `LOWER(col) LIKE LOWER(?)`. That rewrite returns plausible results, which is exactly why it
 * survived — but it is not the operator the caller asked for, and it is not even reliably
 * equivalent: SQLite's `LOWER()` is ASCII-only, so non-ASCII input silently case-folds differently
 * from Postgres.
 *
 * The refusal is careful about what it claims. All three of these engines DO have a
 * case-insensitive LIKE — it is collation- or pragma-driven rather than a distinct operator. A
 * refusal saying "no case-insensitive LIKE" would state something false about the database, which
 * is the same dishonesty this release removes, pointed the other way.
 */
describe('ILIKE / NOT ILIKE', () => {
  it('Postgres emits native ILIKE', () => {
    const builder = new PostgresQuery().newBuilder();
    builder.selectAll().fromTable('users', 'u').where('u', 'email', WhereOperator.Ilike, '%a%');

    const result = builder.parsePrepared();
    expect(result.sql).toContain('WHERE "u"."email" ILIKE $1');
    expect(result.params).toEqual(['%a%']);
  });

  it('Postgres emits native NOT ILIKE', () => {
    const builder = new PostgresQuery().newBuilder();
    builder.selectAll().fromTable('users', 'u').where('u', 'email', WhereOperator.NotIlike, '%a%');

    const result = builder.parsePrepared();
    expect(result.sql).toContain('WHERE "u"."email" NOT ILIKE $1');
  });

  const withoutIlike = [
    ['MySQL', () => new MysqlQuery().newBuilder()],
    ['SQLite', () => new SqliteQuery().newBuilder()],
    ['MSSQL', () => new MssqlQuery().newBuilder()],
  ] as const;

  for (const [name, make] of withoutIlike) {
    it(`${name} refuses ILIKE rather than rewriting it`, () => {
      const builder = make();
      builder.selectAll().fromTable('users', 'u').where('u', 'email', WhereOperator.Ilike, '%a%');

      expect(() => builder.parsePrepared()).toThrow(new RegExp(`${name} has no ILIKE operator`));
    });

    it(`${name} refuses NOT ILIKE`, () => {
      const builder = make();
      builder
        .selectAll()
        .fromTable('users', 'u')
        .where('u', 'email', WhereOperator.NotIlike, '%a%');

      expect(() => builder.parsePrepared()).toThrow(/has no ILIKE operator/);
    });

    // The message must not overstate. These engines have a case-insensitive LIKE; what they lack is
    // the operator.
    it(`${name}'s refusal does not claim it has no case-insensitive LIKE`, () => {
      const builder = make();
      builder.selectAll().fromTable('users', 'u').where('u', 'email', WhereOperator.Ilike, '%a%');

      expect(() => builder.parsePrepared()).toThrow(/collation-dependent/);
    });
  }

  // HAVING shares the comparison core with WHERE, so it must refuse identically — a dialect that
  // refused in one clause and rewrote in the other would be the worst of both.
  it('HAVING ILIKE refuses on the same dialects as WHERE', () => {
    const builder = new MysqlQuery().newBuilder();
    builder
      .selectColumn('u', 'email', '')
      .fromTable('users', 'u')
      .groupByColumn('u', 'email')
      .having('u', 'email', WhereOperator.Ilike, '%a%');

    expect(() => builder.parsePrepared()).toThrow(/MySQL has no ILIKE operator/);
  });

  it('HAVING ILIKE still emits on Postgres', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectColumn('u', 'email', '')
      .fromTable('users', 'u')
      .groupByColumn('u', 'email')
      .having('u', 'email', WhereOperator.Ilike, '%a%');

    expect(builder.parsePrepared().sql).toContain('HAVING "u"."email" ILIKE $1');
  });

  it('ILIKE composes with AND/OR like any other WHERE predicate', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'email', WhereOperator.Ilike, '%a%')
      .and()
      .where('u', 'active', WhereOperator.Equals, true);

    expect(builder.parseRaw()).toEqual(
      'SELECT * FROM "public"."users" AS "u" WHERE "u"."email" ILIKE %a% AND "u"."active" = true;',
    );
  });
});
