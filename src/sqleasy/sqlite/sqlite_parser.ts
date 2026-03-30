import { MultiBuilderTransactionState } from "../../enums/multi_builder_transaction_state";
import { ParserMode } from "../../enums/parser_mode";
import { SqlHelper } from "../../helpers/sql_helper";
import { DefaultParser } from "../../parser/default_parser";
import { defaultToSql } from "../../parser/default_to_sql";
import type { SqlEasyState } from "../../state/sqleasy_state";
import type { SqliteConfiguration } from "./sqlite_configuration";

export class SqliteParser extends DefaultParser {
   private _sqliteConfiguration: SqliteConfiguration;

   constructor(config: SqliteConfiguration) {
      super(config);
      this._sqliteConfiguration = config;
   }

   public override toSql = (state: SqlEasyState): string => {
      const sqlHelper = defaultToSql(state, this._sqliteConfiguration, ParserMode.Prepared);
      return sqlHelper.getSql();
   };

   public override toSqlMulti = (states: SqlEasyState[], transactionState: MultiBuilderTransactionState): string => {
      const finalString = new SqlHelper(this._sqliteConfiguration, ParserMode.Prepared);

      if (transactionState === MultiBuilderTransactionState.TransactionOn) {
         finalString.addSqlSnippet(this._sqliteConfiguration.transactionDelimiters().begin + "; ");
      }

      for (const state of states) {
         const sql = this.toSql(state);
         finalString.addSqlSnippet(sql);
      }

      if (transactionState === MultiBuilderTransactionState.TransactionOn) {
         finalString.addSqlSnippet(this._sqliteConfiguration.transactionDelimiters().end + ";");
      }

      return finalString.getSql();
   };
}
