/**
 * Identifies the target SQL database dialect for generation and quoting behavior.
 */
export enum DatabaseType {
   /** Microsoft SQL Server. */
   Mssql,
   /** PostgreSQL. */
   Postgres,
   /** MySQL or compatible (e.g. MariaDB). */
   Mysql,
   /** SQLite. */
   Sqlite,
   /** Dialect not set or unrecognized. */
   Unknown,
}
