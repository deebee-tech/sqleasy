# Contributing

## Setup

```bash
pnpm install
```

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm spell
pnpm test
pnpm build
```

## Goldens

The emission corpus lives at `contract/corpora/emission/corpus.json`
(`@deebeetech/sqleasy-contract`), the cross-language contract shared with the Dart port in
`dart/query` in this repo. Regenerate only when you intentionally change emitted SQL:

```bash
pnpm goldens   # rewrite corpus.json
pnpm test      # conformance suite must stay green
```

Review the golden diff carefully — every changed line is a change to SQL output. After
`pnpm goldens`, re-embed for Dart and bump the contract version; see
[contract/README.md](../../contract/README.md).
