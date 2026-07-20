/// The four dialect entry points — the public way to obtain a builder.
library;

import 'builder/multi_builder.dart';
import 'builder/query_builder.dart';
import 'configuration.dart';

/// Main entry point for Microsoft SQL Server: bracket identifiers, `?` placeholders, `dbo` schema,
/// and a self-contained `sp_executesql` for prepared statements.
class MssqlQuery {
  MssqlQuery([RuntimeConfiguration? rc])
      : _configuration = mssqlConfiguration(rc);

  final Dialect _configuration;

  Dialect get configuration => _configuration;

  MssqlQueryBuilder newBuilder([RuntimeConfiguration? rc]) =>
      QueryBuilder(rc != null ? mssqlConfiguration(rc) : _configuration);

  MultiBuilder<MssqlQueryBuilder> newMultiBuilder([RuntimeConfiguration? rc]) =>
      MultiBuilder<MssqlQueryBuilder>(
          rc != null ? mssqlConfiguration(rc) : _configuration);
}

/// Main entry point for MySQL: backtick identifiers, `?` placeholders, no default schema.
class MysqlQuery {
  MysqlQuery([RuntimeConfiguration? rc])
      : _configuration = mysqlConfiguration(rc);

  final Dialect _configuration;

  Dialect get configuration => _configuration;

  MysqlQueryBuilder newBuilder([RuntimeConfiguration? rc]) =>
      QueryBuilder(rc != null ? mysqlConfiguration(rc) : _configuration);

  MultiBuilder<MysqlQueryBuilder> newMultiBuilder([RuntimeConfiguration? rc]) =>
      MultiBuilder<MysqlQueryBuilder>(
          rc != null ? mysqlConfiguration(rc) : _configuration);
}

/// Main entry point for PostgreSQL: double-quoted identifiers, `$n` placeholders, `public` schema.
class PostgresQuery {
  PostgresQuery([RuntimeConfiguration? rc])
      : _configuration = postgresConfiguration(rc);

  final Dialect _configuration;

  Dialect get configuration => _configuration;

  PostgresQueryBuilder newBuilder([RuntimeConfiguration? rc]) =>
      QueryBuilder(rc != null ? postgresConfiguration(rc) : _configuration);

  MultiBuilder<PostgresQueryBuilder> newMultiBuilder(
          [RuntimeConfiguration? rc]) =>
      MultiBuilder<PostgresQueryBuilder>(
          rc != null ? postgresConfiguration(rc) : _configuration);
}

/// Main entry point for SQLite: double-quoted identifiers, `?` placeholders, no default schema.
class SqliteQuery {
  SqliteQuery([RuntimeConfiguration? rc])
      : _configuration = sqliteConfiguration(rc);

  final Dialect _configuration;

  Dialect get configuration => _configuration;

  SqliteQueryBuilder newBuilder([RuntimeConfiguration? rc]) =>
      QueryBuilder(rc != null ? sqliteConfiguration(rc) : _configuration);

  MultiBuilder<SqliteQueryBuilder> newMultiBuilder(
          [RuntimeConfiguration? rc]) =>
      MultiBuilder<SqliteQueryBuilder>(
          rc != null ? sqliteConfiguration(rc) : _configuration);
}
