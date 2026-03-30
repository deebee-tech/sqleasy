import { DefaultJoinOnBuilder } from "../../builder/default_join_on_builder";
import type { IConfiguration } from "../../configuration/interface_configuration";
import type { SqliteConfiguration } from "./sqlite_configuration";

export class SqliteJoinOnBuilder extends DefaultJoinOnBuilder<SqliteJoinOnBuilder> {
   private _sqliteConfig: SqliteConfiguration;

   constructor(config: SqliteConfiguration) {
      super(config);
      this._sqliteConfig = config;
   }

   public override newJoinOnBuilder = (config?: IConfiguration): SqliteJoinOnBuilder => {
      return new SqliteJoinOnBuilder((config ?? this._sqliteConfig) as SqliteConfiguration);
   };
}
