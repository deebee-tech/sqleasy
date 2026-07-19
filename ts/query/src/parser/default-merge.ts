import type { Dialect } from '../configuration/configuration';
import { DatabaseType } from '../enums/database-type';
import { ParserArea } from '../enums/parser-area';
import type { ParserMode } from '../enums/parser-mode';
import { UpsertAction } from '../enums/upsert-action';
import { quoteIdentifier } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';
import type { QueryState } from '../state/query';
import type { UpsertState } from '../state/upsert';
import type { ToSqlOptions } from './to-sql';
import { defaultToSql } from './to-sql';

const emitMergeSetList = (
  sqlHelper: SqlHelper,
  config: Dialect,
  upsertState: UpsertState,
  targetAlias: string,
  sourceAlias: string,
  columns: string[],
): void => {
  if (upsertState.updateRaw) {
    sqlHelper.addSqlSnippet(upsertState.updateRaw);
    return;
  }

  const updates =
    upsertState.updateColumns.length > 0
      ? upsertState.updateColumns
      : columns.map((column) => ({ columnName: column, value: undefined }));

  if (updates.length === 0) {
    throw new ParserError(ParserArea.Insert, 'MERGE DO UPDATE requires at least one SET column');
  }

  for (let i = 0; i < updates.length; i++) {
    const update = updates[i]!;
    sqlHelper.addSqlSnippet(quoteIdentifier(update.columnName, config.identifierDelimiters));
    sqlHelper.addSqlSnippet(' = ');
    sqlHelper.addSqlSnippet(quoteIdentifier(sourceAlias, config.identifierDelimiters));
    sqlHelper.addSqlSnippet('.');
    sqlHelper.addSqlSnippet(quoteIdentifier(update.columnName, config.identifierDelimiters));

    if (i < updates.length - 1) {
      sqlHelper.addSqlSnippet(', ');
    }
  }
};

/**
 * Emits a T-SQL `MERGE` upsert instead of `INSERT ... VALUES` when {@link QueryState.upsertState}
 * is set on MSSQL.
 */
export const emitMssqlMergeInsert = (
  state: QueryState,
  config: Dialect,
  mode: ParserMode,
  options?: ToSqlOptions,
): SqlHelper => {
  if (config.databaseType !== DatabaseType.Mssql) {
    throw new ParserError(ParserArea.Insert, 'MERGE upsert emission is MSSQL-only');
  }

  if (!state.insertState || !state.upsertState) {
    throw new ParserError(ParserArea.Insert, 'MERGE requires INSERT upsert state');
  }

  const insertState = state.insertState;
  const upsertState = state.upsertState;
  const sqlHelper = new SqlHelper(mode);

  if (!insertState.tableName) {
    throw new ParserError(ParserArea.Insert, 'MERGE requires a target table');
  }

  const targetAlias = 'target';
  const sourceAlias = 'source';
  const columns = insertState.columns;

  if (columns.length === 0) {
    throw new ParserError(ParserArea.Insert, 'MERGE requires an explicit INSERT column list');
  }

  if (upsertState.conflictColumns.length === 0) {
    throw new ParserError(ParserArea.Insert, 'MERGE requires at least one conflict column');
  }

  sqlHelper.addSqlSnippet('MERGE INTO ');

  if (insertState.owner && insertState.owner !== '') {
    sqlHelper.addSqlSnippet(quoteIdentifier(insertState.owner, config.identifierDelimiters));
    sqlHelper.addSqlSnippet('.');
  }

  sqlHelper.addSqlSnippet(quoteIdentifier(insertState.tableName, config.identifierDelimiters));
  sqlHelper.addSqlSnippet(' AS ');
  sqlHelper.addSqlSnippet(quoteIdentifier(targetAlias, config.identifierDelimiters));
  sqlHelper.addSqlSnippet(' USING (');

  if (insertState.selectSubquery) {
    const subHelper = defaultToSql(insertState.selectSubquery, config, mode, options);
    sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
  } else {
    if (insertState.values.length === 0) {
      throw new ParserError(
        ParserArea.Insert,
        'MERGE requires VALUES or INSERT SELECT source rows',
      );
    }

    if (insertState.values.length !== 1) {
      throw new ParserError(
        ParserArea.Insert,
        'MERGE currently supports a single VALUES row — use insertSelect for multi-row sources',
      );
    }

    sqlHelper.addSqlSnippet('VALUES (');
    const row = insertState.values[0]!;
    if (row.length !== columns.length) {
      throw new ParserError(
        ParserArea.Insert,
        `MERGE column count (${columns.length}) does not match value count (${row.length})`,
      );
    }

    for (let c = 0; c < row.length; c++) {
      sqlHelper.addDynamicValue(row[c]);
      if (c < row.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }
    }
    sqlHelper.addSqlSnippet(')');
  }

  sqlHelper.addSqlSnippet(') AS ');
  sqlHelper.addSqlSnippet(quoteIdentifier(sourceAlias, config.identifierDelimiters));
  sqlHelper.addSqlSnippet(' (');
  for (let i = 0; i < columns.length; i++) {
    sqlHelper.addSqlSnippet(quoteIdentifier(columns[i]!, config.identifierDelimiters));
    if (i < columns.length - 1) {
      sqlHelper.addSqlSnippet(', ');
    }
  }
  sqlHelper.addSqlSnippet(') ON ');

  for (let i = 0; i < upsertState.conflictColumns.length; i++) {
    const conflictColumn = upsertState.conflictColumns[i]!;
    sqlHelper.addSqlSnippet(quoteIdentifier(targetAlias, config.identifierDelimiters));
    sqlHelper.addSqlSnippet('.');
    sqlHelper.addSqlSnippet(quoteIdentifier(conflictColumn, config.identifierDelimiters));
    sqlHelper.addSqlSnippet(' = ');
    sqlHelper.addSqlSnippet(quoteIdentifier(sourceAlias, config.identifierDelimiters));
    sqlHelper.addSqlSnippet('.');
    sqlHelper.addSqlSnippet(quoteIdentifier(conflictColumn, config.identifierDelimiters));
    if (i < upsertState.conflictColumns.length - 1) {
      sqlHelper.addSqlSnippet(' AND ');
    }
  }

  sqlHelper.addSqlSnippet(' WHEN NOT MATCHED BY TARGET THEN INSERT (');
  for (let i = 0; i < columns.length; i++) {
    sqlHelper.addSqlSnippet(quoteIdentifier(columns[i]!, config.identifierDelimiters));
    if (i < columns.length - 1) {
      sqlHelper.addSqlSnippet(', ');
    }
  }
  sqlHelper.addSqlSnippet(') VALUES (');
  for (let i = 0; i < columns.length; i++) {
    sqlHelper.addSqlSnippet(quoteIdentifier(sourceAlias, config.identifierDelimiters));
    sqlHelper.addSqlSnippet('.');
    sqlHelper.addSqlSnippet(quoteIdentifier(columns[i]!, config.identifierDelimiters));
    if (i < columns.length - 1) {
      sqlHelper.addSqlSnippet(', ');
    }
  }
  sqlHelper.addSqlSnippet(')');

  if (upsertState.action === UpsertAction.DoUpdate) {
    sqlHelper.addSqlSnippet(' WHEN MATCHED THEN UPDATE SET ');
    emitMergeSetList(sqlHelper, config, upsertState, targetAlias, sourceAlias, columns);
  }

  return sqlHelper;
};
