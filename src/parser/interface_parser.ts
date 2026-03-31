import type { MultiBuilderTransactionState } from "../enums/multi_builder_transaction_state";
import type { SqlEasyState } from "../state/sqleasy_state";

/**
 * Renders {@link SqlEasyState} into dialect-specific SQL strings.
 *
 * Users typically do not interact with parsers directly; instead,
 * call {@link IBuilder.parse} or {@link IBuilder.parseRaw} on the builder.
 */
export interface IParser {
   /**
    * Renders a single query state as a prepared SQL string with parameter placeholders.
    *
    * @param state The builder state to render
    */
   toSql(state: SqlEasyState): string;

   /**
    * Renders multiple query states as a single prepared SQL string,
    * optionally wrapped in a transaction.
    *
    * @param states Array of builder states to render
    * @param transactionState Whether to wrap the output in transaction delimiters
    */
   toSqlMulti(states: SqlEasyState[], transactionState: MultiBuilderTransactionState): string;

   /**
    * Renders a single query state as a raw SQL string with values inlined.
    *
    * @param state The builder state to render
    */
   toSqlRaw(state: SqlEasyState): string;

   /**
    * Renders multiple query states as a single raw SQL string with values inlined,
    * optionally wrapped in a transaction.
    *
    * @param states Array of builder states to render
    * @param transactionState Whether to wrap the output in transaction delimiters
    */
   toSqlMultiRaw(states: SqlEasyState[], transactionState: MultiBuilderTransactionState): string;
}
