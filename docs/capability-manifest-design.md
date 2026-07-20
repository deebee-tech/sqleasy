# The capability manifest: design of record

**Status:** approved 2026-07-20. The manifest is shipped and inert; the behavioural sweep is done.
**Authorizes:** a complete rewrite of the capability surface. Explicitly **not** a migration.

## Progress

**Done — the behavioural sweep.** Every confirmed emulation, silent no-op and lossy coercion has
been fixed or refused, across both TypeScript and the Dart port, with the corpus re-minted at each
step. Contract at **0.11.0**; **59 of 808 cells adjudicated**, 25 carrying an engine-native name.

Two findings from doing it are worth keeping:

- **The existing suite was agreeing with the bugs.** Of eleven defects fixed, _seven_ were asserted
  as intended behaviour by a golden or a hand-written test — including a golden literally named
  "top is silently ignored by the non-mssql dialects" and a test named "MSSQL applies the hint to
  the FROM table even alongside a JOIN". That is the argument for a rewrite over a migration, and
  it is why every fix here also carries hand-written coverage.
- **An empty corpus diff is a finding, not a success.** Four fixes moved zero goldens because the
  broken combination had no coverage at all: row-lock + join, `FullTextMode.Phrase` on any dialect,
  MSSQL `RANGE` with a numeric offset, and the whole engine bucket. Check coverage before
  concluding a change is inert.

**Not started — the typed surface**, and with it the renaming. Three capabilities are deliberately
parked on it rather than guessed at, because naming them now would mint exactly the suffixed forms
(`mergeMssql()`, `forShareMssql()`) that the shared namespace forces and the types dissolve:

| parked                | why it waits                                                                                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MSSQL `MERGE`         | Genuine native T-SQL, currently refused because it was substituting for an upsert MSSQL does not have. The emitter is kept, unreferenced, in `default-merge.ts`. |
| MSSQL lock hints      | `forShare` is refused because HOLDLOCK silently escalates to SERIALIZABLE. A DBA should be able to name `UPDLOCK`/`HOLDLOCK`/`REPEATABLEREAD` directly.          |
| MySQL `INSERT IGNORE` | Already adjudicated with its own engine-native name; only the surface rename is outstanding.                                                                     |

---

## The founding principle this exists to enforce

SQLEasy is **an honest capability surface, not a portability layer.** In the owner's words:

> "The original intent was never to make everything possible on all platforms. If it exists on all
> platforms, make it common. If it only exists in 3, only allow it in 3. To put it in an IntelliSense
> way: I never wanted you to hit the dot and see a method that was NOT possible on the platform you
> were on. I also didn't want things to be approximations. If it didn't exist, it wasn't possible on
> your platform."

> "As a DBA, I would expect to hit the dot to get intellisense and get things I EXPECT to see —
> honest methods reflecting real terms in the engine, not 'I'll bet that's what they mean by this'."

> "I don't necessarily want it SO perfect that everything is a one off, but the rule should be:
> when in doubt, reflect the engine you're in."

**Three branches, not two.** An earlier framing of this as a binary (refuse vs. approximate) was
wrong and was corrected by the owner:

1. **Exists on every engine** → one common method.
2. **Genuinely absent here** → refuse. It is not possible on your platform.
3. **The engine has its OWN native capability that a portable name would misrepresent** → give it
   its own method, in that engine's vocabulary. Deleting it is its own dishonesty — it pretends an
   engine cannot do something it genuinely can.

**Enforcement:** types where the language can express it, runtime refusal where it cannot. Runtime
refusal is the **floor** and is required everywhere (it is what the corpus pins and what Go relies
on). Types are the **ceiling**, added wherever expressible.

---

## The canonical test case: `top()`

Treat this as the acceptance criterion for any proposed design. The owner built the original
interface/abstract-class architecture around this single example, as the prototype for "something in
all engines and something in only one."

> "As a MSSQL DBA, I think of top and limit offset as two _different_ statements. Limit offset is
> REAL in SQL Server. But so is top. They put limit offset in later to comply with other engines,
> but top stayed around."

So MSSQL has **two** real constructs; the other three have one:

| method            | mssql                      | mysql / postgres / sqlite                                      |
| ----------------- | -------------------------- | -------------------------------------------------------------- |
| `limit()`         | native (`OFFSET/FETCH`)    | native (`LIMIT`)                                               |
| `top()`           | native (`TOP`)             | **absent — must not exist**                                    |
| `limitWithTies()` | native (`TOP … WITH TIES`) | postgres only (`FETCH FIRST … WITH TIES`); mysql/sqlite absent |

`top()` is **not** T-SQL's spelling of `LIMIT`. Do not simplify it away, and do not treat the two
constructs as interchangeable.

**That conflation is already a live bug.** MSSQL `limitWithTies()` currently emits
`OFFSET/FETCH … WITH TIES`, which is invalid T-SQL: `WITH TIES` exists only on `TOP`, `<offset_fetch>`
ends in a mandatory `ONLY`, and `TOP` admits no offset. The code produced it by assuming the two were
one construct. The flattening of the per-engine types did not just cost the compile-time guarantee —
it cost the _distinction_, and the distinction was load-bearing.

