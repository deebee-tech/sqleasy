import type { Dialect } from '../configuration/configuration';
import { DatabaseType } from '../enums/database-type';
import { JsonExtractMode } from '../enums/json-extract-mode';
import { ParserArea } from '../enums/parser-area';
import { qualifiedColumn } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper, sqlStringLiteral } from '../helpers/sql';

const columnRef = (config: Dialect, tableNameOrAlias: string, columnName: string): string =>
  qualifiedColumn(tableNameOrAlias, columnName, config.identifierDelimiters);

/**
 * The raw escape hatch that actually exists for the clause a refusal fired in.
 *
 * The SQLite refusal below used to name `selectJsonRaw`, a method that has never existed anywhere
 * in this library — and the wrong name had been copied into the Dart port and BOTH contract
 * manifests, so the contract itself asserted it. A refusal that points at a method the caller
 * cannot call is worse than no advice, and it is exactly the same failure as an emulation: the
 * library saying something untrue about its own surface. These three are real, and which one is
 * right depends on the clause.
 */
const rawHatchFor = (area: ParserArea): string => {
  if (area === ParserArea.Where) return 'whereRaw';
  if (area === ParserArea.Having) return 'havingRaw';
  return 'selectRaw';
};

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
    // `->` / `->>` take a KEY or an array index — NOT a JSONPath. Given SQLEasy's `$.email`, they
    // looked up a key literally named "$.email", which does not exist, so the expression returned
    // NULL and the predicate silently never matched. No error, ever. Measured:
    //
    //   '{"email":"a@b.c"}'::jsonb ->> '$.email'  ->  NULL
    //   '{"email":"a@b.c"}'::jsonb ->> 'email'    ->  a@b.c
    //
    // `jsonb_path_query_first` is Postgres's own JSONPath entry point and takes the path VERBATIM,
    // so no path translation (and no approximation) is needed. `#>> '{}'` unwraps the jsonb result
    // to text for Text mode — the documented idiom, and the counterpart to MySQL's JSON_UNQUOTE.
    // Requires Postgres 12+, the same shape of floor as MySQL 8.0.4 for REGEXP_LIKE.
    sqlHelper.addSqlSnippet('jsonb_path_query_first(');
    sqlHelper.addSqlSnippet(col);
    sqlHelper.addSqlSnippet(', ');
    sqlHelper.addSqlSnippet(sqlStringLiteral(path));
    sqlHelper.addSqlSnippet(mode === JsonExtractMode.Text ? ") #>> '{}'" : ')');
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
        `SQLite json_extract always returns text — use JsonExtractMode.Text or ${rawHatchFor(area)}`,
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
