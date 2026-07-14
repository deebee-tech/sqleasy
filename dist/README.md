<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/deebee-tech/sqleasy/main/assets/sqleasy-lockup-dark.svg">
    <img alt="SQLEasy" src="https://raw.githubusercontent.com/deebee-tech/sqleasy/main/assets/sqleasy-lockup-light.svg" width="440">
  </picture>
</p>

<p align="center"><strong>A dialect-aware SQL builder for Postgres, MySQL, SQL Server &amp; SQLite — bring your own connection.</strong></p>

<p align="center">
  <a href="https://www.npmjs.com/package/@deebeetech/sqleasy"><img alt="npm" src="https://img.shields.io/npm/v/@deebeetech/sqleasy?color=cb3837&logo=npm"></a>
  <a href="https://jsr.io/@deebeetech/sqleasy"><img alt="JSR" src="https://jsr.io/badges/@deebeetech/sqleasy"></a>
  <a href="./LICENSE"><img alt="license" src="https://img.shields.io/npm/l/@deebeetech/sqleasy?color=blue"></a>
</p>

SQLEasy is a lightweight, **zero-dependency** SQL query _builder_. It composes dialect-correct
SELECT / INSERT / UPDATE / DELETE — plus CTEs, unions, and batched transactions — with a fluent API,
and hands you the SQL string and its bound parameters.

It is **not** a driver or an ORM. You bring your own connection (`pg`, `mysql2`, `better-sqlite3`,
`mssql`, libSQL, …) and run what SQLEasy generates. That focus is the point: correct SQL for four
dialects — identifier quoting, placeholder style, default schemas, and transaction wrappers — and
nothing you have to wire around.

