# Contributing

## Setup

```bash
pnpm install
pnpm run typecheck
pnpm run lint
pnpm run format:check
pnpm run test
pnpm run build
```

Requires Node.js 20+ (see `engines` in `package.json`) and pnpm (see `packageManager`).

## Tests

`pnpm test` runs Vitest. Most dialect integration blocks are **env-gated** and skip unless set:

| Variable                  | Used by                           |
| ------------------------- | --------------------------------- |
| `DATABASE_URL`            | Postgres executor + introspection |
| `MYSQL_URL`               | MySQL executor + introspection    |
| `MSSQL_CONNECTION_STRING` | MSSQL executor + introspection    |

CI’s `integration` job (and the release workflow) start Postgres 17, MySQL 8.4, and SQL Server 2022
and set these variables so the gated tests actually run.

## Pull requests

- Prefer conventional commits (`feat:`, `fix:`, `docs:`, …) — releases are driven by semantic-release.
- Keep dialect changes behind their existing subpath; do not pull optional drivers into the root
  entry (`src/index.ts` must stay driver-free).
