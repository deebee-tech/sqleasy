import { DefaultBuilder } from "../../builder/default_builder";
import type { IConfiguration } from "../../configuration/interface_configuration";
import type { SqliteConfiguration } from "./sqlite_configuration";
import { SqliteJoinOnBuilder } from "./sqlite_join_on_builder";
import { SqliteParser } from "./sqlite_parser";

/** SQLite {@link DefaultBuilder}; creates dialect parsers and join-on builders. */
export class SqliteBuilder extends DefaultBuilder<SqliteBuilder, SqliteJoinOnBuilder, SqliteParser> {
   private _sqliteConfig: SqliteConfiguration;

   /** @param config - SQLite dialect configuration used for SQL generation. */
   constructor(config: SqliteConfiguration) {
      super(config);
      this._sqliteConfig = config;
   }

   /** Returns a new builder, reusing this configuration unless `config` is provided. */
   public override newBuilder = (config?: IConfiguration): SqliteBuilder => {
      return new SqliteBuilder((config ?? this._sqliteConfig) as SqliteConfiguration);
   };

   /** Returns a new join-on builder for this dialect. */
   public override newJoinOnBuilder = (config?: IConfiguration): SqliteJoinOnBuilder => {
      return new SqliteJoinOnBuilder((config ?? this._sqliteConfig) as SqliteConfiguration);
   };

   /** Returns a new SQLite parser instance. */
   public override newParser = (config?: IConfiguration): SqliteParser => {
      return new SqliteParser((config ?? this._sqliteConfig) as SqliteConfiguration);
   };
}
