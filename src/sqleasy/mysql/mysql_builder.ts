import { DefaultBuilder } from "../../builder/default_builder";
import type { IConfiguration } from "../../configuration/interface_configuration";
import type { MysqlConfiguration } from "./mysql_configuration";
import { MysqlJoinOnBuilder } from "./mysql_join_on_builder";
import { MysqlParser } from "./mysql_parser";

export class MysqlBuilder extends DefaultBuilder<MysqlBuilder, MysqlJoinOnBuilder, MysqlParser> {
   private _mysqlConfig: MysqlConfiguration;

   constructor(config: MysqlConfiguration) {
      super(config);
      this._mysqlConfig = config;
   }

   public override newBuilder = (config?: IConfiguration): MysqlBuilder => {
      return new MysqlBuilder((config ?? this._mysqlConfig) as MysqlConfiguration);
   };

   public override newJoinOnBuilder = (config?: IConfiguration): MysqlJoinOnBuilder => {
      return new MysqlJoinOnBuilder((config ?? this._mysqlConfig) as MysqlConfiguration);
   };

   public override newParser = (config?: IConfiguration): MysqlParser => {
      return new MysqlParser((config ?? this._mysqlConfig) as MysqlConfiguration);
   };
}
