# SQLEasy

A dialect-aware SQL builder and execution engine for **MSSQL, MySQL, Postgres, and SQLite** — fluent,
zero-dependency, and not an ORM.

This is a **polyglot, contract-first monorepo**. The same two packages are implemented in several
languages, and every implementation is held to the others *byte-for-byte* by a shared golden contract.

## Layout

```
contract/    the cross-language source of truth — independently versioned      (phase 3)
ts/          query/  engine/     @deebeetech/sqleasy, @deebeetech/sqleasy-engine
dart/        query/  engine/     pub.dev: sqleasy, sqleasy_engine             (phases 4-5)
python/      query/  engine/                                                   (phase 6)
csharp/      query/  engine/                                                   (phase 6)
go/          query/  engine/                                                   (phase 6)
configs/     shared tsconfig / eslint presets (never published)
harness/     one logical schema, four dialect renderings — the shared DB fixtures
scripts/     repo guardrails (check-deps, check-dialect-parity, ...)
```

## The one rule that makes this work

**Every port depends on the contract, never on the TypeScript implementation.**

TypeScript is the *reference* — it mints the golden corpora. Every other language, TypeScript
included, only *replays* them. That single rule is what makes the turbo graph do the right thing
automatically: a change under `contract/` reruns every language's conformance suite; a change under
`ts/query/src/` reruns only TypeScript, because no port depends on it.

## Why one repo instead of one repo per language

Cross-language SDKs are conventionally split per language, and this deliberately is not. Two reasons:

1. **The engine's contract needs real databases.** Emission goldens are pure text and travel for
   free, but result-normalization and introspection goldens need pinned Postgres/MySQL/SQL Server
   containers. Split across five repos, that fixture environment gets duplicated five times and
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

MIT © Sandy Weatherby
