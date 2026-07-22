import '../configuration.dart';
import '../enums.dart';
import '../errors/parser_error.dart';
import '../sql_helper.dart';
import '../state.dart';
import 'default_json_predicate.dart';

void _emitColumnList(
  SqlHelper sqlHelper,
  Dialect config,
  List<GroupByColumnRef> columns,
) {
  for (var i = 0; i < columns.length; i++) {
    emitGroupByColumnRef(
      sqlHelper,
      config,
      columns[i].tableNameOrAlias,
      columns[i].columnName,
    );
    if (i < columns.length - 1) {
      sqlHelper.addSqlSnippet(', ');
    }
  }
}

List<GroupByColumnRef> _collectPlainColumns(List<GroupByState> groupByStates) {
  return [
    for (final state in groupByStates)
      if (state.builderType == BuilderType.groupByColumn)
        GroupByColumnRef(
          state.tableNameOrAlias ?? '',
          state.columnName ?? '',
        ),
  ];
}

/// Emits the GROUP BY list, with EVERY grouping element the caller set.
///
/// Mirrors the TypeScript port. This used `firstWhere`-style lookup of the first
/// ROLLUP/CUBE/GROUPING SETS and emitted only that, discarding every other grouping element with no
/// word — wrong results, no error, in either order. Found by the mechanical clause-pair sweep in
/// `scripts/check-silent-noops.mjs`.
///
/// ROLLUP is an ELEMENT on Postgres and MSSQL and a trailing SUFFIX on MySQL, measured:
///
///     Postgres 17  GROUP BY ROLLUP(a), b / a, ROLLUP(b) / ROLLUP(a), CUBE(b)   all OK
///     MSSQL 2022   GROUP BY ROLLUP(a), b                                       OK
///     MySQL 8.4    GROUP BY a, b WITH ROLLUP                                   OK
///                  GROUP BY a, ROLLUP(b)                                       ERROR 1064
SqlHelper defaultGroupBy(QueryState state, Dialect config, ParserMode mode) {
  final sqlHelper = SqlHelper(mode);

  if (state.groupByStates.isEmpty) {
    return sqlHelper;
  }

  bool isModifier(GroupByState g) =>
      g.builderType == BuilderType.groupByRollup ||
      g.builderType == BuilderType.groupByCube ||
      g.builderType == BuilderType.groupByGroupingSets;

  final modifiers = state.groupByStates.where(isModifier).toList();
  final plainColumns = _collectPlainColumns(state.groupByStates);

  List<GroupByColumnRef> columnsFor(GroupByState g) =>
      (g.groupingSets != null && g.groupingSets!.length == 1)
          ? g.groupingSets![0]
          : plainColumns;

  String labelOf(GroupByState g) => g.builderType == BuilderType.groupByRollup
      ? 'ROLLUP'
      : g.builderType == BuilderType.groupByCube
          ? 'CUBE'
          : 'GROUPING SETS';

  for (final modifier in modifiers) {
    final label = labelOf(modifier);

    if (config.databaseType == DatabaseType.sqlite) {
      throw ParserError(
          ParserArea.general, 'SQLite has no $label — use groupByRaw');
    }

    if (config.databaseType == DatabaseType.mysql && label != 'ROLLUP') {
      throw ParserError(ParserArea.general,
          'MySQL has no $label — use groupByRollup or groupByRaw');
    }

    if (modifier.builderType == BuilderType.groupByGroupingSets) {
      if ((modifier.groupingSets ?? const []).isEmpty) {
        throw ParserError(ParserArea.general,
            'GROUPING SETS requires at least one column set');
      }
    } else if (columnsFor(modifier).isEmpty) {
      throw ParserError(
          ParserArea.general, '$label requires at least one grouping column');
    }
  }

  // MySQL's WITH ROLLUP is one trailing suffix over the whole list, so a second modifier has
  // nowhere to go. Refusing beats picking one and dropping the other.
  if (config.databaseType == DatabaseType.mysql && modifiers.length > 1) {
    throw ParserError(
      ParserArea.general,
      'MySQL spells ROLLUP as a single trailing WITH ROLLUP over the whole GROUP BY list, so it '
      'takes only one grouping modifier — two cannot both apply. Use groupByRaw if you need a '
      'shape MySQL cannot express directly.',
    );
  }

  sqlHelper.addSqlSnippet('GROUP BY ');

  void emitModifier(GroupByState g) {
    if (g.builderType == BuilderType.groupByGroupingSets) {
      final sets = g.groupingSets ?? const <List<GroupByColumnRef>>[];
      sqlHelper.addSqlSnippet('GROUPING SETS (');
      for (var i = 0; i < sets.length; i++) {
        sqlHelper.addSqlSnippet('(');
        _emitColumnList(sqlHelper, config, sets[i]);
        sqlHelper.addSqlSnippet(')');
        if (i < sets.length - 1) sqlHelper.addSqlSnippet(', ');
      }
      sqlHelper.addSqlSnippet(')');
      return;
    }

    sqlHelper.addSqlSnippet(
        g.builderType == BuilderType.groupByRollup ? 'ROLLUP (' : 'CUBE (');
    _emitColumnList(sqlHelper, config, columnsFor(g));
    sqlHelper.addSqlSnippet(')');
  }

  if (config.databaseType == DatabaseType.mysql) {
    final rollup = modifiers.isEmpty ? null : modifiers.first;
    final carriesOwnColumns =
        rollup?.groupingSets != null && rollup!.groupingSets!.length == 1;
    final otherTerms =
        state.groupByStates.where((g) => !isModifier(g)).toList();

    // `ROLLUP(a), b` and `GROUP BY a, b WITH ROLLUP` are NOT the same query: the first rolls up `a`
    // and crosses it with `b`, the second rolls up the pair. MySQL has only the second, so folding
    // them into one list would quietly answer a different question.
    if (carriesOwnColumns && otherTerms.isNotEmpty) {
      throw ParserError(
        ParserArea.general,
        'MySQL cannot cross a ROLLUP with other grouping terms — its WITH ROLLUP applies to the '
        'whole GROUP BY list, so ROLLUP(a) alongside b has no MySQL spelling. Roll up the full '
        'list by passing every column to groupByRollup, or use groupByRaw.',
      );
    }

    if (rollup != null && carriesOwnColumns) {
      _emitColumnList(sqlHelper, config, columnsFor(rollup));
    } else {
      for (var i = 0; i < otherTerms.length; i++) {
        final g = otherTerms[i];
        if (g.builderType == BuilderType.groupByRaw) {
          sqlHelper.addSqlSnippet(g.raw ?? '');
        } else {
          emitGroupByColumnRef(
              sqlHelper, config, g.tableNameOrAlias ?? '', g.columnName ?? '');
        }
        if (i < otherTerms.length - 1) sqlHelper.addSqlSnippet(', ');
      }
    }

    if (rollup != null) {
      sqlHelper.addSqlSnippet(' WITH ROLLUP');
    }

    return sqlHelper;
  }

  // Postgres / MSSQL: every state is its own grouping element, in the order the caller wrote them.
  final absorbed = modifiers.isNotEmpty &&
      modifiers.every(
          (m) => !(m.groupingSets != null && m.groupingSets!.length == 1)) &&
      plainColumns.isNotEmpty;

  final elements = state.groupByStates
      .where((g) =>
          isModifier(g) ||
          !(absorbed && g.builderType == BuilderType.groupByColumn))
      .toList();

  for (var i = 0; i < elements.length; i++) {
    final g = elements[i];
    if (isModifier(g)) {
      emitModifier(g);
    } else if (g.builderType == BuilderType.groupByRaw) {
      sqlHelper.addSqlSnippet(g.raw ?? '');
    } else {
      emitGroupByColumnRef(
          sqlHelper, config, g.tableNameOrAlias ?? '', g.columnName ?? '');
    }

    if (i < elements.length - 1) {
      sqlHelper.addSqlSnippet(', ');
    }
  }

  return sqlHelper;
}
