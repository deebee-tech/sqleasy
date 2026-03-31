import type { ConfigurationDelimiters } from "../../configuration/configuration_delimiters";
import type { IConfiguration } from "../../configuration/interface_configuration";
import type { RuntimeConfiguration } from "../../configuration/runtime_configuration";
import { DatabaseType } from "../../enums/database_type";

/** {@link IConfiguration} for MySQL (delimiters, placeholders, transactions). */
export class MysqlConfiguration implements IConfiguration {
   private _mysqlRuntimeConfiguration: RuntimeConfiguration;

   /** @param rc - Runtime options (e.g. row limits) bound to this dialect configuration. */
   constructor(rc: RuntimeConfiguration) {
      this._mysqlRuntimeConfiguration = rc;
   }

   /** Returns {@link DatabaseType.Mysql}. */
   public databaseType = (): DatabaseType => {
      return DatabaseType.Mysql;
   };

   /** Default owner for unqualified objects (empty for typical MySQL usage). */
   public defaultOwner = (): string => {
      return "";
   };

   /** Backtick delimiters for quoted identifiers. */
   public identifierDelimiters = (): ConfigurationDelimiters => {
      return {
         begin: "`",
         end: "`",
      };
   };

   /** Placeholder character for parameterized SQL (`?`). */
   public preparedStatementPlaceholder = (): string => {
      return "?";
   };

   /** Runtime options associated with this configuration. */
   public runtimeConfiguration = (): RuntimeConfiguration => {
      return this._mysqlRuntimeConfiguration;
   };

   /** Single-quote delimiter for string literals. */
   public stringDelimiter = (): string => {
      return "'";
   };

   /** Keywords delimiting a transaction block for this dialect. */
   public transactionDelimiters = (): ConfigurationDelimiters => {
      return {
         begin: "START TRANSACTION",
         end: "COMMIT",
      };
   };
}
