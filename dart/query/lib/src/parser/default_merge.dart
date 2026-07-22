import '../configuration.dart';
import '../dialect_name.dart';
import '../enums.dart';
import '../errors/parser_error.dart';
import '../identifier.dart';
import '../sql_helper.dart';
import 'default_mutation_row_cap.dart';
import '../state.dart';
import 'default_join.dart';
import 'to_sql.dart';

String _qi(String? name, Dialect config) =>
    quoteIdentifier(name, config.identifierDelimiters);

String _columnRef(Dialect config, String alias, String column) =>
    '${_qi(alias, config)}.${_qi(column, config)}';

String _usingAlias(MergeState state) => state.using?.alias ?? 'source';

void _emitExpr(
    SqlHelper sqlHelper, Dialect config, MergeState state, MergeExpr expr) {
  switch (expr) {
    case MergeSourceExpr(:final columnName):
      sqlHelper
          .addSqlSnippet(_columnRef(config, _usingAlias(state), columnName));
    case MergeTargetExpr(:final columnName):
      sqlHelper
          .addSqlSnippet(_columnRef(config, state.targetAlias, columnName));
    case MergeValueExpr(:final value):
      sqlHelper.addDynamicValue(value);
    case MergeRawExpr(:final sql):
      sqlHelper.addSqlSnippet(sql);
  }
}

void _emitAnd(SqlHelper sqlHelper, Dialect config, MergeWhenState when) {
  final and = when.and;
  if (and == null || and.isEmpty) return;
  sqlHelper.addSqlSnippet(' AND ');
  renderJoinOnConditions(sqlHelper, config, and);
}

void _emitAction(SqlHelper sqlHelper, Dialect config, MergeState state,
    MergeWhenAction action) {
  switch (action) {
    case MergeDeleteAction():
      sqlHelper.addSqlSnippet('DELETE');
    case MergeUpdateAction(:final assignments, :final raw):
      sqlHelper.addSqlSnippet('UPDATE SET ');
      if (raw != null) {
        sqlHelper.addSqlSnippet(raw);
        return;
      }
      if (assignments.isEmpty) {
        throw ParserError(ParserArea.merge,
            'MERGE UPDATE requires at least one SET assignment');
      }
      for (var i = 0; i < assignments.length; i++) {
        sqlHelper.addSqlSnippet(_qi(assignments[i].columnName, config));
        sqlHelper.addSqlSnippet(' = ');
        _emitExpr(sqlHelper, config, state, assignments[i].value);
        if (i < assignments.length - 1) sqlHelper.addSqlSnippet(', ');
      }
    case MergeInsertAction(:final columns, :final values):
      if (columns.length != values.length) {
        throw ParserError(ParserArea.merge,
            'MERGE INSERT column count must equal the VALUES count');
      }
      sqlHelper.addSqlSnippet('INSERT (');
      for (var i = 0; i < columns.length; i++) {
        sqlHelper.addSqlSnippet(_qi(columns[i], config));
        if (i < columns.length - 1) sqlHelper.addSqlSnippet(', ');
      }
      sqlHelper.addSqlSnippet(') VALUES (');
      for (var i = 0; i < values.length; i++) {
        _emitExpr(sqlHelper, config, state, values[i]);
        if (i < values.length - 1) sqlHelper.addSqlSnippet(', ');
      }
      sqlHelper.addSqlSnippet(')');
    case MergeInsertDefaultValuesAction():
      sqlHelper.addSqlSnippet('INSERT DEFAULT VALUES');
  }
}

String _whenKeyword(MergeWhenMatch match) {
  switch (match) {
    case MergeWhenMatch.matched:
      return 'WHEN MATCHED';
    case MergeWhenMatch.notMatchedByTarget:
      return 'WHEN NOT MATCHED BY TARGET';
    case MergeWhenMatch.notMatchedBySource:
      return 'WHEN NOT MATCHED BY SOURCE';
  }
}

void _emitUsing(SqlHelper sqlHelper, Dialect config, ParserMode mode,
    MergeUsing using, ToSqlOptions? options) {
  sqlHelper.addSqlSnippet('USING ');
  switch (using) {
    case MergeUsingValues(:final alias, :final columns, :final rows):
      if (rows.isEmpty) {
        throw ParserError(ParserArea.merge,
            'MERGE USING (VALUES …) requires at least one row');
      }
      sqlHelper.addSqlSnippet('(VALUES ');
      for (var r = 0; r < rows.length; r++) {
        final row = rows[r];
        if (row.length != columns.length) {
          throw ParserError(ParserArea.merge,
              'MERGE USING VALUES row width must equal the column count');
        }
        sqlHelper.addSqlSnippet('(');
        for (var c = 0; c < row.length; c++) {
          sqlHelper.addDynamicValue(row[c]);
          if (c < row.length - 1) sqlHelper.addSqlSnippet(', ');
        }
        sqlHelper.addSqlSnippet(')');
        if (r < rows.length - 1) sqlHelper.addSqlSnippet(', ');
      }
      sqlHelper.addSqlSnippet(') AS ');
      sqlHelper.addSqlSnippet(_qi(alias, config));
      sqlHelper.addSqlSnippet(' (');
      for (var i = 0; i < columns.length; i++) {
        sqlHelper.addSqlSnippet(_qi(columns[i], config));
        if (i < columns.length - 1) sqlHelper.addSqlSnippet(', ');
      }
      sqlHelper.addSqlSnippet(')');
    case MergeUsingTable(:final alias, :final table, :final owner):
      if (owner != null && owner.isNotEmpty) {
        sqlHelper.addSqlSnippet(_qi(owner, config));
        sqlHelper.addSqlSnippet('.');
      }
      sqlHelper.addSqlSnippet(_qi(table, config));
      sqlHelper.addSqlSnippet(' AS ');
      sqlHelper.addSqlSnippet(_qi(alias, config));
    case MergeUsingSelect(:final alias, :final subquery):
      final sub = defaultToSql(subquery, config, mode, options);
      sqlHelper.addSqlSnippetWithValues('(${sub.getSql()})', sub.getValues());
      sqlHelper.addSqlSnippet(' AS ');
      sqlHelper.addSqlSnippet(_qi(alias, config));
    case MergeUsingRaw(:final alias, :final sql):
      sqlHelper.addSqlSnippet(sql);
      sqlHelper.addSqlSnippet(' AS ');
      sqlHelper.addSqlSnippet(_qi(alias, config));
  }
}

