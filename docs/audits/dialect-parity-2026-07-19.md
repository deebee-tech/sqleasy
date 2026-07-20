# Dialect feature-parity audit — 2026-07-19

**Scope:** `@deebeetech/sqleasy` v10.1.0 (322 golden cases) and `@deebeetech/sqleasy-engine` v1.2.0,
across mssql · mysql · postgres · sqlite, on both the emission and execution sides.

**Why this ran:** the suspicion that development skewed toward MSSQL and Postgres — the dialects in
daily use — leaving MySQL and SQLite under-served. This audit was run **before** porting to four more
languages, because a dialect gap replicated across five ports costs five times as much to fix.

**Verdict: confirmed, with one honest correction.** The skew is real, but the mechanism is worse than
"features were skipped." In several places MySQL or SQLite falls through to the Postgres branch, emits
**SQL that engine cannot parse**, and a golden case _blesses the invalid output_. The correction: this
is not uniformly MSSQL-favouring — MSSQL owns the second-worst data-corruption bug (DECIMAL), and
Postgres owns two of its own.

---

## Classification used throughout

|                      | meaning                                                                                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CONFORMED**        | implemented, and covered by ≥1 golden/test for that dialect                                                                                                      |
| **DOCUMENTED-THROW** | the dialect genuinely cannot do it, _and_ a `{throws}` case proves clean rejection — a **correct** absence                                                       |
| **FALSE-CONFORMED**  | worst class: a golden pins output the engine will reject at runtime                                                                                              |
| **GAP**              | neither implemented nor documented-thrown. Actionable **only if the dialect really supports the feature** — otherwise the (smaller) fix is to add the throw case |

---

## Part 1 — The numbers

Per-dialect coverage across 322 cases:

| dialect  | asserts something | real emissions | throws | narrowed out |
| -------- | ----------------- | -------------- | ------ | ------------ |
| mssql    | 304 (94.4%)       | **244**        | 60     | 18           |
| postgres | 299 (92.9%)       | **249**        | 50     | 23           |
| sqlite   | 297 (92.2%)       | **216**        | 81     | 25           |
| mysql    | 295 (91.6%)       | **232**        | 63     | 27           |

**Postgres gets 249 real emissions; SQLite gets 216** — a 13% deficit — and SQLite carries **62% more
throw-cases** than Postgres. MySQL is second-lowest on both axes. Corpus naming is its own tell: 34
cases name mssql/postgres in the title, 15 name mysql/sqlite.

**One thing is airtight:** there are **zero** silent coverage holes. Every case with a partial `expect`
map has a matching `dialects[]` array accounting for it. The discipline is sound; the _narrowing
decisions_ are where the problem is.

---

## Part 2 — FALSE-CONFORMED: goldens that pin unrunnable SQL

These are the most serious emission findings. Each currently asserts invalid SQL as correct.

### F1 · MySQL `limitWithTies()` emits `FETCH FIRST … WITH TIES`

`src/parser/default-limit-offset.ts:38-56` — the guard checks **only** SQLite; MySQL enters the shared
arm and reaches the `FETCH FIRST` emitter. MySQL has no `FETCH` clause in any version.
Golden `limit with ties postgres` pins for mysql:
`… ORDER BY \`o\`.\`total\` DESC FETCH FIRST 5 ROWS WITH TIES;` → **error 1064**.
→ MySQL genuinely cannot do this. Fix is a **throw**, not a feature.

### F2 · SQLite gets `ROLLUP` / `CUBE` / `GROUPING SETS` (3 goldens)

`src/parser/default-group-by.ts:89,111,129` — each branches on MySQL, then falls through to the
standard form. SQLite is never checked and supports **none** of the three.
→ SQLite returns `near "ROLLUP": syntax error`. Fix is **three throws**.
This is the purest instance of the pattern: MySQL got a bespoke `WITH ROLLUP` rewrite _and_ two
explicit throws; SQLite got neither, because nobody checked it.

### F3 · MySQL index hint emitted **before** the alias

`src/parser/default-from.ts:50-57` and `default-join.ts:117-124` write the hint, _then_ ` AS <alias>`.
MySQL's grammar is `tbl_name [[AS] alias] [index_hint_list]`.
Golden `mysql use index hint` pins ``SELECT * FROM `users` USE INDEX (`users_email_idx`) AS `u`;`` →
**error 1064**.
→ **Actionable bug — MySQL fully supports this; only the emission order is wrong.** This is the
highest-value single fix in the report: a two-line move, and since `hintUseIndex`/`hintForceIndex`
exist _solely_ for MySQL, the feature is **100% broken today**. `hintForceIndex` has zero corpus cases
on any dialect, so `FORCE INDEX` has never been exercised at all.

