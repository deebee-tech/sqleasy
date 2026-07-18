import { Buffer } from 'node:buffer';
import { describe, expect, it } from 'vitest';
import { MssqlQuery, MysqlQuery, PostgresQuery, SqliteQuery, WhereOperator } from '../../src';

/**
 * The parameter contract an EXECUTOR binds to. `parsePrepared()` has three shapes, one per driver
 * family, and anything running SQLEasy output has to honour exactly these:
 *
 *   - Postgres        — `$1..$n` numbered placeholders + a real ordered `params[]`.
 *   - MySQL / SQLite  — positional `?` placeholders + a real ordered `params[]`.
 *   - MSSQL           — a self-contained `SET NOCOUNT ON; exec sp_executesql …;` batch with values
 *                       inlined as escaped `@pN = <literal>` arguments; `params` is ALWAYS `[]`.
 *                       (Still injection-safe: values are `''`-escaped and passed as sp_executesql
 *                       arguments, never concatenated into the statement text.)
 *
 * Per-clause ordering and single-statement binding are pinned in prepared_params.test.ts. This file
 * pins the two things an executor additionally depends on and nothing else covers:
 *   1. the MULTI-BUILDER execution contract — the multi-builder is NOT executable as one call;
 *   2. value-TYPE fidelity carried to the driver (and MSSQL's declared-type / literal inlining,
 *      including the one place it cannot round-trip a value).
 */

describe('multi-builder execution contract', () => {
  // Build the same two-statement batch for whichever dialect a test needs.
  const twoStatementBatch = (query: PostgresQuery | MysqlQuery | SqliteQuery | MssqlQuery) => {
    const multi = query.newMultiBuilder();
    const b1 = multi.addBuilder('ins');
    b1.insertInto('users').insertColumns(['name', 'age']).insertValues(['Ada', 36]);
    const b2 = multi.addBuilder('upd');
    b2.updateTable('stats', 's').set('n', 100).where('s', 'id', WhereOperator.Equals, 1);
    return { multi, b1, b2 };
  };

  it('MultiBuilder has no single-blob parsePrepared — preparedStatements() is the executable API', () => {
    const { multi } = twoStatementBatch(new PostgresQuery());
    // There is no single {sql, params} for a batch: parse()/parseRaw() are display-only and carry no
    // params, and numbering restarts per statement (next test). The executor consumes the per-builder
    // list instead.
    expect((multi as unknown as Record<string, unknown>)['parsePrepared']).toBeUndefined();
    expect(typeof multi.preparedStatements).toBe('function');
  });

  it('preparedStatements() returns each builder prepared, in order, without transaction delimiters', () => {
    const { multi } = twoStatementBatch(new PostgresQuery());
    const stmts = multi.preparedStatements();

    expect(stmts).toEqual([
      { sql: 'INSERT INTO "public"."users" ("name", "age") VALUES ($1, $2);', params: ['Ada', 36] },
      { sql: 'UPDATE "public"."stats" AS "s" SET "n" = $1 WHERE "s"."id" = $2;', params: [100, 1] },
    ]);
    // BEGIN/COMMIT wrapping is the executor's job (via transactionState()), never baked in here.
    for (const { sql } of stmts) {
      expect(sql).not.toMatch(/BEGIN|COMMIT/);
    }
  });

  it('preparedStatements() reflects reorder/remove and yields MSSQL self-contained batches', () => {
    const { multi } = twoStatementBatch(new MssqlQuery());
    multi.reorderBuilders(['upd', 'ins']);

    const stmts = multi.preparedStatements();
    expect(stmts).toHaveLength(2);
    expect(stmts[0]!.sql).toContain('UPDATE [s] SET'); // reordered: update first
    expect(stmts[1]!.sql).toContain('INSERT INTO [dbo].[users]');
    expect(stmts.every((s) => s.params.length === 0)).toBe(true); // mssql inlines, so params stay []
  });

  it('multi.parse() RESTARTS placeholder numbering per statement — so the batch string is not a runnable parameterized call (postgres)', () => {
    const { multi } = twoStatementBatch(new PostgresQuery());
    const sql = multi.parse();

    // Two independent statements, each numbered from $1 — so the batch contains $1 and $2 TWICE.
    // A driver binding one flat params[] to this string would misalign every value after the first
    // statement. This duplication is the tripwire: it is correct ONLY because each statement is
    // meant to run separately (see the per-builder test below), never as one prepared call.
    expect(sql).toBe(
      'BEGIN; INSERT INTO "public"."users" ("name", "age") VALUES ($1, $2);' +
        'UPDATE "public"."stats" AS "s" SET "n" = $1 WHERE "s"."id" = $2;COMMIT;',
    );
    expect(sql.split('$1').length - 1).toBe(2);
    expect(sql.split('$2').length - 1).toBe(2);
  });

  it('positional dialects likewise repeat ? per statement, not a single ?-sequence', () => {
    const { multi } = twoStatementBatch(new SqliteQuery());
    // INSERT has 2 placeholders, UPDATE has 2 → four ? total, but bound two-and-two per statement.
    expect(multi.parse().split('?').length - 1).toBe(4);
  });

  it('the executable path: each builder.parsePrepared() is an independently-bound statement (postgres)', () => {
    const { b1, b2 } = twoStatementBatch(new PostgresQuery());

    // Numbering restarts per builder ($1 in BOTH) — exactly what running them one-by-one needs.
    expect(b1.parsePrepared()).toEqual({
      sql: 'INSERT INTO "public"."users" ("name", "age") VALUES ($1, $2);',
      params: ['Ada', 36],
    });
    expect(b2.parsePrepared()).toEqual({
      sql: 'UPDATE "public"."stats" AS "s" SET "n" = $1 WHERE "s"."id" = $2;',
      params: [100, 1],
    });
  });

  it('MSSQL batch: each builder is its own self-contained sp_executesql with params []', () => {
    const { b1, b2 } = twoStatementBatch(new MssqlQuery());

    const p1 = b1.parsePrepared();
    expect(p1.params).toEqual([]);
    expect(p1.sql).toContain("exec sp_executesql N'INSERT INTO [dbo].[users]");
    expect(p1.sql).toContain("@p0 = N'Ada'");

    const p2 = b2.parsePrepared();
    expect(p2.params).toEqual([]);
    // Aliased UPDATE emits valid T-SQL (SET before FROM) — the executor runs this string as-is.
    expect(p2.sql).toContain('UPDATE [s] SET [n] = @p0 FROM [dbo].[stats] AS [s]');
  });
});