int _unconditionalCount(List<MergeWhenState> whens, MergeWhenMatch match) =>
    whens
        .where((w) => w.match == match && (w.and == null || w.and!.isEmpty))
        .length;

void _validateWhenCardinality(MergeState state) {
  final whens = state.whenStates;
  if (whens.isEmpty) {
    throw ParserError(
        ParserArea.merge, 'MERGE requires at least one WHEN clause');
  }

  final matched =
      whens.where((w) => w.match == MergeWhenMatch.matched).toList();
  if (matched.length > 2) {
    throw ParserError(ParserArea.merge,
        'MERGE allows at most two WHEN MATCHED clauses (one UPDATE and one DELETE)');
  }
  if (matched.length == 2) {
    final kinds = matched.map((w) => w.action.runtimeType).toSet();
    if (!(kinds.contains(MergeUpdateAction) &&
        kinds.contains(MergeDeleteAction))) {
      throw ParserError(ParserArea.merge,
          'two WHEN MATCHED clauses must be one UPDATE and one DELETE, not two of the same');
    }
    final first = matched.first;
    if (first.and == null || first.and!.isEmpty) {
      throw ParserError(ParserArea.merge,
          'with two WHEN MATCHED clauses the first must carry an AND condition');
    }
  }
  if (_unconditionalCount(whens, MergeWhenMatch.matched) > 1) {
    throw ParserError(ParserArea.merge,
        'MERGE allows at most one unconditional WHEN MATCHED');
  }
  if (_unconditionalCount(whens, MergeWhenMatch.notMatchedByTarget) > 1) {
    throw ParserError(ParserArea.merge,
        'MERGE allows at most one unconditional WHEN NOT MATCHED BY TARGET');
  }
}

/// Renders a T-SQL `MERGE` statement from [MergeState]. Native T-SQL only — every other dialect is
/// refused. Replaced the parked upsert-shaped emitter, which structurally could not carry a USING
/// alias, an arbitrary ON, WHEN NOT MATCHED BY SOURCE, DELETE arms, or multiple WHENs.
SqlHelper defaultMerge(
  QueryState state,
  Dialect config,
  ParserMode mode, [
  ToSqlOptions? options,
]) {
  final sqlHelper = SqlHelper(mode);

  if (config.databaseType != DatabaseType.mssql) {
    throw ParserError(ParserArea.merge,
        '${dialectDisplayName(config.databaseType)} has no MERGE statement — it is native T-SQL only');
  }

  final merge = state.mergeState;
  if (merge == null || merge.targetTable == null) {
    throw ParserError(
        ParserArea.merge, 'MERGE requires a target table — call into(...)');
  }
  if (merge.using == null) {
    throw ParserError(ParserArea.merge, 'MERGE requires a USING source');
  }
  if (merge.onStates.isEmpty) {
    throw ParserError(ParserArea.merge, 'MERGE requires an ON condition');
  }
  _validateWhenCardinality(merge);

  // MERGE [INTO] <target> [WITH (hint)] [AS alias] — the hint precedes the alias.
  sqlHelper.addSqlSnippet('MERGE ');
  // T-SQL: `MERGE TOP (n) INTO t ...` — between the verb and INTO.
  sqlHelper.addSqlSnippet(mssqlStatementTop(state, config));
  sqlHelper.addSqlSnippet('INTO ');
  final owner = (merge.targetOwner != null && merge.targetOwner!.isNotEmpty)
      ? merge.targetOwner
      : config.defaultOwner;
  sqlHelper.addSqlSnippet(_qi(owner, config));
  sqlHelper.addSqlSnippet('.');
  sqlHelper.addSqlSnippet(_qi(merge.targetTable, config));
  if (merge.holdlock == true) {
    sqlHelper.addSqlSnippet(' WITH (HOLDLOCK)');
  }
  sqlHelper.addSqlSnippet(' AS ');
  sqlHelper.addSqlSnippet(_qi(merge.targetAlias, config));
  sqlHelper.addSqlSnippet(' ');

  _emitUsing(sqlHelper, config, mode, merge.using!, options);

  sqlHelper.addSqlSnippet(' ON ');
  renderJoinOnConditions(sqlHelper, config, merge.onStates);

  for (final when in merge.whenStates) {
    sqlHelper.addSqlSnippet(' ');
    sqlHelper.addSqlSnippet(_whenKeyword(when.match));
    _emitAnd(sqlHelper, config, when);
    sqlHelper.addSqlSnippet(' THEN ');
    _emitAction(sqlHelper, config, merge, when.action);
  }

  if (merge.outputRaw != null) {
    sqlHelper.addSqlSnippet(' OUTPUT ');
    sqlHelper.addSqlSnippet(merge.outputRaw!);
  }

  // The terminating semicolon is MANDATORY on MERGE. MERGE is top-level, so always emitted.
  sqlHelper.addSqlSnippet(';');

  return sqlHelper;
}
