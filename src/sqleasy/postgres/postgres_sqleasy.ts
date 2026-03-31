import { RuntimeConfiguration } from "../../configuration/runtime_configuration";
import type { ISqlEasy } from "../interface_sqleasy";
import { PostgresBuilder } from "./postgres_builder";
import { PostgresConfiguration } from "./postgres_configuration";
import type { PostgresJoinOnBuilder } from "./postgres_join_on_builder";
import { PostgresMultiBuilder } from "./postgres_multi_builder";
import type { PostgresParser } from "./postgres_parser";

/** Main entry point for PostgreSQL; implements {@link ISqlEasy} for Postgres builders and parsers. */
export class PostgresSqlEasy implements ISqlEasy<
   PostgresBuilder,
   PostgresJoinOnBuilder,
   PostgresMultiBuilder,
   PostgresParser
> {
   private _postgresConfig: PostgresConfiguration;

   /** @param rc - Optional runtime options; defaults to a new {@link RuntimeConfiguration} when omitted. */
   constructor(rc?: RuntimeConfiguration) {
      if (rc === null || rc === undefined) {
         rc = new RuntimeConfiguration();
      }

      this._postgresConfig = new PostgresConfiguration(rc);
   }

   /** Returns the shared PostgreSQL dialect configuration for this instance. */
   public configuration = (): PostgresConfiguration => {
      return this._postgresConfig;
   };

   /** Creates a query builder, optionally with a one-off {@link RuntimeConfiguration}. */
   public newBuilder = (rc?: RuntimeConfiguration): PostgresBuilder => {
      if (rc === null || rc === undefined) {
         return new PostgresBuilder(this._postgresConfig);
      }

      return new PostgresBuilder(new PostgresConfiguration(rc));
   };

   /** Creates a multi-statement builder, optionally with a one-off {@link RuntimeConfiguration}. */
   public newMultiBuilder = (rc?: RuntimeConfiguration): PostgresMultiBuilder => {
      if (rc === null || rc === undefined) {
         return new PostgresMultiBuilder(this._postgresConfig);
      }

      return new PostgresMultiBuilder(new PostgresConfiguration(rc));
   };
}
