import { DefaultJoinOnBuilder } from "../../builder/default_join_on_builder";
import type { IConfiguration } from "../../configuration/interface_configuration";
import type { PostgresConfiguration } from "./postgres_configuration";

/** PostgreSQL {@link DefaultJoinOnBuilder} for constructing `JOIN ... ON` fragments. */
export class PostgresJoinOnBuilder extends DefaultJoinOnBuilder<PostgresJoinOnBuilder> {
   private _postgresConfig: PostgresConfiguration;

   /** @param config - PostgreSQL dialect configuration used when emitting join conditions. */
   constructor(config: PostgresConfiguration) {
      super(config);
      this._postgresConfig = config;
   }

   /** Returns a new join-on builder, reusing this configuration unless `config` is provided. */
   public override newJoinOnBuilder = (config?: IConfiguration): PostgresJoinOnBuilder => {
      return new PostgresJoinOnBuilder((config ?? this._postgresConfig) as PostgresConfiguration);
   };
}
