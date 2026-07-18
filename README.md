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

const mssql = new MssqlQuery(); // [dbo].[table], sp_executesql (values inlined, params empty), BEGIN TRANSACTION/COMMIT TRANSACTION
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

// DISTINCT ON (Postgres only — every other dialect throws a ParserError)
builder.clearAll();
builder
  .distinctOn([{ tableNameOrAlias: 'u', columnName: 'email' }])
  .selectAll()
  .fromTable('users', 'u');
// SELECT DISTINCT ON ("u"."email") * FROM "public"."users" AS "u";

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

### Window Functions

`.selectWindow(fn, over, alias)` adds `fn OVER (...)` to the SELECT list. `fn` is the window
function's call expression, emitted verbatim (like `.selectRaw()`, it is not quoted/escaped) —
`over` builds the structured `PARTITION BY`/`ORDER BY`/frame clause. Standard SQL, rendered
identically across all four dialects.

```typescript
import { FrameBoundType, FrameUnit } from '@deebeetech/sqleasy';

const builder = new PostgresQuery().newBuilder();

builder
  .selectColumn('o', 'id', '')
  .selectWindow(
    'ROW_NUMBER()',
    (w) => w.partitionByColumn('o', 'customer_id').orderByColumn('o', 'created_at'),
    'rn',
  )
  .fromTable('orders', 'o');
// SELECT "o"."id", ROW_NUMBER() OVER (PARTITION BY "o"."customer_id" ORDER BY "o"."created_at") AS "rn"
//   FROM "public"."orders" AS "o";

// A ROWS/RANGE frame
builder.clearAll();
builder
  .selectColumn('o', 'id', '')
  .selectWindow(
    'AVG("o"."total")',
    (w) =>
      w
        .orderByColumn('o', 'created_at')
        .frame(FrameUnit.Rows, FrameBoundType.Preceding, 1, FrameBoundType.Following, 1),
    'moving_avg',
  )
  .fromTable('orders', 'o');
// ... AVG("o"."total") OVER (ORDER BY "o"."created_at" ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING) AS "moving_avg" ...

// Raw fragments for expressions the structured builder can't express
builder.clearAll();
builder
  .selectWindow('RANK()', (w) => w.partitionByRaw('"region"').orderByRaw('"total" DESC'), 'r')
  .fromTable('orders', 'o');
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

// IS NULL / IS NOT NULL — prefer these helpers for null checks
builder.clearAll();
builder.selectAll().fromTable('users', 'u').whereNull('u', 'deleted_at');
builder.clearAll();
builder.selectAll().fromTable('users', 'u').whereNotNull('u', 'email');
// Equals/NotEquals with a null value also emit IS NULL / IS NOT NULL, but whereNull /
// whereNotNull make the intent explicit.

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

// ILIKE / NOT ILIKE — case-insensitive LIKE. Postgres emits native ILIKE; MySQL, SQLite, and
// MSSQL (none of which have ILIKE) get an equivalent LOWER(col) LIKE LOWER(?) rewrite.
builder.clearAll();
builder
  .selectAll()
  .fromTable('users', 'u')
  .where('u', 'email', WhereOperator.Ilike, '%@example.com');

// EXISTS / NOT EXISTS — whereExists/whereNotExists take only the sub-query builder (no
// unused table/column). whereExistsWithBuilder/whereNotExistsWithBuilder remain for parity
// with the wire/corpus format and behave identically.
builder.clearAll();
builder
  .selectAll()
  .fromTable('users', 'u')
  .whereExists((sb) => {
    sb.selectAll().fromTable('orders', 'o').where('o', 'user_id', WhereOperator.Equals, 1);
  });

// IS DISTINCT FROM / IS NOT DISTINCT FROM — null-safe (in)equality. Native on Postgres/SQLite;
// MySQL rewrites via its native <=> operator (NOT (a <=> b) / a <=> b); MSSQL has no equivalent
// (pre-2022 T-SQL) and throws a ParserError.
builder.clearAll();
builder
  .selectAll()
  .fromTable('orders', 'o')
  .where('o', 'status', WhereOperator.IsDistinctFrom, 'shipped');
// Postgres/SQLite: ... WHERE "o"."status" IS DISTINCT FROM shipped;
// MySQL:           ... WHERE NOT (`o`.`status` <=> shipped);
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

// Richer ON predicates — LIKE/NOT LIKE (via on/onValue), onIn/onNotIn, onBetween/onNotBetween
builder.clearAll();
builder
  .selectAll()
  .fromTable('orders', 'o')
  .joinTable(JoinType.Inner, 'customers', 'c', (jb) => {
    jb.on('o', 'customer_id', JoinOperator.Equals, 'c', 'id').and().onBetween('c', 'tier', 1, 3);
  });
// ... INNER JOIN "public"."customers" AS "c" ON "o"."customer_id" = "c"."id" AND "c"."tier" BETWEEN 1 AND 3;
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

// INSERT ... SELECT — the row source is a sub-query instead of a literal VALUES list. Mutually
// exclusive with insertValues (combining the two throws).
builder.clearAll();
builder
  .insertInto('archive')
  .insertColumns(['id', 'total'])
  .insertSelect((sub) =>
    sub
      .selectColumn('o', 'id', '')
      .selectColumn('o', 'total', '')
      .fromTable('orders', 'o')
      .where('o', 'archived', WhereOperator.Equals, true),
  );
// INSERT INTO "public"."archive" ("id", "total")
//   SELECT "o"."id", "o"."total" FROM "public"."orders" AS "o" WHERE "o"."archived" = true;
```

