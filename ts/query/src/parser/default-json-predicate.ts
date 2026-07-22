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
  // An EMPTY alias is the library's "unqualified" convention, not a missing table — the same
  // convention `fromTable(name, '')` uses. Requiring it here made an unqualified JSON column
  // impossible to express: `whereJsonExtract('', 'data', '$.x', …)` was rejected as a missing
  // table. Only the column, path and mode are genuinely required; `qualifiedColumn` already
  // handles the empty alias by emitting no prefix.
  if (!state.columnName || !state.jsonPath || !state.jsonExtractMode) {
    throw new ParserError(area, 'JSON extract predicate requires a column, a path, and a mode');
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
    // '' is the unqualified convention; qualifiedColumn() emits no prefix for it.
    state.tableNameOrAlias ?? '',
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
  // As above: an empty alias means unqualified, not missing.
  if (!state.columnName) {
    throw new ParserError(area, 'JSON contains predicate requires a column');
  }

  emitJsonContainsExpression(
    sqlHelper,
    config,
    state.tableNameOrAlias ?? '',
    state.columnName,
    area,
  );
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

/**
 * Refuses a row cap on a subquery used in an `IN` / `NOT IN` / quantified predicate on MySQL.
 *
 * MySQL cannot evaluate a LIMIT inside that specific position and says so plainly. Measured, with
 * the LIMIT as the only variable — a derived table and an EXISTS subquery both take it fine, so the
 * restriction is about the PREDICATE position, not about subqueries in general:
 *
 *     … WHERE o.id IN     (SELECT id FROM orders LIMIT 2)   ERROR 1235
 *     … WHERE o.id NOT IN (SELECT id FROM orders LIMIT 2)   ERROR 1235
 *     … WHERE o.id > ANY  (SELECT id FROM orders LIMIT 2)   ERROR 1235
 *     … WHERE EXISTS      (SELECT id FROM orders LIMIT 2)   accepted
 *     SELECT * FROM       (SELECT id FROM orders LIMIT 2) x accepted
 *
 * "This version of MySQL doesn't yet support 'LIMIT & IN/ALL/ANY/SOME subquery'" — the server's own
 * words, and the reason the refusal names the derived-table rewrite rather than performing it.
 *
 * `offset()` trips the same error on MySQL, because an offset with no limit synthesizes the
 * sentinel `LIMIT 18446744073709551615` in front of it — a LIMIT is a LIMIT to the parser.
 */
export const assertPredicateSubqueryRowCap = (
  subquery: QueryState | undefined,
  config: Dialect,
  area: ParserArea,
): void => {
  if (config.databaseType !== DatabaseType.Mysql || subquery === undefined) return;
  if (subquery.limit === 0 && subquery.offset === undefined) return;

  throw new ParserError(
    area,
    'MySQL cannot evaluate a row cap inside an IN/NOT IN/ANY/ALL subquery — the server reports ' +
      "\"doesn't yet support 'LIMIT & IN/ALL/ANY/SOME subquery'\". Select the capped rows into a " +
      'derived table with fromWithBuilder and join or match against that instead; MySQL accepts a ' +
      'LIMIT there.',
  );
};
