import type { MultiBuilderTransactionState } from "../enums/multi_builder_transaction_state";
import type { IParser } from "../parser/interface_parser";
import type { SqlEasyState } from "../state/sqleasy_state";
import type { IBuilder } from "./interface_builder";
import type { IJoinOnBuilder } from "./interface_join_on_builder";

/**
 * Builder for composing multiple SQL statements into a single batch,
 * with optional transaction wrapping.
 *
 * Obtain an instance via {@link ISqlEasy.newMultiBuilder} rather than constructing directly.
 *
 * @template T The concrete single-query builder type
 * @template U The concrete join-on builder type
 * @template V The concrete parser type
 */
export interface IMultiBuilder<T extends IBuilder<T, U, V>, U extends IJoinOnBuilder<U>, V extends IParser> {
   /**
    * Adds a named builder to the batch and returns it for configuration.
    *
    * @param builderName A unique name identifying this builder within the batch
    */
   addBuilder(builderName: string): T;

   /**
    * Renders all builders in the batch as a single prepared SQL string.
    * If a transaction state is set, the output is wrapped with the
    * appropriate BEGIN/COMMIT delimiters.
    */
   parse(): string;

   /**
    * Renders all builders in the batch as a single raw SQL string with values inlined.
    * If a transaction state is set, the output is wrapped with the
    * appropriate BEGIN/COMMIT delimiters.
    */
   parseRaw(): string;

   /**
    * Removes a previously added builder from the batch by name.
    *
    * @param builderName The name of the builder to remove
    */
   removeBuilder(builderName: string): void;

   /**
    * Reorders the builders in the batch. The provided array must contain
    * exactly the same builder names that were previously added.
    *
    * @param builderNames The desired order of builder names
    */
   reorderBuilders(builderNames: string[]): void;

   /**
    * Sets whether the batch should be wrapped in a transaction.
    *
    * @param transactionState The desired transaction state
    */
   setTransactionState(transactionState: MultiBuilderTransactionState): void;

   /** Returns the array of {@link SqlEasyState} objects for all builders in the batch. */
   states(): SqlEasyState[];

   /** Returns the current transaction state of the multi-builder. */
   transactionState(): MultiBuilderTransactionState;
}
