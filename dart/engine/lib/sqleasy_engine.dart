/// Executes the SQL that SQLEasy builds.
///
/// Runs a `(sql, params)` pair against a real database and hands back rows. It is NOT a builder and
/// NOT an ORM: it runs what it is given, verbatim, and never rewrites dialects — pick the executor
/// whose dialect matches the SQL you built so placeholders and quoting line up.
///
/// Dart-VM only: it opens sockets and (for SQLite) loads a native library.
library;

export 'src/executor.dart'
    show DbExecutor, ExplainEstimate, PreparedSql, QueryResult, Row;
export 'src/postgres_executor.dart'
    show PostgresConnectionOptions, PostgresExecutor;
