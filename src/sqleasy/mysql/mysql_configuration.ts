import type { ConfigurationDelimiters } from "../../configuration/configuration_delimiters";
import type { IConfiguration } from "../../configuration/interface_configuration";
import type { RuntimeConfiguration } from "../../configuration/runtime_configuration";
import { DatabaseType } from "../../enums/database_type";

export class MysqlConfiguration implements IConfiguration {
   private _mysqlRuntimeConfiguration: RuntimeConfiguration;

   constructor(rc: RuntimeConfiguration) {
      this._mysqlRuntimeConfiguration = rc;
   }

   public databaseType = (): DatabaseType => {
      return DatabaseType.Mysql;
   };

   public defaultOwner = (): string => {
      return "";
   };

   public identifierDelimiters = (): ConfigurationDelimiters => {
      return {
         begin: "`",
         end: "`",
      };
   };

   public preparedStatementPlaceholder = (): string => {
      return "?";
   };

   public runtimeConfiguration = (): RuntimeConfiguration => {
      return this._mysqlRuntimeConfiguration;
   };

   public stringDelimiter = (): string => {
      return "'";
   };

   public transactionDelimiters = (): ConfigurationDelimiters => {
      return {
         begin: "START TRANSACTION",
         end: "COMMIT",
      };
   };
}
