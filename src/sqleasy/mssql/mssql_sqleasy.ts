import IsHelper from "@deebeetech/is-helper";
import { RuntimeConfiguration } from "../../configuration/runtime_configuration";
import type { ISqlEasy } from "../interface_sqleasy";
import { MssqlBuilder } from "./mssql_builder";
import { MssqlConfiguration } from "./mssql_configuration";
import type { MssqlJoinOnBuilder } from "./mssql_join_on_builder";
import { MssqlMultiBuilder } from "./mssql_multi_builder";
import type { MssqlParser } from "./mssql_parser";

export class MssqlSqlEasy implements ISqlEasy<MssqlBuilder, MssqlJoinOnBuilder, MssqlMultiBuilder, MssqlParser> {
   private _mssqlConfiguration: MssqlConfiguration;

   constructor(rc?: RuntimeConfiguration) {
      if (IsHelper.isNullOrUndefined(rc)) {
         rc = new RuntimeConfiguration();
      }

      this._mssqlConfiguration = new MssqlConfiguration(rc);
   }

   public configuration = (): MssqlConfiguration => {
      return this._mssqlConfiguration;
   };

   public newBuilder = (rc?: RuntimeConfiguration): MssqlBuilder => {
      if (IsHelper.isNullOrUndefined(rc)) {
         return new MssqlBuilder(this._mssqlConfiguration);
      }

      return new MssqlBuilder(new MssqlConfiguration(rc));
   };

   public newMultiBuilder = (rc?: RuntimeConfiguration): MssqlMultiBuilder => {
      if (IsHelper.isNullOrUndefined(rc)) {
         return new MssqlMultiBuilder(this._mssqlConfiguration);
      }

      return new MssqlMultiBuilder(new MssqlConfiguration(rc));
   };
}
