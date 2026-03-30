import { DefaultBuilder } from "../../builder/default_builder";
import type { IConfiguration } from "../../configuration/interface_configuration";
import type { MssqlConfiguration } from "./mssql_configuration";
import { MssqlJoinOnBuilder } from "./mssql_join_on_builder";
import { MssqlParser } from "./mssql_parser";

export class MssqlBuilder extends DefaultBuilder<MssqlBuilder, MssqlJoinOnBuilder, MssqlParser> {
   private _mssqlConfig: MssqlConfiguration;

   constructor(config: MssqlConfiguration) {
      super(config);
      this._mssqlConfig = config;
   }

   public override newBuilder = (config?: IConfiguration): MssqlBuilder => {
      return new MssqlBuilder((config ?? this._mssqlConfig) as MssqlConfiguration);
   };

   public override newJoinOnBuilder = (config?: IConfiguration): MssqlJoinOnBuilder => {
      return new MssqlJoinOnBuilder((config ?? this._mssqlConfig) as MssqlConfiguration);
   };

   public override newParser = (config?: IConfiguration): MssqlParser => {
      return new MssqlParser((config ?? this._mssqlConfig) as MssqlConfiguration);
   };

   public clearTop = (): MssqlBuilder => {
      if (this.state().customState) {
         delete this.state().customState["top"];
      }
      return this;
   };

   public top = (top: number): MssqlBuilder => {
      if (!this.state().customState) {
         this.state().customState = {};
      }
      this.state().customState["top"] = top;
      return this;
   };
}
