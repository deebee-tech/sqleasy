import { DefaultBuilder } from "../../builder/default_builder";
import type { IConfiguration } from "../../configuration/interface_configuration";
import type { MysqlConfiguration } from "./mysql_configuration";
import { MysqlJoinOnBuilder } from "./mysql_join_on_builder";
import { MysqlParser } from "./mysql_parser";

/** MySQL {@link DefaultBuilder}; creates dialect parsers and join-on builders. */
export class MysqlBuilder extends DefaultBuilder<MysqlBuilder, MysqlJoinOnBuilder, MysqlParser> {
   private _mysqlConfig: MysqlConfiguration;

   /** @param config - MySQL dialect configuration used for SQL generation. */
   constructor(config: MysqlConfiguration) {
      super(config);
      this._mysqlConfig = config;
   }

   /** Returns a new builder, reusing this configuration unless `config` is provided. */
   public override newBuilder = (config?: IConfiguration): MysqlBuilder => {
      return new MysqlBuilder((config ?? this._mysqlConfig) as MysqlConfiguration);
   };

   /** Returns a new join-on builder for this dialect. */
   public override newJoinOnBuilder = (config?: IConfiguration): MysqlJoinOnBuilder => {
      return new MysqlJoinOnBuilder((config ?? this._mysqlConfig) as MysqlConfiguration);
   };

   /** Returns a new MySQL parser instance. */
   public override newParser = (config?: IConfiguration): MysqlParser => {
      return new MysqlParser((config ?? this._mysqlConfig) as MysqlConfiguration);
   };
}
