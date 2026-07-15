# @deebeetech/sqleasy-engine

**A thin, opt-in executor for [`@deebeetech/sqleasy`](https://github.com/deebee-tech/sqleasy).**

SQLEasy builds dialect-correct SQL and hands you `{ sql, params }`. It deliberately does not run
anything. This package runs it: one small `run` / `transaction` / `explain` / `close` surface per
dialect, and — crucially — **you load only the driver you import.**

```bash
npm install @deebeetech/sqleasy-engine @libsql/client   # only the driver(s) you use
```

Each dialect lives at its own subpath, so importing one pulls in only its driver:

```typescript
import { createSqliteExecutor } from '@deebeetech/sqleasy-engine/sqlite';

const db = createSqliteExecutor({ file: './app.db' });

// One statement — hand it a builder's parsePrepared() output.
const { rows } = await db.run({ sql: 'SELECT * FROM "users" WHERE "id" = ?;', params: [1] });

// A whole batch as one atomic transaction — hand it a MultiBuilder's preparedStatements().
// It commits on success and rolls back on any error; each statement runs as its own prepared
// statement, in order.
await db.transaction(multi.preparedStatements());

await db.close();
```

The drivers are **optional peer dependencies** — install `pg`, `mysql2`, `mssql`, or `@libsql/client`
yourself, only for the dialects you actually use. Nothing is loaded for a dialect you never import.

## Why a transaction runs statement by statement

SQLEasy's `MultiBuilder.parse()` renders a batch as one string for display — but placeholder
numbering restarts per statement, so that string is not a runnable parameterized call on
Postgres/MySQL/SQLite. `preparedStatements()` returns each statement's own `{ sql, params }`; this
engine opens a real driver-level transaction and runs them in order. That is the correct way to
execute a SQLEasy batch, and this package does it for you.

## Status

Early. The core (`run` / `transaction` / `explain` / `close`) and the **SQLite / libSQL** executor
are implemented and covered by real in-memory integration tests, including transaction rollback.
Postgres, MySQL, and SQL Server executors follow, then optional introspection.

Part of the [DeeBee](https://github.com/deebee-tech) ecosystem.

## License

MIT © DeeBee Tech
