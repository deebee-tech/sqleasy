import { describe, expect, it } from 'vitest';
import { PostgresQuery, WhereOperator } from '../../src';

/**
 * HAVING now supports the same predicate set as WHERE (BETWEEN, IN, NULL checks, EXISTS,
 * parenthesized groups), sharing WHERE's combinator/spacing rules term for term.
 */
describe('HAVING parity with WHERE', () => {
  const groupedBuilder = () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectColumn('u', 'role', '')
      .selectRaw('COUNT(*) AS cnt')
      .fromTable('users', 'u')
      .groupByColumn('u', 'role');
    return builder;
  };

  it('havingBetween', () => {
    const builder = groupedBuilder().havingBetween('u', 'cnt', 5, 10);
    const result = builder.parsePrepared();
    expect(result.sql).toContain('HAVING "u"."cnt" BETWEEN $1 AND $2');
    expect(result.params).toEqual([5, 10]);
  });

  it('havingInValues', () => {
    const builder = groupedBuilder().havingInValues('u', 'role', ['admin', 'owner']);
    const result = builder.parsePrepared();
    expect(result.sql).toContain('HAVING "u"."role" IN ($1, $2)');
    expect(result.params).toEqual(['admin', 'owner']);
  });

  it('havingInValues with an empty list throws', () => {
    const builder = groupedBuilder().havingInValues('u', 'role', []);
    expect(() => builder.parsePrepared()).toThrow('Having: IN requires at least one value');
  });

  it('havingNotInValues', () => {
    const builder = groupedBuilder().havingNotInValues('u', 'role', ['guest']);
    const result = builder.parsePrepared();
    expect(result.sql).toContain('HAVING "u"."role" NOT IN ($1)');
  });

  it('havingNotInValues with an empty list throws', () => {
    const builder = groupedBuilder().havingNotInValues('u', 'role', []);
    expect(() => builder.parsePrepared()).toThrow('Having: NOT IN requires at least one value');
  });

  it('havingNull', () => {
    const builder = groupedBuilder().havingNull('u', 'role');
    expect(builder.parseRaw()).toContain('HAVING "u"."role" IS NULL');
  });

  it('havingNotNull', () => {
    const builder = groupedBuilder().havingNotNull('u', 'role');
    expect(builder.parseRaw()).toContain('HAVING "u"."role" IS NOT NULL');
  });

  it('havingInWithBuilder', () => {
    const builder = groupedBuilder().havingInWithBuilder('u', 'role', (sub) => {
      sub.selectColumn('r', 'name', '').fromTable('roles', 'r');
    });
    expect(builder.parseRaw()).toContain(
      'HAVING "u"."role" IN (SELECT "r"."name" FROM "public"."roles" AS "r")',
    );
  });

  it('havingNotInWithBuilder', () => {
    const builder = groupedBuilder().havingNotInWithBuilder('u', 'role', (sub) => {
      sub.selectColumn('r', 'name', '').fromTable('roles', 'r');
    });
    expect(builder.parseRaw()).toContain('HAVING "u"."role" NOT IN (SELECT');
  });

  it('havingExists has no unused table/column parameters', () => {
    const builder = groupedBuilder().havingExists((sub) => {
      sub.selectAll().fromTable('orders', 'o').where('o', 'user_id', WhereOperator.Equals, 1);
    });
    expect(builder.parseRaw()).toContain('HAVING EXISTS (SELECT * FROM "public"."orders" AS "o"');
  });

  it('havingNotExists has no unused table/column parameters', () => {
    const builder = groupedBuilder().havingNotExists((sub) => {
      sub.selectAll().fromTable('orders', 'o');
    });
    expect(builder.parseRaw()).toContain('HAVING NOT EXISTS (SELECT');
  });

  it('havingGroup parenthesizes a sub-expression and composes with AND/OR', () => {
    const builder = groupedBuilder()
      .having('u', 'role', WhereOperator.Equals, 'admin')
      .and()
      .havingGroup((sub) => {
        sub.havingBetween('u', 'cnt', 1, 5).or().havingNull('u', 'role');
      });

    expect(builder.parseRaw()).toContain(
      'HAVING "u"."role" = admin AND ("u"."cnt" BETWEEN 1 AND 5 OR "u"."role" IS NULL)',
    );
  });

  it('havingGroup throws when empty', () => {
    expect(() => groupedBuilder().havingGroup(() => {})).toThrow('HAVING group cannot be empty');
  });

  it('consecutive HAVING predicates auto-join with AND, mirroring WHERE', () => {
    const builder = groupedBuilder().havingNull('u', 'role').havingNotNull('u', 'role');
    expect(builder.parseRaw()).toContain('"u"."role" IS NULL AND "u"."role" IS NOT NULL');
  });

  it('HAVING still requires a GROUP BY clause', () => {
    const builder = new PostgresQuery().newBuilder();
    builder.selectAll().fromTable('users', 'u').havingBetween('u', 'cnt', 1, 5);
    expect(() => builder.parsePrepared()).toThrow('Having: HAVING requires a GROUP BY clause');
  });
});
