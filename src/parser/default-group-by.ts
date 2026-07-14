import type { Dialect } from '../configuration/configuration';
import { BuilderType } from '../enums/builder-type';
import type { ParserMode } from '../enums/parser-mode';
import { quoteIdentifier } from '../helpers/identifier';
import { SqlHelper } from '../helpers/sql';
import type { QueryState } from '../state/query';

export const defaultGroupBy = (state: QueryState, config: Dialect, mode: ParserMode): SqlHelper => {
  const sqlHelper = new SqlHelper(mode);

  if (state.groupByStates.length === 0) {
    return sqlHelper;
  }

  sqlHelper.addSqlSnippet('GROUP BY ');

  state.groupByStates.forEach((groupByState, i) => {
    if (groupByState.builderType === BuilderType.GroupByRaw) {
      sqlHelper.addSqlSnippet(groupByState.raw ?? '');

      if (i < state.groupByStates.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }

      return;
    }

    if (groupByState.builderType === BuilderType.GroupByColumn) {
      sqlHelper.addSqlSnippet(
        quoteIdentifier(groupByState.tableNameOrAlias, config.identifierDelimiters),
      );
      sqlHelper.addSqlSnippet('.');
      sqlHelper.addSqlSnippet(
        quoteIdentifier(groupByState.columnName, config.identifierDelimiters),
      );

      if (i < state.groupByStates.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }

      return;
    }
  });

  return sqlHelper;
};
