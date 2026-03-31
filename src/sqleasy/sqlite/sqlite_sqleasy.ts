import { RuntimeConfiguration } from "../../configuration/runtime_configuration";
import type { ISqlEasy } from "../interface_sqleasy";
import { SqliteBuilder } from "./sqlite_builder";
import { SqliteConfiguration } from "./sqlite_configuration";
import type { SqliteJoinOnBuilder } from "./sqlite_join_on_builder";
import { SqliteMultiBuilder } from "./sqlite_multi_builder";
import type { SqliteParser } from "./sqlite_parser";

/** Main entry point for SQLite; implements {@link ISqlEasy} for SQLite builders and parsers. */
export class SqliteSqlEasy implements ISqlEasy<SqliteBuilder, SqliteJoinOnBuilder, SqliteMultiBuilder, SqliteParser> {
   private _sqliteConfiguration: SqliteConfiguration;

   /** @param rc - Optional runtime options; defaults to a new {@link RuntimeConfiguration} when omitted. */
   constructor(rc?: RuntimeConfiguration) {
      if (rc === null || rc === undefined) {
         rc = new RuntimeConfiguration();
      }

      this._sqliteConfiguration = new SqliteConfiguration(rc);
   }

   /** Returns the shared SQLite dialect configuration for this instance. */
   public configuration = (): SqliteConfiguration => {
      return this._sqliteConfiguration;
   };

   /** Creates a query builder, optionally with a one-off {@link RuntimeConfiguration}. */
   public newBuilder = (rc?: RuntimeConfiguration): SqliteBuilder => {
      if (rc === null || rc === undefined) {
         return new SqliteBuilder(this._sqliteConfiguration);
      }

      return new SqliteBuilder(new SqliteConfiguration(rc));
   };

   /** Creates a multi-statement builder, optionally with a one-off {@link RuntimeConfiguration}. */
   public newMultiBuilder = (rc?: RuntimeConfiguration): SqliteMultiBuilder => {
      if (rc === null || rc === undefined) {
         return new SqliteMultiBuilder(this._sqliteConfiguration);
      }

      return new SqliteMultiBuilder(new SqliteConfiguration(rc));
   };
}
