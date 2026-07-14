import { describe, expect, it } from 'vitest';
import { PostgresQuery, WhereOperator } from '../../src';

describe('PostgresQuery group by', () => {
  it('groupByColumn single', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder
      .selectColumn('u', 'department', '')
      .selectRaw('COUNT(*) AS count')
      .fromTable('users', 'u')
      .groupByColumn('u', 'department');

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT "u"."department", COUNT(*) AS count FROM "public"."users" AS "u" GROUP BY "u"."department";',
    );
  });

  it('groupByColumns multiple', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder
      .selectColumn('u', 'department', '')
      .selectColumn('u', 'role', '')
      .selectRaw('COUNT(*) AS count')
      .fromTable('users', 'u')
      .groupByColumns([
        { tableNameOrAlias: 'u', columnName: 'department' },
        { tableNameOrAlias: 'u', columnName: 'role' },
      ]);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT "u"."department", "u"."role", COUNT(*) AS count FROM "public"."users" AS "u" GROUP BY "u"."department", "u"."role";',
    );
  });

  it('groupByRaw', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder
      .selectRaw('DATE_TRUNC(\'month\', "u"."created_at") AS month')
      .selectRaw('COUNT(*) AS count')
      .fromTable('users', 'u')
      .groupByRaw('DATE_TRUNC(\'month\', "u"."created_at")');

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT DATE_TRUNC(\'month\', "u"."created_at") AS month, COUNT(*) AS count FROM "public"."users" AS "u" GROUP BY DATE_TRUNC(\'month\', "u"."created_at");',
    );
  });

  it('groupByRaws multiple', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder
      .selectRaw('EXTRACT(YEAR FROM created_at) AS year')
      .selectRaw('EXTRACT(MONTH FROM created_at) AS month')
      .selectRaw('COUNT(*) AS count')
      .fromTable('users', 'u')
      .groupByRaws(['EXTRACT(YEAR FROM created_at)', 'EXTRACT(MONTH FROM created_at)']);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT EXTRACT(YEAR FROM created_at) AS year, EXTRACT(MONTH FROM created_at) AS month, COUNT(*) AS count FROM "public"."users" AS "u" GROUP BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at);',
    );
  });

  it('group by with having', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder
      .selectColumn('u', 'department', '')
      .selectRaw('COUNT(*) AS count')
      .fromTable('users', 'u')
      .groupByColumn('u', 'department')
      .having('u', 'department', WhereOperator.GreaterThan, 5);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT "u"."department", COUNT(*) AS count FROM "public"."users" AS "u" GROUP BY "u"."department" HAVING "u"."department" > 5;',
    );
  });

  it('group by with havingRaw', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder
      .selectColumn('u', 'department', '')
      .selectRaw('COUNT(*) AS count')
      .fromTable('users', 'u')
      .groupByColumn('u', 'department')
      .havingRaw('COUNT(*) > 10');

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT "u"."department", COUNT(*) AS count FROM "public"."users" AS "u" GROUP BY "u"."department" HAVING COUNT(*) > 10;',
    );
  });

  it('group by with where and having', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder
      .selectColumn('u', 'department', '')
      .selectRaw('COUNT(*) AS count')
      .fromTable('users', 'u')
      .where('u', 'active', WhereOperator.Equals, true)
      .groupByColumn('u', 'department')
      .having('u', 'department', WhereOperator.GreaterThan, 3);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT "u"."department", COUNT(*) AS count FROM "public"."users" AS "u" WHERE "u"."active" = true GROUP BY "u"."department" HAVING "u"."department" > 3;',
    );
  });

  it('group by with parse() prepared statement', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder
      .selectColumn('u', 'department', '')
      .selectRaw('COUNT(*) AS count')
      .fromTable('users', 'u')
      .where('u', 'active', WhereOperator.Equals, true)
      .groupByColumn('u', 'department')
      .having('u', 'department', WhereOperator.GreaterThan, 3);

    const sql = builder.parse();
    expect(sql).toEqual(
      'SELECT "u"."department", COUNT(*) AS count FROM "public"."users" AS "u" WHERE "u"."active" = $1 GROUP BY "u"."department" HAVING "u"."department" > $2;',
    );
  });

  it('having without group by throws error', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder
      .selectColumn('u', 'department', '')
      .fromTable('users', 'u')
      .having('u', 'department', WhereOperator.GreaterThan, 5);

    expect(() => builder.parseRaw()).toThrow();
  });

  it('clearGroupBy resets group by state', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder
      .selectColumn('u', 'department', '')
      .selectRaw('COUNT(*) AS count')
      .fromTable('users', 'u')
      .groupByColumn('u', 'department')
      .clearGroupBy()
      .groupByColumn('u', 'role');

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT "u"."department", COUNT(*) AS count FROM "public"."users" AS "u" GROUP BY "u"."role";',
    );
  });
});
