import '../configuration.dart';
import '../enums.dart';
import '../errors/parser_error.dart';
import '../identifier.dart';
import '../sql_helper.dart';
import '../state.dart';
import 'comparison_operator.dart';
import 'default_full_text.dart';
import 'default_json.dart';

/// Stand-in column name used while rendering a comparison against a JSON extraction, then
/// substituted for the real expression. Deliberately unquotable and unlikely to occur in user data.
const _jsonColumnSentinel = '___json___';

void emitJsonExtractPredicate(
  SqlHelper sqlHelper,
  Dialect config,
  ParserMode mode, {
  required String? tableNameOrAlias,
  required String? columnName,
  required String? jsonPath,
  required JsonExtractMode? jsonExtractMode,
  required WhereOperator whereOperator,
  required List<Object?> values,
  required ParserArea area,
}) {
  if (tableNameOrAlias == null ||
      columnName == null ||
      jsonPath == null ||
      jsonExtractMode == null) {
    throw ParserError(
        area, 'JSON extract predicate requires table, column, path, and mode');
  }

  // The comparison operators are written against a plain column reference, so the JSON extraction
  // is rendered under a sentinel name and then substituted back in.
  //
  // This used to strip the sentinel by matching three hard-coded PREFIXES, which silently assumed
  // every operator puts the column first. Any operator that wraps it instead —
  // `REGEXP_LIKE(col, ?, 'i')` — matches none of them, and the sentinel leaks into the emitted SQL
  // as a nonexistent column. Substituting every occurrence works for any operator shape.
  final jsonScratch = SqlHelper(mode);
  emitJsonExtractExpression(
    jsonScratch,
    config,
    tableNameOrAlias,
    columnName,
    jsonPath,
    jsonExtractMode,
    area,
  );
  final jsonSql = jsonScratch.getSql();

  final scratch = SqlHelper(mode);
  emitComparisonPredicate(
    scratch,
    config,
    _jsonColumnSentinel,
    whereOperator,
    values.isNotEmpty ? values[0] : null,
    area,
  );

  final predicate = scratch.getSql().split(_jsonColumnSentinel).join(jsonSql);

  if (predicate.contains(_jsonColumnSentinel)) {
    throw ParserError(
        area, 'JSON predicate failed to resolve its column reference');
  }

  // The extraction's own bound values come first because it is leftmost in every operator shape
  // emitted here; positional placeholders would otherwise bind in the wrong order.
  sqlHelper.addSqlSnippetWithValues(predicate, [
    ...jsonScratch.getValues(),
    ...scratch.getValues(),
  ]);
}

void emitJsonContainsPredicate(
  SqlHelper sqlHelper,
  Dialect config, {
  required String? tableNameOrAlias,
  required String? columnName,
  required List<Object?> values,
  required ParserArea area,
}) {
  if (tableNameOrAlias == null || columnName == null) {
    throw ParserError(
        area, 'JSON contains predicate requires table and column');
  }

  emitJsonContainsExpression(
      sqlHelper, config, tableNameOrAlias, columnName, area);
  sqlHelper.addDynamicValue(values.isNotEmpty ? values[0] : null);

  if (config.databaseType == DatabaseType.postgres) {
    sqlHelper.addSqlSnippet('::jsonb');
  }

  if (config.databaseType == DatabaseType.mysql) {
    sqlHelper.addSqlSnippet(')');
  }
}

void emitFullTextMatchPredicate(
  SqlHelper sqlHelper,
  Dialect config,
  List<FullTextColumnRef> columns,
  FullTextMode mode,
  Object? value,
  ParserArea area,
) {
  emitFullTextPredicate(sqlHelper, config, columns, mode, area);
  sqlHelper.addDynamicValue(value);
  emitFullTextValueSuffix(sqlHelper, config, mode);
}

/// Emits one GROUP BY column reference.
void emitGroupByColumnRef(
  SqlHelper sqlHelper,
  Dialect config,
  String tableNameOrAlias,
  String columnName,
) {
  sqlHelper.addSqlSnippet(qualifiedColumn(
      tableNameOrAlias, columnName, config.identifierDelimiters));
}
