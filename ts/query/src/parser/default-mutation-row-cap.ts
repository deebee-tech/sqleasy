import type { Dialect } from '../configuration/configuration';
import { DatabaseType } from '../enums/database-type';
import { ParserArea } from '../enums/parser-area';
import type { ParserMode } from '../enums/parser-mode';
import { ParserError } from '../helpers/parser-error';
import type { SqlHelper } from '../helpers/sql';
import type { QueryState } from '../state/query';
import { defaultOrderBy } from './default-order-by';
import { hasExplicitTop } from './default-limit-offset';

/**
 * Row-capping and ordering on an UPDATE or DELETE — `UPDATE … ORDER BY … LIMIT n`, `DELETE TOP (n)`.
 *
 * ── WHAT WAS WRONG (fixed 2026-07-22) ──
 * `.limit()`, `.offset()`, `.top()` and `.orderByColumn()` were all reachable on a mutation and ALL
 * FOUR were silently dropped: the Update and Delete branches of `to-sql.ts` returned before the
 * ORDER BY and limit/offset blocks, and MSSQL's TOP was emitted only by the `beforeSelectColumns`
 * hook, which only `defaultSelect` calls. So `.limit(1000)` on a DELETE produced no clause, no
 * parameter and no error — the statement deleted the whole table. That is the silent-no-op class
 * the 2.0 rewrite exists to remove; it was closed for SELECT and left open for mutations.
 *
 * ── WHAT EACH ENGINE ACTUALLY DOES (measured against the harness, 2026-07-22) ──
 *
 *     MySQL 8.4     UPDATE/DELETE … ORDER BY … LIMIT n   accepted; ORDER BY alone also accepted
 *                   … LIMIT 1 OFFSET 1                   ERROR 1064 — no OFFSET on a mutation
 *                   multi-table UPDATE … LIMIT 1         ERROR 1221 "Incorrect usage of UPDATE and LIMIT"
 *     MSSQL 2022    UPDATE TOP (n) / DELETE TOP (n)      accepted
 *                   UPDATE TOP (1) … ORDER BY id         Msg 156 "Incorrect syntax near 'ORDER'"
 *     Postgres 17   UPDATE … LIMIT 1                     syntax error at or near "LIMIT"
 *     SQLite 3.51   UPDATE/DELETE … LIMIT 1              syntax error — the syntax needs
 *                                                        SQLITE_ENABLE_UPDATE_DELETE_LIMIT, which is
 *                                                        off in the shipped amalgamation
 *
 * Postgres's `ctid`/CTE workaround and SQLite's subquery rewrite are both emulation, so both dialects
 * refuse rather than approximate. The two that CAN do it keep their own spelling, which is what the
 * existing methods already are: `limit()` is MySQL's native word and `top()` is MSSQL's, and `top`
 * is already MSSQL-only in the typed views. So this needs no new method — only honest emission and
 * honest refusals.
 */

const NO_MUTATION_CAP: Partial<Record<DatabaseType, string>> = {
  [DatabaseType.Postgres]:
    'Postgres has no row limit on UPDATE/DELETE — narrow the WHERE clause, or delete by a key set ' +
    'you selected first (the ctid/CTE rewrite is an emulation this library will not do for you)',
  [DatabaseType.Sqlite]:
    'SQLite has no row limit on UPDATE/DELETE unless it was compiled with ' +
    'SQLITE_ENABLE_UPDATE_DELETE_LIMIT, which the shipped amalgamation is not — narrow the WHERE ' +
    'clause, or delete by a key set you selected first',
};

/**
 * Rejects every row-cap/ordering combination the target engine cannot run.
 *
 * Called from the Update and Delete branches BEFORE any SQL is produced, so a refused statement
 * never reaches a driver. See the measurement table above for where each rule comes from.
 */
