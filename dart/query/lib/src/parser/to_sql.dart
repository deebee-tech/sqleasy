/// Renders a [QueryState] to SQL by walking its clauses in order.
library;

import '../configuration.dart';
import '../enums.dart';
import '../errors/parser_error.dart';
import '../dialect_name.dart';
import '../sql_helper.dart';
import '../state.dart';
import '../values/mssql_parameter.dart';
import '../values/sql_value.dart';
import 'default_call.dart';
import 'default_merge.dart';
import 'default_cte.dart';
import 'default_delete.dart';
import 'default_from.dart';
import 'default_group_by.dart';
import 'default_having.dart';
import 'default_insert.dart';
import 'default_join.dart';
import 'default_limit_offset.dart';
import 'default_mutation_row_cap.dart';
import 'default_mutation_join.dart';
import 'default_order_by.dart';
import 'default_returning.dart';
import 'default_row_lock.dart';
import 'default_select.dart';
import 'default_union.dart';
import 'default_update.dart';
import 'default_where.dart';
import 'default_hint.dart';

/// A prepared statement and the ordered values bound to its placeholders — ready to hand straight to
/// a driver as `query(sql, params)`. For dialects that inline values into a self-contained statement
/// (MSSQL's `sp_executesql`), [params] is empty.
class PreparedSql {
  const PreparedSql(this.sql, this.params);

  final String sql;
  final List<Object?> params;
}

/// A hook the dialect can inject into the shared clause walk (e.g. MSSQL's `TOP`).
typedef BeforeSelectColumns = void Function(
    QueryState state, Dialect config, SqlHelper sqlHelper);

/// Hooks the dialect can inject into the shared clause walk.
class ToSqlOptions {
  const ToSqlOptions({this.beforeSelectColumns});

  final BeforeSelectColumns? beforeSelectColumns;
}

void _emitMutationWhere(
  SqlHelper sqlHelper,
  QueryState state,
  Dialect config,
  ParserMode mode, [
  ToSqlOptions? options,
]) {
  final joinPredicate = state.joinStates.isNotEmpty &&
          config.databaseType == DatabaseType.postgres
      ? buildPostgresMutationJoinPredicate(config, state, mode)
      : null;

  if (joinPredicate == null || joinPredicate.getSql().isEmpty) {
    if (state.whereStates.isNotEmpty) {
      final where = defaultWhere(state, config, mode, options);
      sqlHelper.addSqlSnippet(' ');
      sqlHelper.addSqlSnippetWithValues(where.getSql(), where.getValues());
    }
    return;
  }

  sqlHelper.addSqlSnippet(' WHERE ');
  sqlHelper.addSqlSnippetWithValues(
      joinPredicate.getSql(), joinPredicate.getValues());

  if (state.whereStates.isNotEmpty) {
    final where = defaultWhere(state, config, mode, options);
    var whereSql = where.getSql();
    if (whereSql.startsWith('WHERE ')) {
      whereSql = whereSql.substring('WHERE '.length);
    }
    sqlHelper.addSqlSnippet(' AND ');
    sqlHelper.addSqlSnippetWithValues(whereSql, where.getValues());
  }
}

