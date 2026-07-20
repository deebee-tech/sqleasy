import type { Dialect } from '../configuration/configuration';
import { DatabaseType } from '../enums/database-type';
import type { ParserArea } from '../enums/parser-area';
import { UpsertAction } from '../enums/upsert-action';
import { quoteIdentifier } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';
import type { UpsertState } from '../state/upsert';

/**
 * MySQL spells "skip conflicting rows" as an `INSERT IGNORE` prefix, not a trailing clause —
 * `defaultInsert` calls this to decide whether to emit `IGNORE` right after `INSERT `.
 */
export const isMysqlInsertIgnore = (
  upsertState: UpsertState | undefined,
  config: Dialect,
): boolean =>
  config.databaseType === DatabaseType.Mysql &&
  upsertState !== undefined &&
  upsertState.action === UpsertAction.DoNothing;

const emitSetList = (
  sqlHelper: SqlHelper,
  config: Dialect,
  upsertState: UpsertState,
  area: ParserArea,
): void => {
  if (upsertState.updateRaw) {
    sqlHelper.addSqlSnippet(upsertState.updateRaw);
    return;
  }

  if (upsertState.updateColumns.length === 0) {
    throw new ParserError(area, 'Upsert DO UPDATE requires at least one SET column');
  }

  for (let i = 0; i < upsertState.updateColumns.length; i++) {
    const column = upsertState.updateColumns[i]!;
    sqlHelper.addSqlSnippet(quoteIdentifier(column.columnName, config.identifierDelimiters));
    sqlHelper.addSqlSnippet(' = ');
    sqlHelper.addDynamicValue(column.value);

    if (i < upsertState.updateColumns.length - 1) {
      sqlHelper.addSqlSnippet(', ');
    }
  }
};

const emitConflictColumns = (sqlHelper: SqlHelper, config: Dialect, columns: string[]): void => {
  sqlHelper.addSqlSnippet('(');
  for (let i = 0; i < columns.length; i++) {
    sqlHelper.addSqlSnippet(quoteIdentifier(columns[i], config.identifierDelimiters));
    if (i < columns.length - 1) {
      sqlHelper.addSqlSnippet(', ');
    }
  }
  sqlHelper.addSqlSnippet(')');
};

/**
 * Emits the trailing conflict clause after `VALUES (...)`: PG/SQLite `ON CONFLICT ...`, MySQL
 * `ON DUPLICATE KEY UPDATE ...` (its `DoNothing` case is instead an `INSERT IGNORE` prefix — see
 * {@link isMysqlInsertIgnore} — and emits nothing here). MSSQL upsert is emitted as a `MERGE`
 * statement by {@link defaultInsert} instead of calling this function.
 */
export const emitUpsertClause = (
  sqlHelper: SqlHelper,
  config: Dialect,
  upsertState: UpsertState,
  area: ParserArea,
): void => {
  if (config.databaseType === DatabaseType.Mssql) {
    throw new ParserError(
      area,
      'MSSQL upsert is emitted as MERGE by defaultInsert — this path should not run',
    );
  }

  if (config.databaseType === DatabaseType.Mysql) {
    // MySQL has no conflict TARGET. `ON DUPLICATE KEY UPDATE` and `INSERT IGNORE` both fire on ANY
    // unique or primary key, and neither accepts a column list. Naming columns therefore asked for
    // something MySQL cannot express, and it was silently answered with "on any key instead" —
    // which matches a different set of rows than the caller wrote.
    if (upsertState.conflictColumns.length > 0) {
      throw new ParserError(
        area,
        'MySQL has no conflict target — ON DUPLICATE KEY UPDATE fires on any unique key, so ' +
          'conflict columns cannot be honored; omit them',
      );
    }

    if (upsertState.action === UpsertAction.DoNothing) {
      // Handled by the `INSERT IGNORE` prefix — see `isMysqlInsertIgnore`.
      return;
    }

    sqlHelper.addSqlSnippet(' ON DUPLICATE KEY UPDATE ');
    emitSetList(sqlHelper, config, upsertState, area);
    return;
  }

  // Postgres / SQLite.
  sqlHelper.addSqlSnippet(' ON CONFLICT');

  if (upsertState.conflictColumns.length > 0) {
    sqlHelper.addSqlSnippet(' ');
    emitConflictColumns(sqlHelper, config, upsertState.conflictColumns);
  }

  if (upsertState.action === UpsertAction.DoNothing) {
    sqlHelper.addSqlSnippet(' DO NOTHING');
    return;
  }

  if (upsertState.conflictColumns.length === 0) {
    throw new ParserError(area, 'ON CONFLICT DO UPDATE requires at least one conflict column');
  }

  sqlHelper.addSqlSnippet(' DO UPDATE SET ');
  emitSetList(sqlHelper, config, upsertState, area);
};
