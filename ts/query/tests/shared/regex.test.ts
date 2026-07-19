import { describe, expect, it } from 'vitest';
import { MssqlQuery, MysqlQuery, PostgresQuery, SqliteQuery, WhereOperator } from '../../src';

/**
 * Regular-expression operators. Postgres has native `~` / `~*` (+ negations); MySQL has `REGEXP`
 * (case sensitivity is collation-driven, so the case-insensitive variant emits the same operator);
 * SQLite (needs an app-registered function) and MSSQL (no engine before SQL Server 2025) throw.
 */
const pg = () => new PostgresQuery().newBuilder().selectAll().fromTable('users', 'u');
const my = () => new MysqlQuery().newBuilder().selectAll().fromTable('users', 'u');

describe('regex operators', () => {
  it('Postgres uses ~ / !~ (case-sensitive) and ~* / !~* (case-insensitive)', () => {
    expect(pg().where('u', 'email', WhereOperator.Regex, '^a').parsePrepared().sql).toContain(
      '"u"."email" ~ $1',
    );
    expect(pg().where('u', 'email', WhereOperator.NotRegex, '^a').parsePrepared().sql).toContain(
      '"u"."email" !~ $1',
    );
    expect(pg().where('u', 'email', WhereOperator.Iregex, '^a').parsePrepared().sql).toContain(
      '"u"."email" ~* $1',
    );
    expect(pg().where('u', 'email', WhereOperator.NotIregex, '^a').parsePrepared().sql).toContain(
      '"u"."email" !~* $1',
    );
    expect(pg().where('u', 'email', WhereOperator.Regex, '^a').parsePrepared().params).toEqual([
      '^a',
    ]);
  });

  it('MySQL uses REGEXP / NOT REGEXP; the case-insensitive variant emits the same operator', () => {
    expect(my().where('u', 'email', WhereOperator.Regex, '^a').parsePrepared().sql).toContain(
      '`u`.`email` REGEXP ?',
    );
    expect(my().where('u', 'email', WhereOperator.NotRegex, '^a').parsePrepared().sql).toContain(
      '`u`.`email` NOT REGEXP ?',
    );
    // Iregex is collation-driven on MySQL, so it emits identically to Regex.
    expect(my().where('u', 'email', WhereOperator.Iregex, '^a').parsePrepared().sql).toContain(
      '`u`.`email` REGEXP ?',
    );
  });

  it('SQLite and MSSQL throw — no built-in regex engine', () => {
    expect(() =>
      new SqliteQuery()
        .newBuilder()
        .selectAll()
        .fromTable('users', 'u')
        .where('u', 'email', WhereOperator.Regex, '^a')
        .parseRaw(),
    ).toThrow(/SQLite has no built-in regular-expression operator/);
    expect(() =>
      new MssqlQuery()
        .newBuilder()
        .selectAll()
        .fromTable('users', 'u')
        .where('u', 'email', WhereOperator.Regex, '^a')
        .parseRaw(),
    ).toThrow(/MSSQL has no built-in regular-expression operator/);
  });

  it('is shared between WHERE and HAVING via the same comparison core', () => {
    const b = new PostgresQuery()
      .newBuilder()
      .selectColumn('u', 'email', '')
      .fromTable('users', 'u')
      .groupByColumn('u', 'email')
      .having('u', 'email', WhereOperator.Regex, '^a');
    expect(b.parseRaw()).toContain('HAVING "u"."email" ~ ');
  });
});
