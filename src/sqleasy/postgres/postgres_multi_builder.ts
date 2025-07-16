import { DefaultMultiBuilder } from "../../builder/default_multi_builder";
import { PostgresBuilder } from "./postgres_builder";
import type { PostgresConfiguration } from "./postgres_configuration";
import type { PostgresJoinOnBuilder } from "./postgres_join_on_builder";
import { PostgresParser } from "./postgres_parser";

export class PostgresMultiBuilder extends DefaultMultiBuilder<PostgresBuilder, PostgresJoinOnBuilder, PostgresParser> {
   private _postgresConfig: PostgresConfiguration;

   constructor(config: PostgresConfiguration) {
      super(config);
      this._postgresConfig = config;
   }

   public override newBuilder = (): PostgresBuilder => {
      return new PostgresBuilder(this._postgresConfig);
   };

   public override newParser = (): PostgresParser => {
      return new PostgresParser(this._postgresConfig);
   };
}