### RETURNING / OUTPUT

`.returning()` gets rows back from an `INSERT`/`UPDATE`/`DELETE`: Postgres/SQLite emit a trailing
`RETURNING`, MSSQL emits an inline `OUTPUT INSERTED.…`/`OUTPUT DELETED.…`. MySQL has no equivalent
and `.returning()` throws a `ParserError` there rather than silently dropping the columns.

```typescript
builder.clearAll();
builder
  .insertInto('users')
  .insertColumns(['name'])
  .insertValues(['John'])
  .returning(['id', 'name']);
// Postgres/SQLite: INSERT INTO "public"."users" ("name") VALUES (John) RETURNING "id", "name";
// MSSQL:           INSERT INTO [dbo].[users] ([name]) OUTPUT INSERTED.[id], INSERTED.[name] VALUES (John);

// Raw form, for expressions the structured column list can't express
builder.clearAll();
builder
  .insertInto('users')
  .insertColumns(['name'])
  .insertValues(['John'])
  .returningRaw('id, LOWER(name) AS name_lower');
```

### Upsert (INSERT conflict clause)

`.onConflictDoNothing()` / `.onConflictDoUpdate()` handle a conflicting row on `INSERT`: Postgres/SQLite
get `ON CONFLICT (...) DO NOTHING` / `DO UPDATE SET ...`; MySQL gets `INSERT IGNORE` / `ON DUPLICATE
KEY UPDATE` instead (its own conflicting-key detection ignores `conflictColumns`, kept only so one
call shape works on every dialect). MSSQL upsert is emitted as a `MERGE` statement (requires an
explicit column list and at least one conflict column).

```typescript
builder.clearAll();
builder
  .insertInto('users')
  .insertColumns(['email', 'name'])
  .insertValues(['john@example.com', 'John'])
  .onConflictDoUpdate(['email'], [{ columnName: 'name', value: 'John Updated' }]);
// Postgres/SQLite: ... ON CONFLICT ("email") DO UPDATE SET "name" = John Updated;
// MySQL:           ... ON DUPLICATE KEY UPDATE `name` = John Updated;

// Skip conflicting rows entirely
builder.clearAll();
builder
  .insertInto('users')
  .insertColumns(['email'])
  .insertValues(['john@example.com'])
  .onConflictDoNothing(['email']);
// Postgres/SQLite: ... ON CONFLICT ("email") DO NOTHING;
// MySQL:           INSERT IGNORE INTO `users` (`email`) VALUES (john@example.com);
// MSSQL:           MERGE INTO [dbo].[users] AS [target] USING (VALUES (...)) ...;
```

### JSON operators

Dialect-aware JSON path extraction and containment:

```typescript
builder
  .selectJsonExtract('u', 'meta', 'email', JsonExtractMode.Text, 'email')
  .fromTable('users', 'u')
  .whereJsonExtract('u', 'meta', 'email', JsonExtractMode.Text, WhereOperator.Equals, 'a@b.c')
  .whereJsonContains('u', 'meta', { role: 'admin' });
// Postgres: -> / ->> / @>; MySQL: JSON_EXTRACT / JSON_CONTAINS; MSSQL: JSON_VALUE / JSON_QUERY;
// SQLite: json_extract (containment throws — use whereRaw).
```

