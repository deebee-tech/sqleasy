import type { IConfiguration } from "../configuration/interface_configuration";
import { BuilderType } from "../enums/builder_type";
import { ParserArea } from "../enums/parser_area";
import type { ParserMode } from "../enums/parser_mode";
import { WhereOperator } from "../enums/where_operator";
import { ParserError } from "../helpers/parser_error";
import { SqlHelper } from "../helpers/sql_helper";
import type { SqlEasyState } from "../state/sqleasy_state";

export const defaultHaving = (state: SqlEasyState, config: IConfiguration, mode: ParserMode): SqlHelper => {
   const sqlHelper = new SqlHelper(config, mode);

   if (state.havingStates.length === 0) {
      return sqlHelper;
   }

   if (state.groupByStates.length === 0) {
      throw new ParserError(ParserArea.General, "HAVING requires a GROUP BY clause");
   }

   sqlHelper.addSqlSnippet("HAVING ");

   for (let i = 0; i < state.havingStates.length; i++) {
      const havingState = state.havingStates[i];

      if (i === 0 && (havingState.builderType === BuilderType.And || havingState.builderType === BuilderType.Or)) {
         throw new ParserError(ParserArea.General, "First HAVING operator cannot be AND or OR");
      }

      if (havingState.builderType === BuilderType.And) {
         sqlHelper.addSqlSnippet("AND ");
         continue;
      }

      if (havingState.builderType === BuilderType.Or) {
         sqlHelper.addSqlSnippet("OR ");
         continue;
      }

      if (havingState.builderType === BuilderType.HavingRaw) {
         sqlHelper.addSqlSnippet(havingState.raw ?? "");

         if (i < state.havingStates.length - 1) {
            sqlHelper.addSqlSnippet(" ");
         }
         continue;
      }

      if (havingState.builderType === BuilderType.Having) {
         sqlHelper.addSqlSnippet(
            config.identifierDelimiters().begin + havingState.tableNameOrAlias + config.identifierDelimiters().end,
         );
         sqlHelper.addSqlSnippet(".");
         sqlHelper.addSqlSnippet(
            config.identifierDelimiters().begin + havingState.columnName + config.identifierDelimiters().end,
         );
         sqlHelper.addSqlSnippet(" ");

         switch (havingState.whereOperator) {
            case WhereOperator.Equals:
               sqlHelper.addSqlSnippet("=");
               break;
            case WhereOperator.NotEquals:
               sqlHelper.addSqlSnippet("<>");
               break;
            case WhereOperator.GreaterThan:
               sqlHelper.addSqlSnippet(">");
               break;
            case WhereOperator.GreaterThanOrEquals:
               sqlHelper.addSqlSnippet(">=");
               break;
            case WhereOperator.LessThan:
               sqlHelper.addSqlSnippet("<");
               break;
            case WhereOperator.LessThanOrEquals:
               sqlHelper.addSqlSnippet("<=");
               break;
         }

         sqlHelper.addSqlSnippet(" ");
         sqlHelper.addSqlSnippet(sqlHelper.addDynamicValue(havingState.values[0]));

         if (i < state.havingStates.length - 1) {
            sqlHelper.addSqlSnippet(" ");
         }
         continue;
      }
   }

   return sqlHelper;
};
