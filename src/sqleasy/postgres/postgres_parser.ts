import type { MultiBuilderTransactionState } from "../../enums/multi_builder_transaction_state";
import { ParserArea } from "../../enums/parser_area";
import { ParserError } from "../../helpers/parser_error";
import { DefaultParser } from "../../parser/default_parser";
import type { SqlEasyState } from "../../state/sqleasy_state";
import type { PostgresConfiguration } from "./postgres_configuration";

export class PostgresParser extends DefaultParser {
   private _postgresConfiguration: PostgresConfiguration;

   constructor(config: PostgresConfiguration) {
      super(config);
      this._postgresConfiguration = config;
   }

   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   public override toSql = (_state: SqlEasyState): string => {
      throw new ParserError(ParserArea.General, "toSql not implemented for PostgresParser");
   };

   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   public override toSqlMulti = (_states: SqlEasyState[], _transactionState: MultiBuilderTransactionState): string => {
      throw new ParserError(ParserArea.General, "toSqlMulti not implemented for PostgresParser");
   };
}
