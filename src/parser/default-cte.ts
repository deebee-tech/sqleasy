import type { Dialect } from '../configuration/configuration';
import { BuilderType } from '../enums/builder-type';
import type { ParserMode } from '../enums/parser-mode';
import { quoteIdentifier } from '../helpers/identifier';
import { SqlHelper } from '../helpers/sql';
import type { QueryState } from '../state/query';
import { defaultToSql } from './to-sql';

export const defaultCte = (state: QueryState, config: Dialect, mode: ParserMode): SqlHelper => {
  const sqlHelper = new SqlHelper(mode);

  if (state.cteStates.length === 0) {
    return sqlHelper;
  }

  const hasRecursive = state.cteStates.some((cte) => cte.recursive);

  if (hasRecursive) {
    sqlHelper.addSqlSnippet('WITH RECURSIVE ');
  } else {
    sqlHelper.addSqlSnippet('WITH ');
  }

  for (let i = 0; i < state.cteStates.length; i++) {
    const cteState = state.cteStates[i]!;

    sqlHelper.addSqlSnippet(quoteIdentifier(cteState.name, config.identifierDelimiters));
    sqlHelper.addSqlSnippet(' AS (');

    if (cteState.builderType === BuilderType.CteRaw) {
      sqlHelper.addSqlSnippet(cteState.raw ?? '');
    } else if (cteState.subquery) {
      const subHelper = defaultToSql(cteState.subquery, config, mode);
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
