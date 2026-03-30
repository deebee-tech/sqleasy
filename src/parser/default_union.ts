import type { IConfiguration } from "../configuration/interface_configuration";
import { BuilderType } from "../enums/builder_type";
import type { ParserMode } from "../enums/parser_mode";
import { SqlHelper } from "../helpers/sql_helper";
import type { SqlEasyState } from "../state/sqleasy_state";
import type { ToSqlOptions } from "./default_to_sql";
import { defaultToSql } from "./default_to_sql";

export const defaultUnion = (
   state: SqlEasyState,
   config: IConfiguration,
   mode: ParserMode,
   options?: ToSqlOptions,
): SqlHelper => {
   const sqlHelper = new SqlHelper(config, mode);

   if (state.unionStates.length === 0) {
      return sqlHelper;
   }

   for (let i = 0; i < state.unionStates.length; i++) {
      const unionState = state.unionStates[i];

      switch (unionState.builderType) {
         case BuilderType.Union:
            sqlHelper.addSqlSnippet("UNION ");
            break;
         case BuilderType.UnionAll:
            sqlHelper.addSqlSnippet("UNION ALL ");
            break;
         case BuilderType.Intersect:
            sqlHelper.addSqlSnippet("INTERSECT ");
            break;
         case BuilderType.Except:
            sqlHelper.addSqlSnippet("EXCEPT ");
            break;
      }

      if (unionState.raw) {
         sqlHelper.addSqlSnippet(unionState.raw);
      } else if (unionState.sqlEasyState) {
         const subHelper = defaultToSql(unionState.sqlEasyState, config, mode, options);
         sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
      }

      if (i < state.unionStates.length - 1) {
         sqlHelper.addSqlSnippet(" ");
      }
   }

   return sqlHelper;
};
