import { RuntimeConfiguration } from "../../configuration/runtime_configuration";
import type { ISqlEasy } from "../interface_sqleasy";
import { SqliteBuilder } from "./sqlite_builder";
import { SqliteConfiguration } from "./sqlite_configuration";
import type { SqliteJoinOnBuilder } from "./sqlite_join_on_builder";
import { SqliteMultiBuilder } from "./sqlite_multi_builder";
import type { SqliteParser } from "./sqlite_parser";

export class SqliteSqlEasy
   implements ISqlEasy<SqliteBuilder, SqliteJoinOnBuilder, SqliteMultiBuilder, SqliteParser>
{
   private _sqliteConfiguration: SqliteConfiguration;

   constructor(rc?: RuntimeConfiguration) {
      if (rc === null || rc === undefined) {
         rc = new RuntimeConfiguration();
      }

      this._sqliteConfiguration = new SqliteConfiguration(rc);
   }

   public configuration = (): SqliteConfiguration => {
      return this._sqliteConfiguration;
   };

   public newBuilder = (rc?: RuntimeConfiguration): SqliteBuilder => {
      if (rc === null || rc === undefined) {
         return new SqliteBuilder(this._sqliteConfiguration);
      }

      return new SqliteBuilder(new SqliteConfiguration(rc));
   };

   public newMultiBuilder = (rc?: RuntimeConfiguration): SqliteMultiBuilder => {
      if (rc === null || rc === undefined) {
         return new SqliteMultiBuilder(this._sqliteConfiguration);
      }

      return new SqliteMultiBuilder(new SqliteConfiguration(rc));
   };
}
