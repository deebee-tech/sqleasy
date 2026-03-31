import { DefaultMultiBuilder } from "../../builder/default_multi_builder";
import { MysqlBuilder } from "./mysql_builder";
import type { MysqlConfiguration } from "./mysql_configuration";
import type { MysqlJoinOnBuilder } from "./mysql_join_on_builder";
import { MysqlParser } from "./mysql_parser";

/** MySQL {@link DefaultMultiBuilder} for batching multiple statements with shared configuration. */
export class MysqlMultiBuilder extends DefaultMultiBuilder<MysqlBuilder, MysqlJoinOnBuilder, MysqlParser> {
   private _mysqlConfig: MysqlConfiguration;

   /** @param config - MySQL dialect configuration shared by child builders and parsers. */
   constructor(config: MysqlConfiguration) {
      super(config);
      this._mysqlConfig = config;
   }

   /** Creates a fresh {@link MysqlBuilder} using this multi-builder’s configuration. */
   public override newBuilder = (): MysqlBuilder => {
      return new MysqlBuilder(this._mysqlConfig);
   };

   /** Creates a fresh {@link MysqlParser} using this multi-builder’s configuration. */
   public override newParser = (): MysqlParser => {
      return new MysqlParser(this._mysqlConfig);
   };
}
