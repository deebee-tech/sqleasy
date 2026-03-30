import type { ConfigurationDelimiters } from "../../configuration/configuration_delimiters";
import type { IConfiguration } from "../../configuration/interface_configuration";
import type { RuntimeConfiguration } from "../../configuration/runtime_configuration";
import { DatabaseType } from "../../enums/database_type";

export class SqliteConfiguration implements IConfiguration {
   private _sqliteRuntimeConfiguration: RuntimeConfiguration;

   constructor(rc: RuntimeConfiguration) {
      this._sqliteRuntimeConfiguration = rc;
   }

   public databaseType = (): DatabaseType => {
      return DatabaseType.Sqlite;
   };

   public defaultOwner = (): string => {
      return "";
   };

   public identifierDelimiters = (): ConfigurationDelimiters => {
      return {
         begin: '"',
         end: '"',
      };
   };

   public preparedStatementPlaceholder = (): string => {
      return "?";
   };

   public runtimeConfiguration = (): RuntimeConfiguration => {
      return this._sqliteRuntimeConfiguration;
   };

   public stringDelimiter = (): string => {
      return "'";
   };

   public transactionDelimiters = (): ConfigurationDelimiters => {
      return {
         begin: "BEGIN",
         end: "COMMIT",
      };
   };
}
