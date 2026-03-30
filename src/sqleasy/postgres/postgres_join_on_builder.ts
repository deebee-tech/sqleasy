import { DefaultJoinOnBuilder } from "../../builder/default_join_on_builder";
import type { IConfiguration } from "../../configuration/interface_configuration";
import type { PostgresConfiguration } from "./postgres_configuration";

export class PostgresJoinOnBuilder extends DefaultJoinOnBuilder<PostgresJoinOnBuilder> {
   private _postgresConfig: PostgresConfiguration;

   constructor(config: PostgresConfiguration) {
      super(config);
      this._postgresConfig = config;
   }

   public override newJoinOnBuilder = (config?: IConfiguration): PostgresJoinOnBuilder => {
      return new PostgresJoinOnBuilder((config ?? this._postgresConfig) as PostgresConfiguration);
   };
}
