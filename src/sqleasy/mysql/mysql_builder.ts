import { DefaultBuilder } from "../../builder/default_builder";
import type { MysqlConfiguration } from "./mysql_configuration";
import { MysqlJoinOnBuilder } from "./mysql_join_on_builder";
import { MysqlParser } from "./mysql_parser";

export class MysqlBuilder extends DefaultBuilder<MysqlBuilder, MysqlJoinOnBuilder, MysqlParser> {
   private _mysqlConfig: MysqlConfiguration;

   constructor(config: MysqlConfiguration) {
      super(config);
      this._mysqlConfig = config;
   }

   public override newBuilder = (): MysqlBuilder => {
      return new MysqlBuilder(this._mysqlConfig);
   };

   public override newJoinOnBuilder = (): MysqlJoinOnBuilder => {
      return new MysqlJoinOnBuilder(this._mysqlConfig);
   };

   public override newParser = (): MysqlParser => {
      return new MysqlParser(this._mysqlConfig);
   };
}
