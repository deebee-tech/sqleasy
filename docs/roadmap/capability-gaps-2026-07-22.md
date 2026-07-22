# SQLEasy capability roadmap

**Status:** open. Written 2026-07-22, against SQLEasy 12.0.0 / contract 0.24.0.
**How to use this:** every entry is written to be startable cold. Pick one, read its paragraph in
§3, check §5 for whether something else has to land first, and go. Nothing here is sequenced —
except the four dependency clusters in §5, which genuinely are.

## 1. What this is, and what it is not

A workflow of 79 agents swept eight SQL feature areas for capabilities the four engines have that
SQLEasy does not expose, or exposes unevenly. Every claimed gap then went through an adversarial
pass whose job was to REFUTE it — "reachable via a raw hatch", "already emitted", "not actually a
capability". 46 survived. The ones that were killed are listed in §4 so nobody re-sweeps them.

This is a _capability_ list. It is not a bug list. Two defects the sweep surfaced were live silent
failures in the shipped 11.0.0 and were fixed before 12.0.0 rather than roadmapped:

- **An empty alias emitted a zero-length delimited identifier** in every clause except FROM
  (`WHERE ""."id"`). Postgres and SQLite rejected it; **MySQL accepted it and returned rows**.
  Fixed in `c83ddb5` — `qualifiedColumn()` in both ports.
- **A row cap on an UPDATE or DELETE was silently dropped** on all four dialects — `.limit(1000)`
  on a DELETE produced no clause, no parameter and no error, so the statement deleted the whole
  table. `.offset()`, `.top()` and `.orderByColumn()` were dropped the same way. Fixed in `41cca88`;
  this was item #6 below, so it is struck from the list.

Both were verified against the live harness, not inferred. DeeBee was checked and hits neither.

## 2. Standing rulings

These are decisions already made. They constrain how the items below get built, so read them first.

**The aggregate boundary (ruled 2026-07-22).** Item #10 adds an **aggregate call node only** —
COUNT / SUM / AVG / MIN / MAX over a column or `*`, plus a DISTINCT flag. It is a clause-level node,
**not** a general expression AST. The stated boundary in the code — "this is deliberately NOT an
expression AST" — stands everywhere else: no CASE, no CAST, no COALESCE, no scalar-function surface
beyond the existing `Fn.*` normalization helpers. Items #3, #14, #15 and #24 all depend on this node
and must stay inside that line.

**Honest capability surface.** No approximations, no emulation, and no method visible on a dialect
that cannot run it. Runtime refusal is the floor; compile-time absence from the typed view is the
ceiling. A refusal message should name the workaround it is declining to do — see the Postgres
mutation-cap refusal, which says the ctid/CTE rewrite is an emulation this library will not perform.

**Engine-native names.** Where two engines have the same capability under different names, each
dialect gets its own spelling rather than a shared lowest-common-denominator one (`joinCrossApply`
on MSSQL vs `joinCrossLateral` on Postgres; `updlockReadpast`; `limit()` vs `top()`).

**Every claim gets measured.** The floors in the table below came from documentation. Before
building any item, run it against the harness — the sweep's own version claims were wrong often
enough to matter, and the engines disagree with their docs more than they should.

## 3. The ranked list

Ranked by demand first, then by inverse effort. **#6 is done** (shipped in 12.0.0) and is left in
place so the numbering matches the detail paragraphs below.

