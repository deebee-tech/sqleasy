/// The MySQL leg: a [DbExecutor] over the pure-Dart `mysql_client_plus` driver.
library;

import 'dart:convert';

import 'package:mysql_client_plus/mysql_client_plus.dart' as my;

import 'executor.dart';
import 'normalize.dart';

/// MySQL protocol column types for the temporal columns, from `mysql_com.h`. The driver reports the
/// raw protocol byte on each column definition as `MySQLColumnType.intVal`.
///
/// `DATETIME` (12) is a wall clock with no zone — which is exactly why the harness seed uses DATETIME
/// and not TIMESTAMP. `DATE` (10) and its legacy `NEWDATE` (14) have no time component.
///
/// ── WHY `TIMESTAMP` (7) IS `naive` AND NOT `instant` ──
/// MySQL genuinely stores a `TIMESTAMP` as UTC, so on paper it is an instant. In practice the instant
/// cannot survive the trip: the server converts it into the SESSION time zone and puts zone-less
/// digits on the wire, and `mysql_client_plus` then `DateTime.parse`s those digits, producing a
/// LOCAL-flagged value stamped with the READER's offset. The two zones are unrelated, so the
/// resulting `DateTime` points at an arbitrary instant. Measured against the harness (session zone
/// `SYSTEM` = UTC) on one stored `TIMESTAMP '2024-04-01 10:00:00'`, one process per zone:
///
///     wire digits          ->  "2024-04-01 10:00:00"    (the session's rendering, both runs)
///     read as an instant   ->  "2024-04-01T14:00:00Z"   <- same row,
///     TZ=Asia/Tokyo        ->  "2024-04-01T01:00:00Z"      two different instants
///
/// Calling that an instant would assert a point in time nobody stored — the precise failure this
/// whole layer exists to prevent. Nothing caught it because the harness seed has NO `TIMESTAMP`
/// column (`orders.placed_at` and `customers.created_at` are both `DATETIME`), so no corpus case
/// reaches this row of the map.
///
/// `naive` reports the digits the session actually handed over and asserts NO zone, which is exactly
/// true and — being read out of the half the driver wrote them into — independent of the reader's
/// `TZ`. A caller who needs the instant must know the session zone, which is information this layer
/// does not have and will not invent. The TypeScript port maps type 7 the same way, for the same
/// measured reason.
///
/// `TIMESTAMP2`/`DATETIME2` (17/18) are deliberately absent: those are the binary-log-internal
/// spellings and never appear in a result-set column definition. Mapping a type this driver cannot
/// hand us would be a guess dressed as a catalog fact.
const Map<int, TemporalKind> _temporalTypes = {
  7: TemporalKind.naive,
  10: TemporalKind.date,
  12: TemporalKind.naive,
  14: TemporalKind.date,
};

/// The temporal kind of each column the driver typed as temporal.
///
/// `IResultSet.cols` is the ONLY place the kind exists: `typedAssoc()` decodes DATE, DATETIME and
/// TIMESTAMP into an indistinguishable `DateTime`, so by the time the row exists the difference is
/// gone. A column whose protocol type is not in [_temporalTypes] is absent here, and its values are
/// left exactly as the driver produced them.
ColumnKinds _temporalKinds(my.IResultSet result) {
  final kinds = <String, TemporalKind>{};
  for (final column in result.cols) {
    final kind = _temporalTypes[column.type.intVal];
    if (kind != null) kinds[column.name] = kind;
  }
  return kinds;
}

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
      // Normalization is COLUMN-driven: only a column the driver typed as temporal is rewritten,
      // and it is rewritten into the form that column's type actually means.
      final rows = normalizeRows(
        [for (final row in result.rows) _decode(row)],
        _temporalKinds(result),
      );
      return QueryResult(
        rows: rows,
        rowCount: rows.isNotEmpty ? rows.length : result.affectedRows.toInt(),
      );
    } finally {
      await statement.deallocate();
    }
  }
}
