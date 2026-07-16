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
