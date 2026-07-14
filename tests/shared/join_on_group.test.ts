import { describe, expect, it } from 'vitest';
import { JoinOperator, JoinType, PostgresQuery, WhereOperator } from '../../src';

/**
 * `JoinOnBuilder.onGroup` used to populate a child builder and then throw it away: it pushed
 * GroupBegin and GroupEnd but never spliced the child's states between them. Every condition inside
 * the group vanished — the join rendered `... AND ()` — and any `onValue` inside it was never bound.
 *
 * That is the worst shape a bug can take here: nothing throws, the SQL is syntactically plausible,
 * and the JOIN quietly matches on the wrong predicate and returns the wrong rows.
 */
describe('join ON groups', () => {
  it('renders the conditions inside the group and binds their values', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .joinTable(JoinType.Inner, 'orders', 'o', (j) => {
        j.on('u', 'id', JoinOperator.Equals, 'o', 'user_id')
          .and()
          .onGroup((g) => {
            g.onValue('o', 'amount', JoinOperator.GreaterThan, 42)
              .or()
              .on('o', 'type', JoinOperator.Equals, 'u', 'default_type');
          });
      })
      .where('u', 'active', WhereOperator.Equals, true);

    const { sql, params } = builder.parsePrepared();

    expect(sql).not.toContain('()');
    // No space before the closing paren — the group end suppresses the condition separator.
    expect(sql).toContain('AND ("o"."amount" > $1 OR "o"."type" = "u"."default_type")');
    // The group's value must bind, and bind BEFORE the outer where's value.
    expect(params).toEqual([42, true]);
  });

  it('supports a group nested inside a group', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .joinTable(JoinType.Inner, 'orders', 'o', (j) => {
        j.on('u', 'id', JoinOperator.Equals, 'o', 'user_id')
          .and()
          .onGroup((g) => {
            g.onValue('o', 'a', JoinOperator.Equals, 1)
              .or()
              .onGroup((inner) => {
                inner
                  .onValue('o', 'b', JoinOperator.Equals, 2)
                  .and()
                  .onValue('o', 'c', JoinOperator.Equals, 3);
              });
          });
      });

    const { params } = builder.parsePrepared();

    expect(params).toEqual([1, 2, 3]);
  });

  it('still renders an empty group as empty parentheses', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .joinTable(JoinType.Inner, 'orders', 'o', (j) => {
        j.on('u', 'id', JoinOperator.Equals, 'o', 'user_id')
          .and()
          .onGroup(() => {});
      });

    expect(builder.parsePrepared().sql).toContain('()');
  });
});
