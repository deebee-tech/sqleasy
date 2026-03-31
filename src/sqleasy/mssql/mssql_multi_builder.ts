import { DefaultMultiBuilder } from "../../builder/default_multi_builder";
import { MssqlBuilder } from "./mssql_builder";
import type { MssqlConfiguration } from "./mssql_configuration";
import type { MssqlJoinOnBuilder } from "./mssql_join_on_builder";
import { MssqlParser } from "./mssql_parser";

/** MSSQL {@link DefaultMultiBuilder} for batching multiple statements with shared configuration. */
export class MssqlMultiBuilder extends DefaultMultiBuilder<MssqlBuilder, MssqlJoinOnBuilder, MssqlParser> {
   private _mssqlConfiguration: MssqlConfiguration;

   /** @param config - MSSQL dialect configuration shared by child builders and parsers. */
   constructor(config: MssqlConfiguration) {
      super(config);
      this._mssqlConfiguration = config;
   }

   /** Creates a fresh {@link MssqlBuilder} using this multi-builder’s configuration. */
   public override newBuilder = (): MssqlBuilder => {
      return new MssqlBuilder(this._mssqlConfiguration);
   };

   /** Creates a fresh {@link MssqlParser} using this multi-builder’s configuration. */
   public override newParser = (): MssqlParser => {
      return new MssqlParser(this._mssqlConfiguration);
   };
}
