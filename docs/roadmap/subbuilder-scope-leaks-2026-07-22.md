# SQLEasy — sub-builder clause-scope leaks

**Status:** **ALL 45 ARE FIXED** on `beta` (unreleased) — the 14 silent ones and the 31
invalid-SQL ones. Verified by direct reproduction: 16/16 and 21/21, each check paired with a
"still works" control so a refusal that over-reached would show up as a failure.

**Companion to** [`capability-gaps-2026-07-22.md`](capability-gaps-2026-07-22.md). That file is
missing _capabilities_; this one is **defects** — places where a clause set on a CHILD builder
stops meaning what the caller wrote once it is inlined into the parent statement.

## 1. What this is

A workflow of 54 agents probed six sub-builder seams **empirically** — building real queries with
the shipped `dist`, emitting the SQL, and running it against live Postgres 17, MySQL 8.4, MSSQL
2022 and SQLite. Every claimed leak then went through an adversarial pass whose job was to refute
it. **45 survived.**

The calibration example was the union-LIMIT bug already fixed on `beta`: a branch `.limit(3)`
emitted `… UNION ALL SELECT … LIMIT 3`, capping the whole union instead of the branch — one row
returned where four were written, on every dialect, with no error.

## 1a. What was fixed, and what a verification pass caught

All 6 wrong-scope and all 8 silently-dropped leaks are closed, each measured against the live
harness and pinned in the emission corpus. Verified 16/16 by direct reproduction afterwards.

A second workflow re-measured every rule with a one-variable-at-a-time protocol and **overturned
three claims** — two from the original sweep and one from the fix itself:

- **`limit(0)` was not a bug.** `limit()` has always thrown "LIMIT must be a positive integer", so
  0 can never reach the state. The sweep reported four zero-related leaks; two were real.
- **`offset(0)` must NOT require an ORDER BY.** The first fix made it presence-based, which
  correctly stopped it being dropped — but then it tripped a guard whose rationale (pagination needs
  a deterministic order) is false for skipping zero rows, and that refused Postgres's real
  `OFFSET 0` optimizer fence. Corrected in `522d2cc`.
- **MSSQL accepts a parenthesized set-operation operand.** The first fix claimed otherwise, because
  its probe had an ORDER BY inside the parentheses and the `Msg 156` was about the ORDER BY. MSSQL
  now emits a grouped operand; SQLite is the only engine that rejects the parentheses.

The through-line: **vary exactly one thing.** Every remaining floor and refusal reason in this
document should be re-measured that way before it is built on.

## 2. Triage — how the work was ordered

_Kept for the record; everything below is now done._

The headline count is 45. These are the counts that actually matter:

| Kind             | Count  | Why it matters                                             |
| ---------------- | ------ | ---------------------------------------------------------- |
| WRONG SCOPE      | **6**  | runs, and returns different rows than the caller wrote     |
| SILENTLY DROPPED | **8**  | the clause vanishes, with no error                         |
| INVALID SQL      | **31** | the engine rejects it, so the caller finds out immediately |

**14 are silent failures.** Those are the dangerous ones and are worth fixing first. The
other **31** emit SQL the engine rejects — real defects, since the builder
should refuse with a clear message instead of emitting garbage, but they cannot corrupt data,
because nothing runs. A number of those are also plain misuse (`callProcedure()` on a
derived-table child, a mutation built inside `usingSelect`), which the builder should reject at
the seam rather than splice.

**DeeBee hits none of them** — checked, not assumed. Its one derived table
(`buildBoundedCount` in `packages/dataset/src/builders/dataset-sql.ts`) always carries a non-zero
`limit(cap + 1)` alongside its ORDER BY, on a SELECT, which misses every derived-table leak. Its
e2e suite passes against MSSQL, which confirms it empirically.

## 3. The leaks, by seam

### Set operations (union / unionAll / intersect / except)

#### Nested set operations are flattened, discarding the grouping the caller expressed

**WRONG SCOPE** · postgres, mysql, sqlite, mssql

