import type { ConfigurationDelimiters } from './delimiters';
import type { RuntimeConfiguration } from './runtime';
import type { DatabaseType } from '../enums/database-type';

/**
 * Dialect-specific configuration that controls how SQL is generated.
 *
 * This is a plain data object — the whole strategy for a dialect. Each dialect ships a
 * factory (e.g. {@link sqliteConfiguration}) that produces one, and the single
 * {@link QueryBuilder} class reads it to decide identifier quoting, placeholder style,
 * default schema, and transaction syntax.
 */
export type Dialect = {
  /** The {@link DatabaseType} identifying this dialect. */
  databaseType: DatabaseType;

  /** The default schema/owner name (e.g. `"dbo"` for MSSQL, `"public"` for Postgres). */
  defaultOwner: string;

  /** The delimiters used to quote identifiers (e.g. `[`/`]` for MSSQL, `"`/`"` for Postgres). */
  identifierDelimiters: ConfigurationDelimiters;

  /** The placeholder character used in prepared statements (e.g. `"?"` or `"$"`). */
  preparedStatementPlaceholder: string;

  /** The {@link RuntimeConfiguration} bound to this dialect instance. */
  runtimeConfiguration: RuntimeConfiguration;

  /** The delimiters used to wrap transaction blocks (e.g. `BEGIN`/`COMMIT`). */
  transactionDelimiters: ConfigurationDelimiters;
};