### Full-text search

```typescript
builder
  .fromTable('docs', 'd')
  .whereMatch([{ tableNameOrAlias: 'd', columnName: 'body' }], 'hello world', FullTextMode.Natural);
// Postgres: to_tsvector @@ plainto_tsquery; MySQL: MATCH ... AGAINST; MSSQL: FREETEXT/CONTAINS;
// SQLite: FTS5 column MATCH (requires an FTS virtual table).
```

### LATERAL / APPLY and table functions

```typescript
builder
  .fromTable('orders', 'o')
  .joinCrossApply('x', (sub) => sub.selectAll().fromTable('line_items', 'li'))
  .fromTableFunction('generate_series', 'g', [1, 10]);
// Postgres/MySQL: CROSS JOIN LATERAL; MSSQL: CROSS/OUTER APPLY; SQLite throws for LATERAL.
```

### GROUPING SETS / CUBE / ROLLUP

```typescript
builder.groupByColumn('o', 'region').groupByRollup(); // MySQL: WITH ROLLUP; others: GROUP BY ROLLUP (...)
```

### FETCH FIRST … WITH TIES

```typescript
builder.orderByColumn('o', 'total', OrderByDirection.Descending).limitWithTies(5);
// Postgres/MySQL/MSSQL: FETCH ... WITH TIES; SQLite throws.
```

### Query hints

Structured hints plus a raw escape hatch:

```typescript
builder.fromTable('users', 'u').hintUseIndex('u', 'users_email_idx'); // MySQL
builder.hintMssqlOption('RECOMPILE'); // MSSQL trailing OPTION (...)
builder.hintRaw('/*+ SeqScan(u) */'); // caller-owned SQL
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

### Join-backed UPDATE / DELETE

Adding a `.joinTable(...)` to an `UPDATE`/`DELETE` renders real dialect SQL instead of being
silently dropped: MySQL/MSSQL get a native multi-table `JOIN ... ON`; Postgres translates the
join's `ON` condition into a `WHERE` predicate (ANDed with any of your own `.where()` calls) and
renders it as `UPDATE ... FROM` / `DELETE ... USING` — only `INNER`/`CROSS` joins are supported
there, since translating an `OUTER` join to `WHERE` would silently turn it into an `INNER` join.
SQLite has no multi-table `UPDATE`/`DELETE` syntax at all and throws a `ParserError`.

```typescript
builder.clearAll();
builder
  .updateTable('orders', 'o')
  .set('total', 0)
  .joinTable(JoinType.Inner, 'customers', 'c', (jb) => {
    jb.on('o', 'customer_id', JoinOperator.Equals, 'c', 'id');
  })
  .where('c', 'banned', WhereOperator.Equals, true);
// MySQL:  UPDATE `orders` AS `o` INNER JOIN `customers` AS `c` ON `o`.`customer_id` = `c`.`id`
//           SET `total` = 0 WHERE `c`.`banned` = true;
// MSSQL:  UPDATE [o] SET [total] = 0 FROM [dbo].[orders] AS [o]
//           INNER JOIN [dbo].[customers] AS [c] ON [o].[customer_id] = [c].[id] WHERE [c].[banned] = true;
// Postgres: UPDATE "public"."orders" AS "o" SET "total" = 0 FROM "public"."customers" AS "c"
//           WHERE "o"."customer_id" = "c"."id" AND "c"."banned" = true;
```

### DELETE

```typescript
const builder = new PostgresQuery().newBuilder();

builder.deleteFrom('users', 'u').where('u', 'id', WhereOperator.Equals, 1);
// DELETE FROM "public"."users" AS "u" WHERE "u"."id" = 1;

// Join-backed DELETE — see "Join-backed UPDATE / DELETE" above; DELETE...USING mirrors UPDATE...FROM
builder.clearAll();
builder
  .deleteFrom('orders', 'o')
  .joinTable(JoinType.Inner, 'customers', 'c', (jb) => {
    jb.on('o', 'customer_id', JoinOperator.Equals, 'c', 'id');
  })
  .where('c', 'banned', WhereOperator.Equals, true);