### F4 · MySQL `fromTableFunction()` emits a FROM-clause function call

`src/parser/default-from.ts:119-152` guards SQLite's bare-name form and rejects owners on MySQL, but
never rejects the construct. MySQL has no user-callable table functions in `FROM` (only built-in
`JSON_TABLE`). → Fix is a **throw** for MySQL.

---

## Part 3 — Silently dropped clauses (valid SQL, wrong semantics)

### S1 · `top(n)` is a silent no-op on mysql, postgres, and sqlite

`src/parser/to-sql.ts:279-282` installs the hook only for MSSQL. The caller's explicit row cap
**vanishes with no error** — golden `top is silently ignored by the non-mssql dialects` records an
_unbounded_ query where a cap was requested. All three express an unordered cap trivially as `LIMIT n`.
Worse, there is currently **no portable unordered row cap at all**: `limit()` throws on MSSQL without
`ORDER BY`, and `top()` is MSSQL-only. → Emit `LIMIT n`, or at minimum throw. Never discard silently.

### S2 · MSSQL row locks silently dropped on joins and derived-table FROMs

`default-row-lock.ts:28-30` returns silently for MSSQL; `default-from.ts:61-63` applies the lock hint
**only** inside the `FromTable` branch. Therefore:

- `forUpdate()` + `fromWithBuilder()`/`fromRaw()`/`fromLateral()` → **no lock hint anywhere**.
- `forUpdate()` + `joinTable(...)` → base table locked, **joined table not**. Postgres/MySQL
  `FOR UPDATE` locks rows from _all_ tables; the MSSQL output under-locks.

All 7 row-lock goldens use a plain `fromTable` with no join. **This is the highest correctness risk in
the report** — a concurrency bug that produces no error and no wrong-_looking_ SQL.

### S3 · MySQL `Iregex`/`NotIregex` degrade to collation-dependent matching

`comparison-operator.ts:139-146` — the comment concedes it. Under a `_bin`/`_cs` collation a caller
asking for case-insensitive silently gets case-sensitive. MySQL 8.0 **does** support explicit
insensitivity via `REGEXP_LIKE(col, pat, 'i')`. → Actionable; supported via different syntax. Exactly
the pattern this audit was looking for.

### S4 · SQLite `whereMatch` may use the wrong operand

`default-full-text.ts:106-121` emits `"d"."body" MATCH ?`. FTS5 expects the **table** on the left
(`docs_fts MATCH ?`), with column scoping inside the query string. → **Verify against a live FTS5
table before acting.**

---

## Part 4 — Real GAPs (the dialect supports it; we don't)

### G1 · SQLite `UPDATE … FROM` rejected outright — the highest-value SQLite gap

`default-mutation-join.ts:37` rejects **all** SQLite mutation joins with one blanket guard. But
**SQLite 3.33.0 (Aug 2020) added `UPDATE … FROM`** with Postgres-compatible semantics. The Postgres
translation machinery in that same file (`renderPostgresMutationFrom` +
`buildPostgresMutationJoinPredicate`) is **byte-for-byte what SQLite needs**.
→ Narrow the guard to DELETE only (correctly unsupported) and route SQLite UPDATE through the existing
Postgres path.

### G2 · Index hints are MySQL-only, but three dialects support them

`hintUseIndex`/`hintForceIndex` are hard-coded MySQL-only. But **MSSQL** supports `FROM t WITH
(INDEX(idx))` — and `default-from.ts:61` already emits `WITH (…)` for row locks, so the insertion point
exists — and **SQLite** supports `INDEXED BY idx` / `NOT INDEXED`. Postgres genuinely has none.
→ Should support **3 of 4**, not 1. Note this inverts the expected skew: here Postgres is the correct
N/A and SQLite has a real capability that was overlooked.

### G3 · Table functions implemented for all four, corpus covers only SQLite

The `FromFunction` emitter handles all four dialects, but only `from table function sqlite json_each`
exists. → Corpus-only fix: add pg/mssql/mysql cases.

---

## Part 5 — The engine: no type normalization exists at all

