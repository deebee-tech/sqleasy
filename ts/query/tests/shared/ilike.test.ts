import { describe, expect, it } from 'vitest';
import { MssqlQuery, MysqlQuery, PostgresQuery, SqliteQuery, WhereOperator } from '../../src';

/**
 * ILIKE/NOT ILIKE are native on Postgres; every other dialect here has no case-insensitive LIKE
 * operator, so they are rewritten to `LOWER(col) LIKE LOWER(?)` (and the NOT variant).
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

  it('MySQL rewrites ILIKE to LOWER(col) LIKE LOWER(?)', () => {
    const builder = new MysqlQuery().newBuilder();
    builder.selectAll().fromTable('users', 'u').where('u', 'email', WhereOperator.Ilike, '%a%');

    const result = builder.parsePrepared();
    expect(result.sql).toContain('WHERE LOWER(`u`.`email`) LIKE LOWER(?)');
    expect(result.params).toEqual(['%a%']);
  });

  it('MySQL rewrites NOT ILIKE to LOWER(col) NOT LIKE LOWER(?)', () => {
    const builder = new MysqlQuery().newBuilder();
    builder.selectAll().fromTable('users', 'u').where('u', 'email', WhereOperator.NotIlike, '%a%');

    const result = builder.parsePrepared();
    expect(result.sql).toContain('WHERE LOWER(`u`.`email`) NOT LIKE LOWER(?)');
  });

  it('SQLite rewrites ILIKE to LOWER(col) LIKE LOWER(?)', () => {
    const builder = new SqliteQuery().newBuilder();
    builder.selectAll().fromTable('users', 'u').where('u', 'email', WhereOperator.Ilike, '%a%');

    const result = builder.parsePrepared();
    expect(result.sql).toContain('WHERE LOWER("u"."email") LIKE LOWER(?)');
  });

  it('MSSQL rewrites ILIKE to LOWER(col) LIKE LOWER(@pN)', () => {
    const builder = new MssqlQuery().newBuilder();
    builder.selectAll().fromTable('users', 'u').where('u', 'email', WhereOperator.Ilike, '%a%');

    const result = builder.parsePrepared();
    expect(result.sql).toContain('LOWER([u].[email]) LIKE LOWER(@p0)');
  });

  it('HAVING ILIKE follows the same per-dialect rewrite as WHERE', () => {
    const pg = new PostgresQuery().newBuilder();
    pg.selectColumn('u', 'email', '')
      .fromTable('users', 'u')
      .groupByColumn('u', 'email')
      .having('u', 'email', WhereOperator.Ilike, '%a%');
    expect(pg.parsePrepared().sql).toContain('HAVING "u"."email" ILIKE $1');

    const mysql = new MysqlQuery().newBuilder();
    mysql
      .selectColumn('u', 'email', '')
      .fromTable('users', 'u')
      .groupByColumn('u', 'email')
      .having('u', 'email', WhereOperator.Ilike, '%a%');
    expect(mysql.parsePrepared().sql).toContain('HAVING LOWER(`u`.`email`) LIKE LOWER(?)');
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