- **Caller meant:** The caller built the second operand as its own sub-builder that itself carries a set operation, i.e. `A UNION ALL (B UNION C)`. Nesting a builder inside a branch callback is the only way the API lets you express a grouped operand, so the nesting IS the parenthesis.
- **Actually does:** Every nested set operation is spliced into one flat left-associative chain. `A UNION ALL (B UNION C)` becomes `A UNION ALL B UNION C`, which every engine reads as `(A UNION ALL B) UNION C` — the outer UNION ALL's duplicates get deduplicated by the inner UNION that was never supposed to see them. No parentheses are ever emitted for a nested operand, and no error is raised.
- **When run:** All statements are accepted; they just return different rows than the caller wrote. n1 (intent = 4 rows 1,2,2,3): postgres FLAT -> `2 3 1` (3 rows), INTENT `... UNION ALL (SELECT ... UNION SELECT ...)` -> `1 2 3 2` (4 rows). mysql FLAT -> `1 2 3`, INTENT -> `1 2 3 2`. mssql FLAT -> `1 2 3`, INTENT -> `1 2 2 3`. sqlite FLAT -> `1 2 3`, INTENT rejected (`SQLITE_ERROR: near "(": syntax error`) so the caller cannot even get what they wrote. n3 (intent = 1 row {1}): postgres FLAT -> `3 1` (2 rows), INTENT -> `1`. mysql FLAT -> `1 3`, INTENT -> `1`. mssql FLAT -> `1 3`, INTENT -> `1`. sqlite FLAT -> `1 3`. n4 (intent […]

```js
const A = b => b.fromTable('customers','').selectColumn('','id','id').where('','id',WhereOperator.LessThanOrEquals,2);      // ids {1,2}
const B = u => u.fromTable('customers','').selectColumn('','id','id').where('','id',WhereOperator.GreaterThanOrEquals,2);   // ids {2,3}
const C = v => v.fromTable('customers','').selectColumn('','id','id').where('','id',WhereOperator.Equals,3);                // ids {3}

// (n1) intent: A UNION ALL (B UNION C)
A(b); b.unionAll(u => { B(u); u.union(v => C(v)); });

// (n3) intent: A EXCEPT (B UNION C)
A(b); b.except(u => { B(u); u.union(v => C(v)); });

…
```

Emitted:

```sql
(n1 postgres) SELECT "id" AS "id" FROM "public"."customers" WHERE "id" <= $1 UNION ALL SELECT "id" AS "id" FROM "public"."customers" WHERE "id" >= $2 UNION SELECT "id" AS "id" FROM "public"."customers" WHERE "id" = $3;

(n3 postgres) SELECT "id" AS "id" FROM "public"."customers" WHERE "id" <= $1 EXCEPT SELECT "id" AS "id" FROM "public"."customers" WHERE "id" >= $2 UNION SELECT "id" AS "id" FROM "public"."customers" WHERE "id" = $3;

…
```

> **Refuter's correction:** Nested set operations are flattened into one left-associative chain, silently changing the result — real on postgres, mysql, sqlite and mssql, and it affects all four set operators (UNION, UNION ALL, INTERSECT, EXCEPT), not just the three cases cited. Two parts of the claim's framing need correcting, and both matter for the fix: (a) "Nesting a builder inside a branch callback is the only way the API lets you express a grouped operand" is NOT accurate. `cte()` (and `fromWithBuilder`) can hoist a grouped operand, and the repo's own roadmap says so — docs/roadmap/capability-gaps-2026-07-22.md:163: "Parenthesized / grouped set-operation operands … Reachable via `fromWithBuilder` and `cte` on […]

#### Row-lock scope silently collapses to a single operand of the set operation (MySQL locks the last, MSSQL locks the first)

**WRONG SCOPE** · mysql, mssql

- **Caller meant:** `.forUpdate()` / `.updlock()` on the outer builder means "lock every row this query returns" — here rows id=1 (operand 1) and id=3 (operand 2). Symmetrically, `.forUpdate()` on a branch means "lock only that operand's rows".
- **Actually does:** The lock is rendered at whatever textual position that builder's own SELECT occupies, so it binds to one operand only. MySQL emits a trailing `FOR UPDATE` that InnoDB applies to the LAST operand — rows from operand 1 are left unlocked. MSSQL emits the table hint on the FIRST operand's table — rows from operand 2 are left unlocked. Worse, on MySQL the outer-builder call and the branch call produce byte-identical SQL (verified by string comparison), so "lock the whole result" and "lock this one branch" are indistinguishable and cannot both be right.
- **When run:** MySQL 8.4, two concurrent sessions. Session A: `START TRANSACTION; <emitted SQL with literals 1 and 3>; SELECT SLEEP(8);` — returns rows `1` and `3`. While A holds the transaction, a second session with `innodb_lock_wait_timeout=2` ran `START TRANSACTION; SELECT id FROM customers WHERE id=<R> FOR UPDATE;` for each row: row 1 -> succeeded, returned `1` (NOT locked, though the caller asked to lock the whole result) row 2 -> succeeded, returned `2` (control, in neither operand) row 3 -> `ERROR 1205 (HY000): Lock wait timeout exceeded; try restarting transaction` (locked) MSSQL 2022, same experiment. Session A […]

```js
// MySQL — lock set on the OUTER builder
mysqlBuilder
  .fromTable('customers', '')
  .selectColumn('', 'id', 'id')
  .where('', 'id', WhereOperator.Equals, 1)
  .forUpdate()
  .unionAll((u) =>
    u
      .fromTable('customers', '')
      .selectColumn('', 'id', 'id')
      .where('', 'id', WhereOperator.Equals, 3),
  );

// MSSQL — lock set on the OUTER builder
mssqlBuilder
  .fromTable('customers', '')
  .selectColumn('', 'id', 'id')
  .where('', 'id', WhereOperator.Equals, 1)
  .updlock()
  .unionAll((u) =>
    u
      .fromTable('customers', '')
      .selectColumn('', 'id', 'id')
      .where('', 'id', WhereOperator.Equals, 3),
  );
```

Emitted:

```sql
(mysql, outer .forUpdate()) SELECT `id` AS `id` FROM `customers` WHERE `id` = ? UNION ALL SELECT `id` AS `id` FROM `customers` WHERE `id` = ? FOR UPDATE;   -- params [1,3]

(mysql, branch .forUpdate()) SELECT `id` AS `id` FROM `customers` WHERE `id` = ? UNION ALL SELECT `id` AS `id` FROM `customers` WHERE `id` = ? FOR UPDATE;   -- BYTE-IDENTICAL, verified via string equality

…
```

> **Refuter's correction:** The claim is real and its dialect-level outcomes are exactly right, but the stated mechanism is wrong for MySQL and the severity is understated. MECHANISM CORRECTION: The claim says "the lock is rendered at whatever textual position that builder's own SELECT occupies." That is true for MSSQL — the WITH (UPDLOCK, ROWLOCK) hint attaches to that builder's own FROM table, so the outer builder (operand 1) gets the hint and the branch builder (operand 2) does not. It is FALSE for MySQL: the outer builder IS operand 1, yet its FOR UPDATE is rendered at the tail of the entire union, where InnoDB binds it to operand 2. On MySQL the locking clause is appended to the statement tail regardless of which […]

#### A nested INTERSECT inside a union branch silently means something different on SQLite than on the other three dialects

**WRONG SCOPE** · sqlite, postgres, mysql, mssql

- **Caller meant:** `A UNION ALL (B INTERSECT C)` — the INTERSECT was written on a sub-builder nested inside the union branch, so it should apply only to that branch. Expected 3 rows: 1, 2, 3.
- **Actually does:** Because the nested operand is emitted unparenthesized (same root cause as the flattening finding), the meaning is left to each engine's operator-precedence rules — and they disagree. Postgres, MySQL and MSSQL give INTERSECT higher precedence than UNION, so the flat text happens to mean what the caller wrote. SQLite treats all set operators as equal precedence and left-associative, so the same builder calls mean `(A UNION ALL B) INTERSECT C`. One builder program, two different answers, no error and no warning on either side. This is exactly the shape […]
- **When run:** Same emitted chain run on all four (A: id<=2, B: id>=2, C: id=3 over customers ids 1,2,3): postgres 17 -> `1 2 3` (3 rows — matches intent) mysql 8.4 -> `1 2 3` (3 rows — matches intent) mssql 2022 -> `1 2 3` (3 rows — matches intent) sqlite 3.45.1 -> `3` (1 row — WRONG; it computed (A UNION ALL B) INTERSECT C) The caller cannot repair it on SQLite either: the parenthesized form `SELECT ... UNION ALL (SELECT ... INTERSECT SELECT ...)` fails with `SQLITE_ERROR: near "(": syntax error`.

```js
// intent: A UNION ALL (B INTERSECT C)   with A={1,2}, B={2,3}, C={3}
b.fromTable('customers', '')
  .selectColumn('', 'id', 'id')
  .where('', 'id', WhereOperator.LessThanOrEquals, 2);
b.unionAll((u) => {
  u.fromTable('customers', '')
    .selectColumn('', 'id', 'id')
    .where('', 'id', WhereOperator.GreaterThanOrEquals, 2);
  u.intersect((v) =>
    v
      .fromTable('customers', '')
      .selectColumn('', 'id', 'id')
      .where('', 'id', WhereOperator.Equals, 3),
  );
});
```

Emitted:

```sql
(postgres) SELECT "id" AS "id" FROM "public"."customers" WHERE "id" <= $1 UNION ALL SELECT "id" AS "id" FROM "public"."customers" WHERE "id" >= $2 INTERSECT SELECT "id" AS "id" FROM "public"."customers" WHERE "id" = $3;
(sqlite)   SELECT "id" AS "id" FROM "customers" WHERE "id" <= ? UNION ALL SELECT "id" AS "id" FROM "customers" WHERE "id" >= ? INTERSECT SELECT "id" AS "id" FROM "customers" WHERE "id" = ?;
(mysql/mssql emit the same chain with their own quoting/placeholders)
```

> **Refuter's correction:** The claim is accurate as written, but understates the blast radius, and the correction strengthens it. It is framed as "SQLite disagrees with the other three", which a golden-corpus cross-dialect diff would catch as a data mismatch. The real defect is that a nested set operator inside a branch is NEVER parenthesized on any dialect, and there is a mirrored shape where all four engines are silently and identically wrong — which no cross-dialect comparison would flag at all. Verified: b.fromTable('customers','').selectColumn('','id','id').where('','id',WhereOperator.LessThanOrEquals,2); b.intersect(u => { […]

#### MSSQL hintMssqlOption() set on a branch silently becomes a statement-wide OPTION clause

**WRONG SCOPE** · mssql

- **Caller meant:** Apply the query hint to the operand it was written on. The method is exposed on the branch's builder view, so the API advertises it as settable per branch.
- **Actually does:** T-SQL's OPTION clause is statement-level and may appear exactly once, at the very end of the statement — so a branch hint is silently promoted to cover the whole compound, including operands the caller never hinted. The builder emits byte-identical SQL for the branch call and the outer call, so there is no representation of the branch-scoped intent at all; the distinction the API offers does not exist in the output. Nothing in the parser refuses it — `hintStates` is not consulted by the branch-scope guard.
- **When run:** mssql 2022 accepts and runs it, returning all 6 rows (`1 3 2 1 3 2` / the full customers rows twice). No error, no warning — the widened scope is completely silent. Byte-identity of the two builder programs confirmed in-process: `mk('outer') === mk('branch')` evaluates to `true`.

```js
// branch
mssqlBuilder
  .fromTable('customers', '')
  .selectColumn('', 'id', 'id')
  .unionAll((u) =>
    u.fromTable('customers', '').selectColumn('', 'id', 'id').hintMssqlOption('MAXDOP 1'),
  );

// outer — emits BYTE-IDENTICAL SQL (verified by string equality)
mssqlBuilder
  .fromTable('customers', '')
  .selectColumn('', 'id', 'id')
  .hintMssqlOption('MAXDOP 1')
  .unionAll((u) => u.fromTable('customers', '').selectColumn('', 'id', 'id'));
```

Emitted:

```sql
SET NOCOUNT ON; exec sp_executesql N'SELECT [id] AS [id] FROM [dbo].[customers] UNION ALL SELECT [id] AS [id] FROM [dbo].[customers] OPTION (MAXDOP 1);', N'';
```

> **Refuter's correction:** The claim is accurate but understates the severity. Byte-identity between the branch call and the outer call only holds when the hinted branch happens to be the FINAL operand — there the trailing OPTION lands in the one legal position by coincidence and MSSQL accepts it (6 rows returned), silently covering operands the caller never hinted. Anywhere else the emission is not merely mis-scoped, it is invalid T-SQL, all rejected by MSSQL 2022: (a) hint on the first of two branches emits "... UNION ALL SELECT [id] AS [id] FROM [dbo].[customers] OPTION (MAXDOP 1) UNION ALL SELECT [id] AS [id] FROM [dbo].[orders]" -> Msg 156, incorrect syntax near 'UNION'; (b) branch hint plus an outer […]

#### A CTE declared on a set-operation branch emits `UNION ALL WITH …`, which no engine parses

**INVALID SQL** · postgres, mysql, sqlite, mssql

- **Caller meant:** Define a CTE that the second operand of the union selects from. A CTE is a statement-level (or at minimum operand-level) construct; the caller expects the WITH to be hoisted to the front of the compound statement, as it correctly is when the same `cte()` call is made on the parent builder.
- **Actually does:** The child builder's whole rendering — WITH prologue included — is pasted verbatim after the set operator. `WITH` is only legal at the start of a statement (or inside a parenthesized subquery), never immediately after `UNION ALL`. The child's `cteStates` are not hoisted into the parent's WITH list and not refused; they are simply emitted in place. The parenthesization guard that was just added for ORDER BY/LIMIT/OFFSET does not look at `cteStates`, so it does not fire here.
- **When run:** Every dialect rejects it. postgres 17: `ERROR: syntax error at or near "WITH"` (caret on the token after UNION ALL) mysql 8.4: `ERROR 1064 (42000) at line 1: ... right syntax to use near 'WITH `cx`AS (SELECT * FROM`customers`) SELECT * FROM `cx`' at line 1` sqlite 3.45.1: `SQLITE_ERROR: near "WITH": syntax error` mssql 2022: `Msg 156, Level 15, State 1 — Incorrect syntax near the keyword 'WITH'.` followed by `Msg 319, Level 15, State 1 — Incorrect syntax near the keyword 'with'. If this statement is a common table expression ... the previous statement must be terminated with a semicolon.` All three variants […]

```js
builder
  .fromTable('customers', '')
  .selectAll()
  .unionAll((u) =>
    u
      .cte('cx', (c) => c.fromTable('customers', '').selectAll())
      .fromTable('cx', '')
      .selectAll(),
  );

// identical failure with .cteRaw('cx','SELECT 1 AS id') and .cteRecursive(...)
// and when BOTH the parent and the child declare a CTE:
builder
  .cte('cp', (c) => c.fromTable('customers', '').selectAll())
  .fromTable('cp', '')
  .selectAll()
  .unionAll((u) =>
    u
      .cte('cc', (c) => c.fromTable('customers', '').selectAll())
      .fromTable('cc', '')
      .selectAll(),
  );
```

Emitted:

```sql
(postgres) SELECT * FROM "public"."customers" UNION ALL WITH "cx" AS (SELECT * FROM "public"."customers") SELECT * FROM "public"."cx";
(mysql)    SELECT * FROM `customers` UNION ALL WITH `cx` AS (SELECT * FROM `customers`) SELECT * FROM `cx`;
(sqlite)   SELECT * FROM "customers" UNION ALL WITH "cx" AS (SELECT * FROM "customers") SELECT * FROM "cx";
(mssql)    SET NOCOUNT ON; exec sp_executesql N'SELECT * FROM [dbo].[customers] UNION ALL WITH [cx] AS (SELECT * FROM [dbo].[customers]) SELECT * FROM [dbo].[cx];', N'';
```

> **Refuter's correction:** The claim is accurate; two refinements, both widening it rather than weakening it. (a) SCOPE IS BROADER THAN "unionAll". The leak fires for all four set operators and all three CTE constructors, since none of them is gated by branchIsScoped: .union(...) -> SELECT * FROM "public"."customers" UNION WITH "cx" AS (...) SELECT * FROM "public"."cx"; [pg: syntax error at or near "WITH"] .intersect(...) -> SELECT * FROM "public"."customers" INTERSECT WITH "cx" AS (...) SELECT * FROM "public"."cx"; .except(...) -> SELECT * FROM "public"."customers" EXCEPT WITH "cx" AS (...) SELECT * FROM "public"."cx"; .cteRaw('cx','SELECT 1 AS id') -> ... UNION ALL WITH "cx" AS (SELECT 1 AS id) SELECT ... [pg […]

#### Any row lock on a set operation is rejected outright by Postgres, and on a non-final MySQL branch is a syntax error

**INVALID SQL** · postgres, mysql

- **Caller meant:** Lock the rows produced by that one operand (branch call), or by the whole result (outer call).
- **Actually does:** The locking clause is pasted at the branch's textual position with no operand parentheses and no capability check. Postgres forbids row locks anywhere in a UNION/INTERSECT/EXCEPT, so every one of these — branch or outer, forUpdate or forShare or forUpdateSkipLocked — is a statement Postgres will never run; the builder emits it happily rather than refusing the way it now refuses a branch ORDER BY. On a non-final branch the clause lands mid-chain, which is a hard syntax error on both engines. Setting it on both outer and branch emits a duplicated `FOR […]
- **When run:** postgres 17: (a) `ERROR: FOR UPDATE is not allowed with UNION/INTERSECT/EXCEPT` (and `FOR SHARE is not allowed with UNION/INTERSECT/EXCEPT` for forShare; forUpdateSkipLocked gives the FOR UPDATE message) (b) `ERROR: syntax error at or near "UNION"` with the caret on the UNION that follows FOR UPDATE (c) `ERROR: FOR UPDATE is not allowed with UNION/INTERSECT/EXCEPT` mysql 8.4: (a) accepted (see the separate wrong-scope finding — it locks only the last operand) (b) `ERROR 1064 (42000) at line 1: ... near 'UNION ALL SELECT `id`AS`id`FROM`customers`' at line 1` (c) `ERROR 3569 (HY000) at line 1: Table customers […]

```js
// (a) branch lock — Postgres rejects
pgBuilder.fromTable('customers','').selectColumn('','id','id')
  .unionAll(u => u.fromTable('customers','').selectColumn('','id','id').forUpdate());
// same for .forShare() and .forUpdateSkipLocked()

// (b) lock on a NON-final branch — Postgres and MySQL both syntax-error
builder.fromTable('customers','').selectColumn('','id','id')
  .unionAll(u => u.fromTable('customers','').selectColumn('','id','id').forUpdate())
  .unionAll(u => u.fromTable('customers','').selectColumn('','id','id'));

// (c) lock on outer AND on a branch
…
```

Emitted:

```sql
(a postgres) SELECT "id" AS "id" FROM "public"."customers" UNION ALL SELECT "id" AS "id" FROM "public"."customers" FOR UPDATE;
(a postgres, forShare) ... UNION ALL SELECT ... FOR SHARE;
(a postgres, skipLocked) ... UNION ALL SELECT ... FOR UPDATE SKIP LOCKED;

(b postgres) SELECT "id" AS "id" FROM "public"."customers" UNION ALL SELECT "id" AS "id" FROM "public"."customers" FOR UPDATE UNION ALL SELECT "id" AS "id" FROM "public"."customers";
(b mysql)    SELECT `id` AS `id` FROM `customers` UNION ALL SELECT `id` AS `id` FROM `customers` FOR UPDATE UNION ALL SELECT `id` AS `id` FROM `customers`;

…
```

> **Refuter's correction:** The bug is real but the claim mis-states two supporting details, and one sub-case must be dropped. (1) WRONG: "the builder emits it happily rather than refusing the way it now refuses a branch ORDER BY". The builder does not refuse a branch ORDER BY -- it correctly parenthesizes the operand: b.fromTable('customers','').selectColumn('','id','id').unionAll(u=>u.fromTable('customers','').selectColumn('','id','id').orderByColumn('','id',q.OrderByDirection.Ascending)) emits `SELECT "id" AS "id" FROM "public"."customers" UNION ALL (SELECT "id" AS "id" FROM "public"."customers" ORDER BY "id" ASC);` which Postgres executes successfully. Branch .limit(1) is parenthesized the same way. The accurate […]

#### MSSQL hintMssqlOption() on a non-final branch, or on both outer and a branch, emits unparseable T-SQL

**INVALID SQL** · mssql

- **Caller meant:** (a) Hint the middle operand. (b) Hint the statement with MAXDOP 1 and additionally hint that one branch with RECOMPILE.
- **Actually does:** (a) The OPTION clause is emitted at the middle branch's textual position, i.e. in the middle of the operator chain, where T-SQL permits nothing but the next set operator. (b) Two OPTION clauses are emitted back to back — and in reversed order, the branch's RECOMPILE preceding the outer's MAXDOP. T-SQL allows at most one OPTION clause per statement, at the end. Neither case is detected; the builder produces a statement that cannot be parsed.
- **When run:** mssql 2022: (a) `Msg 156, Level 15, State 1, Server cfcad801b1f8, Line 1 — Incorrect syntax near the keyword 'UNION'.` (b) `Msg 156, Level 15, State 1, Server cfcad801b1f8, Line 1 — Incorrect syntax near the keyword 'OPTION'.`

```js
// (a) hint on a non-final branch
mssqlBuilder
  .fromTable('customers', '')
  .selectColumn('', 'id', 'id')
  .unionAll((u) =>
    u.fromTable('customers', '').selectColumn('', 'id', 'id').hintMssqlOption('MAXDOP 1'),
  )
  .unionAll((u) => u.fromTable('customers', '').selectColumn('', 'id', 'id'));

// (b) hint on outer AND on a branch
mssqlBuilder
  .fromTable('customers', '')
  .selectColumn('', 'id', 'id')
  .hintMssqlOption('MAXDOP 1')
  .unionAll((u) =>
    u.fromTable('customers', '').selectColumn('', 'id', 'id').hintMssqlOption('RECOMPILE'),
  );
```

Emitted:

```sql
(a) SET NOCOUNT ON; exec sp_executesql N'SELECT [id] AS [id] FROM [dbo].[customers] UNION ALL SELECT [id] AS [id] FROM [dbo].[customers] OPTION (MAXDOP 1) UNION ALL SELECT [id] AS [id] FROM [dbo].[customers];', N'';

(b) SET NOCOUNT ON; exec sp_executesql N'SELECT [id] AS [id] FROM [dbo].[customers] UNION ALL SELECT [id] AS [id] FROM [dbo].[customers] OPTION (RECOMPILE) OPTION (MAXDOP 1);', N'';
```

> **Refuter's correction:** The claim is accurate as written; two refinements worth recording. (1) The bug is positional and therefore silent rather than uniformly fatal: the identical `hintMssqlOption` call on the FINAL branch coincidentally lands in the valid trailing slot and is accepted by MSSQL (emits `... UNION ALL SELECT ... OPTION (MAXDOP 1);`, identical to setting the hint on the outer builder), so callers get accept-or-reject depending purely on which branch they attached the hint to. Only a non-final branch, or an outer+branch combination, produces unparseable T-SQL. (2) The defect is a missing guard, not a bad emitter: `branchIsScoped` in ts/query/src/parser/default-union.ts omits hint state from its […]

### CTE bodies (cte / cteRecursive / cteRaw)

#### MSSQL: hintMssqlOption() on a CTE body emits OPTION(...) inside the CTE parens instead of at statement end

**WRONG SCOPE** · mssql

- **Caller meant:** Attach a query hint while building the heavy CTE — the natural reading of calling the hint method on the CTE body builder.
- **Actually does:** OPTION is a statement-level clause in T-SQL: it may appear exactly once, at the very end of the whole statement. The builder renders it wherever it was set, so it lands inside the CTE parens and the statement will not compile. The control proves the clause itself is fine — the same call on the OUTER builder emits 'SELECT COUNT(*) FROM [r] OPTION (MAXDOP 1)' and runs. Setting it on both builders emits two OPTION clauses ('... OPTION (MAXDOP 1)) SELECT * FROM [r] OPTION (RECOMPILE)'), which is also rejected. Combining it with a legal body clause does not […]
- **When run:** Msg 156, Level 15, State 1: Incorrect syntax near the keyword 'OPTION'. (Outer-builder control ran clean and returned 3.)

```js
const b = new MssqlQuery().newBuilder();
b.cte('r', (c) => c.fromTable('orders', 'o').selectAll().hintMssqlOption('MAXDOP 1'));
b.fromRaw('[r]').selectAll();
b.parsePrepared();
```

Emitted:

```sql
SET NOCOUNT ON; exec sp_executesql N'WITH [r] AS (SELECT * FROM [dbo].[orders] AS [o] OPTION (MAXDOP 1)) SELECT * FROM [r];', N'';
```

> **Refuter's correction:** The claim is correct as written, but it is narrower than the actual defect. The leak is not CTE-specific — it is every inner builder scope, because `emitTrailingHints` in /Users/sandy/Github/sqleasy/ts/query/src/parser/to-sql.ts runs without consulting `state.isInnerStatement`. Verified additional broken scopes on the same server: - Derived table: b.fromWithBuilder('t', s => s.fromTable('orders','o').selectAll().hintMssqlOption('MAXDOP 1')); b.selectAll(); emits `SELECT * FROM (SELECT * FROM [dbo].[orders] AS [o] OPTION (MAXDOP 1)) AS [t];` -> Msg 156, Incorrect syntax near the keyword 'OPTION'. - EXISTS subquery: b.fromTable('orders','o').selectAll().whereExists(s => […]

#### MSSQL: orderByColumn() on a CTE body emits ORDER BY inside the CTE parens, which T-SQL forbids

**INVALID SQL** · mssql

- **Caller meant:** Order the rows produced by the CTE named r. The identical builder chain on a top-level SELECT emits valid T-SQL, and on Postgres/MySQL/SQLite the same CTE chain runs fine.
- **Actually does:** The ORDER BY is placed inside the CTE parens with no TOP/OFFSET/FETCH beside it. T-SQL only permits ORDER BY in a CTE when TOP, OFFSET or FOR XML is also present, so the whole statement fails to compile. There is no guard, even though the builder does guard the mirror-image case (limit() without orderBy() throws 'ORDER BY is required when using LIMIT on MSSQL'). This makes orderBy-alone on an MSSQL CTE body unconditionally dead: adding limit() converts it to OFFSET/FETCH and works, adding top() works, but plain orderBy() never does. Same failure shape […]
- **When run:** Msg 1033, Level 15, State 1: The ORDER BY clause is invalid in views, inline functions, derived tables, subqueries, and common table expressions, unless TOP, OFFSET or FOR XML is also specified. (Postgres/MySQL/SQLite ran the same shape and returned 3 rows in DESC order.)

```js
const b = new MssqlQuery().newBuilder();
b.cte('r', (c) =>
  c.fromTable('orders', 'o').selectAll().orderByColumn('o', 'id', OrderByDirection.Descending),
);
b.fromRaw('[r]').selectAll();
b.parsePrepared();
```

Emitted:

```sql
SET NOCOUNT ON; exec sp_executesql N'WITH [r] AS (SELECT * FROM [dbo].[orders] AS [o] ORDER BY [o].[id] DESC) SELECT * FROM [r];', N'';
```

> **Refuter's correction:** The core claim stands as written; two of the three additional shapes reproduce, but the nested-CTE shape is wrong and must be dropped. CONFIRMED extra shapes (both Msg 1033): - cteRecursive() body: b.cteRecursive('r', c => c.fromTable('orders','o').selectAll().orderByColumn('o','id',Descending)) emits WITH [r] AS (SELECT * FROM [dbo].[orders] AS [o] ORDER BY [o].[id] DESC) and fails with Msg 1033. - CTE body whose last member is a UNION ALL: emits WITH [r] AS (SELECT * FROM [dbo].[orders] AS [o] UNION ALL SELECT * FROM [dbo].[orders] AS [o2] ORDER BY [o].[id] DESC) and fails with Msg 1033. Control proves causation: the identical CTE with the ORDER BY removed returns 6 rows successfully […]

#### MSSQL: a CTE whose body declares its own CTE emits a nested WITH, which T-SQL does not allow

**INVALID SQL** · mssql

- **Caller meant:** Declare a helper CTE scoped to the body of the outer CTE. Postgres, MySQL 8.4 and SQLite all accept the emitted nested WITH and return 3 rows.
- **Actually does:** T-SQL has no nested WITH — a CTE body must be a plain query expression, and inner CTEs have to be hoisted into the single top-level WITH list. The builder inlines the child builder's cte state verbatim into the parens with no guard and no hoisting, so the statement does not parse. Identical failure with cteRecursive() nested inside cte(): 'WITH [r] AS (WITH [inner_c] ([n]) AS (SELECT 1 AS n ... UNION ALL ...) SELECT n FROM [inner_c]) SELECT n FROM [r];' — Postgres and MySQL both return 1,2,3,4 for that one.
- **When run:** Msg 156, Level 15, State 1: Incorrect syntax near the keyword 'WITH'. / Msg 319, Level 15: Incorrect syntax near the keyword 'with'. If this statement is a common table expression ... the previous statement must be terminated with a semicolon. / Msg 102, Level 15: Incorrect syntax near ')'.

```js
const b = new MssqlQuery().newBuilder();
b.cte('r', (c) => {
  c.cte('inner_c', (i) => i.fromTable('orders', 'o').selectAll());
  c.fromRaw('[inner_c]').selectAll();
});
b.fromRaw('[r]').selectAll();
b.parsePrepared();
```

Emitted:

```sql
SET NOCOUNT ON; exec sp_executesql N'WITH [r] AS (WITH [inner_c] AS (SELECT * FROM [dbo].[orders] AS [o]) SELECT * FROM [inner_c]) SELECT * FROM [r];', N'';
```

> **Refuter's correction:** The claim is accurate as written; two sharpenings for whoever fixes it. (a) Scope: the bug is NOT "MSSQL cannot do CTEs" or "MSSQL cannot do recursive CTEs" — both work and were verified running on the harness. The defect is narrowly that cte()/cteRecursive() invoked on a CHILD builder inside a cte() callback is inlined verbatim into the child's parentheses instead of being hoisted into the single top-level WITH list. Sibling top-level cte() calls already hoist into a correct comma-separated list on MSSQL, so the hoisting machinery exists and simply is not applied to nested scopes. (b) A correct emission exists and is valid T-SQL, so this is fixable by hoisting rather than by removing the […]

#### A CTE body built as INSERT/UPDATE/DELETE is inlined verbatim; only Postgres-with-RETURNING accepts it

**INVALID SQL** · mssql, sqlite, mysql, postgres

- **Caller meant:** A data-modifying CTE — 'delete these rows and select what came back'. The cte() callback hands the caller a full QueryBuilder, so insertInto/updateTable/deleteFrom are visible and accepted on it.
- **Actually does:** Only Postgres implements data-modifying CTEs, and only when the body carries RETURNING. The builder does no scope check: it renders the child's INSERT/UPDATE/DELETE straight into the CTE parens for every dialect. MSSQL and SQLite reject the statement outright. MySQL only accidentally blocks the RETURNING form (the returning() call throws 'MySQL does not support RETURNING'); drop returning() and MySQL emits a broken statement too. On Postgres the no-RETURNING variant also fails, because a referenced data-modifying WITH query must have RETURNING. So of […]
- **When run:** mssql: Msg 156 Incorrect syntax near the keyword 'DELETE'. + Msg 102 Incorrect syntax near ')'. (same for UPDATE). sqlite: SQLITE_ERROR: near "DELETE": syntax error (also near "UPDATE", near "INSERT"). mysql: ERROR 1064 (42000) ... near 'DELETE FROM `orders` WHERE 1=0) SELECT * FROM `r`'. postgres (no RETURNING): ERROR: WITH query "r" does not have a RETURNING clause. postgres (with RETURNING): runs clean.

```js
// MSSQL / SQLite / MySQL all emit this shape:
const b = new MssqlQuery().newBuilder();
b.cte('r', (c) => c.deleteFrom('orders', '').whereRaw('1=0').returning(['id']));
b.fromRaw('[r]').selectAll();
b.parsePrepared();

// no-RETURNING variant reaches MySQL too:
b.cte('r', (c) => c.updateTable('orders', '').set('total', 5).whereRaw('1=0'));
```

Emitted:

```sql
SET NOCOUNT ON; exec sp_executesql N'WITH [r] AS (DELETE FROM [dbo].[orders] OUTPUT DELETED.[id] WHERE 1=0) SELECT * FROM [r];', N'';
-- sqlite: WITH "r" AS (DELETE FROM "orders" WHERE 1=0 RETURNING "id") SELECT * FROM "r";
-- mysql:  WITH `r` AS (UPDATE `orders` SET `total` = ? WHERE 1=0) SELECT * FROM `r`;
-- pg:     WITH "r" AS (INSERT INTO "public"."customers" ("id", "email") VALUES ($1, $2)) SELECT * FROM "r";
```

> **Refuter's correction:** The claim is accurate except for its final count: the builder emits 7 of the 8 (dialect x with/without RETURNING) combinations, not all eight. MySQL + RETURNING is blocked — as the claim itself notes — but the block fires at parsePrepared(), not at the returning() call site: b.cte('r', c => c.deleteFrom('orders','').whereRaw('1=0').returning(['id'])) returns cleanly and the throw `Delete: MySQL does not support RETURNING` happens later at parse time. The "exactly one of eight is valid" half is correct: only Postgres-with-RETURNING executes, and it does so for all three statement kinds (INSERT, UPDATE and DELETE with RETURNING all run on Postgres). Secondary, adjacent to but not part of the […]

#### Postgres: limit()/offset() on a cteRecursive() body emits LIMIT inside the recursive term

**INVALID SQL** · postgres

- **Caller meant:** Cap the recursive CTE at 3 rows. The same chain is valid on a top-level Postgres SELECT, and MySQL and SQLite both run this exact CTE SQL and return 1,2,3 — so the caller has every reason to expect it to work.
- **Actually does:** Postgres does not implement LIMIT anywhere inside a recursive query, including as a cap on the whole WITH RECURSIVE body. The builder emits it unguarded, so a chain that is valid on three of four dialects — and valid on Postgres itself outside a recursive CTE — hard-fails at execution. The offset() form is worse: it first trips the builder's own 'ORDER BY is required when using OFFSET' guard, and satisfying that guard by adding orderBy makes Postgres reject the ORDER BY as well (see the ORDER BY leak), so there is no reachable Postgres spelling of […]
- **When run:** ERROR: LIMIT in a recursive query is not implemented (LINE 1: ...UNION ALL SELECT n + 1 FROM "r" WHERE n < 5 LIMIT 3) SELECT ...). MySQL returned 1,2,3; SQLite returned 1,2,3; the MSSQL builder threw before emitting.

```js
const b = new PostgresQuery().newBuilder();
b.cteRecursive(
  'r',
  (c) => {
    c.fromRaw('(SELECT 1 AS c) AS z').selectRaw('1 AS n');
    c.unionAll((u) => u.fromRaw('"r"').selectRaw('n + 1').whereRaw('n < 5'));
    c.limit(3);
  },
  ['n'],
);
b.fromRaw('"r"').selectRaw('n');
b.parsePrepared();
```

Emitted:

```sql
WITH RECURSIVE "r" ("n") AS (SELECT 1 AS n FROM (SELECT 1 AS c) AS z UNION ALL SELECT n + 1 FROM "r" WHERE n < 5 LIMIT 3) SELECT n FROM "r";
```

> **Refuter's correction:** Postgres: limit()/offset()/orderBy* on a cteRecursive() body emit into the recursive CTE with no dialect refusal, producing SQL Postgres cannot execute. Builder calls (exact): const b = new PostgresQuery().newBuilder(); b.cteRecursive('r', c => { c.fromRaw('(SELECT 1 AS c) AS z').selectRaw('1 AS n'); c.unionAll(u => u.fromRaw('"r"').selectRaw('n + 1').whereRaw('n < 5')); c.limit(3); }, ['n']); b.fromRaw('"r"').selectRaw('n'); b.parsePrepared(); Emitted SQL: WITH RECURSIVE "r" ("n") AS (SELECT 1 AS n FROM (SELECT 1 AS c) AS z UNION ALL SELECT n + 1 FROM "r" WHERE n < 5 LIMIT 3) SELECT n FROM "r"; Caller intent: cap the recursive CTE at 3 rows. Engine responses, all run live: postgres -> […]

#### orderByColumn()/orderByRaw() on a cteRecursive() body is rejected by three of four engines

**INVALID SQL** · postgres, mysql, mssql

- **Caller meant:** Order the rows the recursive CTE produces. The clause is set on the CTE body builder and does land at the end of the CTE body, which is exactly where the caller wrote it.
- **Actually does:** Every engine except SQLite forbids ORDER BY at that position, each for its own reason (Postgres: not implemented in recursive queries; MySQL: ORDER BY over UNION in a recursive CTE unsupported; MSSQL: ORDER BY in a CTE needs TOP/OFFSET/FOR XML). The builder has no guard for any of them, so a three-line chain that reads as portable produces a statement that only runs on SQLite — and on SQLite the ORDER BY is silently ignored, returning 1,2,3,4,5 in recursion order rather than sorted order, so the one engine that accepts it does not honor it either.
- **When run:** postgres: ERROR: ORDER BY in a recursive query is not implemented. mysql: ERROR 1235 (42000): This version of MySQL doesn't yet support 'ORDER BY over UNION in recursive Common Table Expression'. mssql: Msg 1033, Level 15 — ORDER BY clause is invalid in ... common table expressions unless TOP, OFFSET or FOR XML is also specified. sqlite: accepted, returned [1],[2],[3],[4],[5] (unsorted-equivalent).

```js
const b = new PostgresQuery().newBuilder();
b.cteRecursive(
  'r',
  (c) => {
    c.fromRaw('(SELECT 1 AS c) AS z').selectRaw('1 AS n');
    c.unionAll((u) => u.fromRaw('"r"').selectRaw('n + 1').whereRaw('n < 5'));
    c.orderByRaw('1');
  },
  ['n'],
);
b.fromRaw('"r"').selectRaw('n');
b.parsePrepared();
```

Emitted:

```sql
WITH RECURSIVE "r" ("n") AS (SELECT 1 AS n FROM (SELECT 1 AS c) AS z UNION ALL SELECT n + 1 FROM "r" WHERE n < 5 ORDER BY 1) SELECT n FROM "r";
-- mysql: WITH RECURSIVE `r` (`n`) AS (... UNION ALL SELECT n + 1 FROM `r` WHERE n < 5 ORDER BY 1) SELECT n FROM `r`;
-- mssql: SET NOCOUNT ON; exec sp_executesql N'WITH [r] ([n]) AS (... UNION ALL SELECT n + 1 FROM [r] WHERE n < 5 ORDER BY 1) SELECT n FROM [r];', N'';
```

> **Refuter's correction:** Accurate in substance; two refinements to the claim's transcription. (1) The claim's MySQL and MSSQL lines show the recursive self-reference as `FROM \`r\``/`FROM [r]`, but the chain as written uses `fromRaw('"r"')`, which passes through verbatim — so MySQL/MSSQL actually receive `FROM "r"`and fail first on a caller-authored syntax error, not on ORDER BY. Substituting builder-native`fromTable('r','')` (which quotes per dialect) removes that confound, and all three rejections then reproduce exactly as claimed. The Postgres emission needs no correction and is byte-identical. (2) The claim reads as though ORDER BY over a UNION in a CTE is broadly rejected; it is specifically the RECURSIVE […]

#### MySQL: limit() on a union branch inside a cteRecursive() body emits a parenthesized operand the recursive block rejects

**INVALID SQL** · mysql

- **Caller meant:** Cap the recursive member at 3 rows per step. The builder deliberately parenthesizes the branch here — that is its fix for the top-level union-branch-limit problem, and at top level MySQL does accept 'SELECT ... UNION ALL (SELECT ... LIMIT 3)'.
- **Actually does:** The parenthesization strategy is chosen per-dialect but without knowing it is inside a recursive CTE. MySQL bans LIMIT (and ORDER BY, and DISTINCT) anywhere in the recursive query block, parenthesized or not, so the workaround that makes this valid at top level makes it invalid here. The builder already has context-aware guards for this family — SQLite and MSSQL both throw a precise 'cannot scope LIMIT to one branch of a set operation' error before emitting — but neither those guards nor any recursive-context guard fires for MySQL. Same emitted shape […]
- **When run:** ERROR 1235 (42000) at line 1: This version of MySQL doesn't yet support 'ORDER BY / LIMIT / SELECT DISTINCT in recursive query block of Common Table Expression'. Postgres accepted the same parenthesized form and returned 1,2,3,4,5 (and honors LIMIT 0 there, so it is not a no-op on PG).

```js
const b = new MysqlQuery().newBuilder();
b.cteRecursive(
  'r',
  (c) => {
    c.fromRaw('(SELECT 1 AS c) AS z').selectRaw('1 AS n');
    c.unionAll((u) => u.fromRaw('`r`').selectRaw('n + 1').whereRaw('n < 5').limit(3));
  },
  ['n'],
);
b.fromRaw('`r`').selectRaw('n');
b.parsePrepared();
```

Emitted:

```sql
WITH RECURSIVE `r` (`n`) AS (SELECT 1 AS n FROM (SELECT 1 AS c) AS z UNION ALL (SELECT n + 1 FROM `r` WHERE n < 5 LIMIT 3)) SELECT n FROM `r`;
```

> **Refuter's correction:** The claim is real, with one factual correction to its mechanism. It states that MySQL bans LIMIT in the recursive query block "parenthesized or not." That is wrong, and the truth makes the defect sharper rather than weaker: the UN-parenthesized form is ACCEPTED by MySQL, because without parentheses the LIMIT attaches to the CTE body as a whole and therefore sits outside the recursive query block. I ran "WITH RECURSIVE `r` (`n`) AS (SELECT 1 AS n FROM (SELECT 1 AS c) AS z UNION ALL SELECT n + 1 FROM `r` WHERE n < 5 LIMIT 3) SELECT n FROM `r`;" and it returned rows rather than erroring. The parenthesization the builder adds is precisely what relocates the LIMIT INTO the recursive query block […]

#### distinct() on the recursive member of a cteRecursive() body is rejected by MySQL and MSSQL

**INVALID SQL** · mysql, mssql

- **Caller meant:** De-duplicate the rows the recursive step produces. distinct() is a plain no-argument builder method with no dialect gate on it, and the same call inside a non-recursive CTE body emits SELECT DISTINCT and runs everywhere.
- **Actually does:** MySQL and MSSQL both specifically prohibit DISTINCT in the recursive part of a recursive CTE. The builder emits SELECT DISTINCT into the recursive member unconditionally — it gates distinctOn() by dialect but applies no scope check to distinct() at all. On Postgres and SQLite the statement runs but the DISTINCT is a per-iteration no-op (each step emits one row), so nothing is deduplicated there either.
- **When run:** mysql: ERROR 1235 (42000): This version of MySQL doesn't yet support 'ORDER BY / LIMIT / SELECT DISTINCT in recursive query block of Common Table Expression'. mssql: Msg 460, Level 16, State 1: DISTINCT operator is not allowed in the recursive part of a recursive common table expression 'r'. postgres/sqlite: accepted, returned 1,2,3,4,5.

```js
const b = new MysqlQuery().newBuilder();
b.cteRecursive(
  'r',
  (c) => {
    c.fromRaw('(SELECT 1 AS c) AS z').selectRaw('1 AS n');
    c.unionAll((u) => u.fromRaw('`r`').selectRaw('n + 1').whereRaw('n < 5').distinct());
  },
  ['n'],
);
b.fromRaw('`r`').selectRaw('n');
b.parsePrepared();
```

Emitted:

```sql
WITH RECURSIVE `r` (`n`) AS (SELECT 1 AS n FROM (SELECT 1 AS c) AS z UNION ALL SELECT DISTINCT n + 1 FROM `r` WHERE n < 5) SELECT n FROM `r`;
-- mssql: SET NOCOUNT ON; exec sp_executesql N'WITH [r] ([n]) AS (SELECT 1 AS n FROM (SELECT 1 AS c) AS z UNION ALL SELECT DISTINCT n + 1 FROM [r] WHERE n < 5) SELECT n FROM [r];', N'';
```

> **Refuter's correction:** Accurate as filed, with one wording sharpening: MySQL does not reject DISTINCT specifically — it rejects a class of constructs, reporting 'ORDER BY / LIMIT / SELECT DISTINCT in recursive query block of Common Table Expression' as unsupported (ERROR 1235). MSSQL's error IS DISTINCT-specific (Msg 460). Both are hard parse-time rejections scoped to the recursive member, so the substance of the claim stands. Scope: the leak is `distinct()` called on the builder passed to `unionAll()` inside a `cteRecursive()` body — i.e. the recursive member. The builder applies the DISTINCT faithfully to that child scope but performs no scope check, and unlike `distinctOn()` (which is dialect-gated with a […]

#### Postgres/MSSQL: referencing a declared CTE with fromTable() schema-qualifies the name, so it resolves to a missing base table instead of the CTE

**INVALID SQL** · postgres, mssql

- **Caller meant:** Select from the CTE just declared one call earlier. fromTable(name, alias) is the only structured way to name a FROM source, and the CTE name is right there in the same chain.
- **Actually does:** The CTE is emitted unqualified in the WITH list ('WITH "recent" AS'), but the reference gets the default owner injected ('"public"."recent"' / '[dbo].[recent]'). A schema-qualified name can never resolve to a CTE — both engines skip the WITH list entirely and look for a real base table. The builder knows the set of declared CTE names at parse time and does not consult it before qualifying. MySQL and SQLite are unaffected only because they have no default-owner to inject. The workaround is fromRaw('"recent"'), which drops out of the structured API. Every […]
- **When run:** postgres: ERROR: relation "public.recent" does not exist (LINE 1: ...FROM "public"."orders" AS "o") SELECT * FROM "public"."...). mssql: Msg 208, Level 16, State 1: Invalid object name 'dbo.recent'. mysql and sqlite returned all 3 rows.

```js
const b = new PostgresQuery().newBuilder();
b.cte('recent', (c) => c.fromTable('orders', 'o').selectAll());
b.fromTable('recent', '').selectAll();
b.parsePrepared();
```

Emitted:

```sql
WITH "recent" AS (SELECT * FROM "public"."orders" AS "o") SELECT * FROM "public"."recent";
-- mssql: SET NOCOUNT ON; exec sp_executesql N'WITH [recent] AS (SELECT * FROM [dbo].[orders] AS [o]) SELECT * FROM [dbo].[recent];', N'';
```

> **Refuter's correction:** The core finding is correct and reproduced, but one supporting detail is wrong. The claim states "The workaround is fromRaw('\"recent\"'), which drops out of the structured API." A structured workaround does exist: fromTableWithOwner('', 'recent', 'r') emits SELECT * FROM "recent" AS "r" on postgres and SELECT * FROM [recent] AS [r] on mssql, and I ran both — accepted, 3 rows returned. So fromRaw is not forced. That said, the escape hatch is weak enough that the audit author's conclusion is understandable and the bug still stands: (a) the entire *WithOwner family is undocumented — `grep -c WithOwner ts/query/README.md` returns 0; (b) all three CTE examples in that README (lines ~738, ~749 […]

### Derived tables in FROM (fromWithBuilder / fromLateral)

#### MySQL: forUpdate()/forShare() on the parent silently locks nothing in a derived / LATERAL FROM entry (Postgres locks it)

**WRONG SCOPE** · mysql, postgres

- **Caller meant:** Lock every row the statement reads. The caller wrote one forUpdate() over a FROM list containing a real table plus a derived/LATERAL table, and on Postgres that is exactly what happens - the lock is pushed down into the subquery and both base tables are locked.
- **Actually does:** On MySQL the trailing FOR UPDATE only reaches FROM entries that are real table references. Rows behind a derived table or a LATERAL derived table are read completely unlocked, with no warning and no error. The identical builder chain therefore locks a different set of rows on Postgres than on MySQL. MSSQL already guards this exact hazard (b.fromWithBuilder(...); b.selectAll().updlock() throws 'General: MSSQL cannot lock a derived table - a locking hint attaches to a table reference only'), so the codebase knows the shape and misses it for MySQL. The […]
- **When run:** Measured with a holding transaction plus a second session probing with FOR UPDATE NOWAIT. MySQL 8.4 control - session A: START TRANSACTION; SELECT id FROM `orders` FOR UPDATE; SLEEP(5). Probe B 'SELECT id FROM orders WHERE id=1 FOR UPDATE NOWAIT' -> ERROR 3572 (HY000) lock could not be acquired. Harness sound. MySQL test - session A: SELECT id FROM (SELECT * FROM `orders`) AS `s1` FOR UPDATE. Probe B -> returned 1. NO LOCK TAKEN. MySQL test - session A: SELECT id FROM (SELECT * FROM `orders` FOR UPDATE) AS `s1` (lock on the child). Probe B -> ERROR 3572. Lock taken. MySQL LATERAL test - session A: SELECT c.id […]

```js
const b = new MysqlQuery().newBuilder();
b.fromTable('customers', 'c');
b.fromLateral('l', (i) => i.fromTable('orders', 'o').selectAll());
b.selectAll().forUpdate();
b.parsePrepared();

// and the pure-derived form:
const b2 = new MysqlQuery().newBuilder();
b2.fromWithBuilder('s1', (i) => i.fromTable('orders', '').selectAll());
b2.selectAll().forUpdate(); // also .forShare()
```

Emitted:

```sql
mysql: SELECT * FROM `customers` AS `c`, LATERAL (SELECT * FROM `orders` AS `o`) AS `l` FOR UPDATE;
mysql: SELECT * FROM (SELECT * FROM `orders`) AS `s1` FOR UPDATE;
postgres: SELECT * FROM "public"."customers" AS "c", LATERAL (SELECT * FROM "public"."orders" AS "o") AS "l" FOR UPDATE;
```

> **Refuter's correction:** The claim is accurate as stated; only two cosmetic corrections. (a) The MSSQL guard message uses an em-dash, not a hyphen, and the LATERAL case has its own distinct message: 'General: MSSQL cannot lock a derived table — a locking hint attaches to a table reference only' for fromWithBuilder, and 'General: MSSQL cannot lock a LATERAL subquery — a locking hint attaches to a table reference only' for fromLateral. (b) Two additions that strengthen rather than alter the finding: MySQL emits NO warning and actually MERGES the simple derived table (EXPLAIN reports SIMPLE/orders, not DERIVED) yet still discards the lock, so callers cannot predict the hazard from materialization rules; and the same […]

#### MSSQL: offset(0) on a derived-table child is silently erased, stripping the only clause that made the child's ORDER BY legal (Msg 1033)

**SILENTLY DROPPED** · mssql, postgres, mysql, sqlite

- **Caller meant:** Sort the derived table and start at row 0 - the standard MSSQL idiom for making an ORDER BY legal inside a derived table ('ORDER BY ... OFFSET 0 ROWS'). The caller did exactly the correct thing for T-SQL.
- **Actually does:** offset(0) is treated as falsy by the limit/offset emitter and dropped on all four dialects, so 'OFFSET 0 ROWS' never reaches the SQL. At the top level that drop is a harmless no-op ('SELECT * FROM [dbo].[orders] ORDER BY [id]' is valid). Inlined into a FROM parenthesis it is fatal: the derived table is left with a bare ORDER BY, which T-SQL forbids. The bug is only observable through this seam. offset(1)/offset(2) survive, so a caller paginating a derived table from page 0 gets a hard failure while every other page works.
- **When run:** sqlcmd against mssql/server:2022 - emitted: Msg 1033, Level 15, State 1 - 'The ORDER BY clause is invalid in views, inline functions, derived tables, subqueries, and common table expressions, unless TOP, OFFSET or FOR XML is also specified.' What the caller wrote (OFFSET 0 ROWS kept, run by hand): SELECT * FROM (SELECT * FROM [dbo].[orders] ORDER BY [id] OFFSET 0 ROWS) AS [s1]; -> returned all 3 harness rows, no error. Postgres/MySQL/SQLite accept the emitted form (bare ORDER BY in a derived table is legal there), so only MSSQL breaks.

```js
const b = new MssqlQuery().newBuilder();
b.fromWithBuilder('s1', (i) =>
  i
    .fromTable('orders', '')
    .selectAll()
    .orderByColumn('', 'id', OrderByDirection.Ascending)
    .offset(0),
);
b.selectAll();
b.parsePrepared();
```

Emitted:

```sql
SET NOCOUNT ON; exec sp_executesql N'SELECT * FROM (SELECT * FROM [dbo].[orders] ORDER BY [id] ASC) AS [s1];', N'';

// contrast, same chain with .offset(2):
SET NOCOUNT ON; exec sp_executesql N'SELECT * FROM (SELECT * FROM [dbo].[orders] ORDER BY [id] ASC OFFSET 2 ROWS) AS [s1];', N'';
```

> **Refuter's correction:** MSSQL only: `.offset(0)` with no `.limit()` is silently erased, so a child-scope `ORDER BY` loses the `OFFSET 0 ROWS` that made it legal and the statement dies with Msg 1033. Reproduced on three seams -- `fromWithBuilder` derived table, `cte()`, and `whereInWithBuilder` subquery -- all against the live MSSQL 2022 harness. Two corrections to the original report: (1) the clause is dropped on all four dialects, but only MSSQL fails. Postgres, MySQL and SQLite all accepted the offset-stripped SQL on the live harness and returned identical rows, because `OFFSET 0` is a semantic no-op there -- the emitted SQL means exactly what the caller wrote, so those three are not leaks. (2) "a caller […]

#### MSSQL: top(0) on a derived-table child is silently dropped, so the row cap disappears and the derived table returns every row

**SILENTLY DROPPED** · mssql

- **Caller meant:** Two derived tables each carrying its own row cap: s1 capped at 0 rows, s2 capped at 2. TOP (0) is legal T-SQL meaning 'return no rows' - the natural encoding of a computed or zero page size.
- **Actually does:** Only s2's cap survives. top(0) is treated as falsy by the TOP emitter and vanishes entirely, so s1 is uncapped and contributes every row of orders to the cross product. A silent semantic inversion - 0 rows becomes all rows - with no error anywhere. The same drop happens for a top-level .top(0), so the drop itself is not caused by nesting; what the two-derived-table probe shows is that in one FROM list one sibling's cap silently evaporates while the other's is honoured. Note limit(0) is rejected outright ('LimitOffset: LIMIT must be a positive integer') […]
- **When run:** sqlcmd against mssql/server:2022 - emitted: SELECT id FROM (SELECT * FROM [dbo].[orders]) AS [s1]; -> returned 1, 2, 3 (all rows). What top(0) should have emitted, run by hand: SELECT id FROM (SELECT TOP (0) * FROM [dbo].[orders]) AS [s1]; -> returned zero rows. The full two-derived statement ran successfully and produced the uncapped cross product.

```js
const b = new MssqlQuery().newBuilder();
b.fromWithBuilder('s1', (i) => i.fromTable('orders', '').selectAll().top(0));
b.fromWithBuilder('s2', (i) => i.fromTable('customers', '').selectAll().top(2));
b.selectAll();
b.parsePrepared();
```

Emitted:

```sql
SET NOCOUNT ON; exec sp_executesql N'SELECT * FROM (SELECT * FROM [dbo].[orders]) AS [s1], (SELECT TOP (2) * FROM [dbo].[customers]) AS [s2];', N'';
```

> **Refuter's correction:** The defect is real but is not a derived-table or child-scope bug — the claim's own text concedes this and I confirmed it. `.top(0)` (and any non-positive top, e.g. `.top(-1)`) is silently discarded at every scope on MSSQL, top-level included: `b.fromTable('orders','').selectAll().top(0)` emits `SELECT * FROM [dbo].[orders];` and returned all 3 harness rows where `SELECT TOP (0) * FROM [dbo].[orders]` returns 0. Accurate statement: on MSSQL the TOP emitter in ts/query/src/parser/to-sql.ts:331 gates on `explicitTop > 0`, so a non-positive `.top(n)` is dropped from the generated SELECT at any nesting level, silently converting an explicit zero-row cap into an uncapped query — while the […]

#### fromWithBuilder()/fromLateral() on a DELETE or UPDATE builder discards the entire derived table, leaving a dangling alias reference

**SILENTLY DROPPED** · postgres, mysql, sqlite, mssql

- **Caller meant:** A correlated delete/update against a capped, filtered derived table - 'DELETE FROM orders USING (SELECT id FROM customers WHERE is_active = false LIMIT 2) s1 WHERE orders.customer_id = s1.id' on Postgres, or the MSSQL 'UPDATE ... FROM (...) s1' equivalent. Both are first-class SQL and both builders expose fromWithBuilder()/fromLateral() on a mutation builder without complaint.
- **Actually does:** The whole derived table - its SELECT, its WHERE, its limit - is dropped on the floor. No USING/FROM clause is emitted at all, and the WHERE the caller wrote against the derived alias survives, so the statement references an alias that does not exist. Plain fromTable() is dropped from mutations too, so the underlying gap is that the mutation FROM/USING clause is unimplemented rather than something unique to derived tables; but fromWithBuilder/fromLateral is the surface that offers it and gives no error. One mitigating measurement: the child's bound […]
- **When run:** All run inside transactions and rolled back. Postgres 17 DELETE: ERROR: missing FROM-clause entry for table "s1" Postgres 17 UPDATE: ERROR: missing FROM-clause entry for table "s1" Postgres 17 fromLateral DELETE: ERROR: missing FROM-clause entry for table "l" MySQL 8.4 DELETE (backticked raw): ERROR 1054 (42S22) Unknown column 's1.id' in 'where clause' SQLite (libsql in-memory) DELETE: SQLITE_ERROR: no such column: s1.id ; UPDATE: SQLITE_ERROR: no such column: s1.id MSSQL 2022 DELETE: Msg 102, Level 15, State 1, Incorrect syntax near 'customer_id'. UPDATE: Msg 102 near 'note'.

```js
const b = new PostgresQuery().newBuilder();
b.deleteFrom('orders');
b.fromWithBuilder('s1', i => i.fromTable('customers','')
    .selectColumn('','id','id')
    .where('','is_active',WhereOperator.Equals,false)
    .limit(2));
b.whereRaw('"orders"."customer_id" = "s1"."id"');
b.parsePrepared();

// identical behaviour for updateTable() and for fromLateral():
b.updateTable('orders'); b.setRaw('"note" = \'x\''); b.fromWithBuilder('s1', ...);
b.deleteFrom('orders');  b.fromLateral('l', ...);
```

Emitted:

```sql
postgres: DELETE FROM "public"."orders" WHERE "orders"."customer_id" = "s1"."id";
mysql:    DELETE FROM `orders` WHERE `orders`.`customer_id` = `s1`.`id`;
sqlite:   DELETE FROM "orders" WHERE "orders"."customer_id" = "s1"."id";
mssql:    SET NOCOUNT ON; exec sp_executesql N'DELETE FROM [dbo].[orders] WHERE "orders"."customer_id" = "s1"."id";', N'';
update form (postgres): UPDATE "public"."orders" SET "note" = 'x' WHERE "orders"."customer_id" = "s1"."id";
lateral form (postgres): DELETE FROM "public"."orders" WHERE "orders"."customer_id" = "l"."id";
```

> **Refuter's correction:** The behaviour is real and reported accurately; only the diagnosis needs correcting. The claim says "the underlying gap is that the mutation FROM/USING clause is unimplemented rather than something unique to derived tables." The mutation FROM/USING clause is in fact implemented and documented — through the join family. joinTable and joinWithBuilder on a DELETE/UPDATE both render correct dialect SQL (Postgres DELETE ... USING (...) AS s1 / UPDATE ... FROM, MySQL and MSSQL native multi-table joins, SQLite a ParserError), and ts/query/README.md:513-560 documents this under "Join-backed UPDATE / DELETE". The real gap is narrower and more clearly a defect: the from* family (fromTable […]

#### MSSQL: a derived-table child may carry a bare ORDER BY, which T-SQL rejects inside parentheses (Msg 1033)

**INVALID SQL** · mssql

- **Caller meant:** Order the rows of each derived table. Postgres, MySQL and SQLite all accept this verbatim and return the sorted rows, so the chain looks portable.
- **Actually does:** MSSQL forbids ORDER BY inside a derived table unless TOP, OFFSET or FOR XML accompanies it. The builder has an explicit MSSQL guard in the opposite direction (limit() without orderByColumn() throws 'ORDER BY is required when using LIMIT on MSSQL'), and it correctly rewrites orderBy+limit into 'ORDER BY ... OFFSET 0 ROWS FETCH NEXT n ROWS ONLY', but a child that sets only orderByColumn() passes validation and emits SQL the server cannot parse. Adding .top(n) to the child produces valid SQL ('SELECT TOP (2) * FROM [dbo].[orders] ORDER BY [id]' runs and […]
- **When run:** sqlcmd against mssql/server:2022 - two-derived-table form: Msg 1033, Level 15, State 1 (ORDER BY invalid in ... derived tables ...) followed by Msg 156, Level 15, State 1 'Incorrect syntax near the keyword ORDER.' single-derived-table form: Msg 1033. Top-level control 'SELECT id FROM [dbo].[orders] ORDER BY [id] DESC' -> 3, 2, 1 (fine, so the inlining is what breaks it). Postgres control 'SELECT id FROM (SELECT * FROM "public"."orders" ORDER BY "id" DESC) AS "s1"' -> 3, 2, 1. SQLite -> 8 rows descending. MySQL -> 3, 2, 1.

```js
const b = new MssqlQuery().newBuilder();
b.fromWithBuilder('s1', (i) =>
  i.fromTable('orders', '').selectAll().orderByColumn('', 'id', OrderByDirection.Descending),
);
b.fromWithBuilder('s2', (i) =>
  i.fromTable('customers', '').selectAll().orderByColumn('', 'id', OrderByDirection.Ascending),
);
b.selectAll();
b.parsePrepared();
```

Emitted:

```sql
SET NOCOUNT ON; exec sp_executesql N'SELECT * FROM (SELECT * FROM [dbo].[orders] ORDER BY [id] DESC) AS [s1], (SELECT * FROM [dbo].[customers] ORDER BY [id] ASC) AS [s2];', N'';

// single-derived-table form emits:
SET NOCOUNT ON; exec sp_executesql N'SELECT * FROM (SELECT * FROM [dbo].[orders] ORDER BY [id] DESC) AS [s1];', N'';
```

> **Refuter's correction:** The claim is accurate as written, but UNDERSTATES its scope in one way and rests on one stale corpus note. SCOPE IS WIDER THAN fromWithBuilder. The same Msg 1033 is produced by every nested-builder scope I could reach, so the fix is not local to the FROM parser: 1. cte('s1', i => i.fromTable('orders','').selectAll().orderByColumn('','id',Descending)) emits: SET NOCOUNT ON; exec sp_executesql N'WITH [s1] AS (SELECT * FROM [dbo].[orders] ORDER BY [id] DESC) SELECT * FROM [dbo].[s1];', N''; server: Msg 1033. 2. whereInWithBuilder('','id', i => i.fromTable('orders','').selectColumn('','customer_id').orderByColumn('','id',Descending)) emits: ... WHERE [id] IN (SELECT [customer_id] FROM […]

#### MSSQL: a CTE set on a derived-table child is inlined inside the FROM parentheses, which T-SQL cannot parse

**INVALID SQL** · mssql

- **Caller meant:** A derived table whose body is built on its own CTE. Postgres, MySQL 8 and SQLite all permit WITH at the head of a derived-table subquery and all three run this statement unchanged, so the chain looks portable.
- **Actually does:** T-SQL allows WITH only at the head of a statement; it has no notion of a WITH inside a parenthesised table expression. The child's CTE list needs to be hoisted into (or merged with) the outer statement's WITH, and instead it is emitted verbatim inside the parentheses. Two derived tables each defining a CTE of the same name is likewise emitted unchanged (and works on the other three dialects), so there is no hoisting logic at all. The top-level control 'WITH [c] AS (...) SELECT id FROM c' runs fine, confirming the inlining is what breaks it.
- **When run:** sqlcmd against mssql/server:2022 - Msg 156, Level 15, State 1: Incorrect syntax near the keyword 'WITH'. Msg 319, Level 15, State 1: Incorrect syntax near the keyword 'with'. If this statement is a common table expression, an xmlnamespaces clause or a change tracking context clause, the previous statement must be terminated with a semicolon. Msg 102, Level 15, State 1: Incorrect syntax near ')'. Same three errors for the outer-CTE-plus-inner-CTE variant. Postgres control -> 3 rows; MySQL control -> 3 rows; SQLite control -> 8 rows. All fine.

```js
const b = new MssqlQuery().newBuilder();
b.fromWithBuilder('s1', (i) =>
  i
    .cte('c', (c) => c.fromTable('orders', '').selectAll())
    .fromRaw('c')
    .selectAll(),
);
b.selectAll();
b.parsePrepared();
```

Emitted:

```sql
SET NOCOUNT ON; exec sp_executesql N'SELECT * FROM (WITH [c] AS (SELECT * FROM [dbo].[orders]) SELECT * FROM c) AS [s1];', N'';

// with an outer CTE as well:
SET NOCOUNT ON; exec sp_executesql N'WITH [outer_c] AS (SELECT * FROM [dbo].[customers]) SELECT * FROM (WITH [inner_c] AS (SELECT * FROM [dbo].[orders]) SELECT * FROM inner_c) AS [s1];', N'';
```

> **Refuter's correction:** The bug is real but the claim understates its scope and misstates the fix. SCOPE IS WIDER THAN DERIVED TABLES. There is no CTE hoisting or rejection in ANY child-builder scope on MSSQL. All of these emit a parenthesised WITH and all fail on T-SQL with Msg 156/319/102: - fromWithBuilder: SELECT * FROM (WITH [c] AS (...) SELECT * FROM c) AS [s1]; - joinWithBuilder: ... INNER JOIN (WITH [c] AS (SELECT * FROM [dbo].[orders]) SELECT * FROM c) AS [j] ON [cu].[id] = [j].[customer_id]; (ran it — same three errors) - whereInWithBuilder: ... WHERE [cu].[id] IN (WITH [c] AS (...) SELECT [id] FROM c); - whereExistsWithBuilder: ... WHERE EXISTS (WITH [c] AS (...) SELECT [id] FROM c) […]

#### MSSQL: hintMssqlOption() on a derived-table child emits OPTION (...) inside the parentheses (Msg 156)

**INVALID SQL** · mssql

- **Caller meant:** Attach a query hint while building the derived table. OPTION is a statement-level clause in T-SQL, so the only sane reading is 'apply MAXDOP 1 to the statement this subquery ends up in' - the hint should be hoisted to the end of the outer statement and reconciled with any outer hint into a single OPTION list.
- **Actually does:** The hint is emitted where the child builder put it, inside the derived table's parentheses, where OPTION is not grammatical. When the parent also sets a hint you get two OPTION clauses in one statement, which is illegal even after the inner one is moved. The top-level control 'SELECT id FROM [dbo].[orders] AS [o] OPTION (MAXDOP 1)' runs fine, so the inlining alone is what breaks it. hintRaw() behaves the same way, placing raw text inside the parentheses on all four dialects.
- **When run:** sqlcmd against mssql/server:2022 - child-only: Msg 156, Level 15, State 1: Incorrect syntax near the keyword 'OPTION'. child + outer: Msg 156, Level 15, State 1: Incorrect syntax near the keyword 'OPTION'. Top-level control: returned 1, 2, 3.

```js
const b = new MssqlQuery().newBuilder();
b.fromWithBuilder('s1', (i) => i.fromTable('orders', '').selectAll().hintMssqlOption('MAXDOP 1'));
b.selectAll();
b.parsePrepared();

// child hint plus an outer hint:
b.fromWithBuilder('s1', (i) => i.fromTable('orders', '').selectAll().hintMssqlOption('MAXDOP 1'));
b.selectAll().hintMssqlOption('RECOMPILE');
```

Emitted:

```sql
SET NOCOUNT ON; exec sp_executesql N'SELECT * FROM (SELECT * FROM [dbo].[orders] OPTION (MAXDOP 1)) AS [s1];', N'';

// child + outer:
SET NOCOUNT ON; exec sp_executesql N'SELECT * FROM (SELECT * FROM [dbo].[orders] OPTION (MAXDOP 1)) AS [s1] OPTION (RECOMPILE);', N'';
```

> **Refuter's correction:** The hintMssqlOption core of the claim is fully correct, including that a naive hoist is not enough (two OPTION clauses in one statement is itself Msg 156; the child and outer hints must be reconciled into a single merged list such as OPTION (MAXDOP 1, RECOMPILE), which MSSQL accepts). Two corrections: (a) The hintRaw() tail of the claim should be dropped — it is not a leak. hintRaw is the documented caller-owns-dialect-correctness escape hatch (ts/query/README.md:495), and the raw text it places inside the derived table's parentheses is grammatical there. Verified on the live server: SELECT count(_) FROM (SELECT * FROM "public"."orders" /_+ HINTHERE */) AS "s1" returned 3 on Postgres. The […]

#### callProcedure() on a derived-table child emits CALL/EXEC inside the FROM parentheses instead of throwing

**INVALID SQL** · postgres, mssql

- **Caller meant:** Either the caller wants a set-returning routine as a table source - which is fromTableFunction()/fromTableFunctionWithOwner(), a different method - or the call is a mistake. Either way the builder should refuse, the way it already refuses other misplaced clauses on a derived child.
- **Actually does:** A procedure invocation is inlined verbatim as a table expression and produces unparseable SQL on both dialects that expose callProcedure(). The refusal is inconsistent with sibling guards on the same child builder: returning() on a derived child throws 'General: RETURNING/OUTPUT requires INSERT, UPDATE, or DELETE', onConflictDoNothing() throws 'Insert: Upsert (ON CONFLICT) requires INSERT', and MSSQL's updlock() on a derived table throws 'MSSQL cannot lock a derived table' - but the query-type clauses callProcedure() and insertInto() pass validation and […]
- **When run:** postgres 17: ERROR: syntax error at or near ")" - LINE 1: SELECT * FROM (CALL "sp_who"()) AS "s1"; mssql 2022: Msg 156, Level 15, State 1: Incorrect syntax near the keyword 'EXEC'.

```js
const b = new PostgresQuery().newBuilder(); // and MssqlQuery
b.fromWithBuilder('s1', (i) => i.callProcedure('sp_who'));
b.selectAll();
b.parsePrepared();
```

Emitted:

```sql
postgres: SELECT * FROM (CALL "sp_who"()) AS "s1";
mssql:    SET NOCOUNT ON; exec sp_executesql N'SELECT * FROM (EXEC [sp_who]) AS [s1];', N'';
```

> **Refuter's correction:** Core claim stands; three corrections to scope and rationale. SCOPE — the leak also hits MySQL, which the claim omits: ``SELECT * FROM (CALL `sp_who`()) AS `s1`;`` → `ERROR 1064 (42000) ... near 'CALL `sp_who`()) AS `s1`'`. SQLite alone is correct, throwing `Call: SQLite does not support stored procedures or functions (CALL/EXEC)`. So the affected dialects are postgres, mssql AND mysql — every dialect that exposes callProcedure(). RATIONALE — the claim's third cited sibling guard is wrong: MSSQL updlock() on a derived child does NOT throw 'MSSQL cannot lock a derived table'. It emits `SET NOCOUNT ON; exec sp_executesql N'SELECT * FROM (SELECT * FROM [dbo].[orders] AS [o] WITH (UPDLOCK […]

#### insertInto() on a derived-table child emits an INSERT statement inside the FROM parentheses, with a nested-array parameter

**INVALID SQL** · postgres

- **Caller meant:** Nothing coherent - this is a caller mistake (a mutation built on a derived-table sub-builder). The honest response is a parse-time throw naming the misuse, which is what the same builder already does for returning() and onConflictDoNothing() on a derived child.
- **Actually does:** Two defects in one emission. (1) Postgres allows data-modifying statements only inside WITH, never as a FROM subquery, so the SQL is unparseable. (2) The single bound parameter comes back as the nested array [[1]] rather than [1] - the insertValues row was passed through as one parameter instead of being flattened - so even the parameter vector is wrong. Neither the query-type mismatch nor the parameter shape is validated.
- **When run:** postgres 17: ERROR: syntax error at or near "INTO" - LINE 1: SELECT * FROM (INSERT INTO "public"."orders" ("id") VALUES (...

```js
const b = new PostgresQuery().newBuilder();
b.fromWithBuilder('s1', (i) =>
  i
    .insertInto('orders')
    .insertColumns(['id'])
    .insertValues([[1]]),
);
b.selectAll();
b.parsePrepared();
```

Emitted:

```sql
SELECT * FROM (INSERT INTO "public"."orders" ("id") VALUES ($1)) AS "s1";   params=[[1]]
```

> **Refuter's correction:** CONFIRMED (defect 1 only, wider dialect scope): fromWithBuilder() accepts a mutation sub-builder and emits an INSERT inside the FROM parentheses with no parse-time throw. Repro: const b = new PostgresQuery().newBuilder(); b.fromWithBuilder('s1', i => i.insertInto('orders').insertColumns(['id']).insertValues([1])); b.selectAll(); b.parsePrepared(). Emits: SELECT * FROM (INSERT INTO "public"."orders" ("id") VALUES ($1)) AS "s1"; Rejected by ALL FOUR dialects, not just postgres (postgres/mysql/sqlite syntax errors; mssql Msg 10716 requires an OUTPUT clause). The same leak exists in whereInWithBuilder and whereExists. It is position-specific, not a blanket policy: the identical mutation child […]

### Predicate subqueries (whereIn / whereExists / having* WithBuilder)

#### MSSQL: orderBy() on any predicate sub-builder emits a bare ORDER BY inside the parens, which T-SQL rejects

**INVALID SQL** · mssql

- **Caller meant:** Order the rows the sub-select produces before feeding them to the IN list — exactly what the same chain does on Postgres/MySQL/SQLite, where it builds and runs.
- **Actually does:** The child builder is rendered by the same defaultToSql() path used for the outer statement (ts/query/src/parser/to-sql.ts, docstring: 'Used both for the outer statement and, recursively, for every nested subquery'), so nothing knows it is about to land inside parentheses. T-SQL forbids ORDER BY in a subquery unless TOP/OFFSET/FOR XML accompanies it. The library already carries the mirror-image guard ('ORDER BY is required when using LIMIT on MSSQL', default-limit-offset.ts:164) but not this one, so orderBy-without-a-row-cap sails through build and dies […]
- **When run:** MSSQL: ERROR — "The ORDER BY clause is invalid in views, inline functions, derived tables, subqueries, and common table expressions, unless TOP, OFFSET or FOR XML is also specified." Reproduced identically on whereNotInWithBuilder, whereExistsWithBuilder, whereNotExists, havingInWithBuilder, havingNotInWithBuilder, havingNotExists, and with an UPDATE parent. The identical builder chain runs clean on Postgres (2 rows), MySQL (2 rows) and SQLite (2 rows). Workarounds that DO run on MSSQL: adding .top(2) → 'SELECT TOP (2) ... ORDER BY [o].[total] DESC' (OK), or .offset(1) → 'ORDER BY ... OFFSET 1 ROWS' (OK).

```js
const b = new MssqlQuery().newBuilder();
b.fromTable('customers', 'c')
  .selectAll()
  .whereInWithBuilder('c', 'id', (s) =>
    s
      .fromTable('orders', 'o')
      .selectColumn('o', 'customer_id', '')
      .orderByColumn('o', 'total', OrderByDirection.Descending),
  );
b.parsePrepared();
```

Emitted:

```sql
SET NOCOUNT ON; exec sp_executesql N'SELECT * FROM [dbo].[customers] AS [c] WHERE [c].[id] IN (SELECT [o].[customer_id] FROM [dbo].[orders] AS [o] ORDER BY [o].[total] DESC);', N'';
```

> **Refuter's correction:** MSSQL: orderBy on ANY nested sub-builder scope — not just predicate sub-builders — emits a bare ORDER BY inside the parentheses, and T-SQL rejects the statement with Msg 1033. Confirmed leaking entry points, each verified against the live MSSQL harness: whereInWithBuilder, whereNotInWithBuilder, whereExistsWithBuilder, whereNotExistsWithBuilder (signature is `(tableNameOrAlias, columnName, builder)`), selectWithBuilder (`SELECT *, (SELECT ... ORDER BY ...) AS [cnt]`) and fromWithBuilder (`FROM [c], (SELECT ... ORDER BY ...) AS [sub]`). One correction to the claim's framing: the stated intent — "order the rows the sub-select produces before feeding them to the IN list" — is not delivered on […]

#### MySQL: limit() on an IN / NOT IN predicate sub-builder emits SQL the server refuses (ER 1235)

**INVALID SQL** · mysql

- **Caller meant:** Cap the sub-select at 3 rows before it becomes the IN list — the same call that works on Postgres and SQLite, where the LIMIT correctly scopes to the subquery only (verified: .limit(1) yields 1 outer row vs 2 with no limit).
- **Actually does:** MySQL categorically cannot evaluate LIMIT inside an IN/ALL/ANY/SOME subquery. SQLEasy exposes .limit() on the MySQL sub-builder and emits it verbatim, so the whole statement is rejected at execution — nothing at build time refuses it, and the parse-time guards that exist for MSSQL have no MySQL counterpart.
- **When run:** MySQL 8: ERROR — "This version of MySQL doesn't yet support 'LIMIT & IN/ALL/ANY/SOME subquery'" (ER_NOT_SUPPORTED_YET, 1235). Reproduced on whereInWithBuilder, whereNotInWithBuilder, havingInWithBuilder, havingNotInWithBuilder, wrapped in whereGroup(), and with a DELETE parent. The EXISTS family is unaffected: whereExists/whereNotExists/havingExists with .limit(1) (and even .orderByColumn().limit(1).offset(1)) all run fine on MySQL. Postgres and SQLite accept every IN-variant.

```js
const b = new MysqlQuery().newBuilder();
b.fromTable('customers', 'c')
  .selectAll()
  .whereInWithBuilder('c', 'id', (s) =>
    s.fromTable('orders', 'o').selectColumn('o', 'customer_id', '').limit(3),
  );
b.parsePrepared();
```

Emitted:

```sql
SELECT * FROM `customers` AS `c` WHERE `c`.`id` IN (SELECT `o`.`customer_id` FROM `orders` AS `o` LIMIT 3);
```

> **Refuter's correction:** The claim is real but two of its supporting statements need correcting, and the affected surface is wider and narrower than stated. 1. Affected surface is precisely the IN/NOT IN sub-builder entry points, not "MySQL sub-builders" generally. Confirmed rejected: whereInWithBuilder, whereNotInWithBuilder, and also havingInWithBuilder / havingNotInWithBuilder (emitted `... HAVING `o`.`customer_id`IN (SELECT`c`.`id`FROM`customers`AS`c` LIMIT 2)` -> ER 1235). LIMIT in a sub-builder is perfectly legal on MySQL in other subquery positions — I ran `EXISTS (SELECT 1 ... LIMIT 1)` (returned 2) and a derived table `FROM (SELECT ... LIMIT 3)` (returned 3), both accepted. So "MySQL categorically […]

#### MSSQL: hintMssqlOption() on a predicate sub-builder emits OPTION (...) inside the parens — a statement-terminal clause written at subquery scope

**INVALID SQL** · mssql

- **Caller meant:** Attach a T-SQL query hint. OPTION (...) is a statement-level clause that may appear exactly once, at the very end of the outermost statement — so the only thing the caller can mean is 'hint this query'.
- **Actually does:** The hint is rendered by default-hint.ts as a trailing snippet on whatever state is being serialized, and the sub-builder's state is serialized inside the parentheses. The result is an OPTION clause at subquery scope, which is not a position T-SQL has. There is no scope at which the child's OPTION could be honoured, yet the call is offered on the sub-builder and silently accepted at build time.
- **When run:** MSSQL: ERROR — "Incorrect syntax near the keyword 'OPTION'." Reproduced on whereInWithBuilder, whereExists, havingInWithBuilder, havingNotExists, via hintRaw('OPTION (MAXDOP 1)'), and when the outer builder also carries one (emits '... IN (SELECT ... OPTION (HASH JOIN)) OPTION (RECOMPILE)' — same error). CONTROL: the identical hintMssqlOption('RECOMPILE') on the OUTER builder emits 'SELECT * FROM [dbo].[customers] AS [c] OPTION (RECOMPILE);' and returns 3 rows, so the leak is specifically the sub-builder inlining.

```js
const b = new MssqlQuery().newBuilder();
b.fromTable('customers', 'c')
  .selectAll()
  .whereInWithBuilder('c', 'id', (s) =>
    s.fromTable('orders', 'o').selectColumn('o', 'customer_id', '').hintMssqlOption('RECOMPILE'),
  );
b.parsePrepared();
```

Emitted:

```sql
SET NOCOUNT ON; exec sp_executesql N'SELECT * FROM [dbo].[customers] AS [c] WHERE [c].[id] IN (SELECT [o].[customer_id] FROM [dbo].[orders] AS [o] OPTION (RECOMPILE));', N'';
```

> **Refuter's correction:** The claim is accurate as written; only two refinements of emphasis. (a) SEVERITY IS HIGHER THAN "NOT A POSITION T-SQL HAS". This is not a silently-misapplied hint that degrades to a no-op — it is an unrunnable statement. MSSQL fails at parse time with `Msg 156, Level 15, State 1 / Incorrect syntax near the keyword 'OPTION'`, so every query built through this path is dead on arrival rather than quietly ignoring the hint. The claim's "there is no scope at which the child's OPTION could be honoured" is correct, and the consequence is a hard error, not a lost optimization. (b) THE FIX IS SCOPE-AWARENESS, NOT REMOVING THE METHOD. `hintMssqlOption()` is legitimate on the top-level builder […]

#### MSSQL: cte() / cteRaw() on a predicate sub-builder emits WITH inside the parens, which T-SQL cannot parse

**INVALID SQL** · mssql

- **Caller meant:** Define a CTE local to the subquery and select from it — which is what Postgres, MySQL 8 and SQLite all do with this exact chain (2 rows each).
- **Actually does:** defaultToSql emits state.cteStates as a leading WITH for whatever state it is rendering, and the child's state is rendered inside the IN parentheses. T-SQL only accepts WITH at the start of a statement, never as the head of a parenthesized subquery, so the whole statement fails to parse. The child's CTE has no legal position at that scope; it would have to be hoisted to the parent's WITH list.
- **When run:** MSSQL: ERROR — "Incorrect syntax near ')'." Reproduced with the structured cte() form, with cteRaw(), and inside whereNotExists and havingNotInWithBuilder; adding .top(1) to the child does not help. CONTROL: the byte-identical CTE placed on the OUTER builder — 'WITH [recent] AS (SELECT [o2].[customer_id] FROM [dbo].[orders] AS [o2]) SELECT [r].[customer_id] FROM [recent] AS [r];' — runs on MSSQL and returns 3 rows, and a parent-level CTE referenced from inside the predicate subquery runs on all four dialects. So this is the sub-builder seam, not a general CTE defect.

```js
const b = new MssqlQuery().newBuilder();
b.fromTable('customers', 'c')
  .selectAll()
  .whereInWithBuilder('c', 'id', (s) =>
    s
      .cteRaw('rr', 'SELECT [customer_id] FROM [dbo].[orders]')
      .fromRaw('[rr] AS [r]')
      .selectRaw('[r].[customer_id]'),
  );
b.parsePrepared();
```

Emitted:

```sql
SET NOCOUNT ON; exec sp_executesql N'SELECT * FROM [dbo].[customers] AS [c] WHERE [c].[id] IN (WITH [rr] AS (SELECT [customer_id] FROM [dbo].[orders]) SELECT [r].[customer_id] FROM [rr] AS [r]);', N'';
```

> **Refuter's correction:** The claim is accurate as written. Two clarifications worth carrying forward, neither of which changes the verdict. First, the defect is not specific to `cteRaw()` — the structured `cte(name, builder)` form on the same sub-builder emits the same illegal inline `WITH` inside the IN parens on MSSQL, so the fix must cover both entry points rather than being treated as a raw-hatch escape. Second, the precise mechanism is that `defaultCte(state)` in ts/query/src/parser/default-cte.ts renders `state.cteStates` as a leading `WITH` for any state it is handed, with no flag distinguishing a top-level statement from a parenthesized child state; the child-scope call sites (whereInWithBuilder and […]

#### MySQL: offset() alone on an IN sub-builder synthesizes a sentinel LIMIT and trips the same ER 1235 — for a limit the caller never wrote

**INVALID SQL** · mysql

- **Caller meant:** Skip the first sub-select row and use the rest as the IN list. No row cap was requested; MySQL has no OFFSET-without-LIMIT syntax, so the library fabricates the documented 2^64-1 sentinel.
- **Actually does:** The fabricated LIMIT is invisible in the caller's code but visible to the parser, so a chain containing no .limit() call at all is rejected with a LIMIT error. Postgres emits plain 'ORDER BY ... OFFSET 1' and runs; SQLite emits 'LIMIT -1 OFFSET 1' and runs; MSSQL emits 'ORDER BY ... OFFSET 1 ROWS' and runs. Only MySQL is broken, and the error message names a clause the caller never wrote.
- **When run:** MySQL 8: ERROR — "This version of MySQL doesn't yet support 'LIMIT & IN/ALL/ANY/SOME subquery'". Postgres: OK, 2 rows. SQLite: OK, 2 rows. MSSQL: OK, 2 rows.

```js
const b = new MysqlQuery().newBuilder();
b.fromTable('customers', 'c')
  .selectAll()
  .whereInWithBuilder('c', 'id', (s) =>
    s
      .fromTable('orders', 'o')
      .selectColumn('o', 'customer_id', '')
      .orderByColumn('o', 'total', OrderByDirection.Descending)
      .offset(1),
  );
b.parsePrepared();
```

Emitted:

```sql
SELECT * FROM `customers` AS `c` WHERE `c`.`id` IN (SELECT `o`.`customer_id` FROM `orders` AS `o` ORDER BY `o`.`total` DESC LIMIT 18446744073709551615 OFFSET 1);
```

> **Refuter's correction:** The claim is accurate as written; one scoping refinement from a control I ran. The MySQL restriction is not offset-specific: .limit(5) alone on the same IN sub-builder emits "... ORDER BY `o`.`total` DESC LIMIT 5" and trips the identical ER 1235 on the live server. So the root cause is that ANY LIMIT clause reaching an IN/ALL/ANY/SOME sub-scope is rejected by MySQL, and SQLEasy's limit/offset renderer (ts/query/src/parser/default-limit-offset.ts) is scope-blind — it emits the same clause for a child sub-builder as for a top-level statement. The offset() case is the strictly worse instance of that single defect rather than a separate bug: with .limit() the caller at least wrote the clause […]

### Scalar-select and join subqueries (selectWithBuilder / join*)

#### offset(0) on a child builder is silently elided, removing the very clause that legalises an ordered MSSQL subquery

**SILENTLY DROPPED** · mssql, postgres, mysql, sqlite

- **Caller meant:** `ORDER BY … OFFSET 0 ROWS` is the idiomatic, and on MSSQL the only structured, way to have an ordered derived table / APPLY operand / scalar subquery. The caller writing `.orderByColumn(...).offset(0)` on a child clearly means "ordered subquery, skip nothing".
- **Actually does:** The builder treats offset 0 as absent and emits no OFFSET at all, in every dialect. On Postgres/MySQL/SQLite that is harmless (OFFSET 0 is a no-op for row selection). On MSSQL it removes the token that makes the child's ORDER BY legal, converting a valid query into an unparseable one — and the caller gets an ORDER BY error for a clause they did not omit. The elision is generic (it happens on a top-level builder too), but it is only observable as a failure once the builder is inlined as a child, because a top-level ORDER BY needs no OFFSET.
- **When run:** MSSQL: "The ORDER BY clause is invalid in views, inline functions, derived tables, subqueries, and common table expressions, unless TOP, OFFSET or FOR XML is also specified." Control with .offset(1): emits `ORDER BY [o].[id] ASC OFFSET 1 ROWS` and returns 2 rows successfully. Reproduced for joinWithBuilder, joinCrossApply and selectWithBuilder.

```js
b.fromTable('customers', 'c')
  .selectColumn('c', 'id', 'cid')
  .joinCrossApply('t', (s) => {
    s.fromTable('orders', 'o')
      .selectColumn('o', 'total', 'total')
      .orderByColumn('o', 'id', OrderByDirection.Ascending)
      .offset(0);
  });

// control that proves the elision: the same chain with .offset(1) emits
// "... ORDER BY [o].[id] ASC OFFSET 1 ROWS" and runs.
```

Emitted:

```sql
MSSQL — offset(0) vanishes entirely:
SET NOCOUNT ON; exec sp_executesql N'SELECT [c].[id] AS [cid] FROM [dbo].[customers] AS [c] CROSS APPLY (SELECT [o].[total] AS [total] FROM [dbo].[orders] AS [o] ORDER BY [o].[id] ASC) AS [t];', N'';

Postgres — same elision:
SELECT "c"."id" AS "cid" FROM "public"."customers" AS "c" INNER JOIN (SELECT "o"."customer_id" AS "customer_id" FROM "public"."orders" AS "o" ORDER BY "o"."id" ASC) AS "t" ON "c"."id" = "t"."customer_id";
```

> **Refuter's correction:** The defect is real but the dialect list is wrong: it is MSSQL-only, not "mssql, postgres, mysql, sqlite". The elision itself is universal (offset(0) emits nothing in every dialect), but on postgres, mysql and sqlite the resulting SQL is valid AND returns exactly what the caller wrote - I ran both variants on the real engines and the row sets are identical: - Postgres: elided -> 1 2 3 1 2 3 1 2 3; with OFFSET 0 restored -> 1 2 3 1 2 3 1 2 3. - MySQL: elided -> 2 3 1 2 3 1 2 3 1; with LIMIT 18446744073709551615 OFFSET 0 restored -> identical. - SQLite: elided -> [{"cid":1},{"cid":2},{"cid":3}]; with LIMIT -1 OFFSET 0 restored -> identical. (SQLite also cannot reach the CROSS APPLY shape at […]

#### Optional joinOnBuilder on the APPLY / CROSS-LATERAL forms emits a bare ON the grammar has no slot for — MySQL silently honours it, Postgres and MSSQL […]

**INVALID SQL** · mssql, postgres, mysql

- **Caller meant:** The caller passed a join predicate through the method's own optional third parameter (typed `(joinOnBuilder: JoinOnBuilder) => void` on joinCrossApply / joinOuterApply / joinCrossLateral), clearly meaning "restrict the applied/lateral rows to those matching this condition".
- **Actually does:** The ON list is appended verbatim after the aliased subquery, but CROSS APPLY, OUTER APPLY and CROSS JOIN LATERAL have no ON slot in T-SQL or in Postgres. MSSQL and Postgres reject the whole statement. MySQL DOES accept it — `CROSS JOIN ... ON` is a MySQL synonym for `JOIN ... ON` — and applies the predicate, so the very same builder chain is a hard syntax error on one engine and a working filtered join on another. Measured on MySQL: with the ON supplied the query returns 3 rows; the identical chain without the ON returns 9 (the true cross product). The […]
- **When run:** MSSQL joinCrossApply: "Incorrect syntax near the keyword 'ON'." | MSSQL joinOuterApply: "Incorrect syntax near the keyword 'ON'." | Postgres joinCrossLateral: "syntax error at or near \"ON\"" | MySQL joinCrossLateral: accepted, 3 rows returned (predicate honoured; control without ON returns 9 rows).

```js
// MSSQL:
b.fromTable('customers', 'c')
  .selectColumn('c', 'id', 'cid')
  .joinCrossApply(
    't',
    (s) => {
      s.fromTable('orders', 'o')
        .selectColumn('o', 'customer_id', 'customer_id')
        .selectColumn('o', 'total', 'total');
    },
    (o) => {
      o.on('c', 'id', JoinOperator.Equals, 't', 'customer_id');
    },
  );

// identical shape with joinOuterApply('t', sub, on) on MSSQL;
// and joinCrossLateral('t', sub, on) on Postgres / MySQL
```

Emitted:

```sql
MSSQL (joinCrossApply):
SELECT [c].[id] AS [cid] FROM [dbo].[customers] AS [c] CROSS APPLY (SELECT [o].[customer_id] AS [customer_id], [o].[total] AS [total] FROM [dbo].[orders] AS [o]) AS [t] ON [c].[id] = [t].[customer_id];

MSSQL (joinOuterApply):
... OUTER APPLY (SELECT ...) AS [t] ON [c].[id] = [t].[customer_id];

Postgres / MySQL (joinCrossLateral):
SELECT "c"."id" AS "cid" FROM "public"."customers" AS "c" CROSS JOIN LATERAL (SELECT "o"."customer_id" AS "customer_id", "o"."total" AS "total" FROM "public"."orders" AS "o") AS "t" ON "c"."id" = "t"."customer_id";
```

> **Refuter's correction:** The claim is substantively correct. Two refinements: 1. Cosmetic — the claim quotes the MSSQL SQL as a bare SELECT. `parsePrepared()` on MssqlQuery actually returns it wrapped: `SET NOCOUNT ON; exec sp_executesql N'SELECT [c].[id] AS [cid] FROM [dbo].[customers] AS [c] CROSS APPLY (…) AS [t] ON [c].[id] = [t].[customer_id];', N'';`. The inner statement is identical to the claim and the sp_executesql wrapper does not change the outcome — MSSQL still fails with Msg 156 "Incorrect syntax near the keyword 'ON'". `parameters` is `undefined` for all six variants (no bound params in this shape). 2. The MySQL half is worse than "a working filtered join." I measured that `joinCrossLateral(alias […]

#### hintMssqlOption() on a child builder emits OPTION (...) inside the subquery parentheses, where T-SQL has no OPTION clause

**INVALID SQL** · mssql

- **Caller meant:** Attach a T-SQL query hint (RECOMPILE, MAXDOP, …) to the plan for this query. The same call on the OUTER builder emits correctly — `... ON [c].[id] = [t].[customer_id] OPTION (RECOMPILE);` at the statement tail — and runs, so the caller reasonably expects the child call to be either honoured or refused.
- **Actually does:** The hint is rendered at the tail of the CHILD's SELECT, i.e. inside the subquery parentheses. OPTION is a statement-terminal clause in T-SQL; it cannot appear in a scalar subquery, a derived table, or an APPLY operand. The entire statement fails to parse, so the parent query never runs at all. The builder does not hoist the hint to the statement tail and does not refuse it on a sub-builder.
- **When run:** MSSQL: "Incorrect syntax near the keyword 'OPTION'." — reproduced for selectWithBuilder, joinWithBuilder, joinCrossApply and joinOuterApply. Control: the same hintMssqlOption('RECOMPILE') on the PARENT builder emits `... OPTION (RECOMPILE);` and returns 3 rows.

```js
b.fromTable('customers', 'c')
  .selectColumn('c', 'id', 'cid')
  .selectWithBuilder('x', (s) => {
    s.fromTable('orders', 'o').selectColumn('o', 'total', 't').top(1).hintMssqlOption('RECOMPILE');
  });

// reproduces identically via joinWithBuilder(JoinType.Inner,'t',sub,on),
// joinCrossApply('t',sub) and joinOuterApply('t',sub)
```

Emitted:

```sql
SET NOCOUNT ON; exec sp_executesql N'SELECT [c].[id] AS [cid], (SELECT TOP (1) [o].[total] AS [t] FROM [dbo].[orders] AS [o] OPTION (RECOMPILE)) AS [x] FROM [dbo].[customers] AS [c];', N'';

// joinCrossApply variant:
... FROM [dbo].[customers] AS [c] CROSS APPLY (SELECT [o].[total] AS [total] FROM [dbo].[orders] AS [o] OPTION (MAXDOP 1)) AS [t];
```

> **Refuter's correction:** The claim is accurate as written; one correction, and it widens the scope rather than narrowing it. The blast radius is FIVE call sites, not four — fromWithBuilder() (derived table in FROM) is affected identically and was not listed. Builder calls: b.fromWithBuilder('d', s => { s.fromTable('orders','o').selectColumn('o','total','total').hintMssqlOption('RECOMPILE'); }).selectColumn('d','total','t'). Emitted: SET NOCOUNT ON; exec sp_executesql N'SELECT [d].[total] AS [t] FROM (SELECT [o].[total] AS [total] FROM [dbo].[orders] AS [o] OPTION (RECOMPILE)) AS [d];', N''; Engine response: Msg 156, Level 15, State 1 — Incorrect syntax near the keyword 'OPTION'. Two supporting details worth […]

#### A CTE declared on a child builder is inlined as (WITH … SELECT …) — accepted by Postgres/MySQL/SQLite, rejected outright by MSSQL

**INVALID SQL** · mssql

- **Caller meant:** Declare a CTE scoped to the subquery and select from it inside the subquery. This is exactly what happens on Postgres, MySQL and SQLite.
- **Actually does:** The child's WITH clause is emitted verbatim at the head of the parenthesized subquery. T-SQL does not allow WITH inside a parenthesized query expression (a derived table, an APPLY operand, or a scalar subquery); a CTE may only precede the outermost SELECT. The builder neither hoists the child CTE into the parent's WITH list nor refuses it on MSSQL, so the same builder program that works on three engines is unparseable on the fourth.
- **When run:** MSSQL: "Incorrect syntax near ')'." — reproduced for selectWithBuilder, joinWithBuilder, joinCrossApply and joinOuterApply. Postgres / MySQL / SQLite: accepted, 3 rows.

```js
b.fromTable('customers', 'c')
  .selectColumn('c', 'id', 'cid')
  .joinWithBuilder(
    JoinType.Inner,
    't',
    (s) => {
      s.cte('ic', (cb) => {
        cb.fromTable('orders', 'o2').selectColumn('o2', 'customer_id', 'customer_id');
      })
        .fromTableWithOwner('', 'ic', 'i')
        .selectColumn('i', 'customer_id', 'customer_id');
    },
    (o) => {
      o.on('c', 'id', JoinOperator.Equals, 't', 'customer_id');
    },
  );

// reproduces identically via selectWithBuilder('x',sub), joinCrossApply('t',sub), joinOuterApply('t',sub)
```

Emitted:

```sql
MSSQL:
SELECT [c].[id] AS [cid] FROM [dbo].[customers] AS [c] INNER JOIN (WITH [ic] AS (SELECT [o2].[customer_id] AS [customer_id] FROM [dbo].[orders] AS [o2]) SELECT [i].[customer_id] AS [customer_id] FROM [ic] AS [i]) AS [t] ON [c].[id] = [t].[customer_id];

Postgres (same shape, runs):
SELECT "c"."id" AS "cid" FROM "public"."customers" AS "c" INNER JOIN (WITH "ic" AS (SELECT "o2"."customer_id" AS "customer_id" FROM "public"."orders" AS "o2") SELECT "i"."customer_id" AS "customer_id" FROM "ic" AS "i") AS "t" ON "c"."id" = "t"."customer_id";
```

> **Refuter's correction:** The claim is accurate as written. Two refinements from the reproduction, neither of which changes the verdict: (1) The MSSQL output is wrapped: the builder actually emits `SET NOCOUNT ON; exec sp_executesql N'<stmt>', N'';`. The claim quoted only the inner statement text, which is byte-identical. The wrapped form fails identically (Msg 156/319/102), so the omission is cosmetic. (2) The "same builder program works on three engines, unparseable on the fourth" framing holds precisely for joinWithBuilder and selectWithBuilder, which exist on all four dialects. For joinCrossApply/joinOuterApply the framing should be stronger, not weaker: both are MSSQL-only methods (listed in AbsentOnMysql […]

#### A child builder's ORDER BY with no row cap is emitted inside the subquery — MSSQL rejects the statement, MySQL silently discards the sort

**INVALID SQL** · mssql, mysql

- **Caller meant:** Order the rows the subquery produces (e.g. "take the latest order" written as an ORDER BY the caller expects to be meaningful).
- **Actually does:** MSSQL: the ORDER BY is emitted bare inside the subquery, which T-SQL forbids unless TOP, OFFSET or FOR XML accompanies it — the whole statement fails. This guard is asymmetric in the library: `limit()` without ORDER BY on MSSQL is correctly refused at build time ("LimitOffset: ORDER BY is required when using LIMIT on MSSQL..."), but ORDER BY without a cap inside a subquery is emitted unchecked. MySQL: the statement parses, but the derived table is merged away and the sort is dropped entirely by the optimizer — `EXPLAIN FORMAT=TREE` shows `Nested loop […]
- **When run:** MSSQL: "The ORDER BY clause is invalid in views, inline functions, derived tables, subqueries, and common table expressions, unless TOP, OFFSET or FOR XML is also specified." — reproduced for selectWithBuilder, joinWithBuilder, joinCrossApply, joinOuterApply and orderByRaw. MySQL: accepted, 3 rows, but EXPLAIN FORMAT=TREE contains no Sort operator. Postgres/SQLite: accepted with the sort retained.

```js
b.fromTable('customers', 'c')
  .selectColumn('c', 'id', 'cid')
  .selectWithBuilder('x', (s) => {
    s.fromTable('orders', 'o')
      .selectColumn('o', 'total', 't')
      .where('o', 'id', WhereOperator.Equals, 1)
      .orderByColumn('o', 'placed_at', OrderByDirection.Descending); // no limit/top/offset
  });

// reproduces identically via joinWithBuilder, joinCrossApply, joinOuterApply,
// and with orderByRaw('1 ASC') in place of orderByColumn
```

Emitted:

```sql
MSSQL:
SET NOCOUNT ON; exec sp_executesql N'SELECT [c].[id] AS [cid], (SELECT [o].[total] AS [t] FROM [dbo].[orders] AS [o] WHERE [o].[id] = @p0 ORDER BY [o].[placed_at] DESC) AS [x] FROM [dbo].[customers] AS [c];', N'@p0 tinyint', @p0 = 1;

MySQL (derived-table form):
SELECT `c`.`id` AS `cid` FROM `customers` AS `c` INNER JOIN (SELECT `o`.`customer_id` AS `customer_id` FROM `orders` AS `o` ORDER BY `o`.`id` ASC) AS `t` ON `c`.`id` = `t`.`customer_id`;
```

> **Refuter's correction:** The finding stands as written; two transcription-level corrections only, neither load-bearing. 1. The MySQL no-LIMIT plan is quoted in the claim as "Covering index scan on o". The actual plan is "Nested loop inner join -> Covering index scan on c using customers_email_key -> Covering index lookup on o using orders_customer_idx". The substantive assertion — no Sort node, sort discarded — is exactly correct. 2. The claim's prose uses on.onColumns(...) for the join-on callback; that method does not exist. The real signature is on.on(aliasLeft, columnLeft, JoinOperator, aliasRight, columnRight), and joinWithBuilder takes 4 args (joinType, alias, builderFn, joinOnFn). The primary […]

### INSERT … SELECT and MERGE usingSelect

#### `.top(0)` on the source SELECT is silently dropped — INSERT/MERGE touches every row instead of none

**SILENTLY DROPPED** · mssql

- **Caller meant:** Cap the source SELECT at zero rows — the caller explicitly asked for TOP (0), the standard T-SQL dry-run / no-op source. `.top(3)` on the very same child builder correctly emits `SELECT TOP (3)`, and the repo's own comment in default-limit-offset.ts says presence, not positivity, is what counts: "silently ignoring `.top(0)` would be the same class of bug this release is removing."
- **Actually does:** The `TOP (0)` never reaches the SQL. `hasExplicitTop()` correctly reports the caller set a TOP, but the `beforeSelectColumns` hook in to-sql.ts coerces it to a number and only emits when > 0, so `top(0)` renders as an entirely uncapped SELECT. The statement is valid SQL and runs — it just moves every row in the table.
- **When run:** MSSQL, inside BEGIN TRAN/ROLLBACK. INSERT form: orders count 3 -> 6, `(3 rows affected)` — 3 rows inserted where the caller asked for 0. Control with the TOP restored by hand, `SELECT TOP (0) ...`: `(0 rows affected)`, count stayed 3. MERGE form: `(3 rows affected)`, @@ROWCOUNT = 3. Control `USING (SELECT TOP (0) * FROM [dbo].[orders] AS [o])`: `(0 rows affected)`, @@ROWCOUNT = 0.

```js
// insertSelect form
b.insertInto('orders')
  .insertColumns(['customer_id', 'total', 'placed_at', 'seen_at'])
  .insertSelect((s) =>
    s
      .fromTable('orders', 'o')
      .selectColumn('o', 'customer_id', '')
      .selectColumn('o', 'total', '')
      .selectColumn('o', 'placed_at', '')
      .selectColumn('o', 'seen_at', '')
      .top(0),
  );

// MERGE usingSelect form
b.merge((m) => {
  m.into('orders', 't');
  m.usingSelect('s', (s) => s.fromTable('orders', 'o').selectAll().top(0));
  m.on((j) => j.on('t', 'id', q.JoinOperator.Equals, 's', 'id'));
  m.whenMatchedThenUpdate([{ columnName: 'note', value: q.source('note') }]);
});
```

Emitted:

```sql
SET NOCOUNT ON; exec sp_executesql N'INSERT INTO [dbo].[orders] ([customer_id], [total], [placed_at], [seen_at]) SELECT [o].[customer_id], [o].[total], [o].[placed_at], [o].[seen_at] FROM [dbo].[orders] AS [o];', N'';

SET NOCOUNT ON; exec sp_executesql N'MERGE INTO [dbo].[orders] AS [t] USING (SELECT * FROM [dbo].[orders] AS [o]) AS [s] ON [t].[id] = [s].[id] WHEN MATCHED THEN UPDATE SET [note] = [s].[note];', N'';
```

> **Refuter's correction:** The bug is real but broader than the claim states — it is not a child-scope-only issue. (1) A top-level MSSQL SELECT drops it too: b.fromTable('orders','o').selectAll().top(0) emits "SELECT * FROM [dbo].[orders] AS [o];". (2) The same "top > 0" gate is duplicated in mssqlMutationTop at ts/query/src/parser/default-mutation-row-cap.ts:123-127, which is more dangerous: b.deleteFrom('orders','').top(0) emits "SET NOCOUNT ON; exec sp_executesql N'DELETE FROM [dbo].[orders];', N'';" — run live, the emitted form left 0 rows (full table wipe) while the intended "DELETE TOP (0) FROM [dbo].[orders];" left all 3; .top(3) on the same chain correctly emits "DELETE TOP (3)". (3) The presence/positivity […]

#### `limit`/`offset`/`orderByColumn` written on the INSERT builder instead of the insertSelect child vanish without a word

**SILENTLY DROPPED** · postgres, mysql, sqlite, mssql

- **Caller meant:** Insert at most one row. `INSERT ... SELECT` is one statement with one row cap, and the builder exposes `.limit()` on the INSERT builder as well as on the child, so writing it on the outer builder is the natural guess.
- **Actually does:** `defaultInsert` never reads `state.limit`, `state.offset` or `state.orderByStates`, and `assertMutationRowCapSupported` is only invoked on the Update/Delete branches of to-sql.ts — never on Insert. All three clauses are dropped with no error and no warning. `.offset(2)` alone is dropped so quietly that even the "ORDER BY is required when using OFFSET" guard (which does fire when the same call is made on the child) never runs.
- **When run:** Postgres, in BEGIN/ROLLBACK: count 3 -> `INSERT 0 3` -> count 6. The same intent written on the CHILD (`... ORDER BY "o"."id" LIMIT 1`) gives `INSERT 0 1` -> count 4. MySQL: count 3 -> 6. SQLite (libsql :memory:): `rowsAffected=3`, count 3 -> 6. MSSQL: count 3 -> `(3 rows affected)` -> 6.

```js
b.insertInto('orders')
  .insertColumns(['customer_id', 'total', 'placed_at', 'seen_at'])
  .insertSelect((s) =>
    s
      .fromTable('orders', 'o')
      .selectColumn('o', 'customer_id', '')
      .selectColumn('o', 'total', '')
      .selectColumn('o', 'placed_at', '')
      .selectColumn('o', 'seen_at', ''),
  )
  .limit(1);
// identical silent drop for .offset(2) and .orderByColumn('o','id',q.OrderByDirection.Desc)
```

Emitted:

```sql
INSERT INTO "public"."orders" ("customer_id", "total", "placed_at", "seen_at") SELECT "o"."customer_id", "o"."total", "o"."placed_at", "o"."seen_at" FROM "public"."orders" AS "o";
```

> **Refuter's correction:** The claim is substantively correct; one token in its builder calls is wrong. q.OrderByDirection.Desc does not exist - the exported member is q.OrderByDirection.Descending (members are Ascending/Descending/None). With Desc the value is undefined at runtime and the clause is still silently dropped, so the bug reproduces either way; but the literal call as written fails tsc, and the accurate repro uses .orderByColumn('o','id',q.OrderByDirection.Descending). With that fix the whole chain type-checks clean under --strict. Also worth sharpening: the severity is not merely that clauses "vanish" but that this breaks an invariant the codebase states in-line. ts/query/src/parser/to-sql.ts:196 reads […]

#### `.top(n)` on an MSSQL INSERT ... SELECT is silently dropped, although `INSERT TOP (n) INTO` is real T-SQL

**SILENTLY DROPPED** · mssql

- **Caller meant:** `INSERT TOP (1) INTO [dbo].[orders] ... SELECT ...` — cap the insert at one row using T-SQL's own INSERT row cap.
- **Actually does:** The TOP disappears entirely. It is only ever emitted by the `beforeSelectColumns` hook, which is called from `defaultSelect`; the Insert branch of `defaultToSql` returns before any SELECT rendering of the outer state happens. Note the asymmetry that makes this a silent drop rather than a refusal: the identical call on Postgres throws `LimitOffset: Postgres has no TOP clause — use limit() instead`, so the library refuses to drop a TOP on the dialect that cannot honour it, and drops it on the one that can.
- **When run:** MSSQL, in BEGIN TRAN/ROLLBACK: count 3 -> `(3 rows affected)` -> count 6. Control with the cap restored by hand, `INSERT TOP (1) INTO [dbo].[orders] (...) SELECT ...`: accepted, `(1 rows affected)`, count 3 -> 4.

```js
b.insertInto('orders')
  .insertColumns(['customer_id', 'total', 'placed_at', 'seen_at'])
  .insertSelect((s) =>
    s
      .fromTable('orders', 'o')
      .selectColumn('o', 'customer_id', '')
      .selectColumn('o', 'total', '')
      .selectColumn('o', 'placed_at', '')
      .selectColumn('o', 'seen_at', ''),
  )
  .top(1);
```

Emitted:

```sql
SET NOCOUNT ON; exec sp_executesql N'INSERT INTO [dbo].[orders] ([customer_id], [total], [placed_at], [seen_at]) SELECT [o].[customer_id], [o].[total], [o].[placed_at], [o].[seen_at] FROM [dbo].[orders] AS [o];', N'';
```

> **Refuter's correction:** The claim is real but UNDERSTATED in scope, and its stated mechanism is now stale. 1) SCOPE — it is not just .top() and not just MSSQL. All FOUR row-cap/ordering clauses are silently dropped on an INSERT ... SELECT, on ALL FOUR dialects: .top(), .limit(), .offset(), .orderByColumn(). Each produces no clause, no parameter and no error. Most damaging beyond the claim: .limit(1) on a Postgres INSERT ... SELECT is silently dropped even though Postgres natively supports it. Builder: b.insertInto('orders').insertColumns(['customer_id','total','placed_at','seen_at']).insertSelect(s => […]

#### `.top(n)` / `.limit(n)` on a MERGE builder is silently dropped, although `MERGE TOP (n) INTO` is real T-SQL

**SILENTLY DROPPED** · mssql

- **Caller meant:** `MERGE TOP (1) INTO [dbo].[orders] AS [t] ...` — merge at most one row, T-SQL's documented MERGE row cap.
- **Actually does:** `defaultMerge` never reads `state.limit`, `state.orderByStates` or `customState['top']`; the MERGE branch of `defaultToSql` returns straight out of `defaultMerge`. The cap is dropped with no error. Because MERGE's only sub-builder is `usingSelect`, and a cap put there caps the SOURCE rather than the MERGE, there is currently no builder call that produces `MERGE TOP (n)` at all.
- **When run:** MSSQL, in BEGIN TRAN/ROLLBACK: emitted statement gives `(3 rows affected)`, @@ROWCOUNT = 3 — every matched row updated. Control with the cap restored by hand, `MERGE TOP (1) INTO [dbo].[orders] AS [t] USING (...) ...`: accepted, `(1 rows affected)`, @@ROWCOUNT = 1.

```js
b.merge((m) => {
  m.into('orders', 't');
  m.usingSelect('s', (s) => s.fromTable('orders', 'o').selectAll());
  m.on((j) => j.on('t', 'id', q.JoinOperator.Equals, 's', 'id'));
  m.whenMatchedThenUpdate([{ columnName: 'note', value: q.source('note') }]);
});
b.top(1);
// same silent drop for b.orderByColumn('t','id',q.OrderByDirection.Desc).limit(1)
```

Emitted:

```sql
SET NOCOUNT ON; exec sp_executesql N'MERGE INTO [dbo].[orders] AS [t] USING (SELECT * FROM [dbo].[orders] AS [o]) AS [s] ON [t].[id] = [s].[id] WHEN MATCHED THEN UPDATE SET [note] = [s].[note];', N'';
```

> **Refuter's correction:** Confirmed real, with one repro correction and a sharper framing. Correction: the claim's `q.OrderByDirection.Desc` is not a valid enum member (it is `Descending`); as written it evaluates to undefined, which silently drops the DESC from the emitted ORDER BY. This does not affect the substance — the cap is still dropped with the correct enum. Sharper framing: the bug is best characterized not as "top() is SELECT-only so MERGE is out of scope", but as MERGE being the single MSSQL mutation where BOTH the emission and the guard rail are missing. Evidence table on the MSSQL builder — SELECT: top(1) -> `SELECT TOP (1)`, limit(1) -> OFFSET/FETCH; UPDATE: top(1) -> `UPDATE TOP (1)`, limit(1) -> […]

#### `orderByColumn`/`orderByRaw` on a MERGE usingSelect child emits an ORDER BY inside a derived table — MSSQL Msg 1033

**INVALID SQL** · mssql

- **Caller meant:** Order the MERGE source rows. `orderByColumn` is visible and callable on the `MssqlQueryBuilder` view handed to the `usingSelect` callback, with nothing marking it unusable there.
- **Actually does:** `emitUsing` wraps the child SELECT in bare parentheses — `USING (<subquery>) AS alias` — which makes it a derived table. T-SQL forbids ORDER BY in a derived table unless TOP, OFFSET or FOR XML is also present. The statement never parses. This is scope-specific, not clause-specific: the same `orderByColumn` on the insertSelect child renders fine, because INSERT ... SELECT is not a derived table.
- **When run:** MSSQL: `Msg 1033, Level 15, State 1 — The ORDER BY clause is invalid in views, inline functions, derived tables, subqueries, and common table expressions, unless TOP, OFFSET or FOR XML is also specified.` Nothing merged (@@ROWCOUNT 0). Adding `.limit(2)` (which renders `OFFSET 0 ROWS FETCH NEXT 2 ROWS ONLY`) or `.top(2)` makes the identical query legal and it runs — so the bare ORDER BY is the only failing shape.

```js
b.merge((m) => {
  m.into('orders', 't');
  m.usingSelect('s', (s) =>
    s.fromTable('orders', 'o').selectAll().orderByColumn('o', 'id', q.OrderByDirection.Desc),
  );
  m.on((j) => j.on('t', 'id', q.JoinOperator.Equals, 's', 'id'));
  m.whenMatchedThenUpdate([{ columnName: 'note', value: q.source('note') }]);
});
// orderByRaw('[o].[id] DESC') produces the identical failure
```

Emitted:

```sql
SET NOCOUNT ON; exec sp_executesql N'MERGE INTO [dbo].[orders] AS [t] USING (SELECT * FROM [dbo].[orders] AS [o] ORDER BY [o].[id]) AS [s] ON [t].[id] = [s].[id] WHEN MATCHED THEN UPDATE SET [note] = [s].[note];', N'';
```

> **Refuter's correction:** The bug is real and the emitted SQL is exactly as claimed. Two corrections/refinements to the claim's write-up, neither of which affects the defect: 1. The literal builder chain as written uses `q.OrderByDirection.Desc`, which DOES NOT EXIST — the enum is {Ascending:'Ascending', Descending:'Descending', None:'None'}. So that argument evaluates to `undefined` and the direction is silently dropped, which is why the claim's own quoted SQL correctly shows `ORDER BY [o].[id]` with no DESC (the claim is self-consistent here). Using the real member `q.OrderByDirection.Descending` emits `ORDER BY [o].[id] DESC` and fails with the identical Msg 1033; `orderByRaw('[o].[id] DESC')` needs no enum and […]

#### A CTE on a MERGE usingSelect child emits `USING (WITH ... SELECT ...)` — MSSQL Msg 156/319/102

**INVALID SQL** · mssql

- **Caller meant:** A MERGE whose source is a CTE-backed query. `cte()` and `cteRaw()` are on the builder view passed to `usingSelect`, so this is the surface's own advertised way to do it.
- **Actually does:** `defaultToSql` prefixes the child's `WITH` clause to the child SQL, and `emitUsing` then wraps the whole thing in parentheses. T-SQL has no parenthesised WITH: a CTE must be the first thing in the statement (or follow a semicolon), never the first thing inside `USING ( ... )`. The statement never parses, and MERGE has no other way to reach a CTE source (the outer `b.cte(...)` is not emitted for a MERGE either).
- **When run:** MSSQL: `Msg 156 — Incorrect syntax near the keyword 'WITH'.`, `Msg 319 — Incorrect syntax near the keyword 'with'. If this statement is a common table expression ... the previous statement must be terminated with a semicolon.`, `Msg 102 — Incorrect syntax near ')'.` @@ROWCOUNT 0.

```js
b.merge((m) => {
  m.into('orders', 't');
  m.usingSelect('s', (s) => {
    s.cte('r', (c) => c.fromTable('orders', 'x').selectAll());
    s.fromTableWithOwner('', 'r', 'o').selectAll();
  });
  m.on((j) => j.on('t', 'id', q.JoinOperator.Equals, 's', 'id'));
  m.whenMatchedThenUpdate([{ columnName: 'note', value: q.source('note') }]);
});
```

Emitted:

```sql
SET NOCOUNT ON; exec sp_executesql N'MERGE INTO [dbo].[orders] AS [t] USING (WITH [r] AS (SELECT * FROM [dbo].[orders] AS [x]) SELECT * FROM [r] AS [o]) AS [s] ON [t].[id] = [s].[id] WHEN MATCHED THEN UPDATE SET [note] = [s].[note];', N'';
```

> **Refuter's correction:** The core defect is real and reproduces exactly as described, but one supporting statement in the claim is factually wrong and should be struck. WRONG: "MERGE has no other way to reach a CTE source (the outer b.cte(...) is not emitted for a MERGE either)." The outer, statement-level b.cte(...) IS emitted for a MERGE, and it works. Builder calls: const b = new q.MssqlQuery().newBuilder(); b.cte('r', c => c.fromTable('orders','x').selectAll()); b.merge(m => { m.into('orders','t'); m.usingSelect('s', s => { s.fromTableWithOwner('','r','o').selectAll(); }); m.on(j => j.on('t','id',q.JoinOperator.Equals,'s','id')); m.whenMatchedThenUpdate([{ columnName:'note', value: q.source('note') }]); }) […]

#### A CTE on an insertSelect child emits `INSERT INTO t (...) WITH ... SELECT` — accepted by PG/MySQL/SQLite, rejected by MSSQL (Msg 156/319)

**INVALID SQL** · mssql

- **Caller meant:** An INSERT whose source SELECT is built on a CTE. Portable code that works on the other three dialects breaks only on MSSQL.
- **Actually does:** `defaultInsert` splices the child's rendered SQL — WITH clause included — after the column list. Postgres, MySQL and SQLite all allow a WITH-prefixed query in the INSERT source position, so the leak is invisible on three of four dialects; T-SQL requires the CTE to precede the INSERT keyword, so the same builder chain is unrunnable there.
- **When run:** Postgres (BEGIN/ROLLBACK): `INSERT 0 3` — accepted. MySQL: 3 rows, count 3 -> 6 — accepted. SQLite: `rowsAffected=3` — accepted. MSSQL: `Msg 156 — Incorrect syntax near the keyword 'WITH'.` plus `Msg 319`, @@ROWCOUNT 0. Control: the same intent expressed with the CTE on the OUTER builder (`b.cte('r', ...)` then `b.insertInto(...).insertSelect(...)`) emits `WITH [r] AS (...) INSERT INTO [dbo].[orders] ... SELECT ...` and MSSQL accepts it, `(3 rows affected)` — so only the child placement is broken.

```js
b.insertInto('orders')
  .insertColumns(['customer_id', 'total', 'placed_at', 'seen_at'])
  .insertSelect((s) => {
    s.cte('r', (c) => c.fromTable('orders', 'x').selectAll());
    s.fromTableWithOwner('', 'r', 'o')
      .selectColumn('o', 'customer_id', '')
      .selectColumn('o', 'total', '')
      .selectColumn('o', 'placed_at', '')
      .selectColumn('o', 'seen_at', '');
  });
// cteRaw('r','SELECT 1 AS n') on the child fails identically
```

Emitted:

```sql
SET NOCOUNT ON; exec sp_executesql N'INSERT INTO [dbo].[orders] ([customer_id], [total], [placed_at], [seen_at]) WITH [r] AS (SELECT * FROM [dbo].[orders] AS [x]) SELECT [o].[customer_id], [o].[total], [o].[placed_at], [o].[seen_at] FROM [r] AS [o];', N'';
```

> **Refuter's correction:** The claim is accurate as written; two refinements sharpen it. (a) The root cause is one line upstream of `defaultInsert`: `defaultToSql` (ts/query/src/parser/to-sql.ts:130) emits the CTE prefix unconditionally, before any of its own `if (!state.isInnerStatement)` guards (lines 173/189/209/228/305). `insertSelect` already marks the child `isInnerStatement = true` (ts/query/src/builder/query.ts:1713), so the flag that exists to suppress statement-level decoration is simply never consulted for the leading WITH; `defaultInsert` (default-insert.ts:96-103) then splices the result verbatim. (b) This is a placement bug, not an MSSQL capability gap — SQLEasy's outer `b.cte()` on the INSERT builder […]

#### `hintMssqlOption`/`hintRaw` on a MERGE usingSelect child puts `OPTION (...)` inside the derived table — MSSQL Msg 156

**INVALID SQL** · mssql

- **Caller meant:** Attach a query hint to the MERGE. `hintMssqlOption` is on the MSSQL builder view exposed to `usingSelect`, and OPTION is a per-statement construct, so the caller's only reading is "hint this statement".
- **Actually does:** `emitTrailingHints` appends OPTION to the child's SQL, and `emitUsing` then parenthesises it. T-SQL allows OPTION only at the very end of the whole statement, never inside a derived table or subquery. The statement never parses. The identical call on the insertSelect child DOES work (`INSERT ... SELECT ... OPTION (MAXDOP 1)` lands at end-of-statement and MSSQL accepts it), which is what makes the MERGE behaviour surprising rather than an obvious caller error.
- **When run:** MSSQL: `Msg 156, Level 15, State 1 — Incorrect syntax near the keyword 'OPTION'.` @@ROWCOUNT 0. Same for `hintRaw('OPTION (RECOMPILE)')`. Control on the other seam: `INSERT INTO [dbo].[orders] (...) SELECT ... OPTION (MAXDOP 1);` -> `(3 rows affected)`, and `... OPTION (RECOMPILE);` -> `(3 rows affected)`.

```js
b.merge((m) => {
  m.into('orders', 't');
  m.usingSelect('s', (s) => s.fromTable('orders', 'o').selectAll().hintMssqlOption('MAXDOP 1')); // hintRaw('OPTION (RECOMPILE)') is identical
  m.on((j) => j.on('t', 'id', q.JoinOperator.Equals, 's', 'id'));
  m.whenMatchedThenUpdate([{ columnName: 'note', value: q.source('note') }]);
});
```

Emitted:

```sql
SET NOCOUNT ON; exec sp_executesql N'MERGE INTO [dbo].[orders] AS [t] USING (SELECT * FROM [dbo].[orders] AS [o] OPTION (MAXDOP 1)) AS [s] ON [t].[id] = [s].[id] WHEN MATCHED THEN UPDATE SET [note] = [s].[note];', N'';
```

> **Refuter's correction:** The claim is accurate but understates the defect in two ways. First, there is no working alternative: calling hintMssqlOption('MAXDOP 1') on the OUTER builder holding the merge - the syntactically correct statement-level position - emits the MERGE with the hint silently dropped entirely, with no error and no OPTION clause. So the child position emits unparseable SQL and the correct position is a silent no-op, leaving no way to attach OPTION to a MERGE at all. Second, MERGE usingSelect is not the only affected child scope: cte() has the identical bug. b.cte('x', s => s.fromTable('orders','o').selectAll().hintMssqlOption('MAXDOP 1')) emits WITH [x] AS (SELECT * FROM [dbo].[orders] AS [o] […]

#### A mutation statement built inside the usingSelect callback is inlined verbatim into `USING ( ... )` — MSSQL Msg 10716

**INVALID SQL** · mssql

- **Caller meant:** Nothing coherent — but `usingSelect` hands the caller a full builder on which `deleteFrom`/`updateTable`/`insertInto` are visible and callable, and its name promises a SELECT. The honest-surface rule says a method that cannot work in a position should not be reachable from it.
- **Actually does:** `usingSelect` stores `child.state()` regardless of the child's `queryType`, and `emitUsing`'s `select` arm calls `defaultToSql` unconditionally, so a DELETE/UPDATE/INSERT is rendered and wrapped in the USING parentheses. No guard anywhere asserts `queryType === Select`. The builder produces unrunnable SQL instead of refusing.
- **When run:** MSSQL: `Msg 10716, Level 15, State 1 — A nested INSERT, UPDATE, DELETE, or MERGE statement must have an OUTPUT clause.` Nothing executed.

```js
b.merge((m) => {
  m.into('orders', 't');
  m.usingSelect('s', (s) => s.deleteFrom('orders', 'o'));
  m.on((j) => j.on('t', 'id', q.JoinOperator.Equals, 's', 'id'));
  m.whenMatchedThenUpdate([{ columnName: 'note', value: q.source('note') }]);
});
// s.updateTable('orders','o').set('note','z') behaves the same
```

Emitted:

```sql
SET NOCOUNT ON; exec sp_executesql N'MERGE INTO [dbo].[orders] AS [t] USING (DELETE [o] FROM [dbo].[orders] AS [o]) AS [s] ON [t].[id] = [s].[id] WHEN MATCHED THEN UPDATE SET [note] = [s].[note];', N'';
```

> **Refuter's correction:** The claim is accurate; two refinements. (1) The `insertInto` sub-variant is NOT reachable as written — `s.insertInto('orders').values([...])` throws `TypeError: values is not a function` on every dialect, so only `deleteFrom` and `updateTable` actually leak. (2) The claim understates the severity: there is no escape hatch. `usingSelect`'s doc comment says the MSSQL view keeps "the honest-surface ceiling inside the subquery too", but that ceiling is dialect capability, not statement position. Reaching the OUTPUT-bearing form via `s.deleteFrom('orders','o').returning(['id','note'])` emits `USING (DELETE [o] OUTPUT DELETED.[id], DELETED.[note] FROM [dbo].[orders] AS [o]) AS [s]`, which MSSQL […]

#### A mutation statement built inside the insertSelect callback is inlined verbatim after the column list

**INVALID SQL** · postgres, mysql, sqlite, mssql

- **Caller meant:** Nothing coherent — but the `insertSelect` callback parameter is typed as the full `QueryBuilder`, so `insertInto`, `updateTable`, `deleteFrom` and `merge` are all visible and callable inside it, and nothing refuses them.
- **Actually does:** `insertSelect` stores `child.state()` without checking `queryType`, and `defaultInsert` calls `defaultToSql` on it unconditionally, splicing whatever statement comes back into the INSERT source position. With a `merge()` child the emitted SQL even carries MERGE's mandatory terminating semicolon mid-statement, producing a doubled `;;`.
- **When run:** Postgres (BEGIN/ROLLBACK): `ERROR: syntax error at or near "INSERT"` with the caret pointing at the second INSERT. Nothing executed.

```js
b.insertInto('orders')
  .insertColumns(['customer_id'])
  .insertSelect((s) => s.insertInto('customers').insertColumns(['email']).insertValues(['z@z']));
// s.updateTable('orders','o').set('note','z') and s.merge(...) behave the same
```

Emitted:

```sql
INSERT INTO "public"."orders" ("customer_id") INSERT INTO "public"."customers" ("email") VALUES ($1);

// MSSQL, child = merge():
SET NOCOUNT ON; exec sp_executesql N'INSERT INTO [dbo].[orders] ([customer_id]) MERGE INTO [dbo].[orders] AS [t] USING [orders] AS [s] ON [t].[id] = [s].[id] WHEN MATCHED THEN DELETE;;', N'';
```

> **Refuter's correction:** The finding stands. Two wording corrections. (a) The claim describes the doubled semicolon as appearing "mid-statement"; it is actually at the tail of the emitted batch (MERGE's mandatory terminator followed by the statement terminator) — the ';;' is real and reproduced verbatim, only the positional description is loose. (b) The claim's pseudo-code uses `s.merge('orders','t').mergeUsingTable(...).mergeOn(...).mergeWhenMatchedDelete()`, which does not exist; the real API is a callback: `s.merge(m => m.into('orders','t').usingTable('orders','s').on(j => j.on('t','id',JoinOperator.Equals,'s','id')).whenMatchedThenDelete())`. That is a transcription artifact — the real chain produces the exact […]

## 4. A correction this sweep made to a shipped fix

The refutation pass caught a false claim in the set-operation fix I had just written. The refusal
said "T-SQL allows no parenthesized operand". It does allow one — my probe had put an ORDER BY
inside the parentheses, so the `Msg 156` it produced was about the ORDER BY. MSSQL still cannot
scope a branch row cap, because T-SQL allows no ORDER BY in a set-operation operand and `limit()`
renders as OFFSET/FETCH, which requires one; so the refusal stood and only its reason was wrong.
Corrected in `b91fc82`. SQLite is the only engine that rejects the parentheses themselves.

**That lesson applies to everything in this file:** when probing whether an engine rejects some
construct, vary exactly one thing. Re-measure any floor or refusal reason here before building on
it.

## 5. Provenance

- Sweep: workflow `wf_b2ff7a7a-87d` — 54 agents, 6 seams, adversarial refutation per claimed leak.
- Raw output: task `w47p8j2r8`. Each entry was reproduced against the live harness by the agent
  that found it, then again by an independent agent trying to kill it. Quotations are clipped at
  word boundaries; the raw output has the full text.
