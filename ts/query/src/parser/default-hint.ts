import type { Dialect } from '../configuration/configuration';
import { DatabaseType } from '../enums/database-type';
import { HintKind } from '../enums/hint-kind';
import { ParserArea } from '../enums/parser-area';
import type { ParserMode } from '../enums/parser-mode';
import { quoteIdentifier } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';
import type { QueryState } from '../state/query';

/** MySQL index hint text immediately after a table reference (`USE INDEX (idx)`). */
export const mysqlIndexHintForTable = (
  state: QueryState,
  config: Dialect,
  tableNameOrAlias: string,
): string => {
  const hints = state.hintStates ?? [];
  if (hints.length === 0) {
    return '';
  }

  const indexHints = hints.filter(
    (hint) =>
      (hint.kind === HintKind.UseIndex || hint.kind === HintKind.ForceIndex) &&
      hint.tableNameOrAlias === tableNameOrAlias &&
      hint.indexName,
  );

  if (indexHints.length === 0) {
    return '';
  }

  if (config.databaseType !== DatabaseType.Mysql) {
    throw new ParserError(
      ParserArea.From,
      'MySQL index hints (hintUseIndex/hintForceIndex) are only supported on MySQL',
    );
  }

  let sql = '';
  for (const hint of indexHints) {
    sql +=
      (hint.kind === HintKind.ForceIndex ? ' FORCE INDEX (' : ' USE INDEX (') +
      quoteIdentifier(hint.indexName!, config.identifierDelimiters) +
      ')';
  }

  return sql;
};

/** Trailing MSSQL `OPTION (...)` and raw hints appended after the SELECT statement body. */
export const emitTrailingHints = (
  sqlHelper: SqlHelper,
  state: QueryState,
  config: Dialect,
): void => {
  const hints = state.hintStates ?? [];
  if (hints.length === 0) {
    return;
  }

  for (const hint of hints) {
    if (hint.kind === HintKind.MssqlOption) {
      if (config.databaseType !== DatabaseType.Mssql) {
        throw new ParserError(
          ParserArea.General,
          'hintMssqlOption is only supported on MSSQL — use hintRaw on other dialects',
        );
      }

      if (!hint.optionText || hint.optionText.trim() === '') {
        throw new ParserError(ParserArea.General, 'hintMssqlOption requires non-empty option text');
      }

      sqlHelper.addSqlSnippet(' OPTION (');
      sqlHelper.addSqlSnippet(hint.optionText);
      sqlHelper.addSqlSnippet(')');
      continue;
    }

    if (hint.kind === HintKind.Raw) {
      if (!hint.raw || hint.raw.trim() === '') {
        throw new ParserError(ParserArea.General, 'hintRaw requires non-empty SQL');
      }

      sqlHelper.addSqlSnippet(' ');
      sqlHelper.addSqlSnippet(hint.raw);
    }
  }
};

/** Validates that no unsupported hint kinds remain unhandled at parse time. */
export const validateHints = (state: QueryState, config: Dialect, area: ParserArea): void => {
  const hints = state.hintStates ?? [];
  if (hints.length === 0) {
    return;
  }

  for (const hint of hints) {
    if (hint.kind === HintKind.UseIndex || hint.kind === HintKind.ForceIndex) {
      if (config.databaseType !== DatabaseType.Mysql) {
        throw new ParserError(
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
    //   SELECT … UNION ALL SELECT … OPTION (MAXDOP 1);                          accepted
    //   WITH c AS (SELECT id FROM orders OPTION (MAXDOP 1)) SELECT id FROM c;   Msg 156
    //   SELECT … OPTION (MAXDOP 1) UNION ALL SELECT …;                          Msg 156
    //   SELECT … OPTION (MAXDOP 1) OPTION (MAXDOP 2);                           Msg 156
    //
    // Set on a CHILD builder it therefore either failed to compile (inside a CTE body or a
    // subquery's parentheses) or — worse — silently became statement-wide when the child happened
    // to be textually last, hinting operands the caller never named. A child is not the statement,
    // so it cannot carry a statement-level clause; refusing says so instead of guessing which.
    if (hint.kind === HintKind.MssqlOption && state.isInnerStatement) {
      throw new ParserError(
        area,
        'OPTION is a statement-level clause in T-SQL — exactly once, at the very end of the whole ' +
          'statement — so it cannot be set on a CTE body, a set-operation branch or a subquery. ' +
          'Set hintMssqlOption on the outermost builder, where it applies to the statement it ' +
          'actually governs.',
      );
    }
  }
};

export const defaultHint = (_state: QueryState, _config: Dialect, _mode: ParserMode): SqlHelper =>
  new SqlHelper(_mode);
