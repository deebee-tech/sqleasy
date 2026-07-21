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

## One seeding path

`pnpm harness:up` starts the containers and seeds them; `pnpm harness:seed` re-seeds without a
restart. **That one command is the only way any of these databases gets its schema**, and every seed
file is idempotent so it can be re-applied over an existing one.

That is a deliberate design, not an accident of convenience — no container mounts a seed file, and
both of the obvious alternatives fail SILENTLY:

- **`/docker-entrypoint-initdb.d` runs only on an empty data directory.** Postgres and MySQL were
  seeded this way, so editing `postgres.sql` or `mysql.sql` and running the documented re-seed command
  applied _nothing_. The corpora then replayed against the previous schema and passed or failed for
  the wrong reason. The stale read was total, and there was no error anywhere to notice.
- **A single-FILE bind mount binds an inode.** Every editor that writes by replace-and-rename leaves
  the container reading the original file forever, so the seed silently applies a stale schema. That
  one cost an hour chasing a phantom syntax error out of a half-written file.

Piping over stdin has neither failure mode: it reads the host file as it is right now, every time.

**So: if you edit a seed, run `pnpm harness:seed` and the change is live.** If you ever find yourself
reaching for `docker compose rm -sfv` to pick up a seed edit, something has regressed back into one
of the traps above.

## Status

The seeds, both corpora, and the TypeScript and Dart replays are all live. Corpus C (normalization)
and corpus D (introspection) run against these databases in CI, and the integration lanes are run
under more than one `TZ` on purpose — several real bugs here were visible only as a disagreement
between two timezones.
