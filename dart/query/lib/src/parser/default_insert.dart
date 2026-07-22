import '../configuration.dart';
import '../enums.dart';
import '../errors/parser_error.dart';
import '../identifier.dart';
import '../sql_helper.dart';
import 'default_mutation_row_cap.dart';
import '../state.dart';
import 'default_returning.dart';
import 'default_upsert.dart';
import 'to_sql.dart';

SqlHelper defaultInsert(
  QueryState state,
  Dialect config,
  ParserMode mode, [
  ToSqlOptions? options,
]) {
  final sqlHelper = SqlHelper(mode);

  final insertState = state.insertState;
  if (insertState == null) {
    throw ParserError(ParserArea.insert, 'No insert state provided');
  }

  if ((insertState.raw ?? '').isNotEmpty) {
    // `insertRaw` replaces the ENTIRE insert statement, so nothing else the builder holds can reach
    // the output — it returns right here. Anything else set was accepted and discarded, which the
    // clause-pair sweep in scripts/check-silent-noops.mjs reports as a silent no-op. It is one.
    //
    // MSSQL's OUTPUT is included because defaultInsert is the only thing that emits it (inline,
    // before VALUES); the other three append RETURNING further out, where the raw text does not
    // shadow it.
    if (state.upsertState != null) {
      throw ParserError(
        ParserArea.insert,
        'insertRaw replaces the whole INSERT statement, so an upsert clause set alongside it '
        'cannot reach the SQL. Put the conflict handling in the raw text, or build the insert '
        'with insertColumns/insertValues so the upsert has a statement to attach to.',
      );
    }

    if (state.returningState != null &&
        config.databaseType == DatabaseType.mssql) {
      throw ParserError(
        ParserArea.insert,
        'insertRaw replaces the whole INSERT statement, and T-SQL puts OUTPUT inside it — so an '
        'OUTPUT clause set alongside a raw insert cannot reach the SQL. Write the OUTPUT into '
        'the raw text, or build the insert with insertColumns/insertValues.',
      );
    }

    sqlHelper.addSqlSnippet(insertState.raw!);
    return sqlHelper;
  }

  // T-SQL has NO upsert primitive. `onConflict*()` used to be answered by abandoning the INSERT
  // grammar and synthesizing a MERGE — a different statement, with different atomicity, trigger and
  // error semantics, that the caller never wrote. It was unsafe as written too: an un-hinted MERGE
  // used as an upsert is race-prone at READ COMMITTED. MERGE is genuine native T-SQL and should
  // return as an explicit surface with the per-engine typed builders.
  if (state.upsertState != null && config.databaseType == DatabaseType.mssql) {
    throw ParserError(
      ParserArea.insert,
      'MSSQL has no upsert — T-SQL expresses this with MERGE, which is a different statement '
      'with different concurrency semantics; write it explicitly',
    );
  }

  if ((insertState.tableName ?? '').isEmpty) {
    throw ParserError(ParserArea.insert, 'INSERT requires a table');
  }

  sqlHelper.addSqlSnippet('INSERT ');
  // T-SQL: `INSERT TOP (n) INTO t ...` — between the verb and INTO.
  sqlHelper.addSqlSnippet(mssqlStatementTop(state, config));

  if (isMysqlInsertIgnore(state.upsertState, config)) {
    sqlHelper.addSqlSnippet('IGNORE ');
  }

  sqlHelper.addSqlSnippet('INTO ');

  if ((insertState.owner ?? '').isNotEmpty) {
    if (config.databaseType == DatabaseType.mysql) {
      throw ParserError(
          ParserArea.insert, 'MySQL does not support table owners');
    }
    sqlHelper.addSqlSnippet(
        quoteIdentifier(insertState.owner, config.identifierDelimiters));
    sqlHelper.addSqlSnippet('.');
  }

  sqlHelper.addSqlSnippet(
      quoteIdentifier(insertState.tableName, config.identifierDelimiters));

  if (insertState.columns.isNotEmpty) {
    sqlHelper.addSqlSnippet(' (');
    for (var i = 0; i < insertState.columns.length; i++) {
      sqlHelper.addSqlSnippet(
        quoteIdentifier(insertState.columns[i], config.identifierDelimiters),
      );

      if (i < insertState.columns.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }
    }
    sqlHelper.addSqlSnippet(')');
  }

  if (state.returningState != null &&
      config.databaseType == DatabaseType.mssql) {
    emitMssqlOutputClause(sqlHelper, config, state.returningState!, 'INSERTED',
        ParserArea.insert);
  }

  final selectSubquery = insertState.selectSubquery;
  if (selectSubquery != null) {
    if (insertState.values.isNotEmpty) {
      throw ParserError(
        ParserArea.insert,
        'INSERT cannot combine a SELECT source with VALUES rows',
      );
    }

    sqlHelper.addSqlSnippet(' ');

    final subHelper = defaultToSql(selectSubquery, config, mode, options);
    sqlHelper.addSqlSnippetWithValues(
        subHelper.getSql(), subHelper.getValues());

    if (state.upsertState != null) {
      emitUpsertClause(
          sqlHelper, config, state.upsertState!, ParserArea.insert);
    }

    return sqlHelper;
  }

  if (insertState.values.isEmpty) {
    throw ParserError(
        ParserArea.insert, 'INSERT requires at least one VALUES row');
  }

  final columnCount = insertState.columns.length;

  sqlHelper.addSqlSnippet(' VALUES ');

  for (var r = 0; r < insertState.values.length; r++) {
    sqlHelper.addSqlSnippet('(');

    final row = insertState.values[r];

    if (columnCount > 0 && row.length != columnCount) {
      throw ParserError(
        ParserArea.insert,
        'INSERT column count ($columnCount) does not match value count (${row.length}) for row ${r + 1}',
      );
    }

    for (var c = 0; c < row.length; c++) {
      sqlHelper.addDynamicValue(row[c]);

      if (c < row.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }
    }

    sqlHelper.addSqlSnippet(')');

    if (r < insertState.values.length - 1) {
      sqlHelper.addSqlSnippet(', ');
    }
  }

  if (state.upsertState != null) {
    emitUpsertClause(sqlHelper, config, state.upsertState!, ParserArea.insert);
  }

  return sqlHelper;
}
