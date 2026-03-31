import { DefaultJoinOnBuilder } from "../../builder/default_join_on_builder";
import type { IConfiguration } from "../../configuration/interface_configuration";
import type { MssqlConfiguration } from "./mssql_configuration";

/** MSSQL {@link DefaultJoinOnBuilder} for constructing `JOIN ... ON` fragments. */
export class MssqlJoinOnBuilder extends DefaultJoinOnBuilder<MssqlJoinOnBuilder> {
   private _mssqlConfiguration: MssqlConfiguration;

   /** @param config - MSSQL dialect configuration used when emitting join conditions. */
   constructor(config: MssqlConfiguration) {
      super(config);
      this._mssqlConfiguration = config;
   }

   /** Returns a new join-on builder, reusing this configuration unless `config` is provided. */
   public override newJoinOnBuilder = (config?: IConfiguration): MssqlJoinOnBuilder => {
      return new MssqlJoinOnBuilder((config ?? this._mssqlConfiguration) as MssqlConfiguration);
   };
}
