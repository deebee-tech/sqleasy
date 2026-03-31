# SQLEasy

Lightweight, zero-dependency SQL query builder for **MSSQL**, **MySQL**, **PostgreSQL**, and **SQLite**. Build type-safe SELECT, INSERT, UPDATE, and DELETE statements with a fluent API and get dialect-correct output -- including identifier quoting, prepared-statement placeholders, and transaction wrappers.

## Installation

### JSR

```bash
npx jsr add @deebeetech/sqleasy
```

### npm

```bash
npm install @deebeetech/sqleasy
```

## Quick Start

```typescript
import { PostgresSqlEasy, WhereOperator } from "@deebeetech/sqleasy";

const sqlEasy = new PostgresSqlEasy();
const builder = sqlEasy.newBuilder();

builder
   .selectColumn("u", "id", "")
   .selectColumn("u", "name", "userName")
   .fromTable("users", "u")
   .where("u", "active", WhereOperator.Equals, true);

console.log(builder.parseRaw());
// SELECT "u"."id", "u"."name" AS "userName" FROM "public"."users" AS "u" WHERE "u"."active" = true;

console.log(builder.parse());
// SELECT "u"."id", "u"."name" AS "userName" FROM "public"."users" AS "u" WHERE "u"."active" = $1;
```

## Database Support

Each dialect has its own entry point that handles identifier quoting, placeholder syntax, default schemas, and transaction delimiters automatically.

```typescript
import {
   MssqlSqlEasy,
   MysqlSqlEasy,
   PostgresSqlEasy,
   SqliteSqlEasy,
} from "@deebeetech/sqleasy";

const mssql = new MssqlSqlEasy();       // [dbo].[table], ? placeholders, BEGIN TRANSACTION/COMMIT TRANSACTION
const mysql = new MysqlSqlEasy();       // `table`, ? placeholders, START TRANSACTION/COMMIT
const postgres = new PostgresSqlEasy(); // "public"."table", $1 placeholders, BEGIN/COMMIT
const sqlite = new SqliteSqlEasy();     // "table", ? placeholders, BEGIN/COMMIT
```

## Query Examples

### SELECT

```typescript
const sqlEasy = new PostgresSqlEasy();
const builder = sqlEasy.newBuilder();

// Select all columns
builder.selectAll().fromTable("users", "u");
// SELECT * FROM "public"."users" AS "u";

// Select specific columns
builder.clearAll();
builder
   .selectColumn("u", "id", "")
   .selectColumn("u", "name", "userName")
   .fromTable("users", "u");
// SELECT "u"."id", "u"."name" AS "userName" FROM "public"."users" AS "u";

// DISTINCT
builder.clearAll();
builder.distinct().selectColumn("u", "name", "").fromTable("users", "u");
// SELECT DISTINCT "u"."name" FROM "public"."users" AS "u";

// Raw expression
builder.clearAll();
builder.selectRaw("COUNT(*) AS total").fromTable("users", "u");
// SELECT COUNT(*) AS total FROM "public"."users" AS "u";

// Scalar sub-query in SELECT
builder.clearAll();
builder
   .selectAll()
   .selectWithBuilder("orderCount", (sb) => {
      sb.selectRaw("COUNT(*)").fromTable("orders", "o");
   })
   .fromTable("users", "u");
// SELECT *, (SELECT COUNT(*) FROM "public"."orders" AS "o") AS "orderCount" FROM "public"."users" AS "u";
```

### WHERE

