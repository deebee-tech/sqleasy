import { DefaultBuilder } from "../../builder/default_builder";
import type { IConfiguration } from "../../configuration/interface_configuration";
import type { PostgresConfiguration } from "./postgres_configuration";
import { PostgresJoinOnBuilder } from "./postgres_join_on_builder";
import { PostgresParser } from "./postgres_parser";

/** PostgreSQL {@link DefaultBuilder}; creates dialect parsers and join-on builders. */
export class PostgresBuilder extends DefaultBuilder<PostgresBuilder, PostgresJoinOnBuilder, PostgresParser> {
   private _postgresConfig: PostgresConfiguration;

   /** @param config - PostgreSQL dialect configuration used for SQL generation. */
   constructor(config: PostgresConfiguration) {
      super(config);
      this._postgresConfig = config;
   }

   /** Returns a new builder, reusing this configuration unless `config` is provided. */
   public override newBuilder = (config?: IConfiguration): PostgresBuilder => {
      return new PostgresBuilder((config ?? this._postgresConfig) as PostgresConfiguration);
   };

   /** Returns a new join-on builder for this dialect. */
   public override newJoinOnBuilder = (config?: IConfiguration): PostgresJoinOnBuilder => {
      return new PostgresJoinOnBuilder((config ?? this._postgresConfig) as PostgresConfiguration);
   };

   /** Returns a new PostgreSQL parser instance. */
   public override newParser = (config?: IConfiguration): PostgresParser => {
      return new PostgresParser((config ?? this._postgresConfig) as PostgresConfiguration);
   };
}
