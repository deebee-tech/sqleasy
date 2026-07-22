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
 * A branch's own paging clauses — the ones that need parentheses AND that some engines forbid
 * inside an operand.
 */
const branchPages = (branch: QueryState): boolean =>
  branch.orderByStates.length > 0 || branch.limit > 0 || branch.offset !== undefined;

/**
 * A branch that is ITSELF a set operation, i.e. the caller expressed a grouped operand.
 *
 * `A UNION ALL (B UNION C)` is not `A UNION ALL B UNION C`. Every engine reads the flat form as
 * `(A UNION ALL B) UNION C`, so the outer UNION ALL's duplicates get deduplicated by an inner UNION
 * that was never meant to see them. Measured on customers {1,2,3} with A=id<=2, B=id>=2, C=id=3:
 * the grouped form returns 4 rows (1,2,3,2) and the flat form 3. No error either way.
 *
 * This is a scoping need with a DIFFERENT dialect profile from {@link branchPages}: it wants only
 * the parentheses, and three of four engines are happy to give them.
 */
const branchGroups = (branch: QueryState): boolean => branch.unionStates.length > 0;

/**
 * Does this set-operation BRANCH need parentheses to mean what the caller wrote?
 *
 * Everything else a branch can carry — `DISTINCT`, MSSQL's `TOP (n)`, the whole WHERE/GROUP BY/
 * HAVING stack — is already lexically bound to its own SELECT and needs no help. (Verified:
 * `UNION ALL SELECT TOP (3) * FROM b` caps the OPERAND on MSSQL, returning 3 rows from it rather
 * than 3 from the union.)
 */
const branchIsScoped = (branch: QueryState): boolean => branchPages(branch) || branchGroups(branch);

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
 * ── THE REFUSALS SPLIT BY REASON, NOT BY DIALECT ──
 * The two failing engines fail at different points, so a blanket per-dialect refusal is wrong:
 *
 *   SQLite  cannot parenthesize an operand AT ALL, so it refuses every scoping need — a grouped
 *           operand as much as a paged one.
 *   MSSQL   parenthesizes happily, so a GROUPED operand is fine (measured: the nested form returns
 *           the 4 correct rows). What it cannot do is PAGE inside an operand: T-SQL allows no
 *           ORDER BY there, and `limit()` renders as OFFSET/FETCH, which requires one. Its one real
 *           branch cap is `top(n)`, which needs neither and is emitted unparenthesized.
 *
 * Hoisting a branch into a derived table or CTE would fake the refused cases, and that is emulation
 * — the caller can write it with `fromWithBuilder`/`cte` if that is what they meant.
 */
const assertBranchScopeSupported = (branch: QueryState, config: Dialect): void => {
  if (!branchIsScoped(branch)) return;

  if (config.databaseType === DatabaseType.Postgres || config.databaseType === DatabaseType.Mysql) {
    return;
  }

  const name = dialectDisplayName(config.databaseType);

  // SQLite refuses on the parentheses themselves, so BOTH needs are out of reach.
  if (config.databaseType === DatabaseType.Sqlite) {
    const [what, area] = branchGroups(branch)
      ? (['a nested set operation', ParserArea.General] as const)
      : ([
          branch.orderByStates.length > 0 ? 'ORDER BY' : branch.limit > 0 ? 'LIMIT' : 'OFFSET',
          branch.orderByStates.length > 0 ? ParserArea.OrderBy : ParserArea.LimitOffset,
        ] as const);

    throw new ParserError(
      area,
      `${name} cannot scope ${what} to one branch of a set operation — it allows no parenthesized ` +
        `operand at all. Lift the branch into a CTE or a derived table and select from that. ` +
        `Leaving it unparenthesized would change which rows the statement returns.`,
    );
  }

  // MSSQL: grouping is fine, paging is not.
  if (!branchPages(branch)) return;

  const clause =
    branch.orderByStates.length > 0 ? 'ORDER BY' : branch.limit > 0 ? 'LIMIT' : 'OFFSET';
  const area = branch.orderByStates.length > 0 ? ParserArea.OrderBy : ParserArea.LimitOffset;

  throw new ParserError(
    area,
    `${name} cannot scope ${clause} to one branch of a set operation. T-SQL allows no ORDER BY ` +
      `inside a set-operation operand, and its OFFSET/FETCH paging form requires one — cap the ` +
      `branch with top(n), which needs neither, or lift it into a CTE and select from that. ` +
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
