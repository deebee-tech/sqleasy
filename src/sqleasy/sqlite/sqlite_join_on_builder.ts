import { DefaultJoinOnBuilder } from "../../builder/default_join_on_builder";
import type { IConfiguration } from "../../configuration/interface_configuration";
import type { SqliteConfiguration } from "./sqlite_configuration";

/** SQLite {@link DefaultJoinOnBuilder} for constructing `JOIN ... ON` fragments. */
export class SqliteJoinOnBuilder extends DefaultJoinOnBuilder<SqliteJoinOnBuilder> {
   private _sqliteConfig: SqliteConfiguration;

   /** @param config - SQLite dialect configuration used when emitting join conditions. */
   constructor(config: SqliteConfiguration) {
      super(config);
      this._sqliteConfig = config;
   }

   /** Returns a new join-on builder, reusing this configuration unless `config` is provided. */
   public override newJoinOnBuilder = (config?: IConfiguration): SqliteJoinOnBuilder => {
      return new SqliteJoinOnBuilder((config ?? this._sqliteConfig) as SqliteConfiguration);
   };
}
