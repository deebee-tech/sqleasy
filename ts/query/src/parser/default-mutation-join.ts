import type { Dialect } from '../configuration/configuration';
import { BuilderType } from '../enums/builder-type';
import { DatabaseType } from '../enums/database-type';
import { JoinType } from '../enums/join-type';
import type { ParserArea } from '../enums/parser-area';
import type { ParserMode } from '../enums/parser-mode';
import { quoteIdentifier } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';
import type { JoinState } from '../state/join';
import type { QueryState } from '../state/query';
import { renderJoinOnConditions } from './default-join';
import type { ToSqlOptions } from './to-sql';
import { defaultToSql } from './to-sql';

/**
 * Join-backed UPDATE/DELETE support (`.join(...)` combined with `.updateTable`/`.deleteFrom`).
 *
 * MySQL and MSSQL both accept full `JOIN ... ON` syntax directly in their multi-table UPDATE /
 * `UPDATE ... FROM` / `DELETE ... FROM` grammars, so `default-update.ts`/`default-delete.ts`
 * reuse `defaultJoin` verbatim for those two. Postgres's `UPDATE ... FROM` / `DELETE ... USING`
 * cannot join the *target* row to a `from_item` with `JOIN ... ON` — that condition has to be a
 * `WHERE` predicate — so Postgres gets a plain comma-separated `from_item` list here
 * ({@link renderPostgresMutationFrom}) plus a translated `WHERE` predicate
 * ({@link buildPostgresMutationJoinPredicate}), assembled by `to-sql.ts`. SQLite has no
 * multi-table UPDATE/DELETE syntax at all, so joins are rejected outright.
 */
export const assertMutationJoinsSupported = (
  state: QueryState,
  config: Dialect,
  area: ParserArea,
): void => {
  if (state.joinStates.length === 0) {
    return;
  }

  if (config.databaseType === DatabaseType.Sqlite) {
    throw new ParserError(
      area,
      'SQLite does not support joins in UPDATE/DELETE; rewrite the join as a correlated subquery',
    );
  }
};

const emitPostgresFromItem = (
  sqlHelper: SqlHelper,
  config: Dialect,
  mode: ParserMode,
  options: ToSqlOptions | undefined,
  joinState: JoinState,
  area: ParserArea,
): void => {
  if (joinState.builderType === BuilderType.JoinRaw) {
    throw new ParserError(
      area,
      'Raw JOIN fragments are not supported in a Postgres join-backed UPDATE/DELETE; use a raw WHERE/FROM instead',
    );
  }

  if (joinState.joinType !== JoinType.Inner && joinState.joinType !== JoinType.Cross) {
    throw new ParserError(
      area,
      'Postgres UPDATE...FROM/DELETE...USING only supports INNER or CROSS joins — the ON condition ' +
        'is translated into a WHERE predicate, which cannot express OUTER JOIN semantics',
    );
  }

  if (joinState.builderType === BuilderType.JoinTable) {
    if (joinState.owner && joinState.owner !== '') {
      sqlHelper.addSqlSnippet(quoteIdentifier(joinState.owner, config.identifierDelimiters));
      sqlHelper.addSqlSnippet('.');
    }

    sqlHelper.addSqlSnippet(quoteIdentifier(joinState.tableName, config.identifierDelimiters));

    if (joinState.alias && joinState.alias !== '') {
      sqlHelper.addSqlSnippet(' AS ');
      sqlHelper.addSqlSnippet(quoteIdentifier(joinState.alias, config.identifierDelimiters));
    }

    return;
  }

  const subHelper = defaultToSql(joinState.subquery, config, mode, options);
  sqlHelper.addSqlSnippetWithValues('(' + subHelper.getSql() + ')', subHelper.getValues());

  if (joinState.alias && joinState.alias !== '') {
    sqlHelper.addSqlSnippet(' AS ');
    sqlHelper.addSqlSnippet(quoteIdentifier(joinState.alias, config.identifierDelimiters));
  }
};

/** Renders `.join(...)` targets as a comma-separated Postgres `from_item` list (no `JOIN`/`ON`). */
export const renderPostgresMutationFrom = (
  config: Dialect,
  state: QueryState,
  mode: ParserMode,
  options: ToSqlOptions | undefined,
  area: ParserArea,
): SqlHelper => {
  const sqlHelper = new SqlHelper(mode);

  state.joinStates.forEach((joinState, i) => {
    emitPostgresFromItem(sqlHelper, config, mode, options, joinState, area);

    if (i < state.joinStates.length - 1) {
      sqlHelper.addSqlSnippet(', ');
    }
  });

  return sqlHelper;
};

/**
 * Translates every `.join(...)` call's ON conditions into a single ANDed `WHERE` predicate
 * (no leading `WHERE`/`AND` keyword). CROSS joins contribute no predicate (unconditional).
 * Each join's own conditions are parenthesized when it has more than one, so combining them
 * with `AND` never changes their internal `AND`/`OR` precedence.
 */
export const buildPostgresMutationJoinPredicate = (
  config: Dialect,
  state: QueryState,
  mode: ParserMode,
): SqlHelper => {
  const sqlHelper = new SqlHelper(mode);
  let wroteAny = false;

  for (const joinState of state.joinStates) {
    if (joinState.joinType === JoinType.Cross || joinState.joinOnStates.length === 0) {
      continue;
    }

    if (wroteAny) {
      sqlHelper.addSqlSnippet(' AND ');
    }

    const wrapInParens = joinState.joinOnStates.length > 1;
    if (wrapInParens) {
      sqlHelper.addSqlSnippet('(');
    }

    renderJoinOnConditions(sqlHelper, config, joinState.joinOnStates);

    if (wrapInParens) {
      sqlHelper.addSqlSnippet(')');
    }

    wroteAny = true;
  }

  return sqlHelper;
};
