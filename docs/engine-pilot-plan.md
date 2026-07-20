# Phase 5 — the Dart engine pilot

**Status:** kicked off 2026-07-20. The query-builder capability sweep is complete; this is the next
frontier. It is the monorepo plan's **GO/NO-GO gate**: the Dart engine pilot decides whether full
four-dialect execution is viable before Python/C#/Go follow.

## What the engine is, and why it is harder than the query builder

`sqleasy-engine` is **I/O**, not pure. Where the query builder is `op-list → SQL string` (a pure
function the corpus pins with one golden set, corpus A), the engine _runs_ `{sql, params}` against a
real database, normalizes the rows that come back, and introspects schemas. So its contract splits
into three more golden sets, of increasing environmental cost:

| corpus                | input                 | golden                                               | needs                         |
| --------------------- | --------------------- | ---------------------------------------------------- | ----------------------------- |
| **A · emission**      | builder op-list       | `{prepared, raw}` \| `{throws}` per dialect          | pure — **exists** (323 cases) |
| **B · binding**       | `{sql, params}`       | the ordered `(sql, args)` the driver is asked to run | mock driver — **no DB**       |
| **C · normalization** | seed DDL+data + query | canonical `{columns, rows, rowCount}` per dialect    | real DBs (docker)             |
| **D · introspection** | seed schema           | canonical schema shape per dialect                   | real DBs (docker)             |

C and D are the ones that matter most and are hardest: the 2026-07-19 audit found the engine
performs **no result-row normalization at all**, so the same logical value comes back four different
ways (MySQL rounds BIGINT, MSSQL returned DECIMAL as a lossy float — the last already fixed in the
sweep, `e672c00`). Corpus C is where "byte-for-byte parity is the product" actually gets enforced.

## The GO/NO-GO question — ANSWERED 2026-07-20: **GO WITH CAVEATS**

A driver-landscape research pass (cited below) settled the gate: a server-side Dart VM program CAN
execute parameterized SQL against all four databases. Three are clean; MSSQL is the caveat.

| database      | package                        | type                      | params / tx / pool | verdict                                                  |
| ------------- | ------------------------------ | ------------------------- | ------------------ | -------------------------------------------------------- |
| PostgreSQL    | `postgres` 3.5.12              | pure Dart (wire protocol) | ✅ / ✅ / ✅       | mature                                                   |
| MySQL/MariaDB | `mysql_client_plus` 0.1.3      | pure Dart                 | ✅ / ✅ / ✅       | usable — young fork; the old `mysql_client` is abandoned |
| SQLite        | `sqlite3` 3.5.0 (drift author) | FFI, bundled              | ✅ / ✅ / n/a      | mature                                                   |
| **MSSQL**     | **`dart_odbc` 6.2.0**          | **FFI over ODBC**         | ✅ / ✅ / manual   | **usable-with-caveats — see below**                      |

**There is no native pure-Dart TDS driver for SQL Server** — nothing like Node's `tedious`. The only
server-viable path is `dart_odbc`, which binds the host's ODBC driver manager (**unixODBC + Microsoft
ODBC Driver 18** on Linux/macOS). So MSSQL support ships with a per-host native dependency and more
hand-rolled pooling/introspection than the other three. `mssql_connection` is Flutter-only (rejected);
`dart_mssql` is dead (6 years, Dart-2, Windows-only).

Two facts make the caveat manageable: (1) **the FFI boundary is already crossed** — `sqlite3` is FFI
regardless, so ODBC is the same _class_ of dependency, not a new one; (2) **introspection is
hand-rolled for all four anyway** (`information_schema` / `pg_catalog` / `PRAGMA` / `sys.*`), so MSSQL
is not an outlier there.

**The one open MSSQL decision, deferrable:** accept `dart_odbc` + an ODBC host dependency as the
MSSQL deployment contract, OR route MSSQL through a small sidecar over the `{sql, params}` contract in
a language with a native driver (C#/Go/Node). This does NOT block the pilot — MSSQL is the last leg
built, and Postgres/MySQL/SQLite are unambiguous GO. Resolve it when the MSSQL leg is reached.

## Reassessment after the gate: corpus B is THIN — the real value is behind the docker gate

Working the design through, corpus B pins less than it first appears. The engine "runs SQL verbatim
and does not rewrite dialects," so for a single `run` the driver call is essentially the identity of
`{sql, params}`. B's only real content is the transaction case: **the N statements are passed
separately and in order, never concatenated** (concatenation misbinds — placeholder numbering resets
per statement). That is one genuine property, not a rich contract.

So building a uniform mock-driver-×4 harness to mint B is high effort for low yield. **The real
enforcement — the reason "byte-for-byte parity is the product" — is corpus C (normalization), and C
needs real databases.** That is the docker gate. B is worth at most a handful of transaction-ordering
cases, not a large harness; do not over-invest in it.

## Sources (driver research, 2026-07-20)

`postgres` https://pub.dev/packages/postgres · `mysql_client_plus` https://pub.dev/packages/mysql_client_plus
· `sqlite3` https://pub.dev/packages/sqlite3 · `dart_odbc` https://pub.dev/packages/dart_odbc ·
`mssql_connection` (Flutter-only) https://pub.dev/packages/mssql_connection

## Why corpus B pins so little (the reasoning behind the reassessment above)

Corpus B is "pure, no DB," which made it look like the natural first build. But its shape collides
with a stated non-goal. The design's **do-not-conform** list includes _transaction mechanics_:
"BEGIN/COMMIT vs `batch('write')` — only all-or-nothing + ordered results are contract." libSQL runs
a transaction as a `batch`; the others wrap statements in `BEGIN … COMMIT`. So B **cannot** pin the
literal BEGIN/COMMIT calls without conforming exactly the mechanics the design leaves idiomatic — it
can only pin the ordered `(sql, args)` _payload_, not the wrapper. And since the engine runs SQL
verbatim, that payload is nearly the identity of the input. Hence: thin.

## Sequence (revised after the gate)

The gate is answered (GO with caveats) and corpus B is thin, so the runway to the docker gate is
short. Remaining, in order:

1. **Corpus B — minimal.** A handful of transaction-ordering cases pinning "statements passed
   separately, in order," NOT a full mock-driver harness. Pure, no docker. Skippable if judged not
   worth even that.
2. **`dart/engine` scaffold** — package, ported `DbExecutor` interface, CI wiring (mirror the
   `dart/query` turbo-shim + pubspec pattern). Add the Postgres/MySQL/SQLite driver deps now; defer
   the MSSQL leg and its `dart_odbc`-vs-sidecar decision.
3. **THE DOCKER GATE.** Corpora C and D need real database containers
   (`docker-compose.harness.yml` already exists). **Pause and check in with Sandy before standing up
   databases** — heavier environmental step, the plan's real milestone, and where the actual
   result-parity value lives.
4. Corpus C (normalization) and D (introspection), minted against live DBs, replayed by both engines.
5. The MSSQL leg (last), once its deployment decision is made.

## Provenance

- Contract corpus schema (A): `contract/schema/corpus.ts`; corpus doc: `contract/README.md`.
- Capability rewrite that precedes this: `docs/capability-manifest-design.md`, and the sweep commits
  `ac9aeb4 … bd5b444`.
- Parity audit (names the engine normalization gap): `docs/audits/dialect-parity-2026-07-19.md`.
