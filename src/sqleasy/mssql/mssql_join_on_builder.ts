import { DefaultJoinOnBuilder } from "../../builder/default_join_on_builder";
import type { MssqlConfiguration } from "./mssql_configuration";

export class MssqlJoinOnBuilder extends DefaultJoinOnBuilder<MssqlJoinOnBuilder> {
   private _mssqlConfiguration: MssqlConfiguration;

   constructor(config: MssqlConfiguration) {
      super(config);
      this._mssqlConfiguration = config;
   }

   public override newJoinOnBuilder = (): MssqlJoinOnBuilder => {
      return new MssqlJoinOnBuilder(this._mssqlConfiguration);
   };
}
