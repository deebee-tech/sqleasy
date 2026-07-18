import type { Dialect } from '../configuration/configuration';
import { DatabaseType } from '../enums/database-type';
import type { ParserArea } from '../enums/parser-area';
import { WhereOperator } from '../enums/where-operator';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';

/**
 * Emits `<column> <operator> <value>` for a comparison predicate — the shared core of WHERE's
 * and HAVING's `col op value` term, so the two clauses can never drift on operator semantics.
 *
 * `columnSql` must already be the fully quoted/qualified column reference (e.g. `"u"."id"`).
 * `area` selects the {@link ParserError} area for an unsupported operator, so the message still
 * says `Where:` or `Having:` as appropriate.
 */
export const emitComparisonPredicate = (
  sqlHelper: SqlHelper,
  config: Dialect,
  columnSql: string,
  whereOperator: WhereOperator,
  value: any,
  area: ParserArea,
): void => {
  // `col = NULL` is never true under SQL three-valued logic. Emit IS NULL / IS NOT NULL so
  // callers who pass null get a predicate that can match rows.
  if (
    (whereOperator === WhereOperator.Equals || whereOperator === WhereOperator.NotEquals) &&
    (value === null || value === undefined)
  ) {
    sqlHelper.addSqlSnippet(columnSql);
    sqlHelper.addSqlSnippet(' ');
    sqlHelper.addSqlSnippet(whereOperator === WhereOperator.Equals ? 'IS NULL' : 'IS NOT NULL');
    return;
  }

  if (
    whereOperator === WhereOperator.IsDistinctFrom ||
    whereOperator === WhereOperator.IsNotDistinctFrom
  ) {
    const isNotDistinct = whereOperator === WhereOperator.IsNotDistinctFrom;

    // Postgres/SQLite have the standard operator natively — null-safe both ways, no rewrite needed.
    if (
      config.databaseType === DatabaseType.Postgres ||
      config.databaseType === DatabaseType.Sqlite
    ) {
      sqlHelper.addSqlSnippet(columnSql);
      sqlHelper.addSqlSnippet(isNotDistinct ? ' IS NOT DISTINCT FROM ' : ' IS DISTINCT FROM ');
      sqlHelper.addDynamicValue(value);
      return;
    }

    // MySQL has no `IS [NOT] DISTINCT FROM`, but `<=>` *is* "IS NOT DISTINCT FROM" by
    // definition (null-safe equality) — negate it with `NOT (...)` for the DISTINCT case.
    if (config.databaseType === DatabaseType.Mysql) {
      if (isNotDistinct) {
        sqlHelper.addSqlSnippet(columnSql);
        sqlHelper.addSqlSnippet(' <=> ');
        sqlHelper.addDynamicValue(value);
        return;
      }

      sqlHelper.addSqlSnippet('NOT (');
      sqlHelper.addSqlSnippet(columnSql);
      sqlHelper.addSqlSnippet(' <=> ');
      sqlHelper.addDynamicValue(value);
      sqlHelper.addSqlSnippet(')');
      return;
    }

    // MSSQL has no null-safe comparison operator at all (pre-2022 T-SQL) — refuse rather than
    // silently emitting `=`/`<>`, which would diverge from the requested NULL-safe semantics.
    throw new ParserError(
      area,
      'MSSQL does not support IS DISTINCT FROM / IS NOT DISTINCT FROM — write the equivalent CASE expression as raw SQL',
    );
  }

  if (whereOperator === WhereOperator.Ilike || whereOperator === WhereOperator.NotIlike) {
    const negate = whereOperator === WhereOperator.NotIlike;

    // Postgres has native ILIKE. Every other dialect here has no case-insensitive LIKE
    // operator, so it is emulated by lower-casing both sides — the standard portable rewrite.
    if (config.databaseType === DatabaseType.Postgres) {
      sqlHelper.addSqlSnippet(columnSql);
      sqlHelper.addSqlSnippet(negate ? ' NOT ILIKE ' : ' ILIKE ');
      sqlHelper.addDynamicValue(value);
      return;
    }

    sqlHelper.addSqlSnippet('LOWER(');
    sqlHelper.addSqlSnippet(columnSql);
    sqlHelper.addSqlSnippet(negate ? ') NOT LIKE LOWER(' : ') LIKE LOWER(');
    sqlHelper.addDynamicValue(value);
    sqlHelper.addSqlSnippet(')');
    return;
  }

  sqlHelper.addSqlSnippet(columnSql);
  sqlHelper.addSqlSnippet(' ');

  switch (whereOperator) {
    case WhereOperator.Equals:
      sqlHelper.addSqlSnippet('=');
      break;
    case WhereOperator.NotEquals:
      sqlHelper.addSqlSnippet('<>');
      break;
    case WhereOperator.GreaterThan:
      sqlHelper.addSqlSnippet('>');
      break;
    case WhereOperator.GreaterThanOrEquals:
      sqlHelper.addSqlSnippet('>=');
      break;
    case WhereOperator.LessThan:
      sqlHelper.addSqlSnippet('<');
      break;
    case WhereOperator.LessThanOrEquals:
      sqlHelper.addSqlSnippet('<=');
      break;
    case WhereOperator.Like:
      sqlHelper.addSqlSnippet('LIKE');
      break;
    case WhereOperator.NotLike:
      sqlHelper.addSqlSnippet('NOT LIKE');
      break;
    default:
      throw new ParserError(area, `Unsupported ${area.toUpperCase()} operator: ${whereOperator}`);
  }

  sqlHelper.addSqlSnippet(' ');
  sqlHelper.addDynamicValue(value);
};
