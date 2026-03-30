import type { IConfiguration } from "../configuration/interface_configuration";
import { BuilderType } from "../enums/builder_type";
import { ParserArea } from "../enums/parser_area";
import type { ParserMode } from "../enums/parser_mode";
import { ParserError } from "../helpers/parser_error";
import { SqlHelper } from "../helpers/sql_helper";
import type { SqlEasyState } from "../state/sqleasy_state";

export const defaultUpdate = (state: SqlEasyState, config: IConfiguration, mode: ParserMode): SqlHelper => {
   const sqlHelper = new SqlHelper(config, mode);

   if (state.fromStates.length === 0) {
      throw new ParserError(ParserArea.General, "UPDATE requires a table");
   }

   if (state.updateStates.length === 0) {
      throw new ParserError(ParserArea.General, "UPDATE requires at least one SET column");
   }

   sqlHelper.addSqlSnippet("UPDATE ");

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

   sqlHelper.addSqlSnippet(" SET ");

   for (let i = 0; i < state.updateStates.length; i++) {
      const updateState = state.updateStates[i];

      if (updateState.builderType === BuilderType.UpdateRaw) {
         sqlHelper.addSqlSnippet(updateState.raw ?? "");
      } else if (updateState.builderType === BuilderType.UpdateColumn) {
         sqlHelper.addSqlSnippet(
            config.identifierDelimiters().begin + updateState.columnName + config.identifierDelimiters().end,
         );
         sqlHelper.addSqlSnippet(" = ");
         sqlHelper.addSqlSnippet(sqlHelper.addDynamicValue(updateState.value));
      }

      if (i < state.updateStates.length - 1) {
         sqlHelper.addSqlSnippet(", ");
      }
   }

   return sqlHelper;
};
