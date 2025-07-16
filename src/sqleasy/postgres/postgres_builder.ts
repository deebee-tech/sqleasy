import { DefaultBuilder } from "../../builder/default_builder";
import type { PostgresConfiguration } from "./postgres_configuration";
import { PostgresJoinOnBuilder } from "./postgres_join_on_builder";
import { PostgresParser } from "./postgres_parser";

export class PostgresBuilder extends DefaultBuilder<PostgresBuilder, PostgresJoinOnBuilder, PostgresParser> {
   private _postgresConfig: PostgresConfiguration;

   constructor(config: PostgresConfiguration) {
      super(config);
      this._postgresConfig = config;
   }

   public override newBuilder = (): PostgresBuilder => {
      return new PostgresBuilder(this._postgresConfig);
   };

   public override newJoinOnBuilder = (): PostgresJoinOnBuilder => {
      return new PostgresJoinOnBuilder(this._postgresConfig);
   };

   public override newParser = (): PostgresParser => {
      return new PostgresParser(this._postgresConfig);
   };
}
