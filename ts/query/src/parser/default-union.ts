import type { Dialect } from '../configuration/configuration';
import { BuilderType } from '../enums/builder-type';
import { DatabaseType } from '../enums/database-type';
import { ParserArea } from '../enums/parser-area';
import type { ParserMode } from '../enums/parser-mode';
import { dialectDisplayName } from '../helpers/dialect-name';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';
import type { QueryState } from '../state/query';
import type { ToSqlOptions } from './to-sql';
import { defaultToSql } from './to-sql';

/**
 * Does this set-operation BRANCH carry a clause whose scope depends on parentheses?
 *
 * `ORDER BY`, `LIMIT` and `OFFSET` are the three. Everything else a branch can carry — `DISTINCT`,
 * MSSQL's `TOP (n)`, the whole WHERE/GROUP BY/HAVING stack — is already lexically bound to its own
 * SELECT and needs no help. (Verified: `UNION ALL SELECT TOP (3) * FROM b` caps the OPERAND on
 * MSSQL, returning 3 rows from it rather than 3 from the union.)
 */
const branchIsScoped = (branch: QueryState): boolean =>
  branch.orderByStates.length > 0 || branch.limit > 0 || branch.offset > 0;

/**
 * Refuses a scoping clause on a branch the dialect cannot scope, and reports whether the operand
 * must be wrapped in parentheses to mean what the caller wrote.
 *
 * ── THE BUG THIS EXISTS TO FIX (found 2026-07-22) ──
 * A branch's `ORDER BY` / `LIMIT` was emitted in the right textual place but with NO parentheses,
 * so it bound to the whole compound instead of the operand it was written on:
 *
 *     .unionAll(u => u.fromTable('b','').selectAll().limit(3))
 *     ->  SELECT * FROM "a" UNION ALL SELECT * FROM "b" LIMIT 3
 *
 * That caps the UNION, not the branch. The statement runs and returns the wrong rows — no error,
 * nothing to notice. Adding an outer `.limit(99)` made it worse still: `LIMIT 3 LIMIT 99`, which
 * Postgres, MySQL and SQLite all reject as a syntax error.
 *
 * ── WHAT EACH ENGINE ACTUALLY DOES (measured against the harness, 2026-07-22) ──
 *
 *     Postgres 17   … UNION ALL (SELECT … ORDER BY id LIMIT 3)   accepted
 *     MySQL 8.4     … UNION ALL (SELECT … ORDER BY id LIMIT 3)   accepted
 *     MSSQL 2022    … UNION ALL (SELECT id FROM t)               accepted — parens are FINE
 *                   … UNION ALL (SELECT TOP (2) id FROM t)       accepted
 *                   … UNION ALL (SELECT … ORDER BY id)           Msg 156
 *                   … UNION ALL (SELECT … OFFSET 0 ROWS FETCH …) Msg 156
 *                   SELECT TOP (3) … UNION ALL SELECT …          accepted — the operand IS capped
 *     SQLite 3.51   … UNION ALL (SELECT id FROM t)               near "(": syntax error
 *                   SELECT … LIMIT 3 UNION ALL SELECT …          "LIMIT clause should come after
 *                                                                 UNION ALL not before"
 *
 * The two engines fail for DIFFERENT reasons, and an earlier version of this comment got MSSQL
 * wrong — it claimed T-SQL rejects a parenthesized operand, which is false and was measured false.
 * The first probe used `(SELECT TOP (3) … ORDER BY id)`, so the Msg 156 it produced was about the
 * ORDER BY, not the parentheses; testing the parentheses on their own accepts. SQLite is the only
 * one that rejects the parentheses themselves.
 *
 * MSSQL still cannot scope a branch row cap, but because T-SQL allows no ORDER BY inside a
 * set-operation operand at all — and `limit()` on MSSQL renders as OFFSET/FETCH, which REQUIRES an
 * ORDER BY. Its one real branch cap is `top(n)`, which needs neither. So the refusals below stand;
 * only the reason given for MSSQL had to be corrected. Hoisting the branch into a derived table or
 * CTE would fake it on both, and that is emulation — the caller can write it with
 * `fromWithBuilder`/`cte` if that is what they meant.
 */
const assertBranchScopeSupported = (branch: QueryState, config: Dialect): void => {
  if (!branchIsScoped(branch)) return;

  if (config.databaseType === DatabaseType.Postgres || config.databaseType === DatabaseType.Mysql) {
    return;
  }

  const clause =
    branch.orderByStates.length > 0 ? 'ORDER BY' : branch.limit > 0 ? 'LIMIT' : 'OFFSET';
  const area = branch.orderByStates.length > 0 ? ParserArea.OrderBy : ParserArea.LimitOffset;
  const name = dialectDisplayName(config.databaseType);

  const remedy =
    config.databaseType === DatabaseType.Mssql
      ? 'T-SQL allows no ORDER BY inside a set-operation operand, and its OFFSET/FETCH paging form ' +
        'requires one — cap the branch with top(n), which needs neither, or lift it into a CTE and ' +
        'select from that'
      : 'SQLite allows no parenthesized operand and no LIMIT before the set operator — lift the ' +
        'branch into a CTE or a derived table and select from that';

  throw new ParserError(
    area,
    `${name} cannot scope ${clause} to one branch of a set operation. ${remedy}. ` +
      `Setting it on the outer builder instead applies it to the whole result, which is a ` +
      `different query.`,
  );
};

export const defaultUnion = (
  state: QueryState,
  config: Dialect,
  mode: ParserMode,
  options?: ToSqlOptions,
): SqlHelper => {
  const sqlHelper = new SqlHelper(mode);

  if (state.unionStates.length === 0) {
    return sqlHelper;
  }

  for (let i = 0; i < state.unionStates.length; i++) {
    const unionState = state.unionStates[i]!;

    switch (unionState.builderType) {
      case BuilderType.Union:
        sqlHelper.addSqlSnippet('UNION ');
        break;
      case BuilderType.UnionAll:
        sqlHelper.addSqlSnippet('UNION ALL ');
        break;
      case BuilderType.Intersect:
        sqlHelper.addSqlSnippet('INTERSECT ');
        break;
      case BuilderType.Except:
        sqlHelper.addSqlSnippet('EXCEPT ');
        break;
    }

    if (unionState.raw) {
      sqlHelper.addSqlSnippet(unionState.raw);
    } else if (unionState.subquery) {
      assertBranchScopeSupported(unionState.subquery, config);

      const subHelper = defaultToSql(unionState.subquery, config, mode, options);
      // Parenthesized ONLY when the branch carries ORDER BY/LIMIT/OFFSET. Wrapping unconditionally
      // would be wrong twice over: it would rewrite every existing golden, and MSSQL and SQLite
      // reject a parenthesized operand outright.
      const wrap = branchIsScoped(unionState.subquery);
      sqlHelper.addSqlSnippetWithValues(
        wrap ? `(${subHelper.getSql()})` : subHelper.getSql(),
        subHelper.getValues(),
      );
    }

    if (i < state.unionStates.length - 1) {
      sqlHelper.addSqlSnippet(' ');
    }
  }

  return sqlHelper;
};