| #     | Capability                                                                      | Engines (floor)                                          | Demand | Effort |
| ----- | ------------------------------------------------------------------------------- | -------------------------------------------------------- | ------ | ------ |
| 1     | `NOT BETWEEN` in WHERE / HAVING                                                 | all four (SQL-92)                                        | high   | small  |
| 2     | CTE `MATERIALIZED` / `NOT MATERIALIZED`                                         | PG 12+, SQLite 3.35+                                     | high   | small  |
| 3     | `DISTINCT` inside an aggregate (`COUNT(DISTINCT x)`) — needs #10                | all four                                                 | high   | small  |
| 4     | Column-to-column comparison in WHERE / HAVING                                   | all four                                                 | high   | medium |
| 5     | JOIN ON null predicates: `IS [NOT] NULL`, null-safe equality                    | all four (MSSQL native `IS DISTINCT FROM` 2022+)         | high   | medium |
| ~~6~~ | ~~Row-capped UPDATE / DELETE~~ — **DONE, shipped in 12.0.0 (`41cca88`)**        | MySQL 4.0+, MSSQL 2005+                                  | —      | —      |
| 7     | ORDER BY an output column: alias, unqualified name, ordinal                     | all four                                                 | high   | medium |
| 8     | `JOIN … USING (cols)`                                                           | PG, MySQL 8, SQLite                                      | high   | medium |
| 9     | `VALUES` as a table source — `FROM (VALUES …) AS t(a,b)`                        | PG, MSSQL 2008+, MySQL 8.0.19+; SQLite narrower          | high   | medium |
| 10    | An aggregate call node (COUNT / SUM / AVG / MIN / MAX)                          | all four                                                 | high   | medium |
| 11    | `excluded` / row-alias reference in the upsert SET list                         | PG 9.5+, SQLite 3.24+, MySQL 8.0.19+                     | high   | medium |
| 12    | Postgres array predicates: `= ANY(arr)`, `<> ALL(arr)`, `@>`, `<@`, `&&`        | PG (MySQL `MEMBER OF` partial)                           | high   | medium |
| 13    | Row-value comparison — `(a,b) > (?,?)`, `(a,b) IN ((?,?),…)`                    | PG, MySQL, SQLite 3.15+; **not** MSSQL                   | high   | large  |
| 14    | Ordered string aggregation — STRING_AGG / GROUP_CONCAT                          | all four, three grammars                                 | high   | large  |
| 15    | JSON aggregation in the SELECT list                                             | PG 9.3+, MySQL 5.7.22+, SQLite 3.9+; **not** MSSQL ≤2022 | high   | large  |
| 16    | Table functions in JOIN/APPLY position + column-referencing args                | MSSQL 2005+, PG, SQLite 3.9+                             | high   | large  |
| 17    | JSON shredding into rows (JSON_TABLE / OPENJSON…WITH / json_each over a column) | MySQL 8.0.4+, MSSQL 2016+, PG 9.4+, SQLite 3.9+          | high   | large  |
| 18    | `INTERSECT ALL` / `EXCEPT ALL`                                                  | PG, MySQL 8.0.31+                                        | medium | small  |
| 19    | Negated predicate group — `NOT ( … )`                                           | all four                                                 | medium | small  |
| 20    | `LIKE … ESCAPE 'c'` with a caller-supplied escape char                          | all four                                                 | medium | small  |
| 21    | `INSERT … DEFAULT VALUES`                                                       | PG, SQLite, MSSQL; MySQL `INSERT INTO t () VALUES ()`    | medium | small  |
| 22    | `WITH ORDINALITY` — needs #33                                                   | PG 9.4+                                                  | medium | small  |
| 23    | Named windows — `WINDOW w AS (…)` / `OVER w`                                    | PG 8.4+, MySQL 8.0+, SQLite 3.25+, MSSQL 2022+           | medium | medium |
| 24    | `FILTER (WHERE …)` on aggregates (plain and windowed)                           | PG 9.4+, SQLite 3.30+                                    | medium | medium |
| 25    | Non-integer RANGE frame offsets (`INTERVAL '7' DAY PRECEDING`)                  | PG 11+, MySQL 8.0+                                       | medium | medium |
| 26    | Quantified subquery comparison — `> ALL (…)`, `>= ANY (…)`                      | PG, MySQL, MSSQL; **not** SQLite                         | medium | medium |
| 27    | `COLLATE` on ORDER BY terms and comparisons                                     | all four                                                 | medium | medium |
| 28    | `ON CONFLICT (…) WHERE <pred>` and `DO UPDATE … WHERE`                          | PG 9.5+, SQLite 3.24+                                    | medium | medium |
| 29    | `REPLACE INTO` / SQLite `INSERT OR <resolution>`                                | MySQL, SQLite                                            | medium | medium |
| 30    | `TRUNCATE`                                                                      | PG, MySQL 5.x+, MSSQL 2005+; **not** SQLite              | medium | medium |
| 31    | RETURNING / OUTPUT pre-update row image (DELETED + INSERTED)                    | MSSQL 2005+, PG 18+                                      | medium | medium |
| 32    | `SEARCH DEPTH/BREADTH FIRST` and `CYCLE` on recursive CTEs                      | PG 14+                                                   | medium | medium |
| 33    | Column alias list on a table source — `AS t(a, b)`                              | PG, MySQL 8, MSSQL 2008+; **not** SQLite                 | medium | medium |
| 34    | Index hints for MSSQL and SQLite (audit item G2)                                | MSSQL 2005+, SQLite                                      | medium | medium |
| 35    | Postgres range / multirange operators (`@>`, `<@`, `&&`, `-\|-`)                | PG 9.2+, multirange 14+                                  | medium | medium |
| 36    | Postgres 15+ `MERGE`                                                            | PG 15+ (17+ for NOT MATCHED BY SOURCE / RETURNING)       | medium | large  |
| 37    | MSSQL `TOP (n) PERCENT` (+ `WITH TIES`)                                         | MSSQL 2005+                                              | low    | small  |
| 38    | `whereJsonContainedBy` — `<@` / swapped `JSON_CONTAINS`                         | PG 9.4+, MySQL 5.7.8+                                    | low    | small  |
| 39    | `ON CONFLICT ON CONSTRAINT <name>`                                              | PG 9.5+                                                  | low    | small  |
| 40    | `FrameUnit.Groups`                                                              | PG 11+, SQLite 3.28+                                     | low    | small  |
| 41    | Window frame `EXCLUDE` (NO OTHERS / CURRENT ROW / GROUP / TIES)                 | PG 11+, SQLite 3.28+                                     | low    | small  |
| 42    | MySQL `IGNORE INDEX`, and the `FOR JOIN/ORDER BY/GROUP BY` scope                | MySQL 8.x                                                | low    | small  |
| 43    | Postgres `ORDER BY expr USING <operator>`                                       | PG (all)                                                 | low    | small  |
| 44    | SQLite `GLOB` / `NOT GLOB`                                                      | SQLite                                                   | low    | small  |
| 45    | MySQL `STRAIGHT_JOIN`                                                           | MySQL 8.x                                                | low    | small  |
| 46    | `NATURAL JOIN` (and NATURAL LEFT/RIGHT)                                         | PG, MySQL 8, SQLite; **not** MSSQL                       | low    | small  |

