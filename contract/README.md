# The SQLEasy contract

The cross-language source of truth. Every language port must reproduce these goldens **byte for byte**,
for every dialect. A port never computes expected output itself — it only replays what is here.

```
contract/
  contract.json               the contract's OWN version + content hashes
  schema/corpus.ts            the authoritative case schema
  corpora/emission/corpus.json   (A) op-list -> emitted SQL          322 cases
  tools/validate.mjs          the version-vs-content gate
```

## Why this is versioned independently

It used to not be. `corpus.json`'s `version` was rewritten to the TypeScript package's version on every
release by a `semantic-release-replace-plugin` arm, which meant **a TypeScript release that changed no
SQL at all still forced every port to chase a new version.** That weld is gone.

The contract version now moves only when the contract moves:

| bump | when |
|---|---|
| **major** | an existing golden *changed*, an op or tag was removed, or the schema tightened — every port must follow |
| **minor** | purely additive: new cases, ops, tags, or dialects |
| **patch** | non-semantic: notes, formatting, reordering |

`tools/validate.mjs` enforces the version⇄content invariant mechanically: if the hashed content of
`corpora/` or `schema/` changes without a version bump, it fails. That is the mechanical replacement
for the old weld — the thing that makes "independently versioned" true rather than aspirational.

## Version 1.0.0 changed no behaviour

The first independent version is **defined to be case-identical** to the corpus as it stood at
TypeScript v10.1.0. Only the `version` field's *meaning* changed — from "the TS package version" to
"the contract version". The `cases` array is byte-identical, verified by hash at the time of
extraction and recorded in `contract.json`. Re-baselining changed the pin's *name*, never its content.

## The four corpora

Only (A) exists today. The engine is I/O rather than pure, so its contract needs three more, added
alongside the Dart engine pilot:

| | corpus | input | golden | needs |
|---|---|---|---|---|
| **A** | emission | builder op-list | `{prepared, raw}` \| `{throws}` per dialect | pure ✅ |
| **B** | binding | `{sql, params}` | ordered driver `(sql, args)` calls | mock driver, no DB |
| **C** | normalization | seed + query | canonical `{columns, rows, rowCount}` | real DBs |
| **D** | introspection | seed schema | canonical schema shape | real DBs |

(C) and (D) are the ones that matter most and are hardest: the 2026-07-19 audit found the engine
performs **no result-row normalization at all**, so the same column returns four different values
across four dialects. See `docs/audits/dialect-parity-2026-07-19.md`.

## Adding a language port

1. **Loader** — read `corpora/*.json` locally. Codegen-embed it for restricted runtimes (dart2js).
2. **Value codec** — decode/encode the tagged values, honouring that language's number traps.
3. **Driver** — interpret the op vocabulary and replay corpus (A).
4. **Mock-driver harness** — replay (B).
5. **Real-DB harness** — replay (C) and (D) against `docker-compose.harness.yml`.
6. **CI leg** — plus any extra runtime the language needs (Dart must run VM *and* dart2js).

## Why values are type-tagged

JSON cannot tell `5` from `5.0`, but the emitted SQL can — and Dart disagrees with *itself* about it
(`5.0 is int` is `false` on the VM and `true` on dart2js). So inputs carry an explicit tag
(`{"t":"double","v":5}`) and a port that decodes that into an integer has thrown away the very thing
the case exists to test. Bound parameters are tagged more coarsely (`num`) on purpose: the int/double
distinction is pinned only where it is *observable*, which is in the SQL text.
