import { DefaultMultiBuilder } from "../../builder/default_multi_builder";
import { SqliteBuilder } from "./sqlite_builder";
import type { SqliteConfiguration } from "./sqlite_configuration";
import type { SqliteJoinOnBuilder } from "./sqlite_join_on_builder";
import { SqliteParser } from "./sqlite_parser";

/** SQLite {@link DefaultMultiBuilder} for batching multiple statements with shared configuration. */
export class SqliteMultiBuilder extends DefaultMultiBuilder<SqliteBuilder, SqliteJoinOnBuilder, SqliteParser> {
   private _sqliteConfig: SqliteConfiguration;

   /** @param config - SQLite dialect configuration shared by child builders and parsers. */
   constructor(config: SqliteConfiguration) {
      super(config);
      this._sqliteConfig = config;
   }

   /** Creates a fresh {@link SqliteBuilder} using this multi-builder’s configuration. */
   public override newBuilder = (): SqliteBuilder => {
      return new SqliteBuilder(this._sqliteConfig);
   };

   /** Creates a fresh {@link SqliteParser} using this multi-builder’s configuration. */
   public override newParser = (): SqliteParser => {
      return new SqliteParser(this._sqliteConfig);
   };
}
