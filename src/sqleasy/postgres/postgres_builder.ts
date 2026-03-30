import { DefaultBuilder } from "../../builder/default_builder";
import type { IConfiguration } from "../../configuration/interface_configuration";
import type { PostgresConfiguration } from "./postgres_configuration";
import { PostgresJoinOnBuilder } from "./postgres_join_on_builder";
import { PostgresParser } from "./postgres_parser";

export class PostgresBuilder extends DefaultBuilder<PostgresBuilder, PostgresJoinOnBuilder, PostgresParser> {
   private _postgresConfig: PostgresConfiguration;

   constructor(config: PostgresConfiguration) {
      super(config);
      this._postgresConfig = config;
   }

   public override newBuilder = (config?: IConfiguration): PostgresBuilder => {
      return new PostgresBuilder((config ?? this._postgresConfig) as PostgresConfiguration);
   };

   public override newJoinOnBuilder = (config?: IConfiguration): PostgresJoinOnBuilder => {
      return new PostgresJoinOnBuilder((config ?? this._postgresConfig) as PostgresConfiguration);
   };

   public override newParser = (config?: IConfiguration): PostgresParser => {
      return new PostgresParser((config ?? this._postgresConfig) as PostgresConfiguration);
   };
}