// Postgres: DELETE FROM "public"."orders" AS "o" USING "public"."customers" AS "c"
//           WHERE "o"."customer_id" = "c"."id" AND "c"."banned" = true;
```

### Stored Procedures & Functions

`.callProcedure()` / `.callFunction()` invoke a stored routine as its own statement family — not a
raw escape. Arguments are added with `.procParam()` (positional), `.procParamNamed()` (named),
`.procParamRaw()` (a verbatim expression), and `.procParamOut()` / `.procParamInOut()` for
output parameters. `.clearCall()` removes a previously configured call.

Emission differs by dialect:

|              | Procedure                               | Function (scalar)      | Function (table-valued)   |
| ------------ | --------------------------------------- | ---------------------- | ------------------------- |
| **Postgres** | `CALL name(...)`                        | `SELECT name(...)`     | `SELECT * FROM name(...)` |
| **MySQL**    | `CALL name(...)`                        | `SELECT name(...)`     | not supported — throws    |
| **MSSQL**    | `EXEC name ...` (+ `DECLARE` as needed) | `SELECT name(...)`     | `SELECT * FROM name(...)` |
| **SQLite**   | not supported — throws                  | not supported — throws | not supported — throws    |

```typescript
import { CallReturnIntent } from '@deebeetech/sqleasy';

builder.clearAll();
builder.callProcedure('archive_user').procParam(42);
// Postgres/MySQL: CALL "public"."archive_user"(42); / CALL `archive_user`(42);
// MSSQL:          EXEC [dbo].[archive_user] 42;

builder.clearAll();
builder.callFunction('add_two').procParam(1).procParam(2);
// SELECT "public"."add_two"(1, 2);

// A set-returning / table-valued function
builder.clearAll();
builder.callFunction('users_over', CallReturnIntent.ResultSet).procParam(18);
// Postgres/MSSQL: SELECT * FROM "public"."users_over"(18);
// MySQL:          throws — no table-valued functions
```

Named parameters (Postgres `name := value`, MSSQL `@name = value`) are supported on every dialect
except MySQL, which has no named-argument call syntax and throws. Once a call uses a named
argument, every later argument in that call must also be named — a positional argument after a
named one throws, matching the underlying SQL's own rule.

```typescript
builder.clearAll();
builder.callProcedure('set_status').procParamNamed('user_id', 1).procParamNamed('status', 'active');
// Postgres: CALL "public"."set_status"(user_id := 1, status := active);
// MSSQL:    EXEC [dbo].[set_status] @user_id = 1, @status = active;
```

OUT/INOUT parameters are procedure-only (a function's result is its return expression, not an
output parameter — using them on `.callFunction()` throws). `name` doubles as the variable
identifier MSSQL `DECLARE`s and MySQL references as a session variable — required on both,
conventionally the same as the routine's own parameter name. Postgres has no variables at all; an
OUT value simply comes back as a result column of the `CALL`, so its argument slot is just `NULL`.

```typescript
builder.clearAll();
builder.callProcedure('archive_user').procParam(42).procParamOut('archived_count', 'INT');
// MSSQL:    DECLARE @archived_count INT; EXEC [dbo].[archive_user] 42, @archived_count = @archived_count OUTPUT;
// MySQL:    CALL `archive_user`(42, @archived_count);
// Postgres: CALL "public"."archive_user"($1, archived_count := $2);  -- 2nd param bound to NULL

// INOUT seeds the variable with an initial value first
builder.clearAll();
builder.callProcedure('adjust_balance').procParamInOut('balance', 100, 'INT');
// MSSQL: DECLARE @balance INT = 100; EXEC [dbo].[adjust_balance] @balance = @balance OUTPUT;
// MySQL: SET @balance = 100; CALL `adjust_balance`(@balance);
```

`sqlType` (e.g. `'INT'`, `'NVARCHAR(50)'`) is required for `.procParamOut()`/`.procParamInOut()` on
MSSQL — it has no way to infer a `DECLARE`d variable's type — and ignored elsewhere. A call cannot
be combined with a CTE or with `.returning()`; both throw a clear `ParserError` rather than
silently dropping the clause.

### ORDER BY / LIMIT / OFFSET

```typescript
import { NullsOrder, OrderByDirection } from '@deebeetech/sqleasy';

const builder = new PostgresQuery().newBuilder();

builder
  .selectAll()
  .fromTable('users', 'u')
  .orderByColumn('u', 'name', OrderByDirection.Ascending)
  .limit(10)
  .offset(20);

