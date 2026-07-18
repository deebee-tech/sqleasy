import type { Dialect } from '../configuration/configuration';
import { BuilderType } from '../enums/builder-type';
import { DatabaseType } from '../enums/database-type';
import { ParserArea } from '../enums/parser-area';
import type { ParserMode } from '../enums/parser-mode';
import { quoteIdentifier } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';
import type { QueryState } from '../state/query';

export const defaultUpdate = (state: QueryState, config: Dialect, mode: ParserMode): SqlHelper => {
  const sqlHelper = new SqlHelper(mode);

  if (state.fromStates.length === 0) {
    throw new ParserError(ParserArea.Update, 'UPDATE requires a table');
  }

  if (state.updateStates.length === 0) {
    throw new ParserError(ParserArea.Update, 'UPDATE requires at least one SET column');
  }

  const delim = config.identifierDelimiters;
  const quote = (s: string) => quoteIdentifier(s, delim);

  const fromState = state.fromStates[0]!;
  const owner = fromState.owner ?? '';
  const alias = fromState.alias ?? '';

  if (owner !== '' && config.databaseType === DatabaseType.Mysql) {
    throw new ParserError(ParserArea.Update, 'MySQL does not support table owners');
  }

  const qualified = (owner !== '' ? quote(owner) + '.' : '') + quote(fromState.tableName ?? '');
  // T-SQL has no `UPDATE table AS alias` — the alias must come from a FROM clause:
  // `UPDATE [alias] SET ... FROM [tbl] AS [alias]` (appended after the SET list below).
  const mssqlAliased = alias !== '' && config.databaseType === DatabaseType.Mssql;

  sqlHelper.addSqlSnippet('UPDATE ');

  if (mssqlAliased) {
    sqlHelper.addSqlSnippet(quote(alias));
  } else {
    sqlHelper.addSqlSnippet(qualified);
    if (alias !== '') {
      sqlHelper.addSqlSnippet(' AS ');
      sqlHelper.addSqlSnippet(quote(alias));
    }
  }

  sqlHelper.addSqlSnippet(' SET ');

  for (let i = 0; i < state.updateStates.length; i++) {
    const updateState = state.updateStates[i]!;

    if (updateState.builderType === BuilderType.UpdateRaw) {
      sqlHelper.addSqlSnippet(updateState.raw ?? '');
    } else if (updateState.builderType === BuilderType.UpdateColumn) {
      sqlHelper.addSqlSnippet(quoteIdentifier(updateState.columnName, config.identifierDelimiters));
      sqlHelper.addSqlSnippet(' = ');
      sqlHelper.addDynamicValue(updateState.value);
    }

    if (i < state.updateStates.length - 1) {
      sqlHelper.addSqlSnippet(', ');
    }
  }

  if (mssqlAliased) {
    sqlHelper.addSqlSnippet(' FROM ');
    sqlHelper.addSqlSnippet(qualified);
    sqlHelper.addSqlSnippet(' AS ');
    sqlHelper.addSqlSnippet(quote(alias));
  }

  return sqlHelper;
};
