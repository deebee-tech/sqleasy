import type { Dialect } from '../configuration/configuration';
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

export const defaultDelete = (
  state: QueryState,
  config: Dialect,
  mode: ParserMode,
  options?: ToSqlOptions,
): SqlHelper => {
  const sqlHelper = new SqlHelper(mode);

  assertMutationJoinsSupported(state, config, ParserArea.Delete);

  const hasJoins = state.joinStates.length > 0;

  const delim = config.identifierDelimiters;
  const quote = (s: string) => quoteIdentifier(s, delim);

  const fromState = resolveMutationTarget(state, ParserArea.Delete, 'DELETE requires a table');
  const owner = fromState.owner ?? '';
  const alias = fromState.alias ?? '';

  if (owner !== '' && config.databaseType === DatabaseType.Mysql) {
    throw new ParserError(ParserArea.Delete, 'MySQL does not support table owners');
  }

  const qualified = (owner !== '' ? quote(owner) + '.' : '') + quote(fromState.tableName ?? '');

  // T-SQL has no `DELETE FROM table AS alias` — the aliased form is
  // `DELETE [alias] FROM [tbl] AS [alias]`, with OUTPUT (if any) between the target and FROM. A
  // join-backed DELETE needs that same form even without an explicit alias, since the JOIN
  // target(s) must attach to a FROM item.
  const mssqlAliased = config.databaseType === DatabaseType.Mssql && (alias !== '' || hasJoins);

  if (mssqlAliased) {
    sqlHelper.addSqlSnippet('DELETE ');
    sqlHelper.addSqlSnippet(mssqlMutationTop(state, config));
    sqlHelper.addSqlSnippet(alias !== '' ? quote(alias) : qualified);

    if (state.returningState) {
      emitMssqlOutputClause(sqlHelper, config, state.returningState, 'DELETED', ParserArea.Delete);
    }

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

    return sqlHelper;
  }

  // MySQL's multi-table DELETE names the target(s) right after DELETE, then joins the rest in FROM.
  if (hasJoins && config.databaseType === DatabaseType.Mysql) {
    sqlHelper.addSqlSnippet('DELETE ');
    sqlHelper.addSqlSnippet(mssqlMutationTop(state, config));
    sqlHelper.addSqlSnippet(alias !== '' ? quote(alias) : qualified);
    sqlHelper.addSqlSnippet(' FROM ');
    sqlHelper.addSqlSnippet(qualified);

    if (alias !== '') {
      sqlHelper.addSqlSnippet(' AS ');
      sqlHelper.addSqlSnippet(quote(alias));
    }

    const join = defaultJoin(state, config, mode, options);
    sqlHelper.addSqlSnippet(' ');
    sqlHelper.addSqlSnippetWithValues(join.getSql(), join.getValues());

    return sqlHelper;
  }

  // T-SQL spells a mutation row cap `DELETE TOP (n) FROM tbl` — between the verb and FROM.
  sqlHelper.addSqlSnippet('DELETE ');
  sqlHelper.addSqlSnippet(mssqlMutationTop(state, config));
  sqlHelper.addSqlSnippet('FROM ');
  sqlHelper.addSqlSnippet(qualified);

  if (alias !== '') {
    sqlHelper.addSqlSnippet(' AS ');
    sqlHelper.addSqlSnippet(quote(alias));
  }

  // T-SQL requires OUTPUT after the target and before WHERE; PG/SQLite's RETURNING is a
  // trailing clause, handled by the caller (`to-sql.ts`) after this statement returns. MySQL
  // has no DELETE...RETURNING equivalent and refuses it there.
  if (state.returningState && config.databaseType === DatabaseType.Mssql) {
    emitMssqlOutputClause(sqlHelper, config, state.returningState, 'DELETED', ParserArea.Delete);
  }

  // Postgres's DELETE...USING joins the target to extra tables the same way UPDATE...FROM
  // does: a plain comma list here, with the join condition translated into a WHERE predicate
  // by the caller (`to-sql.ts`) via `buildPostgresMutationJoinPredicate`.
  if (hasJoins && config.databaseType === DatabaseType.Postgres) {
    const using = renderPostgresMutationFrom(config, state, mode, options, ParserArea.Delete);
    sqlHelper.addSqlSnippet(' USING ');
    sqlHelper.addSqlSnippetWithValues(using.getSql(), using.getValues());
  }

  return sqlHelper;
};
