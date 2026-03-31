import type { ConfigurationDelimiters } from "../../configuration/configuration_delimiters";
import type { IConfiguration } from "../../configuration/interface_configuration";
import type { RuntimeConfiguration } from "../../configuration/runtime_configuration";
import { DatabaseType } from "../../enums/database_type";

/** {@link IConfiguration} for SQLite (delimiters, placeholders, transactions). */
export class SqliteConfiguration implements IConfiguration {
   private _sqliteRuntimeConfiguration: RuntimeConfiguration;

   /** @param rc - Runtime options (e.g. row limits) bound to this dialect configuration. */
   constructor(rc: RuntimeConfiguration) {
      this._sqliteRuntimeConfiguration = rc;
   }

   /** Returns {@link DatabaseType.Sqlite}. */
   public databaseType = (): DatabaseType => {
      return DatabaseType.Sqlite;
   };

   /** Default owner for unqualified objects (empty for SQLite). */
   public defaultOwner = (): string => {
      return "";
   };

   /** Double-quote delimiters for quoted identifiers. */
   public identifierDelimiters = (): ConfigurationDelimiters => {
      return {
         begin: '"',
         end: '"',
      };
   };

   /** Placeholder character for parameterized SQL (`?`). */
   public preparedStatementPlaceholder = (): string => {
      return "?";
   };

   /** Runtime options associated with this configuration. */
   public runtimeConfiguration = (): RuntimeConfiguration => {
      return this._sqliteRuntimeConfiguration;
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
