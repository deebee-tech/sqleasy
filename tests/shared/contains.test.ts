import { describe, expect, it } from 'vitest';
import { MssqlQuery, MysqlQuery, PostgresQuery, SqliteQuery, WhereOperator } from '../../src';

/**
 * Literal substring operators (Contains / NotContains / StartsWith / EndsWith). Unlike raw LIKE, the
 * bound value is the literal text to find — the wildcards are added here and the LIKE metacharacters
 * (`%`, `_`, and MSSQL's `[`) inside the value are ESCAPED, so a search for `50%` matches literally.
 */
const pg = () => new PostgresQuery().newBuilder().selectAll().fromTable('t', 't');
const my = () => new MysqlQuery().newBuilder().selectAll().fromTable('t', 't');
const lite = () => new SqliteQuery().newBuilder().selectAll().fromTable('t', 't');
const ms = () => new MssqlQuery().newBuilder().selectAll().fromTable('t', 't');

describe('literal substring operators', () => {
  it('Contains escapes % and _ and wraps both sides (a search for "a%b" matches it literally)', () => {
    const { sql, params } = pg()
      .where('t', 'name', WhereOperator.Contains, 'a%b_c')
      .parsePrepared();
    expect(sql).toContain('"t"."name" LIKE $1 ESCAPE ');
    expect(params).toEqual(['%a\\%b\\_c%']); // % and _ escaped, wrapped %…%
  });

  it('StartsWith wraps only the trailing %, EndsWith only the leading %', () => {
    expect(pg().where('t', 'name', WhereOperator.StartsWith, 'a%b').parsePrepared().params).toEqual(
      ['a\\%b%'],
    );
    expect(pg().where('t', 'name', WhereOperator.EndsWith, 'a%b').parsePrepared().params).toEqual([
      '%a\\%b',
    ]);
  });

  it('NotContains negates to NOT LIKE with the same escaping', () => {
    const { sql, params } = pg()
      .where('t', 'name', WhereOperator.NotContains, 'x_y')
      .parsePrepared();
    expect(sql).toContain('"t"."name" NOT LIKE $1 ESCAPE ');
    expect(params).toEqual(['%x\\_y%']);
  });

  it('escapes an actual backslash in the value too', () => {
    expect(
      lite().where('t', 'name', WhereOperator.Contains, 'a\\b').parsePrepared().params,
    ).toEqual(['%a\\\\b%']);
  });

  it('MySQL doubles the ESCAPE-char literal (its string parser eats a single backslash)', () => {
    const { sql } = my().where('t', 'name', WhereOperator.Contains, 'a%b').parsePrepared();
    expect(sql).toContain('`t`.`name` LIKE ? ESCAPE ');
    expect(sql).toContain("ESCAPE '\\\\'"); // ESCAPE '\\'
  });

  it('MSSQL additionally escapes the [ metacharacter', () => {
    // MSSQL's prepared form inlines values into sp_executesql (params is empty), so assert the text.
    expect(ms().where('t', 'name', WhereOperator.Contains, 'a[b').parseRaw()).toContain('a\\[b');
    // A non-MSSQL dialect leaves [ alone (not a LIKE metacharacter there).
    expect(pg().where('t', 'name', WhereOperator.Contains, 'a[b').parsePrepared().params).toEqual([
      '%a[b%',
    ]);
  });
});