/// Renders a [QueryState] to SQL by walking its clauses in order. Pure and dialect-driven. Used for
/// the outer statement and, recursively, for every nested subquery.
SqlHelper defaultToSql(
  QueryState? state,
  Dialect config,
  ParserMode mode, [
  ToSqlOptions? options,
]) {
  final sqlHelper = SqlHelper(mode);

  if (state == null) {
    throw ParserError(ParserArea.general, 'No state provided');
  }

  // `TOP` is a T-SQL keyword and nothing else. It used to be silently discarded on the other three
  // dialects, so the row cap the caller explicitly wrote vanished without a word. A row cap IS
  // reachable everywhere, but it is spelled `.limit(n)`. Guarded here rather than in the SELECT
  // hook so it also fires for CTE bodies, derived tables, and the prepared paths.
  if (config.databaseType != DatabaseType.mssql && hasExplicitTop(state)) {
    throw ParserError(
      ParserArea.limitOffset,
      '${dialectDisplayName(config.databaseType)} has no TOP clause — use limit() instead',
    );
  }

  // Index hints (hintUseIndex/hintForceIndex) are a MySQL-only construct, and the capability check
  // must run for EVERY statement kind. It used to live only on the SELECT tail, so a hint set on a
  // non-MySQL INSERT/UPDATE/DELETE was SILENTLY DROPPED instead of refused — the exact silent-no-op
  // this library does not do. Validating here, before the queryType dispatch, closes that.
  validateHints(state, config, ParserArea.general);

  // A sub-builder is a SELECT. Building an INSERT/UPDATE/DELETE/CALL inside a child callback used
  // to inline that statement verbatim wherever the child goes. Measured, isolating the POSITION:
  //
  //     PG     WITH c AS (DELETE … RETURNING id) SELECT id FROM c              legal
  //            WITH c AS (DELETE …)              SELECT 1                      legal
  //            SELECT * FROM (DELETE … RETURNING id) x            syntax error at "FROM"
  //     MySQL  WITH c AS (DELETE …) SELECT 1                      ERROR 1064
  //     MSSQL  WITH c AS (DELETE …) SELECT 1                      Msg 156
  //     SQLite WITH c AS (DELETE … RETURNING id) SELECT id FROM c near "DELETE": syntax error
  //
  // Exactly one position on exactly one dialect allows it — a Postgres CTE body — and RETURNING is
  // NOT what makes it legal, which is why the check is on the position.
  if (state.isInnerStatement && state.queryType != QueryType.select) {
    final postgresDataModifyingCte =
        state.isCteBody && config.databaseType == DatabaseType.postgres;

    if (!postgresDataModifyingCte) {
      throw ParserError(
        ParserArea.general,
        'A sub-builder must be a SELECT — an INSERT, UPDATE, DELETE or CALL built inside a child '
        'callback would be spliced in wherever that child is inlined, which no engine parses. '
        '${config.databaseType == DatabaseType.postgres ? 'Postgres allows a data-modifying CTE, so build it with cte() if that is what you meant.' : '${dialectDisplayName(config.databaseType)} has no data-modifying CTE either — run the mutation as its own statement.'}',
      );
    }
  }

  // T-SQL forbids a BARE ORDER BY inside any subquery, derived table, CTE body or set-operation
  // operand — legal only alongside a row cap. Measured, with a working baseline, one variable at a
  // time:
  //
  //                                            PG   MySQL  SQLite  MSSQL
  //     SELECT * FROM (SELECT id FROM o) x           OK    OK     OK      OK     <- baseline
  //     SELECT * FROM (SELECT … ORDER BY id) x       OK    OK     OK      Msg 1033
  //     WITH c AS (SELECT … ORDER BY id) SELECT …    OK    OK     OK      Msg 1033
  //     … WHERE id IN (SELECT … ORDER BY id)         OK    OK     OK      Msg 1033
  //
  // `OFFSET 0 ROWS` alone legalises it, which is why offset(0) had to stop being treated as unset.
  if (config.databaseType == DatabaseType.mssql &&
      state.isInnerStatement &&
      state.orderByStates.isNotEmpty &&
      state.limit == 0 &&
      state.offset == null &&
      !hasExplicitTop(state)) {
    throw ParserError(
      ParserArea.orderBy,
      'T-SQL rejects an ORDER BY inside a subquery, derived table, CTE body or set-operation '
      'operand unless it comes with a row cap (Msg 1033) — an ordering with nothing to cap has no '
      'meaning there. Add top(n), or offset(0) if you only want the ordering to be legal and are '
      'relying on it downstream.',
    );
  }

  // T-SQL allows WITH only at the START of a statement — never inside a subquery's parentheses, a
  // derived table, or another CTE's body. Measured, each position on its own and against a working
  // baseline, so the failure is attributable to the WITH and nothing else:
  //
  //                                            PG   MySQL  SQLite  MSSQL
  //     SELECT * FROM (WITH c AS (…) SELECT …) x    OK    OK     OK      Msg 156
  //     … WHERE id IN (WITH c AS (…) SELECT …)      OK    OK     OK      Msg 156
  //     WITH o AS (WITH i AS (…) SELECT …) SELECT   OK    OK     OK      Msg 156
  if (config.databaseType == DatabaseType.mssql &&
      state.isInnerStatement &&
      state.cteStates.isNotEmpty) {
    throw ParserError(
      ParserArea.general,
      'T-SQL allows WITH only at the start of a statement, so a CTE cannot be declared on a '
      'subquery, a derived table, a set-operation branch or another CTE body. Declare it on the '
      'outermost builder — a T-SQL CTE is visible to the whole statement, including its '
      'subqueries.',
    );
  }

  if (state.cteStates.isNotEmpty) {
    final cte = defaultCte(state, config, mode, options);
    sqlHelper.addSqlSnippetWithValues(cte.getSql(), cte.getValues());
  }

  if (state.rowLock != null && state.queryType != QueryType.select) {
    throw ParserError(
        ParserArea.general, 'FOR UPDATE/FOR SHARE requires a SELECT query');
  }

  // A row lock cannot span a set operation, and the engines disagree about HOW it fails, which is
  // what made this dangerous. Measured:
  //
  //   Postgres 17  SELECT ... UNION ALL SELECT ... FOR UPDATE
  //                  ERROR: FOR UPDATE is not allowed with UNION/INTERSECT/EXCEPT
  //   MySQL 8.4    same statement                  ACCEPTED — binds to ONE operand
  //   MSSQL 2022   the table hint lands on the FIRST operand only
  //
  // A lock covering half the rows you asked for is worse than no lock, because the caller believes
  // they hold it. SQLite refuses row locking outright, further down.
  // On MySQL a trailing FOR UPDATE does not reach rows behind a DERIVED TABLE. Proven by a
  // two-session test with both controls (innodb_lock_wait_timeout=3 / lock_timeout=3s):
  //
  //                                        MySQL 8.4     Postgres 17
  //     control — no lock holder           not blocked   not blocked
  //     holder: plain table FOR UPDATE     BLOCKED       BLOCKED
  //     holder: derived table FOR UPDATE   NOT BLOCKED   BLOCKED
  //
  // The identical builder chain takes a real lock on Postgres and NO lock on MySQL, with no error
  // either way — the caller proceeds believing rows are held while another session updates them.
  if (config.databaseType == DatabaseType.mysql &&
      state.rowLock != null &&
      state.fromStates.any((from) => from.subquery != null)) {
    throw ParserError(
      ParserArea.general,
      "MySQL's FOR UPDATE/FOR SHARE does not reach rows behind a derived table — they are read "
      'completely unlocked, with no error, while Postgres locks them. Lock the base table in its '
      'own statement, or join the table directly instead of wrapping it in a subquery.',
    );
  }

  if (state.rowLock != null && state.unionStates.isNotEmpty) {
    throw ParserError(
      ParserArea.general,
      'A row lock cannot cover a set operation — Postgres rejects it outright, and MySQL and MSSQL '
      'silently lock only one operand, leaving the rest of the rows you asked for unlocked. '
      'Lock the operands individually, or lock the base rows before combining them.',
    );
  }

  if (state.upsertState != null && state.queryType != QueryType.insert) {
    throw ParserError(
        ParserArea.insert, 'Upsert (ON CONFLICT) requires INSERT');
  }

  if (state.callState != null && state.queryType != QueryType.call) {
    throw ParserError(ParserArea.call,
        'Procedure/function call state requires queryType Call');
  }

  if (state.queryType == QueryType.merge) {
    // Before any SQL: a cap MERGE cannot express is refused, never dropped.
    assertInsertMergeRowCapSupported(state, config, ParserArea.merge);

    // MERGE emits its own mandatory terminating semicolon and is never an inner statement.
    final merge = defaultMerge(state, config, mode, options);
    sqlHelper.addSqlSnippetWithValues(merge.getSql(), merge.getValues());
    return sqlHelper;
  }

  if (state.queryType == QueryType.call) {
    if (state.cteStates.isNotEmpty) {
      throw ParserError(ParserArea.call,
          'A CTE cannot be combined with a procedure/function call');
    }

    if (state.returningState != null) {
      throw ParserError(ParserArea.call,
          'RETURNING/OUTPUT cannot be combined with a procedure/function call');
    }

    final call = defaultCall(state, config, mode);
    sqlHelper.addSqlSnippetWithValues(call.getSql(), call.getValues());

    if (!state.isInnerStatement) {
      sqlHelper.addSqlSnippet(';');
    }
    return sqlHelper;
  }

  if (state.queryType == QueryType.insert) {
    assertInsertMergeRowCapSupported(state, config, ParserArea.insert);

    final insert = defaultInsert(state, config, mode, options);
    sqlHelper.addSqlSnippetWithValues(insert.getSql(), insert.getValues());

    // PG/SQLite's RETURNING is trailing; MSSQL's OUTPUT was already emitted inline by
    // `defaultInsert` (before VALUES), and MySQL has no equivalent (`defaultReturning` throws).
    if (state.returningState != null &&
        config.databaseType != DatabaseType.mssql) {
      emitTrailingReturningClause(
          sqlHelper, config, state.returningState!, ParserArea.insert);
    }

    if (!state.isInnerStatement) {
      sqlHelper.addSqlSnippet(';');
    }
    return sqlHelper;
  }

  if (state.queryType == QueryType.update) {
    // Before any SQL is produced: a row cap the engine cannot run is refused, never dropped.
    assertMutationRowCapSupported(state, config, ParserArea.update);

    final update = defaultUpdate(state, config, mode, options);
    sqlHelper.addSqlSnippetWithValues(update.getSql(), update.getValues());

    if (state.whereStates.isNotEmpty || state.joinStates.isNotEmpty) {
      _emitMutationWhere(sqlHelper, state, config, mode, options);
    }
    emitMutationRowCap(sqlHelper, state, config, mode);

    if (state.returningState != null &&
        config.databaseType != DatabaseType.mssql) {
      emitTrailingReturningClause(
          sqlHelper, config, state.returningState!, ParserArea.update);
    }

    if (!state.isInnerStatement) {
      sqlHelper.addSqlSnippet(';');
    }
    return sqlHelper;
  }

  if (state.queryType == QueryType.delete) {
    // Before any SQL is produced: a row cap the engine cannot run is refused, never dropped.
    assertMutationRowCapSupported(state, config, ParserArea.delete);

    final del = defaultDelete(state, config, mode, options);
    sqlHelper.addSqlSnippetWithValues(del.getSql(), del.getValues());

    if (state.whereStates.isNotEmpty || state.joinStates.isNotEmpty) {
      _emitMutationWhere(sqlHelper, state, config, mode, options);
    }
    emitMutationRowCap(sqlHelper, state, config, mode);

    if (state.returningState != null &&
        config.databaseType != DatabaseType.mssql) {
      emitTrailingReturningClause(
          sqlHelper, config, state.returningState!, ParserArea.delete);
    }

    if (!state.isInnerStatement) {
      sqlHelper.addSqlSnippet(';');
    }
    return sqlHelper;
  }

  if (state.returningState != null) {
    throw ParserError(ParserArea.general,
        'RETURNING/OUTPUT requires INSERT, UPDATE, or DELETE');
  }

  final sel = defaultSelect(state, config, mode, options);
  sqlHelper.addSqlSnippetWithValues(sel.getSql(), sel.getValues());

  final from = defaultFrom(state, config, mode, options);
  sqlHelper.addSqlSnippet(' ');
  sqlHelper.addSqlSnippetWithValues(from.getSql(), from.getValues());

  if (state.joinStates.isNotEmpty) {
    final join = defaultJoin(state, config, mode, options);
    sqlHelper.addSqlSnippet(' ');
    sqlHelper.addSqlSnippetWithValues(join.getSql(), join.getValues());
  }

  if (state.whereStates.isNotEmpty) {
    final where = defaultWhere(state, config, mode, options);
    sqlHelper.addSqlSnippet(' ');
    sqlHelper.addSqlSnippetWithValues(where.getSql(), where.getValues());
  }

  if (state.groupByStates.isNotEmpty) {
    final groupBy = defaultGroupBy(state, config, mode);
    sqlHelper.addSqlSnippet(' ');
    sqlHelper.addSqlSnippetWithValues(groupBy.getSql(), groupBy.getValues());
  }

  if (state.havingStates.isNotEmpty) {
    final having = defaultHaving(state, config, mode);
    sqlHelper.addSqlSnippet(' ');
    sqlHelper.addSqlSnippetWithValues(having.getSql(), having.getValues());
  }

  if (state.unionStates.isNotEmpty) {
    final union = defaultUnion(state, config, mode, options);
    sqlHelper.addSqlSnippet(' ');
    sqlHelper.addSqlSnippetWithValues(union.getSql(), union.getValues());
  }

  if (state.orderByStates.isNotEmpty) {
    final orderBy = defaultOrderBy(state, config, mode);
    sqlHelper.addSqlSnippet(' ');
    sqlHelper.addSqlSnippetWithValues(orderBy.getSql(), orderBy.getValues());
  }

  if (state.limit > 0 || state.offset != null || state.limitWithTies) {
    final limitOffset = defaultLimitOffset(state, config, mode);

    // MSSQL's WITH TIES renders as a `TOP (n) WITH TIES` prefix on the SELECT list, so the trailing
    // clause is legitimately empty here — still call the parser for its guards, but do not emit the
    // separating space, or the statement ends `... ;` with a stray gap.
    final clause = limitOffset.getSql();
    if (clause != '') {
      sqlHelper.addSqlSnippet(' ');
      sqlHelper.addSqlSnippetWithValues(clause, limitOffset.getValues());
    }
  }

  // Trailing `FOR UPDATE`/`FOR SHARE` (PG/MySQL). MSSQL's equivalent is a `WITH (...)` hint
  // already emitted on each FROM table by `defaultFrom`; SQLite has no row locking and throws.
  if (state.rowLock != null) {
    emitTrailingRowLockClause(sqlHelper, config, state.rowLock!);
  }

  emitTrailingHints(sqlHelper, state, config);

  if (!state.isInnerStatement) {
    sqlHelper.addSqlSnippet(';');
  }

  return sqlHelper;
}