// NULLS FIRST / NULLS LAST — native on Postgres/SQLite; emulated on MySQL/MSSQL with a leading
// `CASE WHEN col IS NULL THEN ... END` sort key, since neither dialect has the clause.
builder.clearAll();
builder
  .selectAll()
  .fromTable('orders', 'o')
  .orderByColumn('o', 'shipped_at', OrderByDirection.Ascending, NullsOrder.Last);
// Postgres/SQLite: ORDER BY "o"."shipped_at" ASC NULLS LAST;
// MySQL/MSSQL:     ORDER BY CASE WHEN `o`.`shipped_at` IS NULL THEN 1 ELSE 0 END, `o`.`shipped_at` ASC;
```

`.limit()` is **pagination**: on MSSQL it renders as `OFFSET … ROWS FETCH NEXT … ROWS ONLY`, which
T-SQL accepts only alongside an `ORDER BY` — so paginating without one throws rather than emitting
SQL the server would reject. `.top(n)` is the separate, SQL-Server-only **manual row cap**, and the
tool to reach for when you want `TOP (n)` and no ordering. The two are not interchangeable, and
`.limit()` never silently becomes a `TOP`.

### Row locks (SELECT ... FOR UPDATE / FOR SHARE)

`.forUpdate()` / `.forShare()` lock the SELECT's result rows. Postgres/MySQL append a trailing
`FOR UPDATE`/`FOR SHARE` (optionally `NOWAIT` or `SKIP LOCKED`); MSSQL has no such clause, so it's
rewritten as a `WITH (...)` table hint (`UPDLOCK, ROWLOCK` / `HOLDLOCK, ROWLOCK`, with `NOWAIT` /
`READPAST` for the wait variants) on every base table in the `FROM`. SQLite has no row-level locking
at all and `.forUpdate()`/`.forShare()` throw a `ParserError` there.

```typescript
builder.clearAll();
builder.selectAll().fromTable('users', 'u').where('u', 'id', WhereOperator.Equals, 1).forUpdate();
// Postgres/MySQL: ... WHERE "u"."id" = 1 FOR UPDATE;
// MSSQL:          SELECT * FROM [dbo].[users] AS [u] WITH (UPDLOCK, ROWLOCK) WHERE [u].[id] = 1;

// Fail fast instead of waiting on an already-locked row
builder.clearAll();
builder.selectAll().fromTable('users', 'u').forUpdateNowait();

// Skip already-locked rows instead of waiting
builder.clearAll();
builder.selectAll().fromTable('users', 'u').forShareSkipLocked();
```

### TOP (SQL Server only)

`.top(n)` is the row cap you apply by hand when you want `TOP (n)` and no ordering. It has no
equivalent on the other three dialects.

```typescript
import { MssqlQuery } from '@deebeetech/sqleasy';

const builder = new MssqlQuery().newBuilder();

builder.selectAll().fromTable('users', 'u').top(10);
// SELECT TOP (10) * FROM [dbo].[users] AS [u];
```

`.clearTop()` clears an explicit cap again. Combining `.top()` with `.limit()` or `.offset()` throws:
T-SQL rejects `TOP` in the same SELECT as `OFFSET`/`FETCH` (Msg 10741), and the two express
different intents anyway — a manual cap is not pagination.

### GROUP BY / HAVING

```typescript
const builder = new PostgresQuery().newBuilder();

builder
  .selectColumn('u', 'role', '')
  .selectRaw('COUNT(*) AS cnt')
  .fromTable('users', 'u')
  .groupByColumn('u', 'role')
  .having('u', 'role', WhereOperator.NotEquals, 'guest');

// HAVING has full parity with WHERE: BETWEEN, IN (values or sub-query), NULL checks, EXISTS,
// and parenthesized groups — sharing WHERE's AND/OR combinator rules term for term.
builder.clearAll();
builder
  .selectColumn('u', 'role', '')
  .selectRaw('COUNT(*) AS cnt')
  .fromTable('users', 'u')
  .groupByColumn('u', 'role')
  .havingBetween('u', 'cnt', 5, 100)
  .and()
  .havingNotInValues('u', 'role', ['guest', 'banned']);
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

// Explicit column list — WITH name (col1, col2) AS (...). Standard SQL, rendered identically
// across all four dialects (only the RECURSIVE keyword itself differs on MSSQL).
builder.clearAll();
builder
  .cte(
    'recent',
    (cb) => cb.selectColumn('o', 'id', '').selectColumn('o', 'total', '').fromTable('orders', 'o'),
    ['id', 'total'],
  )
  .selectAll()
  .fromRaw('"recent" AS "r"');
