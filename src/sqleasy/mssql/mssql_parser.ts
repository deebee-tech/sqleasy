import type { IConfiguration } from "../../configuration/interface_configuration";
import { MultiBuilderTransactionState } from "../../enums/multi_builder_transaction_state";
import { ParserArea } from "../../enums/parser_area";
import { ParserMode } from "../../enums/parser_mode";
import { ParserError } from "../../helpers/parser_error";
import { SqlHelper } from "../../helpers/sql_helper";
import { DefaultParser } from "../../parser/default_parser";
import type { ToSqlOptions } from "../../parser/default_to_sql";
import { defaultToSql } from "../../parser/default_to_sql";
import type { SqlEasyState } from "../../state/sqleasy_state";
import type { MssqlConfiguration } from "./mssql_configuration";

export class MssqlParser extends DefaultParser {
   private _mssqlConfiguration: MssqlConfiguration;

   constructor(config: MssqlConfiguration) {
      super(config);
      this._mssqlConfiguration = config;
   }

   protected override getToSqlOptions(): ToSqlOptions {
      return {
         beforeSelectColumns: (state: SqlEasyState, config: IConfiguration, sqlHelper: SqlHelper) => {
            if (
               state.customState !== null &&
               state.customState !== undefined &&
               state.customState["top"] !== null &&
               state.customState["top"] !== undefined &&
               state.customState["top"] > 0
            ) {
               sqlHelper.addSqlSnippet("TOP ");
               sqlHelper.addSqlSnippet(`(${state.customState["top"]})`);
               sqlHelper.addSqlSnippet(" ");
            } else if (
               !state.isInnerStatement &&
               state.limit === 0 &&
               (!state.whereStates || state.whereStates.length === 0)
            ) {
               sqlHelper.addSqlSnippet("TOP ");
               sqlHelper.addSqlSnippet(`(${config.runtimeConfiguration().maxRowsReturned})`);
               sqlHelper.addSqlSnippet(" ");
            }
         },
      };
   }

   public override toSql = (state: SqlEasyState): string => {
      const paramsString = new SqlHelper(this._mssqlConfiguration, ParserMode.Prepared);
      const finalString = new SqlHelper(this._mssqlConfiguration, ParserMode.Prepared);

      const sqlHelper = defaultToSql(state, this._mssqlConfiguration, ParserMode.Prepared, this.getToSqlOptions());

      let sql = sqlHelper.getSql();
      sql = sql.replaceAll("'", "''");

      if (sql.length > 4000) {
         throw new ParserError(ParserArea.General, "SQL string is too long for Mssql prepared statement");
      }

      let valueCounter: number = 0;

      for (const value of sqlHelper.getValues()) {
         const valuePosition = sql.indexOf(this._mssqlConfiguration.preparedStatementPlaceholder());

         if (valuePosition === -1) {
            break;
         }

         sql = sql.slice(0, valuePosition) + "@p" + valueCounter + sql.slice(valuePosition + 1);

         if (valueCounter > 0) {
            paramsString.addSqlSnippet(", ");
         }

         paramsString.addSqlSnippet("@p" + valueCounter + " " + this.getParameterType(value));

         valueCounter++;
      }

      if (paramsString.getSql().length > 4000) {
         throw new ParserError(ParserArea.General, "SQL string is too long for Mssql prepared statement");
      }

      finalString.addSqlSnippet("SET NOCOUNT ON; ");
      finalString.addSqlSnippet("exec sp_executesql N'");
      finalString.addSqlSnippet(sql);
      finalString.addSqlSnippet("', N'");
      finalString.addSqlSnippet(paramsString.getSql());
      finalString.addSqlSnippet("', ");

      for (let i = 0; i < sqlHelper.getValues().length; i++) {
         if (i > 0) {
            finalString.addSqlSnippet(", ");
         }

         finalString.addSqlSnippet("@p" + i + " = " + finalString.getValueStringFromDataType(sqlHelper.getValues()[i]));
      }

      finalString.addSqlSnippet(";");

      return finalString.getSql();
   };

   public override toSqlMulti = (states: SqlEasyState[], transactionState: MultiBuilderTransactionState): string => {
      const finalString = new SqlHelper(this._mssqlConfiguration, ParserMode.Prepared);

      if (transactionState === MultiBuilderTransactionState.TransactionOn) {
         finalString.addSqlSnippet(this._mssqlConfiguration.transactionDelimiters().begin + "; ");
      }

      for (const state of states) {
         const sql = this.toSql(state);
         finalString.addSqlSnippet(sql + " ");
      }

      if (transactionState === MultiBuilderTransactionState.TransactionOn) {
         finalString.addSqlSnippet(this._mssqlConfiguration.transactionDelimiters().end + ";");
      }

      return finalString.getSql();
   };

   private getParameterType = (value: any): string => {
      const typeOf = typeof value;

      switch (typeOf) {
         case "string":
            return "nvarchar(max)";
         case "number":
            if (Number.isInteger(value)) {
               if (value >= -128 && value <= 127) {
                  return "tinyint";
               } else if (value >= -32768 && value <= 32767) {
                  return "smallint";
               } else if (value >= -2147483648 && value <= 2147483647) {
                  return "int";
               } else {
                  return "bigint";
               }
            } else {
               return "float";
            }
         case "boolean":
            return "bit";
         default:
            return "nvarchar(max)";
      }
   };
}
