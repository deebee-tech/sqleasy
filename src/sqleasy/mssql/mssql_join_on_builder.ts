import { DefaultJoinOnBuilder } from "../../builder/default_join_on_builder";
import type { IConfiguration } from "../../configuration/interface_configuration";
import type { MssqlConfiguration } from "./mssql_configuration";

export class MssqlJoinOnBuilder extends DefaultJoinOnBuilder<MssqlJoinOnBuilder> {
   private _mssqlConfiguration: MssqlConfiguration;

   constructor(config: MssqlConfiguration) {
      super(config);
      this._mssqlConfiguration = config;
   }

   public override newJoinOnBuilder = (config?: IConfiguration): MssqlJoinOnBuilder => {
      return new MssqlJoinOnBuilder((config ?? this._mssqlConfiguration) as MssqlConfiguration);
   };
}
