/// Dialect configuration — the data that drives dialect-correct SQL generation.
library;

import 'enums.dart';

/// A pair of delimiters for quoting identifiers or framing transaction blocks.
class ConfigurationDelimiters {
  const ConfigurationDelimiters(this.begin, this.end);

  /// Opening delimiter (e.g. `[`, `` ` ``, or `"`).
  final String begin;

  /// Closing delimiter matching [begin].
  final String end;
}

/// Options passed when creating a query or builder.
class RuntimeConfiguration {
  /// Optional host-defined settings carried alongside runtime options.
  Object? customConfiguration;

  /// MSSQL ONLY — bind parameters through the driver instead of inlining them.
  ///
  /// Named for its dialect because it is the only one with a choice to make: Postgres, MySQL and
  /// SQLite always hand `(sql, params)` to the driver, so this flag does nothing there and is not
  /// read. MSSQL defaults to a self-contained `exec sp_executesql` batch with the values written
  /// into the EXEC argument list, which is portable — you can paste it into SSMS — and keeps the
  /// INNER statement text stable.
  ///
  /// **Plan reuse is NOT the reason to turn this on.** Measured against SQL Server 2022 with
  /// `optimize for ad hoc workloads` off: 25 executions of one shape with 25 distinct values cache
  /// ONE plan under the default form, the same as under this one. The outer `exec` batch gets no
  /// cache entry at all, so only the value-independent inner statement is cached. (Literal SQL,
  /// with the values written into the statement itself, caches 25 — that is the pathology, and the
  /// default form already avoids it.)
  ///
  /// Turn it on for the narrower wins: values never reach the SQL text, so a logged statement
  /// cannot leak them; the payload is smaller; and the parameter TYPE comes from the driver instead
  /// of being inferred from the value, which matters because `sp_executesql` keys its cache on the
  /// declaration — see `mssqlParameterType` for the banding that used to split one shape into
  /// several plans.
  ///
  /// Set this to `true` and [parsePrepared] returns `@p0`-style placeholders with the ordered
  /// values alongside, for the caller to bind.
  bool mssqlBoundParameters = false;
}

/// Dialect-specific configuration that controls how SQL is generated.
///
/// A plain data object — the whole strategy for a dialect. Each dialect ships a factory (e.g.
/// [sqliteConfiguration]) that produces one, and the single builder/parser reads it to decide
/// identifier quoting, placeholder style, default schema, and transaction syntax.
class Dialect {
  Dialect({
    required this.databaseType,
    required this.defaultOwner,
    required this.identifierDelimiters,
    required this.preparedStatementPlaceholder,
    required this.runtimeConfiguration,
    required this.transactionDelimiters,
  });

  /// The [DatabaseType] identifying this dialect.
  final DatabaseType databaseType;

  /// The default schema/owner name (e.g. `dbo` for MSSQL, `public` for Postgres).
  final String defaultOwner;

  /// The delimiters used to quote identifiers.
  final ConfigurationDelimiters identifierDelimiters;

  /// The placeholder character used in prepared statements (e.g. `?` or `$`).
  final String preparedStatementPlaceholder;

  /// The runtime options bound to this dialect instance.
  final RuntimeConfiguration runtimeConfiguration;

  /// The delimiters that wrap transaction blocks (e.g. `BEGIN`/`COMMIT`).
  final ConfigurationDelimiters transactionDelimiters;
}

/// The Microsoft SQL Server dialect: bracket identifiers, `?` placeholders, `dbo` schema.
Dialect mssqlConfiguration([RuntimeConfiguration? rc]) => Dialect(
      databaseType: DatabaseType.mssql,
      defaultOwner: 'dbo',
      identifierDelimiters: const ConfigurationDelimiters('[', ']'),
      preparedStatementPlaceholder: '?',
      runtimeConfiguration: rc ?? RuntimeConfiguration(),
      transactionDelimiters: const ConfigurationDelimiters(
          'BEGIN TRANSACTION', 'COMMIT TRANSACTION'),
    );

/// The MySQL dialect: backtick identifiers, `?` placeholders, no default schema.
Dialect mysqlConfiguration([RuntimeConfiguration? rc]) => Dialect(
      databaseType: DatabaseType.mysql,
      defaultOwner: '',
      identifierDelimiters: const ConfigurationDelimiters('`', '`'),
      preparedStatementPlaceholder: '?',
      runtimeConfiguration: rc ?? RuntimeConfiguration(),
      transactionDelimiters:
          const ConfigurationDelimiters('START TRANSACTION', 'COMMIT'),
    );

/// The PostgreSQL dialect: double-quoted identifiers, `$` placeholders, `public` schema.
Dialect postgresConfiguration([RuntimeConfiguration? rc]) => Dialect(
      databaseType: DatabaseType.postgres,
      defaultOwner: 'public',
      identifierDelimiters: const ConfigurationDelimiters('"', '"'),
      preparedStatementPlaceholder: r'$',
      runtimeConfiguration: rc ?? RuntimeConfiguration(),
      transactionDelimiters: const ConfigurationDelimiters('BEGIN', 'COMMIT'),
    );

/// The SQLite dialect: double-quoted identifiers, `?` placeholders, no default schema.
Dialect sqliteConfiguration([RuntimeConfiguration? rc]) => Dialect(
      databaseType: DatabaseType.sqlite,
      defaultOwner: '',
      identifierDelimiters: const ConfigurationDelimiters('"', '"'),
      preparedStatementPlaceholder: '?',
      runtimeConfiguration: rc ?? RuntimeConfiguration(),
      transactionDelimiters: const ConfigurationDelimiters('BEGIN', 'COMMIT'),
    );
