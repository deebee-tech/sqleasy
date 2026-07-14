import type { Dialect } from '../configuration/configuration';
import { DatabaseType } from '../enums/database-type';
import { ParserArea } from '../enums/parser-area';
import type { ParserMode } from '../enums/parser-mode';
import { quoteIdentifier } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';
import type { QueryState } from '../state/query';

export const defaultDelete = (state: QueryState, config: Dialect, mode: ParserMode): SqlHelper => {
  const sqlHelper = new SqlHelper(mode);

  if (state.fromStates.length === 0) {
    throw new ParserError(ParserArea.General, 'DELETE requires a table');
  }

  const delim = config.identifierDelimiters;
  const quote = (s: string) => quoteIdentifier(s, delim);

  const fromState = state.fromStates[0]!;
  const owner = fromState.owner ?? '';
  const alias = fromState.alias ?? '';
  const qualified = (owner !== '' ? quote(owner) + '.' : '') + quote(fromState.tableName ?? '');

  // T-SQL has no `DELETE FROM table AS alias` — the aliased form is
  // `DELETE [alias] FROM [tbl] AS [alias]`.
  if (alias !== '' && config.databaseType === DatabaseType.Mssql) {
    sqlHelper.addSqlSnippet('DELETE ');
    sqlHelper.addSqlSnippet(quote(alias));
    sqlHelper.addSqlSnippet(' FROM ');
    sqlHelper.addSqlSnippet(qualified);
    sqlHelper.addSqlSnippet(' AS ');
    sqlHelper.addSqlSnippet(quote(alias));
    return sqlHelper;
  }

  sqlHelper.addSqlSnippet('DELETE FROM ');
  sqlHelper.addSqlSnippet(qualified);

  if (alias !== '') {
    sqlHelper.addSqlSnippet(' AS ');
    sqlHelper.addSqlSnippet(quote(alias));
  }

  return sqlHelper;
};
