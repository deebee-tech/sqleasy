import type { Dialect } from '../configuration/configuration';
import { DatabaseType } from '../enums/database-type';
import { HintKind } from '../enums/hint-kind';
import { ParserArea } from '../enums/parser-area';
import type { ParserMode } from '../enums/parser-mode';
import { quoteIdentifier } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';
import type { HintState } from '../state/hint';
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
  }
};

export const defaultHint = (_state: QueryState, _config: Dialect, _mode: ParserMode): SqlHelper =>
  new SqlHelper(_mode);
