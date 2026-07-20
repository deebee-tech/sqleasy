# SQLEasy → polyglot, contract-first monorepo

## STATUS (updated 2026-07-19 evening)

Executed autonomously in the git worktree
`/Users/sandy/Github/sqleasy/.claude/worktrees/monorepo-migration`, branch
`worktree-monorepo-migration`. **Nothing pushed, nothing published, nothing archived.**

| phase                    | status                                                                                                                      |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| 1 · Skeleton             | ✅ done                                                                                                                     |
| 2 · TS query + engine in | ✅ done                                                                                                                     |
| 3 · Contract extracted   | ✅ done                                                                                                                     |
| Dialect parity audit     | ✅ done — findings are significant, see `docs/audits/dialect-parity-2026-07-19.md`                                          |
| 4 · Dart query port in   | ✅ done — fetch/pin/vendor dance deleted                                                                                    |
| CI overhaul              | ✅ done — three gates, per-package release workflows                                                                        |
| 5 · Dart ENGINE pilot    | ⬜ **not started** — genuinely multi-day (a full DB executor for 4 dialects + minting corpora B/C/D against live databases) |
| 6 · Python / C# / Go     | ⬜ not started — gated on phase 5                                                                                           |

Verified green: 10/10 turbo tasks; ts/query 2230 tests; ts/engine 91 passed +13 skipped;
Dart 1441 on the VM **and** 1441 under dart2js; all three guardrails pass.

**Deviations from this plan, deliberate:**

1. `git subtree` instead of `git filter-repo` (not installed; installing tooling unattended isn't
   mine to do) and `git mv` for sqleasy's own contents — so **no history rewrite and no force-push**.
2. Historical tags not imported — sqleasy's `v1..v10` collide with the engine's and Dart's.
3. No release cut. Phase 2's "prove the plumbing with a real patch release" is outward-facing and
   needs a human.

**Needs Sandy:** the Part 6 emulation-policy question, and triage of the audit's P0 list — every fix
there changes emitted SQL → changes the corpus → obliges every port to follow.

## Context

