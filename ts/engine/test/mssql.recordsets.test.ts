import { describe, expect, it, vi } from 'vitest';

// `mssql` hands back BOTH `recordset` (the first set) and `recordsets` (all of them), and each set
// carries its own `columns` map. This mock supplies both so the per-set normalization is visible;
// the shared mock in mssql.test.ts omits `recordsets` entirely, which is what the absent-field path
// below exercises.
const rec = vi.hoisted(() => ({
  recordsets: undefined as unknown,
  recordset: undefined as unknown,
  rowsAffected: [1] as number[],
  set(sets: { rows: Record<string, unknown>[]; columns: Record<string, unknown> }[]) {
    const built = sets.map(({ rows, columns }) => {
      const recordset = rows as Record<string, unknown>[] & { columns?: unknown };
      recordset.columns = columns;
      return recordset;
    });
    this.recordsets = built;
    this.recordset = built[0];
  },
  none(rowsAffected: number[]) {
    this.recordsets = [];
    this.recordset = undefined;
    this.rowsAffected = rowsAffected;
  },
}));

vi.mock('mssql', () => {
  class FakeRequest {
    input() {
      return this;
    }
    async query() {
      return {
        recordset: rec.recordset,
        recordsets: rec.recordsets,
        rowsAffected: rec.rowsAffected,
      };
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
  const api = {
    ConnectionPool: FakeConnectionPool,
    Request: FakeRequest,
    Transaction: FakeTransaction,
    // The executor declares plain-ASCII strings as varchar rather than letting the driver infer
    // nvarchar, so the mock has to carry the type factory the real module exports.
    VarChar: (length: number) => ({ type: 'VarChar', length }),
    MAX: 65535,
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

const run = async () => {
  const executor = createMssqlExecutor({ connectionString: 'Server=x' });
  const result = await executor.run<Record<string, unknown>>({ sql: 'SELECT 1; SELECT 2' });
  await executor.close();
  return result;
};

/**
 * The reason V2-style paginated reads want this: a COUNT and its page travel as one `;`-joined batch
 * and come back as two sets in ONE round trip. Splitting them into two calls doubles the latency of
 * every paginated endpoint; running them through `transaction()` adds BEGIN/COMMIT on top of that.
 */
describe('MSSQL multi-recordset results', () => {
  it('exposes every set, with rows sharing identity with the first', async () => {
    rec.set([
      { rows: [{ total: 7 }], columns: { total: column('int', 10, 0) } },
      { rows: [{ id: 1 }, { id: 2 }], columns: { id: column('int', 10, 0) } },
    ]);

    const result = await run();

    expect(result.recordsets).toHaveLength(2);
    expect(result.recordsets![0]).toEqual([{ total: 7 }]);
    expect(result.recordsets![1]).toEqual([{ id: 1 }, { id: 2 }]);
    // Same array, not a re-normalized copy — normalizing twice would double the work on every read.
    expect(result.rows).toBe(result.recordsets![0]);
  });

  // The bug the per-set shape exists to make unavailable. Two sets in one batch rarely share a
  // schema, so normalizing the second against the FIRST set's columns would coerce by the wrong
  // rule — here it would turn a plain int into the string '42'.
  it('normalizes each set against its own columns, not the first set\'s', async () => {
    rec.set([
      { rows: [{ amount: 1234567.89 }], columns: { amount: column('decimal', 19, 4) } },
      { rows: [{ amount: 42 }], columns: { amount: column('int', 10, 0) } },
    ]);

    const result = await run();

    // Set 0 is a fractional decimal: coerced to a string so no digit is lost to a double.
    expect(result.recordsets![0]![0]!.amount).toBe('1234567.89');
    // Set 1 is an int: left alone. A string here would mean set 0's columns leaked across.
    expect(result.recordsets![1]![0]!.amount).toBe(42);
  });

  it('leaves recordsets absent when the statement returned no sets at all', async () => {
    rec.none([3]);

    const result = await run();

    expect(result.recordsets).toBeUndefined();
    expect(result.rows).toEqual([]);
    // An INSERT without OUTPUT still reports what it touched.
    expect(result.rowCount).toBe(3);
  });

  it('still populates recordsets for an ordinary single-set read', async () => {
    rec.set([{ rows: [{ id: 1 }], columns: { id: column('int', 10, 0) } }]);

    const result = await run();

    expect(result.recordsets).toHaveLength(1);
    expect(result.rows).toBe(result.recordsets![0]);
    expect(result.rowCount).toBe(1);
  });
});
