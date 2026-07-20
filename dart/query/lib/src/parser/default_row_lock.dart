import '../configuration.dart';
import '../enums.dart';
import '../errors/parser_error.dart';
import '../sql_helper.dart';
import '../state.dart';

/// Trailing `FOR UPDATE`/`FOR SHARE` clause for Postgres/MySQL, appended after the whole SELECT
/// (including ORDER BY/LIMIT). SQLite has no row-level locking at all and refuses it. MSSQL emits
/// nothing here — its locking is a `WITH (...)` table hint on each FROM table; see
/// [mssqlRowLockHint].
void emitTrailingRowLockClause(
  SqlHelper sqlHelper,
  Dialect config,
  RowLockState rowLock,
) {
  if (config.databaseType == DatabaseType.sqlite) {
    throw ParserError(
      ParserArea.general,
      'SQLite does not support row locking (FOR UPDATE/FOR SHARE)',
    );
  }

  if (config.databaseType == DatabaseType.mssql) {
    return;
  }

  sqlHelper.addSqlSnippet(' ');
  sqlHelper.addSqlSnippet(
      rowLock.mode == RowLockMode.forUpdate ? 'FOR UPDATE' : 'FOR SHARE');

  if (rowLock.wait == RowLockWait.nowait) {
    sqlHelper.addSqlSnippet(' NOWAIT');
  } else if (rowLock.wait == RowLockWait.skipLocked) {
    sqlHelper.addSqlSnippet(' SKIP LOCKED');
  }
}

/// MSSQL has no `FOR UPDATE`/`FOR SHARE` clause — the nearest equivalent is a `WITH (...)`
/// locking hint on the table reference itself. `UPDLOCK`/`HOLDLOCK` approximate `FOR
/// UPDATE`/`FOR SHARE`; `ROWLOCK` asks for row- (not page/table-) granularity; `NOWAIT`/
/// `READPAST` approximate `NOWAIT`/`SKIP LOCKED`.
/// Refuses a row lock that MSSQL has nowhere to put.
///
/// T-SQL's `table_hint` production attaches to a `table_or_view_name` and nothing else, so a
/// derived table, a table-valued function, a LATERAL/APPLY body or a raw FROM fragment cannot carry
/// a locking hint. Emitting none silently returned rows the caller believed were locked.
void refuseUnplaceableMssqlRowLock(
    Dialect config, RowLockState? rowLock, String sourceDescription) {
  if (rowLock == null || config.databaseType != DatabaseType.mssql) {
    return;
  }

  throw ParserError(
    ParserArea.general,
    'MSSQL cannot lock $sourceDescription — a locking hint attaches to a table reference only',
  );
}

String mssqlRowLockHint(RowLockState rowLock) {
  // `forUpdate` maps cleanly: `UPDLOCK, ROWLOCK` is Microsoft's own documented idiom.
  //
  // `forShare` does NOT. T-SQL's hints split into lock hints (UPDLOCK/XLOCK/ROWLOCK) and isolation
  // hints (HOLDLOCK/REPEATABLEREAD), and there is no "shared row lock held to commit" in the first
  // group. HOLDLOCK is a synonym for SERIALIZABLE — it takes key-range locks preventing phantom
  // inserts, which FOR SHARE does not — so emitting it silently escalated the isolation level.
  if (rowLock.mode == RowLockMode.forShare) {
    throw ParserError(
      ParserArea.general,
      'MSSQL has no shared row lock — HOLDLOCK is a SERIALIZABLE isolation hint, not FOR SHARE; '
      'use forUpdate() or take the isolation level explicitly',
    );
  }

  const strength = 'UPDLOCK, ROWLOCK';

  if (rowLock.wait == RowLockWait.nowait) {
    return ' WITH ($strength, NOWAIT)';
  }

  // READPAST is Microsoft's documented queue-table idiom alongside UPDLOCK and ROWLOCK.
  if (rowLock.wait == RowLockWait.skipLocked) {
    return ' WITH ($strength, READPAST)';
  }

  return ' WITH ($strength)';
}
