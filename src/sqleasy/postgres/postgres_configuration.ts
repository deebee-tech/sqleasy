import type { ConfigurationDelimiters } from "../../configuration/configuration_delimiters";
import type { IConfiguration } from "../../configuration/interface_configuration";
import type { RuntimeConfiguration } from "../../configuration/runtime_configuration";
import { DatabaseType } from "../../enums/database_type";

/** {@link IConfiguration} for PostgreSQL (delimiters, placeholders, default schema). */
export class PostgresConfiguration implements IConfiguration {
   private _postgresRuntimeConfiguration: RuntimeConfiguration;

   /** @param rc - Runtime options (e.g. row limits) bound to this dialect configuration. */
   constructor(rc: RuntimeConfiguration) {
      this._postgresRuntimeConfiguration = rc;
   }

   /** Returns {@link DatabaseType.Postgres}. */
   public databaseType = (): DatabaseType => {
      return DatabaseType.Postgres;
   };

   /** Default schema for unqualified objects (`public`). */
   public defaultOwner = (): string => {
      return "public";
   };

   /** Double-quote delimiters for quoted identifiers. */
   public identifierDelimiters = (): ConfigurationDelimiters => {
      return {
         begin: '"',
         end: '"',
      };
   };

   /** Prefix for numbered prepared statement placeholders (`$`). */
   public preparedStatementPlaceholder = (): string => {
      return "$";
   };

   /** Runtime options associated with this configuration. */
   public runtimeConfiguration = (): RuntimeConfiguration => {
      return this._postgresRuntimeConfiguration;
   };

   /** Single-quote delimiter for string literals. */
   public stringDelimiter = (): string => {
      return "'";
   };

   /** Keywords delimiting a transaction block for this dialect. */
   public transactionDelimiters = (): ConfigurationDelimiters => {
      return {
         begin: "BEGIN",
         end: "COMMIT",
      };
   };
}
