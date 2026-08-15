import { describe, expect, it } from 'vitest';
import { createMssqlExecutor } from '../src/mssql';

/**
 * THE acceptance test for what SQLEasy's MSSQL output does to a server's plan cache.
 *
 * Everything else in this repo can assert the SQL we *emit*. Only a real server can answer the
 * question that actually matters: does running one query shape a thousand times leave ONE plan in
 * the cache, or a thousand? That is the difference between a warm server and one burning its CPU on
 * `RESOURCE_SEMAPHORE_QUERY_COMPILE`, and no amount of golden SQL can measure it.
 *
 * What was measured here, against SQL Server 2022 with `optimize for ad hoc workloads` OFF and
 * `PARAMETERIZATION SIMPLE` (i.e. no server-side setting doing the work for us):
 *
 *   - Literal SQL — values written straight into the statement, no wrapper — caches ONE PLAN PER
 *     DISTINCT VALUE, each used exactly once. This is the shape a `toString()`-style renderer emits
 *     and the pathology this file exists to pin.
 *   - BOTH SQLEasy forms cache ONE plan, reused. The self-contained `sp_executesql` form is enough:
 *     its INNER statement text is value-independent, and the outer `exec` batch turns out not to be
 *     cached at all, so it contributes nothing. Bound mode matches it.
 *
 * So bound mode is not what buys plan reuse — the inlined form already does. What bound mode buys is
 * the declaration, which is the subject of the last test.
 *
 * Real SQL Server, gated on MSSQL_CONNECTION_STRING. Its own file, no `vi.mock` — mssql.test.ts
 * mocks the driver module, which would hijack the real one here.
 */
const MSSQL_CONNECTION_STRING = process.env['MSSQL_CONNECTION_STRING'];

/**
 * `DBCC FREEPROCCACHE` evicts the WHOLE server's plan cache. That is fine against the throwaway
 * harness container and career-limiting against anything else, so the test refuses to run unless
 * the connection string points at a local server. A gate on the env var alone is not enough: the
 * variable is exactly the kind of thing that gets pointed at a staging box "just to see".
 */
const isLocal = (connectionString: string): boolean =>
  /Server=(localhost|127\.0\.0\.1|\.|\(local\))\b/i.test(connectionString);

const EXECUTIONS = 25;

// The three renderings of ONE query, `SELECT * FROM _sqleasy_plan_probe AS p WHERE p.id = <n>`.
// The SQLEasy pair is verbatim parser output rather than hand-approximation; the engine package does
// not depend on the query package, so they are pinned here the way mssql.integration.test.ts pins
// its INSERT.

/** What a `toString()`-style renderer emits: the value is part of the statement text. */
const literal = (id: number) => ({
  sql: `SELECT * FROM [dbo].[_sqleasy_plan_probe] AS [p] WHERE [p].[id] = ${id};`,
  params: [] as never[],
});

/** SQLEasy's default: self-contained, values in the EXEC argument list, inner statement stable. */
const inlined = (id: number) => ({
  sql:
    `SET NOCOUNT ON; exec sp_executesql N'SELECT * FROM [dbo].[_sqleasy_plan_probe] AS [p] ` +
    `WHERE [p].[id] = @p0;', N'@p0 int', @p0 = ${id};`,
  params: [] as never[],
});

/** SQLEasy under `mssqlBoundParameters`: placeholders only, values bound by the driver. */
const bound = (id: number) => ({
  sql: 'SELECT * FROM [dbo].[_sqleasy_plan_probe] AS [p] WHERE [p].[id] = @p0;',
  params: [id],
});

