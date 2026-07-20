import { describe, expect, it } from 'vitest';
import {
  FrameBoundType,
  FrameUnit,
  MssqlQuery,
  MysqlQuery,
  OrderByDirection,
  PostgresQuery,
  SqliteQuery,
} from '../../src';

// `default-window.ts` carried NO dialect branching at all, on the stated assumption that window
// frames are identical across the four engines. They are not, in exactly one place: T-SQL's `RANGE`
// accepts only `UNBOUNDED PRECEDING`, `CURRENT ROW` and `UNBOUNDED FOLLOWING`. A numeric offset is
// legal on `ROWS` but not on `RANGE`, so `RANGE 5 PRECEDING` is a syntax error on every SQL Server
// version. Postgres, MySQL 8.0+ and SQLite 3.28+ all accept it.
//
// The combination had no corpus coverage, so the fix moved zero goldens. These are its only tests.
describe('MSSQL RANGE frames', () => {
  const windowed = (
    make: () => ReturnType<MssqlQuery['newBuilder']>,
    unit: FrameUnit,
    startType: FrameBoundType,
    startOffset?: number,
  ) => {
    const b = make();
    b.selectWindow(
      'SUM([o].[total])',
      (w) => {
        w.orderByColumn('o', 'placed_at', OrderByDirection.Ascending).frame(
          unit,
          startType,
          startOffset,
        );
      },
      'running',
    ).fromTable('orders', 'o');
    return b;
  };

  it('refuses RANGE with a numeric PRECEDING offset', () => {
    const b = windowed(
      () => new MssqlQuery().newBuilder(),
      FrameUnit.Range,
      FrameBoundType.Preceding,
      5,
    );
    expect(() => b.parseRaw()).toThrow(/MSSQL RANGE frames accept only UNBOUNDED PRECEDING/);
  });

  it('refuses RANGE with a numeric FOLLOWING offset', () => {
    const b = windowed(
      () => new MssqlQuery().newBuilder(),
      FrameUnit.Range,
      FrameBoundType.Following,
      3,
    );
    expect(() => b.parseRaw()).toThrow(/use a ROWS frame for a numeric offset/);
  });

  // The keyword bounds are legal T-SQL and must keep working — refusing the whole RANGE unit would
  // be the opposite error, removing something MSSQL genuinely has.
  it('allows RANGE with UNBOUNDED PRECEDING', () => {
    const b = windowed(
      () => new MssqlQuery().newBuilder(),
      FrameUnit.Range,
      FrameBoundType.UnboundedPreceding,
    );
    expect(b.parseRaw()).toContain('RANGE UNBOUNDED PRECEDING');
  });

  it('allows RANGE with CURRENT ROW', () => {
    const b = windowed(
      () => new MssqlQuery().newBuilder(),
      FrameUnit.Range,
      FrameBoundType.CurrentRow,
    );
    expect(b.parseRaw()).toContain('RANGE CURRENT ROW');
  });

  // ROWS is where a numeric offset belongs on MSSQL, and it was never affected.
  it('allows ROWS with a numeric offset', () => {
    const b = windowed(
      () => new MssqlQuery().newBuilder(),
      FrameUnit.Rows,
      FrameBoundType.Preceding,
      5,
    );
    expect(b.parseRaw()).toContain('ROWS 5 PRECEDING');
  });
});

describe('the other three dialects keep RANGE with offsets', () => {
  const cases = [
    ['Postgres', () => new PostgresQuery().newBuilder()],
    ['MySQL', () => new MysqlQuery().newBuilder()],
    ['SQLite', () => new SqliteQuery().newBuilder()],
  ] as const;

  for (const [name, make] of cases) {
    it(`${name} emits RANGE 5 PRECEDING`, () => {
      const b = make();
      b.selectWindow(
        'SUM("o"."total")',
        (w) => {
          w.orderByColumn('o', 'placed_at', OrderByDirection.Ascending).frame(
            FrameUnit.Range,
            FrameBoundType.Preceding,
            5,
          );
        },
        'running',
      ).fromTable('orders', 'o');

      expect(b.parseRaw()).toContain('RANGE 5 PRECEDING');
    });
  }
});
