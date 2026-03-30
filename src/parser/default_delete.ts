import type { IConfiguration } from "../configuration/interface_configuration";
import { ParserArea } from "../enums/parser_area";
import type { ParserMode } from "../enums/parser_mode";
import { ParserError } from "../helpers/parser_error";
import { SqlHelper } from "../helpers/sql_helper";
import type { SqlEasyState } from "../state/sqleasy_state";

export const defaultDelete = (state: SqlEasyState, config: IConfiguration, mode: ParserMode): SqlHelper => {
   const sqlHelper = new SqlHelper(config, mode);

   if (state.fromStates.length === 0) {
      throw new ParserError(ParserArea.General, "DELETE requires a table");
   }

   sqlHelper.addSqlSnippet("DELETE FROM ");

   const fromState = state.fromStates[0];

   if (fromState.owner && fromState.owner !== "") {
      sqlHelper.addSqlSnippet(
         config.identifierDelimiters().begin + fromState.owner + config.identifierDelimiters().end,
      );
      sqlHelper.addSqlSnippet(".");
   }

   sqlHelper.addSqlSnippet(
      config.identifierDelimiters().begin + fromState.tableName + config.identifierDelimiters().end,
   );

   if (fromState.alias && fromState.alias !== "") {
      sqlHelper.addSqlSnippet(" AS ");
      sqlHelper.addSqlSnippet(
         config.identifierDelimiters().begin + fromState.alias + config.identifierDelimiters().end,
      );
   }

   return sqlHelper;
};
