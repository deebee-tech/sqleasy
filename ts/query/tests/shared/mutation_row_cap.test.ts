import { describe, expect, it } from 'vitest';
import { MssqlQuery } from '../../src/dialects/mssql/query';
import { MysqlQuery } from '../../src/dialects/mysql/query';
import { PostgresQuery } from '../../src/dialects/postgres/query';
import { SqliteQuery } from '../../src/dialects/sqlite/query';
import { JoinOperator } from '../../src/enums/join-operator';
import { JoinType } from '../../src/enums/join-type';
import { OrderByDirection } from '../../src/enums/order-by-direction';
import { WhereOperator } from '../../src/enums/where-operator';

/**
 * Row-capping an UPDATE or DELETE.
 *
 * Through 11.0.0 `.limit()`, `.offset()`, `.top()` and `.orderByColumn()` were all reachable on a
 * mutation and ALL FOUR were silently dropped — `.limit(1000)` on a DELETE produced no clause, no
 * parameter and no error, so the statement deleted the whole table. The emitted SQL below was
 * measured against the harness; the refusals are the cases the engines reject.
 *
 * The corpus pins the emitted text; this suite is the independent, hand-written check.
 */

describe('row-capping a mutation', () => {
  describe('MySQL — a real trailing ORDER BY / LIMIT', () => {
    const mysql = () => new MysqlQuery().newBuilder();

    it('caps a DELETE with a trailing LIMIT', () => {
      const b = mysql();
      b.deleteFrom('orders', '').where('', 'total', WhereOperator.Equals, 1).limit(10);
      expect(b.parsePrepared().sql).toBe('DELETE FROM `orders` WHERE `total` = ? LIMIT 10;');
    });

    it('orders and caps an UPDATE', () => {
      const b = mysql();
      b.updateTable('orders', '')
        .set('note', 'x')
        .orderByColumn('', 'id', OrderByDirection.Ascending)
        .limit(10);
      expect(b.parsePrepared().sql).toBe(
        'UPDATE `orders` SET `note` = ? ORDER BY `id` ASC LIMIT 10;',
      );
    });

    it('takes ORDER BY alone, with no LIMIT', () => {
      const b = mysql();
      b.updateTable('orders', '')
        .set('note', 'x')
        .orderByColumn('', 'id', OrderByDirection.Ascending);
      expect(b.parsePrepared().sql).toContain('ORDER BY `id` ASC');
    });

    // ERROR 1221 "Incorrect usage of UPDATE and LIMIT" — measured.
    it('refuses a row cap on a MULTI-TABLE mutation', () => {
      const b = mysql();
      b.deleteFrom('orders', 'o')
        .joinTable(JoinType.Inner, 'customers', 'c', (j) =>
          j.on('c', 'id', JoinOperator.Equals, 'o', 'customer_id'),
        )
        .limit(1);
      expect(() => b.parsePrepared()).toThrow(/multi-table UPDATE\/DELETE \(ERROR 1221\)/);
    });
  });

  describe('MSSQL — TOP (n) between the verb and the target', () => {
    const mssql = () => new MssqlQuery().newBuilder();

    it('caps an UPDATE', () => {
      const b = mssql();
      b.updateTable('orders', '').set('note', 'x').top(3);
      expect(b.parsePrepared().sql).toContain('UPDATE TOP (3) [dbo].[orders]');
    });

    it('caps a DELETE', () => {
      const b = mssql();
      b.deleteFrom('orders', '').top(3);
      expect(b.parsePrepared().sql).toContain('DELETE TOP (3) FROM [dbo].[orders]');
    });

    it('refuses limit(), pointing at top()', () => {
      const b = mssql();
      b.deleteFrom('orders', '').limit(3);
      expect(() => b.parsePrepared()).toThrow(/caps a mutation with TOP, not LIMIT — use top\(n\)/);
    });

    // Msg 156 "Incorrect syntax near 'ORDER'" — measured.
    it('refuses ORDER BY, because TOP without one picks arbitrary rows', () => {
      const b = mssql();
      b.updateTable('orders', '')
        .set('note', 'x')
        .top(3)
        .orderByColumn('', 'id', OrderByDirection.Ascending);
      expect(() => b.parsePrepared()).toThrow(/T-SQL takes no ORDER BY on an UPDATE\/DELETE/);
    });
  });

  describe('the two dialects with no mutation row cap refuse rather than emulate', () => {
    it('Postgres refuses, and names the rewrite it will not do', () => {
      const b = new PostgresQuery().newBuilder();
      b.deleteFrom('orders', '').limit(10);
      expect(() => b.parsePrepared()).toThrow(/Postgres has no row limit on UPDATE\/DELETE/);
      expect(() => b.parsePrepared()).toThrow(/ctid\/CTE rewrite is an emulation/);
    });

    it('SQLite refuses, and names the compile flag', () => {
      const b = new SqliteQuery().newBuilder();
      b.updateTable('orders', '').set('note', 'x').limit(10);
      expect(() => b.parsePrepared()).toThrow(/SQLITE_ENABLE_UPDATE_DELETE_LIMIT/);
    });
  });

  // MySQL — the only engine with a mutation LIMIT — rejects `LIMIT 1 OFFSET 1` with ERROR 1064.
  it('offset() is refused on a mutation on every dialect', () => {
    for (const engine of [
      new PostgresQuery(),
      new MysqlQuery(),
      new SqliteQuery(),
      new MssqlQuery(),
    ]) {
      const b = engine.newBuilder();
      (b as any).deleteFrom('orders', '').offset(1);
      expect(() => b.parsePrepared()).toThrow(/offset\(\) has no meaning on UPDATE\/DELETE/);
    }
  });

  it('a mutation with no row cap is unchanged', () => {
    const b = new PostgresQuery().newBuilder();
    b.deleteFrom('orders', '').where('', 'total', WhereOperator.Equals, 1);
    expect(b.parsePrepared().sql).toBe('DELETE FROM "public"."orders" WHERE "total" = $1;');
  });
});
