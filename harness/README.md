# The shared conformance harness

One logical schema and dataset, rendered four ways. Every language port replays the **normalization**
and **introspection** corpora against these exact databases, so a disagreement between two ports is a
real disagreement — never an artifact of different fixtures or different server versions.

```
harness/
  seed/
    postgres.sql   mysql.sql   mssql.sql   sqlite.sql
```

## Why four files for one schema

The four dialects cannot express the same schema with the same DDL — `SERIAL` vs `AUTO_INCREMENT` vs
`IDENTITY`, `boolean` vs `TINYINT(1)` vs `bit`, `TEXT` vs `VARCHAR(MAX)`. The seeds are therefore four
renderings of one logical schema rather than one shared file.

**The proof that the four renderings really are equivalent is the introspection conformance itself:**
all four must introspect to the same canonical schema shape (modulo the documented per-dialect raw
`dataType` string). So there is deliberately no separate "do the seeds match?" check — the contract
already enforces it, and a second check would be a second thing to drift.

## Fail loud, never skip

When `HARNESS_DIALECTS=1` is set and a database is unreachable, every language's integration suite
must **hard-error**. A suite that self-skips on a missing connection reports green having tested
nothing — which is precisely how a dialect silently loses coverage.

## Status

Seeds are authored in Phase 5 alongside the Dart engine pilot, when the normalization and
introspection corpora that consume them are minted. The compose file and the fail-loud rule are in
place now so the shape is fixed before any port is written against it.
