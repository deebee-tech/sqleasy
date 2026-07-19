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

`goldens/corpus.json` is the cross-language contract shared with
[`sqleasy-dart`](https://github.com/deebee-tech/sqleasy-dart). Regenerate only when you
intentionally change emitted SQL:

```bash
pnpm goldens   # rewrite corpus.json
pnpm test      # conformance suite must stay green
```

Review the golden diff carefully — every changed line is a change to SQL output. After a
release that updates the corpus, sync `sqleasy-dart` so its pinned corpus version matches.

See [goldens/README.md](./goldens/README.md) for the full contract.
