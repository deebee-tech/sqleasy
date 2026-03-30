import { MultiBuilderTransactionState } from "../../enums/multi_builder_transaction_state";
import { ParserMode } from "../../enums/parser_mode";
import { SqlHelper } from "../../helpers/sql_helper";
import { DefaultParser } from "../../parser/default_parser";
import { defaultToSql } from "../../parser/default_to_sql";
import type { SqlEasyState } from "../../state/sqleasy_state";
import type { MysqlConfiguration } from "./mysql_configuration";

export class MysqlParser extends DefaultParser {
   private _mysqlConfiguration: MysqlConfiguration;

   constructor(config: MysqlConfiguration) {
      super(config);
      this._mysqlConfiguration = config;
   }

   public override toSql = (state: SqlEasyState): string => {
      const sqlHelper = defaultToSql(state, this._mysqlConfiguration, ParserMode.Prepared);
      return sqlHelper.getSql();
   };

   public override toSqlMulti = (states: SqlEasyState[], transactionState: MultiBuilderTransactionState): string => {
      const finalString = new SqlHelper(this._mysqlConfiguration, ParserMode.Prepared);

      if (transactionState === MultiBuilderTransactionState.TransactionOn) {
         finalString.addSqlSnippet(this._mysqlConfiguration.transactionDelimiters().begin + "; ");
      }

      for (const state of states) {
         const sql = this.toSql(state);
         finalString.addSqlSnippet(sql);
      }

      if (transactionState === MultiBuilderTransactionState.TransactionOn) {
         finalString.addSqlSnippet(this._mysqlConfiguration.transactionDelimiters().end + ";");
      }

      return finalString.getSql();
   };
}
