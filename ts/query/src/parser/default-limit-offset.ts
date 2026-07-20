import type { Dialect } from '../configuration/configuration';
import { DatabaseType } from '../enums/database-type';
import { ParserArea } from '../enums/parser-area';
import type { ParserMode } from '../enums/parser-mode';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';
import type { QueryState } from '../state/query';

/**
 * Each grammar's idiom for "no upper bound, just skip n rows".
 *
 * MySQL and SQLite have no standalone OFFSET — it only parses as the tail of a LIMIT — so an offset
 * without a limit needs a sentinel limit in front of it or the statement is a syntax error (MySQL
 * 1064, SQLite `near "OFFSET"`). MySQL's documented idiom is the largest unsigned BIGINT, 2^64-1;
 * 2^64 is itself a syntax error. Postgres is deliberately absent: a bare OFFSET is valid there.
 */
const unboundedLimit: Partial<Record<DatabaseType, string>> = {
  [DatabaseType.Mysql]: '18446744073709551615',
  [DatabaseType.Sqlite]: '-1',
};

/** How each dialect is named in a refusal, so every message reads `<Dialect> has no ...`. */
export const dialectDisplayName = (databaseType: DatabaseType): string =>
  ({
    [DatabaseType.Mssql]: 'MSSQL',
    [DatabaseType.Mysql]: 'MySQL',
    [DatabaseType.Postgres]: 'Postgres',
    [DatabaseType.Sqlite]: 'SQLite',
    [DatabaseType.Unknown]: 'This dialect',
  })[databaseType];

/**
 * True when the caller called `.top(n)` at all.
 *
 * Presence, not positivity: `.top(0)` still counts as "the caller asked for a TOP", which is what
 * both the MSSQL TOP/LIMIT conflict guard and the non-MSSQL refusal need — silently ignoring
 * `.top(0)` would be the same class of bug this release is removing. `.clearTop()` deletes the key,
 * so it reads false again afterwards.
 */
export const hasExplicitTop = (state: QueryState): boolean =>
  state.customState !== null &&
  state.customState !== undefined &&
  state.customState['top'] !== null &&
  state.customState['top'] !== undefined;

export const defaultLimitOffset = (
  state: QueryState,
  config: Dialect,
  mode: ParserMode,
): SqlHelper => {
  const sqlHelper = new SqlHelper(mode);

  if (state.limit === 0 && state.offset === 0) {
    return sqlHelper;
  }

  if (
    config.databaseType === DatabaseType.Mysql ||
    config.databaseType === DatabaseType.Postgres ||
    config.databaseType === DatabaseType.Sqlite
  ) {
    if (state.limitWithTies) {
      if (config.databaseType === DatabaseType.Sqlite) {
        throw new ParserError(ParserArea.LimitOffset, 'SQLite does not support WITH TIES');
      }

      if (config.databaseType === DatabaseType.Mysql) {
        throw new ParserError(ParserArea.LimitOffset, 'MySQL does not support WITH TIES');
      }

      if (state.limit <= 0) {
        throw new ParserError(ParserArea.LimitOffset, 'limitWithTies requires a positive limit');
      }

      if (state.offset > 0) {
        sqlHelper.addSqlSnippet('OFFSET ');
        sqlHelper.addSqlSnippet(state.offset.toString());
        sqlHelper.addSqlSnippet(' ROWS ');
      }

      sqlHelper.addSqlSnippet('FETCH FIRST ');
      sqlHelper.addSqlSnippet(state.limit.toString());
      sqlHelper.addSqlSnippet(' ROWS WITH TIES');
      return sqlHelper;
    }

    if (state.limit > 0) {
      sqlHelper.addSqlSnippet('LIMIT ');
      sqlHelper.addSqlSnippet(state.limit.toString());
    } else if (state.offset > 0) {
      // Offset with no limit is a legitimate query — "skip n, return the rest" — but MySQL and
      // SQLite cannot spell it without a limit in front. Postgres yields no sentinel and keeps its
      // bare OFFSET.
      const sentinel = unboundedLimit[config.databaseType];

      if (sentinel !== undefined) {
        sqlHelper.addSqlSnippet('LIMIT ');
        sqlHelper.addSqlSnippet(sentinel);
      }
    }

    if (state.offset > 0) {
      if (state.limit > 0) {
        sqlHelper.addSqlSnippet(' ');
      }

      sqlHelper.addSqlSnippet(' OFFSET ');
      sqlHelper.addSqlSnippet(state.offset.toString());
    }
  }

  if (config.databaseType === DatabaseType.Mssql) {
    if (
      state.customState !== null &&
      state.customState !== undefined &&
      state.customState['top'] !== null &&
      state.customState['top'] !== undefined &&
      (state.limit > 0 || state.offset > 0)
    ) {
      throw new ParserError(
        ParserArea.LimitOffset,
        'MSSQL should not use both TOP and LIMIT/OFFSET in the same query',
      );
    }

    // `WITH TIES` exists ONLY on `TOP` in T-SQL. `<offset_fetch>` terminates in a mandatory `ONLY`
    // and `TOP` admits no offset, so no production joins the two — the old
    // `FETCH NEXT n ROWS WITH TIES` was never runnable. MSSQL keeps the capability, but through its
    // real spelling: `SELECT TOP (n) WITH TIES`, emitted by the SELECT hook in `to-sql.ts`.
    if (state.limitWithTies) {
      if (state.limit <= 0) {
        throw new ParserError(ParserArea.LimitOffset, 'limitWithTies requires a positive limit');
      }

      if (state.offset > 0) {
        throw new ParserError(
          ParserArea.LimitOffset,
          'MSSQL cannot combine WITH TIES and OFFSET — TOP admits no offset',
        );
      }
    } else {
      if (state.limit > 0 || state.offset > 0) {
        sqlHelper.addSqlSnippet('OFFSET ');
        sqlHelper.addSqlSnippet(state.offset.toString());
        sqlHelper.addSqlSnippet(' ROWS');
      }

      if (state.limit > 0) {
        sqlHelper.addSqlSnippet(' ');

        sqlHelper.addSqlSnippet('FETCH NEXT ');
        sqlHelper.addSqlSnippet(state.limit.toString());
        sqlHelper.addSqlSnippet(' ROWS ONLY');
      }
    }
  }

  // Evaluated after the clause text is built so that MSSQL's TOP/LIMIT conflict above reports
  // first. Both arms are the same guard: pagination needs a deterministic order to page against.
  if (state.orderByStates.length === 0) {
    if (state.limitWithTies) {
      throw new ParserError(ParserArea.LimitOffset, 'ORDER BY is required when using WITH TIES');
    }

    if (state.offset > 0) {
      throw new ParserError(ParserArea.LimitOffset, 'ORDER BY is required when using OFFSET');
    }

    // MSSQL renders `.limit(n)` as OFFSET/FETCH, and T-SQL requires an ORDER BY for it (Msg 102).
    // `.limit()` is pagination; the designer's explicit, unordered row cap is `.top(n)`.
    if (config.databaseType === DatabaseType.Mssql && state.limit > 0) {
      throw new ParserError(
        ParserArea.LimitOffset,
        'ORDER BY is required when using LIMIT on MSSQL, which paginates with OFFSET/FETCH; use top() for an unordered row cap',
      );
    }
  }

  return sqlHelper;
};
