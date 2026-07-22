import type { Dialect } from '../configuration/configuration';
import { DatabaseType } from '../enums/database-type';
import { FullTextMode } from '../enums/full-text-mode';
import type { ParserArea } from '../enums/parser-area';
import { quoteIdentifier } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper, sqlStringLiteral } from '../helpers/sql';

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
/**
 * Postgres has a distinct tsquery constructor per search mode, and all three are native.
 *
 * `Phrase` used to be refused outright as "not structured yet". It is structured: `phraseto_tsquery`
 * (9.6+) joins the terms with the `<->` distance operator, which is exactly a phrase match. Routing
 * it to `plainto_tsquery` instead would match the words in any order — the one thing a phrase search
 * exists to prevent.
 */
const postgresTsQueryFunction = (mode: FullTextMode): string => {
  if (mode === FullTextMode.Boolean) {
    return 'to_tsquery(';
  }
  if (mode === FullTextMode.Phrase) {
    return 'phraseto_tsquery(';
  }
  return 'plainto_tsquery(';
};

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
    if (columns.length === 1) {
      const col = columns[0]!;
      sqlHelper.addSqlSnippet('to_tsvector(');
      sqlHelper.addSqlSnippet(sqlStringLiteral('english'));
      sqlHelper.addSqlSnippet(', ');
      sqlHelper.addSqlSnippet(columnRef(config, col.tableNameOrAlias, col.columnName));
      sqlHelper.addSqlSnippet(') @@ ');
      sqlHelper.addSqlSnippet(postgresTsQueryFunction(mode));
      sqlHelper.addSqlSnippet(sqlStringLiteral('english'));
      sqlHelper.addSqlSnippet(', ');
      return;
    }

    sqlHelper.addSqlSnippet('to_tsvector(');
    sqlHelper.addSqlSnippet(sqlStringLiteral('english'));
    sqlHelper.addSqlSnippet(', ');
    sqlHelper.addSqlSnippet('concat(');
    columns.forEach((col, i) => {
      sqlHelper.addSqlSnippet(columnRef(config, col.tableNameOrAlias, col.columnName));
      if (i < columns.length - 1) {
        sqlHelper.addSqlSnippet(", ' ', ");
      }
    });
    sqlHelper.addSqlSnippet(')) @@ ');
    sqlHelper.addSqlSnippet(postgresTsQueryFunction(mode));
    sqlHelper.addSqlSnippet(sqlStringLiteral('english'));
    sqlHelper.addSqlSnippet(', ');
    return;
  }

  if (config.databaseType === DatabaseType.Mysql) {
    // MySQL can do phrase search, but only by quoting the search STRING — `AGAINST('"a b"' IN
    // BOOLEAN MODE)`. The query text is a bound parameter here, so the builder cannot add those
    // quotes without rewriting the caller's value, and it never did: `Phrase` emitted exactly the
    // same statement as `Boolean`, where the words match independently. Use whereMatchRaw, or quote
    // the phrase in the value you pass to a Boolean search.
    if (mode === FullTextMode.Phrase) {
      throw new ParserError(
        area,
        'MySQL expresses a phrase by quoting the search string, not by a mode — pass a quoted ' +
          'phrase to a Boolean search, or use whereMatchRaw',
      );
    }

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

    // Same as MySQL: MSSQL phrases live inside the CONTAINS search condition as `"a b"`, which is
    // part of the bound value rather than the statement. `Phrase` emitted plain CONTAINS, identical
    // to `Boolean`.
    if (mode === FullTextMode.Phrase) {
      throw new ParserError(
        area,
        'MSSQL expresses a phrase by quoting it inside the CONTAINS search condition, not by a ' +
          'mode — pass a quoted phrase to a Boolean search, or use whereMatchRaw',
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
    if (mode === FullTextMode.Boolean) {
      sqlHelper.addSqlSnippet(' IN BOOLEAN MODE)');
      return;
    }

    sqlHelper.addSqlSnippet(' IN NATURAL LANGUAGE MODE)');
  }
};
