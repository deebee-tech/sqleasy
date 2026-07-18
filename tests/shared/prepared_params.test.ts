import { describe, expect, it } from 'vitest';
import {
  JoinOperator,
  JoinType,
  MssqlQuery,
  MysqlQuery,
  PostgresQuery,
  SqliteQuery,
  WhereOperator,
} from '../../src';

/**
 * `parsePrepared()` is the only execution-safe API — it is what a driver actually receives — yet the
 * suite asserted it exactly once, against `parseRaw()`'s ~558. `parseRaw()` inlines values UNQUOTED
 * and is explicitly not execution-safe, so it can only ever check the *shape* of the SQL; it cannot
 * catch a value bound to the wrong placeholder, dropped, or duplicated. Every regression that has
 * actually bitten this library (a subquery's value dropped from `params`, the placeholder walk
 * corrupting raw fragments) lived in that gap.
 *
 * These assert the `(sql, params)` pair: placeholder count, ordering, and exact bound values.
 */
describe('prepared statements bind their parameters correctly', () => {
  describe('placeholder style per dialect', () => {
    it('Postgres numbers placeholders $1..$n in emission order', () => {
      const builder = new PostgresQuery().newBuilder();
      builder
        .selectAll()
        .fromTable('users', 'u')
        .where('u', 'a', WhereOperator.Equals, 'first')
        .and()
        .where('u', 'b', WhereOperator.GreaterThan, 2)
        .and()
        .where('u', 'c', WhereOperator.LessThan, 3);

      const { sql, params } = builder.parsePrepared();

      expect(sql).toBe(
        'SELECT * FROM "public"."users" AS "u" WHERE "u"."a" = $1 AND "u"."b" > $2 AND "u"."c" < $3;',
      );
      expect(params).toEqual(['first', 2, 3]);
    });

    it.each([
      { name: 'MySQL', query: () => new MysqlQuery() },
      { name: 'SQLite', query: () => new SqliteQuery() },
    ])('$name binds positionally with ?', ({ query }) => {
      const builder = query().newBuilder();
      builder
        .selectAll()
        .fromTable('users', 'u')
        .where('u', 'a', WhereOperator.Equals, 'first')
        .and()
        .where('u', 'b', WhereOperator.Equals, 2);

      const { sql, params } = builder.parsePrepared();

      expect(sql.split('?').length - 1).toBe(2);
      expect(params).toEqual(['first', 2]);
    });

    it('MSSQL inlines into sp_executesql and therefore binds no params', () => {
      const builder = new MssqlQuery().newBuilder();
      builder.selectAll().fromTable('users', 'u').where('u', 'a', WhereOperator.Equals, 'first');

      const { sql, params } = builder.parsePrepared();

      expect(sql).toContain("@p0 = N'first'");
      expect(params).toEqual([]);
    });
  });

  describe('parameter ordering across clauses', () => {
    // Values must be bound in the order their placeholders are emitted — clause by clause, not in
    // the order the builder methods were called.
    it('binds CTE, JOIN, WHERE, GROUP BY/HAVING and LIMIT values in emission order', () => {
      const builder = new PostgresQuery().newBuilder();
      builder
        .cte('recent', (cb) => {
          cb.selectAll()
            .fromTable('orders', 'o')
            .where('o', 'status', WhereOperator.Equals, 'cte-value');
        })
        .selectColumn('u', 'id', '')
        .selectRaw('COUNT(*) AS cnt')
        .fromTable('users', 'u')
        .joinTable(JoinType.Inner, 'orders', 'o', (j) => {
          j.on('u', 'id', JoinOperator.Equals, 'o', 'user_id')
            .and()
            .onValue('o', 'kind', JoinOperator.Equals, 'join-value');
        })
        .where('u', 'active', WhereOperator.Equals, 'where-value')
        .groupByColumn('u', 'id')
        .having('u', 'id', WhereOperator.GreaterThan, 'having-value');

      const { params } = builder.parsePrepared();

      expect(params).toEqual(['cte-value', 'join-value', 'where-value', 'having-value']);
    });

    it('carries a subquery value into params (regression: it used to be dropped)', () => {
      const builder = new PostgresQuery().newBuilder();
      builder
        .selectAll()
        .fromTable('users', 'u')
        .whereInWithBuilder('u', 'id', (sb) => {
          sb.selectColumn('o', 'user_id', '')
            .fromTable('orders', 'o')
            .where('o', 'total', WhereOperator.GreaterThan, 100);
        })
        .and()
        .where('u', 'active', WhereOperator.Equals, true);

      const { sql, params } = builder.parsePrepared();

      expect(sql).toContain('$1');
      expect(sql).toContain('$2');
      expect(params).toEqual([100, true]);
    });

    it('binds every value of an IN list, in order', () => {
      const builder = new PostgresQuery().newBuilder();
      builder.selectAll().fromTable('users', 'u').whereInValues('u', 'id', [10, 20, 30]);

      const { sql, params } = builder.parsePrepared();

      expect(sql).toContain('IN ($1, $2, $3)');
      expect(params).toEqual([10, 20, 30]);
    });

    it('binds BETWEEN bounds in order', () => {
      const builder = new PostgresQuery().newBuilder();
      builder.selectAll().fromTable('users', 'u').whereBetween('u', 'age', 18, 65);

      const { sql, params } = builder.parsePrepared();

      expect(sql).toContain('BETWEEN $1 AND $2');
      expect(params).toEqual([18, 65]);
    });
  });

  describe('values are bound, never interpolated', () => {
    it('a quote in a value cannot escape into the SQL', () => {
      const builder = new PostgresQuery().newBuilder();
      const nasty = "'; DROP TABLE users; --";
      builder.selectAll().fromTable('users', 'u').where('u', 'name', WhereOperator.Equals, nasty);

      const { sql, params } = builder.parsePrepared();

      expect(sql).not.toContain('DROP TABLE');
      expect(sql).toContain('"u"."name" = $1');
      expect(params).toEqual([nasty]);
    });

    it('Equals + null emits IS NULL with no bound param; later params stay aligned', () => {
      const builder = new PostgresQuery().newBuilder();
      builder
        .selectAll()
        .fromTable('users', 'u')
        .where('u', 'a', WhereOperator.Equals, null)
        .and()
        .where('u', 'b', WhereOperator.Equals, 'after');

      const { sql, params } = builder.parsePrepared();

      // Null is not bound — `= NULL` is never true; IS NULL needs no placeholder.
      expect(sql).toContain('"u"."a" IS NULL');
      expect(sql).toContain('"u"."b" = $1');
      expect(params).toEqual(['after']);
    });
  });

  describe('INSERT and UPDATE bind their values', () => {
    it('INSERT binds each column value in column order', () => {
      const builder = new PostgresQuery().newBuilder();
      builder.insertInto('users').insertColumns(['name', 'age']).insertValues(['Ada', 36]);

      const { sql, params } = builder.parsePrepared();

      expect(sql).toContain('$1');
      expect(sql).toContain('$2');
      expect(params).toEqual(['Ada', 36]);
    });

    it('UPDATE binds SET values before WHERE values', () => {
      const builder = new PostgresQuery().newBuilder();
      builder
        .updateTable('users', 'u')
        .set('name', 'Ada')
        .where('u', 'id', WhereOperator.Equals, 7);

      const { params } = builder.parsePrepared();

      expect(params).toEqual(['Ada', 7]);
    });
  });
});
