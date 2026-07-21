/// Schema introspection: read a database's catalog (tables, views, columns, primary keys, foreign
/// keys, indexes, approximate row counts) into a normalized [SchemaData].
///
/// This entry point pulls in NO driver — it runs entirely through a [DbExecutor] you supply, so it
/// reuses that executor's connection, credentials, and placeholder convention rather than opening
/// its own. Build the executor for the matching dialect and pass it in.
library;

import '../executor.dart';
import 'mysql.dart';
import 'postgres.dart';
import 'schema.dart';
import 'sqlite.dart';

export 'build_schema.dart'
    show
        IndexColumnRow,
        RawColumn,
        RawForeignKey,
        RawRowCount,
        RawTable,
        buildSchema;
export 'mysql.dart' show introspectMysql;
export 'postgres.dart' show introspectPostgres;
export 'schema.dart'
    show
        SchemaColumn,
        SchemaData,
        SchemaForeignKey,
        SchemaIndex,
        SchemaTable,
        SchemaTableType;
export 'sqlite.dart' show introspectSqlite;

/// The dialects whose catalog this package can read. libsql and turso use [sqlite].
///
/// The TypeScript reference also serves `mssql`. This port does NOT, and the value is absent rather
/// than present-and-failing: Dart has no pure-Dart TDS driver, so there is no `MssqlExecutor` to
/// hand to a reader and no way to prove an MSSQL reader against a real server. SQLEasy's founding
/// rule is that nothing is visible on a surface that the surface cannot actually do — an `mssql`
/// case here would be a promise the port cannot keep. It gets added the day the MSSQL executor
/// lands, not before.
enum IntrospectDialect {
  /// PostgreSQL — read through `information_schema` + `pg_catalog`.
  postgres,

  /// MySQL / MariaDB — read through `information_schema`.
  mysql,

  /// SQLite, and the libsql/turso engines that share its catalog.
  sqlite,
}

/// Read a database's catalog as a [SchemaData], through a supplied [DbExecutor]. Choose the
/// [dialect] matching the executor you built — the reader runs that dialect's catalog queries.
/// [schema] scopes the namespace, defaulting per dialect (postgres `public`, mysql the current
/// database, sqlite `main`). SQLite only catalogs `main`; a non-`main` [schema] is rejected rather
/// than silently ignored.
Future<SchemaData> introspectSchema(
  DbExecutor executor,
  IntrospectDialect dialect, [
  String? schema,
]) {
  switch (dialect) {
    case IntrospectDialect.postgres:
      return introspectPostgres(executor, schema);
    case IntrospectDialect.mysql:
      return introspectMysql(executor, schema);
    case IntrospectDialect.sqlite:
      if (schema != null && schema != 'main') {
        return Future<SchemaData>.error(ArgumentError(
          'introspectSqlite: only schema "main" is supported (got "$schema")',
        ));
      }
      return introspectSqlite(executor);
  }
}
