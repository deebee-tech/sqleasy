import '../configuration.dart';
import '../enums.dart';
import '../errors/parser_error.dart';
import '../sql_helper.dart';
import '../state.dart';

/// Each grammar's idiom for "no upper bound, just skip n rows".
///
/// MySQL and SQLite have no standalone OFFSET — it only parses as the tail of a LIMIT — so an
/// offset without a limit needs a sentinel limit in front of it or the statement is a syntax error
/// (MySQL 1064, SQLite `near "OFFSET"`). MySQL's documented idiom is the largest unsigned BIGINT,
/// 2^64-1; 2^64 is itself a syntax error. Postgres is deliberately absent: a bare OFFSET is valid
/// there.
const _unboundedLimit = <DatabaseType, String>{
  DatabaseType.mysql: '18446744073709551615',
  DatabaseType.sqlite: '-1',
};

/// True when the caller called `.top(n)` at all.
///
/// Presence, not positivity: `.top(0)` still counts as "the caller asked for a TOP", which is what
/// both the MSSQL TOP/LIMIT conflict guard and the non-MSSQL refusal need. `.clearTop()` deletes
/// the key, so it reads false again afterwards.
bool hasExplicitTop(QueryState state) => state.customState?['top'] != null;

SqlHelper defaultLimitOffset(
    QueryState state, Dialect config, ParserMode mode) {
  final sqlHelper = SqlHelper(mode);

  if (state.limit == 0 && state.offset == null && !state.limitWithTies) {
    return sqlHelper;
  }

  if (config.databaseType == DatabaseType.mysql ||
      config.databaseType == DatabaseType.postgres ||
      config.databaseType == DatabaseType.sqlite) {
    if (state.limitWithTies) {
      if (config.databaseType == DatabaseType.sqlite) {
        throw ParserError(
            ParserArea.limitOffset, 'SQLite does not support WITH TIES');
      }

      if (config.databaseType == DatabaseType.mysql) {
        throw ParserError(
            ParserArea.limitOffset, 'MySQL does not support WITH TIES');
      }

      if (state.limit <= 0) {
        throw ParserError(
            ParserArea.limitOffset, 'limitWithTies requires a positive limit');
      }

      if (state.offset != null) {
        sqlHelper.addSqlSnippet('OFFSET ');
        sqlHelper.addSqlSnippet((state.offset ?? 0).toString());
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
    } else if (state.offset != null) {
      // Offset with no limit is a legitimate query — "skip n, return the rest" — but MySQL and
      // SQLite cannot spell it without a limit in front. Postgres yields no sentinel and keeps its
      // bare OFFSET.
      final sentinel = _unboundedLimit[config.databaseType];

      if (sentinel != null) {
        sqlHelper.addSqlSnippet('LIMIT ');
        sqlHelper.addSqlSnippet(sentinel);
      }
    }

    if (state.offset != null) {
      if (state.limit > 0) {
        sqlHelper.addSqlSnippet(' ');
      }

      sqlHelper.addSqlSnippet(' OFFSET ');
      sqlHelper.addSqlSnippet((state.offset ?? 0).toString());
    }
  }

  if (config.databaseType == DatabaseType.mssql) {
    final top = state.customState?['top'];
    if (top != null && (state.limit > 0 || state.offset != null)) {
      throw ParserError(
        ParserArea.limitOffset,
        'MSSQL should not use both TOP and LIMIT/OFFSET in the same query',
      );
    }

    // `WITH TIES` exists ONLY on `TOP` in T-SQL. `<offset_fetch>` terminates in a mandatory `ONLY`
    // and `TOP` admits no offset, so no production joins the two — the old
    // `FETCH NEXT n ROWS WITH TIES` was never runnable. MSSQL keeps the capability, but through its
    // real spelling: `SELECT TOP (n) WITH TIES`, emitted by the SELECT hook in `to_sql.dart`.
    if (state.limitWithTies) {
      if (state.limit <= 0) {
        throw ParserError(
            ParserArea.limitOffset, 'limitWithTies requires a positive limit');
      }

      if (state.offset != null) {
        throw ParserError(
          ParserArea.limitOffset,
          'MSSQL cannot combine WITH TIES and OFFSET — TOP admits no offset',
        );
      }
    } else {
      if (state.limit > 0 || state.offset != null) {
        sqlHelper.addSqlSnippet('OFFSET ');
        sqlHelper.addSqlSnippet((state.offset ?? 0).toString());
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
  if (state.orderByStates.isEmpty) {
    if (state.limitWithTies) {
      throw ParserError(
          ParserArea.limitOffset, 'ORDER BY is required when using WITH TIES');
    }

    // A REAL skip needs a deterministic order to skip against — this library's policy, and it
    // applies to `offset(n > 0)`. `offset(0)` skips nothing, so it carries no such hazard, and
    // three of four engines take it bare. On Postgres it is a deliberate OPTIMIZER FENCE, which is
    // a real capability, not a no-op — EXPLAIN on the harness:
    //
    //     SELECT * FROM (SELECT id FROM orders)          x WHERE id=1  ->  Index Only Scan
    //     SELECT * FROM (SELECT id FROM orders OFFSET 0) x WHERE id=1  ->  Subquery Scan + Seq Scan
    if (state.offset != null && state.offset! > 0) {
      throw ParserError(
          ParserArea.limitOffset, 'ORDER BY is required when using OFFSET');
    }

    // T-SQL is the exception: OFFSET belongs to `<offset_fetch>`, which attaches to ORDER BY, so
    // even `OFFSET 0 ROWS` alone is Msg 102.
    if (state.offset == 0 && config.databaseType == DatabaseType.mssql) {
      throw ParserError(
        ParserArea.limitOffset,
        'ORDER BY is required when using OFFSET on MSSQL — T-SQL attaches OFFSET/FETCH to ORDER BY, '
        'so even OFFSET 0 ROWS needs one (Msg 102)',
      );
    }

    // MSSQL renders `.limit(n)` as OFFSET/FETCH, and T-SQL requires an ORDER BY for it (Msg 102).
    // `.limit()` is pagination; the designer's explicit, unordered row cap is `.top(n)`.
    if (config.databaseType == DatabaseType.mssql && state.limit > 0) {
      throw ParserError(
        ParserArea.limitOffset,
        'ORDER BY is required when using LIMIT on MSSQL, which paginates with OFFSET/FETCH; use top() for an unordered row cap',
      );
    }
  }

  return sqlHelper;
}
