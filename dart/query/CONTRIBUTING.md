# Contributing to dart/query (sqleasy on pub.dev)

This package is the Dart port of `@deebeetech/sqleasy` (`ts/query`) in the
[sqleasy monorepo](https://github.com/deebee-tech/sqleasy).
**TypeScript owns API design, emission, and the golden corpus.** Port behaviour here after each
corpus bump — do not invent dialect SQL in Dart first.

## Workflow

1. Land the change in `ts/query` (with corpus ops as needed).
2. `pnpm goldens`
3. `dart run tool/embed_goldens.dart` (reads `../../contract/corpora/emission/corpus.json`).
4. `dart run tool/gen_views.dart` if the builder surface changed.
5. Extend `test/conformance/driver.dart` if new ops were added.
6. Port builders/parsers to match TypeScript.
7. `dart analyze --fatal-infos && dart format --set-exit-if-changed . && dart test && dart test -p chrome`

## Local checks (match CI)

```bash
dart pub get
dart analyze --fatal-infos
dart format --output=none --set-exit-if-changed .
dart run tool/gen_views.dart --check
dart run tool/verify_embed.dart
dart test
dart test -p chrome
dart run example/sqleasy_example.dart
```

Chrome tests need a Chrome/Chromium host. See [`contract/README.md`](../../contract/README.md) for the corpus contract.