---

## The central finding: dishonesty is mostly NOT at method granularity

This invalidated the initial recommendation (split `QueryBuilder` four ways and be done). Roughly
half of the 39 confirmed violations live on the **argument and enum axis**, where a per-engine type
split cannot see them:

- **`whereMatch(cols, term, FullTextMode)`** — one method, one enum, spanning Postgres
  `plainto_tsquery`, MySQL `MATCH … AGAINST`, MSSQL `CONTAINS`/`FREETEXT`, and SQLite FTS `MATCH`.
  Four unrelated subsystems, four unrelated grammars, all emitting valid SQL.
- **`joinCrossApply()` / `joinOuterApply()`** — T-SQL terms that emit _fine_ on Postgres and MySQL.
  All three cells read native, so a naive per-engine split leaves them on the **shared** base, and a
  Postgres user still sees a T-SQL term.
- **`fromTableWithOwner`** — Sybase-era vocabulary, on ~10 ops, emitting a schema qualifier.
- **`WhereOperator.Ilike` / `.Regex` / `.IsDistinctFrom`, `NullsOrder.First/Last`,
  `JsonExtractMode`, `CallParamDirection`** — enum members. There is no method cell to adjudicate.

Any design keyed on _(method) → exists/absent_ is structurally blind to all of the above.

---

## The mechanism: derived sharedness

Key the manifest on **`(op, dialect) → the engine's own name for it`**. Then:

> **"This is a shared method" is DERIVED from the four names agreeing. It is never authored.**

This inverts the default. For `joinCrossApply` to remain shared, someone must type
`joinCrossApply` into four cells and thereby assert it is a real term in Postgres, MySQL and SQLite.
Nobody will. **Divergence becomes the low-energy state and portability becomes a deliberate claim.**

That is the owner's tiebreak expressed as a mechanism rather than a maxim, and it is the single most
important decision in this document.

### Schema rules

- **Two kinds only: `native` and `absent`**, plus a transitional `unadjudicated` that the generator
  refuses to emit for. **There is deliberately no `emulated` kind** — it is the low-energy path, and
  the 39 violations accumulated under a regime that already had a corpus, a parity ratchet, and code
  review. Do not build the drawer they would hide in.
- `name` is **per-dialect data**, seeded **empty**. See the laundering trap below.
- The manifest must cover the **enum/argument axis**, not just methods — that is the whole point.

---

## Measured findings (run, not argued — do not relitigate)

**`never` and `this`-parameter narrowing FAIL the owner's test.** Checked against the TypeScript
language service: both still place `top` in the Postgres completion dropdown and only then report
"Type 'never' has no call signatures." Seeing the method at all is the failure. **Only structural
absence passes.**

**Go violates the principle in one invisible token.** `func (b *Builder[Pg]) DistinctOn()` compiles
clean with zero warnings and puts `DistinctOn` on the MySQL builder — `Pg` in a receiver position is
a _binding_ occurrence that silently shadows the concrete type. Confirmed by execution. Any Go
generator needs a method-set-absence test using reflection.

**Python's class-level alias breaks fluent chaining.** `distinct_on = CommonQueryBuilder._distinct_on`
type-checks and correctly rejects the method on MySQL, but returns `CommonQueryBuilder`, because
`Self` binds to the _defining_ class. Every chain through a divergent method collapses to the common
surface. Requires a real wrapper (`def distinct_on(self, cols) -> Self: return self._distinct_on(cols)`).

**Structural typing makes this port everywhere.** TS, Dart, Python (`Protocol`) and Go all have
structural interfaces, so one runtime implementation can expose four narrow **interface views**
(`newBuilder(): MssqlBuilder`) with **no generics at all**. This is why the interface-view approach
ports where the original F-bounded generic design would not. C# needs real (nominal) interfaces,
which is natural there. Python's runtime still exposes everything, so the throw remains the floor.

**Sub-builder callbacks currently lose the dialect entirely.** `ts/query/src/builder/query.ts:905`
takes `(builder: QueryBuilder) => void`, so the completion list goes fully generic the moment you
open a subquery. Nested completions must be verified, not assumed.

**152 of ~195 builder methods already return `this`.** Polymorphic `this` resolves to the _viewing_
type, so the common methods need no per-engine redeclaration. (Note they are arrow-function
_properties_, not prototype methods — so ~195 closures are allocated per instance and the builder
never tree-shook regardless. The bundling argument for flattening it did not pay off; the argument
for flattening the _parsers_ did and stands.)

---

## Decisions of record

### The corpus does NOT split per engine

Splitting would institutionalize the exact skew the parity audit found — features built for one
dialect while nobody checks the others. The corpus's whole value is that **one intent replays on all
four**; the ports share no API, so intent is the only shareable thing.

