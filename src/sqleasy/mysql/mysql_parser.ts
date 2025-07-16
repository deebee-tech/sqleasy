import type { MultiBuilderTransactionState } from "../../enums/multi_builder_transaction_state";
import { ParserArea } from "../../enums/parser_area";
import { ParserError } from "../../helpers/parser_error";
import { DefaultParser } from "../../parser/default_parser";
import type { SqlEasyState } from "../../state/sqleasy_state";
import type { MysqlConfiguration } from "./mysql_configuration";

export class MysqlParser extends DefaultParser {
   private _mysqlConfiguration: MysqlConfiguration;

   constructor(config: MysqlConfiguration) {
      super(config);
      this._mysqlConfiguration = config;
   }

   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   public override toSql = (_state: SqlEasyState): string => {
      throw new ParserError(ParserArea.General, "toSql not implemented for MysqlParser");
   };

   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   public override toSqlMulti = (_states: SqlEasyState[], _transactionState: MultiBuilderTransactionState): string => {
      throw new ParserError(ParserArea.General, "toSqlMulti not implemented for MysqlParser");
   };
}
