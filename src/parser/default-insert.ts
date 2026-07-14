import type { Dialect } from '../configuration/configuration';
import { ParserArea } from '../enums/parser-area';
import type { ParserMode } from '../enums/parser-mode';
import { quoteIdentifier } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';
import type { QueryState } from '../state/query';

export const defaultInsert = (state: QueryState, config: Dialect, mode: ParserMode): SqlHelper => {
  const sqlHelper = new SqlHelper(mode);

  if (!state.insertState) {
    throw new ParserError(ParserArea.General, 'No insert state provided');
  }

  const insertState = state.insertState;

  if (insertState.raw) {
    sqlHelper.addSqlSnippet(insertState.raw);
    return sqlHelper;
  }

  sqlHelper.addSqlSnippet('INSERT INTO ');

  if (insertState.owner && insertState.owner !== '') {
    sqlHelper.addSqlSnippet(quoteIdentifier(insertState.owner, config.identifierDelimiters));
    sqlHelper.addSqlSnippet('.');
  }

  sqlHelper.addSqlSnippet(quoteIdentifier(insertState.tableName, config.identifierDelimiters));

  if (insertState.columns.length > 0) {
    sqlHelper.addSqlSnippet(' (');
    for (let i = 0; i < insertState.columns.length; i++) {
      sqlHelper.addSqlSnippet(quoteIdentifier(insertState.columns[i], config.identifierDelimiters));

      if (i < insertState.columns.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }
    }
    sqlHelper.addSqlSnippet(')');
  }

  if (insertState.values.length > 0) {
    sqlHelper.addSqlSnippet(' VALUES ');

    for (let r = 0; r < insertState.values.length; r++) {
      sqlHelper.addSqlSnippet('(');

      const row = insertState.values[r]!;
      for (let c = 0; c < row.length; c++) {
        sqlHelper.addDynamicValue(row[c]);

        if (c < row.length - 1) {
          sqlHelper.addSqlSnippet(', ');
        }
      }

      sqlHelper.addSqlSnippet(')');

      if (r < insertState.values.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }
    }
  }

  return sqlHelper;
};
