# The golden corpus

`corpus.json` is the **cross-language contract** for SQLEasy. Every implementation — the TypeScript
package in this repo, and the Dart package in
[`sqleasy-dart`](https://github.com/deebee-tech/sqleasy-dart) — must reproduce its output
byte-for-byte, for every dialect.

## Why it exists

The Dart port deliberately does **not** share this library's API: it uses named parameters and
nullable optionals where TypeScript uses positional arguments and empty-string sentinels
(`selectColumn('u', 'id', '')`). So the corpus cannot be a recording of method calls. It describes
**query intent** as a nested list of ops, and each language ships a small _driver_ that replays an
op-list through its own API and returns `(sql, params)`.

Neither driver computes SQL itself. So when the two disagree, that is a disagreement between the two
_implementations_ — which is exactly what we want to catch.

```
corpus.json  ──▶  tests/conformance/driver.ts   (this repo)   ──▶ (sql, params)
             └─▶  test/conformance/driver.dart  (sqleasy-dart) ──▶ (sql, params)
                                                                     must be identical
```

## How the Dart repo consumes it

The corpus is committed and tagged here. `sqleasy-dart` pins a version and fetches it from the tag:

```
https://raw.githubusercontent.com/deebee-tech/sqleasy/v<version>/goldens/corpus.json
```

Its CI replays the corpus on **both the Dart VM and dart2js** (see below) and fails on any
disagreement. So if this library changes the SQL it emits, the Dart repo goes red until it follows.

## Regenerating

```bash
pnpm goldens     # rewrite corpus.json from the current implementation
pnpm test        # verify: the conformance suite replays the frozen corpus
```

The goldens are _generated_, then reviewed and frozen. They are **not** an independent check on the
TypeScript implementation — the hand-written suite in `tests/` is that, and it must stay green.

**Regenerating is a deliberate act, and the diff is the thing to review.** Every changed line is a
change to the SQL this library emits. If you did not mean to change the emitted SQL, a line in that
diff is a bug you just introduced.

## Value tags, and why they matter

Input values carry an explicit type tag:

```jsonc
{ "t": "int",    "v": 5 }      // an integer
{ "t": "double", "v": 5 }      // 5.0 — an integral DOUBLE. Not the same thing.
{ "t": "double", "v": 5.5 }
{ "t": "datetime", "v": "2024-01-15T12:00:00.000Z" }   // always UTC, always Z
```

This is the whole reason the corpus is tagged rather than raw JSON. **JSON cannot distinguish `5`
from `5.0`, but the target languages can — and Dart disagrees with itself:**

|                      | JavaScript                  | Dart VM (Flutter mobile/desktop) | dart2js (Flutter **web**) |
| -------------------- | --------------------------- | -------------------------------- | ------------------------- |
| `5.0` is an integer? | `true` (`Number.isInteger`) | **`false`** (`5.0 is int`)       | **`true`**                |
| `(5.0).toString()`   | `"5"`                       | **`"5.0"`**                      | `"5"`                     |

JavaScript has one number type, so it renders an integral double exactly like an int: `= 5`, and
MSSQL declares it `@p0 tinyint`. **That is the frozen contract.** A Dart port that renders it
directly emits `= 5.0` and `@p0 float` on Flutter mobile — and, because dart2js collapses the types,
_silently passes on Flutter web while failing on mobile_.

So the Dart implementation must normalize an integral double to its integer rendering, in one
central place, using a platform-independent predicate:

```dart
bool isIntegral(num v) => v is int || (v is double && v.isFinite && v == v.roundToDouble());
```

and its CI must run `dart test` **and** `dart test -p chrome`. Running only one of them cannot catch
this class of bug.

Bound parameters (`expect.<dialect>.prepared.params`) are tagged `num` rather than `int`/`double`,
because at the driver boundary no dialect distinguishes them and Dart's `5 == 5.0` is true anyway.
The int/double distinction is pinned where it is actually observable: in the golden SQL **text**.

## Schema

See [`../tests/conformance/types.ts`](../tests/conformance/types.ts) for the authoritative schema,
and [`../tests/conformance/driver.ts`](../tests/conformance/driver.ts) for the complete op
vocabulary — a case may only use ops that appear in that driver's `switch` statements.

Cases with an `expect.<dialect>.throws` must be **rejected** by the implementation; the string is
matched as a substring of the error message.

`dialects` narrows a case to the dialects where the behaviour exists (e.g. MSSQL's `TOP`). Omitting
it means all four, which is the default — cross-dialect divergence is the most valuable thing this
corpus captures.
