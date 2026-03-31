import type { ConfigurationDelimiters } from "../../configuration/configuration_delimiters";
import type { IConfiguration } from "../../configuration/interface_configuration";
import type { RuntimeConfiguration } from "../../configuration/runtime_configuration";
import { DatabaseType } from "../../enums/database_type";

/** {@link IConfiguration} for Microsoft SQL Server (delimiters, placeholders, default schema). */
export class MssqlConfiguration implements IConfiguration {
   private _mssqlRuntimeConfiguration: RuntimeConfiguration;

   /** @param rc - Runtime options (e.g. row limits) bound to this dialect configuration. */
   constructor(rc: RuntimeConfiguration) {
      this._mssqlRuntimeConfiguration = rc;
   }

   /** Returns {@link DatabaseType.Mssql}. */
   public databaseType = (): DatabaseType => {
      return DatabaseType.Mssql;
   };

   /** Default schema/owner for unqualified objects (`dbo`). */
   public defaultOwner = (): string => {
      return "dbo";
   };

   /** Bracket delimiters for quoted identifiers. */
   public identifierDelimiters = (): ConfigurationDelimiters => {
      return {
         begin: "[",
         end: "]",
      };
   };

   /** Placeholder character for parameterized SQL (`?`). */
   public preparedStatementPlaceholder = (): string => {
      return "?";
   };

   /** Runtime options associated with this configuration. */
   public runtimeConfiguration = (): RuntimeConfiguration => {
      return this._mssqlRuntimeConfiguration;
   };

   /** Single-quote delimiter for string literals. */
   public stringDelimiter = (): string => {
      return "'";
   };

   /** Keywords delimiting a transaction block for this dialect. */
   public transactionDelimiters = (): ConfigurationDelimiters => {
      return {
         begin: "BEGIN TRANSACTION",
         end: "COMMIT TRANSACTION",
      };
   };
}
