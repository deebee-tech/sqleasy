/// Row-capping and ordering on an UPDATE or DELETE.
///
/// Mirrors the TypeScript port's `src/parser/default-mutation-row-cap.ts`.
library;

import '../configuration.dart';
import '../enums.dart';
import '../errors/parser_error.dart';
import '../sql_helper.dart';
import '../state.dart';
import 'default_limit_offset.dart';
import 'default_order_by.dart';

/// Row-capping and ordering on an UPDATE or DELETE — `UPDATE … ORDER BY … LIMIT n`,
/// `DELETE TOP (n)`.
///
/// ── WHAT WAS WRONG (fixed 2026-07-22) ──
/// `.limit()`, `.offset()`, `.top()` and `.orderByColumn()` were all reachable on a mutation and
/// ALL FOUR were silently dropped: the update and delete branches of `to_sql.dart` returned before
/// the ORDER BY and limit/offset blocks, and MSSQL's TOP was emitted only by the
/// `beforeSelectColumns` hook, which only `defaultSelect` calls. So `.limit(1000)` on a DELETE
/// produced no clause, no parameter and no error — the statement deleted the whole table.
///
/// ── WHAT EACH ENGINE ACTUALLY DOES (measured against the harness, 2026-07-22) ──
///
///     MySQL 8.4     UPDATE/DELETE … ORDER BY … LIMIT n   accepted; ORDER BY alone also accepted
///                   … LIMIT 1 OFFSET 1                   ERROR 1064 — no OFFSET on a mutation
///                   multi-table UPDATE … LIMIT 1         ERROR 1221
///     MSSQL 2022    UPDATE TOP (n) / DELETE TOP (n)      accepted
///                   UPDATE TOP (1) … ORDER BY id         Msg 156 "Incorrect syntax near 'ORDER'"
///     Postgres 17   UPDATE … LIMIT 1                     syntax error at or near "LIMIT"
///     SQLite 3.51   UPDATE/DELETE … LIMIT 1              syntax error — needs
///                                                        SQLITE_ENABLE_UPDATE_DELETE_LIMIT, off in
///                                                        the shipped amalgamation
///
/// Postgres's `ctid`/CTE workaround and SQLite's subquery rewrite are both emulation, so both
/// refuse rather than approximate.
const _noMutationCap = <DatabaseType, String>{
  DatabaseType.postgres:
      'Postgres has no row limit on UPDATE/DELETE — narrow the WHERE clause, or delete by a key '
          'set you selected first (the ctid/CTE rewrite is an emulation this library will not do '
          'for you)',
  DatabaseType.sqlite:
      'SQLite has no row limit on UPDATE/DELETE unless it was compiled with '
          'SQLITE_ENABLE_UPDATE_DELETE_LIMIT, which the shipped amalgamation is not — narrow the '
          'WHERE clause, or delete by a key set you selected first',
};

/// Rejects every row-cap/ordering combination the target engine cannot run.
///
/// Called from the update and delete branches BEFORE any SQL is produced, so a refused statement
/// never reaches a driver.
void assertMutationRowCapSupported(
  QueryState state,
  Dialect config,
  ParserArea area,
) {
  final wantsTop = hasExplicitTop(state);
  final wantsLimit = state.limit > 0;
  final wantsOffset = state.offset > 0;
  final wantsOrderBy = state.orderByStates.isNotEmpty;

  if (!wantsTop && !wantsLimit && !wantsOffset && !wantsOrderBy) return;

  // OFFSET has no mutation form on ANY of the four — MySQL, the only engine with a mutation LIMIT,
  // rejects `LIMIT 1 OFFSET 1` outright (ERROR 1064).
  if (wantsOffset) {
    throw ParserError(
      area,
      'offset() has no meaning on UPDATE/DELETE — no dialect supports skipping rows in a mutation',
    );
  }

  if (config.databaseType == DatabaseType.mssql) {
    if (wantsLimit) {
      throw ParserError(
        area,
        'MSSQL caps a mutation with TOP, not LIMIT — use top(n). limit() is the SELECT-only '
        'OFFSET/FETCH form and T-SQL has no such clause on UPDATE/DELETE',
      );
    }
    if (wantsOrderBy) {
      throw ParserError(
        area,
        'T-SQL takes no ORDER BY on an UPDATE/DELETE, so TOP (n) picks an arbitrary n rows — '
        'select the keys you want in the order you want, then mutate by those keys',
      );
    }
    return;
  }

  if (config.databaseType == DatabaseType.mysql) {
    // A multi-table UPDATE/DELETE cannot carry LIMIT: ERROR 1221 "Incorrect usage of UPDATE and
    // LIMIT". ORDER BY is refused with it for the same reason — MySQL rejects the pair.
    if ((wantsLimit || wantsOrderBy) && state.joinStates.isNotEmpty) {
      throw ParserError(
        area,
        'MySQL takes no ORDER BY or LIMIT on a multi-table UPDATE/DELETE (ERROR 1221) — mutate '
        'one table at a time, or narrow the join',
      );
    }
    return;
  }

  final refusal = _noMutationCap[config.databaseType];
  if (refusal != null) {
    throw ParserError(area, refusal);
  }
}

/// The `TOP (n) ` prefix for a T-SQL mutation, or `''`.
///
/// T-SQL's spelling is `UPDATE TOP (n) tbl` / `DELETE TOP (n) FROM tbl`, so this sits between the
/// verb and the target — unlike MySQL's trailing LIMIT.
String mssqlMutationTop(QueryState state, Dialect config) {
  if (config.databaseType != DatabaseType.mssql || !hasExplicitTop(state)) {
    return '';
  }
  final top = (state.customState!['top'] as num).toInt();
  return top > 0 ? 'TOP ($top) ' : '';
}

/// Emits MySQL's trailing `ORDER BY … LIMIT n` on a mutation.
///
/// Runs after the WHERE clause, which is where MySQL's grammar puts it. Both parts are optional and
/// independent: `ORDER BY` alone is legal (measured), and so is `LIMIT` alone.
void emitMutationRowCap(
  SqlHelper sqlHelper,
  QueryState state,
  Dialect config,
  ParserMode mode,
) {
  if (config.databaseType != DatabaseType.mysql) return;

  if (state.orderByStates.isNotEmpty) {
    final orderBy = defaultOrderBy(state, config, mode);
    sqlHelper.addSqlSnippet(' ');
    sqlHelper.addSqlSnippetWithValues(orderBy.getSql(), orderBy.getValues());
  }

  if (state.limit > 0) {
    // Spliced, not bound — the same choice `defaultLimitOffset` makes for SELECT.
    sqlHelper.addSqlSnippet(' LIMIT ${state.limit}');
  }
}