SQLEasy is beating knex for DeeBee's needs — complex SQL without dropping to `.raw()` — and Sandy
has been asked whether it can serve the org's other stacks, whose main monorepo spans **TypeScript,
Python, Dart/Flutter, C#, and Go**. Two SQLEasy packages are in play, and **both are to be ported to
all five languages** with **full cross-language conformance** (Sandy: "if it's not possible, fine —
but we'd like to try"):

- **query builder** (`@deebeetech/sqleasy`, TS) — _pure_: op-list in → dialect SQL string out.
- **execution engine** (`@deebeetech/sqleasy-engine`, TS) — _I/O_: runs `{sql, params}` on real
  drivers, normalizes result rows, and introspects schemas.

Today these are three separate repos (`sqleasy`, `sqleasy-engine`, `sqleasy-dart`) plus `deebee`
(the private product monorepo that consumes them). The pain is the **cross-repo, cross-language
dance**: change SQL in TS → `pnpm goldens` re-mints the corpus → release TS → the Dart port goes red
until it bumps a pinned version, re-fetches over HTTP-from-a-git-tag, re-embeds, and follows. Sandy
is **not wedded to a monorepo — she is wedded to better management** of two packages across five
languages, and explicitly asked for the best structure rather than a foregone one. **Pilot language
for the engine port: Dart.**

## The decision: one polyglot, contract-first monorepo

A single turborepo (turbo + pnpm as the JS backbone; Dart/Python/C#/Go run as turbo tasks over their
own native toolchains) housing **both packages across all five languages**, with the golden corpus
extracted into a **first-class, independently-versioned `contract` package** that every language
reads as a **local file**.

### Why a monorepo, and why the full-conformance choice is what decides it

Where the _languages_ live is nearly a wash; **where the contract lives and how it propagates is the
whole game** — and choosing full-conformance engine porting tips it decisively toward co-location:

1. **The engine corpus drags a real-DB harness behind it.** The query corpus is pure and distributes
   for free; the engine's normalization/introspection corpora need docker-compose + pinned DB images
   - seed DDL. In separate repos that environment is duplicated five times and drifts. In a monorepo
     it is **defined once** and every language's conformance job consumes it.
2. **The product _is_ byte-for-byte parity, and the new parity bugs are silent data corruption** (a
   `bigint` returning as a float in Go but a string in TS). Only a monorepo guarantees the family is
   internally consistent on _every commit_ — one PR changes emission, regenerates the corpora,
   updates every port, and one CI gate proves parity. Separate repos give only _eventual_ consistency.
3. **The "native repo per language" concern has softened.** It drove the original separate-repo Dart
   decision (pub.dev newness). Dart has shipped; the package _page_ (README/docs/examples) is what
   devs see, not the repo layout. Mitigate the repo-link wart later with `repository.directory`
   metadata or read-only subtree mirrors **only if** adoption data ever demands it — not speculatively.

Two facts make this cheaper than it looks: `sqleasy-engine` has **zero dependency** on `sqleasy`
(decoupled by the structural `{sql, params}` type), so merging the TS packages is low-risk; and
`deebee` already demonstrates the exact turborepo patterns to reuse (single `catalog:`, `workspace:*`,
source-consumption + `tsdown`-for-publish, `configs/*` shared tooling, `scripts/check-*.mjs`
guardrails) — though it publishes nothing, so the release machinery comes from the sqleasy repos.

**The linchpin rule (keep inviolable):** every port depends on the **contract**, never on the TS
reference implementation — the same decoupling the engine already uses. This is what makes "a
TS-only change doesn't rerun Go, but a corpus change reruns everyone" fall out of the turbo graph
automatically.

## Engine conformance = four corpora, not one

The query builder is pure; the engine is I/O, so the contract splits into **four** golden sets of
increasing difficulty, plus a bounded "do-not-conform" list:

| Corpus                | Input                 | Golden output                                            | Minted by                   | Needs                          |
| --------------------- | --------------------- | -------------------------------------------------------- | --------------------------- | ------------------------------ |
| **A · Emission**      | builder op-list       | `{prepared:{sql,params}, raw}` \| `{throws}` per dialect | TS builder (`pnpm goldens`) | pure (exists today, 314 cases) |
| **B · Binding**       | `{sql, params}`       | ordered driver `calls[]` of `(sql, args)` per dialect    | TS engine + **mock** driver | pure (no DB)                   |
| **C · Normalization** | seed DDL+data + query | `{columns, rows, rowCount}` of canonical values          | TS engine + **real** DBs    | pinned containers              |
| **D · Introspection** | seed schema           | canonical schema shape per dialect                       | TS engine + **real** DBs    | pinned containers              |

**Do NOT conform (stays idiomatic per language):** connection pooling, transaction _mechanics_
(BEGIN/COMMIT vs `batch('write')` — only all-or-nothing + ordered results are contract), connection
lifecycle, placeholder-rewriting internals, `EXPLAIN` cost/plan text (advisory only — at most an
`ExplainEstimate` _shape_ + a `fullScan` boolean), async model, and error types/messages (except
emission's `throws` substring). Conform the _result_, never the _knobs_.

**Pilot:** Dart, full conformance (A–D), as the go/no-go gate before Python/C#/Go. Dart is the
harshest first test (dart2js int-is-double; no file-read at test time) — a feature. **Note:** the
`dart test -p chrome` (dart2js/web) requirement is a **query/emission-side** rule; the **engine** port
is server-side (`dart:io` DB drivers) and runs **VM-only** — don't mis-apply the web gate to it.

## Dialect feature-parity audit (query + engine, all four dialects)

**Why (Sandy's concern, 2026-07-19):** the agents building out SQLEasy have skewed toward **MSSQL and
Postgres** (the dialects Sandy works in daily), so **MySQL and SQLite are the likely-neglected
columns**. This must be leveled _before_ anything is propagated into five languages — otherwise a gap
in one dialect is faithfully replicated across TS/Dart/Python/C#/Go and becomes 5× as expensive to
fix. The audit answers two questions, on **both** the query (emission) and engine
(binding/normalization/introspection) sides:

1. **Missing basic features** — is any dialect missing a capability it actually supports?
2. **"One dialect, should be all"** — was a feature implemented for MSSQL/PG but skipped for
   MySQL/SQLite even though those dialects support it (often via different syntax)?

**Method — a coverage matrix + triage.** Enumerate the op/feature vocabulary (machine-enumerable once
extracted to `contract/vocabulary/builder-ops.json`; until then, from the dialect emitters and
`driver.ts`'s switch). Build a **feature × {mssql, mysql, postgres, sqlite}** matrix for each of the
four corpora. Each cell is exactly one of:

- **✅ conformed** — implemented _and_ has ≥1 corpus case (`expect.<dialect>` prepared+raw, or a real
  normalized result).
- **⛔ documented-throw** — the dialect genuinely can't do it, and a `{throws}` corpus case proves the
  library rejects it cleanly (a _correct_ absence, not a gap).
- **❌ gap** — neither implementation nor documented-throw. **This is the bug class to close.**

Every ❌ is triaged against a **dialect-capability reference** (what PG/MySQL/MSSQL/SQLite each support,
by version) into _real omission → fix_ or _legitimately unsupported → convert to a documented-throw
case_. The triaged report (gap → verdict → owner action) is the deliverable.

**Detection signals to sweep (cheap, high-signal):**

- Corpus cases whose `dialects?` narrows to a subset that **excludes mysql/sqlite** — each is a
  question: can't-do-it (should be a `throws` for the excluded dialects) or nobody-did-it (gap)?
- Emitter code paths branched on dialect where the mysql/sqlite arm falls through, no-ops, or silently
  drops a clause (joins dropped on UPDATE/DELETE, `RETURNING`/frame/`NULLS`-ordering skipped, etc.).
- Engine executors/introspectors present for pg/mssql but thin for mysql/sqlite (missing `explain`
  normalization, FK edges in introspection, or a dialect's native types absent from the type map).

**Basic-feature checklist to verify per dialect explicitly:** LIMIT/OFFSET (MSSQL `OFFSET/FETCH` or
`TOP`; others `LIMIT/OFFSET`) · identifier quoting (`[]` vs `` ` `` vs `"`) · boolean rendering (MySQL
`tinyint`, MSSQL `bit`) · placeholder style · `INSERT` + identity/auto-increment + `RETURNING`/`OUTPUT`
· upsert (`ON CONFLICT` / `ON DUPLICATE KEY` / `MERGE`) · row locks (`FOR UPDATE`/`FOR SHARE` vs lock
hints) · CTEs (SQLite ≥3.8.3, MySQL ≥8.0) · window functions + frames (MySQL ≥8.0, SQLite ≥3.25) ·
`DISTINCT ON` (PG-only) · `ILIKE` (PG-native, others emulated) · `IS DISTINCT FROM` (PG/SQLite native,
MySQL `<=>`) · `NULLS FIRST/LAST` · JSON operators · full-text search · `MERGE`/`APPLY`/lateral · and on
the **engine** side: transactions, `explain`, introspection (tables/columns/PK/FK/index), and the full
canonical type-normalization table — **for every dialect**.

**Standing guardrail so the gap can't silently reopen** — `scripts/check-dialect-parity.mjs`, added to
the Phase-1 guardrail set and run in the `quality` gate: for every registered op/feature, every dialect
must resolve to **✅ conformed** or **⛔ documented-throw**; a bare **❌ gap** fails CI. This turns
"add a feature for PG but forget MySQL" into a build failure, not a months-later surprise. New ops carry
a per-dialect declaration in `builder-ops.json`; a missing declaration is itself a gap.

**Where it runs:** the one-time audit runs at **Phase 3** (contract extraction, when the vocabulary
becomes first-class and enumerable); its triaged gaps are **closed in TS + the corpus before Phase 6**,
so Python/C#/Go inherit a leveled four-dialect contract rather than a lopsided one. The standing
guardrail lands in **Phase 1** and is enforced from then on.

## Target repo layout (language-first, package-second)

Convert the existing `deebee-tech/sqleasy` repo **in place** (keeps its URL, issues, stars, and every
historical corpus-fetch reference). Language-first so all five languages and both packages read as
co-equal:

```
deebee-tech/sqleasy  (same repo, new shape)
├─ contract/                     # ★ independently-versioned cross-language source of truth
│   ├─ contract.json             # {contractVersion, hashes:{emission,binding,normalization,introspection,vocabulary}}
│   ├─ schema/                   # authoritative JSON-Schema for values + all four corpora
│   ├─ vocabulary/               # the ISA: builder-ops.json (~130 ops), norm-tags.json,
│   │                            #   type-map.<dialect>.json, dialects.json (PINNED images)
│   ├─ corpora/{emission,binding,normalization,introspection}/   # the four golden sets + seeds
│   ├─ spec/canonical-types.md   # the human type table + rationale
│   └─ package.json              # @deebeetech/sqleasy-contract (own version, tag prefix corpus-v*)
├─ ts/     { query/, engine/ }   # @deebeetech/sqleasy, @deebeetech/sqleasy-engine (were the two TS repos)
├─ dart/   { query/, engine/ }   # pub: sqleasy (moved in), sqleasy_engine (NEW — the pilot)
├─ python/ { query/, engine/ }   # phase 6
├─ csharp/ { query/, engine/ }   # phase 6
├─ go/     { query/, engine/ }   # phase 6  — one module github.com/deebee-tech/sqleasy/go, tags go/v*
├─ configs/                      # tsconfig / eslint / prettier packages (deebee pattern)
├─ scripts/                      # check-*.mjs guardrails + corpus mint/verify
├─ docker-compose.harness.yml    # ONE harness: pg17 / mysql8.4 / mssql2022 (+ file SQLite)
├─ harness/seed/                 # one logical schema, four dialect renderings
└─ turbo.json  pnpm-workspace.yaml
```

Each **non-TS** directory carries a thin **private `package.json` shim** (`"version":"0.0.0"`, never
published) whose `scripts` shell out to the native toolchain (`dart test`, `pytest`, `dotnet test`,
`go test ./...`). That shim is the only thing that makes the tree a turbo-schedulable node; it pulls
no node deps. Workspace globs add `contract`, `configs/*`, `ts/*`, `dart/*`, `python/*`, `csharp/*`,
`go`. Carry deebee's `catalog:` single-version rule, the `minimumReleaseAge` + `@deebeetech/*`
exclude, and `onlyBuiltDependencies` verbatim.

## The `contract` package

The heart of the design. Key mechanics:

- **Vocabulary as an explicit ISA.** Today the legal op set lives only in `driver.ts`'s `switch`.
  Promote it: `builder-ops.json` (each op's args, which args are nested op-lists, `since`),
  `norm-tags.json` (each canonical value tag + representation rule + `since`), and
  `type-map.<dialect>.json` (raw catalog type → canonical family, e.g. `int8`→`bigint`,
  `numeric`→`decimal`, MySQL `TINYINT(1)`→`int`). A **meta-conformance test** in every port asserts
  every used op is registered and every registered op has a driver arm — a gap fails CI instead of
  throwing "unknown op" at replay.
- **TS mints, everyone replays.** TS stays the sole minter (`pnpm goldens` for A/B offline; a
  docker-gated `goldens:integration` task for C/D). Every other language, **including a new fifth
  corpus consumer, only replays** — it never computes SQL or expected rows itself.
- **`since`-gating decouples adoption (directly answers Sandy's core pain).** Each case/op/tag carries
  a `since` contract version. A port pins a contract version and **replays only `since ≤ target`**, so
  **additive (MINOR) contract changes are invisible to a pinned port** — ports adopt at their own
  pace and never "chase a release that changed no SQL." MAJOR (a _changed_ existing golden, removed
  op/tag, tightened schema) still forces everyone; PATCH is notes/format only.
- **Independent versioning, enforced mechanically.** The corpus gets its **own semver** in
  `contract.json`; `validate.ts` fails if `contract/**` content-hash changed without a version bump
  (and warns on the reverse). **Delete** the `semantic-release-replace-plugin` arm in the TS query
  `release.config.mjs` that stamps the TS version into `corpus.json` — that weld is the smell being
  cut. First release `corpus-1.0.0` is **defined byte-equal** to today's welded-9.0.0 corpus, so
  re-baselining changes the _pin name_, never behavior.
- **No network fetch, ever again.** In-repo every port reads the corpus by workspace path; the
  `raw.githubusercontent.com/.../v<ver>` fetch + vendored-copy + drift-check dance in
  `sqleasy-dart/tool/fetch_goldens.dart` is **deleted**. Dart keeps only `embed_goldens.dart`
  (base64-embed) + `verify_embed.dart`, because dart2js has no `dart:io` to read a file at test time.
  Out-of-tree consumers still take the corpus from the `corpus-v*` git tag (never a release asset —
  the asset upload is what crashed release 2.0.0).

## The canonical type-representation spec (the crown jewel of full engine conformance)

Transport is JSON, and JSON is lossy for exactly the types databases care about. Every normalized
value is `{t:<tag>, v:<json-safe>}`, chosen to be **lossless over the SQL type's domain**, **decodable
identically by all five languages**, and **one canonical spelling**. Condensed table (full version in
`contract/spec/canonical-types.md`):

| SQL type(s)                     | Tag               | Canonical `v`                                      | The trap it defuses                                                                      |
| ------------------------------- | ----------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `smallint`/`int`                | `int`             | JSON number                                        | ⊂ ±(2⁵³−1): exact everywhere                                                             |
| `bigint`                        | `bigint`          | **decimal string**                                 | overflows IEEE double; dart2js has no int64. Tag by _declared type_, not magnitude       |
| `numeric`/`decimal`             | `decimal`         | **string**, fixed scale, no exponent               | double is lossy for money/`0.1`; **never decode to float**                               |
| `real`/`double`                 | `double`          | JSON number; `NaN`/`±Infinity` as strings          | integral double `5.0` **stays** a double (reuse Dart's `isIntegral`/`formatNumber`)      |
| `bool`                          | `bool`            | `true`/`false`                                     | MySQL has no bool → `TINYINT(1)`→`int`; per-dialect `expect` records the real divergence |
| `timestamptz`                   | `timestamptz`     | RFC3339 **UTC `Z`**, µs                            | node-postgres defaults to ms-only JS `Date` → must parse raw text to keep µs             |
| `timestamp`/`date`/`time`       | resp.             | wall-clock strings, **not** tz-converted           | converting invents a zone                                                                |
| `text`/`varchar`/`char(n)`      | `string`          | exact codepoints, blank-pad preserved              | no Unicode normalization                                                                 |
| `json`/`jsonb`                  | `json`            | `jsonb`→sorted-canonical string; `json`→exact text | embedded objects let key order/number format diverge                                     |
| `bytea`/`blob`                  | `bytes`           | standard base64 (RFC 4648 §4)                      | binary can't ride in JSON                                                                |
| `uuid`                          | `uuid`            | **lowercase** 8-4-4-4-12                           | mssql returns UPPERCASE → must lowercase                                                 |
| PG `<t>[]`                      | `array`           | recursive JSON array of `NormValue`                | only PG has true arrays                                                                  |
| enum/`inet`/geometric/`money`/… | `text` (fallback) | driver textual rendering                           | long tail is documented `text`, port-optional beyond the core                            |

**Universal invariants:** never route `bigint`/`decimal` through a float; never compare a temporal
after a lossy native round-trip; always format floats/decimals with an invariant locale (C#'s
comma-decimal-separator is the biggest new-language trap; Go/Python/C# each have a named decode
contract in the design notes). **Required lossless driver config is part of the contract** (mechanism
idiomatic, result conformed): node-postgres string parsers + raw-text timestamps; mysql2
`supportBigNumbers:true, decimalNumbers:false, dateStrings`; `@libsql intMode:'string'`; etc.

## Polyglot turbo + CI + the shared DB harness

- **Turbo graph spans five languages via two mechanisms.** (1) Every port's conformance task lists the
  corpus as an explicit input (`$TURBO_ROOT$/contract/corpora/emission/corpus.json`), so changing the
  corpus invalidates every language's cache with zero source edits. (2) `turbo run conformance
--affected` prunes by the `@deebeetech/sqleasy-contract` dep edge: a `contract/**` change pulls in
  **all** ports; a `ts/query/src/**` change pulls in **only** TS (no port depends on the TS package).
  Mint tasks and DB-integration tasks are `cache:false`; DB env vars are declared in `env[]` so a
  self-skipping suite can't report green having tested nothing (deebee's `E2E_DIALECTS` lesson).
- **One harness, consumed by every language.** A single `docker-compose.harness.yml` (pinned
  `postgres:17` / `mysql:8.4` / `mssql:2022`; SQLite is a file per language) + one logical seed in four
  dialect renderings. The proof the four renderings are equivalent _is_ the introspection conformance.
  **Fail-loud rule:** when `HARNESS_DIALECTS=1` and a DB is unreachable, every language's integration
  suite hard-errors — never self-skips.
- **CI = three gates × a five-language matrix.** `quality` (per-ecosystem format/lint/typecheck +
  the JS guardrail scripts), `emission` (unit + corpus A/B, **no DB**; Dart leg runs **both** `dart
test` and `dart test -p chrome`), `integration` (corpus C/D against the one harness; Dart engine leg
  is VM-only). PRs run `--affected` (needs `fetch-depth: 0`); pushes to `main` + a nightly cron run the
  **full** graph as the safety net. Persist `.turbo` across runs keyed on lockfiles + corpus hash.
- **The Go wrinkle (honest).** Keep Go in the mono under `go/` as one module
  `github.com/deebee-tech/sqleasy/go`; consumers import `.../go/sqleasy`, tags are `go/vX.Y.Z`. The
  `/go/` path tax is a hard Go rule, not a mistake, and is idiomatic enough. A separate Go repo would
  break the single-corpus-input graph — the whole point of the mono — so **don't**. Escape hatches
  (vanity import path, or a CI-pushed read-only mirror repo) exist but aren't worth day-one cost.

## Release & versioning

**Recommended path (resolves the two tracks' disagreement):** keep **per-package semantic-release for
the TS packages + the corpus through the migration** — it's battle-tested and carries the family's
load-bearing lore (`@sebbo2002/semantic-release-jsr` **before** `@semantic-release/github`; github
plugin with **no `assets` array**; `release-notes-generator` with **no preset**; `dist/` committed for
query vs gitignored+`files:['dist']` for engine). Then **evaluate release-please (manifest mode) at
Phase 6**, when adding the non-JS languages — which is exactly where semantic-release's single-package,
JS-only nature bites (it can't natively drive `pubspec.yaml` / `pyproject.toml` / `.csproj` / Go tags).
Deferring this keeps the migration from stacking a release-tooling rewrite on top of a repo move.

- **Per-package tag prefixes** so tags don't collide: `sqleasy-v*`, `sqleasy-engine-v*`, `corpus-v*`,
  and Go's mandated `go/v*`. Scope each package's commit analysis to its path.
- **pub.dev — verify the automation finding.** Two design tracks (web-researched, citing dart.dev)
  found pub.dev now supports **automated publishing from GitHub Actions via OIDC** (tag-triggered + a
  one-time publisher config), which would supersede the standing "interactive-auth-only" note. **Action:
  verify against dart.dev and, if confirmed, update the `sqleasy-dart-port` memory.** Until confirmed,
  the plan keeps Dart's publish a single manual `dart pub publish` command handed off via the CI job
  summary — automated up to that point, and blocking nothing else (each channel is an independent
  tag-triggered workflow).
- **If/when release-please is adopted:** it needs a **GitHub App token** (not `GITHUB_TOKEN`, whose
  pushed tags don't trigger publish workflows — the single biggest footgun), and per-ecosystem OIDC
  publish workflows (npm/JSR/PyPI/NuGet Trusted Publishing; Go needs only the tag).

## Migration sequence (six phases, every phase ends releasable and green)

Convert `deebee-tech/sqleasy` in place; rewrite all three source histories into subtrees with
`git filter-repo --to-subdirectory-filter` + `--tag-rename` (bare `vX.Y.Z` tags collide once merged),
then `git merge --allow-unrelated-histories`. One-time force-push inside a stated window; archive the
three source repos read-only as an escape hatch.

| Phase                                        | Ends releasable? | What it does / proves                                                                                                                                                                                                                                                                                       |
| -------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0 · Pre-flight**                           | scaffold         | decide tag scheme; window; escape-hatch plan                                                                                                                                                                                                                                                                |
| **1 · Skeleton**                             | scaffold         | turbo+pnpm, `configs/*`, guardrails, `docker-compose.harness.yml`, CI skeleton (deebee patterns) — `turbo run build lint check test` green                                                                                                                                                                  |
| **2 · Move TS query + engine in**            | **YES**          | into `ts/query`, `ts/engine` as workspace members (source-consumed, published verbatim). **Cut a real patch release of both from the monorepo before archiving sources** — proves the release plumbing + npm/JSR OIDC rebind survived the move; confirm deebee still installs its `catalog:` pins unchanged |
| **3 · Extract the contract**                 | **YES**          | corpus + schema + vocabulary → `contract/` as `@deebeetech/sqleasy-contract`; remove the TS version-stamp weld; add the version⇄hash gate; ship `corpus-1.0.0` byte-equal to today                                                                                                                          |
| **4 · Fold Dart query in**                   | **YES**          | into `dart/query`; swap `fetch_goldens` HTTP path for a local-file read; keep base64 embed + `verify_embed`; keep VM + `-p chrome`; publish `sqleasy` 3.0.x from the monorepo                                                                                                                               |
| **5 · PILOT: Dart engine, full conformance** | **GATE**         | build `dart/engine` (`DbExecutor`/`Row`/`QueryResult`/introspection) on real Dart drivers; extend the harness to corpora B/C/D; byte-identical vs TS on all four dialects, VM-only. **GO/NO-GO for the whole model**                                                                                        |
| **6 · Scaffold Python / C# / Go**            | per-language     | only after Phase-5 GO; each is the Dart-proven shape (query driver + engine executor + conformance harness + CI leg), independently shippable                                                                                                                                                               |

**Phase-5 Definition of Done (the gate):** the type-tagged B/C/D corpora exist; Dart implements the
full `DbExecutor` surface + introspection for all four dialects; **byte-identical results vs TS** on
every dialect; transaction commit/rollback proven; the **seven core scalars**
(`null/int/double/bool/string/decimal-as-string/UTC-datetime`) match exactly; green as a VM-only
turbo task gated on the containers, not gating the TS release lines.

**Kill criteria (honoring "if it's not possible, fine"):** extended types that can't reduce to one
canonical form (arbitrary-precision numeric beyond a language's native decimal, MySQL zero-dates,
`datetimeoffset` skew, exotic `json`/`uuid`/`bytea`/array edges) may be **quarantined as tagged
opaque pass-through** — a documented contract boundary, not a failure. **Hard stop:** if any of the
seven core scalars can't be made byte-identical, that's NO-GO — fix the normalization contract before
scaling to three more languages, never paper over it. If quarantining breaks introspection's ability
to describe a column the query builder can target, escalate to Sandy to relax introspection to
advisory rather than silently shipping a contradiction.

**deebee is out of scope** — it stays a separate downstream repo consuming the published packages via
`catalog:` (its `@deebeetech/*` `minimumReleaseAgeExclude` already picks up same-hour publishes).
Only _in-repo_ consumers use `workspace:*`.

## Verification

- **Per phase:** `turbo run build lint check test --affected` green; the Phase-2 real patch release
  lands on npm + JSR and deebee still installs; Phase-3 `validate.ts` blocks a content change without
  a version bump; Phase-4 Dart green on **both** VM and `-p chrome` reading the local corpus.
- **Full-conformance harness (Phase 5+):** `docker compose -f docker-compose.harness.yml up -d --wait`,
  then `turbo run conformance:integration --filter=...dart` with `HARNESS_DIALECTS=1` — corpora C/D
  byte-identical to TS across pg17/mysql8.4/mssql2022 + SQLite; transaction commit persists / rollback
  leaves no rows.
- **Meta-conformance:** every op/tag used by any port is registered in the vocabulary and has a driver
  arm (fails CI, not at replay).
- **Release dry-run per ecosystem** on a scratch branch before trusting the pipeline (Go tag exactness
  via a real `go get`; C# packed `.nupkg` version equals the tag).

## Open decisions (recommendations made; revisit, not blocking)

1. **Release tooling** — semantic-release now, evaluate release-please at Phase 6 (recommended).
2. **pub.dev automation** — verify the OIDC finding; if real, automate Dart publish and update memory.
3. **Go layout** — one module `go/` with `go/v*` tags (recommended); mirror-repo escape hatch deferred.
4. **`EXPLAIN`** — advisory only (`ExplainEstimate` shape + `fullScan` boolean), or drop from the
   contract entirely (recommended: advisory).

## Top risks (each mitigated above)

1. **Result-normalization type fidelity across languages × dialects** — the core technical risk; the
   int/double/datetime trap returns on the _output_ path. Mitigated by the tagged B/C/D corpora,
   core-must-match vs quarantine-as-opaque, and the Dart pilot gate deciding GO/NO-GO before three more
   languages inherit the problem.
2. **Release-automation regression during the repo merge** (tag collisions, JSR ordering, OIDC/JSR
   rebind to repo+workflow identity) — mitigated by the Phase-2 real-release checkpoint before sources
   are archived, per-package configs preserved verbatim, and dry-runs.
3. **turbo cache correctness for DB-integration tasks** — mitigated by `cache:false` + declared `env[]`
   for DB tasks, copying deebee's documented discipline.
