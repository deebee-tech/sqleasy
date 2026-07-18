<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/deebee-tech/sqleasy-engine/main/assets/sqleasy-engine-lockup-dark.svg">
    <img alt="SQLEasy Engine" src="https://raw.githubusercontent.com/deebee-tech/sqleasy-engine/main/assets/sqleasy-engine-lockup-light.svg" width="482">
  </picture>
</p>

**A thin, opt-in SQL executor** — born alongside [`@deebeetech/sqleasy`](https://github.com/deebee-tech/sqleasy), but not limited to it.

Hand it any `{ sql, params }` (SQLEasy builders, hand-written SQL, another codegen tool). It runs
it: one small `run` / `transaction` / `explain` / `close` surface per dialect, and — crucially —
**you load only the driver you import.**

```bash
npm install @deebeetech/sqleasy-engine @libsql/client   # only the driver(s) you use
```

Each dialect lives at its own subpath, so importing one pulls in only its driver:

| Import                                     | Driver (optional peer)      | Factory                                        |
| ------------------------------------------ | --------------------------- | ---------------------------------------------- |
| `@deebeetech/sqleasy-engine/sqlite`        | `@libsql/client`            | `createSqliteExecutor`                         |
| `@deebeetech/sqleasy-engine/postgres`      | `pg`                        | `createPostgresExecutor` (+ `…FromPool`)       |
| `@deebeetech/sqleasy-engine/mysql`         | `mysql2`                    | `createMysqlExecutor` (+ `…FromPool`)          |
| `@deebeetech/sqleasy-engine/mssql`         | `mssql`                     | `createMssqlExecutor` (owns its pool)          |
| `@deebeetech/sqleasy-engine/introspection` | _(none — uses an executor)_ | `introspectSchema` / per-dialect `introspect*` |

```typescript
import { createSqliteExecutor } from '@deebeetech/sqleasy-engine/sqlite';

const db = createSqliteExecutor({ file: './app.db' });

// One statement — any { sql, params }, including a builder's parsePrepared() output.
const { rows } = await db.run({ sql: 'SELECT * FROM "users" WHERE "id" = ?;', params: [1] });

// A whole batch as one atomic transaction. Commits on success, rolls back on any error; each
// statement runs as its own prepared statement, in order.
await db.transaction([
  { sql: 'INSERT INTO "users" ("id", "name") VALUES (?, ?);', params: [1, 'Ada'] },
  { sql: 'INSERT INTO "users" ("id", "name") VALUES (?, ?);', params: [2, 'Grace'] },
]);

await db.close();
```

The drivers are **optional peer dependencies** — install `pg`, `mysql2`, `mssql`, or `@libsql/client`
yourself, only for the dialects you actually use. Nothing is loaded for a dialect you never import.

## Sharing a pool (Postgres / MySQL)

`createPostgresExecutorFromPool` / `createMysqlExecutorFromPool` wrap a pool you already manage.
`close()` on those executors is a **no-op** — ending a shared pool is your job. Factory-created
executors (`createPostgresExecutor` / `createMysqlExecutor`) own their pool and end it on `close()`.

SQL Server has no `FromPool` helper: `createMssqlExecutor` owns the pool so it can rebuild after a
failed connect (the `mssql` driver caches a rejected connect promise).

## Schema introspection

```typescript
import { createPostgresExecutor } from '@deebeetech/sqleasy-engine/postgres';
import { introspectSchema } from '@deebeetech/sqleasy-engine/introspection';

const db = createPostgresExecutor({ connectionString: process.env.DATABASE_URL });
const schema = await introspectSchema(db, 'postgres'); // tables, columns, PKs, FKs, indexes, …
await db.close();
```

Pass the dialect matching your executor (`'postgres' | 'mysql' | 'mssql' | 'sqlite'`). Optional
`schema` scopes the namespace (defaults: `public` / current DB / `dbo` / `main`).

## Why a transaction runs statement by statement

SQLEasy's `MultiBuilder.parse()` renders a batch as one string for display — but placeholder
numbering restarts per statement, so that string is not a runnable parameterized call on
Postgres/MySQL/SQLite. `preparedStatements()` returns each statement's own `{ sql, params }`; this
engine opens a real driver-level transaction and runs them in order. The same API works for any
array of prepared statements, not only SQLEasy's.

## Status

All four dialect executors — **SQLite/libSQL, Postgres, MySQL, SQL Server** — implement the full
`run` / `transaction` / `explain` / `close` surface. Postgres and MySQL also expose `…FromPool` for
sharing an app-managed pool. Schema introspection ships at
`@deebeetech/sqleasy-engine/introspection`.

Tested: SQLite runs against real in-memory (and file) libSQL. The others verify transaction
orchestration against a recording fake driver, EXPLAIN parsers against real plan shapes, and carry
real-database integration blocks gated on `DATABASE_URL` / `MYSQL_URL` / `MSSQL_CONNECTION_STRING`
for CI.

Part of the [DeeBee](https://github.com/deebee-tech) ecosystem.

## License

MIT © DeeBee Tech
