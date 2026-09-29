# SQLEasy

A dialect-aware SQL builder and execution engine for **MSSQL, MySQL, Postgres, and SQLite** — fluent,
zero-dependency, and not an ORM.

This is a **polyglot, contract-first monorepo**. The same two packages are implemented in TypeScript
and Dart, and every implementation is held to the others _byte-for-byte_ by a shared golden contract.

## Layout

```
contract/    the cross-language source of truth — independently versioned
ts/          query/  engine/     @deebeetech/sqleasy, @deebeetech/sqleasy-engine
dart/        query/  engine/     pub.dev: sqleasy, sqleasy_engine
configs/     shared tsconfig / eslint presets (never published)
harness/     one logical schema, four dialect renderings — the shared DB fixtures
scripts/     repo guardrails (check-deps, check-dialect-parity, ...)
```

## The design rule

SQLEasy is an honest capability surface, not a portability layer. A construct that exists on every
engine gets one common method. A construct an engine lacks is refused on that engine. A construct
an engine spells its own native way gets its own engine-named method. Runtime refusal is the floor
in every language; per-engine types are the ceiling where the language allows.

## The one rule that makes this work

**Every port depends on the contract, never on the TypeScript implementation.**

TypeScript is the _reference_ — it mints the golden corpora. Every other language, TypeScript
included, only _replays_ them. That single rule is what makes the turbo graph do the right thing
automatically: a change under `contract/` reruns every language's conformance suite; a change under
`ts/query/src/` reruns only TypeScript, because no port depends on it.

## Why one repo instead of one repo per language

Cross-language SDKs are conventionally split per language, and this deliberately is not. Two reasons:

1. **The engine's contract needs real databases.** Emission goldens are pure text and travel for
   free, but result-normalization and introspection goldens need pinned Postgres/MySQL/SQL Server
   containers. Split across per-language repos, that fixture environment gets duplicated in each and
   drifts. Here it is defined once, in `docker-compose.harness.yml`.
2. **The product is parity.** A `bigint` that comes back as a float in one language and a string in
   another is silent data corruption. Co-location means one commit changes the emission, regenerates
   the corpora, updates every port, and one CI gate proves the whole family still agrees — rather
   than each port drifting until someone notices.

## Working in it

```bash
pnpm install
pnpm build            # turbo run build
pnpm test             # unit + emission/binding conformance (no database)
pnpm check            # typecheck + dependency guardrails
pnpm lint
pnpm format:check
pnpm spell

pnpm harness:up       # pinned pg17 / mysql8.4 / mssql2022 containers
pnpm harness:down
```

Third-party versions live once in the `catalog:` block of `pnpm-workspace.yaml`; packages reference
`catalog:` and internal packages `workspace:*`. `scripts/check-deps.mjs` enforces it — a literal
version range anywhere fails the build.

## License

MIT © DeeBee Tech
