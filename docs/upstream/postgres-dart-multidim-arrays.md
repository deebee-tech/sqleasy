# Upstream bug report (DRAFT — not yet filed)

**Package:** [`postgres`](https://pub.dev/packages/postgres) 3.5.12 (Dart)
**Severity:** silent data corruption — no exception, wrong values
**Found:** 2026-07-21, by SQLEasy's corpus C conformance replay
**Status:** written up, **not submitted** — see "Before filing" below

---

## Summary

Every **multi-dimensional array** is decoded incorrectly. The values returned are wrong, no exception
is raised, and the corruption is not limited to any one element type — `int`, `text` and `timestamp`
are all affected. One-dimensional arrays of the same types decode correctly.

The server sends the right bytes: casting the identical expression to `::text` returns correct data on
every case below. The loss happens in the client's binary decoder.

## Reproduction

Self-contained; depends only on `package:postgres`.

```dart
import 'package:postgres/postgres.dart' as pg;

Future<void> main() async {
  final c = await pg.Connection.open(
    pg.Endpoint(host: 'localhost', database: 'postgres', username: '…', password: '…'),
    settings: const pg.ConnectionSettings(sslMode: pg.SslMode.disable),
  );
  for (final sql in [
    "ARRAY[1,2,3]",                                  // control
    "ARRAY[ARRAY[1,2],ARRAY[3,4]]",
    "ARRAY['a','b']",                                // control
    "ARRAY[ARRAY['a','b']]",
    "ARRAY[TIMESTAMP '2024-04-01 10:00:00']",        // control
    "ARRAY[ARRAY[TIMESTAMP '2024-04-01 10:00:00']]",
  ]) {
    final binary = (await c.execute('SELECT $sql AS v')).first.first;
    final text = (await c.execute('SELECT ($sql)::text AS v')).first.first;
    print('binary=$binary  text=$text');
  }
  await c.close();
}
```

### Observed

| expression                                      | decoded (binary)                       | `::text` from the same server |
| ----------------------------------------------- | -------------------------------------- | ----------------------------- |
| `ARRAY[1,2,3]`                                  | `[1, 2, 3]` ✅                         | `{1,2,3}`                     |
| `ARRAY[ARRAY[1,2],ARRAY[3,4]]`                  | **`[1, 1]`** ❌                        | `{{1,2},{3,4}}`               |
| `ARRAY['a','b']`                                | `[a, b]` ✅                            | `{a,b}`                       |
| `ARRAY[ARRAY['a','b']]`                         | **`[\x00\x00]`** ❌                    | `{{a,b}}`                     |
| `ARRAY[TIMESTAMP '2024-04-01 10:00:00']`        | `[2024-04-01 10:00:00.000Z]` ✅        | `{"2024-04-01 10:00:00"}`     |
| `ARRAY[ARRAY[TIMESTAMP '2024-04-01 10:00:00']]` | **`[2000-01-01 01:11:34.967304Z]`** ❌ | `{{"2024-04-01 10:00:00"}}`   |

Four integers become two wrong integers. No error is raised in any case.

## Cause

`lib/src/types/binary_codec.dart`, `readListBytes` (≈ line 1094):

```dart
final reader = ByteDataReader()..add(data);
reader.read(12);                 // header
final decoded = <V?>[];
final size = reader.readInt32();
reader.read(4);                  // index
for (var i = 0; i < size; i++) { … }
```

PostgreSQL's binary array format is:

```
int32  ndim
int32  flags
int32  element_oid
{ int32 dim_size, int32 lower_bound }   × ndim      <-- ONE PAIR PER DIMENSION
elements…
```

The decoder consumes the 12-byte header and then exactly **one** `(dim_size, lower_bound)` pair,
regardless of `ndim` — which it never reads. For `ndim == 2` the reader is left pointing at the
_second_ dimension's header, and the loop consumes those 8 bytes as if they were an element's length
prefix and payload. Hence `ARRAY[ARRAY[1,2],ARRAY[3,4]]` yielding `[1, 1]`: the "elements" it reads
are dimension metadata.

## Suggested fix

Two parts, and the second is an API decision for the maintainers:

1. **Stop corrupting.** Read `ndim` and consume `ndim` dimension pairs before the element loop, using
   the product of the dimension sizes as the element count:

   ```dart
   final reader = ByteDataReader()..add(data);
   final ndim = reader.readInt32();
   reader.read(8);                       // flags + element_oid
   var size = 1;
   for (var d = 0; d < ndim; d++) {
     size *= reader.readInt32();         // dim_size
     reader.read(4);                     // lower_bound
   }
   ```

   This alone makes the returned values correct, flattened in row-major order.

2. **Decide the shape.** `readListBytes` returns a flat `List<V?>`, so even with (1) a 2-D array
   arrives flattened and the dimensions are lost. Returning a nested list would be more faithful but
   changes the public return type. Flattening-but-correct is strictly better than today either way,
   and could ship first.

A regression test asserting `ARRAY[ARRAY[1,2],ARRAY[3,4]]` decodes to something containing all four
values would have caught this, and would catch it again.

## Environment

- `postgres` 3.5.12, Dart stable, macOS (arm64)
- PostgreSQL 17 (`postgres:17` container), verified with `sslMode: disable` and TLS
- Reproduces identically under `TZ=America/New_York` and `TZ=Asia/Tokyo` — the wrong values are not
  timezone-dependent, so this is not a temporal-handling issue

---

## Before filing

Search the tracker first — this may already be reported. If it is, add the `int`/`text` cases, which
show the bug is not temporal-specific.

## How SQLEasy handles it meanwhile

The engine cannot work around this: the bytes are already lost by the time a value reaches
normalization, so there is nothing correct to recurse into. Rather than weaken the golden to match a
driver defect, the corpus keeps the correct expectation and the Dart replay records the gap by name —
see `knownGaps` in `dart/engine/test/conformance/normalization_test.dart`, which carries the full
cause and is asserted to still name a real corpus case. The TypeScript port replays the same case and
passes.
