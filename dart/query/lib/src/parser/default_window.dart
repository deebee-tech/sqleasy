import '../configuration.dart';
import '../enums.dart';
import '../errors/parser_error.dart';
import '../identifier.dart';
import '../sql_helper.dart';
import '../state.dart';
import 'default_order_by.dart';

void _emitFrameBound(SqlHelper sqlHelper, WindowFrameBoundState bound) {
  switch (bound.type) {
    case FrameBoundType.unboundedPreceding:
      sqlHelper.addSqlSnippet('UNBOUNDED PRECEDING');
    case FrameBoundType.preceding:
      sqlHelper.addSqlSnippet('${bound.offset ?? 0} PRECEDING');
    case FrameBoundType.currentRow:
      sqlHelper.addSqlSnippet('CURRENT ROW');
    case FrameBoundType.following:
      sqlHelper.addSqlSnippet('${bound.offset ?? 0} FOLLOWING');
    case FrameBoundType.unboundedFollowing:
      sqlHelper.addSqlSnippet('UNBOUNDED FOLLOWING');
  }
}

/// True when a frame bound carries a numeric offset (`n PRECEDING` / `n FOLLOWING`) rather than one
/// of the unbounded/current-row keywords.
bool _hasNumericOffset(WindowFrameBoundState? bound) =>
    bound?.type == FrameBoundType.preceding ||
    bound?.type == FrameBoundType.following;

SqlHelper defaultWindow(
  WindowState windowState,
  Dialect config,
  ParserMode mode,
) {
  final sqlHelper = SqlHelper(mode);

  sqlHelper.addSqlSnippet('OVER (');

  var needsSpace = false;

  if (windowState.partitionByStates.isNotEmpty) {
    sqlHelper.addSqlSnippet('PARTITION BY ');
    for (var i = 0; i < windowState.partitionByStates.length; i++) {
      final partition = windowState.partitionByStates[i];
      if (partition.raw != null) {
        sqlHelper.addSqlSnippet(partition.raw!);
      } else {
        sqlHelper.addSqlSnippet(
          qualifiedColumn(partition.tableNameOrAlias, partition.columnName,
              config.identifierDelimiters),
        );
      }
      if (i < windowState.partitionByStates.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }
    }
    needsSpace = true;
  }

  if (windowState.orderByStates.isNotEmpty) {
    if (needsSpace) {
      sqlHelper.addSqlSnippet(' ');
    }
    sqlHelper.addSqlSnippet('ORDER BY ');
    for (var i = 0; i < windowState.orderByStates.length; i++) {
      final orderBy = windowState.orderByStates[i];
      if (orderBy.raw != null) {
        sqlHelper.addSqlSnippet(orderBy.raw!);
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
    }
    needsSpace = true;
  }

  final frame = windowState.frame;
  if (frame != null) {
    if (needsSpace) {
      sqlHelper.addSqlSnippet(' ');
    }

    if (frame.raw != null) {
      sqlHelper.addSqlSnippet(frame.raw!);
    } else {
      // This file used to carry no dialect branching at all, on the stated assumption that window
      // frames are identical everywhere. They are not, in exactly one place: T-SQL's RANGE accepts
      // only UNBOUNDED PRECEDING, CURRENT ROW and UNBOUNDED FOLLOWING.
      if (config.databaseType == DatabaseType.mssql &&
          frame.unit == FrameUnit.range &&
          (_hasNumericOffset(frame.start) || _hasNumericOffset(frame.end))) {
        throw ParserError(
          ParserArea.select,
          'MSSQL RANGE frames accept only UNBOUNDED PRECEDING, CURRENT ROW and UNBOUNDED '
          'FOLLOWING — use a ROWS frame for a numeric offset',
        );
      }

      sqlHelper
          .addSqlSnippet(frame.unit == FrameUnit.rows ? 'ROWS ' : 'RANGE ');

      if (frame.end != null) {
        sqlHelper.addSqlSnippet('BETWEEN ');
        _emitFrameBound(sqlHelper, frame.start);
        sqlHelper.addSqlSnippet(' AND ');
        _emitFrameBound(sqlHelper, frame.end!);
      } else {
        _emitFrameBound(sqlHelper, frame.start);
      }
    }
  }

  sqlHelper.addSqlSnippet(')');

  return sqlHelper;
}
