# [13.0.0](https://github.com/deebee-tech/sqleasy/compare/v12.0.0...v13.0.0) (2026-07-18)


### Features

* **where/having/select:** JSON operators — `whereJsonExtract`/`havingJsonExtract`,
  `whereJsonContains`/`havingJsonContains`, and `selectJsonExtract` with `JsonExtractMode.Text`/
  `Object`. Postgres emits `->`/`->>`/`@>`; MySQL `JSON_EXTRACT`/`JSON_CONTAINS`; MSSQL
  `JSON_VALUE`/`JSON_QUERY` (containment throws — use raw SQL); SQLite `json_extract` (object mode
  throws).
* **where/having:** full-text search — `whereMatch`/`havingMatch` with `FullTextMode.Natural`/
  `Boolean`/`Phrase`. Postgres `to_tsvector`/`plainto_tsquery`; MySQL `MATCH ... AGAINST`; MSSQL
  `FREETEXT`/`CONTAINS`; SQLite FTS `MATCH`. Unsupported mode/dialect combos throw; `whereMatchRaw`
  is the escape hatch.
* **insert:** MSSQL upsert via `MERGE` — `onConflictDoNothing`/`onConflictDoUpdate` now emit a T-SQL
  `MERGE` on MSSQL (requires explicit insert columns and conflict columns). PG/SQLite `ON CONFLICT`
  and MySQL `INSERT IGNORE`/`ON DUPLICATE KEY UPDATE` unchanged.
* **from/join:** LATERAL / APPLY — `fromLateral`, `joinCrossApply`, `joinOuterApply`, `joinLateral`.
  Postgres/MySQL map APPLY to `LATERAL`; MSSQL emits `CROSS`/`OUTER APPLY`; SQLite throws.
* **from:** set-returning / table-valued functions — `fromTableFunction`/`fromTableFunctionWithOwner`
  and `fromFunctionRaw`.
* **groupBy:** `groupByRollup`/`groupByCube`/`groupByGroupingSets` — standard modifiers; MySQL uses
  `WITH ROLLUP` where applicable and throws on `CUBE`/`GROUPING SETS`.
* **limit:** `limitWithTies`/`clearLimitWithTies` — `FETCH FIRST/NEXT ... WITH TIES` on
  Postgres/MySQL/MSSQL; SQLite throws.
* **hints:** structured query hints — `hintUseIndex`/`hintForceIndex` (MySQL),
  `hintMssqlOption` (MSSQL `OPTION (...)`), `hintRaw` (documented escape hatch), `clearHints`.

# [12.0.0](https://github.com/deebee-tech/sqleasy/compare/v11.0.0...v12.0.0) (2026-07-18)


### Features

* **select:** add window functions — `selectWindow(fn, over, alias)` appends `fn OVER (...)` to
  the SELECT list; `fn` is the call expression, emitted verbatim like `selectRaw`. The `OVER`
  clause itself is structured via a new `WindowBuilder`: `partitionByColumn`/`partitionByColumns`/
  `partitionByRaw`, `orderByColumn`/`orderByRaw` (sharing `ORDER BY`'s `NULLS FIRST`/`LAST`
  support), and a `ROWS`/`RANGE` `frame`/`frameRaw`. Standard SQL, rendered identically across all
  four dialects.
* **cte/cteRecursive:** add an optional explicit column list — `WITH name (col1, col2) AS (...)`.
  Standard SQL, rendered identically on every dialect; only the `RECURSIVE` keyword itself differs
  on MSSQL, which keeps the column list regardless.
* **insert:** add `insertSelect()` — `INSERT ... SELECT`, sourcing rows from a sub-query builder
  instead of a literal `VALUES` list. Mutually exclusive with `insertValues`; combining the two
  throws a `ParserError` at parse time.
* **update/delete:** stop silently dropping `.joinTable(...)` on `UPDATE`/`DELETE` — it now emits
  real dialect SQL. MySQL/MSSQL get a native multi-table `JOIN ... ON`; Postgres translates the
  join's `ON` condition into a `WHERE` predicate (ANDed with any existing `.where()` calls) and
  renders `UPDATE ... FROM` / `DELETE ... USING` (only `INNER`/`CROSS` joins are supported there,
  since translating an `OUTER` join to `WHERE` would silently turn it into an `INNER` join — that
  case throws). SQLite has no multi-table `UPDATE`/`DELETE` syntax at all and throws a clear
  `ParserError` instead of emitting SQL it can't run.
