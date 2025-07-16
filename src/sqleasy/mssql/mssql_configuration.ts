import type { ConfigurationDelimiters } from "../../configuration/configuration_delimiters";
import type { IConfiguration } from "../../configuration/interface_configuration";
import type { RuntimeConfiguration } from "../../configuration/runtime_configuration";
import { DatabaseType } from "../../enums/database_type";

export class MssqlConfiguration implements IConfiguration {
   private _mssqlRuntimeConfiguration: RuntimeConfiguration;

   constructor(rc: RuntimeConfiguration) {
      this._mssqlRuntimeConfiguration = rc;
   }

   public databaseType = (): DatabaseType => {
      return DatabaseType.Mssql;
   };

   public defaultOwner = (): string => {
      return "dbo";
   };

   public identifierDelimiters = (): ConfigurationDelimiters => {
      return {
         begin: "[",
         end: "]",
      };
   };

   public preparedStatementPlaceholder = (): string => {
      return "?";
   };

   public runtimeConfiguration = (): RuntimeConfiguration => {
      return this._mssqlRuntimeConfiguration;
   };

   public stringDelimiter = (): string => {
      return "'";
   };

   public transactionDelimiters = (): ConfigurationDelimiters => {
      return {
         begin: "BEGIN TRANSACTION",
         end: "COMMIT TRANSACTION",
      };
   };
}
