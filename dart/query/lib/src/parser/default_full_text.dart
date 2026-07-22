import '../configuration.dart';
import '../enums.dart';
import '../errors/parser_error.dart';
import '../identifier.dart';
import '../sql_helper.dart';
import '../state.dart';

String _columnRef(Dialect config, FullTextColumnRef column) =>
    '${quoteIdentifier(column.tableNameOrAlias, config.identifierDelimiters)}.'
    '${quoteIdentifier(column.columnName, config.identifierDelimiters)}';

/// Emits a dialect-specific full-text predicate for [columns] and a bound query term.
/// The query value is appended by the caller via [SqlHelper.addDynamicValue].
/// Postgres has a distinct tsquery constructor per search mode, and all three are native.
///
/// `phrase` used to be refused outright as "not structured yet". It is structured:
/// `phraseto_tsquery` (9.6+) joins the terms with the `<->` distance operator, which is exactly a
/// phrase match. Routing it to `plainto_tsquery` would match the words in any order — the one thing
/// a phrase search exists to prevent.
String _postgresTsQueryFunction(FullTextMode mode) {
  if (mode == FullTextMode.boolean) {
    return 'to_tsquery(';
  }
  if (mode == FullTextMode.phrase) {
    return 'phraseto_tsquery(';
  }
  return 'plainto_tsquery(';
}

void emitFullTextPredicate(
  SqlHelper sqlHelper,
  Dialect config,
  List<FullTextColumnRef> columns,
  FullTextMode mode,
  ParserArea area,
) {
  if (columns.isEmpty) {
    throw ParserError(area, 'Full-text search requires at least one column');
  }

  if (config.databaseType == DatabaseType.postgres) {
    if (columns.length == 1) {
      final col = columns.first;
      sqlHelper.addSqlSnippet('to_tsvector(');
      sqlHelper.addSqlSnippet(sqlStringLiteral('english'));
      sqlHelper.addSqlSnippet(', ');
      sqlHelper.addSqlSnippet(_columnRef(config, col));
      sqlHelper.addSqlSnippet(') @@ ');
      sqlHelper.addSqlSnippet(
        _postgresTsQueryFunction(mode),
      );
      sqlHelper.addSqlSnippet(sqlStringLiteral('english'));
      sqlHelper.addSqlSnippet(', ');
      return;
    }

    // MULTI-COLUMN IS REFUSED, and Postgres was the last dialect where it was not.
    //
    // This used to fabricate the document with `concat(a, ' ', b)`. That IS an idiomatic Postgres
    // expression, but it is the builder inventing the document rather than handing the columns to
    // the engine — and the same call means something different everywhere else: MySQL requires ONE
    // composite FULLTEXT index over exactly those columns and ranks across them, while MSSQL and
    // SQLite refuse the multi-column form outright. One method, four meanings, one of them
    // manufactured. It also had ZERO corpus coverage, which is how it survived unnoticed.
    //
    // A caller who genuinely wants a concatenated document can still say so explicitly with
    // `whereMatchRaw`, where the synthesis is theirs and visible.
    throw ParserError(
      area,
      'Postgres full-text matches ONE tsvector — pass a single column, index a generated '
      'tsvector column, or build the document yourself with whereMatchRaw',
    );
  }

  if (config.databaseType == DatabaseType.mysql) {
    // MySQL expresses a phrase by quoting the search STRING, which lives in the bound value rather
    // than the statement — so `phrase` emitted exactly the same SQL as `boolean`.
    if (mode == FullTextMode.phrase) {
      throw ParserError(
        area,
        'MySQL expresses a phrase by quoting the search string, not by a mode — pass a quoted '
        'phrase to a Boolean search, or use whereMatchRaw',
      );
    }

    sqlHelper.addSqlSnippet('MATCH (');
    for (var i = 0; i < columns.length; i++) {
      sqlHelper.addSqlSnippet(_columnRef(config, columns[i]));
      if (i < columns.length - 1) {
        sqlHelper.addSqlSnippet(', ');
      }
    }
    sqlHelper.addSqlSnippet(') AGAINST (');
    return;
  }

  if (config.databaseType == DatabaseType.mssql) {
    if (columns.length != 1) {
      throw ParserError(
        area,
        'MSSQL CONTAINS/FREETEXT accepts a single column — pass one column or use whereMatchRaw',
      );
    }

    // Same as MySQL: MSSQL phrases live inside the CONTAINS search condition as `"a b"`, which is
    // part of the bound value rather than the statement. `phrase` emitted plain CONTAINS, identical
    // to `boolean`.
    if (mode == FullTextMode.phrase) {
      throw ParserError(
        area,
        'MSSQL expresses a phrase by quoting it inside the CONTAINS search condition, not by a '
        'mode — pass a quoted phrase to a Boolean search, or use whereMatchRaw',
      );
    }

    final col = columns.first;
    if (mode == FullTextMode.natural) {
      sqlHelper.addSqlSnippet('FREETEXT(');
      sqlHelper.addSqlSnippet(_columnRef(config, col));
      sqlHelper.addSqlSnippet(', ');
      return;
    }

    sqlHelper.addSqlSnippet('CONTAINS(');
    sqlHelper.addSqlSnippet(_columnRef(config, col));
    sqlHelper.addSqlSnippet(', ');
    return;
  }

  if (config.databaseType == DatabaseType.sqlite) {
    if (columns.length != 1) {
      throw ParserError(
        area,
        'SQLite FTS MATCH accepts a single FTS column — pass one column or use whereMatchRaw',
      );
    }

    // SQLite's FTS5 `MATCH` takes ONE query string and has no mode selector at all: the operators
    // live inside the query text. So every FullTextMode produced byte-identical SQL — Natural and
    // Boolean differed in the corpus by the mode argument alone and emitted the same statement, which
    // means the caller's choice was silently discarded. That is precisely the defect MySQL's
    // `FullTextMode.phrase` was fixed by REFUSING (0ca6e4c), and it is the same fix here: only the
    // mode SQLite can actually honour is accepted, and the rest say so.
    //
    // `natural` is that mode — a bare FTS5 query string, which is what MATCH already does. Anything
    // else asks for a distinction the engine cannot make.
    if (mode != FullTextMode.natural) {
      throw ParserError(
        area,
        'SQLite FTS MATCH has no mode selector — its operators live inside the query string, so '
        'FullTextMode.${mode.wire} cannot change the statement. Use '
        'FullTextMode.Natural and write the FTS5 operators into the query, or whereMatchRaw.',
      );
    }

    final col = columns.first;
    sqlHelper.addSqlSnippet(_columnRef(config, col));
    sqlHelper.addSqlSnippet(' MATCH ');
    return;
  }

  throw ParserError(
      area, 'Full-text search is not supported on ${config.databaseType}');
}

/// Emits the closing syntax after the bound full-text query value (MySQL `AGAINST (...)` only).
void emitFullTextValueSuffix(
  SqlHelper sqlHelper,
  Dialect config,
  FullTextMode mode,
) {
  if (config.databaseType == DatabaseType.postgres ||
      config.databaseType == DatabaseType.mssql) {
    sqlHelper.addSqlSnippet(')');
    return;
  }

  if (config.databaseType == DatabaseType.mysql) {
    if (mode == FullTextMode.boolean) {
      sqlHelper.addSqlSnippet(' IN BOOLEAN MODE)');
      return;
    }

    sqlHelper.addSqlSnippet(' IN NATURAL LANGUAGE MODE)');
  }
}