/// MSSQL prepends a `TOP` to the SELECT list for an explicit `.top(n)`. Other dialects need no hook.
///
/// There is deliberately no automatic cap here. SQLEasy emits the query it was asked for, however
/// unbounded — a row cap is the caller's policy, not the builder's, and one applied behind the
/// caller's back is a silent truncation they never wrote. `.top(n)` is the caller asking; it
/// conflicts with limit/offset outright, and [defaultLimitOffset] throws on that combination.
ToSqlOptions toSqlOptionsFor(Dialect config) {
  if (config.databaseType != DatabaseType.mssql) {
    return const ToSqlOptions();
  }

  return ToSqlOptions(
    beforeSelectColumns: (state, cfg, sqlHelper) {
      // Two distinct T-SQL constructs share this slot. `.top(n)` is the caller asking for TOP
      // directly; `.limitWithTies(n)` also renders here, because WITH TIES is only expressible on
      // TOP. They cannot both apply — `defaultLimitOffset` refuses TOP combined with limit/offset.
      // PRESENCE, not positivity — `TOP (0)` is legal T-SQL and returns no rows (measured), so
      // testing `> 0` silently turned "give me nothing" into an uncapped SELECT.
      final top = state.customState?['top'];
      if (top is num) {
        sqlHelper.addSqlSnippet('TOP (${formatNumber(top)}) ');
        return;
      }

      if (state.limitWithTies && state.limit > 0) {
        sqlHelper.addSqlSnippet('TOP (${state.limit}) WITH TIES ');
      }
    },
  );
}

