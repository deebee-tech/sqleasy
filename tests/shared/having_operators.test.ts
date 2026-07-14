import { describe, expect, it } from 'vitest';
import { PostgresQuery, WhereOperator } from '../../src';

/**
 * HAVING takes the same {@link WhereOperator} as WHERE, but its operator switch omitted `Like` and
 * `NotLike`. The operator was silently dropped — `HAVING "u"."role"  $1` — while the value was still
 * bound, producing a statement the database rejects. The identical predicate in WHERE worked.
 */
describe('HAVING renders every WhereOperator', () => {
  const having = (operator: WhereOperator) => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectColumn('u', 'role', '')
      .selectRaw('COUNT(*) AS cnt')
      .fromTable('users', 'u')
      .groupByColumn('u', 'role')
      .having('u', 'role', operator, 'x');

    return builder.parsePrepared();
  };

  it.each([
    { operator: WhereOperator.Equals, sql: '=' },
    { operator: WhereOperator.NotEquals, sql: '<>' },
    { operator: WhereOperator.GreaterThan, sql: '>' },
    { operator: WhereOperator.GreaterThanOrEquals, sql: '>=' },
    { operator: WhereOperator.LessThan, sql: '<' },
    { operator: WhereOperator.LessThanOrEquals, sql: '<=' },
    { operator: WhereOperator.Like, sql: 'LIKE' },
    { operator: WhereOperator.NotLike, sql: 'NOT LIKE' },
  ])('$operator renders as $sql', ({ operator, sql }) => {
    const result = having(operator);

    expect(result.sql).toContain(`HAVING "u"."role" ${sql} $1`);
    expect(result.params).toEqual(['x']);
  });

  it('matches what WHERE emits for the same operator', () => {
    const builder = new PostgresQuery().newBuilder();
    builder.selectAll().fromTable('users', 'u').where('u', 'role', WhereOperator.Like, 'x');

    expect(builder.parsePrepared().sql).toContain('WHERE "u"."role" LIKE $1');
    expect(having(WhereOperator.Like).sql).toContain('HAVING "u"."role" LIKE $1');
  });
});
