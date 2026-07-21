/// Core, driver-agnostic types for the SQLEasy engine — the Dart port of the TypeScript
/// `@deebeetech/sqleasy-engine` entry point. Importing this pulls in NO database driver.
library;

/// A single result-set row, keyed by column name.
typedef Row = Map<String, Object?>;

/// A prepared statement and its ordered bound parameters.
///
/// Structural on purpose: the engine accepts any `(sql, params)` and never depends on a particular
/// SQL builder. SQLEasy's `parsePrepared()` / `preparedStatements()` produce this shape, but so can
/// hand-written SQL or another codegen tool. [params] is empty when the SQL carries its own values
/// (e.g. an MSSQL `sp_executesql` batch with inlined assignments).
class PreparedSql {
  const PreparedSql(this.sql, [this.params = const []]);

  final String sql;
  final List<Object?> params;

  @override
  String toString() => 'PreparedSql($sql, $params)';
}

/// The outcome of executing one statement.
class QueryResult {
  const QueryResult({required this.rows, required this.rowCount});

  final List<Row> rows;

  /// Rows returned (SELECT) or affected (INSERT/UPDATE/DELETE).
  final int rowCount;

  @override
  String toString() => 'QueryResult(rowCount: $rowCount, rows: $rows)';
}

/// The planner's estimate for a statement, obtained WITHOUT executing it.
///
/// [cost] is in the dialect's own units and is NOT comparable across dialects — gate on [rows] or
/// [fullScan] when you need one rule for all four. Best-effort: a backend supplies only what its
/// planner exposes (SQLite has no numbers at all, only the plan shape).
class ExplainEstimate {
  const ExplainEstimate({
    required this.fullScan,
    required this.plan,
    this.cost,
    this.rows,
  });

  /// Planner cost in the dialect's own units. Null when the backend reports none (SQLite).
  final double? cost;

  /// Estimated rows the plan produces. Null when the backend reports none (SQLite).
  final double? rows;

  /// The plan reads a whole table instead of seeking an index — the portable "this will hurt" signal.
  final bool fullScan;

  /// A short raw-plan excerpt, for display and debugging.
  final String plan;
}

/// Executes prepared SQL against one database.
///
/// Obtain one from a dialect implementation. Pick the executor whose dialect matches the SQL you
/// built, so placeholders and quoting line up — the engine runs what it is given verbatim and does
/// NOT rewrite dialects.
abstract interface class DbExecutor {
  /// Runs one prepared statement and returns its rows.
  Future<QueryResult> run(PreparedSql prepared);

  /// Runs several prepared statements as ONE atomic transaction: commit on success, roll back on any
  /// error. Statements run in order, each as its own prepared statement — NEVER concatenated into one
  /// string, which would misbind because placeholder numbering restarts per statement — and each
  /// statement's result is returned in the same order.
  Future<List<QueryResult>> transaction(List<PreparedSql> statements);

  /// Asks the planner what a statement would cost WITHOUT running it. Best-effort per backend.
  /// Expects a single statement. Bound params are applied so selectivity reaches the planner.
  Future<ExplainEstimate> explain(PreparedSql prepared);

  /// Releases resources this executor owns.
  Future<void> close();
}