/// Wraps the rendered statement in a self-contained `exec sp_executesql`.
String _mssqlToSql(QueryState state, Dialect config) {
  final paramsString = SqlHelper(ParserMode.prepared);
  final finalString = SqlHelper(ParserMode.prepared);

  final sqlHelper =
      defaultToSql(state, config, ParserMode.prepared, toSqlOptionsFor(config));

  var sql = sqlHelper.getSql();
  sql = sql.replaceAll("'", "''");

  final values = sqlHelper.getValues();

  // Substitute by token, never by scanning for a bare `?`. The old scan rewrote the first `?` it
  // found — which, for `selectRaw("'why?' AS q")`, was the one inside the caller's string literal.
  sql = renderPlaceholders(sql, (index) => '@p$index');

  for (var index = 0; index < values.length; index++) {
    if (index > 0) {
      paramsString.addSqlSnippet(', ');
    }
    paramsString.addSqlSnippet('@p$index ${mssqlParameterType(values[index])}');
  }

  finalString.addSqlSnippet('SET NOCOUNT ON; ');
  finalString.addSqlSnippet("exec sp_executesql N'");
  finalString.addSqlSnippet(sql);
  finalString.addSqlSnippet("', N'");
  finalString.addSqlSnippet(paramsString.getSql());
  finalString.addSqlSnippet("'");

  // Only append the parameter-value list when there are parameters; otherwise a trailing `', ;` is
  // malformed sp_executesql syntax and SQL Server rejects the whole statement.
  if (values.isNotEmpty) {
    finalString.addSqlSnippet(', ');
    for (var i = 0; i < values.length; i++) {
      if (i > 0) {
        finalString.addSqlSnippet(', ');
      }
      finalString.addSqlSnippet('@p$i = ${mssqlParameterValue(values[i])}');
    }
  }

  finalString.addSqlSnippet(';');

  return finalString.getSql();
}

