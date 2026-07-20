import 'enums.dart';

/// How a dialect is named in a refusal message, so every one of them reads `<Dialect> has no ...`.
///
/// Refusals are part of the contract — the golden corpus pins their exact text and every language
/// port reproduces it — so the spelling comes from one place rather than being retyped at each
/// throw site.
String dialectDisplayName(DatabaseType databaseType) => const {
      DatabaseType.mssql: 'MSSQL',
      DatabaseType.mysql: 'MySQL',
      DatabaseType.postgres: 'Postgres',
      DatabaseType.sqlite: 'SQLite',
      DatabaseType.unknown: 'This dialect',
    }[databaseType]!;
