import type { MultiBuilderTransactionState } from "../enums/multi_builder_transaction_state";
import type { SqlEasyState } from "../state/sqleasy_state";

export interface IParser {
   toSql(state: SqlEasyState): string;
   toSqlMulti(states: SqlEasyState[], transactionState: MultiBuilderTransactionState): string;
   toSqlRaw(state: SqlEasyState): string;
   toSqlMultiRaw(states: SqlEasyState[], transactionState: MultiBuilderTransactionState): string;
}