describe('value-type fidelity carried to the driver', () => {
  const build = (query: PostgresQuery | MysqlQuery | SqliteQuery) => {
    const b = query.newBuilder();
    b.selectAll()
      .fromTable('t', 't')
      .where('t', 's', WhereOperator.Equals, 'Ada')
      .and()
      .where('t', 'n', WhereOperator.GreaterThan, 30)
      .and()
      .where('t', 'b', WhereOperator.Equals, true)
      .and()
      .where('t', 'nul', WhereOperator.Equals, null)
      .and()
      .where('t', 'd', WhereOperator.GreaterThan, new Date('2024-01-02T03:04:05.000Z'));
    return b.parsePrepared();
  };

  it.each([
    { name: 'Postgres', query: () => new PostgresQuery() },
    { name: 'MySQL', query: () => new MysqlQuery() },
    { name: 'SQLite', query: () => new SqliteQuery() },
  ])('$name binds real JS values (string/number/boolean/Date) positionally', ({ query }) => {
    const { sql, params } = build(query());

    // Equals + null → IS NULL (no bound param); remaining values stay aligned.
    expect(sql).toContain('IS NULL');
    expect(params).toHaveLength(4);
    expect(params[0]).toBe('Ada');
    expect(params[1]).toBe(30);
    expect(params[2]).toBe(true);
    // A Date is handed through as a Date instance (the driver binds it), never pre-stringified.
    expect(params[3]).toBeInstanceOf(Date);
    expect((params[3] as Date).toISOString()).toBe('2024-01-02T03:04:05.000Z');
  });

  it('MSSQL declares a T-SQL type per value and inlines an escaped literal (params stays [])', () => {
    const b = new MssqlQuery().newBuilder();
    b.selectAll()
      .fromTable('t', 't')
      .where('t', 'a', WhereOperator.Equals, 7) // 0..255 → tinyint
      .and()
      .where('t', 'b', WhereOperator.Equals, -5) // → smallint
      .and()
      .where('t', 'c', WhereOperator.Equals, 100000) // → int
      .and()
      .where('t', 'd', WhereOperator.Equals, 5000000000) // → bigint
      .and()
      .where('t', 'e', WhereOperator.Equals, 3.14) // non-integer → float
      .and()
      .where('t', 'f', WhereOperator.Equals, false) // → bit
      .and()
      .where('t', 'g', WhereOperator.Equals, 'hi'); // → nvarchar(max)

    const { sql, params } = b.parsePrepared();

    expect(params).toEqual([]);
    expect(sql).toContain(
      "N'@p0 tinyint, @p1 smallint, @p2 int, @p3 bigint, @p4 float, @p5 bit, @p6 nvarchar(max)'",
    );
    expect(sql).toContain('@p5 = 0'); // boolean false → bit 0
    expect(sql).toContain("@p6 = N'hi'");
  });

  it('MSSQL Equals + null emits IS NULL with no sp_executesql parameter', () => {
    const b = new MssqlQuery().newBuilder();
    b.selectAll().fromTable('t', 't').where('t', 'x', WhereOperator.Equals, null);
    const { sql, params } = b.parsePrepared();
    expect(sql).toContain('[t].[x] IS NULL');
    expect(sql).not.toContain('@p0');
    expect(params).toEqual([]);
  });

  it('MSSQL inlines Buffer as varbinary hex literal', () => {
    const b = new MssqlQuery().newBuilder();
    b.selectAll()
      .fromTable('t', 't')
      .where('t', 'blob', WhereOperator.Equals, Buffer.from([1, 2, 3]));
    const { sql } = b.parsePrepared();
    expect(sql).toContain('@p0 varbinary(max)');
    expect(sql).toContain('@p0 = 0x010203');
  });
});
