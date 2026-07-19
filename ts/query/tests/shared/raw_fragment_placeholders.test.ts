import { describe, expect, it } from 'vitest';
import { MssqlQuery, MysqlQuery, PostgresQuery, SqliteQuery, WhereOperator } from '../../src';

/**
 * Placeholders are located by token, never by scanning the rendered SQL for a bare `?`/`$`.
 *
 * The scan could not tell a real placeholder from the same character inside a caller-supplied raw
 * fragment, and it substituted whichever came first in the string. Both dialects that rewrite
 * placeholders (MSSQL `?`→`@pN`, Postgres `?`→`$n`) corrupted the caller's SQL *and* bound the
 * parameters to the wrong positions. These are the cases that used to break.
 */
describe('raw fragments containing placeholder characters', () => {
  it('MSSQL: a literal ? in a raw fragment is not mistaken for a placeholder', () => {
    const builder = new MssqlQuery().newBuilder();
    builder
      .selectRaw("'why?' AS q")
      .fromTable('users', 'u')
      .where('u', 'id', WhereOperator.Equals, 42);

    const sql = builder.parse();

    // The caller's literal survives intact...
    expect(sql).toContain("''why?'' AS q");
    // ...and the real placeholder is the one that got rewritten.
    expect(sql).toContain('[u].[id] = @p0');
    expect(sql).toContain('@p0 tinyint');
    expect(sql).toContain('@p0 = 42');
  });

  it('Postgres: a literal $ in a raw fragment is not mistaken for a placeholder', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectRaw("'$100' AS price")
      .fromTable('users', 'u')
      .where('u', 'id', WhereOperator.Equals, 42);

    const { sql, params } = builder.parsePrepared();

    // Previously: the literal became '$1100' and the real placeholder was pushed to $2, leaving
    // Postgres to reject a $2 that had no bound value.
    expect(sql).toContain("'$100' AS price");
    expect(sql).toContain('"u"."id" = $1');
    expect(sql).not.toContain('$2');
    expect(params).toEqual([42]);
  });

  it('Postgres: $$-quoting in a raw fragment survives, and numbering stays correct', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectRaw('$$a$$ AS tag')
      .fromTable('users', 'u')
      .where('u', 'a', WhereOperator.Equals, 1)
      .and()
      .where('u', 'b', WhereOperator.Equals, 2);

    const { sql, params } = builder.parsePrepared();

    expect(sql).toContain('$$a$$ AS tag');
    expect(sql).toContain('"u"."a" = $1');
    expect(sql).toContain('"u"."b" = $2');
    expect(params).toEqual([1, 2]);
  });

  it('MySQL / SQLite: a literal ? in a raw fragment survives and params still align', () => {
    for (const query of [new MysqlQuery(), new SqliteQuery()]) {
      const builder = query.newBuilder();
      builder
        .selectRaw("'why?' AS q")
        .fromTable('users', 'u')
        .where('u', 'id', WhereOperator.Equals, 42);

      const { sql, params } = builder.parsePrepared();

      expect(sql).toContain("'why?' AS q");
      expect(params).toEqual([42]);
      // Two `?` in the string: the caller's literal, and the one real placeholder.
      expect(sql.split('?').length - 1).toBe(2);
    }
  });

  it('rejects a NUL byte in a raw fragment rather than letting it forge a placeholder', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectRaw(`x${String.fromCharCode(0)}?${String.fromCharCode(0)}y`)
      .fromTable('users', 'u');

    expect(() => builder.parsePrepared()).toThrow(/NUL/);
  });
});
