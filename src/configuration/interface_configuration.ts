import type { ConfigurationDelimiters } from "../configuration/configuration_delimiters";
import type { RuntimeConfiguration } from "../configuration/runtime_configuration";
import type { DatabaseType } from "../enums/database_type";

/**
 * Dialect-specific configuration that controls how SQL is generated.
 *
 * Each database dialect provides its own implementation with appropriate
 * identifier quoting, placeholder styles, default schemas, and transaction syntax.
 */
export interface IConfiguration {
   /** Returns the {@link DatabaseType} enum value identifying this dialect. */
   databaseType(): DatabaseType;

   /** Returns the default schema/owner name (e.g. `"dbo"` for MSSQL, `"public"` for Postgres). */
   defaultOwner(): string;

   /** Returns the delimiters used to quote identifiers (e.g. `[`/`]` for MSSQL, `"`/`"` for Postgres). */
   identifierDelimiters(): ConfigurationDelimiters;

   /** Returns the placeholder character used in prepared statements (e.g. `"?"` or `"$"`). */
   preparedStatementPlaceholder(): string;

   /** Returns the current {@link RuntimeConfiguration} for this instance. */
   runtimeConfiguration(): RuntimeConfiguration;

   /** Returns the delimiter used to quote string literals (typically `'`). */
   stringDelimiter(): string;

   /** Returns the delimiters used to wrap transaction blocks (e.g. `BEGIN`/`COMMIT`). */
   transactionDelimiters(): ConfigurationDelimiters;
}
