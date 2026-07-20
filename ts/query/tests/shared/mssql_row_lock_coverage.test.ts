import { describe, expect, it } from 'vitest';
import { JoinOperator, JoinType, MssqlQuery, PostgresQuery } from '../../src';

// MSSQL has no `FOR UPDATE` clause. Its nearest equivalent is a `WITH (...)` hint, and T-SQL's
// `table_hint` production attaches to a `table_or_view_name` — ONE table reference, not the
// statement. Through 10.x the hint was emitted only inside the FROM-table branch, so:
//
//   forUpdate() + joinTable(...)   -> base table locked, JOINED TABLE NOT LOCKED
//   forUpdate() + a derived table  -> no hint emitted ANYWHERE
//
// Both were silent. The caller got rows they believed were locked and which were actually read at
// plain READ COMMITTED — a data-integrity bug, not a syntax one, so nothing ever failed loudly.
//
// The corpus could not have caught it: of its 322 cases, 8 use a row lock and NONE of those
// combines one with a join or a non-table FROM. These assertions are the only coverage that exists.
describe('MSSQL row locks reach every table reference', () => {
  const joined = () => {
    const b = new MssqlQuery().newBuilder();
    b.selectAll()
      .fromTable('orders', 'o')
      .joinTable(JoinType.Inner, 'customers', 'c', (j) =>
        j.on('c', 'id', JoinOperator.Equals, 'o', 'customer_id'),
      )
      .updlock();
    return b;
  };

  it('locks the joined table, not just the FROM table', () => {
    const sql = joined().parseRaw();
    // Two hints: one per table reference.
    expect(sql.match(/WITH \(UPDLOCK, ROWLOCK\)/g)).toHaveLength(2);
    expect(sql).toContain('[dbo].[orders] AS [o] WITH (UPDLOCK, ROWLOCK)');
    expect(sql).toContain('[dbo].[customers] AS [c] WITH (UPDLOCK, ROWLOCK)');
  });

  it('places the joined hint before its ON clause', () => {
    const sql = joined().parseRaw();
    expect(sql).toMatch(/\[c\] WITH \(UPDLOCK, ROWLOCK\) ON /);
  });

  it('carries the wait mode onto the joined table too', () => {
    const b = new MssqlQuery().newBuilder();
    b.selectAll()
      .fromTable('orders', 'o')
      .joinTable(JoinType.Inner, 'customers', 'c', (j) =>
        j.on('c', 'id', JoinOperator.Equals, 'o', 'customer_id'),
      )
      .updlockSkipLocked();
    const sql = b.parseRaw();
    expect(sql.match(/READPAST/g)).toHaveLength(2);
  });
});

// Where T-SQL has nowhere to put a hint, emitting nothing is the bug. Refusing is the honest answer:
// the caller asked for a lock the engine cannot give at that position.
describe('MSSQL refuses a row lock it cannot place', () => {
  it('refuses on a derived table in FROM', () => {
    const b = new MssqlQuery().newBuilder();
    b.selectAll()
      .fromWithBuilder('sub', (inner) => {
        inner.selectAll().fromTable('orders', 'o');
      })
      .updlock();
    expect(() => b.parseRaw()).toThrow(/MSSQL cannot lock a derived table/);
  });

  it('refuses on a raw FROM fragment', () => {
    const b = new MssqlQuery().newBuilder();
    b.selectAll().fromRaw('[dbo].[orders] AS [o]').updlock();
    expect(() => b.parseRaw()).toThrow(/MSSQL cannot lock a raw FROM fragment/);
  });

  it('refuses on a table-valued function', () => {
    const b = new MssqlQuery().newBuilder();
    b.selectAll().fromTableFunction('generate_series', 'g', [1, 10]).updlock();
    expect(() => b.parseRaw()).toThrow(/MSSQL cannot lock a table-valued function/);
  });

  it('refuses on a joined derived table', () => {
    const b = new MssqlQuery().newBuilder();
    b.selectAll()
      .fromTable('orders', 'o')
      .joinWithBuilder(
        JoinType.Inner,
        'c',
        (inner) => {
          inner.selectAll().fromTable('customers', 'c2');
        },
        (j) => j.on('c', 'id', JoinOperator.Equals, 'o', 'customer_id'),
      )
      .updlock();
    expect(() => b.parseRaw()).toThrow(/MSSQL cannot lock a joined derived table/);
  });

  it('still allows a plain table with no join', () => {
    const b = new MssqlQuery().newBuilder();
    b.selectAll().fromTable('orders', 'o').updlock();
    expect(b.parseRaw()).toContain('WITH (UPDLOCK, ROWLOCK)');
  });
});

// Postgres and MySQL are unaffected by any of this: their FOR UPDATE is a statement-level clause
// that locks every table the statement reads, so it needs no per-source placement and no refusal.
describe('Postgres row locks are statement-level', () => {
  it('emits one trailing FOR UPDATE regardless of joins', () => {
    const b = new PostgresQuery().newBuilder();
    b.selectAll()
      .fromTable('orders', 'o')
      .joinTable(JoinType.Inner, 'customers', 'c', (j) =>
        j.on('c', 'id', JoinOperator.Equals, 'o', 'customer_id'),
      )
      .forUpdate();
    const sql = b.parseRaw();
    expect(sql.match(/FOR UPDATE/g)).toHaveLength(1);
    expect(sql).toMatch(/FOR UPDATE;$/);
  });

  it('does not refuse a derived table', () => {
    const b = new PostgresQuery().newBuilder();
    b.selectAll()
      .fromWithBuilder('sub', (inner) => {
        inner.selectAll().fromTable('orders', 'o');
      })
      .forUpdate();
    expect(b.parseRaw()).toContain('FOR UPDATE');
  });
});
