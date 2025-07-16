import IsHelper from "@deebeetech/is-helper";
import { RuntimeConfiguration } from "../../configuration/runtime_configuration";
import type { ISqlEasy } from "../interface_sqleasy";
import { MysqlBuilder } from "./mysql_builder";
import { MysqlConfiguration } from "./mysql_configuration";
import type { MysqlJoinOnBuilder } from "./mysql_join_on_builder";
import { MysqlMultiBuilder } from "./mysql_multi_builder";
import type { MysqlParser } from "./mysql_parser";

export class MysqlSqlEasy implements ISqlEasy<MysqlBuilder, MysqlJoinOnBuilder, MysqlMultiBuilder, MysqlParser> {
   private _mssqlConfiguration: MysqlConfiguration;

   constructor(rc?: RuntimeConfiguration) {
      if (IsHelper.isNullOrUndefined(rc)) {
         rc = new RuntimeConfiguration();
      }

      this._mssqlConfiguration = new MysqlConfiguration(rc);
   }

   public configuration = (): MysqlConfiguration => {
      return this._mssqlConfiguration;
   };

   public newBuilder = (rc?: RuntimeConfiguration): MysqlBuilder => {
      if (IsHelper.isNullOrUndefined(rc)) {
         return new MysqlBuilder(this._mssqlConfiguration);
      }

      return new MysqlBuilder(new MysqlConfiguration(rc));
   };

   public newMultiBuilder = (rc?: RuntimeConfiguration): MysqlMultiBuilder => {
      if (IsHelper.isNullOrUndefined(rc)) {
         return new MysqlMultiBuilder(this._mssqlConfiguration);
      }

      return new MysqlMultiBuilder(new MysqlConfiguration(rc));
   };
}
