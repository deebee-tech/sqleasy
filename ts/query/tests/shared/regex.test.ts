import { describe, expect, it } from 'vitest';
import { MssqlQuery, MysqlQuery, PostgresQuery, SqliteQuery, WhereOperator } from '../../src';

/**
 * Regular-expression operators. Postgres has native `~` / `~*` (+ negations); MySQL has `REGEXP`
 * (case sensitivity is named explicitly via REGEXP_LIKE's match_type, not left to the collation);
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

  // This case previously asserted that Regex and Iregex emit the SAME operator on MySQL, because
  // the bare `REGEXP` operator takes its case sensitivity from the collation. That made both
  // operators dishonest: Iregex was case-insensitive only when the collation happened to be (the
  // default utf8mb4_*_ci is, so it usually looked correct), and Regex was case-INsensitive under
  // that same default — silently the opposite of its name. MySQL 8.0.4+ can say which it means.
  it('MySQL names the match type explicitly instead of inheriting the collation', () => {
    expect(my().where('u', 'email', WhereOperator.Regex, '^a').parsePrepared().sql).toContain(
      "REGEXP_LIKE(`u`.`email`, ?, 'c')",
    );
    expect(my().where('u', 'email', WhereOperator.NotRegex, '^a').parsePrepared().sql).toContain(
      "NOT REGEXP_LIKE(`u`.`email`, ?, 'c')",
    );
    expect(my().where('u', 'email', WhereOperator.Iregex, '^a').parsePrepared().sql).toContain(
      "REGEXP_LIKE(`u`.`email`, ?, 'i')",
    );
    expect(my().where('u', 'email', WhereOperator.NotIregex, '^a').parsePrepared().sql).toContain(
      "NOT REGEXP_LIKE(`u`.`email`, ?, 'i')",
    );
  });

  // Regex and Iregex must now emit DIFFERENT SQL. Asserting the difference directly is what stops
  // a future collation-driven shortcut from quietly collapsing them back together.
  it('MySQL Regex and Iregex are no longer the same statement', () => {
    const sensitive = my().where('u', 'email', WhereOperator.Regex, '^a').parsePrepared().sql;
    const insensitive = my().where('u', 'email', WhereOperator.Iregex, '^a').parsePrepared().sql;
    expect(sensitive).not.toEqual(insensitive);
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
