import '../configuration.dart';
import '../enums.dart';
import '../errors/parser_error.dart';
import '../identifier.dart';
import '../sql_helper.dart';
import '../state.dart';
import 'default_row_lock.dart';
import 'default_hint.dart';
import 'to_sql.dart';

SqlHelper defaultFrom(
  QueryState state,
  Dialect config,
  ParserMode mode, [
  ToSqlOptions? options,
]) {
  final sqlHelper = SqlHelper(mode);

  if (state.fromStates.isEmpty) {
    throw ParserError(ParserArea.from, 'No tables to select from');
  }

  sqlHelper.addSqlSnippet('FROM ');

  for (var i = 0; i < state.fromStates.length; i++) {
    final fromState = state.fromStates[i];

    if (fromState.builderType == BuilderType.fromRaw) {
      refuseUnplaceableMssqlRowLock(
          config, state.rowLock, 'a raw FROM fragment');
      sqlHelper.addSqlSnippet(fromState.raw ?? '');
      if (i < state.fromStates.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }
      continue;
    }

    if (fromState.builderType == BuilderType.fromTable) {
      final hasOwner = (fromState.owner ?? '').isNotEmpty;

      if (hasOwner && config.databaseType == DatabaseType.mysql) {
        throw ParserError(
            ParserArea.from, 'MySQL does not support table owners');
      }

      // A name that matches a CTE declared on THIS statement is the CTE, not a table, and a CTE
      // lives in no schema — qualifying it sends the engine looking for a real relation:
      //
      //     WITH c AS (…) SELECT id FROM public.c   ->  PG:    relation "public.c" does not exist
      //     WITH c AS (…) SELECT id FROM dbo.c      ->  MSSQL: Msg 208, invalid object name
      //     WITH c AS (…) SELECT id FROM c          ->  both:  resolves to the CTE
      // The set carries every CTE declared by this statement AND by each enclosing one, because a
      // CTE is visible to the whole statement including its subqueries. Reading `state.cteStates`
      // alone answered only for the statement being parsed, so a reference from inside a child
      // builder — a predicate subquery, a derived table, a join subquery, a set-operation branch —
      // saw an empty list and got the default owner stamped on:
      //
      //     … WHERE o.id IN (SELECT z.id FROM "public"."d" AS z)   PG:    relation "public.d" …
      //     … WHERE o.id IN (SELECT z.id FROM [dbo].[d] AS z)      MSSQL: Msg 208
      //
      // `state.cteStates` is still consulted so the check holds on paths that reach here with no
      // options at all.
      final namesADeclaredCte = state.cteStates
              .any((cte) => cte.name == fromState.tableName) ||
          (fromState.tableName != null &&
              options?.declaredCteNames?.contains(fromState.tableName) == true);

      if (hasOwner && !namesADeclaredCte) {
        sqlHelper.addSqlSnippet(
            quoteIdentifier(fromState.owner, config.identifierDelimiters));
        sqlHelper.addSqlSnippet('.');
      }

      sqlHelper.addSqlSnippet(
          quoteIdentifier(fromState.tableName, config.identifierDelimiters));

      if ((fromState.alias ?? '').isNotEmpty) {
        sqlHelper.addSqlSnippet(' AS ');
        sqlHelper.addSqlSnippet(
            quoteIdentifier(fromState.alias, config.identifierDelimiters));
      }

      // MySQL's table reference is `tbl_name [[AS] alias] [index_hint_list]` — the hint follows
      // the alias. Emitting it first is a syntax error (1064).
      sqlHelper.addSqlSnippet(mysqlIndexHintForTable(
          state, config, fromState.alias ?? fromState.tableName ?? ''));

      // MSSQL has no `FOR UPDATE`/`FOR SHARE` — the row lock is a `WITH (...)` hint on each
      // base table instead. See `default_row_lock.dart`.
      if (state.rowLock != null && config.databaseType == DatabaseType.mssql) {
        sqlHelper.addSqlSnippet(mssqlRowLockHint(state.rowLock!));
      }

      if (i < state.fromStates.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }

      continue;
    }

    if (fromState.builderType == BuilderType.fromBuilder) {
      refuseUnplaceableMssqlRowLock(config, state.rowLock, 'a derived table');
      final subHelper = defaultToSql(fromState.subquery, config, mode, options);

      // Merge the subquery's bound values, not just its SQL — else its placeholders ship with no
      // parameters and bind NULL.
      sqlHelper.addSqlSnippetWithValues(
          '(${subHelper.getSql()})', subHelper.getValues());

      if ((fromState.alias ?? '').isNotEmpty) {
        sqlHelper.addSqlSnippet(' AS ');
        sqlHelper.addSqlSnippet(
            quoteIdentifier(fromState.alias, config.identifierDelimiters));
      }

      if (i < state.fromStates.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }

      continue;
    }

    if (fromState.builderType == BuilderType.fromLateral) {
      refuseUnplaceableMssqlRowLock(
          config, state.rowLock, 'a LATERAL subquery');
      if (config.databaseType == DatabaseType.sqlite) {
        throw ParserError(
            ParserArea.from, 'SQLite does not support LATERAL derived tables');
      }
      if (config.databaseType == DatabaseType.mssql) {
        throw ParserError(
          ParserArea.from,
          'MSSQL LATERAL belongs in APPLY joins — use joinCrossApply/joinOuterApply',
        );
      }

      final subHelper = defaultToSql(fromState.subquery, config, mode, options);
      sqlHelper.addSqlSnippet('LATERAL (');
      sqlHelper.addSqlSnippetWithValues(
          subHelper.getSql(), subHelper.getValues());
      sqlHelper.addSqlSnippet(')');

      if ((fromState.alias ?? '').isNotEmpty) {
        sqlHelper.addSqlSnippet(' AS ');
        sqlHelper.addSqlSnippet(
            quoteIdentifier(fromState.alias, config.identifierDelimiters));
      }

      if (i < state.fromStates.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }

      continue;
    }

    if (fromState.builderType == BuilderType.fromFunction) {
      refuseUnplaceableMssqlRowLock(
          config, state.rowLock, 'a table-valued function');
      // MySQL has no FROM-clause table functions at all. `fromFunctionRaw()` remains the escape
      // hatch for hand-written JSON_TABLE and friends.
      if (config.databaseType == DatabaseType.mysql) {
        throw ParserError(ParserArea.from,
            'MySQL does not support table functions in FROM — use fromFunctionRaw');
      }

      // No MySQL owner guard here — the capability throw above already excluded MySQL.
      if ((fromState.owner ?? '').isNotEmpty) {
        sqlHelper.addSqlSnippet(
            quoteIdentifier(fromState.owner, config.identifierDelimiters));
        sqlHelper.addSqlSnippet('.');
      }

      final fnName = fromState.functionName ?? '';
      if (config.databaseType == DatabaseType.sqlite) {
        sqlHelper.addSqlSnippet(fnName);
      } else {
        sqlHelper.addSqlSnippet(
            quoteIdentifier(fnName, config.identifierDelimiters));
      }
      sqlHelper.addSqlSnippet('(');
      final params = fromState.functionParams;
      for (var paramIndex = 0; paramIndex < params.length; paramIndex++) {
        sqlHelper.addDynamicValue(params[paramIndex]);
        if (paramIndex < params.length - 1) {
          sqlHelper.addSqlSnippet(', ');
        }
      }
      sqlHelper.addSqlSnippet(')');

      if ((fromState.alias ?? '').isNotEmpty) {
        sqlHelper.addSqlSnippet(' AS ');
        sqlHelper.addSqlSnippet(
            quoteIdentifier(fromState.alias, config.identifierDelimiters));
      }

      if (i < state.fromStates.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }
    }
  }

  return sqlHelper;
}
