import type { IConfiguration } from "../configuration/interface_configuration";
import { BuilderType } from "../enums/builder_type";
import type { ParserMode } from "../enums/parser_mode";
import { SqlHelper } from "../helpers/sql_helper";
import type { SqlEasyState } from "../state/sqleasy_state";

export const defaultGroupBy = (state: SqlEasyState, config: IConfiguration, mode: ParserMode): SqlHelper => {
   const sqlHelper = new SqlHelper(config, mode);

   if (state.groupByStates.length === 0) {
      return sqlHelper;
   }

   sqlHelper.addSqlSnippet("GROUP BY ");

   state.groupByStates.forEach((groupByState, i) => {
      if (groupByState.builderType === BuilderType.GroupByRaw) {
         sqlHelper.addSqlSnippet(groupByState.raw ?? "");

         if (i < state.groupByStates.length - 1) {
            sqlHelper.addSqlSnippet(", ");
         }

         return;
      }

      if (groupByState.builderType === BuilderType.GroupByColumn) {
         sqlHelper.addSqlSnippet(
            config.identifierDelimiters().begin + groupByState.tableNameOrAlias + config.identifierDelimiters().end,
         );
         sqlHelper.addSqlSnippet(".");
         sqlHelper.addSqlSnippet(
            config.identifierDelimiters().begin + groupByState.columnName + config.identifierDelimiters().end,
         );

         if (i < state.groupByStates.length - 1) {
            sqlHelper.addSqlSnippet(", ");
         }

         return;
      }
   });

   return sqlHelper;
};
