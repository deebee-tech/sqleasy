import type { Dialect } from '../configuration/configuration';
import { DatabaseType } from '../enums/database-type';
import type { ParserArea } from '../enums/parser-area';
import { quoteIdentifier } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';
import type { ReturningState } from '../state/returning';

const emitColumnList = (
  sqlHelper: SqlHelper,
  config: Dialect,
  columns: string[],
  prefix: string | undefined,
): void => {
  for (let i = 0; i < columns.length; i++) {
    if (prefix) {
      sqlHelper.addSqlSnippet(prefix + '.');
    }
    sqlHelper.addSqlSnippet(quoteIdentifier(columns[i], config.identifierDelimiters));

    if (i < columns.length - 1) {
      sqlHelper.addSqlSnippet(', ');
    }
  }
};

const emitColumnsOrRaw = (
  sqlHelper: SqlHelper,
  config: Dialect,
  returningState: ReturningState,
  prefix: string | undefined,
  area: ParserArea,
): void => {
  if (returningState.raw) {
    sqlHelper.addSqlSnippet(returningState.raw);
    return;
  }

  if (returningState.columns.length === 0) {
    throw new ParserError(area, 'RETURNING/OUTPUT requires at least one column');
  }

  emitColumnList(sqlHelper, config, returningState.columns, prefix);
};

/**
 * MSSQL's `OUTPUT` clause. Placed inline by the caller — before `VALUES` for INSERT, before
 * `FROM`/`WHERE` for UPDATE, before `WHERE` for DELETE — because, unlike PG/SQLite's trailing
 * `RETURNING`, T-SQL requires `OUTPUT` in the middle of the statement.
 */
export const emitMssqlOutputClause = (
  sqlHelper: SqlHelper,
  config: Dialect,
  returningState: ReturningState,
  prefix: 'INSERTED' | 'DELETED',
  area: ParserArea,
): void => {
  sqlHelper.addSqlSnippet(' OUTPUT ');
  emitColumnsOrRaw(sqlHelper, config, returningState, prefix, area);
};

/**
 * PG/SQLite's trailing `RETURNING` clause, appended after the whole INSERT/UPDATE/DELETE
 * statement (including its WHERE). MySQL has no equivalent and refuses it here with a clear
 * error rather than silently dropping the columns the caller asked for.
 */
export const emitTrailingReturningClause = (
  sqlHelper: SqlHelper,
  config: Dialect,
  returningState: ReturningState,
  area: ParserArea,
): void => {
  if (config.databaseType === DatabaseType.Mysql) {
    throw new ParserError(area, 'MySQL does not support RETURNING');
  }

  sqlHelper.addSqlSnippet(' RETURNING ');
  emitColumnsOrRaw(sqlHelper, config, returningState, undefined, area);
};