Part of the [DeeBee](https://github.com/deebee-tech) ecosystem.

## Installation

### npm

```bash
npm install @deebeetech/sqleasy
```

### JSR

```bash
npx jsr add @deebeetech/sqleasy
```

## Quick Start

```typescript
import { PostgresQuery, WhereOperator } from '@deebeetech/sqleasy';

const query = new PostgresQuery();
const builder = query.newBuilder();

builder
  .selectColumn('u', 'id', '')
  .selectColumn('u', 'name', 'userName')
  .fromTable('users', 'u')
  .where('u', 'active', WhereOperator.Equals, true);

console.log(builder.parseRaw());
// SELECT "u"."id", "u"."name" AS "userName" FROM "public"."users" AS "u" WHERE "u"."active" = true;

const { sql, params } = builder.parsePrepared();
// sql:    SELECT "u"."id", "u"."name" AS "userName" FROM "public"."users" AS "u" WHERE "u"."active" = $1;
// params: [true]   ← hand straight to your driver: client.query(sql, params)
```

## Database Support

Each dialect has its own entry point that handles identifier quoting, placeholder syntax, default
schemas, and transaction delimiters automatically.

```typescript
import { MssqlQuery, MysqlQuery, PostgresQuery, SqliteQuery } from '@deebeetech/sqleasy';

const mssql = new MssqlQuery(); // [dbo].[table], ? placeholders, BEGIN TRANSACTION/COMMIT TRANSACTION
const mysql = new MysqlQuery(); // `table`, ? placeholders, START TRANSACTION/COMMIT
const postgres = new PostgresQuery(); // "public"."table", $1 placeholders, BEGIN/COMMIT
const sqlite = new SqliteQuery(); // "table", ? placeholders, BEGIN/COMMIT
```

## Query Examples

### SELECT

```typescript
const query = new PostgresQuery();
const builder = query.newBuilder();

// Select all columns
builder.selectAll().fromTable('users', 'u');
// SELECT * FROM "public"."users" AS "u";

// Select specific columns
builder.clearAll();
builder.selectColumn('u', 'id', '').selectColumn('u', 'name', 'userName').fromTable('users', 'u');
// SELECT "u"."id", "u"."name" AS "userName" FROM "public"."users" AS "u";

// DISTINCT
builder.clearAll();
builder.distinct().selectColumn('u', 'name', '').fromTable('users', 'u');
// SELECT DISTINCT "u"."name" FROM "public"."users" AS "u";

// Raw expression
builder.clearAll();
builder.selectRaw('COUNT(*) AS total').fromTable('users', 'u');
// SELECT COUNT(*) AS total FROM "public"."users" AS "u";

// Scalar sub-query in SELECT
builder.clearAll();
builder
  .selectAll()
  .selectWithBuilder('orderCount', (sb) => {
    sb.selectRaw('COUNT(*)').fromTable('orders', 'o');
  })
  .fromTable('users', 'u');
// SELECT *, (SELECT COUNT(*) FROM "public"."orders" AS "o") AS "orderCount" FROM "public"."users" AS "u";
```

### WHERE

```typescript
import { WhereOperator } from '@deebeetech/sqleasy';

const builder = new PostgresQuery().newBuilder();

// Comparison operators
builder
  .selectAll()
  .fromTable('users', 'u')
  .where('u', 'age', WhereOperator.GreaterThanOrEquals, 18);

// AND / OR
builder.clearAll();
builder
  .selectAll()
  .fromTable('users', 'u')
  .where('u', 'active', WhereOperator.Equals, true)
  .and()
  .where('u', 'age', WhereOperator.GreaterThan, 21);

// BETWEEN
builder.clearAll();
builder.selectAll().fromTable('users', 'u').whereBetween('u', 'age', 18, 65);

// IS NULL / IS NOT NULL
builder.clearAll();
builder.selectAll().fromTable('users', 'u').whereNotNull('u', 'email');

// IN (values)
builder.clearAll();
builder.selectAll().fromTable('users', 'u').whereInValues('u', 'role', ['admin', 'moderator']);

// IN (sub-query)
builder.clearAll();
builder
  .selectAll()
  .fromTable('users', 'u')
  .whereInWithBuilder('u', 'id', (sb) => {
    sb.selectColumn('o', 'user_id', '').fromTable('orders', 'o');
  });

// Grouped conditions
builder.clearAll();
builder
  .selectAll()
  .fromTable('users', 'u')
  .where('u', 'active', WhereOperator.Equals, true)
  .and()
  .whereGroup((gb) => {
    gb.where('u', 'role', WhereOperator.Equals, 'admin')
      .or()
      .where('u', 'role', WhereOperator.Equals, 'moderator');
  });
```

### JOIN

```typescript
import { JoinType, JoinOperator } from '@deebeetech/sqleasy';

const builder = new PostgresQuery().newBuilder();

builder
  .selectAll()
  .fromTable('users', 'u')
  .joinTable(JoinType.Inner, 'orders', 'o', (jb) => {
    jb.on('u', 'id', JoinOperator.Equals, 'o', 'user_id');
  });
// SELECT * FROM "public"."users" AS "u"
//   INNER JOIN "public"."orders" AS "o" ON "u"."id" = "o"."user_id";

// Multiple ON conditions
builder.clearAll();
builder
  .selectAll()
  .fromTable('users', 'u')
  .joinTable(JoinType.Inner, 'orders', 'o', (jb) => {
    jb.on('u', 'id', JoinOperator.Equals, 'o', 'user_id')
      .and()
      .on('u', 'tenant_id', JoinOperator.Equals, 'o', 'tenant_id');
  });

// Multiple joins
builder.clearAll();
builder
  .selectAll()
  .fromTable('users', 'u')
  .joinTable(JoinType.Inner, 'orders', 'o', (jb) => {
    jb.on('u', 'id', JoinOperator.Equals, 'o', 'user_id');
  })
  .joinTable(JoinType.Left, 'products', 'p', (jb) => {
    jb.on('o', 'product_id', JoinOperator.Equals, 'p', 'id');
  });

// Join with sub-query
builder.clearAll();
builder
  .selectAll()
  .fromTable('users', 'u')
  .joinWithBuilder(
    JoinType.Inner,
    'recent_orders',
    (sb) => {
      sb.selectAll()
        .fromTable('orders', 'o')
        .where('o', 'created_at', WhereOperator.GreaterThan, '2024-01-01');
    },
    (jb) => {
      jb.on('u', 'id', JoinOperator.Equals, 'recent_orders', 'user_id');
    },
  );
```

### INSERT

```typescript
const builder = new PostgresQuery().newBuilder();

builder
  .insertInto('users')
  .insertColumns(['name', 'email', 'age'])
  .insertValues(['John', 'john@example.com', 30]);
// INSERT INTO "public"."users" ("name", "email", "age") VALUES (John, john@example.com, 30);

// Multi-row insert
builder.clearAll();
builder
  .insertInto('users')
  .insertColumns(['name', 'email'])
  .insertValues(['John', 'john@example.com'])
  .insertValues(['Jane', 'jane@example.com']);
// INSERT INTO "public"."users" ("name", "email") VALUES (John, john@example.com), (Jane, jane@example.com);
```

### UPDATE

```typescript
const builder = new PostgresQuery().newBuilder();

builder
  .updateTable('users', 'u')
  .set('name', 'John Updated')
  .set('age', 31)
  .where('u', 'id', WhereOperator.Equals, 1);
// UPDATE "public"."users" AS "u" SET "name" = John Updated, "age" = 31 WHERE "u"."id" = 1;

// Raw SET expression
builder.clearAll();
builder
  .updateTable('users', 'u')
  .setRaw('"login_count" = "login_count" + 1')
  .where('u', 'id', WhereOperator.Equals, 1);
```

### DELETE

```typescript
const builder = new PostgresQuery().newBuilder();

builder.deleteFrom('users', 'u').where('u', 'id', WhereOperator.Equals, 1);
// DELETE FROM "public"."users" AS "u" WHERE "u"."id" = 1;
```

### ORDER BY / LIMIT / OFFSET

```typescript
import { OrderByDirection } from '@deebeetech/sqleasy';

const builder = new PostgresQuery().newBuilder();

builder
  .selectAll()
  .fromTable('users', 'u')
  .orderByColumn('u', 'name', OrderByDirection.Ascending)
  .limit(10)
  .offset(20);
```

### GROUP BY / HAVING

```typescript
const builder = new PostgresQuery().newBuilder();

builder
  .selectColumn('u', 'role', '')
  .selectRaw('COUNT(*) AS cnt')
  .fromTable('users', 'u')
  .groupByColumn('u', 'role')
  .having('u', 'role', WhereOperator.NotEquals, 'guest');
```

### Common Table Expressions (CTEs)

```typescript
const builder = new PostgresQuery().newBuilder();

builder
  .cte('active_users', (cb) => {
    cb.selectAll().fromTable('users', 'u').where('u', 'active', WhereOperator.Equals, true);
  })
  .selectAll()
  .fromRaw('"active_users" AS "au"');
// WITH "active_users" AS (SELECT * FROM "public"."users" AS "u" WHERE "u"."active" = true)
//   SELECT * FROM "active_users" AS "au";

// Recursive CTE
builder.clearAll();
builder
  .cteRecursive('hierarchy', (cb) => {
    cb.selectColumn('e', 'id', '')
      .selectColumn('e', 'name', '')
      .selectColumn('e', 'manager_id', '')
      .fromTable('employees', 'e')
      .where('e', 'manager_id', WhereOperator.Equals, 1);
  })
  .selectAll()
  .fromRaw('"hierarchy" AS "h"');
```

### UNION / INTERSECT / EXCEPT

```typescript
const builder = new PostgresQuery().newBuilder();

builder
  .selectColumn('u', 'name', '')
  .fromTable('users', 'u')
  .union((ub) => {
    ub.selectColumn('c', 'name', '').fromTable('customers', 'c');
  });

// Also available: unionAll(), intersect(), except()
```

## Multi-Builder (Batched Statements)

Compose multiple statements into a single SQL string, optionally wrapped in a transaction — the
headline feature for shipping a set of writes as one atomic unit.

```typescript
import { PostgresQuery, MultiBuilderTransactionState, WhereOperator } from '@deebeetech/sqleasy';

const query = new PostgresQuery();
const multi = query.newMultiBuilder();

const b1 = multi.addBuilder('insert_user');
b1.insertInto('users').insertColumns(['name', 'email']).insertValues(['John', 'john@example.com']);

const b2 = multi.addBuilder('update_count');
b2.updateTable('stats', 's').set('user_count', 100).where('s', 'id', WhereOperator.Equals, 1);

console.log(multi.parseRaw());
// BEGIN; INSERT INTO "public"."users" ("name", "email") VALUES (John, john@example.com);UPDATE "public"."stats" AS "s" SET "user_count" = 100 WHERE "s"."id" = 1;COMMIT;

// Named builders can be removed or reordered before rendering
multi.reorderBuilders(['update_count', 'insert_user']);
multi.removeBuilder('update_count');

// Disable transaction wrapping (statements are emitted back-to-back, no BEGIN/COMMIT)
multi.setTransactionState(MultiBuilderTransactionState.TransactionOff);
```

## Prepared Statements vs Raw SQL

Every builder offers three renderings:

- **`parsePrepared()`** — the execution-safe one. Returns `{ sql, params }`: SQL with dialect
  placeholders (`?` for MSSQL/MySQL/SQLite, `$1`/`$2`/… for Postgres) plus the ordered bound values.
  Hand it straight to your driver.
- **`parse()`** — the SQL string with placeholders, without the values (handy for logging the shape).
- **`parseRaw()`** — values inlined into the SQL. **Debug / display only** — it is not escaped and
  not execution-safe. Never run `parseRaw()` output against a database.

```typescript
const builder = new PostgresQuery().newBuilder();
builder.selectAll().fromTable('users', 'u').where('u', 'id', WhereOperator.Equals, 42);

builder.parsePrepared(); // { sql: 'SELECT * FROM "public"."users" AS "u" WHERE "u"."id" = $1;', params: [42] }
builder.parse(); // SELECT * FROM "public"."users" AS "u" WHERE "u"."id" = $1;
builder.parseRaw(); // SELECT * FROM "public"."users" AS "u" WHERE "u"."id" = 42;   (debug only)
```

## Configuration

Pass a `RuntimeConfiguration` to customize behavior:

```typescript
import { PostgresQuery, RuntimeConfiguration } from '@deebeetech/sqleasy';

const rc = new RuntimeConfiguration();
rc.maxRowsReturned = 500;
rc.customConfiguration = { timeout: 30 };

const query = new PostgresQuery(rc);
```

## Migrating from 1.x

2.0 is a clean break — mechanical to adopt:

- **Dialect entry classes were renamed** to `*Query`: `PostgresSqlEasy` → `PostgresQuery`,
  `MssqlSqlEasy` → `MssqlQuery`, `MysqlSqlEasy` → `MysqlQuery`, `SqliteSqlEasy` → `SqliteQuery`.
  Update your imports and `new PostgresSqlEasy()` → `new PostgresQuery()`. Every builder and
  multi-builder method is otherwise identical.
- **The `I*` interfaces were removed** (`ISqlEasy`, `IBuilder`, `IJoinOnBuilder`, `IMultiBuilder`).
  Import the concrete types instead — `QueryBuilder`, `MultiBuilder`, `JoinOnBuilder`.
- **MSSQL correctness fix:** aliased `DELETE`/`UPDATE` now emit valid T-SQL
  (`DELETE [u] FROM [dbo].[users] AS [u] …`, `UPDATE [u] SET … FROM [dbo].[users] AS [u] …`),
  where 1.x produced invalid syntax.
- Unchanged: dual **ESM + CJS** builds, **JSR** publishing, the `multi_builder`, the `Datatype`
  enum, and all four dialects.

## License

MIT © DeeBee Tech
