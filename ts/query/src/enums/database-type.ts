/**
 * Identifies the target SQL database dialect for generation and quoting behavior.
 */
export const DatabaseType = {
  /** Microsoft SQL Server. */
  Mssql: 'mssql',
  /** PostgreSQL. */
  Postgres: 'postgres',
  /** MySQL or compatible (e.g. MariaDB). */
  Mysql: 'mysql',
  /** SQLite. */
  Sqlite: 'sqlite',
  /** Dialect not set or unrecognized. */
  Unknown: 'unknown',
} as const;

/** One of the {@link DatabaseType} dialect identifiers. */
export type DatabaseType = (typeof DatabaseType)[keyof typeof DatabaseType];