```typescript
import { WhereOperator } from "@deebeetech/sqleasy";

const builder = new PostgresSqlEasy().newBuilder();

// Comparison operators
builder.selectAll().fromTable("users", "u")
   .where("u", "age", WhereOperator.GreaterThanOrEquals, 18);

// AND / OR
builder.clearAll();
builder.selectAll().fromTable("users", "u")
   .where("u", "active", WhereOperator.Equals, true)
   .and()
   .where("u", "age", WhereOperator.GreaterThan, 21);

// BETWEEN
builder.clearAll();
builder.selectAll().fromTable("users", "u")
   .whereBetween("u", "age", 18, 65);

// IS NULL / IS NOT NULL
builder.clearAll();
builder.selectAll().fromTable("users", "u")
   .whereNotNull("u", "email");

// IN (values)
builder.clearAll();
builder.selectAll().fromTable("users", "u")
   .whereInValues("u", "role", ["admin", "moderator"]);

// IN (sub-query)
builder.clearAll();
builder.selectAll().fromTable("users", "u")
   .whereInWithBuilder("u", "id", (sb) => {
      sb.selectColumn("o", "user_id", "").fromTable("orders", "o");
   });

// Grouped conditions
builder.clearAll();
builder.selectAll().fromTable("users", "u")
   .where("u", "active", WhereOperator.Equals, true)
   .and()
   .whereGroup((gb) => {
      gb.where("u", "role", WhereOperator.Equals, "admin")
         .or()
         .where("u", "role", WhereOperator.Equals, "moderator");
   });
```

### JOIN

```typescript
import { JoinType, JoinOperator } from "@deebeetech/sqleasy";

const builder = new PostgresSqlEasy().newBuilder();

builder
   .selectAll()
   .fromTable("users", "u")
   .joinTable(JoinType.Inner, "orders", "o", (jb) => {
      jb.on("u", "id", JoinOperator.Equals, "o", "user_id");
   });
// SELECT * FROM "public"."users" AS "u"
//   INNER JOIN "public"."orders" AS "o" ON "u"."id" = "o"."user_id";

// Multiple ON conditions
builder.clearAll();
builder
   .selectAll()
   .fromTable("users", "u")
   .joinTable(JoinType.Inner, "orders", "o", (jb) => {
      jb.on("u", "id", JoinOperator.Equals, "o", "user_id")
         .and()
         .on("u", "tenant_id", JoinOperator.Equals, "o", "tenant_id");
   });

// Multiple joins
builder.clearAll();
builder
   .selectAll()
   .fromTable("users", "u")
   .joinTable(JoinType.Inner, "orders", "o", (jb) => {
      jb.on("u", "id", JoinOperator.Equals, "o", "user_id");
   })
   .joinTable(JoinType.Left, "products", "p", (jb) => {
      jb.on("o", "product_id", JoinOperator.Equals, "p", "id");
   });

// Join with sub-query
builder.clearAll();
builder
   .selectAll()
   .fromTable("users", "u")
   .joinWithBuilder(
      JoinType.Inner,
      "recent_orders",
      (sb) => {
         sb.selectAll().fromTable("orders", "o")
            .where("o", "created_at", WhereOperator.GreaterThan, "2024-01-01");
      },
      (jb) => {
         jb.on("u", "id", JoinOperator.Equals, "recent_orders", "user_id");
      },
   );
```

### INSERT

```typescript
const builder = new PostgresSqlEasy().newBuilder();

builder
   .insertInto("users")
   .insertColumns(["name", "email", "age"])
   .insertValues(["John", "john@example.com", 30]);
// INSERT INTO "public"."users" ("name", "email", "age") VALUES (John, john@example.com, 30);

// Multi-row insert
builder.clearAll();
builder
   .insertInto("users")
   .insertColumns(["name", "email"])
   .insertValues(["John", "john@example.com"])
   .insertValues(["Jane", "jane@example.com"]);
// INSERT INTO "public"."users" ("name", "email") VALUES (John, john@example.com), (Jane, jane@example.com);
```

### UPDATE

```typescript
const builder = new PostgresSqlEasy().newBuilder();

builder
   .updateTable("users", "u")
   .set("name", "John Updated")
   .set("age", 31)
   .where("u", "id", WhereOperator.Equals, 1);
// UPDATE "public"."users" AS "u" SET "name" = John Updated, "age" = 31 WHERE "u"."id" = 1;

// Raw SET expression
builder.clearAll();
builder
   .updateTable("users", "u")
   .setRaw('"login_count" = "login_count" + 1')
   .where("u", "id", WhereOperator.Equals, 1);
```

### DELETE

```typescript
const builder = new PostgresSqlEasy().newBuilder();

builder
   .deleteFrom("users", "u")
   .where("u", "id", WhereOperator.Equals, 1);
// DELETE FROM "public"."users" AS "u" WHERE "u"."id" = 1;
```

