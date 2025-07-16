import { DefaultMultiBuilder } from "../../builder/default_multi_builder";
import { MssqlBuilder } from "./mssql_builder";
import type { MssqlConfiguration } from "./mssql_configuration";
import type { MssqlJoinOnBuilder } from "./mssql_join_on_builder";
import { MssqlParser } from "./mssql_parser";

export class MssqlMultiBuilder extends DefaultMultiBuilder<MssqlBuilder, MssqlJoinOnBuilder, MssqlParser> {
   private _mssqlConfiguration: MssqlConfiguration;

   constructor(config: MssqlConfiguration) {
      super(config);
      this._mssqlConfiguration = config;
   }

   public override newBuilder = (): MssqlBuilder => {
      return new MssqlBuilder(this._mssqlConfiguration);
   };

   public override newParser = (): MssqlParser => {
      return new MssqlParser(this._mssqlConfiguration);
   };
}
