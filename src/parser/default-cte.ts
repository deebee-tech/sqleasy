import type { Dialect } from '../configuration/configuration';
import { BuilderType } from '../enums/builder-type';
import { DatabaseType } from '../enums/database-type';
import type { ParserMode } from '../enums/parser-mode';
import { quoteIdentifier } from '../helpers/identifier';
import { SqlHelper } from '../helpers/sql';
import type { QueryState } from '../state/query';
import type { ToSqlOptions } from './to-sql';
import { defaultToSql } from './to-sql';

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
