import '../configuration.dart';
import '../enums.dart';
import '../errors/parser_error.dart';
import '../identifier.dart';
import '../sql_helper.dart';
import '../state.dart';

/// Row-value comparison: `(a, b) > (?, ?)` and `(a, b) IN ((?,?), (?,?))`.
///
/// Mirrors the TypeScript port. The keyset-pagination predicate and the composite-key lookup —
/// the only formulation of a keyset page that stays correct across ties and uses the composite
/// index. Measured:
///
///     (a, b) > (?, ?) / IN ((?,?),…) / = (?,?)   Postgres, MySQL, SQLite 3.15+   accepted
///     any of the above                            MSSQL                          Msg — no row ctor
///
/// T-SQL has no row constructor in a comparison in any version, and the OR-chain rewrite is exactly
/// the emulation this library refuses. So MSSQL refuses and says why.
const _mssqlRefusal =
    'MSSQL has no row-value constructor in a comparison — `(a, b) > (?, ?)` and `(a, b) IN (…)` are '
    'not T-SQL in any version. The equivalent OR-chain (a > ? OR (a = ? AND b > ?)) is an emulation '
    'this library will not synthesize for you: it changes the query plan and the NULL handling. '
    'Write that predicate yourself with whereRaw/whereGroup if you need it on SQL Server.';

void _emitTuple(
    SqlHelper sqlHelper, Dialect config, List<GroupByColumnRef> columns) {
  sqlHelper.addSqlSnippet('(');
  for (var i = 0; i < columns.length; i++) {
    sqlHelper.addSqlSnippet(qualifiedColumn(columns[i].tableNameOrAlias,
        columns[i].columnName, config.identifierDelimiters));
    if (i < columns.length - 1) sqlHelper.addSqlSnippet(', ');
  }
  sqlHelper.addSqlSnippet(')');
}

String _rowValueOperatorSql(WhereOperator op, ParserArea area) {
  switch (op) {
    case WhereOperator.equals:
      return '=';
    case WhereOperator.notEquals:
      return '<>';
    case WhereOperator.greaterThan:
      return '>';
    case WhereOperator.greaterThanOrEquals:
      return '>=';
    case WhereOperator.lessThan:
      return '<';
    case WhereOperator.lessThanOrEquals:
      return '<=';
    default:
      throw ParserError(
        area,
        'A row-value comparison takes only =, <>, <, <=, > or >= — LIKE, IS NULL and BETWEEN have '
        'no meaning on a tuple. Use a single-column predicate for those.',
      );
  }
}

void emitRowValueComparison(
    SqlHelper sqlHelper, Dialect config, WhereState cur, ParserArea area) {
  if (config.databaseType == DatabaseType.mssql) {
    throw ParserError(area, _mssqlRefusal);
  }

  final columns = cur.rowColumns ?? const <GroupByColumnRef>[];
  final rhs =
      (cur.values.isNotEmpty ? cur.values[0] : null) as List<Object?>? ??
          const <Object?>[];
  if (columns.length < 2) {
    throw ParserError(
        area, 'A row-value comparison needs at least two columns');
  }
  if (rhs.length != columns.length) {
    throw ParserError(
      area,
      'A row-value comparison needs one value per column — got ${columns.length} columns and '
      '${rhs.length} values',
    );
  }

  _emitTuple(sqlHelper, config, columns);
  sqlHelper.addSqlSnippet(' ${_rowValueOperatorSql(cur.whereOperator, area)} ');
  sqlHelper.addSqlSnippet('(');
  for (var i = 0; i < rhs.length; i++) {
    sqlHelper.addDynamicValue(rhs[i]);
    if (i < rhs.length - 1) sqlHelper.addSqlSnippet(', ');
  }
  sqlHelper.addSqlSnippet(')');
}

void emitRowValueIn(
    SqlHelper sqlHelper, Dialect config, WhereState cur, ParserArea area) {
  if (config.databaseType == DatabaseType.mssql) {
    throw ParserError(area, _mssqlRefusal);
  }

  final columns = cur.rowColumns ?? const <GroupByColumnRef>[];
  final tuples = cur.values;
  if (columns.length < 2) {
    throw ParserError(area, 'A row-value IN needs at least two columns');
  }
  if (tuples.isEmpty) {
    throw ParserError(area, 'A row-value IN needs at least one tuple');
  }
  for (final tuple in tuples) {
    if (tuple is! List || tuple.length != columns.length) {
      throw ParserError(
        area,
        'Every tuple in a row-value IN must have ${columns.length} values to match the columns',
      );
    }
  }

  _emitTuple(sqlHelper, config, columns);
  sqlHelper.addSqlSnippet(' IN (');
  for (var ti = 0; ti < tuples.length; ti++) {
    final tuple = tuples[ti] as List;
    sqlHelper.addSqlSnippet('(');
    for (var vi = 0; vi < tuple.length; vi++) {
      sqlHelper.addDynamicValue(tuple[vi]);
      if (vi < tuple.length - 1) sqlHelper.addSqlSnippet(', ');
    }
    sqlHelper.addSqlSnippet(')');
    if (ti < tuples.length - 1) sqlHelper.addSqlSnippet(', ');
  }
  sqlHelper.addSqlSnippet(')');
}
