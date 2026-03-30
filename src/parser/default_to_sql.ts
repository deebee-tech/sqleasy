import type { IConfiguration } from "../configuration/interface_configuration";
import { ParserArea } from "../enums/parser_area";
import type { ParserMode } from "../enums/parser_mode";
import { QueryType } from "../enums/query_type";
import { ParserError } from "../helpers/parser_error";
import { SqlHelper } from "../helpers/sql_helper";
import type { SqlEasyState } from "../state/sqleasy_state";
import { defaultCte } from "./default_cte";
import { defaultDelete } from "./default_delete";
import { defaultFrom } from "./default_from";
import { defaultGroupBy } from "./default_group_by";
import { defaultHaving } from "./default_having";
import { defaultInsert } from "./default_insert";
import { defaultJoin } from "./default_join";
import { defaultLimitOffset } from "./default_limit_offset";
import { defaultOrderBy } from "./default_order_by";
import { defaultSelect } from "./default_select";
import { defaultUnion } from "./default_union";
import { defaultUpdate } from "./default_update";
import { defaultWhere } from "./default_where";

export interface ToSqlOptions {
   beforeSelectColumns?: (state: SqlEasyState, config: IConfiguration, sqlHelper: SqlHelper) => void;
}

export const defaultToSql = (
   state: SqlEasyState | undefined,
   config: IConfiguration,
   mode: ParserMode,
   options?: ToSqlOptions,
): SqlHelper => {
   const sqlHelper = new SqlHelper(config, mode);

   if (state === null || state === undefined) {
      throw new ParserError(ParserArea.General, "No state provided");
   }

   if (state.cteStates.length > 0) {
      const cte = defaultCte(state, config, mode);
      sqlHelper.addSqlSnippetWithValues(cte.getSql(), cte.getValues());
   }

   if (state.queryType === QueryType.Insert) {
      const insert = defaultInsert(state, config, mode);
      sqlHelper.addSqlSnippetWithValues(insert.getSql(), insert.getValues());
      if (!state.isInnerStatement) {
         sqlHelper.addSqlSnippet(";");
      }
      return sqlHelper;
   }

   if (state.queryType === QueryType.Update) {
      const update = defaultUpdate(state, config, mode);
      sqlHelper.addSqlSnippetWithValues(update.getSql(), update.getValues());

      if (state.whereStates.length > 0) {
         const where = defaultWhere(state, config, mode);
         sqlHelper.addSqlSnippet(" ");
         sqlHelper.addSqlSnippetWithValues(where.getSql(), where.getValues());
      }

      if (!state.isInnerStatement) {
         sqlHelper.addSqlSnippet(";");
      }
      return sqlHelper;
   }

   if (state.queryType === QueryType.Delete) {
      const del = defaultDelete(state, config, mode);
      sqlHelper.addSqlSnippetWithValues(del.getSql(), del.getValues());

      if (state.whereStates.length > 0) {
         const where = defaultWhere(state, config, mode);
         sqlHelper.addSqlSnippet(" ");
         sqlHelper.addSqlSnippetWithValues(where.getSql(), where.getValues());
      }

      if (!state.isInnerStatement) {
         sqlHelper.addSqlSnippet(";");
      }
      return sqlHelper;
   }

   const sel = defaultSelect(state, config, mode, options);
   sqlHelper.addSqlSnippetWithValues(sel.getSql(), sel.getValues());

   const from = defaultFrom(state, config, mode);
   sqlHelper.addSqlSnippet(" ");
   sqlHelper.addSqlSnippetWithValues(from.getSql(), from.getValues());

   if (state.joinStates.length > 0) {
      const join = defaultJoin(state, config, mode);
      sqlHelper.addSqlSnippet(" ");
      sqlHelper.addSqlSnippetWithValues(join.getSql(), join.getValues());
   }

   if (state.whereStates.length > 0) {
      const where = defaultWhere(state, config, mode);
      sqlHelper.addSqlSnippet(" ");
      sqlHelper.addSqlSnippetWithValues(where.getSql(), where.getValues());
   }

   if (state.groupByStates.length > 0) {
      const groupBy = defaultGroupBy(state, config, mode);
      sqlHelper.addSqlSnippet(" ");
      sqlHelper.addSqlSnippetWithValues(groupBy.getSql(), groupBy.getValues());
   }

   if (state.havingStates.length > 0) {
      const having = defaultHaving(state, config, mode);
      sqlHelper.addSqlSnippet(" ");
      sqlHelper.addSqlSnippetWithValues(having.getSql(), having.getValues());
   }

   if (state.unionStates.length > 0) {
      const union = defaultUnion(state, config, mode, options);
      sqlHelper.addSqlSnippet(" ");
      sqlHelper.addSqlSnippetWithValues(union.getSql(), union.getValues());
   }

   if (state.orderByStates.length > 0) {
      const orderBy = defaultOrderBy(state, config, mode);
      sqlHelper.addSqlSnippet(" ");
      sqlHelper.addSqlSnippetWithValues(orderBy.getSql(), orderBy.getValues());
   }

   if (state.limit > 0 || state.offset > 0) {
      const limitOffset = defaultLimitOffset(state, config, mode);

      sqlHelper.addSqlSnippet(" ");
      sqlHelper.addSqlSnippetWithValues(limitOffset.getSql(), limitOffset.getValues());
   }

   if (!state.isInnerStatement) {
      sqlHelper.addSqlSnippet(";");
   }

   return sqlHelper;
};
