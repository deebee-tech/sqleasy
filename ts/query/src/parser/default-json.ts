import type { Dialect } from '../configuration/configuration';
import { DatabaseType } from '../enums/database-type';
import { JsonExtractMode } from '../enums/json-extract-mode';
import type { ParserArea } from '../enums/parser-area';
import { quoteIdentifier } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper, sqlStringLiteral } from '../helpers/sql';

const columnRef = (config: Dialect, tableNameOrAlias: string, columnName: string): string =>
  quoteIdentifier(tableNameOrAlias, config.identifierDelimiters) +
  '.' +
  quoteIdentifier(columnName, config.identifierDelimiters);

/**
 * Emits a dialect-specific JSON path extraction expression for `column` at `path`.
 * `path` is a single Postgres key segment (`'email'`) or a JSON path (`'$.email'`) on other dialects.
 */
export const emitJsonExtractExpression = (
  sqlHelper: SqlHelper,
  config: Dialect,
  tableNameOrAlias: string,
  columnName: string,
  path: string,
  mode: JsonExtractMode,
  area: ParserArea,
): void => {
  const col = columnRef(config, tableNameOrAlias, columnName);

  if (config.databaseType === DatabaseType.Postgres) {
    sqlHelper.addSqlSnippet(col);
    sqlHelper.addSqlSnippet(mode === JsonExtractMode.Text ? '->>' : '->');
    sqlHelper.addSqlSnippet(sqlStringLiteral(path));
    return;
  }

  if (config.databaseType === DatabaseType.Mysql) {
    if (mode === JsonExtractMode.Text) {
      sqlHelper.addSqlSnippet('JSON_UNQUOTE(JSON_EXTRACT(');
      sqlHelper.addSqlSnippet(col);
      sqlHelper.addSqlSnippet(', ');
      sqlHelper.addSqlSnippet(sqlStringLiteral(path));
      sqlHelper.addSqlSnippet('))');
      return;
    }

    sqlHelper.addSqlSnippet('JSON_EXTRACT(');
    sqlHelper.addSqlSnippet(col);
    sqlHelper.addSqlSnippet(', ');
    sqlHelper.addSqlSnippet(sqlStringLiteral(path));
    sqlHelper.addSqlSnippet(')');
    return;
  }

  if (config.databaseType === DatabaseType.Mssql) {
    if (mode === JsonExtractMode.Object) {
      sqlHelper.addSqlSnippet('JSON_QUERY(');
      sqlHelper.addSqlSnippet(col);
      sqlHelper.addSqlSnippet(', ');
      sqlHelper.addSqlSnippet(sqlStringLiteral(path));
      sqlHelper.addSqlSnippet(')');
      return;
    }

    sqlHelper.addSqlSnippet('JSON_VALUE(');
    sqlHelper.addSqlSnippet(col);
    sqlHelper.addSqlSnippet(', ');
    sqlHelper.addSqlSnippet(sqlStringLiteral(path));
    sqlHelper.addSqlSnippet(')');
    return;
  }

  if (config.databaseType === DatabaseType.Sqlite) {
    if (mode === JsonExtractMode.Object) {
      throw new ParserError(
        area,
        'SQLite json_extract always returns text — use JsonExtractMode.Text or selectJsonRaw',
      );
    }

    sqlHelper.addSqlSnippet('json_extract(');
    sqlHelper.addSqlSnippet(col);
    sqlHelper.addSqlSnippet(', ');
    sqlHelper.addSqlSnippet(sqlStringLiteral(path));
    sqlHelper.addSqlSnippet(')');
    return;
  }

  throw new ParserError(area, `JSON extract is not supported on ${config.databaseType}`);
};

/** Emits `column @> value` / `JSON_CONTAINS` / equivalent containment predicate (lhs only). */
export const emitJsonContainsExpression = (
  sqlHelper: SqlHelper,
  config: Dialect,
  tableNameOrAlias: string,
  columnName: string,
  area: ParserArea,
): void => {
  const col = columnRef(config, tableNameOrAlias, columnName);

  if (config.databaseType === DatabaseType.Postgres) {
    sqlHelper.addSqlSnippet(col);
    sqlHelper.addSqlSnippet(' @> ');
    return;
  }

  if (config.databaseType === DatabaseType.Mysql) {
    sqlHelper.addSqlSnippet('JSON_CONTAINS(');
    sqlHelper.addSqlSnippet(col);
    sqlHelper.addSqlSnippet(', ');
    return;
  }

  if (config.databaseType === DatabaseType.Mssql) {
    throw new ParserError(
      area,
      'MSSQL has no JSON containment operator — use whereJsonExtract or whereRaw with OPENJSON/JSON_QUERY',
    );
  }

  throw new ParserError(
    area,
    'SQLite does not support JSON containment — use whereJsonExtract or whereRaw',
  );
};
