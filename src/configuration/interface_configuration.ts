import type { ConfigurationDelimiters } from "../configuration/configuration_delimiters";
import type { RuntimeConfiguration } from "../configuration/runtime_configuration";
import type { DatabaseType } from "../enums/database_type";

export interface IConfiguration {
   databaseType(): DatabaseType;
   defaultOwner(): string;
   identifierDelimiters(): ConfigurationDelimiters;
   preparedStatementPlaceholder(): string;
   runtimeConfiguration(): RuntimeConfiguration;
   stringDelimiter(): string;
   transactionDelimiters(): ConfigurationDelimiters;
}
