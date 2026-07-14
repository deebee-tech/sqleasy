import type { Dialect } from '../configuration/configuration';
import { BuilderType } from '../enums/builder-type';
import { OrderByDirection } from '../enums/order-by-direction';
import type { ParserMode } from '../enums/parser-mode';
import { quoteIdentifier } from '../helpers/identifier';
import { SqlHelper } from '../helpers/sql';
import type { QueryState } from '../state/query';

export const defaultOrderBy = (state: QueryState, config: Dialect, mode: ParserMode): SqlHelper => {
  const sqlHelper = new SqlHelper(mode);

  if (state.orderByStates.length === 0) {
    return sqlHelper;
  }

  sqlHelper.addSqlSnippet('ORDER BY ');

  state.orderByStates.forEach((orderByState, i) => {
    if (orderByState.builderType === BuilderType.OrderByRaw) {
      sqlHelper.addSqlSnippet(orderByState.raw ?? '');

      if (i < state.orderByStates.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }

      return;
    }

    if (orderByState.builderType === BuilderType.OrderByColumn) {
      sqlHelper.addSqlSnippet(
        quoteIdentifier(orderByState.tableNameOrAlias, config.identifierDelimiters),
      );
      sqlHelper.addSqlSnippet('.');
      sqlHelper.addSqlSnippet(
        quoteIdentifier(orderByState.columnName, config.identifierDelimiters),
      );

      if (orderByState.direction === OrderByDirection.Ascending) {
        sqlHelper.addSqlSnippet(' ASC');
      } else {
        sqlHelper.addSqlSnippet(' DESC');
      }

      if (i < state.orderByStates.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }

      return;
    }
  });

  return sqlHelper;
};