## 4. Detail on the high-demand items

Each paragraph names the exact code that has to change and the trap that will bite. These were
written by the agents that found the gaps; they have not all been independently re-verified, so
treat the file/line claims as strong leads rather than gospel — §2's "every claim gets measured"
applies here too.

**1. `NOT BETWEEN` in WHERE / HAVING.** The negation of a range test. Universal SQL-92 — and SQLEasy already emits it, just on the wrong clause: `onNotBetween` exists on JOIN ON with a `JoinOnOperator.NotBetween` member and a `' NOT BETWEEN '` emission in `default-join.ts`. Needs `BuilderType.WhereNotBetween` / `HavingNotBetween`, `whereNotBetween` / `havingNotBetween`, and a negation branch in `default-where.ts` where `'BETWEEN '` is hard-coded. No refusals — all four dialects do this identically. Trap: none. This is the cheapest real item on the list and closes a visible asymmetry.

**2. CTE materialization hint.** `WITH x AS [NOT] MATERIALIZED (…)` — explicit control over whether a CTE is an optimization fence. Postgres 12+ (the release that made the default conditional, which is exactly why the keyword exists) and SQLite 3.35.0+. MySQL and MSSQL have no such syntax and always inline. Needs one field on `CteState`, one argument on `cte`/`cteRecursive`, one emission slot in `default-cte.ts` between the name and `AS (`, and refusals on MySQL/MSSQL. Trap: `cteRaw` does **not** rescue this — `default-cte.ts` hard-codes `' AS ('` and then splices the caller's text, so the raw string always lands inside the parens, the one place the keyword cannot go. Demand is high because on PG 12+ a CTE that used to fence now silently inlines, and this keyword is the only way to get the old plan back.

