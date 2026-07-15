# Changelog

## 0.1.3

Tracks the TypeScript `@deebeetech/sqleasy` **4.0.1** golden corpus (was pinned to 3.0.0).

**No behavior change.** The 4.0.0/4.0.1 releases were refactors and API cleanup — the corpus cases
are byte-identical across v3.0.0 → v4.0.1, so the emitted SQL is unchanged, and conformance still
passes on the Dart VM and under dart2js. The API cleanups were already reflected here: the removed
`Datatype` enum and `JoinOnBuilder.newJoinOnBuilder` were never ported, and
`MultiBuilder.preparedStatements()` was already present.

## 0.1.2

- Docs: rework the README to match the SQLEasy house style — logo lockup, badges, and a full example
  tour (SELECT / WHERE / JOIN / INSERT / UPDATE / DELETE / GROUP BY / CTE / UNION, plus multi-builder
  batches) written in idiomatic Dart. No code changes.

## 0.1.1

- Docs: correct the README, which still described the package as a work in progress after the port
  was already complete. No code changes.

## 0.1.0

First release. A complete Dart port of [`@deebeetech/sqleasy`](https://github.com/deebee-tech/sqleasy),
held to that implementation byte-for-byte by a shared golden corpus.

- **Pure Dart** — no Flutter SDK dependency, no `dart:io`, no `dart:html`. Runs on Flutter mobile,
  desktop and web, and on plain Dart servers.
- **Four dialects** — Postgres, MySQL, SQL Server, and SQLite, each with correct identifier quoting,
  placeholder style, default schema, and transaction wrappers.
- **Fluent builder** — SELECT / INSERT / UPDATE / DELETE, plus joins, groups, subqueries, CTEs,
  unions, and batched transactions. Every mutator returns the builder, so chaining and cascades both
  work. `parsePrepared()` hands you the SQL string and its ordered bound parameters.
- **Idiomatic API** — named/optional parameters instead of empty-string sentinels, Dart 3 records for
  batch methods, `Object?` value slots.
- **Verified against the corpus** — all 189 golden cases replayed across all four dialects, passing
  on the Dart VM *and* under dart2js. That cross-platform equality is what guarantees the package
  emits identical SQL on Flutter mobile and Flutter web; see `goldens/README.md`.
