import { describe, expect, it } from 'vitest';
import { MssqlQuery, MysqlQuery, PostgresQuery, SqliteQuery, WhereOperator } from '../../src';

const dialects = () => [
  { name: 'mssql', query: new MssqlQuery() },
  { name: 'mysql', query: new MysqlQuery() },
  { name: 'postgres', query: new PostgresQuery() },
  { name: 'sqlite', query: new SqliteQuery() },
];

/** Values that have no SQL literal used to render as invalid SQL and fail at the driver instead. */
describe('value guards', () => {
  describe('empty IN / NOT IN', () => {
    it.each(dialects())(
      '$name: IN with no values is refused, not emitted as IN ()',
      ({ query }) => {
        const builder = query.newBuilder();
        builder.selectAll().fromTable('users', 'u').whereInValues('u', 'id', []);

        expect(() => builder.parse()).toThrow(/IN requires at least one value/);
      },
    );

    it.each(dialects())('$name: NOT IN with no values is refused', ({ query }) => {
      const builder = query.newBuilder();
      builder.selectAll().fromTable('users', 'u').whereNotInValues('u', 'id', []);

      expect(() => builder.parse()).toThrow(/NOT IN requires at least one value/);
    });

    it.each(dialects())('$name: IN with values still renders', ({ query }) => {
      const builder = query.newBuilder();
      builder.selectAll().fromTable('users', 'u').whereInValues('u', 'id', [1, 2, 3]);

      expect(() => builder.parse()).not.toThrow();
    });
  });

  describe('non-finite numbers', () => {
    it.each(dialects())('$name: NaN is refused, not emitted as the bare word NaN', ({ query }) => {
      const builder = query.newBuilder();
      builder.selectAll().fromTable('users', 'u').where('u', 'x', WhereOperator.Equals, NaN);

      expect(() => builder.parse()).toThrow(/not a finite number/);
      expect(() => builder.parseRaw()).toThrow(/not a finite number/);
    });

    it.each(dialects())('$name: Infinity is refused', ({ query }) => {
      const builder = query.newBuilder();
      builder.selectAll().fromTable('users', 'u').where('u', 'x', WhereOperator.Equals, Infinity);

      expect(() => builder.parse()).toThrow(/not a finite number/);
    });
  });
});
