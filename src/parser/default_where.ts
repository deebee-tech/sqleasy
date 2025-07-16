import type { IConfiguration } from "../configuration/interface_configuration";
import { BuilderType } from "../enums/builder_type";
import { ParserArea } from "../enums/parser_area";
import type { ParserMode } from "../enums/parser_mode";
import { WhereOperator } from "../enums/where_operator";
import { ParserError } from "../helpers/parser_error";
import { SqlHelper } from "../helpers/sql_helper";
import type { SqlEasyState } from "../state/sqleasy_state";
import { defaultToSql } from "./default_to_sql";

export const defaultWhere = (state: SqlEasyState, config: IConfiguration, mode: ParserMode): SqlHelper => {
   const sqlHelper = new SqlHelper(config, mode);

   if (state.whereStates.length === 0) {
      return sqlHelper;
   }

   sqlHelper.addSqlSnippet("WHERE ");

   for (let i = 0; i < state.whereStates.length; i++) {
      if (
         i === 0 &&
         (state.whereStates[i].builderType === BuilderType.And || state.whereStates[i].builderType === BuilderType.Or)
      ) {
         throw new ParserError(ParserArea.Where, "First WHERE operator cannot be AND or OR");
      }

      if (
         i === state.whereStates.length - 1 &&
         (state.whereStates[i].builderType === BuilderType.And || state.whereStates[i].builderType === BuilderType.Or)
      ) {
         throw new ParserError(ParserArea.Where, "AND or OR cannot be used as the last WHERE operator");
      }

      if (
         (state.whereStates[i].builderType === BuilderType.And ||
            state.whereStates[i].builderType === BuilderType.Or) &&
         (state.whereStates[i - 1].builderType === BuilderType.And ||
            state.whereStates[i - 1].builderType === BuilderType.Or)
      ) {
         throw new ParserError(ParserArea.Where, "AND or OR cannot be used consecutively");
      }

      if (
         (state.whereStates[i].builderType === BuilderType.And ||
            state.whereStates[i].builderType === BuilderType.Or) &&
         state.whereStates[i - 1].builderType === BuilderType.WhereGroupBegin
      ) {
         throw new ParserError(ParserArea.Where, "AND or OR cannot be used directly after a group begin");
      }

      if (state.whereStates[i].builderType === BuilderType.WhereGroupBegin && i === state.whereStates.length - 1) {
         throw new ParserError(ParserArea.Where, "Group begin cannot be the last WHERE operator");
      }

      if (state.whereStates[i].builderType === BuilderType.WhereGroupEnd && i === 0) {
         throw new ParserError(ParserArea.Where, "Group end cannot be the first WHERE operator");
      }

      if (state.whereStates[i].builderType === BuilderType.And) {
         sqlHelper.addSqlSnippet("AND");

         if (i < state.whereStates.length - 1) {
            sqlHelper.addSqlSnippet(" ");
         }
         continue;
      }

      if (state.whereStates[i].builderType === BuilderType.Or) {
         sqlHelper.addSqlSnippet("OR");

         if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) {
            sqlHelper.addSqlSnippet(" ");
         }
         continue;
      }

      if (state.whereStates[i].builderType === BuilderType.WhereGroupBegin) {
         sqlHelper.addSqlSnippet("(");
         continue;
      }

      if (state.whereStates[i].builderType === BuilderType.WhereGroupEnd) {
         sqlHelper.addSqlSnippet(")");

         if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) {
            sqlHelper.addSqlSnippet(" ");
         }
         continue;
      }

      if (state.whereStates[i].builderType === BuilderType.WhereRaw) {
         sqlHelper.addSqlSnippet(state.whereStates[i].raw ?? "");

         if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) {
            sqlHelper.addSqlSnippet(" ");
         }
         continue;
      }

      if (state.whereStates[i].builderType === BuilderType.Where) {
         sqlHelper.addSqlSnippet(
            config.identifierDelimiters().begin +
               state.whereStates[i].tableNameOrAlias +
               config.identifierDelimiters().end,
         );
         sqlHelper.addSqlSnippet(".");
         sqlHelper.addSqlSnippet(
            config.identifierDelimiters().begin + state.whereStates[i].columnName + config.identifierDelimiters().end,
         );
         sqlHelper.addSqlSnippet(" ");

         switch (state.whereStates[i].whereOperator) {
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
         sqlHelper.addSqlSnippet(sqlHelper.addDynamicValue(state.whereStates[i].values[0]));

         if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) {
            sqlHelper.addSqlSnippet(" ");
         }
         continue;
      }

      if (state.whereStates[i].builderType == BuilderType.WhereBetween) {
         sqlHelper.addSqlSnippet(
            config.identifierDelimiters().begin +
               state.whereStates[i].tableNameOrAlias +
               config.identifierDelimiters().end,
         );
         sqlHelper.addSqlSnippet(".");
         sqlHelper.addSqlSnippet(
            config.identifierDelimiters().begin + state.whereStates[i].columnName + config.identifierDelimiters().end,
         );
         sqlHelper.addSqlSnippet(" ");
         sqlHelper.addSqlSnippet("BETWEEN ");
         sqlHelper.addSqlSnippet(sqlHelper.addDynamicValue(state.whereStates[i].values[0]));
         sqlHelper.addSqlSnippet(" AND ");
         sqlHelper.addSqlSnippet(sqlHelper.addDynamicValue(state.whereStates[i].values[1]));

         if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) {
            sqlHelper.addSqlSnippet(" ");
         }
         continue;
      }

      if (state.whereStates[i].builderType == BuilderType.WhereExistsBuilder) {
         sqlHelper.addSqlSnippet("EXISTS (");

         const subHelper = defaultToSql(state.whereStates[i].sqlEasyState, config, mode);

         sqlHelper.addSqlSnippet(subHelper.getSql());
         sqlHelper.addSqlSnippet(")");

         if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) {
            sqlHelper.addSqlSnippet(" ");
         }
         continue;
      }

      if (state.whereStates[i].builderType == BuilderType.WhereInBuilder) {
         sqlHelper.addSqlSnippet(
            config.identifierDelimiters().begin +
               state.whereStates[i].tableNameOrAlias +
               config.identifierDelimiters().end,
         );
         sqlHelper.addSqlSnippet(".");
         sqlHelper.addSqlSnippet(
            config.identifierDelimiters().begin + state.whereStates[i].columnName + config.identifierDelimiters().end,
         );
         sqlHelper.addSqlSnippet(" IN (");

         const subHelper = defaultToSql(state.whereStates[i].sqlEasyState, config, mode);

         sqlHelper.addSqlSnippet(subHelper.getSql());
         sqlHelper.addSqlSnippet(")");

         if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) {
            sqlHelper.addSqlSnippet(" ");
         }
         continue;
      }

      if (state.whereStates[i].builderType == BuilderType.WhereInValues) {
         sqlHelper.addSqlSnippet(
            config.identifierDelimiters().begin +
               state.whereStates[i].tableNameOrAlias +
               config.identifierDelimiters().end,
         );
         sqlHelper.addSqlSnippet(".");
         sqlHelper.addSqlSnippet(
            config.identifierDelimiters().begin + state.whereStates[i].columnName + config.identifierDelimiters().end,
         );
         sqlHelper.addSqlSnippet(" IN (");

         for (let j = 0; j < state.whereStates[i].values.length; j++) {
            sqlHelper.addSqlSnippet(sqlHelper.addDynamicValue(state.whereStates[i].values[j]));

            if (j < state.whereStates[i].values.length - 1) {
               sqlHelper.addSqlSnippet(", ");
            }
         }

         sqlHelper.addSqlSnippet(")");

         if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) {
            sqlHelper.addSqlSnippet(" ");
         }
         continue;
      }

      if (state.whereStates[i].builderType == BuilderType.WhereNotExistsBuilder) {
         sqlHelper.addSqlSnippet("NOT EXISTS (");

         const subHelper = defaultToSql(state.whereStates[i].sqlEasyState, config, mode);

         sqlHelper.addSqlSnippet(subHelper.getSql());
         sqlHelper.addSqlSnippet(")");

         if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) {
            sqlHelper.addSqlSnippet(" ");
         }
         continue;
      }

      if (state.whereStates[i].builderType == BuilderType.WhereNotInBuilder) {
         sqlHelper.addSqlSnippet(
            config.identifierDelimiters().begin +
               state.whereStates[i].tableNameOrAlias +
               config.identifierDelimiters().end,
         );
         sqlHelper.addSqlSnippet(".");
         sqlHelper.addSqlSnippet(
            config.identifierDelimiters().begin + state.whereStates[i].columnName + config.identifierDelimiters().end,
         );
         sqlHelper.addSqlSnippet(" NOT IN (");

         const subHelper = defaultToSql(state.whereStates[i].sqlEasyState, config, mode);

         sqlHelper.addSqlSnippet(subHelper.getSql());
         sqlHelper.addSqlSnippet(")");

         if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) {
            sqlHelper.addSqlSnippet(" ");
         }
         continue;
      }

      if (state.whereStates[i].builderType == BuilderType.WhereNotInValues) {
         sqlHelper.addSqlSnippet(
            config.identifierDelimiters().begin +
               state.whereStates[i].tableNameOrAlias +
               config.identifierDelimiters().end,
         );
         sqlHelper.addSqlSnippet(".");
         sqlHelper.addSqlSnippet(
            config.identifierDelimiters().begin + state.whereStates[i].columnName + config.identifierDelimiters().end,
         );
         sqlHelper.addSqlSnippet(" NOT IN (");

         for (let j = 0; j < state.whereStates[i].values.length; j++) {
            sqlHelper.addSqlSnippet(sqlHelper.addDynamicValue(state.whereStates[i].values[j]));

            if (j < state.whereStates[i].values.length - 1) {
               sqlHelper.addSqlSnippet(", ");
            }
         }

         sqlHelper.addSqlSnippet(")");

         if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) {
            sqlHelper.addSqlSnippet(" ");
         }
         continue;
      }

      if (state.whereStates[i].builderType == BuilderType.WhereNotNull) {
         sqlHelper.addSqlSnippet(
            config.identifierDelimiters().begin +
               state.whereStates[i].tableNameOrAlias +
               config.identifierDelimiters().end,
         );
         sqlHelper.addSqlSnippet(".");
         sqlHelper.addSqlSnippet(
            config.identifierDelimiters().begin + state.whereStates[i].columnName + config.identifierDelimiters().end,
         );
         sqlHelper.addSqlSnippet(" IS NOT NULL");

         if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) {
            sqlHelper.addSqlSnippet(" ");
         }
         continue;
      }

      if (state.whereStates[i].builderType == BuilderType.WhereNull) {
         sqlHelper.addSqlSnippet(
            config.identifierDelimiters().begin +
               state.whereStates[i].tableNameOrAlias +
               config.identifierDelimiters().end,
         );
         sqlHelper.addSqlSnippet(".");
         sqlHelper.addSqlSnippet(
            config.identifierDelimiters().begin + state.whereStates[i].columnName + config.identifierDelimiters().end,
         );
         sqlHelper.addSqlSnippet(" IS NULL");

         if (i < state.whereStates.length - 1 && state.whereStates[i + 1].builderType !== BuilderType.WhereGroupEnd) {
            sqlHelper.addSqlSnippet(" ");
         }
         continue;
      }
   }

   return sqlHelper;
};
