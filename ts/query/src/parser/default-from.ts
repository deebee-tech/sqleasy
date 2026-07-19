import type { Dialect } from '../configuration/configuration';
import { BuilderType } from '../enums/builder-type';
import { DatabaseType } from '../enums/database-type';
import { ParserArea } from '../enums/parser-area';
import type { ParserMode } from '../enums/parser-mode';
import { quoteIdentifier } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';
import { mssqlRowLockHint } from './default-row-lock';
import { mysqlIndexHintForTable } from './default-hint';
import type { QueryState } from '../state/query';
import type { ToSqlOptions } from './to-sql';
import { defaultToSql } from './to-sql';

export const defaultFrom = (
  state: QueryState,
  config: Dialect,
  mode: ParserMode,
  options?: ToSqlOptions,
): SqlHelper => {
  const sqlHelper = new SqlHelper(mode);

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

      sqlHelper.addSqlSnippet(
        mysqlIndexHintForTable(state, config, fromState.alias ?? fromState.tableName ?? ''),
      );

      if (fromState.alias !== '') {
        sqlHelper.addSqlSnippet(' AS ');
        sqlHelper.addSqlSnippet(quoteIdentifier(fromState.alias, config.identifierDelimiters));
      }

      // MSSQL has no `FOR UPDATE`/`FOR SHARE` — the row lock is a `WITH (...)` hint on each
      // base table instead. See `default-row-lock.ts`.
      if (state.rowLock && config.databaseType === DatabaseType.Mssql) {
        sqlHelper.addSqlSnippet(mssqlRowLockHint(state.rowLock));
      }

      if (i < state.fromStates.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }

      return;
    }

    if (fromState.builderType === BuilderType.FromBuilder) {
      const subHelper = defaultToSql(fromState.subquery, config, mode, options);

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

      return;
    }

    if (fromState.builderType === BuilderType.FromLateral) {
      if (config.databaseType === DatabaseType.Sqlite) {
        throw new ParserError(ParserArea.From, 'SQLite does not support LATERAL derived tables');
      }
      if (config.databaseType === DatabaseType.Mssql) {
        throw new ParserError(
          ParserArea.From,
          'MSSQL LATERAL belongs in APPLY joins — use joinCrossApply/joinOuterApply',
        );
      }

      const subHelper = defaultToSql(fromState.subquery, config, mode, options);
      sqlHelper.addSqlSnippet('LATERAL (');
      sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
      sqlHelper.addSqlSnippet(')');

      if (fromState.alias !== '') {
        sqlHelper.addSqlSnippet(' AS ');
        sqlHelper.addSqlSnippet(quoteIdentifier(fromState.alias, config.identifierDelimiters));
      }

      if (i < state.fromStates.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }

      return;
    }

    if (fromState.builderType === BuilderType.FromFunction) {
      if (fromState.owner && fromState.owner !== '') {
        if (config.databaseType === DatabaseType.Mysql) {
          throw new ParserError(ParserArea.From, 'MySQL does not support table owners');
        }
        sqlHelper.addSqlSnippet(quoteIdentifier(fromState.owner, config.identifierDelimiters));
        sqlHelper.addSqlSnippet('.');
      }

      const fnName = fromState.functionName ?? '';
      if (config.databaseType === DatabaseType.Sqlite) {
        sqlHelper.addSqlSnippet(fnName);
      } else {
        sqlHelper.addSqlSnippet(quoteIdentifier(fnName, config.identifierDelimiters));
      }
      sqlHelper.addSqlSnippet('(');
      const params = fromState.functionParams ?? [];
      params.forEach((param, paramIndex) => {
        sqlHelper.addDynamicValue(param);
        if (paramIndex < params.length - 1) {
          sqlHelper.addSqlSnippet(', ');
        }
      });
      sqlHelper.addSqlSnippet(')');

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