// WITH "recent" ("id", "total") AS (SELECT "o"."id", "o"."total" FROM "public"."orders" AS "o")
//   SELECT * FROM "recent" AS "r";
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

### Executing a batch

`parse()` / `parseRaw()` render the batch as **one string for display or logging** — they do not
return bound parameters, so on Postgres, MySQL, and SQLite that string is **not** an execution-safe
prepared call. Placeholder numbering restarts at each statement (the Postgres batch above contains
`$1` and `$2` twice), so binding a single flat `params` array to it would misalign every value after
the first statement.

To **run** a batch, use `preparedStatements()` — each builder as its own `{ sql, params }` in order
(transaction delimiters are not included; wrap with BEGIN/COMMIT yourself when needed):

```typescript
const client = await pool.connect(); // your driver
try {
  await client.query('BEGIN');
  for (const { sql, params } of multi.preparedStatements()) {
    await client.query(sql, params);
  }
  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release();
}
```

## Prepared Statements vs Raw SQL

Every builder offers three renderings:

- **`parsePrepared()`** — the execution-safe one. Returns `{ sql, params }`. The exact shape is
  dialect-specific:
  - **Postgres** — `$1`/`$2`/… placeholders + the ordered `params`.
  - **MySQL / SQLite** — positional `?` placeholders + the ordered `params`.
  - **MSSQL** — a self-contained `exec sp_executesql …` batch with the values inlined as escaped
    arguments, so `params` is **empty** (`[]`). It is still injection-safe: values are escaped and
    passed as sp_executesql arguments, never concatenated into the statement text.

  Hand `{ sql, params }` straight to your driver — for MSSQL that's the batch string with no params.

- **`parse()`** — on Postgres / MySQL / SQLite, the SQL string with placeholders and no values
  (handy for logging the shape). On **MSSQL**, `parse()` and `parsePrepared()` both return the same
  `sp_executesql` string with values already inlined (`params` is empty) — there is no separate
  placeholder-only form.
- **`parseRaw()`** — values inlined into the SQL. **Debug / display only** — it is not escaped and
  not execution-safe. Never run `parseRaw()` output against a database.

> **Warning:** `*Raw*` builder methods (`whereRaw`, `selectRaw`, `fromRaw`, `setRaw`, etc.) are
> raw SQL sinks with no quoting or binding. Never pass untrusted input into them.

```typescript
const builder = new PostgresQuery().newBuilder();
builder.selectAll().fromTable('users', 'u').where('u', 'id', WhereOperator.Equals, 42);

builder.parsePrepared(); // { sql: 'SELECT * FROM "public"."users" AS "u" WHERE "u"."id" = $1;', params: [42] }
builder.parse(); // SELECT * FROM "public"."users" AS "u" WHERE "u"."id" = $1;
builder.parseRaw(); // SELECT * FROM "public"."users" AS "u" WHERE "u"."id" = 42;   (debug only)
```

## Configuration

Pass a `RuntimeConfiguration` to carry host-defined settings alongside a query:

```typescript
import { PostgresQuery, RuntimeConfiguration } from '@deebeetech/sqleasy';

const rc = new RuntimeConfiguration();
rc.customConfiguration = { timeout: 30 };

const query = new PostgresQuery(rc);
```

### SQLEasy never caps your rows

There is no automatic row limit. `SELECT * FROM users` with no `WHERE` compiles to exactly that, on
every dialect, and will happily return every row in the table. If you want a bound, say so —
`.limit()` to paginate, or `.top(n)` on SQL Server for an unordered cap.

This is deliberate. A cap the builder applies on its own is a truncation the caller never wrote and
cannot see in their own code: the query looks complete, the results look complete, and the rows are
simply missing. Deciding how many rows are too many needs to know what the query is _for_, which is
something only the caller knows. So SQLEasy emits what you asked for, and leaves the policy to you.

> Removed in **7.0.0**, along with `RuntimeConfiguration.maxRowsReturned`, which drove it. Before
> that a default cap of 1000 applied — but only ever coherently on SQL Server, where an unbounded
> `SELECT` collected a `TOP (1000)` while the identical query on Postgres returned everything. If you
> set `maxRowsReturned`, replace it with an explicit `.limit()` at your call sites.

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
- Unchanged: dual **ESM + CJS** builds, **JSR** publishing, the `multi_builder`, and all four
  dialects.

## License

MIT © DeeBee Tech
