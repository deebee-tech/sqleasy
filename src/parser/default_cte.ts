import type { IConfiguration } from "../configuration/interface_configuration";
import { BuilderType } from "../enums/builder_type";
import type { ParserMode } from "../enums/parser_mode";
import { SqlHelper } from "../helpers/sql_helper";
import type { SqlEasyState } from "../state/sqleasy_state";
import { defaultToSql } from "./default_to_sql";

export const defaultCte = (state: SqlEasyState, config: IConfiguration, mode: ParserMode): SqlHelper => {
   const sqlHelper = new SqlHelper(config, mode);

   if (state.cteStates.length === 0) {
      return sqlHelper;
   }

   const hasRecursive = state.cteStates.some((cte) => cte.recursive);

   if (hasRecursive) {
      sqlHelper.addSqlSnippet("WITH RECURSIVE ");
   } else {
      sqlHelper.addSqlSnippet("WITH ");
   }

   for (let i = 0; i < state.cteStates.length; i++) {
      const cteState = state.cteStates[i];

      sqlHelper.addSqlSnippet(config.identifierDelimiters().begin + cteState.name + config.identifierDelimiters().end);
      sqlHelper.addSqlSnippet(" AS (");

      if (cteState.builderType === BuilderType.CteRaw) {
         sqlHelper.addSqlSnippet(cteState.raw ?? "");
      } else if (cteState.sqlEasyState) {
         const subHelper = defaultToSql(cteState.sqlEasyState, config, mode);
         sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
      }

      sqlHelper.addSqlSnippet(")");

      if (i < state.cteStates.length - 1) {
         sqlHelper.addSqlSnippet(", ");
      } else {
         sqlHelper.addSqlSnippet(" ");
      }
   }

   return sqlHelper;
};