**3. `DISTINCT` inside an aggregate.** `COUNT(DISTINCT x)`, `SUM(DISTINCT x)`. Verified live on all four (PG 17.10, MySQL 8.4.10, MSSQL 2022, SQLite 3.51). Statement-level `distinct()`/`distinctOn()` do not reach inside a function call. This is a flag on the aggregate node, so it lands with #10 rather than before it. Two per-dialect refusals a structured surface must carry: MSSQL 2022 rejects `STRING_AGG(DISTINCT …)`, and SQLite rejects DISTINCT combined with a separator argument ("DISTINCT aggregates must have exactly one argument") while PG and MySQL accept it.

**4. Column-to-column comparison in WHERE / HAVING.** `WHERE a.shipped_at > a.created_at`. `where()` always binds the RHS as a parameter, and `WhereState` has no right-hand column slot at all. The emitter shape is already proven in `join-on.ts`'s `on()`, which carries `aliasRight`/`columnRight` and does exactly this inside ON — the capability is simply unreachable from WHERE. Needs right-hand alias/column fields on `WhereState`, an overload on `where`/`having`, and a branch in `comparison-operator.ts` that emits a quoted identifier instead of `addDynamicValue`. No refusals: all four engines, all versions.

**5. JOIN ON null predicates.** Two things, one work item. `IS NULL` / `IS NOT NULL` in an ON clause is universal SQL, and `JoinOperator` has nine members with no null form and `JoinOnOperator` has no Null member — so it is `onRaw` only. Null-safe equality on join keys (`IS [NOT] DISTINCT FROM` on PG and SQLite 3.39+, `<=>` on MySQL, native on MSSQL 2022+) is the same hole. Needs enum members on both join enums plus arms in the two operator switches in `default-join.ts`. Two traps, both sharp. First, WHERE is **not** a substitute: moving `b.deleted_at IS NULL` out of a LEFT JOIN's ON into WHERE converts it to an inner join and silently changes the result set. Second, the corpus already records the near-miss as a live trap — `onValue(…, null)` binds a NULL parameter and emits `= ?`, a never-true predicate, rather than rewriting to `IS NULL`. The null-safe half needs its own decision on MSSQL, because the WHERE path's bound-literal collapse is unavailable when both sides are columns, so pre-2022 MSSQL must refuse rather than reuse. This also applies to MERGE, whose ON reuses `JoinOnBuilder`.

**6. Row-capped UPDATE / DELETE.** MySQL 4.0+ allows single-table `UPDATE`/`DELETE … ORDER BY … LIMIT n`; MSSQL 2005+ allows `DELETE TOP (n)` / `UPDATE TOP (n)` (T-SQL admits no ORDER BY there). This is the shape of every retention job and backfill. **Today the calls are silently dropped**: the Update and Delete branches of `to-sql.ts` return before the ORDER BY and limit/offset blocks, and MSSQL's TOP is emitted only by the `beforeSelectColumns` hook that only `defaultSelect` calls — so `.limit(1000)` and `.top(1000)` on a mutation produce no SQL and no error. That is the same silent-no-op class the 2.0 release exists to remove; it was closed for SELECT and left open for mutations. Needs emission on the mutation branches, a multi-table guard on MySQL, and refusals on Postgres (the ctid/CTE workaround is emulation) and SQLite (the syntax needs `SQLITE_ENABLE_UPDATE_DELETE_LIMIT`, off in the default amalgamation). Ship the refusals even if the emission slips — the silent drop is worse than absence.

**7. ORDER BY an output column.** Sorting by a select alias (`ORDER BY cnt DESC`), an unqualified name, or an ordinal. All four engines: PG and SQLite always, MySQL 4.1+, MSSQL 2005+. `orderByColumn` takes `(alias, column)` and unconditionally emits `"a"."b"`. Two consequences today, both reproduced against `dist`: `orderByColumn('', 'total', …)` emits `ORDER BY ""."total"`, an empty quoted identifier that is invalid on Postgres, with no refusal; and on a compound query `orderByColumn('a','id',…)` emits a qualified inner-table reference that **all four** engines reject — an output-column reference is the only legal form after UNION/INTERSECT/EXCEPT. So today no structured ORDER BY term can be attached to a compound query at all. Needs new term types on `OrderByState` plus `orderByAlias` / `orderByOrdinal`, and it fixes the window sub-builder at the same time since both go through `emitOrderByTerm`.

