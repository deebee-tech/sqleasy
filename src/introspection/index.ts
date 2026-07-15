/**
 * Schema introspection: read a database's catalog (tables, views, columns, primary keys, foreign
 * keys, indexes, approximate row counts) into a normalized {@link SchemaData}.
 *
 * This entry point pulls in NO driver — it runs entirely through a {@link DbExecutor} you supply, so
 * it reuses that executor's connection, credentials, and placeholder convention rather than opening
 * its own. Build the executor from the matching dialect subpath and pass it in.
 */
import type { DbExecutor } from '../index';
import { introspectMssql } from './mssql';
import { introspectMysql } from './mysql';
import { introspectPostgres } from './postgres';
import type { SchemaData } from './schema';
import { introspectSqlite } from './sqlite';

export type {
  SchemaColumn,
  SchemaForeignKey,
  SchemaIndex,
  SchemaTable,
  SchemaData,
} from './schema';
export { buildSchema, type RawTable, type IndexColumnRow } from './build-schema';
export { introspectPostgres } from './postgres';
export { introspectMysql } from './mysql';
export { introspectMssql } from './mssql';
export { introspectSqlite } from './sqlite';

/** The dialects whose catalog this package can read. libsql and turso use `'sqlite'`. */
export type IntrospectDialect = 'postgres' | 'mysql' | 'mssql' | 'sqlite';

/**
 * Read a database's catalog as a {@link SchemaData}, through a supplied {@link DbExecutor}. Choose
 * the `dialect` matching the executor you built — the reader runs that dialect's catalog queries.
 * `schema` scopes the namespace, defaulting per dialect (postgres `public`, mysql the current
 * database, mssql `dbo`, sqlite `main` — sqlite ignores it).
 */
export function introspectSchema(
  executor: DbExecutor,
  dialect: IntrospectDialect,
  schema?: string,
): Promise<SchemaData> {
  switch (dialect) {
    case 'postgres':
      return introspectPostgres(executor, schema);
    case 'mysql':
      return introspectMysql(executor, schema);
    case 'mssql':
      return introspectMssql(executor, schema);
    case 'sqlite':
      return introspectSqlite(executor);
  }
}
