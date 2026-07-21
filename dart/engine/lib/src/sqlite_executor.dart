/// The SQLite leg: a [DbExecutor] over the FFI `sqlite3` package.
library;

import 'package:sqlite3/sqlite3.dart' as sq;

import 'executor.dart';
import 'normalize.dart';

/// Executes prepared SQL against SQLite.
///
/// SQLEasy's SQLite dialect emits `?` placeholders, which bind positionally — the statement is
/// handed over verbatim. Unlike the other legs this one is in-process (FFI), so there is no
/// connection to open: it wraps a [sq.Database] the caller owns or that [openInMemory] creates.
class SqliteExecutor implements DbExecutor {
  SqliteExecutor(this._database, {bool ownsDatabase = true})
      : _ownsDatabase = ownsDatabase;

  /// Opens a private in-memory database. Handy for tests and for replaying a seed.
  factory SqliteExecutor.openInMemory() =>
      SqliteExecutor(sq.sqlite3.openInMemory());

  /// Opens a database file, creating it if absent.
  factory SqliteExecutor.openFile(String path) =>
      SqliteExecutor(sq.sqlite3.open(path));

  final sq.Database _database;
  final bool _ownsDatabase;

  /// The underlying handle, for setup a caller owns (applying a seed, `PRAGMA foreign_keys = ON`).
  sq.Database get database => _database;

  @override
  Future<QueryResult> run(PreparedSql prepared) async => _runSync(prepared);

  @override
  Future<List<QueryResult>> transaction(List<PreparedSql> statements) async {
    // SQLite is in-process and synchronous, so the transaction is a plain BEGIN/COMMIT around the
    // same one-prepared-statement-at-a-time loop the other legs use.
    _database.execute('BEGIN');
    try {
      final results = [for (final statement in statements) _runSync(statement)];
      _database.execute('COMMIT');
      return results;
    } catch (_) {
      _database.execute('ROLLBACK');
      rethrow;
    }
  }

  @override
  Future<ExplainEstimate> explain(PreparedSql prepared) async {
    final rows =
        _database.select('EXPLAIN QUERY PLAN ${prepared.sql}', prepared.params);
    final detail = rows.map((row) => row['detail']).join(' | ');
    return ExplainEstimate(
      // SQLite's planner exposes NO cost or row numbers — only the plan shape. Reporting a number
      // here would be inventing one.
      fullScan: detail.contains('SCAN'),
      plan: detail,
    );
  }

  @override
  Future<void> close() async {
    if (_ownsDatabase) _database.close();
  }

  QueryResult _runSync(PreparedSql prepared) {
    final statement = _database.prepare(prepared.sql);
    try {
      // `select` serves both shapes: a mutation simply yields no rows, and its affected count comes
      // from the connection's `updatedRows`.
      final result = statement.select(prepared.params);
      // No column kinds, on purpose. SQLite has NO date/time type at all — a temporal value is
      // stored as TEXT, INTEGER or REAL and the driver hands back exactly that, never a `DateTime`.
      // There is therefore nothing for the normalizer to identify and nothing it could rewrite
      // without guessing from a string's shape, which is the one thing it must never do: a `note`
      // column holding "2024-04-01" is text a user wrote. Passing no kinds says that explicitly
      // rather than leaving the question silently unanswered.
      final rows = normalizeRows(
        [for (final row in result) Map<String, Object?>.from(row)],
      );
      return QueryResult(
        rows: rows,
        rowCount: rows.isNotEmpty ? rows.length : _database.updatedRows,
      );
    } finally {
      statement.close();
    }
  }
}
