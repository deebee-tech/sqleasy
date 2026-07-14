import type { Dialect } from '../configuration/configuration';
import { BuilderType } from '../enums/builder-type';
import { DatabaseType } from '../enums/database-type';
import { ParserArea } from '../enums/parser-area';
import type { ParserMode } from '../enums/parser-mode';
import { quoteIdentifier } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';
import type { QueryState } from '../state/query';
import { defaultToSql } from './to-sql';

export const defaultFrom = (state: QueryState, config: Dialect, mode: ParserMode): SqlHelper => {
  const sqlHelper = new SqlHelper(config, mode);

  if (state.fromStates.length === 0) {
    throw new ParserError(ParserArea.From, 'No tables to select from');
  }

  sqlHelper.addSqlSnippet('FROM ');

  state.fromStates.forEach((fromState, i) => {
    if (fromState.builderType === BuilderType.FromRaw) {
      sqlHelper.addSqlSnippet(fromState.raw ?? '');
      if (i < state.fromStates.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }
      return;
    }

    if (fromState.builderType === BuilderType.FromTable) {
      if (fromState.owner !== '' && config.databaseType === DatabaseType.Mysql) {
        throw new ParserError(ParserArea.From, 'MySQL does not support table owners');
      }

      if (fromState.owner !== '') {
        sqlHelper.addSqlSnippet(quoteIdentifier(fromState.owner, config.identifierDelimiters));
        sqlHelper.addSqlSnippet('.');
      }

      sqlHelper.addSqlSnippet(quoteIdentifier(fromState.tableName, config.identifierDelimiters));

      if (fromState.alias !== '') {
        sqlHelper.addSqlSnippet(' AS ');
        sqlHelper.addSqlSnippet(quoteIdentifier(fromState.alias, config.identifierDelimiters));
      }

      if (i < state.fromStates.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }

      return;
    }

    if (fromState.builderType === BuilderType.FromBuilder) {
      const subHelper = defaultToSql(fromState.subquery, config, mode);

      // Merge the subquery's bound values, not just its SQL — else its `?`/`$n` placeholders ship
      // with no parameters and bind NULL (a filtered bounded-count then matches zero rows).
      sqlHelper.addSqlSnippetWithValues('(' + subHelper.getSql() + ')', subHelper.getValues());

      if (fromState.alias !== '') {
        sqlHelper.addSqlSnippet(' AS ');
        sqlHelper.addSqlSnippet(quoteIdentifier(fromState.alias, config.identifierDelimiters));
      }

      if (i < state.fromStates.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }
    }
  });

  return sqlHelper;
};
