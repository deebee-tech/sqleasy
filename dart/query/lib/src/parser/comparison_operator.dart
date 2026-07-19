import '../configuration.dart';
import '../enums.dart';
import '../errors/parser_error.dart';
import '../sql_helper.dart';

/// Emits `<column> <operator> <value>` for a comparison predicate — the shared core of WHERE's
/// and HAVING's `col op value` term, so the two clauses can never drift on operator semantics.
///
/// [columnSql] must already be the fully quoted/qualified column reference (e.g. `"u"."id"`).
/// [area] selects the [ParserError] area for an unsupported operator, so the message still says
/// `Where:` or `Having:` as appropriate.
void emitComparisonPredicate(
  SqlHelper sqlHelper,
  Dialect config,
  String columnSql,
  WhereOperator whereOperator,
  Object? value,
  ParserArea area,
) {
  // `col = NULL` is never true under SQL three-valued logic. Emit IS NULL / IS NOT NULL so
  // callers who pass null get a predicate that can match rows.
  if ((whereOperator == WhereOperator.equals ||
          whereOperator == WhereOperator.notEquals) &&
      value == null) {
    sqlHelper.addSqlSnippet(columnSql);
    sqlHelper.addSqlSnippet(' ');
    sqlHelper.addSqlSnippet(
        whereOperator == WhereOperator.equals ? 'IS NULL' : 'IS NOT NULL');
    return;
  }

  if (whereOperator == WhereOperator.isDistinctFrom ||
      whereOperator == WhereOperator.isNotDistinctFrom) {
    final isNotDistinct = whereOperator == WhereOperator.isNotDistinctFrom;

    if (config.databaseType == DatabaseType.postgres ||
        config.databaseType == DatabaseType.sqlite) {
      sqlHelper.addSqlSnippet(columnSql);
      sqlHelper.addSqlSnippet(
          isNotDistinct ? ' IS NOT DISTINCT FROM ' : ' IS DISTINCT FROM ');
      sqlHelper.addDynamicValue(value);
      return;
    }

    if (config.databaseType == DatabaseType.mysql) {
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
    // SQL every MSSQL version supports.
    if (value == null) {
      // `col IS DISTINCT FROM NULL` ⇔ `col IS NOT NULL`; `... IS NOT DISTINCT FROM NULL` ⇔ `col IS NULL`.
      sqlHelper.addSqlSnippet(columnSql);
      sqlHelper.addSqlSnippet(isNotDistinct ? ' IS NULL' : ' IS NOT NULL');
      return;
    }
    // A bound literal is never NULL, so: `col IS NOT DISTINCT FROM <lit>` ⇔ `col = <lit>`, and
    // `col IS DISTINCT FROM <lit>` ⇔ `(col <> <lit> OR col IS NULL)` (the OR restores null-safety).
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

  if (whereOperator == WhereOperator.ilike ||
      whereOperator == WhereOperator.notIlike) {
    final negate = whereOperator == WhereOperator.notIlike;

    // Postgres has native ILIKE. Every other dialect here has no case-insensitive LIKE
    // operator, so it is emulated by lower-casing both sides — the standard portable rewrite.
    if (config.databaseType == DatabaseType.postgres) {
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

  if (whereOperator == WhereOperator.regex ||
      whereOperator == WhereOperator.notRegex ||
      whereOperator == WhereOperator.iregex ||
      whereOperator == WhereOperator.notIregex) {
    final negate = whereOperator == WhereOperator.notRegex ||
        whereOperator == WhereOperator.notIregex;
    final insensitive = whereOperator == WhereOperator.iregex ||
        whereOperator == WhereOperator.notIregex;

    // Postgres: ~ / !~ (case-sensitive), ~* / !~* (case-insensitive).
    if (config.databaseType == DatabaseType.postgres) {
      sqlHelper.addSqlSnippet(columnSql);
      sqlHelper.addSqlSnippet(insensitive
          ? (negate ? ' !~* ' : ' ~* ')
          : (negate ? ' !~ ' : ' ~ '));
      sqlHelper.addDynamicValue(value);
      return;
    }

    // MySQL: REGEXP / NOT REGEXP. Case sensitivity is COLLATION-driven (the default utf8mb4_*_ci is
    // case-insensitive), not operator-driven, so iregex emits the same as regex here.
    if (config.databaseType == DatabaseType.mysql) {
      sqlHelper.addSqlSnippet(columnSql);
      sqlHelper.addSqlSnippet(negate ? ' NOT REGEXP ' : ' REGEXP ');
      sqlHelper.addDynamicValue(value);
      return;
    }

    // SQLite's REGEXP is only a hook for an app-registered function (stock SQLite has none), and
    // MSSQL has no regex engine before SQL Server 2025 — refuse rather than emit SQL that can't run.
    throw ParserError(
      area,
      '${config.databaseType == DatabaseType.sqlite ? 'SQLite' : 'MSSQL'} has no built-in regular-expression operator',
    );
  }

  if (whereOperator == WhereOperator.contains ||
      whereOperator == WhereOperator.notContains ||
      whereOperator == WhereOperator.startsWith ||
      whereOperator == WhereOperator.endsWith) {
    // Escape the LIKE metacharacters in the (literal) value so a `%`/`_` in the search text matches
    // literally, not as a wildcard. Backslash is the escape char; MSSQL LIKE additionally treats `[`
    // as a metacharacter, so it is escaped there too.
    var escaped = value
        .toString()
        .replaceAll('\\', '\\\\')
        .replaceAll('%', '\\%')
        .replaceAll('_', '\\_');
    if (config.databaseType == DatabaseType.mssql) {
      escaped = escaped.replaceAll('[', '\\[');
    }

    final pattern = whereOperator == WhereOperator.startsWith
        ? '$escaped%'
        : whereOperator == WhereOperator.endsWith
            ? '%$escaped'
            : '%$escaped%';

    // MySQL's string-literal parser turns `\\` into `\`, so the ESCAPE-char literal itself must be
    // doubled there; pg/sqlite/mssql use standard string literals, where `'\'` is a single backslash.
    final escapeLiteral =
        config.databaseType == DatabaseType.mysql ? "'\\\\'" : "'\\'";

    sqlHelper.addSqlSnippet(columnSql);
    sqlHelper.addSqlSnippet(
        whereOperator == WhereOperator.notContains ? ' NOT LIKE ' : ' LIKE ');
    sqlHelper.addDynamicValue(pattern);
    sqlHelper.addSqlSnippet(' ESCAPE ');
    sqlHelper.addSqlSnippet(escapeLiteral);
    return;
  }

  sqlHelper.addSqlSnippet(columnSql);
  sqlHelper.addSqlSnippet(' ');

  switch (whereOperator) {
    case WhereOperator.equals:
      sqlHelper.addSqlSnippet('=');
    case WhereOperator.notEquals:
      sqlHelper.addSqlSnippet('<>');
    case WhereOperator.greaterThan:
      sqlHelper.addSqlSnippet('>');
    case WhereOperator.greaterThanOrEquals:
      sqlHelper.addSqlSnippet('>=');
    case WhereOperator.lessThan:
      sqlHelper.addSqlSnippet('<');
    case WhereOperator.lessThanOrEquals:
      sqlHelper.addSqlSnippet('<=');
    case WhereOperator.like:
      sqlHelper.addSqlSnippet('LIKE');
    case WhereOperator.notLike:
      sqlHelper.addSqlSnippet('NOT LIKE');
    default:
      throw ParserError(
        area,
        'Unsupported ${area.value.toUpperCase()} operator: ${whereOperator.wire}',
      );
  }

  sqlHelper.addSqlSnippet(' ');
  sqlHelper.addDynamicValue(value);
}
