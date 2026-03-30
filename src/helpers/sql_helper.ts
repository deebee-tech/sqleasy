import StringBuilder from "./string_builder";
import type { IConfiguration } from "../configuration/interface_configuration";
import { ParserMode } from "../enums/parser_mode";

export class SqlHelper {
   private _sb = new StringBuilder();
   private _values: any[] = [];
   private _config: IConfiguration;
   private _parserMode: ParserMode;

   constructor(config: IConfiguration, parserMode: ParserMode) {
      this._config = config;
      this._parserMode = parserMode;
   }

   public addDynamicValue = (value: any): string => {
      if (this._parserMode === ParserMode.Prepared) {
         this._values.push(value);
         return this._config.preparedStatementPlaceholder();
      }

      return this.getValueStringFromDataType(value);
   };

   public addSqlSnippet = (sql: string): void => {
      this._sb.append(sql);
   };

   public addSqlSnippetWithValues = (sqlString: string, values: any[]): void => {
      this._values.push(...values);
      this.addSqlSnippet(sqlString);
   };

   public clear = (): void => {
      this._sb = new StringBuilder();
      this._values = [];
   };

   public getSql = (): string => {
      return this._sb.toString();
   };

   public getSqlDebug = (): string => {
      let sqlString = this._sb.toString();
      const placeholder = this._config.preparedStatementPlaceholder();

      this._values.forEach((value) => {
         const valuePosition = sqlString.indexOf(placeholder);

         if (valuePosition === -1) {
            return;
         }

         sqlString =
            sqlString.substring(0, valuePosition) +
            this.getValueStringFromDataType(value) +
            sqlString.substring(valuePosition + placeholder.length);
      });

      return sqlString;
   };

   public getValues = (): any[] => {
      if (this._values.length === 0) {
         return [];
      }

      return this._values.filter((value) => value !== null && value !== undefined);
   };

   public getValueStringFromDataType = (value: any): string => {
      if (value === null || value === undefined) {
         return "";
      }

      switch (typeof value) {
         case "string":
            return value;
         case "number":
            return value.toString();
         case "boolean":
            return value ? "true" : "false";
         case "object":
            if (value instanceof Date) {
               return value.toISOString();
            }
            return JSON.stringify(value);
         default:
            return value.toString();
      }
   };
}