describe.skipIf(!MSSQL_CONNECTION_STRING || !isLocal(MSSQL_CONNECTION_STRING))(
  'MSSQL plan cache (real database)',
  () => {
    const connect = () => createMssqlExecutor({ connectionString: MSSQL_CONNECTION_STRING! });
    type Db = ReturnType<typeof connect>;

    /**
     * Plans whose text mentions the probe table.
     *
     * The token is SPLIT across a concatenation so this query's own text does not contain it —
     * otherwise the counter counts itself, which reads as an off-by-one that is really a
     * self-reference. `CHARINDEX`, not `LIKE`: in T-SQL `[` opens a character class, so a LIKE
     * pattern containing `[dbo]` silently matches nothing.
     */
    const countPlans = async (db: Db) =>
      (
        await db.run<{ n: number }>({
          sql: `
            SELECT COUNT(*) AS n
            FROM sys.dm_exec_cached_plans p
            CROSS APPLY sys.dm_exec_sql_text(p.plan_handle) t
            WHERE CHARINDEX('_sqleasy_plan' + '_probe', t.text) > 0;`,
        })
      ).rows[0]!.n;

    const setup = async (db: Db) => {
      await db.run({
        sql: "IF OBJECT_ID('_sqleasy_plan_probe') IS NOT NULL DROP TABLE _sqleasy_plan_probe;",
      });
      await db.run({ sql: 'CREATE TABLE _sqleasy_plan_probe (id INT PRIMARY KEY);' });
      await db.run({ sql: 'INSERT INTO _sqleasy_plan_probe (id) VALUES (1), (2), (3);' });
    };

    const teardown = async (db: Db) => {
      await db
        .run({
          sql: "IF OBJECT_ID('_sqleasy_plan_probe') IS NOT NULL DROP TABLE _sqleasy_plan_probe;",
        })
        .catch(() => {});
      await db.close();
    };

    /** Runs one rendering `EXECUTIONS` times from a clean cache and reports the resulting plan count. */
    const plansAfter = async (db: Db, render: (id: number) => { sql: string; params: never[] | number[] }) => {
      await db.run({ sql: 'DBCC FREEPROCCACHE;' });
      for (let id = 1; id <= EXECUTIONS; id++) {
        await db.run(render(id));
      }
      return countPlans(db);
    };

    it('caches one plan per value for literal SQL, and one plan total for both SQLEasy forms', async () => {
      const db = connect();
      try {
        await setup(db);

        const literalPlans = await plansAfter(db, literal);
        const inlinedPlans = await plansAfter(db, inlined);
        const boundPlans = await plansAfter(db, bound);

        // The pathology: the value is in the statement text, so every execution is a new statement.
        expect(literalPlans).toBeGreaterThanOrEqual(EXECUTIONS);

        // Both SQLEasy forms hold flat as executions grow. The inlined form is enough on its own —
        // the outer `exec sp_executesql` batch is not cached, so only the stable inner statement is.
        expect(inlinedPlans).toBeLessThanOrEqual(2);
        expect(boundPlans).toBeLessThanOrEqual(2);
      } finally {
        await teardown(db);
      }
    }, 180_000);

    /**
     * What bound mode actually buys, now that the inlined form is known to reuse its plan.
     *
     * `sp_executesql`'s cache key includes the PARAMETER DECLARATION, and the inlined renderer picks
     * that declaration from each value's magnitude: `tinyint` for 200, `smallint` for 5000, `int`
     * beyond that. One query shape therefore splits into a plan per type band even though every
     * execution is the same statement against the same column. Bound mode has no such split — the
     * driver declares `int` across the whole 32-bit range.
     */
    it('splits one shape across type bands when the declaration is inferred per value', async () => {
      const db = connect();
      const declared = (declaration: string, value: number) => ({
        sql:
          `SET NOCOUNT ON; exec sp_executesql N'SELECT * FROM [dbo].[_sqleasy_plan_probe] AS [p] ` +
          `WHERE [p].[id] = @p0;', N'@p0 ${declaration}', @p0 = ${value};`,
        params: [] as never[],
      });

      try {
        await setup(db);
        await db.run({ sql: 'DBCC FREEPROCCACHE;' });

        // Same statement, same column, same value — declared three ways, as the magnitude bands
        // would declare 200, 5000 and 500000.
        await db.run(declared('tinyint', 3));
        await db.run(declared('smallint', 3));
        await db.run(declared('int', 3));
        const banded = await countPlans(db);

        // And the same three executions in bound mode, where the driver declares one type.
        await db.run({ sql: 'DBCC FREEPROCCACHE;' });
        for (const id of [200, 5000, 500000]) {
          await db.run(bound(id));
        }
        const boundPlans = await countPlans(db);

        expect(banded).toBeGreaterThanOrEqual(3);
        expect(boundPlans).toBeLessThanOrEqual(2);
        expect(boundPlans).toBeLessThan(banded);
      } finally {
        await teardown(db);
      }
    }, 180_000);

    /**
     * Why string parameters are declared `varchar` and not `nvarchar`.
     *
     * T-SQL type precedence puts `nvarchar` above `varchar`, so comparing a `varchar` COLUMN to an
     * `nvarchar` parameter converts the column — and a converted column cannot be seeked. The
     * collation decides whether SQL Server can work around it, and `SQL_*` collations cannot;
     * MinistryPlatform runs `SQL_Latin1_General_CP1_CI_AS`, which is what this table reproduces.
     *
     * The reverse never bites, which is what makes `varchar` the safe default rather than a
     * trade: against an `nvarchar` column it is the PARAMETER that converts, one scalar operation,
     * and the seek survives.
     */
    it('seeks a varchar column, which an nvarchar parameter would have scanned', async () => {
      const db = connect();
      const probe = (declaration: string, literal: string) =>
        db.explain({
          sql:
            `SET NOCOUNT ON; exec sp_executesql N'SELECT COUNT(*) AS n FROM [dbo].[_sqleasy_text_probe] ` +
            `WHERE [v] = @p0;', N'@p0 ${declaration}', @p0 = ${literal};`,
        });

      try {
        await db.run({
          sql: "IF OBJECT_ID('_sqleasy_text_probe') IS NOT NULL DROP TABLE _sqleasy_text_probe;",
        });
        await db.run({
          sql: `CREATE TABLE _sqleasy_text_probe (
                  id INT IDENTITY PRIMARY KEY,
                  v VARCHAR(50) COLLATE SQL_Latin1_General_CP1_CI_AS);`,
        });
        await db.run({
          sql: `INSERT INTO _sqleasy_text_probe (v)
                SELECT TOP 5000 CAST(NEWID() AS VARCHAR(50))
                FROM sys.all_objects a CROSS JOIN sys.all_objects b;`,
        });
        await db.run({ sql: 'CREATE NONCLUSTERED INDEX ix_v ON _sqleasy_text_probe (v);' });
        await db.run({ sql: 'UPDATE STATISTICS _sqleasy_text_probe;' });

        const asVarchar = await probe('varchar(max)', "'target'");
        const asNvarchar = await probe('nvarchar(max)', "N'target'");

        // What SQLEasy emits for an ASCII value.
        expect(asVarchar.fullScan).toBe(false);
        // What it used to emit, and what the driver still infers if left to itself.
        expect(asNvarchar.fullScan).toBe(true);
        expect(asVarchar.cost!).toBeLessThan(asNvarchar.cost!);
      } finally {
        await db
          .run({
            sql: "IF OBJECT_ID('_sqleasy_text_probe') IS NOT NULL DROP TABLE _sqleasy_text_probe;",
          })
          .catch(() => {});
        await db.close();
      }
    }, 180_000);
  },
);