**This is the deepest structural finding.** All four `toResult` helpers cast driver rows straight
through (`postgres/index.ts:49`, `mysql/index.ts:81`, `mssql/index.ts:135`, `sqlite/index.ts:31`), and
**no driver's losslessness knobs are set anywhere**. The row contract is therefore "whatever each
driver's _default_ config returns" — four independently-chosen defaults called a normalized `Row`.
The README never mentions bigint, decimal, boolean, Date, or json, so it isn't even documented.

| value                 | postgres          | mysql                          | mssql               | sqlite                  | verdict                    |
| --------------------- | ----------------- | ------------------------------ | ------------------- | ----------------------- | -------------------------- |
| **bigint > 2⁵³**      | `string`, exact   | **`Number`, silently rounded** | `string`, exact     | **`RangeError` thrown** | GAP (mysql, sqlite)        |
| **decimal/numeric**   | `string`, exact   | `string`, exact                | **`Number`, lossy** | n/a                     | **GAP (mssql)**            |
| **boolean**           | `true`/`false`    | **`0`/`1`**                    | `true`/`false`      | **`0`/`1`**             | GAP (mysql, sqlite)        |
| **timestamp (naive)** | `Date`, **local** | `Date`, **local**              | `Date`, **UTC**     | passthrough             | GAP (pg vs mssql disagree) |
| **json/jsonb**        | parsed object     | parsed object                  | `string`            | `string`                | GAP (undocumented)         |
| **bytea/blob**        | `Buffer`          | `Buffer`                       | `Buffer`            | **`ArrayBuffer`**       | GAP (sqlite)               |
| **uuid**              | lowercase         | n/a                            | **UPPERCASE**       | n/a                     | GAP (mssql)                |

**E1 · MySQL BIGINT silent truncation — highest blast radius.** mysql2's `supportBigNumbers` defaults
`false`; a 16-digit BIGINT (Snowflake ID, auto-increment past 9e15) is silently rounded —
`9007199254740993` → `9007199254740992`, no error. Two-line config fix.

**E2 · MSSQL DECIMAL → lossy float.** tedious `readNumeric` returns `value * sign / 10**scale`.
`DECIMAL(38,10)` and money columns come back as binary floats, while pg and mysql return exact strings
for the same column — **the engine is inconsistent with itself, and the dialect that loses money is
MSSQL.** The honest counterexample to the MSSQL-favouritism thesis.

**E3 · SQLite BIGINT throws `RangeError`**, and the `{file}` shorthand (`sqlite/index.ts:43`) drops
every other config key, so `intMode` is **unreachable** for those callers.

