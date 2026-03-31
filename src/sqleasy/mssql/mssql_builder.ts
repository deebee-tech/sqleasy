import { DefaultBuilder } from "../../builder/default_builder";
import type { IConfiguration } from "../../configuration/interface_configuration";
import type { MssqlConfiguration } from "./mssql_configuration";
import { MssqlJoinOnBuilder } from "./mssql_join_on_builder";
import { MssqlParser } from "./mssql_parser";

/** MSSQL {@link DefaultBuilder}; creates dialect parsers and join-on builders and supports `TOP`. */
export class MssqlBuilder extends DefaultBuilder<MssqlBuilder, MssqlJoinOnBuilder, MssqlParser> {
   private _mssqlConfig: MssqlConfiguration;

   /** @param config - MSSQL dialect configuration used for SQL generation. */
   constructor(config: MssqlConfiguration) {
      super(config);
      this._mssqlConfig = config;
   }

   /** Returns a new builder, reusing this configuration unless `config` is provided. */
   public override newBuilder = (config?: IConfiguration): MssqlBuilder => {
      return new MssqlBuilder((config ?? this._mssqlConfig) as MssqlConfiguration);
   };

   /** Returns a new join-on builder for this dialect. */
   public override newJoinOnBuilder = (config?: IConfiguration): MssqlJoinOnBuilder => {
      return new MssqlJoinOnBuilder((config ?? this._mssqlConfig) as MssqlConfiguration);
   };

   /** Returns a new MSSQL parser instance. */
   public override newParser = (config?: IConfiguration): MssqlParser => {
      return new MssqlParser((config ?? this._mssqlConfig) as MssqlConfiguration);
   };

   /** Removes a previously set `TOP` limit from builder state. */
   public clearTop = (): MssqlBuilder => {
      if (this.state().customState) {
         delete this.state().customState["top"];
      }
      return this;
   };

   /** Sets the `TOP` row limit for the generated `SELECT`. */
   public top = (top: number): MssqlBuilder => {
      if (!this.state().customState) {
         this.state().customState = {};
      }
      this.state().customState["top"] = top;
      return this;
   };
}
