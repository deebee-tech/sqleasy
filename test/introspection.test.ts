import { afterAll, describe, expect, it } from 'vitest';
import { createSqliteExecutor } from '../src/sqlite';
import {
  buildSchema,
  introspectSchema,
  type IndexColumnRow,
  type SchemaData,
} from '../src/introspection';

// ─── buildSchema: pure assembly of flat catalog rows → SchemaData (shared by every dialect) ───────
describe('buildSchema', () => {
  it('groups columns and FKs per table, orders index columns by ordinal, and marks views', () => {
    const idxCols: IndexColumnRow[] = [
      // Out of ordinal order on purpose — assembly must sort them.
      {
        schema: 'public',
        table: 'users',
        indexName: 'ix_ab',
        unique: true,
        columnName: 'b',
        ordinal: 2,
      },
      {
        schema: 'public',
        table: 'users',
        indexName: 'ix_ab',
        unique: true,
        columnName: 'a',
        ordinal: 1,
      },
    ];
    const schema = buildSchema(
      [
        { schema: 'public', name: 'users', isView: false },
        { schema: 'public', name: 'user_summary', isView: true },
      ],
      [
        {
          schema: 'public',
          table: 'users',
          name: 'id',
          dataType: 'int',
          nullable: false,
          isPrimaryKey: true,
        },
        {
          schema: 'public',
          table: 'users',
          name: 'email',
          dataType: 'text',
          nullable: true,
          isPrimaryKey: false,
        },
      ],
      [
        {
          schema: 'public',
          table: 'users',
          columnName: 'org_id',
          referencedTable: 'orgs',
          referencedColumn: 'id',
        },
      ],
      idxCols,
      [{ schema: 'public', table: 'users', count: 42 }],
    );

    const users = schema.tables.find((t) => t.name === 'users')!;
    expect(users.type).toBe('table');
    expect(users.columns.map((c) => c.name)).toEqual(['id', 'email']);
    expect(users.columns[0]!.isPrimaryKey).toBe(true);
    expect(users.columns[1]!.nullable).toBe(true);
    expect(users.foreignKeys).toEqual([
      {
        columnName: 'org_id',
        referencedTable: 'orgs',
        referencedColumn: 'id',
        referencedSchema: undefined,
      },
    ]);
    // Columns sorted a, b even though supplied 2, 1.
    expect(users.indexes).toEqual([{ name: 'ix_ab', unique: true, columns: ['a', 'b'] }]);
    expect(users.approxRowCount).toBe(42);

    expect(schema.tables.find((t) => t.name === 'user_summary')!.type).toBe('view');
  });

  it('gives a bare table empty lists and no row count', () => {
    const schema = buildSchema([{ schema: 'main', name: 't', isView: false }], [], []);
    expect(schema.tables[0]).toMatchObject({
      columns: [],
      foreignKeys: [],
      indexes: [],
      approxRowCount: undefined,
    });
  });
});

// ─── SQLite introspection against real in-memory libSQL — the end-to-end proof of the port ────────
describe('introspectSchema (sqlite, real in-memory libsql)', () => {
  const db = createSqliteExecutor({ url: ':memory:' });
  let schema: SchemaData;

  afterAll(async () => {
    await db.close();
  });

  it('reads tables, views, columns, PKs, FKs, and indexes', async () => {
    await db.run({
      sql: 'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT);',
    });
    await db.run({
      sql: 'CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id), total REAL);',
    });
    await db.run({ sql: 'CREATE INDEX idx_orders_user ON orders(user_id);' });
    await db.run({ sql: 'CREATE VIEW active_users AS SELECT id, name FROM users;' });

    schema = await introspectSchema(db, 'sqlite');

    const users = schema.tables.find((t) => t.name === 'users')!;
    expect(users.type).toBe('table');
    expect(users.columns.map((c) => c.name)).toEqual(['id', 'name', 'email']);
    expect(users.columns.find((c) => c.name === 'id')!.isPrimaryKey).toBe(true);
    expect(users.columns.find((c) => c.name === 'name')!.nullable).toBe(false);
    expect(users.columns.find((c) => c.name === 'email')!.nullable).toBe(true);

    const orders = schema.tables.find((t) => t.name === 'orders')!;
    expect(orders.foreignKeys).toEqual([
      {
        columnName: 'user_id',
        referencedTable: 'users',
        referencedColumn: 'id',
        referencedSchema: undefined,
      },
    ]);
    expect(orders.indexes).toContainEqual({
      name: 'idx_orders_user',
      unique: false,
      columns: ['user_id'],
    });

    expect(schema.tables.find((t) => t.name === 'active_users')!.type).toBe('view');
  });
});

