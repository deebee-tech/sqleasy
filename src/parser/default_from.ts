import type { IConfiguration } from "../configuration/interface_configuration";
import { BuilderType } from "../enums/builder_type";
import { DatabaseType } from "../enums/database_type";
import { ParserArea } from "../enums/parser_area";
import type { ParserMode } from "../enums/parser_mode";
import { ParserError } from "../helpers/parser_error";
import { SqlHelper } from "../helpers/sql_helper";
import type { SqlEasyState } from "../state/sqleasy_state";
import { defaultToSql } from "./default_to_sql";

export const defaultFrom = (state: SqlEasyState, config: IConfiguration, mode: ParserMode): SqlHelper => {
   const sqlHelper = new SqlHelper(config, mode);

   if (state.fromStates.length === 0) {
      throw new ParserError(ParserArea.From, "No tables to select from");
   }

   sqlHelper.addSqlSnippet("FROM ");

   state.fromStates.forEach((fromState, i) => {
      if (fromState.builderType === BuilderType.FromRaw) {
         sqlHelper.addSqlSnippet(fromState.raw ?? "");
         if (i < state.fromStates.length - 1) {
            sqlHelper.addSqlSnippet(", ");
         }
         return;
      }

      if (fromState.builderType === BuilderType.FromTable) {
         if (fromState.owner !== "" && config.databaseType() === DatabaseType.Mysql) {
            throw new ParserError(ParserArea.From, "MySQL does not support table owners");
         }

         if (fromState.owner !== "") {
            sqlHelper.addSqlSnippet(
               config.identifierDelimiters().begin + fromState.owner + config.identifierDelimiters().end,
            );
            sqlHelper.addSqlSnippet(".");
         }

         sqlHelper.addSqlSnippet(
            config.identifierDelimiters().begin + fromState.tableName + config.identifierDelimiters().end,
         );

         if (fromState.alias !== "") {
            sqlHelper.addSqlSnippet(" AS ");
            sqlHelper.addSqlSnippet(
               config.identifierDelimiters().begin + fromState.alias + config.identifierDelimiters().end,
            );
         }

         if (i < state.fromStates.length - 1) {
            sqlHelper.addSqlSnippet(", ");
         }

         return;
      }

      if (fromState.builderType === BuilderType.FromBuilder) {
         const subHelper = defaultToSql(fromState.sqlEasyState, config, mode);

         sqlHelper.addSqlSnippet("(" + subHelper.getSql() + ")");

         if (fromState.alias !== "") {
            sqlHelper.addSqlSnippet(" AS ");
            sqlHelper.addSqlSnippet(
               config.identifierDelimiters().begin + fromState.alias + config.identifierDelimiters().end,
            );
         }

         if (i < state.fromStates.length - 1) {
            sqlHelper.addSqlSnippet(", ");
         }
      }
   });

   return sqlHelper;
};