**E4 · `statementTimeoutMs` — the "uniform across all drivers" claim is false for MySQL.** The option
is _accepted_ everywhere, but enforcement splits 2/2. pg (`statement_timeout`) and mssql
(`requestTimeout`) genuinely cancel server-side work. SQLite is a client-side `Promise.race` — and
**says so honestly**. MySQL is the same client-side reject but **the docstring claims otherwise**
(`src/index.ts:91`, `mysql/index.ts:90`: _"mysql2 destroys the connection, which makes the server kill
the running statement"_). Neither half holds: no `destroy()` on the timeout path, no `KILL QUERY`, and
the connection is not even released early — so N timed-out queries starve a pool of N while the caller
believes each was bounded. **In a transaction it is worse:** the rollback queues behind the still-running
query, so locks are held until the "timed-out" statement completes — the opposite of a timeout's purpose.
MySQL _does_ support server-enforced timeouts (`MAX_EXECUTION_TIME`, `KILL QUERY`), so this is a real
gap, not just a doc fix. All four timeout tests are mock-level "was the option passed?" assertions
except SQLite's — which is why the false claim survived.

**E5 · `explain().rows` means different things.** The type doc says _"rows the plan produces"_, but
MySQL returns `rows_examined_per_scan`. For a selective filter over a big table these differ by orders
of magnitude — and the doc explicitly invites one cross-dialect gate on `rows`. Also `fullScan` is
lenient on Postgres (flags only `Seq Scan`) while mysql/mssql flag full _index_ scans.

**Introspection is the healthiest area** — all four conform on tables, columns, PKs, FKs, and indexes.
SQLite alone lacks `approxRowCount` (the stated "can't cheaply estimate" rationale is overstated —
`sqlite_stat1` exposes it after `ANALYZE`) and never sets `referencedSchema`. Corroborating the thesis:
the only unconditional real-DB introspection test is SQLite in-memory; every deep behavioural test
(partitioned tables, composite FKs) is Postgres-only and env-gated.

---

## Part 6 — The policy question that needs a human decision

`DISTINCT ON`, `ILIKE`, `NULLS FIRST/LAST`, and `WITH TIES` are **one decision, not four**:

> Does SQLEasy emit **native syntax only** (→ unsupported dialects throw), or does it **preserve
> semantics** (→ emulate via `ROW_NUMBER()`, `LOWER()`, `CASE WHEN … IS NULL`)?

Answer it once and apply it identically, or the four features will keep drifting apart.

**One recommendation regardless of that answer:** `NULLS FIRST/LAST` should be _rewritten_, because its
absence is **silent**. PostgreSQL sorts NULLs as _largest_ (last in ASC); MySQL, MSSQL, and SQLite sort
them _smallest_ (first in ASC). Identical builder input therefore yields differently-ordered results
across dialects **with no syntax error anywhere**.

---

## Part 7 — Ranked action list

**P0 — goldens currently assert invalid SQL**

1. `default-from.ts:50` + `default-join.ts:117` — move MySQL index hint after the alias _(real bug fix)_
2. `default-limit-offset.ts:39` — add MySQL to the `WITH TIES` throw
3. `default-group-by.ts:89,111,129` — add SQLite throws for ROLLUP/CUBE/GROUPING SETS ×3
4. `default-from.ts:119` — reject `fromTableFunction` on MySQL

**P0 — engine data corruption** 5. MySQL `supportBigNumbers`/`bigNumberStrings` defaults _(silent rounding)_ 6. MSSQL DECIMAL → string coercion _(silent money loss)_ 7. SQLite `intMode` default + preserve `{file}` shorthand config

**P1 — silent wrongness** 8. `to-sql.ts:279` — `top()` must emit `LIMIT n` or throw, never vanish 9. `default-from.ts:61` / `default-row-lock.ts:28` — MSSQL lock hints must reach joined tables 10. MySQL `statementTimeoutMs`: implement `MAX_EXECUTION_TIME`/`KILL QUERY`, **or** correct the docstring 11. boolean `0`/`1` on mysql/sqlite; naive-timestamp UTC-vs-local policy

**P2 — real feature gaps** 12. SQLite `UPDATE … FROM` via the existing Postgres path 13. Index hints for MSSQL + SQLite 14. MySQL `Iregex` → `REGEXP_LIKE(col, pat, 'i')`

**P3 — unproven contracts / missing coverage** 15. Missing documented-throws: hint subsystem cross-dialect, MySQL `GROUPING SETS`, SQLite `JsonExtractMode.Object` 16. Zero coverage on all four dialects: `havingJsonExtract`, `havingJsonContains`, `havingMatch` (the
`where*` twins are all covered — pure asymmetry), `whereMatchRaw`, `joinLateral`, `fromFunctionRaw`,
`hintForceIndex`, `clearHints`, `FrameUnit.Range`, `JsonExtractMode.Object`, `FullTextMode.Phrase`,
`NotIregex` 17. Cosmetic, pinned into 6 goldens: doubled space in `LIMIT 10  OFFSET 20`

---

## A correction worth keeping

Any capability table written from a _"SQLite is the toy one"_ prior will be wrong. At 3.53 SQLite has
`RETURNING` (3.35), upsert (3.24), window functions **including `GROUPS`/`EXCLUDE`** (3.25/3.28 —
_more_ than MySQL or MSSQL), `NULLS FIRST/LAST` (3.30), `IS [NOT] DISTINCT FROM` (3.39), `RIGHT`/`FULL
OUTER JOIN` (3.39), JSON `->`/`->>` (3.38), `FILTER` (3.30), and `INDEXED BY`. **Two-thirds of that
list postdates 2018.** Meanwhile MSSQL 2022 lacks regex entirely (2025 only), JSON operators,
`NULLS FIRST/LAST`, `FILTER`, and frame `GROUPS`/`EXCLUDE`.

**Triage on capability, not on dialect reputation.**

---

## Nothing here was changed

This audit is read-only. No emission semantics were modified, because every P0/P1 fix changes emitted
SQL → changes the corpus → obliges every language port to follow. Those are library-semantics
decisions with cross-language blast radius and they want a human call — starting with the Part 6
policy question.

The standing guardrail (`scripts/check-dialect-parity.mjs`) is in place so that **new** work cannot
reopen this class of gap while the backlog above is worked through.
