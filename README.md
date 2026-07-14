# SQLEasy for Dart

**A dialect-aware SQL builder for Postgres, MySQL, SQL Server and SQLite — bring your own connection.**

SQLEasy composes dialect-correct SELECT / INSERT / UPDATE / DELETE — plus CTEs, unions, and batched
transactions — with a fluent API, and hands you the SQL string and its bound parameters.

It is **not** a driver and **not** an ORM. You bring your own connection (`postgres`, `mysql_client`,
`sqflite`, `drift`, …) and execute what SQLEasy generates. That focus is the point: correct SQL for
four dialects — identifier quoting, placeholder style, default schemas, transaction wrappers — and
nothing you have to wire around.

This is the Dart port of [`@deebeetech/sqleasy`](https://github.com/deebee-tech/sqleasy).

## Pure Dart, so it runs everywhere

There is **no Flutter SDK dependency**, no `dart:io`, no `dart:html`, and no platform channels — the
package is pure string and data manipulation. It runs on Flutter mobile, desktop **and web**, and on
plain Dart servers.

## Status

**Work in progress.** The value-rendering layer is complete and verified against the shared golden
corpus on both the Dart VM and dart2js. The builder, parser and dialects are next.

| | |
|---|---|
| ✅ | Value rendering (`lib/src/values/`) — numbers, dates, MSSQL parameter typing |
| ✅ | Golden-corpus harness, running on the VM **and** dart2js |
| ⬜ | Query state, parser, dialects |
| ⬜ | `QueryBuilder`, `MultiBuilder`, `JoinOnBuilder` |
| ⬜ | Full conformance driver (replays all 189 corpus cases) |

## How correctness is guaranteed

This package is held to the TypeScript implementation **byte-for-byte** by a shared golden corpus:
189 cases replayed against all four dialects. Both languages run the same cases through their own
driver and must emit identical `(sql, params)`. See [`goldens/README.md`](goldens/README.md).

### The trap this design exists to prevent

JavaScript has one number type. Dart has `int` and `double` — **and Dart does not agree with itself
across platforms:**

| expression | Dart VM (Flutter mobile/desktop) | dart2js (Flutter **web**) |
|---|---|---|
| `5.0 is int` | `false` | **`true`** |
| `(5.0).toString()` | `"5.0"` | **`"5"`** |
| `double.infinity is int` | `false` | **`true`** |

So a naive port emits **different SQL on Flutter web than on Flutter mobile**, from the same source,
with nothing thrown and nothing logged: `5.0` binds as `@p0 tinyint` / `= 5` on the web and
`@p0 float` / `= 5.0` on mobile.

Every value therefore passes through one place — [`lib/src/values/sql_value.dart`](lib/src/values/sql_value.dart)
— which is written to be platform-independent, and **the test suite runs on both platforms**:

```bash
dart test              # the Dart VM — Flutter mobile and desktop
dart test -p chrome    # dart2js — Flutter web. NOT redundant. Not optional.
```

That second command has already caught two real bugs in this package. Running only one of them
cannot see this class of failure.

## Development

```bash
dart pub get
dart analyze
dart test
dart test -p chrome

dart run tool/fetch_goldens.dart    # pull the pinned corpus from the TypeScript repo's tag
dart run tool/embed_goldens.dart    # re-embed it for the dart2js test run
```

## License

MIT
