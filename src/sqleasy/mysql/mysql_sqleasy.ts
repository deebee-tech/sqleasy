import { RuntimeConfiguration } from "../../configuration/runtime_configuration";
import type { ISqlEasy } from "../interface_sqleasy";
import { MysqlBuilder } from "./mysql_builder";
import { MysqlConfiguration } from "./mysql_configuration";
import type { MysqlJoinOnBuilder } from "./mysql_join_on_builder";
import { MysqlMultiBuilder } from "./mysql_multi_builder";
import type { MysqlParser } from "./mysql_parser";

/** Main entry point for MySQL; implements {@link ISqlEasy} for MySQL builders and parsers. */
export class MysqlSqlEasy implements ISqlEasy<MysqlBuilder, MysqlJoinOnBuilder, MysqlMultiBuilder, MysqlParser> {
   private _mysqlConfiguration: MysqlConfiguration;

   /** @param rc - Optional runtime options; defaults to a new {@link RuntimeConfiguration} when omitted. */
   constructor(rc?: RuntimeConfiguration) {
      if (rc === null || rc === undefined) {
         rc = new RuntimeConfiguration();
      }

      this._mysqlConfiguration = new MysqlConfiguration(rc);
   }

   /** Returns the shared MySQL dialect configuration for this instance. */
   public configuration = (): MysqlConfiguration => {
      return this._mysqlConfiguration;
   };

   /** Creates a query builder, optionally with a one-off {@link RuntimeConfiguration}. */
   public newBuilder = (rc?: RuntimeConfiguration): MysqlBuilder => {
      if (rc === null || rc === undefined) {
         return new MysqlBuilder(this._mysqlConfiguration);
      }

      return new MysqlBuilder(new MysqlConfiguration(rc));
   };

   /** Creates a multi-statement builder, optionally with a one-off {@link RuntimeConfiguration}. */
   public newMultiBuilder = (rc?: RuntimeConfiguration): MysqlMultiBuilder => {
      if (rc === null || rc === undefined) {
         return new MysqlMultiBuilder(this._mysqlConfiguration);
      }

      return new MysqlMultiBuilder(new MysqlConfiguration(rc));
   };
}
