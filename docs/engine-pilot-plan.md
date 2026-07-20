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

## The GO/NO-GO question (being researched 2026-07-20)

Before any code, the gate: **can a server-side Dart VM program execute parameterized SQL against all
four databases with mature-enough drivers?** SQLite/libSQL, Postgres and MySQL almost certainly yes.
**MSSQL is the doubt** — native Dart T-SQL/TDS support is the thing most likely to be missing, and if
it is, the fallback options (ODBC-via-FFI, a sidecar, a proxy) each have real costs. A driver-landscape
research pass is running; its result feeds the recommendation below.

**Do not scaffold `dart/engine` until this is answered.** A package skeleton is cheap, but its shape
(pure Dart vs FFI, which driver packages, whether MSSQL is in or out) depends entirely on the gate.

## An open DESIGN question on corpus B (resolve before minting)

Corpus B is "pure, no DB," which makes it the natural first build — but its exact shape is a real
decision, not a mechanical one, because it collides with a stated non-goal.

The design's **do-not-conform** list includes _transaction mechanics_: "BEGIN/COMMIT vs
`batch('write')` — only all-or-nothing + ordered results are contract." libSQL runs a transaction as
a `batch`; the others wrap statements in `BEGIN … COMMIT`. So corpus B **cannot** pin the literal
BEGIN/COMMIT calls without conforming exactly the mechanics the design says to leave idiomatic.

So what does B pin? The defensible answer: **the ordered sequence of `(sql, args)` statements the
engine hands to the driver — the payload, not the wrapper.** That still catches the bugs B exists to
catch:

- statements are passed _separately_, never concatenated (the plan notes concatenation misbinds:
  placeholder numbering restarts per statement);
- `args` arrive in the right order and unmangled;
- the engine runs SQL verbatim and does not rewrite dialects between `{sql,params}` and the call.

It deliberately does **not** pin `BEGIN`/`COMMIT`/`batch`. Whether that makes B strong enough to be
worth its harness cost is the open question — B may turn out to be a thin contract, in which case the
effort is better spent going straight to C. Decide this before building the mint.

## The mint needs a uniform mock driver, which does not exist yet

Corpus B is minted by running each dialect's executor against a **mock driver that records calls**.
Today that recording is uneven: `mysql.test.ts` and `mssql.test.ts` have call recorders;
`postgres`/`sqlite` do not (SQLite even runs against real in-memory libSQL). A uniform record-only
mock across all four drivers is the first build task for B.

## Sequence

1. **Resolve the GO/NO-GO gate** (research in flight). If NO-GO on MSSQL, the whole shape changes —
   surface to Sandy before proceeding.
2. **Resolve the corpus-B-shape question** above. Cheap, and it gates the harness.
3. **Uniform mock driver** in `ts/engine`, record-only, across all four dialects.
4. **Corpus B schema + mint + a first slice of cases.** Pure, no docker.
5. **`dart/engine` scaffold** — package, ported `DbExecutor` interface, CI wiring (mirror the
   `dart/query` turbo-shim + pubspec pattern). Shape determined by step 1.
6. **Dart binding replay** — the Dart engine conforms to corpus B. First real cross-language engine
   parity.
7. **THE DOCKER GATE.** Corpora C and D need real database containers
   (`docker-compose.harness.yml` already exists). Pause and check in with Sandy before standing up
   databases — it is a heavier environmental step and the plan's real milestone.
8. Corpus C (normalization) and D (introspection), minted against live DBs, replayed by both engines.

## Provenance

- Contract corpus schema (A): `contract/schema/corpus.ts`; corpus doc: `contract/README.md`.
- Capability rewrite that precedes this: `docs/capability-manifest-design.md`, and the sweep commits
  `ac9aeb4 … bd5b444`.
- Parity audit (names the engine normalization gap): `docs/audits/dialect-parity-2026-07-19.md`.
