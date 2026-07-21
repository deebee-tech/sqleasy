import { readFileSync } from 'node:fs';
import { describe, expect, it, afterAll, beforeAll } from 'vitest';
import type { DbExecutor } from '../../src/index';
import { createPostgresExecutor } from '../../src/postgres/index';
import { createMysqlExecutor } from '../../src/mysql/index';
import { createSqliteExecutor } from '../../src/sqlite/index';

/**
 * Replays CORPUS C (normalization) against every implemented dialect.
 *
 * The corpus — not this engine — is the definition of correct. Goldens there are authored from the
 * fixed harness seed, so a failure here means the engine is wrong until proven otherwise.
 *
 * Requires the shared docker harness (`pnpm harness:up`). FAIL LOUD, NEVER SKIP: a suite that skips
 * on an unreachable database reports green having tested nothing.
 */

type Tagged = { t: string; v?: unknown };
type ResultSetGolden = { columns: string[]; rows: Tagged[][]; rowCount: number };
type Case = {
  name: string;
  sql: Record<string, string | undefined>;
  params?: Tagged[];
  expect: ResultSetGolden;
  overrides?: Record<string, Partial<ResultSetGolden> | undefined>;
};

// MSSQL is absent by design: the Dart port has no TDS driver and its leg is built last, so the
// corpus is not yet replayed there by BOTH ports. Asserted below so the gap stays explicit.
const IMPLEMENTED = ['postgres', 'mysql', 'sqlite'] as const;

const corpus = JSON.parse(
  readFileSync(
    new URL('../../../../contract/corpora/normalization/corpus.json', import.meta.url),
    'utf8',
  ),
) as { cases: Case[] };

const bindParams = (params: Tagged[] = []): unknown[] =>
  params.map((p) => (p.t === 'null' ? null : p.v));

/**
 * Does `actual` satisfy the corpus's `expected` cell?
 *
 * Comparison is EXPECTATION-DRIVEN rather than tag-from-actual, because a language's representation
 * of a canonical form is its own business. This engine deliberately returns exact numerics — both
 * `BIGINT` and `NUMERIC` — as STRINGS (see the `losslessNumericDefaults` rationale in
 * src/mysql/index.ts: a BigInt cannot be mixed with a number in arithmetic without throwing). Dart's
 * native int is 64-bit and needs no such trick. So the corpus pins the exact DIGITS, and each port
 * satisfies it with whatever integral representation it documents.
 *
 * That latitude is bounded: an integer expectation accepts only an integral value or a pure-digit
 * string, so a decimal like "19.99" can never pass where an integer is required.
 */
function matches(expected: Tagged, actual: unknown): boolean {
  switch (expected.t) {
    case 'null':
      return actual === null || actual === undefined;
    case 'bool':
      return actual === expected.v;
    case 'string':
      return actual === expected.v;
    case 'double':
      return typeof actual === 'number' && actual === expected.v;
    case 'int': {
      const digits = String(expected.v);
      if (typeof actual === 'bigint') return actual.toString() === digits;
      if (typeof actual === 'number') return Number.isInteger(actual) && String(actual) === digits;
      // An all-digits string IS an integral representation — this engine's documented form for a
      // 64-bit column. "19.99" fails the shape test, so a decimal cannot masquerade as an integer.
      if (typeof actual === 'string') return /^-?\d+$/.test(actual) && actual === digits;
      return false;
    }
    default:
      return false;
  }
}

const describeRow = (row: Record<string, unknown>): string =>
  Object.entries(row)
    .map(([k, v]) => `${k}=${String(v)}<${typeof v}>`)
    .join(' ');

describe('corpus C — result normalization', () => {
  const executors: Record<string, DbExecutor> = {};

  beforeAll(async () => {
    executors.postgres = createPostgresExecutor({
      host: 'localhost',
      database: 'sqleasy_ci',
      user: 'sqleasy',
      password: 'sqleasy_ci',
    });
    executors.mysql = createMysqlExecutor({
      host: 'localhost',
      database: 'sqleasy_ci',
      user: 'root',
      password: 'sqleasy_ci',
    });
    // `intMode: 'bigint'` is opted into HERE rather than changed in the executor's default. The
    // default stays `'number'`, which THROWS on a value past 2^53-1 — a loud, honest refusal (see
    // the rationale in src/sqlite/index.ts). This corpus genuinely reads 2^53+1, which makes the
    // replay exactly the caller that decision anticipated: "pass intMode yourself and take the
    // BigInt consequences knowingly".
    executors.sqlite = createSqliteExecutor({ url: ':memory:', intMode: 'bigint' });
    const seed = readFileSync(
      new URL('../../../../harness/seed/sqlite.sql', import.meta.url),
      'utf8',
    )
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n')
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const statement of seed) await executors.sqlite.run({ sql: statement });
  });

  afterAll(async () => {
    for (const executor of Object.values(executors)) await executor.close();
  });

  it('replays an explicit set of dialects', () => {
    expect(Object.keys(executors).sort()).toEqual([...IMPLEMENTED].sort());
  });

  for (const testCase of corpus.cases) {
    for (const dialect of IMPLEMENTED) {
      const sql = testCase.sql[dialect];
      if (!sql) continue;

      it(`[${dialect}] ${testCase.name}`, async () => {
        const golden: ResultSetGolden = {
          ...testCase.expect,
          ...(testCase.overrides?.[dialect] ?? {}),
        };
        const result = await executors[dialect].run({ sql, params: bindParams(testCase.params) });

        expect(result.rowCount).toBe(golden.rowCount);
        const rows = result.rows as Record<string, unknown>[];
        if (rows.length > 0) expect(Object.keys(rows[0])).toEqual(golden.columns);
        expect(rows).toHaveLength(golden.rows.length);

        rows.forEach((row, r) => {
          const values = Object.values(row);
          golden.rows[r].forEach((cell, c) => {
            expect(
              matches(cell, values[c]),
              `row ${r} col "${golden.columns[c]}": expected ${JSON.stringify(cell)}, got ${describeRow(row)}`,
            ).toBe(true);
          });
        });
      });
    }
  }
});