/// Postgres uses numbered `$n` placeholders: substitute the Nth token with `$1`, `$2`, … in order.
PreparedSql _postgresPrepared(QueryState state, Dialect config) {
  final sqlHelper = defaultToSql(state, config, ParserMode.prepared);
  // Use the dialect placeholder character as the `$n` prefix so the config field is not dead.
  final sql = renderPlaceholders(
    sqlHelper.getSql(),
    (index) => '${config.preparedStatementPlaceholder}${index + 1}',
  );
  return PreparedSql(sql, sqlHelper.getValues());
}

/// The dialect's own placeholder, substituted for each token. MySQL and SQLite bind positionally.
PreparedSql _positionalPrepared(QueryState state, Dialect config) {
  final sqlHelper = defaultToSql(state, config, ParserMode.prepared);
  final sql = renderPlaceholders(
    sqlHelper.getSql(),
    (index) => config.preparedStatementPlaceholder,
  );
  return PreparedSql(sql, sqlHelper.getValues());
}

/// Renders one query state as a prepared SQL string.
String parse(QueryState state, Dialect config) {
  if (config.databaseType == DatabaseType.mssql) {
    return _mssqlToSql(state, config);
  }
  if (config.databaseType == DatabaseType.postgres) {
    return _postgresPrepared(state, config).sql;
  }
  return _positionalPrepared(state, config).sql;
}

