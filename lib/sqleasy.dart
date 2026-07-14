/// A dialect-aware SQL builder for Postgres, MySQL, SQL Server and SQLite.
///
/// Composes dialect-correct SELECT / INSERT / UPDATE / DELETE with a fluent API and hands you the
/// SQL string and its bound parameters. It is **not** a driver and **not** an ORM: you bring your
/// own connection (`postgres`, `mysql_client`, `sqflite`, `drift`, …) and execute what it generates.
///
/// This is a pure Dart package — no Flutter SDK dependency, no `dart:io`, no `dart:html` — so it
/// runs on Flutter mobile, desktop and web, and on plain Dart servers.
///
/// It is the Dart port of [`@deebeetech/sqleasy`](https://github.com/deebee-tech/sqleasy), and is
/// held to that implementation byte-for-byte by a shared golden corpus. See `goldens/README.md`.
library;

export 'src/errors/parser_error.dart' show ParserArea, ParserError;

// The builder, dialects and parser land next — see the port plan. `lib/src/values/sql_value.dart`
// is deliberately first: it is the only place a Dart value becomes SQL text, and getting it wrong
// makes the package emit different SQL on Flutter web than on Flutter mobile.