**8. `JOIN … USING (cols)`.** Verified running on PG 17.10, MySQL 8.4.10 and SQLite 3.51.0; verified rejected on MSSQL 2022 (`Msg 102 … near 'USING'`), so a correct 3-of-4. Needs a `usingColumns` field on `JoinState`, a builder overload beside `joinTable`, and an MSSQL refusal. Trap: `joinRaw` is not coverage — `default-join.ts` emits it verbatim and `continue`s, skipping identifier quoting, the MySQL index-hint slot and the MSSQL per-table lock hint. PG 14+ additionally accepts the join-alias form `USING (q) AS x`.

**9. `VALUES` as a table source.** `FROM (VALUES (1,'x'),(2,'y')) AS t(a,b)` — the inline lookup table, the batch-of-tuples join. PG and MSSQL 2008+ take it as written (MSSQL requires the alias list); MySQL 8.0.19+ spells the rows `VALUES ROW(1,'x'), ROW(2,'y')`; SQLite takes the rows but not the `AS t(a,b)` alias list, so SQLite gets a genuinely narrower version, not the same capability. The rendering is already written but locked inside MERGE: `MergeBuilder.usingValues(alias, columns, rows)` emits exactly `(VALUES …) AS alias (cols)` and MERGE is MSSQL-only. **Raw is not an escape hatch here** — `fromRaw` takes a string and emits it with `addSqlSnippet`, which carries no values, and no `*Raw` method in the builder accepts params, so a VALUES source built with `fromRaw` would have to inline literals. Depends on #33 for the alias list.

**10. An aggregate call node.** COUNT / SUM / AVG / MIN / MAX are identical spellings on all four engines and SQLEasy has no method for any of them. The entire SELECT-list surface is selectAll / selectColumn(s) / selectRaw(s) / selectWithBuilder / selectWindow / selectJsonExtract; `SelectState` has no aggregate fields and none of the 129 adjudicated ops is an aggregate. `HAVING COUNT(*) > 5` — the canonical HAVING — is `havingRaw` only, because `having()` takes `(alias, column, operator, value)`. The corpus itself writes `{"op":"selectRaw","sql":"COUNT(*) AS cnt"}`. Trap, and it is the real cost: this is a surface-design decision, not a method. It is the gate on #3, #14, #15 and #24, and it moves the line the refutations relied on — that SQLEasy models clauses, not expressions. Decide the boundary deliberately (aggregate call node with a column or `*` operand, not a general expression AST) before any of the four dependents ship.

**11. `excluded` / row-alias reference in the upsert SET list.** `ON CONFLICT … DO UPDATE SET name = EXCLUDED.name` — the whole point of an upsert. PG 9.5+ and SQLite 3.24+ spell it `excluded`; MySQL 8.0.19+ uses the row alias (`INSERT … AS new … ON DUPLICATE KEY UPDATE c = new.c`), with `VALUES(c)` on earlier versions, deprecated in 8.0.20. Today `onConflictDoUpdate` takes `{columnName, value}` pairs and `emitSetList` runs every value through `addDynamicValue`, so `SET "name" = excluded."name"` comes out as a re-bound literal. The raw route replaces the whole SET list **and cannot bind parameters** (no `*Raw` method in the library accepts params), so mixing `name = excluded.name` with a bound `updated_at = $1` is not expressible at all. The shape is already proven in-repo: `MergeBuilder`'s `source()`/`target()`/`value()`/`raw()` expression helpers do exactly this. Trap: MySQL needs the `AS new` row alias emitted on the INSERT itself, which the upsert emitter does not currently touch.

**12. Postgres array predicates.** `col = ANY($1)` binds one array parameter instead of N scalars; `@>`, `<@`, `&&` are the array containment/overlap operators. Postgres all versions; MySQL 8.0.17+ has the analogous `value MEMBER OF(json_array)`; MSSQL and SQLite have nothing. `whereInValues` emits one placeholder per element, with three consequences `IN` cannot fix and `= ANY($1)` does: the empty list is a hard refusal (`'IN requires at least one value'`) while `= ANY('{}'::int[])` is valid and matches nothing; a 20k-element list blows past Postgres's 65535 bound-parameter cap; and every distinct list length is a distinct statement text, churning the plan cache. Trap: `@>` does have an emitter, but `emitJsonContainsPredicate` unconditionally appends `::jsonb` to the bound value, so it cannot be pointed at a `text[]` or `int[]` column — the array operators need their own emission path, not a reuse.

