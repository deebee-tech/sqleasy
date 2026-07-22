import { describe, expect, it } from 'vitest';
import { MssqlQuery } from '../../src/dialects/mssql/query';
import { MysqlQuery } from '../../src/dialects/mysql/query';
import { PostgresQuery } from '../../src/dialects/postgres/query';
import { SqliteQuery } from '../../src/dialects/sqlite/query';
import { OrderByDirection } from '../../src/enums/order-by-direction';

/**
 * A clause set on a set-operation BRANCH must bind to that branch.
 *
 * Through 12.0.0 it did not. A branch's `ORDER BY` / `LIMIT` was emitted in the right textual place
 * but with no parentheses, so it bound to the whole compound:
 *
 *     .unionAll(u => u.fromTable('b','').selectAll().limit(3))
 *     ->  SELECT * FROM "a" UNION ALL SELECT * FROM "b" LIMIT 3
 *
 * That caps the UNION, not the branch. Measured against the harness on a 3-row table: the old SQL
 * returned 1 row, the parenthesized form returns 4 (3 + the branch's 1) — which is what the caller
 * wrote. There was no error either way, which is what made it dangerous. Adding an outer `.limit(99)`
 * made it `LIMIT 3 LIMIT 99`, which Postgres, MySQL and SQLite all reject outright.
 *
 * Only two dialects can express this. Measured:
 *
 *     Postgres 17 / MySQL 8.4   … UNION ALL (SELECT … LIMIT 3)   accepted
 *     MSSQL 2022                parenthesized operand            Msg 156
 *                               per-operand ORDER BY             Msg 156
 *                               SELECT TOP (3) … UNION ALL …     accepted — caps the operand
 *     SQLite 3.51               parenthesized operand            near "(": syntax error
 *                               LIMIT before the set operator    "should come after UNION ALL"
 */

const branch =
  (mutate: (u: never) => void) =>
  (b: any): void => {
    b.fromTable('users', '')
      .selectAll()
      .unionAll((u: any) => {
        u.fromTable('admins', '').selectAll();
        mutate(u as never);
      });
  };

describe('a set-operation branch clause binds to the branch', () => {
  describe('Postgres and MySQL parenthesize the operand', () => {
    it('scopes a branch LIMIT', () => {
      const pg = new PostgresQuery().newBuilder();
      branch((u: any) => u.limit(3))(pg);
      expect(pg.parsePrepared().sql).toBe(
        'SELECT * FROM "public"."users" UNION ALL (SELECT * FROM "public"."admins" LIMIT 3);',
      );

      const my = new MysqlQuery().newBuilder();
      branch((u: any) => u.limit(3))(my);
      expect(my.parsePrepared().sql).toBe(
        'SELECT * FROM `users` UNION ALL (SELECT * FROM `admins` LIMIT 3);',
      );
    });

    it('scopes a branch ORDER BY together with its LIMIT', () => {
      const pg = new PostgresQuery().newBuilder();
      branch((u: any) => u.orderByColumn('', 'id', OrderByDirection.Descending).limit(3))(pg);
      expect(pg.parsePrepared().sql).toContain(
        '(SELECT * FROM "public"."admins" ORDER BY "id" DESC LIMIT 3)',
      );
    });

    it('composes with an outer limit instead of emitting two LIMIT clauses', () => {
      const pg = new PostgresQuery().newBuilder();
      branch((u: any) => u.limit(3))(pg);
      pg.limit(99);

      const { sql } = pg.parsePrepared();
      expect(sql).toBe(
        'SELECT * FROM "public"."users" UNION ALL (SELECT * FROM "public"."admins" LIMIT 3) LIMIT 99;',
      );
      // The shape that used to come out — two bare LIMITs — is a syntax error on this engine.
      expect(sql).not.toMatch(/LIMIT 3 LIMIT 99/);
    });
  });

  describe('SQLite and MSSQL refuse, because neither can express it', () => {
    it('SQLite refuses a branch LIMIT and points at a CTE', () => {
      const b = new SqliteQuery().newBuilder();
      branch((u: any) => u.limit(3))(b);
      expect(() => b.parsePrepared()).toThrow(/SQLite cannot scope LIMIT to one branch/);
      expect(() => b.parsePrepared()).toThrow(/CTE or a derived table/);
    });

    it('MSSQL refuses a branch ORDER BY and points at top()', () => {
      const b = new MssqlQuery().newBuilder();
      branch((u: any) => u.orderByColumn('', 'id', OrderByDirection.Descending))(b);
      expect(() => b.parsePrepared()).toThrow(/MSSQL cannot scope ORDER BY to one branch/);
      expect(() => b.parsePrepared()).toThrow(/top\(n\)/);
    });

    // MSSQL's one real branch-level cap. It needs no parentheses and was never broken.
    it('MSSQL still emits a branch TOP, which genuinely caps the operand', () => {
      const b = new MssqlQuery().newBuilder();
      branch((u: any) => u.top(3))(b);
      expect(b.parsePrepared().sql).toContain('UNION ALL SELECT TOP (3) * FROM [dbo].[admins]');
    });
  });

  describe('unscoped branches are untouched — no stray parentheses', () => {
    for (const engine of [
      { name: 'postgres', make: () => new PostgresQuery() },
      { name: 'mysql', make: () => new MysqlQuery() },
      { name: 'sqlite', make: () => new SqliteQuery() },
    ]) {
      it(`${engine.name} emits a plain operand when the branch carries no scoping clause`, () => {
        const b = engine.make().newBuilder();
        branch(() => {})(b);
        expect(b.parsePrepared().sql).not.toContain('(SELECT');
      });
    }

    it('an outer limit alone still applies to the whole result', () => {
      const b = new PostgresQuery().newBuilder();
      branch(() => {})(b);
      b.limit(99);
      expect(b.parsePrepared().sql).toBe(
        'SELECT * FROM "public"."users" UNION ALL SELECT * FROM "public"."admins" LIMIT 99;',
      );
    });
  });
});
