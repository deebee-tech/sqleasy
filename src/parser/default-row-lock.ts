import type { Dialect } from '../configuration/configuration';
import { DatabaseType } from '../enums/database-type';
import { ParserArea } from '../enums/parser-area';
import { RowLockMode } from '../enums/row-lock-mode';
import { RowLockWait } from '../enums/row-lock-wait';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';
import type { RowLockState } from '../state/row-lock';

/**
 * Trailing `FOR UPDATE`/`FOR SHARE` clause for Postgres/MySQL, appended after the whole SELECT
 * (including ORDER BY/LIMIT). SQLite has no row-level locking at all and refuses it. MSSQL emits
 * nothing here — its locking is a `WITH (...)` table hint on each FROM table; see
 * {@link mssqlRowLockHint}.
 */
export const emitTrailingRowLockClause = (
  sqlHelper: SqlHelper,
  config: Dialect,
  rowLock: RowLockState,
): void => {
  if (config.databaseType === DatabaseType.Sqlite) {
    throw new ParserError(
      ParserArea.General,
      'SQLite does not support row locking (FOR UPDATE/FOR SHARE)',
    );
  }

  if (config.databaseType === DatabaseType.Mssql) {
    return;
  }

  sqlHelper.addSqlSnippet(' ');
  sqlHelper.addSqlSnippet(rowLock.mode === RowLockMode.ForUpdate ? 'FOR UPDATE' : 'FOR SHARE');

  if (rowLock.wait === RowLockWait.Nowait) {
    sqlHelper.addSqlSnippet(' NOWAIT');
  } else if (rowLock.wait === RowLockWait.SkipLocked) {
    sqlHelper.addSqlSnippet(' SKIP LOCKED');
  }
};

/**
 * MSSQL has no `FOR UPDATE`/`FOR SHARE` clause — the nearest equivalent is a `WITH (...)`
 * locking hint on the table reference itself. `UPDLOCK`/`HOLDLOCK` approximate `FOR
 * UPDATE`/`FOR SHARE`; `ROWLOCK` asks for row- (not page/table-) granularity; `NOWAIT`/
 * `READPAST` approximate `NOWAIT`/`SKIP LOCKED`.
 */
export const mssqlRowLockHint = (rowLock: RowLockState): string => {
  const strength =
    rowLock.mode === RowLockMode.ForUpdate ? 'UPDLOCK, ROWLOCK' : 'HOLDLOCK, ROWLOCK';

  if (rowLock.wait === RowLockWait.Nowait) {
    return ` WITH (${strength}, NOWAIT)`;
  }

  if (rowLock.wait === RowLockWait.SkipLocked) {
    return ` WITH (${strength}, READPAST)`;
  }

  return ` WITH (${strength})`;
};
