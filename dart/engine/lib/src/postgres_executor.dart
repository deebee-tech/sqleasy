/// The Postgres leg: a [DbExecutor] over the pure-Dart `postgres` wire-protocol driver.
library;

import 'dart:convert';

import 'package:postgres/postgres.dart' as pg;

import 'executor.dart';
import 'normalize.dart';

/// Postgres type OIDs for the temporal columns, from `pg_type`. These are stable catalog constants,
/// not version-dependent, and `package:postgres` reports them verbatim on the result schema.
///
/// `timestamptz` (1184) is an INSTANT and must keep its designator; `timestamp` (1114) is a wall
/// clock and must not gain one; `date` (1082) has no time at all. Flattening the three into one form
/// is the bug this map exists to prevent — see the measurement in normalize.dart.
const Map<int, TemporalKind> _temporalOids = {
  1082: TemporalKind.date,
  1114: TemporalKind.naive,
  1184: TemporalKind.instant,
};

/// The temporal kind of each column the driver reported one for.
///
/// `ResultSchemaColumn.typeOid` is the ONLY place the kind exists — all three arrive in Dart as an
/// indistinguishable `DateTime`. A column the driver did not name, or whose OID is not temporal, is
/// simply absent, and [normalizeRows] leaves its values alone.
///
/// SCALAR only, and that is a real boundary rather than an oversight. Measured 2026-07-21, this
/// driver also hands back temporals wrapped in container types the contract defines no canonical
/// form for: `timestamp[]`/`date[]`/`timestamptz[]` arrive as `List<DateTime>`, and
/// `tsrange`/`daterange` as `DateTimeRange`/`DateRange`. None of those IS a `DateTime`, so
/// [normalizeValue] passes the container through and the `DateTime`s inside stay raw. (`time`,
/// `timetz` and `interval` do not produce `DateTime`s at all — they decode to the driver's own
/// `Time`, `UndecodedBytes` and `Interval`.) Reaching inside a container to rewrite it would be
/// inventing a canonical form corpus C has not defined, on both ports at once.
ColumnKinds _temporalKinds(pg.Result result) {
  final kinds = <String, TemporalKind>{};
  for (final column in result.schema.columns) {
    final name = column.columnName;
    final kind = _temporalOids[column.typeOid];
    if (name != null && kind != null) kinds[name] = kind;
  }
  return kinds;
}

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
    // Normalization is COLUMN-driven: only a column the driver typed as temporal is rewritten, and
    // it is rewritten into the form that column's type actually means.
    final rows = normalizeRows(
      [for (final row in result) row.toColumnMap()],
      _temporalKinds(result),
    );
    // A SELECT reports 0 affected rows, so the row count is the returned count; a mutation reports
    // the rows it touched and returns none.
    return QueryResult(
      rows: rows,
      rowCount: rows.isNotEmpty ? rows.length : result.affectedRows,
    );
  }
}
