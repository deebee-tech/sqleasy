import type { Dialect } from '../configuration/configuration';
import { BuilderType } from '../enums/builder-type';
import { DatabaseType } from '../enums/database-type';
import { NullsOrder } from '../enums/nulls-order';
import { OrderByDirection } from '../enums/order-by-direction';
import { ParserArea } from '../enums/parser-area';
import type { ParserMode } from '../enums/parser-mode';
import { dialectDisplayName } from '../helpers/dialect-name';
import { qualifiedColumn } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';
import type { QueryState } from '../state/query';

/**
 * Emits one `<column> [ASC|DESC] [NULLS FIRST|NULLS LAST]` sort term. Shared by the top-level
 * ORDER BY clause and a window's `OVER (... ORDER BY ...)` — both sort NULLs the same way.
 *
 * `NULLS FIRST`/`NULLS LAST` is native on Postgres and on SQLite 3.30+. MySQL and MSSQL have no
 * such syntax in any version, and a requested placement used to be synthesized there as a leading
 * `CASE WHEN col IS NULL THEN … END` sort key. That is refused now: it is an extra sort expression
 * the caller never wrote, and it is not merely cosmetic — an index that could have satisfied the
 * ORDER BY no longer can, so the engine sorts. Getting the right rows in the right order by a route
 * the caller cannot see is the thing this library does not do.
 *
 * {@link NullsOrder.None} is deliberately untouched. That is the dialect's own default placement,
 * and the dialects genuinely disagree (Postgres sorts NULLs last on ASC, the others first). Forcing
 * agreement there would mean a `CASE WHEN` on EVERY sort term in the library — the same defeat of
 * index-ordered scans, applied to queries that never asked about NULLs at all.
 */
export const emitOrderByTerm = (
  sqlHelper: SqlHelper,
  config: Dialect,
  tableNameOrAlias: string | undefined,
  columnName: string | undefined,
  direction: OrderByDirection,
  nulls: NullsOrder,
): void => {
  const columnSql = qualifiedColumn(tableNameOrAlias, columnName, config.identifierDelimiters);

  const hasNativeNulls =
    config.databaseType === DatabaseType.Postgres || config.databaseType === DatabaseType.Sqlite;

  if (nulls !== NullsOrder.None && !hasNativeNulls) {
    throw new ParserError(
      ParserArea.OrderBy,
      `${dialectDisplayName(config.databaseType)} has no NULLS FIRST/LAST — order by a ` +
        'nullability expression explicitly if you need it',
    );
  }

  sqlHelper.addSqlSnippet(columnSql);

  if (direction === OrderByDirection.Ascending) {
    sqlHelper.addSqlSnippet(' ASC');
  } else if (direction === OrderByDirection.Descending) {
    sqlHelper.addSqlSnippet(' DESC');
  }
  // OrderByDirection.None → omit direction (dialect default).

  if (nulls !== NullsOrder.None && hasNativeNulls) {
    sqlHelper.addSqlSnippet(nulls === NullsOrder.First ? ' NULLS FIRST' : ' NULLS LAST');
  }
};

export const defaultOrderBy = (state: QueryState, config: Dialect, mode: ParserMode): SqlHelper => {
  const sqlHelper = new SqlHelper(mode);

  if (state.orderByStates.length === 0) {
    return sqlHelper;
  }

  sqlHelper.addSqlSnippet('ORDER BY ');

  state.orderByStates.forEach((orderByState, i) => {
    if (orderByState.builderType === BuilderType.OrderByRaw) {
      sqlHelper.addSqlSnippet(orderByState.raw ?? '');

      if (i < state.orderByStates.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }

      return;
    }

    if (orderByState.builderType === BuilderType.OrderByColumn) {
      emitOrderByTerm(
        sqlHelper,
        config,
        orderByState.tableNameOrAlias,
        orderByState.columnName,
        orderByState.direction,
        orderByState.nulls,
      );

      if (i < state.orderByStates.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }

      return;
    }
  });

  return sqlHelper;
};
