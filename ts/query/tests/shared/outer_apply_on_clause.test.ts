import { describe, expect, it } from 'vitest';
import { MssqlQuery, MysqlQuery, PostgresQuery, SqliteQuery } from '../../src';

// MSSQL's `OUTER APPLY` carries its own join semantics and takes no ON clause. Postgres and MySQL
// express the same thing as `LEFT JOIN LATERAL` — but a LEFT JOIN *requires* ON or USING, and an
// APPLY has no ON conditions by construction, so `defaultJoinOns` returned empty and the statement
// went out with no ON at all. Neither engine can parse that.
//
// The corpus pinned the broken form green, because it was only ever checked against our own
// emitter. `CROSS JOIN LATERAL` was never affected: a CROSS JOIN takes no ON.
describe('joinOuterApply emits a complete join', () => {
  const build = (make: () => ReturnType<MssqlQuery['newBuilder']>) => {
    const b = make();
    b.selectAll()
      .fromTable('orders', 'o')
      .joinOuterApply('x', (inner) => {
        inner.selectColumn('li', 'sku', '').fromTable('line_items', 'li');
      });
    return b;
  };

  it('Postgres closes the LEFT JOIN LATERAL with ON TRUE', () => {
    const sql = build(() => new PostgresQuery().newBuilder()).parseRaw();
    expect(sql).toContain('LEFT JOIN LATERAL');
    expect(sql).toContain('ON TRUE');
    expect(sql).toMatch(/AS "x" ON TRUE;$/);
  });

  it('MySQL closes the LEFT JOIN LATERAL with ON TRUE', () => {
    const sql = build(() => new MysqlQuery().newBuilder()).parseRaw();
    expect(sql).toContain('LEFT JOIN LATERAL');
    expect(sql).toMatch(/AS `x` ON TRUE;$/);
  });

  it('MSSQL uses OUTER APPLY, which takes no ON clause', () => {
    const sql = build(() => new MssqlQuery().newBuilder()).parseRaw();
    expect(sql).toContain('OUTER APPLY');
    expect(sql).not.toContain('ON TRUE');
    expect(sql).not.toContain('LATERAL');
  });

  it('SQLite refuses — it has no LATERAL or APPLY', () => {
    const b = build(() => new SqliteQuery().newBuilder());
    expect(() => b.parseRaw()).toThrow(/SQLite does not support OUTER APPLY/);
  });
});

// The sibling construct, pinned so the ON TRUE fix cannot leak into it. CROSS APPLY translates to
// CROSS JOIN LATERAL, and a CROSS JOIN never accepts an ON clause — adding one would be a syntax
// error, the same class of bug in the opposite direction.
describe('joinCrossApply takes no ON clause', () => {
  const build = (make: () => ReturnType<MssqlQuery['newBuilder']>) => {
    const b = make();
    b.selectAll()
      .fromTable('orders', 'o')
      .joinCrossApply('x', (inner) => {
        inner.selectColumn('li', 'sku', '').fromTable('line_items', 'li');
      });
    return b;
  };

  it('Postgres emits CROSS JOIN LATERAL with no ON', () => {
    const sql = build(() => new PostgresQuery().newBuilder()).parseRaw();
    expect(sql).toContain('CROSS JOIN LATERAL');
    expect(sql).not.toContain('ON TRUE');
  });

  it('MySQL emits CROSS JOIN LATERAL with no ON', () => {
    const sql = build(() => new MysqlQuery().newBuilder()).parseRaw();
    expect(sql).toContain('CROSS JOIN LATERAL');
    expect(sql).not.toContain('ON TRUE');
  });

  it('MSSQL emits CROSS APPLY', () => {
    const sql = build(() => new MssqlQuery().newBuilder()).parseRaw();
    expect(sql).toContain('CROSS APPLY');
    expect(sql).not.toContain('ON TRUE');
  });
});