### ORDER BY / LIMIT / OFFSET

```typescript
import { OrderByDirection } from "@deebeetech/sqleasy";

const builder = new PostgresSqlEasy().newBuilder();

builder
   .selectAll()
   .fromTable("users", "u")
   .orderByColumn("u", "name", OrderByDirection.Ascending)
   .limit(10)
   .offset(20);
```

### GROUP BY / HAVING

```typescript
const builder = new PostgresSqlEasy().newBuilder();

builder
   .selectColumn("u", "role", "")
   .selectRaw("COUNT(*) AS cnt")
   .fromTable("users", "u")
   .groupByColumn("u", "role")
   .having("u", "role", WhereOperator.NotEquals, "guest");
```

### Common Table Expressions (CTEs)

```typescript
const builder = new PostgresSqlEasy().newBuilder();

builder
   .cte("active_users", (cb) => {
      cb.selectAll().fromTable("users", "u")
         .where("u", "active", WhereOperator.Equals, true);
   })
   .selectAll()
   .fromRaw('"active_users" AS "au"');
// WITH "active_users" AS (SELECT * FROM "public"."users" AS "u" WHERE "u"."active" = true)
//   SELECT * FROM "active_users" AS "au";

// Recursive CTE
builder.clearAll();
builder
   .cteRecursive("hierarchy", (cb) => {
      cb.selectColumn("e", "id", "")
         .selectColumn("e", "name", "")
         .selectColumn("e", "manager_id", "")
         .fromTable("employees", "e")
         .where("e", "manager_id", WhereOperator.Equals, 1);
   })
   .selectAll()
   .fromRaw('"hierarchy" AS "h"');
```

### UNION / INTERSECT / EXCEPT

```typescript
const builder = new PostgresSqlEasy().newBuilder();

builder
   .selectColumn("u", "name", "")
   .fromTable("users", "u")
   .union((ub) => {
      ub.selectColumn("c", "name", "").fromTable("customers", "c");
   });

// Also available: unionAll(), intersect(), except()
```

## Multi-Builder (Batched Statements)

Combine multiple statements into a single SQL string, optionally wrapped in a transaction.

```typescript
import { PostgresSqlEasy, MultiBuilderTransactionState, WhereOperator } from "@deebeetech/sqleasy";

const sqlEasy = new PostgresSqlEasy();
const multi = sqlEasy.newMultiBuilder();

const b1 = multi.addBuilder("insert_user");
b1.insertInto("users")
   .insertColumns(["name", "email"])
   .insertValues(["John", "john@example.com"]);

const b2 = multi.addBuilder("update_count");
b2.updateTable("stats", "s")
   .set("user_count", 100)
   .where("s", "id", WhereOperator.Equals, 1);

console.log(multi.parseRaw());
// BEGIN; INSERT INTO "public"."users" ...;UPDATE "public"."stats" ...;COMMIT;

// Disable transaction wrapping
multi.setTransactionState(MultiBuilderTransactionState.TransactionOff);
```

## Prepared Statements vs Raw SQL

Every builder offers two rendering methods:

- **`parse()`** -- Returns SQL with dialect-specific parameter placeholders (`?` for MSSQL/MySQL/SQLite, `$1`/`$2`/... for Postgres). Use this when passing queries to a database driver.
- **`parseRaw()`** -- Returns SQL with values inlined. Useful for debugging and logging.

```typescript
const builder = new PostgresSqlEasy().newBuilder();
builder.selectAll().fromTable("users", "u")
   .where("u", "id", WhereOperator.Equals, 42);

builder.parse();    // SELECT * FROM "public"."users" AS "u" WHERE "u"."id" = $1;
builder.parseRaw(); // SELECT * FROM "public"."users" AS "u" WHERE "u"."id" = 42;
```

## Configuration

Pass a `RuntimeConfiguration` to customize behavior:

```typescript
import { PostgresSqlEasy, RuntimeConfiguration } from "@deebeetech/sqleasy";

const rc = new RuntimeConfiguration();
rc.maxRowsReturned = 500;
rc.customConfiguration = { timeout: 30 };

const sqlEasy = new PostgresSqlEasy(rc);
```

## License

MIT