What changes is the **defaulting**. Measured today: **322 cases, 289 with no `dialects` field, 33
declaring one, 110 distinct ops.** That silent default asserts universality by omission, and it is
very likely the mechanism that produced the emulations — a case defaults to all four, someone must
make it green on all four, and `LOWER()` / `CASE WHEN` / `MERGE` is the path of least resistance.

So `dialects` stops being authored and becomes **derived**: the intersection, over the case's ops and
enum arguments, of the dialects where every one is `native`. The 289 are not deleted or rewritten —
they are _stamped_. Most keep four dialects, but now _because_ every op resolved native. Cases
touching an `absent` cell renarrow automatically and the diff names the responsible cell. The 33
hand-authored sets are re-examined; disagreement with derivation is a build failure.

Two structural additions: emission and refusal split into separate corpora (`{throws}` becomes
illegal in emission), and a third expectation variant **`{ unavailable: <capability> }`** carries
compile-failure assertions — asserted as a compile error in TS/Dart/C#/Python and a runtime refusal
in Go, with drift between the two levels being a test failure. That makes "types where expressible,
throws where not" _testable_ rather than aspirational.

`check-dialect-parity.mjs` (currently "122 ops × 4 dialects, 10 known gaps") collapses into the
derivation; `dialect-parity-baseline.json` becomes the list of still-unadjudicated cells.

### Types come before renaming — with a corrected scope

Confirmed. `hintMssqlOption()` becomes `MssqlQueryBuilder.option()` with nobody deciding to rename
it, because the suffix was never a naming choice — it was disambiguation inside one shared namespace,
and four namespaces dissolve it.

**The correction:** that is essentially _one_ method. `whereMatch`, `joinCrossApply`,
`fromTableWithOwner`, `orderByColumnNulls`, `whereJsonExtract`, `procParamInOut`,
`clearLimitWithTies` are **DSL vocabulary, not namespace disambiguation** — splitting the class
leaves every one of them on the shared base. It is _derived sharedness_ that forces those renames.
Budget a rename list several times longer than "the suffix falls out for free."

### Live probing only in the negative direction

Every `absent` cell's nearest statement must be **rejected** by a real server in
`docker-compose.harness.yml`. Positive probing was dropped: three judges independently showed that a
probe proves the server _parses_ the SQL, never that the method _means what it says_. The negative
direction is what catches the FALSE-CONFORMED class (audit F1–F4), and nobody has built it.

---

## The laundering trap (the most important implementation warning)

**Do not seed the manifest from the existing goldens.** `ts/query/tests/conformance/conformance.test.ts:24`
states the goldens "are _generated_, then reviewed and frozen. They are not an independent check."

A case emits real SQL precisely _when_ TypeScript silently emulated or dropped something. So `top()`
on MySQL/Postgres/SQLite — a silent no-op at `to-sql.ts:279` — would seed as `native`, survive every
probe, and be promoted from known bug to **machine-attested capability**. That is strictly worse than
the dated audit it replaces.

Therefore:

1. Extract each `(op, dialect)` cell: emits real SQL → `native`; throws a capability error →
   `absent` + the exact message; neither → `unadjudicated`.
2. **Force to `unadjudicated`** every op named in the parity audit's Parts 2–4 (F1–F4, S1–S4, G1–G3)
   regardless of what extraction said. Those are exactly the cells extraction gets wrong.
3. Seed `name` **empty** in all four cells of every op. Do **not** seed from the current TS method
   name. Expense is the point here: "corrected later" with a pre-filled default means never corrected.
4. Extend `check-dialect-parity.mjs` to derive each case's dialect set and _report_ disagreement.
   Ship as a report, not a gate.

The owner has authorized discarding the existing goldens entirely rather than migrating them
("I'm completely fine if you don't use the goldens that exist… Don't try to save anything").
Regenerating the corpus from an adjudicated manifest is preferred over laundering the old one.

---

## What this design does NOT solve

A manifest built from ops that **exist** can only report which built things are dishonest. It can
never report which real capabilities are **missing**. Postgres has had `MERGE` since 15 and
`FOR NO KEY UPDATE`/`FOR KEY SHARE` forever; the audit's Part 4 lists SQLite `UPDATE … FROM` and
index hints for three dialects. No cell exists for a method nobody wrote.

This requires a per-engine manual read by someone fluent in that engine. It belongs in the audit's P2
track. It is named here so it is not mistaken for covered.

---

## Provenance

- Parity audit: `docs/audits/dialect-parity-2026-07-19.md`
- Migration plan: `docs/monorepo-migration-plan.md`
- The pre-flattening architecture, worth mining for _which method belongs to which engine_:
  commit `100b1fc^` — `src/sqleasy/{mssql,mysql,postgres,sqlite}/` and `src/builder/default_builder.ts`.
  `MssqlBuilder` declared `top()`/`clearTop()`; the other three declared no extra methods at all.
- Design derived from three independently-developed approaches, each scored by three judge lenses
  (DBA ergonomics, five-language reality, maintenance burden). **No approach scored above 6.3/10** —
  this document is the synthesis of their teardowns, not an adoption of any one of them.
