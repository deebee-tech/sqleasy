import '../configuration.dart';
import '../enums.dart';
import '../errors/parser_error.dart';
import '../identifier.dart';
import '../sql_helper.dart';
import '../state.dart';

/// MySQL index hint text immediately after a table reference (`USE INDEX (idx)`).
String mysqlIndexHintForTable(
  QueryState state,
  Dialect config,
  String tableNameOrAlias,
) {
  if (state.hintStates.isEmpty) {
    return '';
  }

  final indexHints = state.hintStates.where((hint) =>
      (hint.kind == HintKind.useIndex || hint.kind == HintKind.forceIndex) &&
      hint.tableNameOrAlias == tableNameOrAlias &&
      (hint.indexName ?? '').isNotEmpty);

  if (indexHints.isEmpty) {
    return '';
  }

  if (config.databaseType != DatabaseType.mysql) {
    throw ParserError(
      ParserArea.from,
      'MySQL index hints (hintUseIndex/hintForceIndex) are only supported on MySQL',
    );
  }

  var sql = '';
  for (final hint in indexHints) {
    sql +=
        '${hint.kind == HintKind.forceIndex ? ' FORCE INDEX (' : ' USE INDEX ('}'
        '${quoteIdentifier(hint.indexName, config.identifierDelimiters)})';
  }

  return sql;
}

/// Trailing MSSQL `OPTION (...)` and raw hints appended after the SELECT statement body.
void emitTrailingHints(SqlHelper sqlHelper, QueryState state, Dialect config) {
  if (state.hintStates.isEmpty) {
    return;
  }

  for (final hint in state.hintStates) {
    if (hint.kind == HintKind.mssqlOption) {
      if (config.databaseType != DatabaseType.mssql) {
        throw ParserError(
          ParserArea.general,
          'hintMssqlOption is only supported on MSSQL — use hintRaw on other dialects',
        );
      }

      if ((hint.optionText ?? '').trim().isEmpty) {
        throw ParserError(ParserArea.general,
            'hintMssqlOption requires non-empty option text');
      }

      sqlHelper.addSqlSnippet(' OPTION (');
      sqlHelper.addSqlSnippet(hint.optionText!);
      sqlHelper.addSqlSnippet(')');
      continue;
    }

    if (hint.kind == HintKind.raw) {
      if ((hint.raw ?? '').trim().isEmpty) {
        throw ParserError(ParserArea.general, 'hintRaw requires non-empty SQL');
      }

      sqlHelper.addSqlSnippet(' ');
      sqlHelper.addSqlSnippet(hint.raw!);
    }
  }
}

/// Validates that no unsupported hint kinds remain unhandled at parse time.
void validateHints(QueryState state, Dialect config, ParserArea area) {
  if (state.hintStates.isEmpty) {
    return;
  }

  for (final hint in state.hintStates) {
    if (hint.kind == HintKind.useIndex || hint.kind == HintKind.forceIndex) {
      if (config.databaseType != DatabaseType.mysql) {
        throw ParserError(
          area,
          'MySQL index hints (hintUseIndex/hintForceIndex) are only supported on MySQL — use hintRaw elsewhere',
        );
      }
    }

    // T-SQL's OPTION is STATEMENT-level: exactly once, at the very end of the whole statement.
    // Measured against MSSQL 2022, isolating the position:
    //
    //   SELECT id FROM orders OPTION (MAXDOP 1);                                accepted
    //   WITH c AS (SELECT id FROM orders) SELECT id FROM c OPTION (MAXDOP 1);   accepted
    //   SELECT ... UNION ALL SELECT ... OPTION (MAXDOP 1);                      accepted
    //   WITH c AS (SELECT id FROM orders OPTION (MAXDOP 1)) SELECT id FROM c;   Msg 156
    //   SELECT ... OPTION (MAXDOP 1) UNION ALL SELECT ...;                      Msg 156
    //   SELECT ... OPTION (MAXDOP 1) OPTION (MAXDOP 2);                         Msg 156
    //
    // Set on a CHILD builder it either failed to compile or — worse — silently became
    // statement-wide when the child happened to be textually last, hinting operands the caller
    // never named. A child is not the statement, so it cannot carry a statement-level clause.
    if (hint.kind == HintKind.mssqlOption && state.isInnerStatement) {
      throw ParserError(
        area,
        'OPTION is a statement-level clause in T-SQL — exactly once, at the very end of the whole '
        'statement — so it cannot be set on a CTE body, a set-operation branch or a subquery. '
        'Set hintMssqlOption on the outermost builder, where it applies to the statement it '
        'actually governs.',
      );
    }
  }
}
