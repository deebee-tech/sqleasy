import { describe, expect, it } from 'vitest';
import {
  MssqlQuery,
  MultiBuilderTransactionState,
  MysqlQuery,
  PostgresQuery,
  RuntimeConfiguration,
  SqliteQuery,
  WhereOperator,
} from '../../src';

/**
 * `preparedStatements()` renders each statement on its own, and placeholder numbering restarts in
 * every one — correct when you run them one at a time, and a misbinding waiting to happen if you
 * concatenate them. `preparedBatch()` is the other half: ONE statement, numbered continuously.
 *
 * It is MSSQL-only on purpose. `sp_executesql` takes a `;`-joined batch plus a single parameter
 * list every statement can see; the other three run one statement per prepared call, so there is no
 * honest batch to emit and the call refuses instead.
 */
const boundMssql = () => {
  const rc = new RuntimeConfiguration();
  rc.mssqlBoundParameters = true;
  return new MssqlQuery(rc);
};

const twoStatements = (multi: ReturnType<MssqlQuery['newMultiBuilder']>) => {
  const count = multi.addBuilder('count');
  count
    .selectRaw('COUNT(*) AS [total]')
    .fromTable('contacts', 'c')
    .where('c', 'campus_id', WhereOperator.Equals, 10);

  const page = multi.addBuilder('page');
  page
    .selectAll()
    .fromTable('contacts', 'c')
    .where('c', 'campus_id', WhereOperator.Equals, 10)
    .and()
    .where('c', 'status_id', WhereOperator.Equals, 3);
};

describe('MultiBuilder.preparedBatch', () => {
  it('numbers placeholders continuously across statements and concatenates the values', () => {
    const multi = boundMssql().newMultiBuilder();
    multi.setTransactionState(MultiBuilderTransactionState.TransactionOff);
    twoStatements(multi);

    const { sql, params } = multi.preparedBatch();

    // The collision this exists to prevent: without the offset the second statement would restart
    // at @p0 and silently read the first statement's value.
    expect(sql).toContain('[c].[campus_id] = @p0');
    expect(sql).toContain('[c].[campus_id] = @p1');
    expect(sql).toContain('[c].[status_id] = @p2');
    expect(params).toEqual([10, 10, 3]);

    // Every placeholder in the batch is distinct and covered by exactly one value.
    const used = [...sql.matchAll(/@p(\d+)/g)].map((m) => Number(m[1]));
    expect(new Set(used).size).toBe(params.length);
    expect(Math.max(...used)).toBe(params.length - 1);
  });

  it('includes the transaction delimiters, unlike preparedStatements', () => {
    const multi = boundMssql().newMultiBuilder();
    twoStatements(multi);

    const { sql } = multi.preparedBatch();

    expect(sql.startsWith('BEGIN TRANSACTION; ')).toBe(true);
    expect(sql.endsWith('COMMIT TRANSACTION;')).toBe(true);
  });

  it('carries no params under the default inlined form — each statement is self-contained', () => {
    const multi = new MssqlQuery().newMultiBuilder();
    multi.setTransactionState(MultiBuilderTransactionState.TransactionOff);
    twoStatements(multi);

    const { sql, params } = multi.preparedBatch();

    expect(params).toEqual([]);
    expect(sql).toContain('sp_executesql');
    // Two self-contained statements, so two wrappers — nothing to renumber between them.
    expect(sql.match(/sp_executesql/g)).toHaveLength(2);
  });

  it.each([
    { name: 'Postgres', query: () => new PostgresQuery() },
    { name: 'MySQL', query: () => new MysqlQuery() },
    { name: 'SQLite', query: () => new SqliteQuery() },
  ])('$name refuses rather than emitting a batch it cannot run', ({ query }) => {
    const multi = query().newMultiBuilder();
    const b1 = multi.addBuilder('b1');
    b1.selectAll().fromTable('users', 'u').where('u', 'id', WhereOperator.Equals, 1);

    expect(() => multi.preparedBatch()).toThrow(/only executable on MSSQL/);
  });

  it('leaves preparedStatements restarting per statement, as documented', () => {
    const multi = boundMssql().newMultiBuilder();
    multi.setTransactionState(MultiBuilderTransactionState.TransactionOff);
    twoStatements(multi);

    const statements = multi.preparedStatements();

    expect(statements).toHaveLength(2);
    // Each is independently runnable — which is precisely why they cannot be concatenated.
    expect(statements[0]!.sql).toContain('@p0');
    expect(statements[1]!.sql).toContain('@p0');
    expect(statements[0]!.params).toEqual([10]);
    expect(statements[1]!.params).toEqual([10, 3]);
  });
});