* **join:** add richer `ON` predicates — `JoinOperator.Like`/`NotLike` (via the existing `on`/
  `onValue`), plus new `onIn`/`onNotIn`/`onBetween`/`onNotBetween` on `JoinOnBuilder`.
* **select:** add `distinctOn()`/`clearDistinctOn()` — Postgres' `DISTINCT ON (...)`. Every other
  dialect throws a `ParserError`, as does combining it with `distinct()`. `clearSelect()` clears it
  too.
* **orderBy:** add `NULLS FIRST`/`NULLS LAST` — a `nulls` parameter on `orderByColumn`/
  `orderByColumns` (and the window builder's `orderByColumn`). Native on Postgres/SQLite; emulated
  on MySQL/MSSQL with a leading `CASE WHEN col IS NULL THEN ... END` sort key, since neither
  dialect has the clause.
* **where/having:** add `WhereOperator.IsDistinctFrom`/`IsNotDistinctFrom` — null-safe
  (in)equality. Native on Postgres/SQLite; MySQL rewrites via its own null-safe `<=>` operator
  (`NOT (a <=> b)` / `a <=> b`); MSSQL has no equivalent (pre-2022 T-SQL) and throws a
  `ParserError`.

# [11.0.0](https://github.com/deebee-tech/sqleasy/compare/v10.0.0...v11.0.0) (2026-07-18)


### Features

* **call:** first-class stored procedures/functions — a new statement family, not a raw escape.
  `callProcedure()`/`callProcedureWithOwner()` and `callFunction()`/`callFunctionWithOwner()` start
  a call; `procParam()`/`procParamNamed()`/`procParamRaw()` add arguments, and `procParamOut()`/
  `procParamInOut()` add procedure-only output parameters; `clearCall()` removes it. Postgres emits
  `CALL name(...)` for procedures and `SELECT name(...)`/`SELECT * FROM name(...)` for functions
  (scalar vs. set-returning); MySQL emits `CALL name(...)` for procedures and `SELECT name(...)` for
  functions (it has no table-valued functions — `CallReturnIntent.ResultSet` throws there); MSSQL
  emits `EXEC name ...`, with `DECLARE`d local variables prepended for OUT/INOUT parameters. SQLite
  has no stored procedures or functions at all and throws a clear `ParserError`. Named arguments
  (Postgres `name := value`, MSSQL `@name = value`) are supported everywhere except MySQL, which has
  no named-argument syntax; a positional argument after a named one throws, matching the underlying
  SQL's own ordering rule. A call integrates with `parse()`/`parsePrepared()`/`parseRaw()` and
  `MultiBuilder` like any other statement, but refuses to be combined with a CTE or `returning()`.

# [10.0.0](https://github.com/deebee-tech/sqleasy/compare/v9.0.0...v10.0.0) (2026-07-18)


### Features

* **having:** full parity with WHERE — `havingBetween`, `havingInValues`/`havingInWithBuilder`,
  `havingNotInValues`/`havingNotInWithBuilder`, `havingNull`/`havingNotNull`, `havingExists`/
  `havingNotExists`, and `havingGroup`, sharing WHERE's combinator/spacing rules term for term.
* **where/having:** add `WhereOperator.Ilike`/`NotIlike` — case-insensitive LIKE. Postgres emits
  native `ILIKE`/`NOT ILIKE`; MySQL, SQLite, and MSSQL (none of which have `ILIKE`) get an
  equivalent `LOWER(col) LIKE LOWER(?)` rewrite.
* **where:** add `whereExists`/`whereNotExists` — a cleaner EXISTS API without the unused
  table/column parameters `whereExistsWithBuilder`/`whereNotExistsWithBuilder` never use. Both
  forms render identically and remain available for wire parity with the golden corpus.
* **insert/update/delete:** add `returning()`/`returningRaw()`/`clearReturning()`. Postgres/SQLite
  emit a trailing `RETURNING`; MSSQL emits an inline `OUTPUT INSERTED.…`/`OUTPUT DELETED.…`. MySQL
  has no equivalent and throws a `ParserError` rather than silently dropping the requested columns.
* **insert:** add an upsert conflict clause — `onConflictDoNothing()`, `onConflictDoUpdate()`,
  `onConflictDoUpdateRaw()`, `clearUpsert()`. Postgres/SQLite emit `ON CONFLICT (...) DO NOTHING`/
  `DO UPDATE SET ...`; MySQL emits `INSERT IGNORE`/`ON DUPLICATE KEY UPDATE` instead. MSSQL upsert
  (`MERGE`) is deferred to a future release and throws a clear unsupported-feature error.
* **select:** add row locks — `forUpdate()`/`forShare()`, plus `Nowait`/`SkipLocked` wait variants,
  and `clearRowLock()`. Postgres/MySQL append a trailing `FOR UPDATE`/`FOR SHARE`; MSSQL has no such
  clause and gets an equivalent `WITH (UPDLOCK, ROWLOCK)`/`WITH (HOLDLOCK, ROWLOCK)` table hint on
  every base table instead. SQLite has no row-level locking and throws a `ParserError`.

# [9.0.0](https://github.com/deebee-tech/sqleasy/compare/v8.0.0...v9.0.0) (2026-07-18)


### Bug Fixes

* fix!: auto-AND consecutive WHERE/JOIN ON predicates; fix clearUpdate/clearDelete;
  mutation targets; empty whereGroup; limit validation; defensive list copies


### BREAKING CHANGES

* Consecutive `.where().where()` / JOIN `.on().on()` without `.and()`/`.or()`
  now emit `AND` (matching HAVING). Empty `whereGroup` throws. `limit(0)` and
  negative limits throw. `clearUpdate` removes the UPDATE-owned FROM target;
  new `clearDelete` clears sticky DELETE. UPDATE/DELETE prefer the
  `updateTable`/`deleteFrom` target over a prior `fromTable`.

# [8.0.0](https://github.com/deebee-tech/sqleasy/compare/v7.0.0...v8.0.0) (2026-07-18)


* fix!: correct dialect SQL emit, HAVING combinators, and MySQL guards ([ac27d32](https://github.com/deebee-tech/sqleasy/commit/ac27d32c8609475a3864aff449298035f9f24a5d))


### BREAKING CHANGES

* emitted SQL and some error paths change for recursive
CTEs, HAVING chains, MySQL owners/FULL OUTER, Equals+null, and OrderBy
None; clearSelect now clears distinct; new clear* helpers and ParserArea
values are part of the public surface.

Co-authored-by: Cursor <cursoragent@cursor.com>

# [7.0.0](https://github.com/deebee-tech/sqleasy/compare/v6.0.1...v7.0.0) (2026-07-16)


* refactor!: remove the automatic row cap; emit the query that was asked for ([5e94dd3](https://github.com/deebee-tech/sqleasy/commit/5e94dd38255136be5bc997f3cab001effd9b2dfe))


### BREAKING CHANGES

* `RuntimeConfiguration.maxRowsReturned` is removed; setting it is
now a type error. Queries that relied on the implicit cap return every matching
row — replace it with an explicit `.limit()` at the call site. MSSQL no longer
emits `TOP (1000)` on an unbounded SELECT, MSSQL `.offset()` without a `.limit()`
no longer appends `FETCH NEXT 1000 ROWS ONLY`, and Postgres/MySQL/SQLite
`.offset()` without a `.limit()` no longer emit `LIMIT 1000`.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>

## [6.0.1](https://github.com/deebee-tech/sqleasy/compare/v6.0.0...v6.0.1) (2026-07-16)


### Bug Fixes

* **docs:** document top(), and ship the pagination note to npm ([137bb3c](https://github.com/deebee-tech/sqleasy/commit/137bb3c9ea9577215fbd73c4a7b79aa7e1add79d))

# [6.0.0](https://github.com/deebee-tech/sqleasy/compare/v5.0.0...v6.0.0) (2026-07-16)


### Bug Fixes

* **parser:** stop emitting invalid pagination SQL on mssql, mysql and sqlite ([897989d](https://github.com/deebee-tech/sqleasy/commit/897989d0b2c9a6c9f8ae175eb80fbcc00b481149))


### BREAKING CHANGES

* **parser:** MSSQL `.limit(n)` without an ORDER BY now throws instead of
emitting SQL that SQL Server rejected. MSSQL `.offset()` on an unfiltered query
emits `FETCH NEXT (maxRowsReturned)` where it emitted a `TOP`, and MySQL/SQLite
`.offset()` without a `.limit()` now emit a sentinel LIMIT. Every changed string
was a statement no engine would run.

# [5.0.0](https://github.com/deebee-tech/sqleasy/compare/v4.0.1...v5.0.0) (2026-07-16)


### Bug Fixes

* render release notes again, and restore the history they swallowed ([c4db847](https://github.com/deebee-tech/sqleasy/commit/c4db84762b9a905a4e0985358ec8be65fd2fcaa4))
* resolve CJS types per lane so node16 consumers stop hitting TS1479 ([3ae4a21](https://github.com/deebee-tech/sqleasy/commit/3ae4a21ead7ef774de477360b3295656cda9dc58))


### BREAKING CHANGES

**There are none.** 5.0.0 is 4.0.1 plus the two bug fixes above — upgrade from any 4.x with no
changes.

This section is an accident, and it stays here rather than being quietly deleted, because the
version number cannot be taken back. The first commit above carried the sentence _"that removes the
BREAKING CHANGE footer"_ — describing the very mechanism it was fixing. The commit-analyzer does not
read English: it saw a line opening with those two words, took the rest of the sentence as the
footer's body, and cut a major. A commit message *about* a breaking-change footer became one.

The fix it describes is real and is working — this is the first entry since 2.0.0 to render its Bug
Fixes at all, which is exactly the bug it set out to repair.

## [4.0.1](https://github.com/deebee-tech/sqleasy/compare/v4.0.0...v4.0.1) (2026-07-15)

### Bug Fixes

- load Node types so Buffer resolves in tests ([700863d](https://github.com/deebee-tech/sqleasy/commit/700863dc9b053ea350f44b42dc30052250bb9a50))

## [4.0.0](https://github.com/deebee-tech/sqleasy/compare/v3.0.0...v4.0.0) (2026-07-15)

### ⚠ BREAKING CHANGES

- **`Datatype` and `JoinOnBuilder.newJoinOnBuilder` are no longer exported.** Neither participated in SQL generation — `getValueStringFromDataType` switches on `typeof`, and a `JoinOnBuilder` is obtained through the `joinTable`/`joinWithBuilder` callbacks. A `Datatype` consumer can inline the five string literals. Generated SQL is unchanged.

### Features

- add MultiBuilder.preparedStatements() for batch execution ([40fc797](https://github.com/deebee-tech/sqleasy/commit/40fc7974fca1eeaae56283c6ddf03fb8062fa04d)). `parse()`/`parseRaw()` render a batch as one display string with no bound params, and placeholder numbering restarts per statement — so that string was never a runnable parameterized call on Postgres/MySQL/SQLite. `preparedStatements()` returns each builder's `{ sql, params }` in batch order. Transaction delimiters are excluded by design; consult `transactionState()` to decide whether to wrap them.

### Bug Fixes

- **ci:** add misalign and varbinary to the spell dictionary ([afc3f4c](https://github.com/deebee-tech/sqleasy/commit/afc3f4c5d7c026c45d9de112c4527267e7117298))

## [3.0.0](https://github.com/deebee-tech/sqleasy/compare/v2.0.1...v3.0.0) (2026-07-14)

### ⚠ BREAKING CHANGES

Several inputs that previously produced silently-wrong SQL are now refused at the call that causes them. Each one was already broken — it just failed at the database, or worse, did not:

- **Values with no SQL literal now throw.** `NaN`/`Infinity` rendered as the bare words `NaN`/`Infinity` when inlined, and passed straight through into the bound params otherwise.
- **An empty `IN`/`NOT IN` list now throws.** It previously emitted `IN ()`, a syntax error in every dialect.
- **NUL bytes are refused everywhere caller text enters the SQL** (identifiers and raw fragments). The clause walk now delimits placeholders with a NUL-delimited token, so permitting NUL would let a raw fragment forge one.
- **`Dialect.stringDelimiter` is removed.** It was declared and set by all four dialects but never read, and implied a string-escaping step that does not exist — `parseRaw()` inlines values unquoted and unescaped by design.
- **`SqlHelper`'s constructor no longer takes a `Dialect`** (it is now dialect-agnostic), and it is no longer exported from the package root.

Emitted SQL also changes for cases that were previously wrong, so pinned snapshots may need regenerating:

- T-SQL `tinyint` is UNSIGNED 0–255, but any integer in [-128, 127] was declared `tinyint` — SQL Server raised an arithmetic-overflow error on every negative bound value. 
- `Number.isInteger(1e21)` is true, so values past 2^53 were declared `bigint` yet rendered as `1e+21`, which is not a legal bigint literal. They are now declared `float`.
- Join-ON condition spacing now matches WHERE: no separator immediately before a `)`.

### Bug Fixes

- bind placeholders by token, and reject values with no SQL literal ([ab6656a](https://github.com/deebee-tech/sqleasy/commit/ab6656a93122ff6dcd82d29a18428f108f6e39a0)). Locating placeholders by scanning rendered SQL for a bare `?`/`$` could not tell a real placeholder from the same character inside a caller-supplied raw fragment, and rewrote whichever came first — corrupting the caller's SQL *and* misaligning the bound parameters. `selectRaw("'why?' AS q")` on MSSQL emitted `''why@p0''` and left the true placeholder dangling; `selectRaw("'$100' AS p")` on Postgres shifted the real placeholder to `$2` with one value bound, so the statement was rejected outright. Placeholders are now emitted as a NUL-delimited token and substituted exactly once at the top-level parse.

### Features

- **goldens:** add the cross-language golden corpus, and fix three bugs it exposed ([affe803](https://github.com/deebee-tech/sqleasy/commit/affe803d4543117502720c1d472fe500ddba0c58)). `goldens/corpus.json` is the contract the Dart port is held to: 189 cases replayed against all four dialects (737 expectations). Writing it exposed three silent bugs, all reachable from the public API:
  - `JoinOnBuilder.onGroup` populated a child builder and then discarded it. Every condition inside a join-ON group vanished — the join rendered `... AND ()` — and any `onValue` inside it was never bound, so the JOIN quietly matched on the wrong predicate and returned the wrong rows.
  - HAVING dropped `LIKE` and `NOT LIKE`. The operator silently disappeared (`HAVING "x"."y"  $1`) while the value was still bound, producing an invalid statement. The identical predicate in WHERE worked.
  - `MultiBuilder.reorderBuilders` pushed the same builder twice when a name was repeated, so a batched INSERT was emitted — and would execute — twice.

## [2.0.1](https://github.com/deebee-tech/sqleasy/compare/v2.0.0...v2.0.1) (2026-07-14)

### Bug Fixes

- **build:** republish the artifact with the refreshed toolchain ([3a5a998](https://github.com/deebee-tech/sqleasy/commit/3a5a9989eb9a3d2ac993cf6d6ec158965018e1e7))

## [2.0.0](https://github.com/deebee-tech/sqleasy/compare/v1.0.2...v2.0.0) (2026-07-14)

### ⚠ BREAKING CHANGES

* dialect entry classes are renamed -- PostgresSqlEasy -> PostgresQuery,
MssqlSqlEasy -> MssqlQuery, MysqlSqlEasy -> MysqlQuery, SqliteSqlEasy -> SqliteQuery. The
I* interfaces (ISqlEasy, IBuilder, IJoinOnBuilder, IMultiBuilder) are removed; use the
concrete QueryBuilder, MultiBuilder and JoinOnBuilder types instead. MSSQL aliased DELETE
and UPDATE now emit valid T-SQL (DELETE [u] FROM ... / UPDATE [u] SET ... FROM ...), where
1.x emitted invalid syntax. Retained: multi_builder, Datatype, all four dialects, dual
ESM/CJS output, and JSR publishing. See "Migrating from 1.x" in the README.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>

### Features

* consolidate DeeBee's refactored query engine as SQLEasy 2.0 ([100b1fc](https://github.com/deebee-tech/sqleasy/commit/100b1fcd4387cc7e1901b7606483f6deade064ec))

## [1.0.2](https://github.com/deebee-tech/sqleasy/compare/v1.0.1...v1.0.2) (2026-03-31)

### Bug Fixes

- **repo:** Adding documentation ([ec258ed](https://github.com/deebee-tech/sqleasy/commit/ec258edabf0d2dc84c7cbf31449afbd34627f994))

## [1.0.1](https://github.com/deebee-tech/sqleasy/compare/v1.0.0...v1.0.1) (2026-03-30)

### Bug Fixes

- **repo:** Fix for building releases in github ([f6e169b](https://github.com/deebee-tech/sqleasy/commit/f6e169b7af4b2f9688102d00e3ae059bc4073245))
- **repo:** Fix for building releases in github part 2 ([8af7949](https://github.com/deebee-tech/sqleasy/commit/8af794959f50a4474ccda303ac76aa6ff8d43023))
- **repo:** Fix for building releases in github part 3 ([4e1c3fa](https://github.com/deebee-tech/sqleasy/commit/4e1c3fa46f51a49c344ddf7ed8b483c5d1422b90))
- **repo:** Fix for major releases in change commits. ([ea9e659](https://github.com/deebee-tech/sqleasy/commit/ea9e65986d44bdbdbe5ec4d39e3b4d20e9a9e314))

# 1.0.0 (2026-03-30)

### Bug Fixes

- **repo:** Fix for formatting ([6c5f2f6](https://github.com/deebee-tech/sqleasy/commit/6c5f2f660e0180ce9a4d2e88eb1c658ab7e3a444))
- **repo:** Workflow updates ([9295140](https://github.com/deebee-tech/sqleasy/commit/9295140e6edcad7407f6a77f0f52bb95b8f3bd08))
