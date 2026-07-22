import '../configuration.dart';
import '../enums.dart';
import '../errors/parser_error.dart';
import '../identifier.dart';
import '../sql_helper.dart';
import '../state.dart';
import 'default_where.dart';

/// The five aggregate calls, rendered.
///
/// A CALL NODE: one function, one operand, an optional DISTINCT. Nothing nests inside it and
/// nothing composes with it — SQLEasy models clauses rather than expressions, and that stays true.
/// What changed is only that `COUNT(x)` was common enough that reaching it exclusively through
/// `selectRaw` cost more than the node does: `HAVING COUNT(*) > 5` was `havingRaw` only.
///
/// All five are identical text on all four engines, DISTINCT included. Measured:
///
///     COUNT(*) · COUNT(col) · COUNT(DISTINCT col) · SUM(DISTINCT col) · AVG/MIN/MAX
///       Postgres 17, MySQL 8.4, SQLite 3.51, MSSQL 2022 — all accepted
///     COUNT(DISTINCT *)
///       rejected by all four (SQLite: `near "*": syntax error`)
const Map<AggregateFunction, String> _sqlName = {
  AggregateFunction.count: 'COUNT',
  AggregateFunction.sum: 'SUM',
  AggregateFunction.avg: 'AVG',
  AggregateFunction.min: 'MIN',
  AggregateFunction.max: 'MAX',
};

/// Renders `FN(`, `FN(DISTINCT `, the operand, and `)`.
///
/// The star is emitted bare — quoting it would produce `"*"`, a column literally named `*`.
void emitAggregateCall(
  SqlHelper sqlHelper,
  Dialect config,
  AggregateFunction aggregate,
  String tableNameOrAlias,
  String columnName,
  bool distinct,
  ParserArea area, {
  QueryState? filter,
  ParserMode? mode,
}) {
  final isStar = columnName == aggregateStar;
  final name = _sqlName[aggregate]!;

  // `SUM(*)` is not a syntax error — Postgres answers "function sum() does not exist", because `*`
  // makes it a zero-argument call. Only COUNT has a star form, so the refusal has to be ours.
  if (isStar && aggregate != AggregateFunction.count) {
    throw ParserError(
      area,
      '$name(*) is not a function any dialect has — only COUNT takes the star. Aggregate a column '
      'instead, or use count if you meant "how many rows".',
    );
  }

  if (isStar && distinct) {
    throw ParserError(
      area,
      'COUNT(DISTINCT *) is rejected by every dialect — `*` is not a value that can be compared '
      'for distinctness. Name the column whose distinct values you want to count.',
    );
  }

  if (!isStar && columnName.isEmpty) {
    throw ParserError(area, "$name requires a column, or '*' for count");
  }

  sqlHelper.addSqlSnippet(name);
  sqlHelper.addSqlSnippet('(');
  if (distinct) {
    sqlHelper.addSqlSnippet('DISTINCT ');
  }
  sqlHelper.addSqlSnippet(isStar
      ? aggregateStar
      : qualifiedColumn(
          tableNameOrAlias, columnName, config.identifierDelimiters));
  sqlHelper.addSqlSnippet(')');

  if (filter != null) {
    _emitAggregateFilter(sqlHelper, config, filter, mode!, area);
  }
}

/// `FILTER (WHERE …)` on the aggregate just emitted.
///
/// Postgres 9.4+ and SQLite 3.30+ only. MySQL and MSSQL have no FILTER clause, and this is where
/// the refusal MUST live — `FILTER` is not a reserved word there, so `COUNT(*) FILTER` parses as a
/// column alias and a bad emission is a silently mis-aliased column, not a syntax error.
void _emitAggregateFilter(
  SqlHelper sqlHelper,
  Dialect config,
  QueryState filter,
  ParserMode mode,
  ParserArea area,
) {
  if (config.databaseType == DatabaseType.mysql ||
      config.databaseType == DatabaseType.mssql) {
    throw ParserError(
      area,
      '${config.databaseType == DatabaseType.mysql ? 'MySQL' : 'MSSQL'} has no FILTER clause on '
      'aggregates — and it cannot be emitted safely, because FILTER parses as a column alias '
      'there rather than erroring. Use conditional aggregation instead, e.g. '
      'COUNT(CASE WHEN <pred> THEN 1 END), which you can build with selectRaw.',
    );
  }

  if (filter.whereStates.isEmpty) {
    throw ParserError(area, 'FILTER requires a WHERE predicate');
  }

  final where = defaultWhere(filter, config, mode);
  var whereSql = where.getSql();
  if (whereSql.startsWith('WHERE ')) {
    whereSql = whereSql.substring('WHERE '.length);
  }

  sqlHelper.addSqlSnippet(' FILTER (WHERE ');
  sqlHelper.addSqlSnippetWithValues(whereSql, where.getValues());
  sqlHelper.addSqlSnippet(')');
}
