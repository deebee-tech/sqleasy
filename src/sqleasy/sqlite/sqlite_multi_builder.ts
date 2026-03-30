import { DefaultMultiBuilder } from "../../builder/default_multi_builder";
import { SqliteBuilder } from "./sqlite_builder";
import type { SqliteConfiguration } from "./sqlite_configuration";
import type { SqliteJoinOnBuilder } from "./sqlite_join_on_builder";
import { SqliteParser } from "./sqlite_parser";

export class SqliteMultiBuilder extends DefaultMultiBuilder<SqliteBuilder, SqliteJoinOnBuilder, SqliteParser> {
   private _sqliteConfig: SqliteConfiguration;

   constructor(config: SqliteConfiguration) {
      super(config);
      this._sqliteConfig = config;
   }

   public override newBuilder = (): SqliteBuilder => {
      return new SqliteBuilder(this._sqliteConfig);
   };

   public override newParser = (): SqliteParser => {
      return new SqliteParser(this._sqliteConfig);
   };
}
