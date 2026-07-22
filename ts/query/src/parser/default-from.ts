import type { Dialect } from '../configuration/configuration';
import { BuilderType } from '../enums/builder-type';
import { DatabaseType } from '../enums/database-type';
import { ParserArea } from '../enums/parser-area';
import type { ParserMode } from '../enums/parser-mode';
import { quoteIdentifier } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';
import { mssqlRowLockHint, refuseUnplaceableMssqlRowLock } from './default-row-lock';
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
      refuseUnplaceableMssqlRowLock(config, state.rowLock, 'a raw FROM fragment');
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

      // A name that matches a CTE declared on THIS statement is the CTE, not a table, and a CTE
      // lives in no schema — qualifying it sends the engine looking for a real relation:
      //
      //     WITH c AS (…) SELECT id FROM public.c   ->  PG:    relation "public.c" does not exist
      //     WITH c AS (…) SELECT id FROM dbo.c      ->  MSSQL: Msg 208, invalid object name
      //     WITH c AS (…) SELECT id FROM c          ->  both:  resolves to the CTE
      //
      // The owner here is usually the dialect DEFAULT (`public`/`dbo`), which `fromTable` stamps on
      // without being asked, so referencing your own CTE by name was broken unless you happened to
      // route around it with `fromRaw`. Suppressing the owner for a declared CTE name is not a
      // guess: the name is declared in the same state, three lines up in the same statement.
      const namesADeclaredCte = state.cteStates.some((cte) => cte.name === fromState.tableName);

      if (fromState.owner !== '' && !namesADeclaredCte) {
        sqlHelper.addSqlSnippet(quoteIdentifier(fromState.owner, config.identifierDelimiters));
        sqlHelper.addSqlSnippet('.');
      }

      sqlHelper.addSqlSnippet(quoteIdentifier(fromState.tableName, config.identifierDelimiters));

      if (fromState.alias !== '') {
        sqlHelper.addSqlSnippet(' AS ');
        sqlHelper.addSqlSnippet(quoteIdentifier(fromState.alias, config.identifierDelimiters));
      }

      // MySQL's table reference is `tbl_name [[AS] alias] [index_hint_list]` — the hint follows
      // the alias. Emitting it first is a syntax error (1064).
      sqlHelper.addSqlSnippet(
        mysqlIndexHintForTable(state, config, fromState.alias ?? fromState.tableName ?? ''),
      );

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
      refuseUnplaceableMssqlRowLock(config, state.rowLock, 'a derived table');
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
      refuseUnplaceableMssqlRowLock(config, state.rowLock, 'a LATERAL subquery');
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
      refuseUnplaceableMssqlRowLock(config, state.rowLock, 'a table-valued function');
      // MySQL has no FROM-clause table functions at all. `fromFunctionRaw()` remains the escape
      // hatch for hand-written JSON_TABLE and friends.
      if (config.databaseType === DatabaseType.Mysql) {
        throw new ParserError(
          ParserArea.From,
          'MySQL does not support table functions in FROM — use fromFunctionRaw',
        );
      }

      // No MySQL owner guard here — the capability throw above already excluded MySQL.
      if (fromState.owner && fromState.owner !== '') {
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
