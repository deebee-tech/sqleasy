import '../configuration.dart';
import '../enums.dart';
import '../errors/parser_error.dart';
import '../identifier.dart';
import '../sql_helper.dart';
import '../state.dart';
import 'default_order_by.dart';

/// Ordered string aggregation, in three grammars behind two engine-native names.
///
/// Mirrors the TypeScript port. The names split because the engines disagree on the word:
/// `string_agg` on Postgres/SQLite/MSSQL, `GROUP_CONCAT` on MySQL/SQLite. Grammar measured:
///
///     Postgres  string_agg(x, sep ORDER BY y)         sep MANDATORY; ORDER BY inside parens
///     SQLite    group_concat(x[, sep] ORDER BY y)     sep OPTIONAL; DISTINCT allows one arg only
///     MySQL     GROUP_CONCAT(x ORDER BY y SEPARATOR s) SEPARATOR keyword; ORDER BY before it
///     MSSQL     STRING_AGG(x, sep) WITHIN GROUP (…)    sep MANDATORY; order in WITHIN GROUP; no DISTINCT
void _emitOrderKeys(
    SqlHelper sqlHelper, Dialect config, List<StringAggOrderKey> keys) {
  for (var i = 0; i < keys.length; i++) {
    emitOrderByTerm(sqlHelper, config, keys[i].tableNameOrAlias,
        keys[i].columnName, keys[i].direction, NullsOrder.none);
    if (i < keys.length - 1) sqlHelper.addSqlSnippet(', ');
  }
}

void emitStringAggregation(
  SqlHelper sqlHelper,
  Dialect config,
  String exprTable,
  String exprColumn,
  SelectState state,
  ParserArea area,
) {
  final column =
      qualifiedColumn(exprTable, exprColumn, config.identifierDelimiters);
  final db = config.databaseType;
  final fn = state.stringAggFunction;
  final orderBy = state.stringAggOrderBy;

  if (fn == 'string_agg') {
    if (db == DatabaseType.mysql) {
      throw ParserError(area,
          'MySQL has no string_agg — use groupConcat, its engine-native name');
    }
    if (!state.stringAggHasSeparator) {
      throw ParserError(
        area,
        '${db == DatabaseType.mssql ? 'MSSQL' : 'Postgres'} string_agg requires a separator — '
        'there is no one-argument form. Pass the separator you want between values.',
      );
    }

    if (db == DatabaseType.mssql) {
      if (state.stringAggDistinct) {
        throw ParserError(
          area,
          'MSSQL STRING_AGG has no DISTINCT — it is the only engine of the four without it here. '
          'De-duplicate in a subquery first, or use a different engine for this query.',
        );
      }
      sqlHelper.addSqlSnippet('STRING_AGG(');
      sqlHelper.addSqlSnippet(column);
      sqlHelper.addSqlSnippet(', ');
      sqlHelper.addDynamicValue(state.stringAggSeparator);
      sqlHelper.addSqlSnippet(')');
      if (orderBy.isNotEmpty) {
        sqlHelper.addSqlSnippet(' WITHIN GROUP (ORDER BY ');
        _emitOrderKeys(sqlHelper, config, orderBy);
        sqlHelper.addSqlSnippet(')');
      }
      return;
    }

    sqlHelper.addSqlSnippet('string_agg(');
    if (state.stringAggDistinct) sqlHelper.addSqlSnippet('DISTINCT ');
    sqlHelper.addSqlSnippet(column);
    sqlHelper.addSqlSnippet(', ');
    sqlHelper.addDynamicValue(state.stringAggSeparator);
    if (orderBy.isNotEmpty) {
      if (db == DatabaseType.postgres && state.stringAggDistinct) {
        final bad = orderBy.any((k) =>
            k.tableNameOrAlias != exprTable || k.columnName != exprColumn);
        if (bad || orderBy.length > 1) {
          throw ParserError(
            area,
            'Postgres string_agg(DISTINCT …) can only ORDER BY the aggregated expression itself — '
            'a different sort key is rejected by the engine. Drop DISTINCT, or sort by the same column.',
          );
        }
      }
      sqlHelper.addSqlSnippet(' ORDER BY ');
      _emitOrderKeys(sqlHelper, config, orderBy);
    }
    sqlHelper.addSqlSnippet(')');
    return;
  }

  // group_concat
  if (db == DatabaseType.postgres || db == DatabaseType.mssql) {
    throw ParserError(
      area,
      '${db == DatabaseType.postgres ? 'Postgres' : 'MSSQL'} has no GROUP_CONCAT — use stringAgg, '
      'its engine-native name.',
    );
  }

  if (db == DatabaseType.mysql) {
    sqlHelper.addSqlSnippet('GROUP_CONCAT(');
    if (state.stringAggDistinct) sqlHelper.addSqlSnippet('DISTINCT ');
    sqlHelper.addSqlSnippet(column);
    if (orderBy.isNotEmpty) {
      sqlHelper.addSqlSnippet(' ORDER BY ');
      _emitOrderKeys(sqlHelper, config, orderBy);
    }
    if (state.stringAggHasSeparator) {
      sqlHelper.addSqlSnippet(' SEPARATOR ');
      sqlHelper.addDynamicValue(state.stringAggSeparator);
    }
    sqlHelper.addSqlSnippet(')');
    return;
  }

  // SQLite
  if (state.stringAggDistinct && state.stringAggHasSeparator) {
    throw ParserError(
      area,
      'SQLite group_concat(DISTINCT …) takes only one argument, so it cannot carry a custom '
      "separator — the result uses the default ','. Drop the separator, or drop DISTINCT.",
    );
  }
  sqlHelper.addSqlSnippet('group_concat(');
  if (state.stringAggDistinct) sqlHelper.addSqlSnippet('DISTINCT ');
  sqlHelper.addSqlSnippet(column);
  if (state.stringAggHasSeparator) {
    sqlHelper.addSqlSnippet(', ');
    sqlHelper.addDynamicValue(state.stringAggSeparator);
  }
  if (orderBy.isNotEmpty) {
    sqlHelper.addSqlSnippet(' ORDER BY ');
    _emitOrderKeys(sqlHelper, config, orderBy);
  }
  sqlHelper.addSqlSnippet(')');
}
