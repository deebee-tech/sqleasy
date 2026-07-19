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

    // MSSQL has no native null-safe operator, but `where(col, op, value)` compares a column to a
    // BOUND value whose null-ness is known here — which collapses the null-safe semantics to plain
    // SQL every MSSQL version supports (no EXCEPT subquery, no 2022+ feature).
    const valueIsNull = value === null || value === undefined;
    if (valueIsNull) {
      // `col IS DISTINCT FROM NULL` ⇔ `col IS NOT NULL`; `col IS NOT DISTINCT FROM NULL` ⇔ `col IS NULL`.
      sqlHelper.addSqlSnippet(columnSql);
      sqlHelper.addSqlSnippet(isNotDistinct ? ' IS NULL' : ' IS NOT NULL');
      return;
    }
    // A bound literal is never NULL, so: `col IS NOT DISTINCT FROM <lit>` ⇔ `col = <lit>`, and
    // `col IS DISTINCT FROM <lit>` ⇔ `(col <> <lit> OR col IS NULL)` (the OR restores null-safety —
    // a plain `<>` is UNKNOWN, never true, when col is NULL).
    if (isNotDistinct) {
      sqlHelper.addSqlSnippet(columnSql);
      sqlHelper.addSqlSnippet(' = ');
      sqlHelper.addDynamicValue(value);
      return;
    }
    sqlHelper.addSqlSnippet('(');
    sqlHelper.addSqlSnippet(columnSql);
    sqlHelper.addSqlSnippet(' <> ');
    sqlHelper.addDynamicValue(value);
    sqlHelper.addSqlSnippet(' OR ');
    sqlHelper.addSqlSnippet(columnSql);
    sqlHelper.addSqlSnippet(' IS NULL)');
    return;
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

  if (
    whereOperator === WhereOperator.Regex ||
    whereOperator === WhereOperator.NotRegex ||
    whereOperator === WhereOperator.Iregex ||
    whereOperator === WhereOperator.NotIregex
  ) {
    const negate =
      whereOperator === WhereOperator.NotRegex || whereOperator === WhereOperator.NotIregex;
    const insensitive =
      whereOperator === WhereOperator.Iregex || whereOperator === WhereOperator.NotIregex;

    // Postgres: ~ / !~ (case-sensitive), ~* / !~* (case-insensitive).
    if (config.databaseType === DatabaseType.Postgres) {
      sqlHelper.addSqlSnippet(columnSql);
      sqlHelper.addSqlSnippet(insensitive ? (negate ? ' !~* ' : ' ~* ') : negate ? ' !~ ' : ' ~ ');
      sqlHelper.addDynamicValue(value);
      return;
    }

    // MySQL: REGEXP / NOT REGEXP. Case sensitivity is COLLATION-driven (the default utf8mb4_*_ci is
    // case-insensitive), not operator-driven, so Iregex emits the same as Regex here.
    if (config.databaseType === DatabaseType.Mysql) {
      sqlHelper.addSqlSnippet(columnSql);
      sqlHelper.addSqlSnippet(negate ? ' NOT REGEXP ' : ' REGEXP ');
      sqlHelper.addDynamicValue(value);
      return;
    }

    // SQLite's REGEXP is only a hook for an app-registered function (stock SQLite has none), and
    // MSSQL has no regex engine before SQL Server 2025 — refuse rather than emit SQL that can't run.
    throw new ParserError(
      area,
      `${config.databaseType === DatabaseType.Sqlite ? 'SQLite' : 'MSSQL'} has no built-in regular-expression operator`,
    );
  }

  if (
    whereOperator === WhereOperator.Contains ||
    whereOperator === WhereOperator.NotContains ||
    whereOperator === WhereOperator.StartsWith ||
    whereOperator === WhereOperator.EndsWith
  ) {
    // Escape the LIKE metacharacters in the (literal) value so a `%`/`_` in the search text matches
    // literally, not as a wildcard. Backslash is the escape char; MSSQL LIKE additionally treats `[`
    // as a metacharacter, so it is escaped there too.
    let escaped = String(value)
      .replaceAll('\\', '\\\\')
      .replaceAll('%', '\\%')
      .replaceAll('_', '\\_');
    if (config.databaseType === DatabaseType.Mssql) escaped = escaped.replaceAll('[', '\\[');

    const pattern =
      whereOperator === WhereOperator.StartsWith
        ? `${escaped}%`
        : whereOperator === WhereOperator.EndsWith
          ? `%${escaped}`
          : `%${escaped}%`;

    // MySQL's string-literal parser turns `\\` into `\`, so the ESCAPE-char literal itself must be
    // doubled there; pg/sqlite/mssql use standard string literals, where `'\'` is a single backslash.
    const escapeLiteral = config.databaseType === DatabaseType.Mysql ? "'\\\\'" : "'\\'";

    sqlHelper.addSqlSnippet(columnSql);
    sqlHelper.addSqlSnippet(whereOperator === WhereOperator.NotContains ? ' NOT LIKE ' : ' LIKE ');
    sqlHelper.addDynamicValue(pattern);
    sqlHelper.addSqlSnippet(' ESCAPE ');
    sqlHelper.addSqlSnippet(escapeLiteral);
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