// ─── real pg / mysql / mssql: gated on a connection env var (a CI service); skipped locally ───────
// These lock the actual catalog SQL — including the mssql `@p0` binding the public executor needs —
// for CI. Each creates a users(PK) + orders(FK) pair, introspects, and asserts.
const REAL = [
  {
    dialect: 'postgres' as const,
    env: 'DATABASE_URL',
    make: async () =>
      (await import('../src/postgres')).createPostgresExecutor({
        connectionString: process.env['DATABASE_URL'],
      }),
    ddl: [
      'DROP TABLE IF EXISTS _se_orders; DROP TABLE IF EXISTS _se_users;',
      'CREATE TABLE _se_users (id INT PRIMARY KEY, name TEXT NOT NULL);',
      'CREATE TABLE _se_orders (id INT PRIMARY KEY, user_id INT REFERENCES _se_users(id));',
    ],
    cleanup: 'DROP TABLE IF EXISTS _se_orders; DROP TABLE IF EXISTS _se_users;',
    schema: undefined as string | undefined,
  },
  {
    dialect: 'mysql' as const,
    env: 'MYSQL_URL',
    make: async () =>
      (await import('../src/mysql')).createMysqlExecutor({ uri: process.env['MYSQL_URL'] }),
    ddl: [
      'DROP TABLE IF EXISTS _se_orders;',
      'DROP TABLE IF EXISTS _se_users;',
      'CREATE TABLE _se_users (id INT PRIMARY KEY, name VARCHAR(100) NOT NULL);',
      'CREATE TABLE _se_orders (id INT PRIMARY KEY, user_id INT, FOREIGN KEY (user_id) REFERENCES _se_users(id));',
    ],
    cleanup: 'DROP TABLE IF EXISTS _se_orders;',
    schema: undefined,
  },
  {
    dialect: 'mssql' as const,
    env: 'MSSQL_CONNECTION_STRING',
    make: async () =>
      (await import('../src/mssql')).createMssqlExecutor({
        connectionString: process.env['MSSQL_CONNECTION_STRING']!,
      }),
    ddl: [
      "IF OBJECT_ID('_se_orders') IS NOT NULL DROP TABLE _se_orders;",
      "IF OBJECT_ID('_se_users') IS NOT NULL DROP TABLE _se_users;",
      'CREATE TABLE _se_users (id INT PRIMARY KEY, name NVARCHAR(100) NOT NULL);',
      'CREATE TABLE _se_orders (id INT PRIMARY KEY, user_id INT FOREIGN KEY REFERENCES _se_users(id));',
    ],
    cleanup: "IF OBJECT_ID('_se_orders') IS NOT NULL DROP TABLE _se_orders;",
    schema: undefined,
  },
];

for (const t of REAL) {
  describe.skipIf(!process.env[t.env])(`introspectSchema (${t.dialect}, real database)`, () => {
    it('reads the users PK and the orders → users foreign key', async () => {
      const db = await t.make();
      try {
        for (const sql of t.ddl) await db.run({ sql });
        const schema = await introspectSchema(db, t.dialect, t.schema);

        const users = schema.tables.find((x) => x.name === '_se_users')!;
        expect(users.columns.find((c) => c.name === 'id')!.isPrimaryKey).toBe(true);

        const orders = schema.tables.find((x) => x.name === '_se_orders')!;
        expect(orders.foreignKeys).toContainEqual(
          expect.objectContaining({
            columnName: 'user_id',
            referencedTable: '_se_users',
            referencedColumn: 'id',
          }),
        );
      } finally {
        await db.run({ sql: t.cleanup }).catch(() => {});
        await db.close();
      }
    });
  });
}