**13. Row-value comparison.** `(created_at, id) < (?, ?)` — the keyset-pagination predicate, and the composite-key lookup `(a,b) IN ((?,?),…)`. PG and MySQL all versions, SQLite 3.15.0+; MSSQL has no row constructor in a comparison in any version and must refuse, because the OR-chain expansion is exactly the emulation this library forbids. Every WHERE entry point is single-column and `WhereState` holds one column pair, so a multi-column left side cannot be represented — this is the large item on the list because it changes the state shape rather than adding to it. Demand is genuinely high: this is the only formulation of a keyset page that stays correct across ties and lets the engine use the composite index that satisfies the ORDER BY. Its absence is why deep pagination in SQLEasy falls back to OFFSET, which the parser emits at any depth without complaint. Pairs with #7 — a keyset page is this predicate plus a matching multi-column ORDER BY.

**14. Ordered string aggregation.** All four have it under three names and two grammars, verified live: PG 9.0+ `string_agg(x, ',' ORDER BY y)`; MySQL `GROUP_CONCAT(x ORDER BY y DESC SEPARATOR '|')` (no `string_agg` — ERROR 1305); MSSQL 2017+ `STRING_AGG(x, ',') WITHIN GROUP (ORDER BY y DESC)`, where the ordering lives in a trailing clause, not inside the parens; SQLite `group_concat(x, sep)` always, with the `string_agg` alias and in-call `ORDER BY` from 3.44.0. Under the engine-native-name rule this likely splits into `stringAgg` on PG/MSSQL/SQLite and `groupConcat` on MySQL/SQLite rather than one shared name. Trap: `WITHIN GROUP (ORDER BY …)` has no plumbing anywhere in the codebase, and it is the load-bearing piece for MSSQL. Depends on #10.

**15. JSON aggregation in the SELECT list.** `json_agg` / `jsonb_agg` / `json_object_agg` (PG 9.3–9.5+), `JSON_ARRAYAGG` / `JSON_OBJECTAGG` (MySQL 5.7.22+), `json_group_array` / `json_group_object` (SQLite 3.9+, compiled in by default from 3.38). Verified absent on MSSQL 2022 (`'JSON_ARRAYAGG' is not a recognized built-in function name`) — it is Azure SQL / SQL Server 2025 only, so the honest floor today is absent-on-MSSQL, and MSSQL's statement-level `FOR JSON PATH` is a different construct worth pricing separately as a small MSSQL-only method. Highest-demand item in the JSON area (returning a nested document in one round trip is the standard N+1 fix and the reason applications reach for jsonb at all), but it cannot be a narrow JSON add — it forces #10 first.

**16. Table functions in JOIN/APPLY position, and column-referencing arguments.** Two halves, both missing. There is no `joinTableFunction`: `joinCrossApply`/`joinOuterApply`/`joinLateral` all route through a private helper that only accepts a QueryBuilder and always renders `(subquery) AS alias`. And `fromTableFunction`'s params run through `addDynamicValue`, so every argument becomes a placeholder — `json_each(t.data)` or `dbo.fn(t.col)` is unreachable, and wrapping the TVF in a subquery does not help because the subquery is uncorrelated for the same reason. MSSQL 2005+ (`CROSS APPLY dbo.fn(t.col)` is _the_ TVF idiom), PG (`JOIN LATERAL unnest(t.arr)`), SQLite 3.9+ (verified). MySQL genuinely absent, already recorded. The demand signal is in-repo: SQLEasy's own engine package could not use the builder for index introspection and hand-wrote `JOIN LATERAL unnest(…) WITH ORDINALITY AS k(attnum, ord)`.