export const assertMutationRowCapSupported = (
  state: QueryState,
  config: Dialect,
  area: ParserArea,
): void => {
  const wantsTop = hasExplicitTop(state);
  const wantsLimit = state.limit > 0;
  const wantsOffset = state.offset !== undefined;
  const wantsOrderBy = state.orderByStates.length > 0;

  if (!wantsTop && !wantsLimit && !wantsOffset && !wantsOrderBy) return;

  // OFFSET has no mutation form on ANY of the four — MySQL, the only engine with a mutation LIMIT,
  // rejects `LIMIT 1 OFFSET 1` outright (ERROR 1064).
  if (wantsOffset) {
    throw new ParserError(
      area,
      'offset() has no meaning on UPDATE/DELETE — no dialect supports skipping rows in a mutation',
    );
  }

  if (config.databaseType === DatabaseType.Mssql) {
    if (wantsLimit) {
      throw new ParserError(
        area,
        'MSSQL caps a mutation with TOP, not LIMIT — use top(n). limit() is the SELECT-only ' +
          'OFFSET/FETCH form and T-SQL has no such clause on UPDATE/DELETE',
      );
    }
    if (wantsOrderBy) {
      throw new ParserError(
        area,
        'T-SQL takes no ORDER BY on an UPDATE/DELETE, so TOP (n) picks an arbitrary n rows — ' +
          'select the keys you want in the order you want, then mutate by those keys',
      );
    }
    return;
  }

  if (config.databaseType === DatabaseType.Mysql) {
    // A multi-table UPDATE/DELETE cannot carry LIMIT: ERROR 1221 "Incorrect usage of UPDATE and
    // LIMIT". ORDER BY is refused with it for the same reason — MySQL rejects the pair.
    if ((wantsLimit || wantsOrderBy) && state.joinStates.length > 0) {
      throw new ParserError(
        area,
        'MySQL takes no ORDER BY or LIMIT on a multi-table UPDATE/DELETE (ERROR 1221) — mutate ' +
          'one table at a time, or narrow the join',
      );
    }
    return;
  }

  const refusal = NO_MUTATION_CAP[config.databaseType];
  if (refusal !== undefined) {
    throw new ParserError(area, refusal);
  }
};

/**
 * The `TOP (n) ` prefix for a T-SQL mutation, or `''`.
 *
 * T-SQL's spelling is `UPDATE TOP (n) tbl` / `DELETE TOP (n) FROM tbl`, so this sits between the
 * verb and the target — unlike MySQL's trailing LIMIT. `WITH TIES` is deliberately not accepted
 * here: it requires an ORDER BY, which a T-SQL mutation cannot have.
 */
export const mssqlMutationTop = (state: QueryState, config: Dialect): string => {
  if (config.databaseType !== DatabaseType.Mssql || !hasExplicitTop(state)) return '';
  // Presence, not positivity — `DELETE TOP (0)` is legal and deletes nothing. Testing `> 0` here
  // would turn "delete no rows" into "delete every row", which is the worst possible direction for
  // this particular inversion to go.
  return `TOP (${Number(state.customState!['top'])}) `;
};

/**
 * Emits MySQL's trailing `ORDER BY … LIMIT n` on a mutation.
 *
 * Runs after the WHERE clause, which is where MySQL's grammar puts it. Both parts are optional and
 * independent: `ORDER BY` alone is legal (measured), and so is `LIMIT` alone.
 */
export const emitMutationRowCap = (
  sqlHelper: SqlHelper,
  state: QueryState,
  config: Dialect,
  mode: ParserMode,
): void => {
  if (config.databaseType !== DatabaseType.Mysql) return;

  if (state.orderByStates.length > 0) {
    const orderBy = defaultOrderBy(state, config, mode);
    sqlHelper.addSqlSnippet(' ');
    sqlHelper.addSqlSnippetWithValues(orderBy.getSql(), orderBy.getValues());
  }

  if (state.limit > 0) {
    // Spliced, not bound — the same choice `defaultLimitOffset` makes for SELECT, so the two paths
    // agree. `state.limit` is a number, so there is nothing to escape.
    sqlHelper.addSqlSnippet(` LIMIT ${state.limit}`);
  }
};
