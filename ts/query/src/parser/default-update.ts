import type { Dialect } from '../configuration/configuration';
import { BuilderType } from '../enums/builder-type';
import { DatabaseType } from '../enums/database-type';
import { ParserArea } from '../enums/parser-area';
import type { ParserMode } from '../enums/parser-mode';
import { quoteIdentifier } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';
import type { QueryState } from '../state/query';
import { defaultJoin } from './default-join';
import { assertMutationJoinsSupported, renderPostgresMutationFrom } from './default-mutation-join';
import { emitMssqlOutputClause } from './default-returning';
import { mssqlMutationTop } from './default-mutation-row-cap';
import { resolveMutationTarget } from './mutation-target';
import type { ToSqlOptions } from './to-sql';

export const defaultUpdate = (
  state: QueryState,
  config: Dialect,
  mode: ParserMode,
  options?: ToSqlOptions,
): SqlHelper => {
  const sqlHelper = new SqlHelper(mode);

  if (state.updateStates.length === 0) {
    throw new ParserError(ParserArea.Update, 'UPDATE requires at least one SET column');
  }

  assertMutationJoinsSupported(state, config, ParserArea.Update);

  const hasJoins = state.joinStates.length > 0;

  const delim = config.identifierDelimiters;
  const quote = (s: string) => quoteIdentifier(s, delim);

  const fromState = resolveMutationTarget(state, ParserArea.Update, 'UPDATE requires a table');
  const owner = fromState.owner ?? '';
  const alias = fromState.alias ?? '';

  if (owner !== '' && config.databaseType === DatabaseType.Mysql) {
    throw new ParserError(ParserArea.Update, 'MySQL does not support table owners');
  }

  const qualified = (owner !== '' ? quote(owner) + '.' : '') + quote(fromState.tableName ?? '');
  // T-SQL has no `UPDATE table AS alias` — the alias must come from a FROM clause:
  // `UPDATE [alias] SET ... FROM [tbl] AS [alias]` (appended after the SET list below). A
  // join-backed UPDATE needs that same FROM form even without an explicit alias, since the
  // JOIN target(s) must attach to a FROM item.
  const mssqlAliased = config.databaseType === DatabaseType.Mssql && (alias !== '' || hasJoins);

  sqlHelper.addSqlSnippet('UPDATE ');
  // T-SQL spells a mutation row cap `UPDATE TOP (n) tbl` — between the verb and the target.
  sqlHelper.addSqlSnippet(mssqlMutationTop(state, config));

  if (mssqlAliased) {
    sqlHelper.addSqlSnippet(alias !== '' ? quote(alias) : qualified);
  } else {
    sqlHelper.addSqlSnippet(qualified);
    if (alias !== '') {
      sqlHelper.addSqlSnippet(' AS ');
      sqlHelper.addSqlSnippet(quote(alias));
    }

    // MySQL's multi-table UPDATE puts the joined tables directly after the target, before SET.
    if (hasJoins && config.databaseType === DatabaseType.Mysql) {
      const join = defaultJoin(state, config, mode, options);
      sqlHelper.addSqlSnippet(' ');
      sqlHelper.addSqlSnippetWithValues(join.getSql(), join.getValues());
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

  // T-SQL requires OUTPUT after SET and before FROM/WHERE; PG/SQLite/MySQL have no such
  // requirement — their RETURNING/upsert equivalents are trailing clauses handled by the
  // caller (`to-sql.ts`) after this statement returns.
  if (state.returningState && config.databaseType === DatabaseType.Mssql) {
    emitMssqlOutputClause(sqlHelper, config, state.returningState, 'INSERTED', ParserArea.Update);
  }

  if (mssqlAliased) {
    sqlHelper.addSqlSnippet(' FROM ');
    sqlHelper.addSqlSnippet(qualified);
    if (alias !== '') {
      sqlHelper.addSqlSnippet(' AS ');
      sqlHelper.addSqlSnippet(quote(alias));
    }

    if (hasJoins) {
      const join = defaultJoin(state, config, mode, options);
      sqlHelper.addSqlSnippet(' ');
      sqlHelper.addSqlSnippetWithValues(join.getSql(), join.getValues());
    }
  }

  // Postgres cannot JOIN the target row to a from_item directly — that condition is a WHERE
  // predicate instead, assembled by the caller (`to-sql.ts`) via `buildPostgresMutationJoinPredicate`.
  if (hasJoins && config.databaseType === DatabaseType.Postgres) {
    const from = renderPostgresMutationFrom(config, state, mode, options, ParserArea.Update);
    sqlHelper.addSqlSnippet(' FROM ');
    sqlHelper.addSqlSnippetWithValues(from.getSql(), from.getValues());
  }

  return sqlHelper;
};
