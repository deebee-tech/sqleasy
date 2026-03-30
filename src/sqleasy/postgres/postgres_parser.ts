import { MultiBuilderTransactionState } from "../../enums/multi_builder_transaction_state";
import { ParserMode } from "../../enums/parser_mode";
import { SqlHelper } from "../../helpers/sql_helper";
import { DefaultParser } from "../../parser/default_parser";
import { defaultToSql } from "../../parser/default_to_sql";
import type { SqlEasyState } from "../../state/sqleasy_state";
import type { PostgresConfiguration } from "./postgres_configuration";

export class PostgresParser extends DefaultParser {
   private _postgresConfiguration: PostgresConfiguration;

   constructor(config: PostgresConfiguration) {
      super(config);
      this._postgresConfiguration = config;
   }

   public override toSql = (state: SqlEasyState): string => {
      const sqlHelper = defaultToSql(state, this._postgresConfiguration, ParserMode.Prepared);

      let sql = sqlHelper.getSql();
      const placeholder = this._postgresConfiguration.preparedStatementPlaceholder();
      let paramIndex = 1;
      let searchFrom = 0;

      while (true) {
         const pos = sql.indexOf(placeholder, searchFrom);
         if (pos === -1) break;

         const replacement = "$" + paramIndex;
         sql = sql.slice(0, pos) + replacement + sql.slice(pos + placeholder.length);
         searchFrom = pos + replacement.length;
         paramIndex++;
      }

      return sql;
   };

   public override toSqlMulti = (states: SqlEasyState[], transactionState: MultiBuilderTransactionState): string => {
      const finalString = new SqlHelper(this._postgresConfiguration, ParserMode.Prepared);

      if (transactionState === MultiBuilderTransactionState.TransactionOn) {
         finalString.addSqlSnippet(this._postgresConfiguration.transactionDelimiters().begin + "; ");
      }

      for (const state of states) {
         const sql = this.toSql(state);
         finalString.addSqlSnippet(sql);
      }

      if (transactionState === MultiBuilderTransactionState.TransactionOn) {
         finalString.addSqlSnippet(this._postgresConfiguration.transactionDelimiters().end + ";");
      }

      return finalString.getSql();
   };
}
