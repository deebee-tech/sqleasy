import { DefaultMultiBuilder } from "../../builder/default_multi_builder";
import { PostgresBuilder } from "./postgres_builder";
import type { PostgresConfiguration } from "./postgres_configuration";
import type { PostgresJoinOnBuilder } from "./postgres_join_on_builder";
import { PostgresParser } from "./postgres_parser";

/** PostgreSQL {@link DefaultMultiBuilder} for batching multiple statements with shared configuration. */
export class PostgresMultiBuilder extends DefaultMultiBuilder<PostgresBuilder, PostgresJoinOnBuilder, PostgresParser> {
   private _postgresConfig: PostgresConfiguration;

   /** @param config - PostgreSQL dialect configuration shared by child builders and parsers. */
   constructor(config: PostgresConfiguration) {
      super(config);
      this._postgresConfig = config;
   }

   /** Creates a fresh {@link PostgresBuilder} using this multi-builder’s configuration. */
   public override newBuilder = (): PostgresBuilder => {
      return new PostgresBuilder(this._postgresConfig);
   };

   /** Creates a fresh {@link PostgresParser} using this multi-builder’s configuration. */
   public override newParser = (): PostgresParser => {
      return new PostgresParser(this._postgresConfig);
   };
}
