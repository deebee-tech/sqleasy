import { DefaultJoinOnBuilder } from "../../builder/default_join_on_builder";
import type { IConfiguration } from "../../configuration/interface_configuration";
import type { MysqlConfiguration } from "./mysql_configuration";

/** MySQL {@link DefaultJoinOnBuilder} for constructing `JOIN ... ON` fragments. */
export class MysqlJoinOnBuilder extends DefaultJoinOnBuilder<MysqlJoinOnBuilder> {
   private _mysqlConfig: MysqlConfiguration;

   /** @param config - MySQL dialect configuration used when emitting join conditions. */
   constructor(config: MysqlConfiguration) {
      super(config);
      this._mysqlConfig = config;
   }

   /** Returns a new join-on builder, reusing this configuration unless `config` is provided. */
   public override newJoinOnBuilder = (config?: IConfiguration): MysqlJoinOnBuilder => {
      return new MysqlJoinOnBuilder((config ?? this._mysqlConfig) as MysqlConfiguration);
   };
}
