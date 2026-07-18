import type { Dialect } from '../configuration/configuration';
import { FrameBoundType } from '../enums/frame-bound-type';
import { FrameUnit } from '../enums/frame-unit';
import type { ParserMode } from '../enums/parser-mode';
import { quoteIdentifier } from '../helpers/identifier';
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
 * Renders a window's `OVER (...)` clause: `PARTITION BY`, `ORDER BY` (with `NULLS FIRST`/`LAST`
 * — see {@link emitOrderByTerm}), and an optional `ROWS`/`RANGE` frame. Standard SQL, identical
 * across all four dialects, so there is no dialect branching here.
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