**17. JSON shredding into rows.** `JSON_TABLE` (MySQL 8.0.4+, PG 17+), `OPENJSON(expr) WITH (…)` (MSSQL 2016+), `jsonb_array_elements` / `jsonb_to_recordset` (PG 9.4+), `json_each` / `json_tree` (SQLite 3.9+). Structurally unreachable: the FROM-function branch binds every argument as a value and emits `fn(args) AS alias` with no `WITH (…)` / `COLUMNS (…)` / column-definition-list slot. Depends on #16 (correlated arguments) and #33 (column alias list). Secondary defect to verify before building: non-SQLite dialects run the function name through `quoteIdentifier`, which would emit `[OPENJSON](?)` on MSSQL — SQLite is already special-cased to skip quoting, and the same fix is likely needed for rowset functions elsewhere.

## 5. Dependency clusters

Four clusters share a primitive and should be scheduled together, not interleaved:

- **#10 → #3, #14, #15, #24.** Nothing in the aggregate family ships until the aggregate call node exists and its boundary is ruled on.
- **#33 → #9 (MSSQL), #22, #17.** The column alias list `AS t(a,b)` is the shared prerequisite.
- **#16 → #17.** Correlated function arguments gate JSON shredding.
- **#40, #41** are one work item (same two engines, same SQLite release, same emitter).

## 6. Checked and NOT a gap

Do not re-sweep these.

