import type { Dialect } from '../configuration/configuration';
import { BuilderType } from '../enums/builder-type';
import { DatabaseType } from '../enums/database-type';
import { ParserArea } from '../enums/parser-area';
import type { ParserMode } from '../enums/parser-mode';
import { dialectDisplayName } from '../helpers/dialect-name';
import { ParserError } from '../helpers/parser-error';
import { quoteIdentifier } from '../helpers/identifier';
import { SqlHelper } from '../helpers/sql';
import type { CteState } from '../state/cte';
import type { QueryState } from '../state/query';
import type { ToSqlOptions } from './to-sql';
import { defaultToSql } from './to-sql';

/**
 * Refuses clauses a RECURSIVE CTE's members cannot carry.
 *
 * SQLEasy renders a recursive CTE body as one builder — `anchor UNION ALL recursive` — so a clause
 * set on that body lands at the END of the body, which is textually inside the RECURSIVE term. That
 * is the one place the engines police. Measured, each construct on its own and against a working
 * baseline recursive CTE that runs on all four:
 *
 *     in the RECURSIVE term      PG    MySQL  SQLite  MSSQL
 *     ORDER BY                   ERR   ERR    ERR     Msg 156     <- every engine
 *     LIMIT                      ERR   OK     OK      (no LIMIT in T-SQL)
 *     SELECT DISTINCT            OK    ERR    OK      ERR
 *     — for contrast —
 *     LIMIT in the ANCHOR term   OK    OK
 *     LIMIT on the OUTER select  OK    OK                          <- where it belongs
 *
 * ORDER BY is refused everywhere because no engine takes it. LIMIT is refused only where the engine
 * refuses it, and the message points at the outer SELECT, which takes it on every dialect. DISTINCT
 * on the recursive member is refused on the two engines that reject it.
 */
const assertRecursiveMembersSupported = (cteState: CteState, config: Dialect): void => {
  const body = cteState.subquery;
  if (!cteState.recursive || body === undefined) return;

  if (body.orderByStates.length > 0) {
    throw new ParserError(
      ParserArea.OrderBy,
      'A recursive CTE cannot ORDER BY inside its own body — no dialect allows it in the recursive ' +
        'term, where a clause set on the body lands. Order the OUTER select instead, which every ' +
        'dialect accepts.',
    );
  }

  if (body.limit > 0 || body.offset !== undefined) {
    if (config.databaseType === DatabaseType.Postgres) {
      throw new ParserError(
        ParserArea.LimitOffset,
        'Postgres cannot LIMIT or OFFSET inside a recursive CTE body — the clause lands in the ' +
          'recursive term, which it rejects. Cap the OUTER select instead, which every dialect ' +
          'accepts, or bound the recursion with a WHERE on the recursive member.',
      );
    }
  }

  // `DISTINCT` on the recursive member — the branch, not the anchor.
  const recursiveMemberIsDistinct = body.unionStates.some(
    (branch) => branch.subquery?.distinct === true,
  );

  if (
    recursiveMemberIsDistinct &&
    (config.databaseType === DatabaseType.Mysql || config.databaseType === DatabaseType.Mssql)
  ) {
    throw new ParserError(
      ParserArea.Select,
      `${dialectDisplayName(config.databaseType)} rejects SELECT DISTINCT on the recursive member ` +
        'of a recursive CTE. Use union() rather than unionAll() if you want duplicate elimination ' +
        'across the recursion, which is where these engines allow it.',
    );
  }
};

export const defaultCte = (
  state: QueryState,
  config: Dialect,
  mode: ParserMode,
  options?: ToSqlOptions,
): SqlHelper => {
  const sqlHelper = new SqlHelper(mode);

  if (state.cteStates.length === 0) {
    return sqlHelper;
  }

  const hasRecursive = state.cteStates.some((cte) => cte.recursive);

  // SQL Server recursive CTEs use bare `WITH` — `RECURSIVE` is not a T-SQL keyword.
  if (hasRecursive && config.databaseType !== DatabaseType.Mssql) {
    sqlHelper.addSqlSnippet('WITH RECURSIVE ');
  } else {
    sqlHelper.addSqlSnippet('WITH ');
  }

  for (let i = 0; i < state.cteStates.length; i++) {
    const cteState = state.cteStates[i]!;
    assertRecursiveMembersSupported(cteState, config);

    sqlHelper.addSqlSnippet(quoteIdentifier(cteState.name, config.identifierDelimiters));

    if (cteState.columns.length > 0) {
      sqlHelper.addSqlSnippet(' (');
      cteState.columns.forEach((column, columnIndex) => {
        sqlHelper.addSqlSnippet(quoteIdentifier(column, config.identifierDelimiters));

        if (columnIndex < cteState.columns.length - 1) {
          sqlHelper.addSqlSnippet(', ');
        }
      });
      sqlHelper.addSqlSnippet(')');
    }

    sqlHelper.addSqlSnippet(' AS (');

    if (cteState.builderType === BuilderType.CteRaw) {
      sqlHelper.addSqlSnippet(cteState.raw ?? '');
    } else if (cteState.subquery) {
      const subHelper = defaultToSql(cteState.subquery, config, mode, options);
      sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
    }

    sqlHelper.addSqlSnippet(')');

    if (i < state.cteStates.length - 1) {
      sqlHelper.addSqlSnippet(', ');
    } else {
      sqlHelper.addSqlSnippet(' ');
    }
  }

  return sqlHelper;
};
