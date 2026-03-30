import { DefaultJoinOnBuilder } from "../../builder/default_join_on_builder";
import type { IConfiguration } from "../../configuration/interface_configuration";
import type { MysqlConfiguration } from "./mysql_configuration";

export class MysqlJoinOnBuilder extends DefaultJoinOnBuilder<MysqlJoinOnBuilder> {
   private _mysqlConfig: MysqlConfiguration;

   constructor(config: MysqlConfiguration) {
      super(config);
      this._mysqlConfig = config;
   }

   public override newJoinOnBuilder = (config?: IConfiguration): MysqlJoinOnBuilder => {
      return new MysqlJoinOnBuilder((config ?? this._mysqlConfig) as MysqlConfiguration);
   };
}
