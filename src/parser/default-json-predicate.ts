import type { Dialect } from '../configuration/configuration';
import { DatabaseType } from '../enums/database-type';
import { FullTextMode } from '../enums/full-text-mode';
import { ParserArea } from '../enums/parser-area';
import type { ParserMode } from '../enums/parser-mode';
import { quoteIdentifier } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';
import type { QueryState } from '../state/query';
import type { WhereState } from '../state/where';
import { emitComparisonPredicate } from './comparison-operator';
import {
  emitFullTextPredicate,
  emitFullTextValueSuffix,
} from './default-full-text';
import { emitJsonContainsExpression, emitJsonExtractExpression } from './default-json';

export const emitJsonExtractPredicate = (
  sqlHelper: SqlHelper,
  config: Dialect,
  mode: ParserMode,
  state: Pick<
    WhereState,
    'tableNameOrAlias' | 'columnName' | 'jsonPath' | 'jsonExtractMode' | 'whereOperator' | 'values'
  >,
  area: ParserArea,
): void => {
  if (!state.tableNameOrAlias || !state.columnName || !state.jsonPath || !state.jsonExtractMode) {
    throw new ParserError(area, 'JSON extract predicate requires table, column, path, and mode');
  }

  emitJsonExtractExpression(
    sqlHelper,
    config,
    state.tableNameOrAlias,
    state.columnName,
    state.jsonPath,
    state.jsonExtractMode,
    area,
  );

  const scratch = new SqlHelper(mode);
  emitComparisonPredicate(
    scratch,
    config,
    '___json___',
    state.whereOperator,
    state.values[0],
    area,
  );
  let tail = scratch.getSql();
  if (tail.startsWith('___json___ ')) {
    tail = tail.slice('___json___ '.length);
  } else if (tail.startsWith('LOWER(___json___)')) {
    tail = 'LOWER(' + tail.slice('LOWER(___json___)'.length);
  } else if (tail.startsWith('NOT (___json___')) {
    tail = 'NOT (' + tail.slice('NOT (___json___'.length);
  }

  sqlHelper.addSqlSnippet(' ');
  sqlHelper.addSqlSnippetWithValues(tail, scratch.getValues());
};

export const emitJsonContainsPredicate = (
  sqlHelper: SqlHelper,
  config: Dialect,
  state: Pick<WhereState, 'tableNameOrAlias' | 'columnName' | 'values'>,
  area: ParserArea,
): void => {
  if (!state.tableNameOrAlias || !state.columnName) {
    throw new ParserError(area, 'JSON contains predicate requires table and column');
  }

  emitJsonContainsExpression(sqlHelper, config, state.tableNameOrAlias, state.columnName, area);
  sqlHelper.addDynamicValue(state.values[0]);

  if (config.databaseType === DatabaseType.Postgres) {
    sqlHelper.addSqlSnippet('::jsonb');
  }

  if (config.databaseType === DatabaseType.Mysql) {
    sqlHelper.addSqlSnippet(')');
  }
};

export const emitFullTextMatchPredicate = (
  sqlHelper: SqlHelper,
  config: Dialect,
  columns: NonNullable<WhereState['fullTextColumns']>,
  mode: FullTextMode,
  value: unknown,
  area: ParserArea,
): void => {
  emitFullTextPredicate(sqlHelper, config, columns, mode, area);
  sqlHelper.addDynamicValue(value);
  emitFullTextValueSuffix(sqlHelper, config, mode);
};

/** Emits one GROUP BY column reference. */
export const emitGroupByColumnRef = (
  sqlHelper: SqlHelper,
  config: Dialect,
  tableNameOrAlias: string,
  columnName: string,
): void => {
  sqlHelper.addSqlSnippet(quoteIdentifier(tableNameOrAlias, config.identifierDelimiters));
  sqlHelper.addSqlSnippet('.');
  sqlHelper.addSqlSnippet(quoteIdentifier(columnName, config.identifierDelimiters));
};

export const defaultJson = (_state: QueryState, _config: Dialect, mode: ParserMode): SqlHelper =>
  new SqlHelper(mode);
