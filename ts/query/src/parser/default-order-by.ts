import type { Dialect } from '../configuration/configuration';
import { BuilderType } from '../enums/builder-type';
import { DatabaseType } from '../enums/database-type';
import { NullsOrder } from '../enums/nulls-order';
import { OrderByDirection } from '../enums/order-by-direction';
import type { ParserMode } from '../enums/parser-mode';
import { quoteIdentifier } from '../helpers/identifier';
import { SqlHelper } from '../helpers/sql';
import type { QueryState } from '../state/query';

/**
 * Emits one `<column> [ASC|DESC] [NULLS FIRST|NULLS LAST]` sort term. Shared by the top-level
 * ORDER BY clause and a window's `OVER (... ORDER BY ...)` — both sort NULLs the same way.
 *
 * Postgres/SQLite have native `NULLS FIRST`/`NULLS LAST`. MySQL/MSSQL have neither, so a
 * requested placement is emulated with a leading `CASE WHEN col IS NULL THEN … END` sort key —
 * portable to both (MSSQL's `IS NULL` is a predicate, not a boolean expression, so it cannot be
 * selected directly the way MySQL's can; `CASE` works on every dialect here).
 */
export const emitOrderByTerm = (
  sqlHelper: SqlHelper,
  config: Dialect,
  tableNameOrAlias: string | undefined,
  columnName: string | undefined,
  direction: OrderByDirection,
  nulls: NullsOrder,
): void => {
  const columnSql =
    quoteIdentifier(tableNameOrAlias, config.identifierDelimiters) +
    '.' +
    quoteIdentifier(columnName, config.identifierDelimiters);

  const hasNativeNulls =
    config.databaseType === DatabaseType.Postgres || config.databaseType === DatabaseType.Sqlite;

  if (nulls !== NullsOrder.None && !hasNativeNulls) {
    const nullsFirst = nulls === NullsOrder.First;
    sqlHelper.addSqlSnippet(
      `CASE WHEN ${columnSql} IS NULL THEN ${nullsFirst ? '0' : '1'} ELSE ${nullsFirst ? '1' : '0'} END, `,
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