- **The window function catalogue (row_number/rank/lag/lead/nth_value/percentile).** Reachable today: `selectWindow(fn, …)` takes the call expression verbatim and the OVER clause is structured; adjudicated native on all four dialects.
- **RESPECT NULLS / IGNORE NULLS.** Genuinely absent, but it attaches to the function call, which is the verbatim region by design — and SQLEasy models no engine version, so a 2022-only MSSQL feature could not be gated honestly.
- **Data-modifying CTEs.** Already emitted correctly on Postgres via `cte()`. The residual is a _missing refusal_ on the other three, i.e. validation hardening on an adjudicated cell, not new surface.
- **Parenthesized / grouped set-operation operands with per-branch ORDER BY + LIMIT.** Reachable via `fromWithBuilder` and `cte` on all four; the residual is a missing guard on `.unionAll(u => u.limit(3))`, which is a bug.
- **`cteRaw` lacking a column list and recursive flag.** Both capabilities already exist on `cte`/`cteRecursive`; RECURSIVE is computed clause-wide anyway. Raw-hatch parameter parity, not capability.
- **Raw set-operation branches (`unionRaw` etc.).** Reachable one nesting level down through the child builder's raw family. The one real residue, `INTERSECT ALL` / `EXCEPT ALL`, is item #18 as typed methods; shipping it as a raw hatch would bypass dialect gating.
- **`IS TRUE` / `IS FALSE` / `IS NOT TRUE` / `IS NOT FALSE`.** Exactly reproducible with the existing `IsDistinctFrom` / `IsNotDistinctFrom` members against `true`/`false`, verified emitting on all four.
- **Postgres `SIMILAR TO`.** Postgres implements it by translating to POSIX ERE on the same engine that backs `~`, which SQLEasy already exposes. Alternate syntax, zero expressiveness gain.
- **`BETWEEN SYMMETRIC`.** The SQL standard _defines_ it as the OR of the two orderings, which `whereGroup` + `or()` + `whereBetween` already composes portably.
- **SQL-standard `OVERLAPS`.** The half-open interval test is two ordinary comparisons, already typed both column-vs-value (`where`) and column-vs-column (`on`). Only degenerate-case handling differs.
- **`GROUPING()` / `GROUPING_ID()`.** Identical spelling on the three engines that have it, so it buys no dialect knowledge; and SQLite is already refused at the ROLLUP/CUBE/GROUPING SETS clause, so nobody can be misled. Belongs to the function-expression axis (#10), not to GROUP BY.
- **Mixed / multiple GROUP BY grouping elements.** `groupByGroupingSets` already expresses every mixed form, exactly, on the two dialects that support them. The silent-drop half is a real defect but is already recorded verbatim in `decisions.json`.
- **Statistical aggregates (stddev / variance / percentile).** Function-catalogue work, not clause work; the MSSQL percentile half is already reachable through `selectWindow`; and PG `stddev()` is sample while MySQL `STDDEV()` is population, so a bare shared name would ship silently wrong numbers.
- **HAVING without GROUP BY.** The form the guard blocks (bare non-aggregated column in HAVING) is rejected by PG, MSSQL and MySQL under ONLY_FULL_GROUP_BY. The form all four accept needs aggregate expressions, i.e. #10.
- **JSON key/path existence (`whereJsonExists`).** Already emitted: `whereJsonExtract(…, Equals|NotEquals, null)` collapses to `IS [NOT] NULL` around the JSON expression on all four dialects, and Object mode distinguishes JSON null from a missing key on PG.
- **`JsonExtractMode.Object` on SQLite.** The refusal is factually correct — SQLite's `->` returns TEXT exactly as `json_extract` does, and for objects/arrays the existing emission is byte-identical, subtype included. (Real sub-defect, not a gap: the refusal message points at `selectJsonRaw`, a method that was never written, and the bad name has been copied into both manifests and the Dart port.)
- **A typed `CAST` accessor.** Motivated by a claim that is wrong on 3 of 4 dialects; the proposed method has no seam to reach the JSON extraction; and with a verbatim type string it carries zero dialect knowledge.

## 7. What is still missing after all 46

Not "nothing." Three things remain after all 46 items, plus one adjacent observation.

**The expression axis, deliberately.** Even with #10 done, SQLEasy still has no `CASE`, no `CAST`, no `COALESCE`, and no scalar-function surface beyond the five `Fn.*` normalization helpers (concat, charLength, round, now, divide). That boundary is stated in code — "This is deliberately NOT an expression AST" — and every refutation above leans on it. Items #10, #14, #15 push directly against it, so the aggregate node needs an explicit ruling on where the new line sits, or the next sweep will find the same argument on both sides.

**DDL, entirely.** No CREATE / ALTER / DROP for tables, indexes, views or constraints. #30 (TRUNCATE) is the DDL-adjacent edge and carries an implicit commit on MySQL and MSSQL, which is itself a scope question this builder has never had to answer.

**Two lock-clause residuals I found while checking this sweep's coverage — not adversarially tested, flagged as candidates, not claims.** Row locking is otherwise in good shape (`FOR UPDATE`/`FOR SHARE`, `NOWAIT`, `SKIP LOCKED`, MSSQL `UPDLOCK/ROWLOCK/READPAST`, with well-reasoned refusals for `forShare` on MSSQL and for unplaceable hints). But: (a) `RowLockMode` has only `None`/`ForUpdate`/`ForShare`, so Postgres 9.3+'s `FOR NO KEY UPDATE` and `FOR KEY SHARE` — the weaker strengths high-contention PG applications actually want, because `FOR UPDATE` blocks FK-referencing inserts — have no representation; and (b) `rowLock` is statement-level (`state.rowLock`), so `FOR UPDATE OF <table>` (PG all versions, MySQL 8.0.1+) cannot be expressed, and on MSSQL the `WITH (UPDLOCK, ROWLOCK)` hint is stamped on **every** FROM and JOIN table rather than a chosen one. Both look like genuine missing enum members / a missing target field; both should get the same adversarial pass the 46 got before being scheduled.

**Areas this sweep did not cover at all**, so their state is unknown rather than clean: the full-text surface (`FullTextMode`, `whereMatch`), the stored-procedure `CALL` surface (`CallKind`, `CallParamDirection`, `CallReturnIntent`), and transaction control beyond the `BEGIN`/`COMMIT` delimiters — no savepoints, no isolation levels, no per-statement lock timeout.

**Adjacent, not a capability:** `LIMIT`/`OFFSET`/`TOP` values are spliced as literals (`state.limit.toString()`), never bound. All four engines accept a parameter there (with MSSQL needing `TOP (@p)` parenthesized). Same plan-cache-churn argument as the `IN`-list case in #12, but it is a parameterization choice on a shipped capability, so it belongs on the bug track, not this one.

## 8. Provenance

- Sweep: workflow `wf_dd4fe3fb-330`, 79 agents, 8 areas, adversarial refutation per claimed gap.
- Raw output: `wkm27k7wt` (231 KB). The ranked table, detail paragraphs, cluster notes, kill list
  and tail in this document are that output, restructured — no findings were dropped.
- The two fixed defects are commits `c83ddb5` and `41cca88` on `main`.
