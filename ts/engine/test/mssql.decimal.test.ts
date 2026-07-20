import { describe, expect, it, vi } from 'vitest';

// A recordset shaped the way `mssql` really returns one: rows PLUS a `columns` map carrying each
// column's declared type, precision and scale. The shared mock in mssql.test.ts omits `columns`
// entirely, which is why the coercion is invisible there — this file supplies it.
const rec = vi.hoisted(() => ({
  recordset: undefined as unknown,
  set(rows: Record<string, unknown>[], columns: Record<string, unknown>) {
    const recordset = rows as Record<string, unknown>[] & { columns?: unknown };
    recordset.columns = columns;
    this.recordset = recordset;
  },
}));

vi.mock('mssql', () => {
  class FakeRequest {
    input() {
      return this;
    }
    async query() {
      return { recordset: rec.recordset, rowsAffected: [1] };
    }
    async batch() {
      return { recordset: [] };
    }
  }
  class FakeConnectionPool {
    async connect() {
      return this;
    }
    async close() {}
    request() {
      return new FakeRequest();
    }
  }
  class FakeTransaction {
    async begin() {}
    async commit() {}
    async rollback() {}
  }
  // `mssql` is CommonJS; the source imports the DEFAULT and destructures from it, so the mock has
  // to expose the classes on `default` as well as by name.
  const api = {
    ConnectionPool: FakeConnectionPool,
    Request: FakeRequest,
    Transaction: FakeTransaction,
  };
  return { default: api, ...api };
});

// Imported after the mock — vitest hoists vi.mock above imports.
import { createMssqlExecutor } from '../src/mssql';

const column = (declaration: string, precision: number, scale: number) => ({
  type: { declaration },
  precision,
  scale,
});

const runWith = async (rows: Record<string, unknown>[], columns: Record<string, unknown>) => {
  rec.set(rows, columns);
  const executor = createMssqlExecutor({ connectionString: 'Server=x' });
  const result = await executor.run<Record<string, unknown>>({ sql: 'SELECT 1', params: [] });
  await executor.close();
  return result.rows;
};

// `tedious`'s readNumeric computes `value * sign / Math.pow(10, scale)` — it lands in a double.
// That is exact only when scale is 0 and the precision fits inside 2^53-1. Everything else came back
// near-but-not-equal to what was stored: nothing failed, the money was just slightly wrong, in a
// direction that compounds when summed.
describe('MSSQL exact-numeric coercion', () => {
  it('returns a fractional decimal as a string, preserving every digit', async () => {
    const rows = await runWith([{ amount: 1234567.89 }], { amount: column('decimal', 19, 4) });
    expect(rows[0]!.amount).toBe('1234567.89');
    expect(typeof rows[0]!.amount).toBe('string');
  });

  it('coerces money and smallmoney, which are always fractional', async () => {
    const rows = await runWith([{ m: 12.34, sm: 5.67 }], {
      m: column('money', 19, 4),
      sm: column('smallmoney', 10, 4),
    });
    expect(rows[0]!.m).toBe('12.34');
    expect(rows[0]!.sm).toBe('5.67');
  });

  it('coerces an integer decimal wider than a double can hold exactly', async () => {
    // Built from a string rather than written as a literal: the whole point is a value a double
    // cannot hold, which is precisely what `no-loss-of-precision` exists to flag.
    const wide = Number('12345678901234567890');
    const rows = await runWith([{ id: wide }], { id: column('decimal', 20, 0) });
    expect(typeof rows[0]!.id).toBe('string');
  });

  // The narrowing matters as much as the coercion. Turning an exact value into a string for no
  // reason would be its own kind of wrong — refusing to hand back something correct.
  it('leaves a scale-0 decimal inside the exact-integer range as a number', async () => {
    const rows = await runWith([{ id: 42 }], { id: column('decimal', 9, 0) });
    expect(rows[0]!.id).toBe(42);
    expect(typeof rows[0]!.id).toBe('number');
  });

  it('leaves decimal(15,0) alone — 15 digits still round-trip exactly', async () => {
    const rows = await runWith([{ id: 999999999999999 }], { id: column('decimal', 15, 0) });
    expect(typeof rows[0]!.id).toBe('number');
  });

  it('leaves non-exact-numeric columns untouched', async () => {
    const rows = await runWith([{ n: 1.5, s: 'x', b: true, dt: 7 }], {
      n: column('float', 53, 0),
      s: column('nvarchar', 0, 0),
      b: column('bit', 0, 0),
      dt: column('int', 10, 0),
    });
    expect(rows[0]).toEqual({ n: 1.5, s: 'x', b: true, dt: 7 });
  });

  it('leaves NULLs as NULL rather than stringifying them', async () => {
    const rows = await runWith([{ amount: null }], { amount: column('decimal', 19, 4) });
    expect(rows[0]!.amount).toBeNull();
  });

  it('is a no-op when the driver reports no column metadata', async () => {
    rec.recordset = [{ amount: 1.23 }];
    const executor = createMssqlExecutor({ connectionString: 'Server=x' });
    const result = await executor.run<{ amount: unknown }>({ sql: 'SELECT 1', params: [] });
    await executor.close();
    expect(result.rows[0]!.amount).toBe(1.23);
  });
});
