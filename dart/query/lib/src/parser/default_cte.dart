import '../configuration.dart';
import '../enums.dart';
import '../identifier.dart';
import '../dialect_name.dart';
import '../errors/parser_error.dart';
import '../sql_helper.dart';
import '../state.dart';
import 'to_sql.dart';

/// Refuses clauses a RECURSIVE CTE's members cannot carry.
///
/// SQLEasy renders a recursive CTE body as one builder — `anchor UNION ALL recursive` — so a clause
/// set on that body lands at the END of the body, textually inside the RECURSIVE term. That is the
/// one place the engines police. Measured, each construct on its own and against a working baseline
/// recursive CTE that runs on all four:
///
///     in the RECURSIVE term      PG    MySQL  SQLite  MSSQL
///     ORDER BY                   ERR   ERR    ERR     Msg 156     <- every engine
///     LIMIT                      ERR   OK     OK      (no LIMIT in T-SQL)
///     SELECT DISTINCT            OK    ERR    OK      ERR
///     — for contrast —
///     LIMIT in the ANCHOR term   OK    OK
///     LIMIT on the OUTER select  OK    OK                          <- where it belongs
void _assertRecursiveMembersSupported(CteState cteState, Dialect config) {
  final body = cteState.subquery;
  if (!cteState.recursive || body == null) return;

  if (body.orderByStates.isNotEmpty) {
    throw ParserError(
      ParserArea.orderBy,
      'A recursive CTE cannot ORDER BY inside its own body — no dialect allows it in the recursive '
      'term, where a clause set on the body lands. Order the OUTER select instead, which every '
      'dialect accepts.',
    );
  }

  if ((body.limit > 0 || body.offset != null) &&
      config.databaseType == DatabaseType.postgres) {
    throw ParserError(
      ParserArea.limitOffset,
      'Postgres cannot LIMIT or OFFSET inside a recursive CTE body — the clause lands in the '
      'recursive term, which it rejects. Cap the OUTER select instead, which every dialect '
      'accepts, or bound the recursion with a WHERE on the recursive member.',
    );
  }

  final recursiveMemberIsDistinct =
      body.unionStates.any((branch) => branch.subquery?.distinct == true);

  if (recursiveMemberIsDistinct &&
      (config.databaseType == DatabaseType.mysql ||
          config.databaseType == DatabaseType.mssql)) {
    throw ParserError(
      ParserArea.select,
      '${dialectDisplayName(config.databaseType)} rejects SELECT DISTINCT on the recursive member '
      'of a recursive CTE. Use union() rather than unionAll() if you want duplicate elimination '
      'across the recursion, which is where these engines allow it.',
    );
  }
}

SqlHelper defaultCte(
  QueryState state,
  Dialect config,
  ParserMode mode, [
  ToSqlOptions? options,
]) {
  final sqlHelper = SqlHelper(mode);

  if (state.cteStates.isEmpty) {
    return sqlHelper;
  }

  final hasRecursive = state.cteStates.any((cte) => cte.recursive);

  // SQL Server recursive CTEs use bare `WITH` — `RECURSIVE` is not a T-SQL keyword.
  if (hasRecursive && config.databaseType != DatabaseType.mssql) {
    sqlHelper.addSqlSnippet('WITH RECURSIVE ');
  } else {
    sqlHelper.addSqlSnippet('WITH ');
  }

  for (var i = 0; i < state.cteStates.length; i++) {
    final cteState = state.cteStates[i];
    _assertRecursiveMembersSupported(cteState, config);

    sqlHelper.addSqlSnippet(
        quoteIdentifier(cteState.name, config.identifierDelimiters));

    if (cteState.columns.isNotEmpty) {
      sqlHelper.addSqlSnippet(' (');
      for (var columnIndex = 0;
          columnIndex < cteState.columns.length;
          columnIndex++) {
        sqlHelper.addSqlSnippet(
          quoteIdentifier(
              cteState.columns[columnIndex], config.identifierDelimiters),
        );

        if (columnIndex < cteState.columns.length - 1) {
          sqlHelper.addSqlSnippet(', ');
        }
      }
      sqlHelper.addSqlSnippet(')');
    }

    sqlHelper.addSqlSnippet(' AS (');

    if (cteState.builderType == BuilderType.cteRaw) {
      sqlHelper.addSqlSnippet(cteState.raw ?? '');
    } else if (cteState.subquery != null) {
      final subHelper = defaultToSql(cteState.subquery, config, mode, options);
      sqlHelper.addSqlSnippetWithValues(
          subHelper.getSql(), subHelper.getValues());
    }

    sqlHelper.addSqlSnippet(')');

    if (i < state.cteStates.length - 1) {
      sqlHelper.addSqlSnippet(', ');
    } else {
      sqlHelper.addSqlSnippet(' ');
    }
  }

  return sqlHelper;
}
