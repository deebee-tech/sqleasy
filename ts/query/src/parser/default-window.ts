import type { Dialect } from '../configuration/configuration';
import { FrameBoundType } from '../enums/frame-bound-type';
import { DatabaseType } from '../enums/database-type';
import { FrameUnit } from '../enums/frame-unit';
import { ParserArea } from '../enums/parser-area';
import type { ParserMode } from '../enums/parser-mode';
import { quoteIdentifier } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';
import { emitOrderByTerm } from './default-order-by';
import type { WindowFrameBoundState, WindowState } from '../state/window';

const emitFrameBound = (sqlHelper: SqlHelper, bound: WindowFrameBoundState): void => {
  switch (bound.type) {
    case FrameBoundType.UnboundedPreceding:
      sqlHelper.addSqlSnippet('UNBOUNDED PRECEDING');
      break;
    case FrameBoundType.Preceding:
      sqlHelper.addSqlSnippet(`${bound.offset ?? 0} PRECEDING`);
      break;
    case FrameBoundType.CurrentRow:
      sqlHelper.addSqlSnippet('CURRENT ROW');
      break;
    case FrameBoundType.Following:
      sqlHelper.addSqlSnippet(`${bound.offset ?? 0} FOLLOWING`);
      break;
    case FrameBoundType.UnboundedFollowing:
      sqlHelper.addSqlSnippet('UNBOUNDED FOLLOWING');
      break;
  }
};

/**
 * True when a frame bound carries a numeric offset (`n PRECEDING` / `n FOLLOWING`) rather than one
 * of the unbounded/current-row keywords.
 */
const hasNumericOffset = (bound: WindowFrameBoundState | undefined): boolean =>
  bound?.type === FrameBoundType.Preceding || bound?.type === FrameBoundType.Following;

/**
 * Renders a window's `OVER (...)` clause: `PARTITION BY`, `ORDER BY` (with `NULLS FIRST`/`LAST`
 * — see {@link emitOrderByTerm}), and an optional `ROWS`/`RANGE` frame.
 *
 * Nearly identical across the four dialects, with one real exception: T-SQL's `RANGE` accepts only
 * `UNBOUNDED PRECEDING`, `CURRENT ROW` and `UNBOUNDED FOLLOWING`. A numeric offset is valid on
 * `ROWS` but not on `RANGE`, and `RANGE 5 PRECEDING` is a syntax error on every SQL Server version.
 * Postgres, MySQL 8.0+ and SQLite 3.28+ all accept it.
 */
export const defaultWindow = (
  windowState: WindowState,
  config: Dialect,
  mode: ParserMode,
): SqlHelper => {
  const sqlHelper = new SqlHelper(mode);

  sqlHelper.addSqlSnippet('OVER (');

  let needsSpace = false;

  if (windowState.partitionByStates.length > 0) {
    sqlHelper.addSqlSnippet('PARTITION BY ');
    windowState.partitionByStates.forEach((partition, i) => {
      if (partition.raw !== undefined) {
        sqlHelper.addSqlSnippet(partition.raw);
      } else {
        sqlHelper.addSqlSnippet(
          quoteIdentifier(partition.tableNameOrAlias, config.identifierDelimiters) +
            '.' +
            quoteIdentifier(partition.columnName, config.identifierDelimiters),
        );
      }
      if (i < windowState.partitionByStates.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }
    });
    needsSpace = true;
  }

  if (windowState.orderByStates.length > 0) {
    if (needsSpace) {
      sqlHelper.addSqlSnippet(' ');
    }
    sqlHelper.addSqlSnippet('ORDER BY ');
    windowState.orderByStates.forEach((orderBy, i) => {
      if (orderBy.raw !== undefined) {
        sqlHelper.addSqlSnippet(orderBy.raw);
      } else {
        emitOrderByTerm(
          sqlHelper,
          config,
          orderBy.tableNameOrAlias,
          orderBy.columnName,
          orderBy.direction,
          orderBy.nulls,
        );
      }
      if (i < windowState.orderByStates.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }
    });
    needsSpace = true;
  }

  if (windowState.frame) {
    if (needsSpace) {
      sqlHelper.addSqlSnippet(' ');
    }

    if (windowState.frame.raw !== undefined) {
      sqlHelper.addSqlSnippet(windowState.frame.raw);
    } else {
      // This file used to carry no dialect branching at all, on the stated assumption that window
      // frames are identical everywhere. They are not, in exactly one place.
      if (
        config.databaseType === DatabaseType.Mssql &&
        windowState.frame.unit === FrameUnit.Range &&
        (hasNumericOffset(windowState.frame.start) || hasNumericOffset(windowState.frame.end))
      ) {
        throw new ParserError(
          ParserArea.Select,
          'MSSQL RANGE frames accept only UNBOUNDED PRECEDING, CURRENT ROW and UNBOUNDED ' +
            'FOLLOWING — use a ROWS frame for a numeric offset',
        );
      }

      sqlHelper.addSqlSnippet(windowState.frame.unit === FrameUnit.Rows ? 'ROWS ' : 'RANGE ');

      if (windowState.frame.end) {
        sqlHelper.addSqlSnippet('BETWEEN ');
        emitFrameBound(sqlHelper, windowState.frame.start);
        sqlHelper.addSqlSnippet(' AND ');
        emitFrameBound(sqlHelper, windowState.frame.end);
      } else {
        emitFrameBound(sqlHelper, windowState.frame.start);
      }
    }
  }

  sqlHelper.addSqlSnippet(')');

  return sqlHelper;
};
