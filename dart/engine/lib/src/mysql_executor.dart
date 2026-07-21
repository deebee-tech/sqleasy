/// The MySQL leg: a [DbExecutor] over the pure-Dart `mysql_client_plus` driver.
library;

import 'dart:convert';

import 'package:mysql_client_plus/mysql_client_plus.dart' as my;

import 'executor.dart';
import 'normalize.dart';

/// Connection details for [MysqlExecutor.open].
class MysqlConnectionOptions {
  const MysqlConnectionOptions({
    required this.host,
    required this.database,
    required this.username,
    required this.password,
    this.port = 3306,
    this.useSsl = true,
    this.allowInvalidCertificate = false,
  });

  final String host;
  final int port;
  final String database;
  final String username;
  final String password;

  /// TLS, and it defaults to ON for a reason: MySQL 8.4's default auth plugin is
  /// `caching_sha2_password`, and the driver refuses to send those credentials over a plaintext
  /// socket ("supported only with secure connections"). Turning this off only works against a server
  /// still using `mysql_native_password`.
  final bool useSsl;

  /// Accept a certificate that does not validate — for a container or a dev server presenting the
  /// self-signed cert MySQL generates at initialization. NEVER enable this against a real server:
  /// it is exactly the check that stops a man in the middle.
  final bool allowInvalidCertificate;
}

/// Executes prepared SQL against MySQL.
///
/// SQLEasy's MySQL dialect emits `?` placeholders, which are the protocol's own POSITIONAL form, so
/// every statement goes through the driver's prepared-statement path (`prepare` + positional
/// `execute`) rather than its named-parameter convenience API. The statement is handed over verbatim.
class MysqlExecutor implements DbExecutor {
  MysqlExecutor._(this._connection);

  final my.MySQLConnection _connection;

  /// Opens a connection. The caller owns it and must [close] it.
  static Future<MysqlExecutor> open(MysqlConnectionOptions options) async {
    final connection = await my.MySQLConnection.createConnection(
      host: options.host,
      port: options.port,
      userName: options.username,
      password: options.password,
      databaseName: options.database,
      secure: options.useSsl,
      onBadCertificate: options.allowInvalidCertificate ? (_) => true : null,
    );
    await connection.connect();
    return MysqlExecutor._(connection);
  }

  @override
  Future<QueryResult> run(PreparedSql prepared) =>
      _runOn(_connection, prepared);

  @override
  Future<List<QueryResult>> transaction(List<PreparedSql> statements) {
    // Each statement is its own prepared statement, run in order — never concatenated.
    return _connection.transactional((session) async {
      final results = <QueryResult>[];
      for (final statement in statements) {
        results.add(await _runOn(session, statement));
      }
      return results;
    });
  }

  @override
  Future<ExplainEstimate> explain(PreparedSql prepared) async {
    final result = await _runOn(
      _connection,
      PreparedSql('EXPLAIN FORMAT=JSON ${prepared.sql}', prepared.params),
    );
    // One row, one column, holding the JSON plan.
    final raw = result.rows.single.values.first;
    final decoded = jsonDecode(raw! as String) as Map<String, Object?>;
    final block = decoded['query_block'] as Map<String, Object?>?;
    final costInfo = block?['cost_info'] as Map<String, Object?>?;
    final planText = jsonEncode(decoded);
    return ExplainEstimate(
      cost: double.tryParse('${costInfo?['query_cost'] ?? ''}'),
      rows: _estimatedRows(block),
      // MySQL names a whole-table read `ALL` in `access_type`.
      fullScan: planText.contains('"access_type": "ALL"'),
      plan: planText,
    );
  }

  @override
  Future<void> close() => _connection.close();

  /// The plan nests differently per query shape; the row estimate lives on whichever table node the
  /// block exposes, so read it defensively rather than assuming one layout.
  double? _estimatedRows(Map<String, Object?>? block) {
    final table = block?['table'] as Map<String, Object?>?;
    final value =
        table?['rows_examined_per_scan'] ?? table?['rows_produced_per_join'];
    return value == null ? null : double.tryParse('$value');
  }

  /// Decodes one row, undoing the driver's `TINYINT(1)` → bool guess.
  ///
  /// `typedAssoc()` decodes every column well EXCEPT booleans: it maps any `TINYINT` of display
  /// width 1 to a Dart `bool`. MySQL cannot support that guess — `BOOLEAN` is pure syntactic sugar
  /// for `TINYINT(1)` and the server does not remember the keyword, so a column declared `BOOLEAN`
  /// and one declared `TINYINT(1)` are reported IDENTICALLY as `tinyint(1)`. A `TINYINT(1)` legally
  /// holds any tinyint value, so the guess turns a stored **5 into `true`** — verified against the
  /// harness. That is silent data corruption of exactly the kind the 2026-07-19 audit catalogued.
  ///
  /// So: keep every other conversion `typedAssoc()` makes, and for the columns it decided were
  /// boolean, take the RAW digits from `assoc()` instead. MySQL has no boolean type, and this
  /// reports what it actually stored — the same answer SQLite gives, for the same reason.
  Map<String, Object?> _decode(my.ResultSetRow row) {
    final typed = Map<String, Object?>.from(row.typedAssoc());
    if (!typed.values.any((value) => value is bool)) return typed;

    final raw = row.assoc();
    for (final entry in typed.entries.toList()) {
      if (entry.value is! bool) continue;
      final digits = raw[entry.key] as String?;
      typed[entry.key] = digits == null ? null : int.tryParse(digits) ?? digits;
    }
    return typed;
  }

  Future<QueryResult> _runOn(dynamic session, PreparedSql prepared) async {
    final statement = await session.prepare(prepared.sql) as my.PreparedStmt;
    try {
      final result = await statement.execute(prepared.params);
      final rows = [
        for (final row in result.rows) normalizeRow(_decode(row)),
      ];
      return QueryResult(
        rows: rows,
        rowCount: rows.isNotEmpty ? rows.length : result.affectedRows.toInt(),
      );
    } finally {
      await statement.deallocate();
    }
  }
}
