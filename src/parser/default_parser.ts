import type { IConfiguration } from "../configuration/interface_configuration";
import { MultiBuilderTransactionState } from "../enums/multi_builder_transaction_state";
import { ParserMode } from "../enums/parser_mode";
import type { SqlEasyState } from "../state/sqleasy_state";
import { defaultToSql } from "./default_to_sql";

export abstract class DefaultParser {
   private _config: IConfiguration;

   constructor(config: IConfiguration) {
      this._config = config;
   }

   public abstract toSql(state: SqlEasyState): string;
   public abstract toSqlMulti(states: SqlEasyState[], transactionState: MultiBuilderTransactionState): string;

   public toSqlRaw = (state: SqlEasyState): string => {
      const sqlHelper = defaultToSql(state, this._config, ParserMode.Raw);
      return sqlHelper.getSqlDebug();
   };

   public toSqlMultiRaw = (states: SqlEasyState[], transactionState: MultiBuilderTransactionState): string => {
      let sqlRaw = "";

      if (transactionState === MultiBuilderTransactionState.TransactionOn) {
         sqlRaw += this._config.transactionDelimiters().begin + "; ";
      }

      for (const state of states) {
         const sql = this.toSqlRaw(state);
         sqlRaw += sql;
      }

      if (transactionState === MultiBuilderTransactionState.TransactionOn) {
         sqlRaw += this._config.transactionDelimiters().end + "; ";
      }

      return sqlRaw;
   };
}
