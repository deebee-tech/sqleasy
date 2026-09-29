# The SQLEasy contract

The cross-language source of truth. Every language port must reproduce these goldens **byte for byte**,
for every dialect. A port never computes expected output itself — it only replays what is here.

```
contract/
  contract.json                            the contract's OWN version + content hashes
  schema/{corpus,normalization,introspection}.ts
                                           the authoritative case schemas
  corpora/emission/corpus.json             (A) op-list -> emitted SQL
  corpora/normalization/corpus.json        (C) seed + query -> canonical rows
  corpora/introspection/corpus.json        (D) seed schema -> canonical schema shape
  capabilities/                            capabilities.json (generated manifest) + decisions.json
                                           (hand-authored)
  tools/validate.mjs                       the version-vs-content gate
```

## Why this is versioned independently

It used to not be. `corpus.json`'s `version` was rewritten to the TypeScript package's version on every
release by a `semantic-release-replace-plugin` arm, which meant **a TypeScript release that changed no
SQL at all still forced every port to chase a new version.** That weld is gone.

The contract version now moves only when the contract moves:

| bump      | when                                                                                                     |
| --------- | -------------------------------------------------------------------------------------------------------- |
| **major** | an existing golden _changed_, an op or tag was removed, or the schema tightened — every port must follow |
| **minor** | purely additive: new cases, ops, tags, or dialects                                                       |
| **patch** | non-semantic: notes, formatting, reordering                                                              |

`tools/validate.mjs` enforces the version⇄content invariant mechanically: if the hashed content of
`corpora/` or `schema/` changes without a version bump, it fails. That is the mechanical replacement
for the old weld — the thing that makes "independently versioned" true rather than aspirational.

## Why this is on 0.x

**Deliberately pre-1.0 while the capability surface is being settled.** SQLEasy is being reworked so
that each engine exposes only what it genuinely supports, in that engine's own vocabulary — no
approximations, no method that cannot run on the dialect you are holding. That work rewrites emitted
SQL repeatedly, and under the table above every one of those rewrites is a _major_. Staying on 0.x
means the churn costs a minor instead, so the version number reflects the contract's stability rather
than counting how many times the design was refined.

Under 0.x, read the table one line down: a breaking change bumps the **minor**, additions bump the
**patch**. `1.0.0` is the commitment that the surface has settled — cut it when the per-engine
surface is final, not before.

This package has never been published, so 0.x costs nothing to adopt. Its siblings do not have that
luxury: `@deebeetech/sqleasy` and `@deebeetech/sqleasy-engine` are public, and npm forbids reusing or
rewinding a published version. Their churn rides the `beta` prerelease channel instead — see the
release configs.

## The 0.1.0 baseline changed no behaviour

The first independent version was **defined to be case-identical** to the corpus as it stood at
TypeScript v10.1.0. Only the `version` field's _meaning_ changed — from "the TS package version" to
"the contract version". The `cases` array was byte-identical, verified by hash at the time of
extraction and recorded in `contract.json`. Re-baselining changed the pin's _name_, never its content.

`0.2.0` is the first version that moves content: it refuses five constructs whose goldens pinned SQL
the target engine cannot parse, and corrects MySQL index-hint placement. Six cases moved.

## The four corpora

(A), (C) and (D) exist. The engine is I/O rather than pure, so its contract needed more than
emission; those were added alongside the Dart engine pilot. (B) was dropped: the engine runs SQL
verbatim, so its golden was nearly the identity of its input, and its one real assertion (statements
passed separately and in order) is covered by the executors' own transaction tests.

|       | corpus        | input           | golden                                      | needs    |
| ----- | ------------- | --------------- | ------------------------------------------- | -------- |
| **A** | emission      | builder op-list | `{prepared, raw}` \| `{throws}` per dialect | pure ✅  |
| **B** | binding       | `{sql, params}` | ordered driver `(sql, args)` calls          | dropped  |
| **C** | normalization | seed + query    | canonical `{columns, rows, rowCount}`       | real DBs |
| **D** | introspection | seed schema     | canonical schema shape                      | real DBs |

## Adding a language port

1. **Loader** — read `corpora/*.json` locally. Codegen-embed it for restricted runtimes (dart2js).
2. **Value codec** — decode/encode the tagged values, honouring that language's number traps.
3. **Driver** — interpret the op vocabulary and replay corpus (A).
4. **Real-DB harness** — replay (C) and (D) against `docker-compose.harness.yml`.
5. **CI leg** — plus any extra runtime the language needs (Dart must run VM _and_ dart2js).

## Changing emitted SQL

1. Hand-write a test for the change. The goldens are generated, so they are not an independent
   check: the old suite asserted seven of eleven later-fixed defects as intended behavior. An EMPTY
   corpus diff means the change has no coverage, not that it is a no-op.
2. `pnpm goldens` — never hand-edit `corpus.json` or `contract.json`.
3. `pnpm --filter @sqleasy/dart-query embed` — the dart2js lane replays a base64 embed that grep
   cannot see.
4. Bump the contract version (breaking = minor under 0.x), then
   `pnpm --filter @deebeetech/sqleasy-contract validate:write`.
5. Root gates: `pnpm check && pnpm run spell && pnpm run format:check`.

## Why values are type-tagged

JSON cannot tell `5` from `5.0`, but the emitted SQL can — and Dart disagrees with _itself_ about it
(`5.0 is int` is `false` on the VM and `true` on dart2js). So inputs carry an explicit tag
(`{"t":"double","v":5}`) and a port that decodes that into an integer has thrown away the very thing
the case exists to test. Bound parameters are tagged more coarsely (`num`) on purpose: the int/double
distinction is pinned only where it is _observable_, which is in the SQL text.
