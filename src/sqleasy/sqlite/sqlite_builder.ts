import { DefaultBuilder } from "../../builder/default_builder";
import type { IConfiguration } from "../../configuration/interface_configuration";
import type { SqliteConfiguration } from "./sqlite_configuration";
import { SqliteJoinOnBuilder } from "./sqlite_join_on_builder";
import { SqliteParser } from "./sqlite_parser";

export class SqliteBuilder extends DefaultBuilder<SqliteBuilder, SqliteJoinOnBuilder, SqliteParser> {
   private _sqliteConfig: SqliteConfiguration;

   constructor(config: SqliteConfiguration) {
      super(config);
      this._sqliteConfig = config;
   }

   public override newBuilder = (config?: IConfiguration): SqliteBuilder => {
      return new SqliteBuilder((config ?? this._sqliteConfig) as SqliteConfiguration);
   };

   public override newJoinOnBuilder = (config?: IConfiguration): SqliteJoinOnBuilder => {
      return new SqliteJoinOnBuilder((config ?? this._sqliteConfig) as SqliteConfiguration);
   };

   public override newParser = (config?: IConfiguration): SqliteParser => {
      return new SqliteParser((config ?? this._sqliteConfig) as SqliteConfiguration);
   };
}
