import type { Dialect } from '../configuration/configuration';
import { DatabaseType } from '../enums/database-type';
import { ParserArea } from '../enums/parser-area';
import type { ParserMode } from '../enums/parser-mode';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';
import type { QueryState } from '../state/query';

export const defaultLimitOffset = (
  state: QueryState,
  config: Dialect,
  mode: ParserMode,
): SqlHelper => {
  const sqlHelper = new SqlHelper(mode);

  if (state.limit === 0 && state.offset === 0) {
    return sqlHelper;
  }

  if (
    config.databaseType === DatabaseType.Mysql ||
    config.databaseType === DatabaseType.Postgres ||
    config.databaseType === DatabaseType.Sqlite
  ) {
    if (state.limit > 0) {
      sqlHelper.addSqlSnippet('LIMIT ');
      sqlHelper.addSqlSnippet(state.limit.toString());
    }

    if (
      state.limit === 0 &&
      !state.isInnerStatement &&
      (state.whereStates === null ||
        state.whereStates === undefined ||
        state.whereStates.length === 0)
    ) {
      sqlHelper.addSqlSnippet('LIMIT ');
      sqlHelper.addSqlSnippet(config.runtimeConfiguration.maxRowsReturned.toString());
    }

    if (state.offset > 0) {
      if (state.limit > 0) {
        sqlHelper.addSqlSnippet(' ');
      }

      sqlHelper.addSqlSnippet(' OFFSET ');
      sqlHelper.addSqlSnippet(state.offset.toString());
    }
  }

  if (config.databaseType === DatabaseType.Mssql) {
    if (
      state.customState !== null &&
      state.customState !== undefined &&
      state.customState['top'] !== null &&
      state.customState['top'] !== undefined &&
      (state.limit > 0 || state.offset > 0)
    ) {
      throw new ParserError(
        ParserArea.LimitOffset,
        'MSSQL should not use both TOP and LIMIT/OFFSET in the same query',
      );
    }

    if (state.limit > 0 || state.offset > 0) {
      sqlHelper.addSqlSnippet('OFFSET ');
      sqlHelper.addSqlSnippet(state.offset.toString());
      sqlHelper.addSqlSnippet(' ROWS');
    }

    if (state.limit > 0) {
      sqlHelper.addSqlSnippet(' ');

      sqlHelper.addSqlSnippet('FETCH NEXT ');
      sqlHelper.addSqlSnippet(state.limit.toString());
      sqlHelper.addSqlSnippet(' ROWS ONLY');
    }
  }

  if (
    state.offset > 0 &&
    (state.orderByStates === null ||
      state.orderByStates === undefined ||
      state.orderByStates.length === 0)
  ) {
    throw new ParserError(ParserArea.LimitOffset, 'ORDER BY is required when using OFFSET');
  }

  return sqlHelper;
};
