import type { IConfiguration } from "../configuration/interface_configuration";
import { BuilderType } from "../enums/builder_type";
import { OrderByDirection } from "../enums/order_by_direction";
import type { ParserMode } from "../enums/parser_mode";
import { SqlHelper } from "../helpers/sql_helper";
import type { SqlEasyState } from "../state/sqleasy_state";

export const defaultOrderBy = (state: SqlEasyState, config: IConfiguration, mode: ParserMode): SqlHelper => {
   const sqlHelper = new SqlHelper(config, mode);

   if (state.orderByStates.length === 0) {
      return sqlHelper;
   }

   sqlHelper.addSqlSnippet("ORDER BY ");

   state.orderByStates.forEach((orderByState, i) => {
      if (orderByState.builderType === BuilderType.OrderByRaw) {
         sqlHelper.addSqlSnippet(orderByState.raw ?? "");

         if (i < state.orderByStates.length - 1) {
            sqlHelper.addSqlSnippet(", ");
         }

         return;
      }

      if (orderByState.builderType === BuilderType.OrderByColumn) {
         sqlHelper.addSqlSnippet(
            config.identifierDelimiters().begin + orderByState.tableNameOrAlias + config.identifierDelimiters().end,
         );
         sqlHelper.addSqlSnippet(".");
         sqlHelper.addSqlSnippet(
            config.identifierDelimiters().begin + orderByState.columnName + config.identifierDelimiters().end,
         );

         if (orderByState.direction === OrderByDirection.Ascending) {
            sqlHelper.addSqlSnippet(" ASC");
         } else {
            sqlHelper.addSqlSnippet(" DESC");
         }

         if (i < state.orderByStates.length - 1) {
            sqlHelper.addSqlSnippet(", ");
         }

         return;
      }
   });

   return sqlHelper;
};
