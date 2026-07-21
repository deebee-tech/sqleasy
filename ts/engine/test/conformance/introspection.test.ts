import { readFileSync } from 'node:fs';
import { describe, expect, it, afterAll, beforeAll } from 'vitest';
import type { DbExecutor } from '../../src/index';
import { createPostgresExecutor } from '../../src/postgres/index';
import { createMysqlExecutor } from '../../src/mysql/index';
import { createSqliteExecutor } from '../../src/sqlite/index';
import { createMssqlExecutor } from '../../src/mssql/index';
import { introspectSchema, type SchemaData, type SchemaTable } from '../../src/introspection/index';

/**
 * Replays CORPUS D (introspection) against every dialect this engine can read.
 *
 * The corpus is AUTHORED from `harness/seed/*.sql` — the DDL is the source of truth, not whatever
 * these readers happen to return. A failure means the reader is wrong until proven otherwise, and
 * "proven otherwise" means an argument about what the catalog genuinely says, followed by an edit to
 * the corpus with the reason written down.
 *
 * Requires the shared docker harness (`pnpm harness:up`). FAIL LOUD, NEVER SKIP: a suite that skips
 * on an unreachable database reports green having tested nothing.
 */

type Dialect = 'mssql' | 'mysql' | 'postgres' | 'sqlite';
type Shared<T> = T | Record<Dialect, T>;
type CorpusColumn = {
  name: string;
  dataType: Shared<string>;
  nullable: Shared<boolean>;
  isPrimaryKey: Shared<boolean>;
  defaultValue: Shared<string | null>;
};
type CorpusForeignKey = {
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
  referencedSchema: Shared<string | null>;
};
type CorpusIndex = { name: Shared<string | null>; columns: string[]; unique: boolean };
type CorpusTable = {
  name: string;
  type: 'table' | 'view';
  columns: CorpusColumn[];
  foreignKeys: CorpusForeignKey[];
  indexes: CorpusIndex[];
  approxRowCount: Shared<'present' | 'absent'>;
};
type Corpus = {
  version: string;
  schemaName: Record<Dialect, string>;
  tables: CorpusTable[];
};

const DIALECTS: Dialect[] = ['mssql', 'mysql', 'postgres', 'sqlite'];

const corpus = JSON.parse(
  readFileSync(
    new URL('../../../../contract/corpora/introspection/corpus.json', import.meta.url),
    'utf8',
  ),
) as Corpus;

/**
 * Resolve a corpus field for one dialect.
 *
 * A per-dialect map is a JSON object carrying EVERY dialect key; anything else is the shared value.
 * A partial map is a corpus bug, not a "use the shared value" shorthand — it is rejected loudly so a
 * half-written divergence cannot read as agreement.
 */
function pick<T>(field: Shared<T>, dialect: Dialect): T {
  if (field === null || typeof field !== 'object' || Array.isArray(field)) return field as T;
  const map = field as Record<string, T>;
  const missing = DIALECTS.filter((d) => !(d in map));
  if (missing.length > 0) {
    throw new Error(
      `corpus D: per-dialect map is missing ${missing.join(', ')} — spell out every dialect or use a shared value`,
    );
  }
  return map[dialect]!;
}

/** The corpus's expectation for one table, flattened to the dialect under test. */
function expected(table: CorpusTable, dialect: Dialect) {
  return {
    columns: table.columns.map((c) => ({
      name: c.name,
      dataType: pick(c.dataType, dialect),
      nullable: pick(c.nullable, dialect),
      isPrimaryKey: pick(c.isPrimaryKey, dialect),
      defaultValue: pick(c.defaultValue, dialect),
    })),
    foreignKeys: table.foreignKeys.map((fk) => ({
      columnName: fk.columnName,
      referencedTable: fk.referencedTable,
      referencedColumn: fk.referencedColumn,
      referencedSchema: pick(fk.referencedSchema, dialect),
    })),
    // A null name means the dialect reports no such index at all — drop it rather than expect one.
    indexes: table.indexes
      .map((i) => ({ name: pick(i.name, dialect), columns: i.columns, unique: i.unique }))
      .filter((i): i is { name: string; columns: string[]; unique: boolean } => i.name !== null),
    rowCount: pick(table.approxRowCount, dialect),
  };
}

/** The reader's answer for one table, in the same shape — `undefined` normalized to `null`. */
function actual(table: SchemaTable) {
  return {
    columns: table.columns.map((c) => ({
      name: c.name,
      dataType: c.dataType,
      nullable: c.nullable,
      isPrimaryKey: c.isPrimaryKey,
      defaultValue: c.defaultValue ?? null,
    })),
    foreignKeys: table.foreignKeys.map((fk) => ({
      columnName: fk.columnName,
      referencedTable: fk.referencedTable,
      referencedColumn: fk.referencedColumn,
      referencedSchema: fk.referencedSchema ?? null,
    })),
    indexes: table.indexes,
    rowCount: table.approxRowCount === undefined ? ('absent' as const) : ('present' as const),
  };
}

const byName = <T extends { name: string }>(items: T[]): T[] =>
  [...items].sort((a, b) => a.name.localeCompare(b.name));

describe('corpus D — schema introspection', () => {
  const executors: Record<string, DbExecutor> = {};
  const schemas: Record<string, SchemaData> = {};

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
    executors.mssql = createMssqlExecutor({
      server: 'localhost',
      database: 'sqleasy_ci',
      user: 'sa',
      password: 'SqlEasy_ci_1!',
      options: { encrypt: true, trustServerCertificate: true },
    });
    executors.sqlite = createSqliteExecutor({ url: ':memory:' });
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

    for (const dialect of DIALECTS) {
      schemas[dialect] = await introspectSchema(
        executors[dialect]!,
        dialect,
        dialect === 'sqlite' ? undefined : corpus.schemaName[dialect],
      );
    }
  }, 30_000);

  afterAll(async () => {
    for (const executor of Object.values(executors)) await executor.close();
  });

  it('replays every dialect the engine can read', () => {
    expect(Object.keys(executors).sort()).toEqual([...DIALECTS].sort());
  });

  for (const dialect of DIALECTS) {
    describe(dialect, () => {
      it('reports exactly the seeded tables and views', () => {
        expect(byName(schemas[dialect]!.tables).map((t) => `${t.type} ${t.name}`)).toEqual(
          byName(corpus.tables).map((t) => `${t.type} ${t.name}`),
        );
      });

      it('scopes every table to the dialect’s own namespace', () => {
        const namespaces = [...new Set(schemas[dialect]!.tables.map((t) => t.schema))];
        expect(namespaces).toEqual([corpus.schemaName[dialect]]);
      });

      for (const table of corpus.tables) {
        it(`${table.name}: columns, keys, indexes, row-count presence`, () => {
          const found = schemas[dialect]!.tables.find((t) => t.name === table.name);
          expect(found, `${dialect} has no table named ${table.name}`).toBeDefined();
          const want = expected(table, dialect);
          const got = actual(found!);

          // Columns in ordinal order — position IS the contract.
          expect(got.columns).toEqual(want.columns);
          expect(byName(got.foreignKeys.map((f) => ({ ...f, name: f.columnName })))).toEqual(
            byName(want.foreignKeys.map((f) => ({ ...f, name: f.columnName }))),
          );
          // Indexes as a set: enumeration order is the reader's ORDER BY, not the catalog's promise.
          expect(byName(got.indexes)).toEqual(byName(want.indexes));
          expect(got.rowCount).toBe(want.rowCount);
        });
      }
    });
  }
});
