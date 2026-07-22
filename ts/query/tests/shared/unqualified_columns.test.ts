import { describe, expect, it } from 'vitest';
import { MssqlQuery } from '../../src/dialects/mssql/query';
import { MysqlQuery } from '../../src/dialects/mysql/query';
import { PostgresQuery } from '../../src/dialects/postgres/query';
import { SqliteQuery } from '../../src/dialects/sqlite/query';
import { OrderByDirection } from '../../src/enums/order-by-direction';
import { WhereOperator } from '../../src/enums/where-operator';

/**
 * An empty alias means "unqualified". `fromTable(name, '')` has always honored that — it emits no
 * `AS` clause — but every other clause concatenated `quoteIdentifier(alias) + '.' + column`
 * unconditionally, so the same empty string produced a ZERO-LENGTH delimited identifier. Measured
 * against the harness on the shipped 11.0.0:
 *
 *     WHERE ""."id" = $1   ->  Postgres: ERROR: zero-length delimited identifier
 *     WHERE ""."id" = ?    ->  SQLite:   SQLITE_ERROR: no such column: .id
 *     WHERE ``.`id` = ?    ->  MySQL:    ACCEPTED — returns the row
 *
 * MySQL accepting it is what made this worse than a syntax error: one builder produced SQL that ran
 * on one dialect and was rejected by the others, silently, which is the exact portability trap this
 * library exists to make impossible. The conformance corpus pins the emitted text per dialect; this
 * suite is the independent, hand-written check, and it asserts the INVARIANT rather than the text —
 * so a future clause that forgets to route through `qualifiedColumn` fails here even if nobody
 * thinks to add a golden for it.
 */

const dialects = [
  { name: 'postgres', engine: () => new PostgresQuery(), empty: '""' },
  { name: 'mysql', engine: () => new MysqlQuery(), empty: '``' },
  { name: 'sqlite', engine: () => new SqliteQuery(), empty: '""' },
  { name: 'mssql', engine: () => new MssqlQuery(), empty: '[]' },
] as const;

// One entry per clause that can carry a column reference, each built with the empty alias.
const clauses: Record<string, (b: any) => void> = {
  where: (b) => b.fromTable('orders', '').selectAll().where('', 'total', WhereOperator.Equals, 1),
  whereBetween: (b) => b.fromTable('orders', '').selectAll().whereBetween('', 'total', 1, 9),
  whereNull: (b) => b.fromTable('orders', '').selectAll().whereNull('', 'note'),
  whereNotNull: (b) => b.fromTable('orders', '').selectAll().whereNotNull('', 'note'),
  whereInValues: (b) => b.fromTable('orders', '').selectAll().whereInValues('', 'total', [1, 2]),
  selectColumn: (b) => b.fromTable('orders', '').selectColumn('', 'total', ''),
  orderByColumn: (b) =>
    b.fromTable('orders', '').selectAll().orderByColumn('', 'total', OrderByDirection.Descending),
  groupByColumn: (b) =>
    b.fromTable('orders', '').selectColumn('', 'total', '').groupByColumn('', 'total'),
  having: (b) =>
    b
      .fromTable('orders', '')
      .selectColumn('', 'total', '')
      .groupByColumn('', 'total')
      .having('', 'total', WhereOperator.GreaterThan, 1),
  havingBetween: (b) =>
    b
      .fromTable('orders', '')
      .selectColumn('', 'total', '')
      .groupByColumn('', 'total')
      .havingBetween('', 'total', 1, 9),
};

describe('an empty alias emits an unqualified column, never an empty identifier', () => {
  for (const dialect of dialects) {
    describe(dialect.name, () => {
      for (const [clause, build] of Object.entries(clauses)) {
        it(`${clause} carries no empty ${dialect.empty} identifier`, () => {
          const builder = dialect.engine().newBuilder();
          build(builder);
          const { sql } = builder.parsePrepared();

          expect(sql).not.toContain(dialect.empty);
          // ...and the column itself is still there, so this cannot pass by emitting nothing.
          expect(sql).toMatch(/total|note/);
        });
      }
    });
  }

  it('a non-empty alias still qualifies', () => {
    const builder = new PostgresQuery().newBuilder();
    builder.fromTable('orders', 'o').selectAll().where('o', 'total', WhereOperator.Equals, 1);
    expect(builder.parsePrepared().sql).toContain('"o"."total"');
  });
});
