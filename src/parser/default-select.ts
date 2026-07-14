import type { Dialect } from '../configuration/configuration';
import { BuilderType } from '../enums/builder-type';
import { ParserArea } from '../enums/parser-area';
import type { ParserMode } from '../enums/parser-mode';
import { quoteIdentifier } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';
import type { QueryState } from '../state/query';
import type { ToSqlOptions } from './to-sql';
import { defaultToSql } from './to-sql';

export const defaultSelect = (
  state: QueryState,
  config: Dialect,
  mode: ParserMode,
  options?: ToSqlOptions,
): SqlHelper => {
  const sqlHelper = new SqlHelper(config, mode);

  if (state.selectStates.length === 0) {
    throw new ParserError(
      ParserArea.Select,
      'Select statement must have at least one select state',
    );
  }

  sqlHelper.addSqlSnippet('SELECT ');

  if (state.distinct) {
    sqlHelper.addSqlSnippet('DISTINCT ');
  }

  if (options?.beforeSelectColumns) {
    options.beforeSelectColumns(state, config, sqlHelper);
  }

  for (let i = 0; i < state.selectStates.length; i++) {
    const selectState = state.selectStates[i]!;

    if (selectState.builderType === BuilderType.SelectAll) {
      sqlHelper.addSqlSnippet('*');

      if (i < state.selectStates.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }
    }

    if (selectState.builderType === BuilderType.SelectRaw) {
      sqlHelper.addSqlSnippet(selectState.raw ?? '');
      if (i < state.selectStates.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }
      continue;
    }

    if (selectState.builderType === BuilderType.SelectColumn) {
      sqlHelper.addSqlSnippet(
        quoteIdentifier(selectState.tableNameOrAlias, config.identifierDelimiters),
      );
      sqlHelper.addSqlSnippet('.');
      sqlHelper.addSqlSnippet(quoteIdentifier(selectState.columnName, config.identifierDelimiters));

      if (selectState.alias !== '') {
        sqlHelper.addSqlSnippet(' AS ');
        sqlHelper.addSqlSnippet(quoteIdentifier(selectState.alias, config.identifierDelimiters));
      }

      if (i < state.selectStates.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }

      continue;
    }

    if (selectState.builderType === BuilderType.SelectBuilder) {
      const subHelper = defaultToSql(selectState.subquery, config, mode);

      sqlHelper.addSqlSnippetWithValues(`(${subHelper.getSql()})`, subHelper.getValues());

      if (selectState.alias !== '') {
        sqlHelper.addSqlSnippet(' AS ');
        sqlHelper.addSqlSnippet(quoteIdentifier(selectState.alias, config.identifierDelimiters));
      }

      if (i < state.selectStates.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }

      continue;
    }
  }

  return sqlHelper;
};
