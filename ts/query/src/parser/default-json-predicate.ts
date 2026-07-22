import type { Dialect } from '../configuration/configuration';
import { DatabaseType } from '../enums/database-type';
import { FullTextMode } from '../enums/full-text-mode';
import { ParserArea } from '../enums/parser-area';
import type { ParserMode } from '../enums/parser-mode';
import { qualifiedColumn } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';
import type { QueryState } from '../state/query';
import type { WhereState } from '../state/where';
import { emitComparisonPredicate } from './comparison-operator';
import { emitFullTextPredicate, emitFullTextValueSuffix } from './default-full-text';
import { emitJsonContainsExpression, emitJsonExtractExpression } from './default-json';

/**
 * Stand-in column name used while rendering a comparison against a JSON extraction, then
 * substituted for the real expression. Deliberately unquotable and unlikely to occur in user data.
 */
const JSON_COLUMN_SENTINEL = '___json___';

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

  // The comparison operators are written against a plain column reference, so the JSON extraction
  // is rendered under a sentinel name and then substituted back in.
  //
  // This used to strip the sentinel by matching three hard-coded PREFIXES (`___json___ `,
  // `LOWER(___json___)`, `NOT (___json___`), which silently assumed every operator puts the column
  // first. Any operator that wraps it instead — `REGEXP_LIKE(col, ?, 'i')` — matches none of them,
  // and the sentinel leaks into the emitted SQL as a nonexistent column. Substituting every
  // occurrence works for any operator shape and cannot fall through to a wrong answer.
  const jsonScratch = new SqlHelper(mode);
  emitJsonExtractExpression(
    jsonScratch,
    config,
    state.tableNameOrAlias,
    state.columnName,
    state.jsonPath,
    state.jsonExtractMode,
    area,
  );
  const jsonSql = jsonScratch.getSql();

  const scratch = new SqlHelper(mode);
  emitComparisonPredicate(
    scratch,
    config,
    JSON_COLUMN_SENTINEL,
    state.whereOperator,
    state.values[0],
    area,
  );

  const predicate = scratch.getSql().split(JSON_COLUMN_SENTINEL).join(jsonSql);

  if (predicate.includes(JSON_COLUMN_SENTINEL)) {
    throw new ParserError(area, 'JSON predicate failed to resolve its column reference');
  }

  // The extraction's own bound values come first because it is leftmost in every operator shape
  // emitted here; positional placeholders would otherwise bind in the wrong order.
  sqlHelper.addSqlSnippetWithValues(predicate, [
    ...jsonScratch.getValues(),
    ...scratch.getValues(),
  ]);
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
  sqlHelper.addSqlSnippet(
    qualifiedColumn(tableNameOrAlias, columnName, config.identifierDelimiters),
  );
};

export const defaultJson = (_state: QueryState, _config: Dialect, mode: ParserMode): SqlHelper =>
  new SqlHelper(mode);
