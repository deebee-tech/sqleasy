import type { Dialect } from '../configuration/configuration';
import { DatabaseType } from '../enums/database-type';
import { FullTextMode } from '../enums/full-text-mode';
import type { ParserArea } from '../enums/parser-area';
import { quoteIdentifier } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';

export type FullTextColumnRef = {
  tableNameOrAlias: string;
  columnName: string;
};

const columnRef = (config: Dialect, tableNameOrAlias: string, columnName: string): string =>
  quoteIdentifier(tableNameOrAlias, config.identifierDelimiters) +
  '.' +
  quoteIdentifier(columnName, config.identifierDelimiters);

/**
 * Emits a dialect-specific full-text predicate for one or more columns and a bound query term.
 * The query value is appended by the caller via {@link SqlHelper.addDynamicValue}.
 */
export const emitFullTextPredicate = (
  sqlHelper: SqlHelper,
  config: Dialect,
  columns: FullTextColumnRef[],
  mode: FullTextMode,
  area: ParserArea,
): void => {
  if (columns.length === 0) {
    throw new ParserError(area, 'Full-text search requires at least one column');
  }

  if (config.databaseType === DatabaseType.Postgres) {
    if (mode === FullTextMode.Phrase) {
      throw new ParserError(
        area,
        'Postgres phrase full-text search is not structured yet — use whereMatchRaw or plainto_tsquery in raw SQL',
      );
    }

    if (columns.length === 1) {
      const col = columns[0]!;
      sqlHelper.addSqlSnippet('to_tsvector(');
      sqlHelper.addSqlSnippet(JSON.stringify('english'));
      sqlHelper.addSqlSnippet(', ');
      sqlHelper.addSqlSnippet(columnRef(config, col.tableNameOrAlias, col.columnName));
      sqlHelper.addSqlSnippet(') @@ ');
      sqlHelper.addSqlSnippet(mode === FullTextMode.Boolean ? 'to_tsquery(' : 'plainto_tsquery(');
      sqlHelper.addSqlSnippet(JSON.stringify('english'));
      sqlHelper.addSqlSnippet(', ');
      return;
    }

    sqlHelper.addSqlSnippet('to_tsvector(');
    sqlHelper.addSqlSnippet(JSON.stringify('english'));
    sqlHelper.addSqlSnippet(', ');
    sqlHelper.addSqlSnippet('concat(');
    columns.forEach((col, i) => {
      sqlHelper.addSqlSnippet(columnRef(config, col.tableNameOrAlias, col.columnName));
      if (i < columns.length - 1) {
        sqlHelper.addSqlSnippet(", ' ', ");
      }
    });
    sqlHelper.addSqlSnippet(')) @@ ');
    sqlHelper.addSqlSnippet(mode === FullTextMode.Boolean ? 'to_tsquery(' : 'plainto_tsquery(');
    sqlHelper.addSqlSnippet(JSON.stringify('english'));
    sqlHelper.addSqlSnippet(', ');
    return;
  }

  if (config.databaseType === DatabaseType.Mysql) {
    sqlHelper.addSqlSnippet('MATCH (');
    columns.forEach((col, i) => {
      sqlHelper.addSqlSnippet(columnRef(config, col.tableNameOrAlias, col.columnName));
      if (i < columns.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }
    });
    sqlHelper.addSqlSnippet(') AGAINST (');
    return;
  }

  if (config.databaseType === DatabaseType.Mssql) {
    if (columns.length !== 1) {
      throw new ParserError(
        area,
        'MSSQL CONTAINS/FREETEXT accepts a single column — pass one column or use whereMatchRaw',
      );
    }

    const col = columns[0]!;
    if (mode === FullTextMode.Natural) {
      sqlHelper.addSqlSnippet('FREETEXT(');
      sqlHelper.addSqlSnippet(columnRef(config, col.tableNameOrAlias, col.columnName));
      sqlHelper.addSqlSnippet(', ');
      return;
    }

    sqlHelper.addSqlSnippet('CONTAINS(');
    sqlHelper.addSqlSnippet(columnRef(config, col.tableNameOrAlias, col.columnName));
    sqlHelper.addSqlSnippet(', ');
    return;
  }

  if (config.databaseType === DatabaseType.Sqlite) {
    if (columns.length !== 1) {
      throw new ParserError(
        area,
        'SQLite FTS MATCH accepts a single FTS column — pass one column or use whereMatchRaw',
      );
    }

    if (mode !== FullTextMode.Natural && mode !== FullTextMode.Boolean) {
      throw new ParserError(area, 'SQLite FTS only supports Natural/Boolean-style MATCH queries');
    }

    const col = columns[0]!;
    sqlHelper.addSqlSnippet(columnRef(config, col.tableNameOrAlias, col.columnName));
    sqlHelper.addSqlSnippet(' MATCH ');
    return;
  }

  throw new ParserError(area, `Full-text search is not supported on ${config.databaseType}`);
};

/** Emits the closing syntax after the bound full-text query value (MySQL `AGAINST (...)` only). */
export const emitFullTextValueSuffix = (
  sqlHelper: SqlHelper,
  config: Dialect,
  mode: FullTextMode,
): void => {
  if (config.databaseType === DatabaseType.Postgres || config.databaseType === DatabaseType.Mssql) {
    sqlHelper.addSqlSnippet(')');
    return;
  }

  if (config.databaseType === DatabaseType.Mysql) {
    if (mode === FullTextMode.Boolean || mode === FullTextMode.Phrase) {
      sqlHelper.addSqlSnippet(' IN BOOLEAN MODE)');
      return;
    }

    sqlHelper.addSqlSnippet(' IN NATURAL LANGUAGE MODE)');
  }
};
