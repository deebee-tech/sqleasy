import type { IConfiguration } from "../configuration/interface_configuration";
import { ParserArea } from "../enums/parser_area";
import type { ParserMode } from "../enums/parser_mode";
import { ParserError } from "../helpers/parser_error";
import { SqlHelper } from "../helpers/sql_helper";
import type { SqlEasyState } from "../state/sqleasy_state";

export const defaultInsert = (state: SqlEasyState, config: IConfiguration, mode: ParserMode): SqlHelper => {
   const sqlHelper = new SqlHelper(config, mode);

   if (!state.insertState) {
      throw new ParserError(ParserArea.General, "No insert state provided");
   }

   const insertState = state.insertState;

   if (insertState.raw) {
      sqlHelper.addSqlSnippet(insertState.raw);
      return sqlHelper;
   }

   sqlHelper.addSqlSnippet("INSERT INTO ");

   if (insertState.owner && insertState.owner !== "") {
      sqlHelper.addSqlSnippet(
         config.identifierDelimiters().begin + insertState.owner + config.identifierDelimiters().end,
      );
      sqlHelper.addSqlSnippet(".");
   }

   sqlHelper.addSqlSnippet(
      config.identifierDelimiters().begin + insertState.tableName + config.identifierDelimiters().end,
   );

   if (insertState.columns.length > 0) {
      sqlHelper.addSqlSnippet(" (");
      for (let i = 0; i < insertState.columns.length; i++) {
         sqlHelper.addSqlSnippet(
            config.identifierDelimiters().begin + insertState.columns[i] + config.identifierDelimiters().end,
         );

         if (i < insertState.columns.length - 1) {
            sqlHelper.addSqlSnippet(", ");
         }
      }
      sqlHelper.addSqlSnippet(")");
   }

   if (insertState.values.length > 0) {
      sqlHelper.addSqlSnippet(" VALUES ");

      for (let r = 0; r < insertState.values.length; r++) {
         sqlHelper.addSqlSnippet("(");

         for (let c = 0; c < insertState.values[r].length; c++) {
            sqlHelper.addSqlSnippet(sqlHelper.addDynamicValue(insertState.values[r][c]));

            if (c < insertState.values[r].length - 1) {
               sqlHelper.addSqlSnippet(", ");
            }
         }

         sqlHelper.addSqlSnippet(")");

         if (r < insertState.values.length - 1) {
            sqlHelper.addSqlSnippet(", ");
         }
      }
   }

   return sqlHelper;
};
