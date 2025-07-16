import IsHelper from "@deebeetech/is-helper";
import type { IConfiguration } from "../configuration/interface_configuration";
import { ParserArea } from "../enums/parser_area";
import type { ParserMode } from "../enums/parser_mode";
import { ParserError } from "../helpers/parser_error";
import { SqlHelper } from "../helpers/sql_helper";
import type { SqlEasyState } from "../state/sqleasy_state";
import { defaultFrom } from "./default_from";
import { defaultJoin } from "./default_join";
import { defaultLimitOffset } from "./default_limit_offset";
import { defaultOrderBy } from "./default_order_by";
import { defaultSelect } from "./default_select";
import { defaultWhere } from "./default_where";

export const defaultToSql = (state: SqlEasyState | undefined, config: IConfiguration, mode: ParserMode): SqlHelper => {
   const sqlHelper = new SqlHelper(config, mode);

   if (IsHelper.isNullOrUndefined(state)) {
      throw new ParserError(ParserArea.General, "No state provided");
   }

   const sel = defaultSelect(state, config, mode);
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
