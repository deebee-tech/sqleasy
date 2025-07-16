import { DefaultBuilder } from "../../builder/default_builder";
import type { MssqlConfiguration } from "./mssql_configuration";
import { MssqlJoinOnBuilder } from "./mssql_join_on_builder";
import { MssqlParser } from "./mssql_parser";

export class MssqlBuilder extends DefaultBuilder<MssqlBuilder, MssqlJoinOnBuilder, MssqlParser> {
   private _mssqlConfig: MssqlConfiguration;

   constructor(config: MssqlConfiguration) {
      super(config);
      this._mssqlConfig = config;
   }

   public override newBuilder = (): MssqlBuilder => {
      return new MssqlBuilder(this._mssqlConfig);
   };

   public override newJoinOnBuilder = (): MssqlJoinOnBuilder => {
      return new MssqlJoinOnBuilder(this._mssqlConfig);
   };

   public override newParser = (): MssqlParser => {
      return new MssqlParser(this._mssqlConfig);
   };

   public clearTop = (): MssqlBuilder => {
      delete this.state().customState["top"];
      return this;
   };

   public top = (top: number): MssqlBuilder => {
      this.state().customState["top"] = top;
      return this;
   };
}
