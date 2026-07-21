/// The Postgres leg: a [DbExecutor] over the pure-Dart `postgres` wire-protocol driver.
library;

import 'dart:convert';

import 'package:postgres/postgres.dart' as pg;

import 'executor.dart';
import 'normalize.dart';

/// Connection details for [PostgresExecutor.open].
class PostgresConnectionOptions {
  const PostgresConnectionOptions({
    required this.host,
    required this.database,
    required this.username,
    required this.password,
    this.port = 5432,
    this.useSsl = false,
  });

  final String host;
  final int port;
  final String database;
  final String username;
  final String password;
  final bool useSsl;
}

/// Executes prepared SQL against PostgreSQL.
///
/// SQLEasy's Postgres dialect emits `$1`-style placeholders, which are the wire protocol's OWN
/// numbering — so the SQL is handed to the driver verbatim and the parameters bind positionally. The
/// engine never rewrites the statement.
class PostgresExecutor implements DbExecutor {
  PostgresExecutor._(this._connection);

  final pg.Connection _connection;

  /// Opens a connection. The caller owns it and must [close] it.
  static Future<PostgresExecutor> open(
      PostgresConnectionOptions options) async {
    final connection = await pg.Connection.open(
      pg.Endpoint(
        host: options.host,
        port: options.port,
        database: options.database,
        username: options.username,
        password: options.password,
      ),
      settings: pg.ConnectionSettings(
        sslMode: options.useSsl ? pg.SslMode.require : pg.SslMode.disable,
      ),
    );
    return PostgresExecutor._(connection);
  }

  @override
  Future<QueryResult> run(PreparedSql prepared) async {
    final result = await _connection.execute(
      pg.Sql(prepared.sql),
      parameters: prepared.params,
    );
    return _toQueryResult(result);
  }

  @override
  Future<List<QueryResult>> transaction(List<PreparedSql> statements) async {
    // Each statement runs as its OWN prepared statement, in order — never concatenated, which would
    // misbind because `$n` numbering restarts per statement.
    return _connection.runTx((session) async {
      final results = <QueryResult>[];
      for (final statement in statements) {
        final result = await session.execute(
          pg.Sql(statement.sql),
          parameters: statement.params,
        );
        results.add(_toQueryResult(result));
      }
      return results;
    });
  }

  @override
  Future<ExplainEstimate> explain(PreparedSql prepared) async {
    final result = await _connection.execute(
      pg.Sql('EXPLAIN (FORMAT JSON) ${prepared.sql}'),
      parameters: prepared.params,
    );
    // Postgres returns a one-row, one-column result whose value is the JSON plan array.
    final raw = result.first.first;
    final decoded = raw is String ? jsonDecode(raw) : raw;
    final plan = ((decoded as List).first as Map)['Plan'] as Map;
    final planText = jsonEncode(plan);
    return ExplainEstimate(
      cost: (plan['Total Cost'] as num?)?.toDouble(),
      rows: (plan['Plan Rows'] as num?)?.toDouble(),
      fullScan: planText.contains('Seq Scan'),
      plan: planText,
    );
  }

  @override
  Future<void> close() => _connection.close();

  QueryResult _toQueryResult(pg.Result result) {
    final rows = [
      for (final row in result) normalizeRow(row.toColumnMap()),
    ];
    // A SELECT reports 0 affected rows, so the row count is the returned count; a mutation reports
    // the rows it touched and returns none.
    return QueryResult(
      rows: rows,
      rowCount: rows.isNotEmpty ? rows.length : result.affectedRows,
    );
  }
}
