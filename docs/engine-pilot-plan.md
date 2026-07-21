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

**RESOLVED 2026-07-21 — the Dart engine ships with NO MSSQL leg, and says so in its types.**

Sandy's ruling, once corpora C and D were both green on three legs: leave it absent rather than take
on an ODBC host dependency or a sidecar crutch nobody would want to ship. The consequences are
deliberate and already implemented:

- `IntrospectDialect` has **no `mssql` value**. Not a value that throws — no value at all, so calling
  code cannot even name the thing the port cannot do. That is the founding rule applied to a reader
  instead of a builder method.
- `dart/query` still **emits** MSSQL SQL, with the full typed `MssqlView`. Building a statement and
  executing it are different capabilities and only the second one is missing.
- The dialect is never unverified: the TypeScript engine replays corpora C and D against **all four**
  databases, MSSQL included, and both ports read the same corpus files. A divergence between the
  ports on the three shared legs still fails loudly.
- The Dart conformance suites assert their own dialect set, so "Dart does not execute MSSQL" is a
  written-down fact that a future change has to consciously edit, not a silence.

Revisit when a Dart consumer actually needs to reach SQL Server. The options that were on the table
were: `dart_odbc` + an ODBC host dependency (unixODBC + Microsoft ODBC Driver 18) as the deployment
contract; a sidecar over the `{sql, params}` contract in a language with a native driver; or writing
a pure-Dart TDS driver. `dart_odbc` remains the realistic answer of the three.

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

## Sequence (revised after the gate) — COMPLETE as of 2026-07-21

1. ~~**Corpus B — minimal.**~~ Dropped on the reassessment above: the engine runs SQL verbatim, so B's
   golden is nearly the identity of its input. Its one real assertion — statements passed separately
   and in order — is covered by the executors' own transaction tests.
2. ~~**`dart/engine` scaffold**~~ — done. Postgres, MySQL and SQLite legs all execute.
3. ~~**THE DOCKER GATE**~~ — passed 2026-07-20 on Sandy's go-ahead. Three containers, four seed
   renderings of one logical schema.
4. ~~**Corpus C (normalization) and D (introspection)**~~ — both minted and replayed by BOTH ports.
   Each caught a real defect on its first cross-port run: C found Dart turning a stored `5` into
   `true` (MySQL reports `BOOLEAN` and `TINYINT(1)` identically), D found Dart comparing a `Uint8List`
   to `'YES'` and silently reporting no nullable columns and no primary keys.
5. ~~**The MSSQL leg**~~ — resolved by NOT building it; see the ruling above.

The engine is at its intended scope. The next move belongs to DeeBee, not to this repo.

## Provenance

- Contract corpus schema (A): `contract/schema/corpus.ts`; corpus doc: `contract/README.md`.
- Capability rewrite that precedes this: `docs/capability-manifest-design.md`, and the sweep commits
  `ac9aeb4 … bd5b444`.
- Parity audit (names the engine normalization gap): `docs/audits/dialect-parity-2026-07-19.md`.