/// Renders one query state as prepared SQL plus its ordered bound values. MSSQL inlines its values
/// into the `sp_executesql` string, so its `params` is empty.
PreparedSql parsePrepared(QueryState state, Dialect config) {
  if (config.databaseType == DatabaseType.mssql) {
    return PreparedSql(_mssqlToSql(state, config), const []);
  }
  if (config.databaseType == DatabaseType.postgres) {
    return _postgresPrepared(state, config);
  }
  return _positionalPrepared(state, config);
}

/// Renders one query state as a raw SQL string with values inlined (MSSQL keeps its `TOP`). DEBUG /
/// TEST display only — NOT execution-safe.
String parseRaw(QueryState state, Dialect config) {
  final sqlHelper =
      defaultToSql(state, config, ParserMode.raw, toSqlOptionsFor(config));
  return sqlHelper.getSqlDebug();
}

/// Renders a batch of query states as a single prepared SQL string. Each statement is prepared
/// independently, so placeholder numbering restarts per statement.
String parseMulti(
  List<QueryState> states,
  MultiBuilderTransactionState transactionState,
  Dialect config,
) {
  var sql = '';

  if (transactionState == MultiBuilderTransactionState.transactionOn) {
    sql += '${config.transactionDelimiters.begin}; ';
  }

  for (final state in states) {
    sql += parse(state, config);
  }

  if (transactionState == MultiBuilderTransactionState.transactionOn) {
    sql += '${config.transactionDelimiters.end};';
  }

  return sql;
}

/// Renders a batch of query states as a single raw SQL string with values inlined. DEBUG / TEST only.
String parseMultiRaw(
  List<QueryState> states,
  MultiBuilderTransactionState transactionState,
  Dialect config,
) {
  var sql = '';

  if (transactionState == MultiBuilderTransactionState.transactionOn) {
    sql += '${config.transactionDelimiters.begin}; ';
  }

  for (final state in states) {
    sql += parseRaw(state, config);
  }

  if (transactionState == MultiBuilderTransactionState.transactionOn) {
    sql += '${config.transactionDelimiters.end};';
  }

  return sql;
}
