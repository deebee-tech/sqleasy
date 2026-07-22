import type { Dialect } from '../configuration/configuration';
import { BuilderType } from '../enums/builder-type';
import { DatabaseType } from '../enums/database-type';
import { JsonExtractMode } from '../enums/json-extract-mode';
import { ParserArea } from '../enums/parser-area';
import type { ParserMode } from '../enums/parser-mode';
import { qualifiedColumn, quoteIdentifier } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';
import type { QueryState } from '../state/query';
import { defaultWindow } from './default-window';
import { emitAggregateCall } from './default-aggregate';
import { emitJsonExtractExpression } from './default-json';
import type { ToSqlOptions } from './to-sql';
import { defaultToSql } from './to-sql';

export const defaultSelect = (
  state: QueryState,
  config: Dialect,
  mode: ParserMode,
  options?: ToSqlOptions,
): SqlHelper => {
  const sqlHelper = new SqlHelper(mode);

  if (state.selectStates.length === 0) {
    throw new ParserError(
      ParserArea.Select,
      'Select statement must have at least one select state',
    );
  }

  sqlHelper.addSqlSnippet('SELECT ');

  if (state.distinctOnColumns && state.distinctOnColumns.length > 0) {
    if (config.databaseType !== DatabaseType.Postgres) {
      throw new ParserError(ParserArea.Select, 'DISTINCT ON is only supported on Postgres');
    }

    if (state.distinct) {
      throw new ParserError(ParserArea.Select, 'Cannot combine distinct() with distinctOn()');
    }

    sqlHelper.addSqlSnippet('DISTINCT ON (');
    state.distinctOnColumns.forEach((column, i) => {
      sqlHelper.addSqlSnippet(
        qualifiedColumn(column.tableNameOrAlias, column.columnName, config.identifierDelimiters),
      );

      if (i < state.distinctOnColumns!.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }
    });
    sqlHelper.addSqlSnippet(') ');
  } else if (state.distinct) {
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
        qualifiedColumn(
          selectState.tableNameOrAlias,
          selectState.columnName,
          config.identifierDelimiters,
        ),
      );

      if (selectState.alias !== '') {
        sqlHelper.addSqlSnippet(' AS ');
        sqlHelper.addSqlSnippet(quoteIdentifier(selectState.alias, config.identifierDelimiters));
      }

      if (i < state.selectStates.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }

      continue;
    }

    if (selectState.builderType === BuilderType.SelectWindow) {
      sqlHelper.addSqlSnippet(selectState.raw ?? '');
      sqlHelper.addSqlSnippet(' ');

      const windowHelper = defaultWindow(
        selectState.window ?? { partitionByStates: [], orderByStates: [], frame: undefined },
        config,
        mode,
      );
      sqlHelper.addSqlSnippetWithValues(windowHelper.getSql(), windowHelper.getValues());

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
      const subHelper = defaultToSql(selectState.subquery, config, mode, options);

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

    if (selectState.builderType === BuilderType.SelectAggregate) {
      emitAggregateCall(
        sqlHelper,
        config,
        selectState.aggregate!,
        selectState.tableNameOrAlias ?? '',
        selectState.columnName ?? '',
        selectState.aggregateDistinct === true,
        ParserArea.Select,
      );

      if (selectState.alias !== '') {
        sqlHelper.addSqlSnippet(' AS ');
        sqlHelper.addSqlSnippet(quoteIdentifier(selectState.alias, config.identifierDelimiters));
      }

      if (i < state.selectStates.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }

      continue;
    }

    if (selectState.builderType === BuilderType.SelectJsonExtract) {
      emitJsonExtractExpression(
        sqlHelper,
        config,
        selectState.tableNameOrAlias ?? '',
        selectState.columnName ?? '',
        selectState.jsonPath ?? '',
        selectState.jsonExtractMode ?? JsonExtractMode.Text,
        ParserArea.Select,
      );

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
