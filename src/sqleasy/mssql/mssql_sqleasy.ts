import { RuntimeConfiguration } from "../../configuration/runtime_configuration";
import type { ISqlEasy } from "../interface_sqleasy";
import { MssqlBuilder } from "./mssql_builder";
import { MssqlConfiguration } from "./mssql_configuration";
import type { MssqlJoinOnBuilder } from "./mssql_join_on_builder";
import { MssqlMultiBuilder } from "./mssql_multi_builder";
import type { MssqlParser } from "./mssql_parser";

/** Main entry point for Microsoft SQL Server; implements {@link ISqlEasy} for MSSQL builders and parsers. */
export class MssqlSqlEasy implements ISqlEasy<MssqlBuilder, MssqlJoinOnBuilder, MssqlMultiBuilder, MssqlParser> {
   private _mssqlConfiguration: MssqlConfiguration;

   /** @param rc - Optional runtime options; defaults to a new {@link RuntimeConfiguration} when omitted. */
   constructor(rc?: RuntimeConfiguration) {
      if (rc === null || rc === undefined) {
         rc = new RuntimeConfiguration();
      }

      this._mssqlConfiguration = new MssqlConfiguration(rc);
   }

   /** Returns the shared MSSQL dialect configuration for this instance. */
   public configuration = (): MssqlConfiguration => {
      return this._mssqlConfiguration;
   };

   /** Creates a query builder, optionally with a one-off {@link RuntimeConfiguration}. */
   public newBuilder = (rc?: RuntimeConfiguration): MssqlBuilder => {
      if (rc === null || rc === undefined) {
         return new MssqlBuilder(this._mssqlConfiguration);
      }

      return new MssqlBuilder(new MssqlConfiguration(rc));
   };

   /** Creates a multi-statement builder, optionally with a one-off {@link RuntimeConfiguration}. */
   public newMultiBuilder = (rc?: RuntimeConfiguration): MssqlMultiBuilder => {
      if (rc === null || rc === undefined) {
         return new MssqlMultiBuilder(this._mssqlConfiguration);
      }

      return new MssqlMultiBuilder(new MssqlConfiguration(rc));
   };
}
