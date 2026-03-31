/**
 * Whether multi-statement batches are wrapped in an explicit transaction block.
 */
export enum MultiBuilderTransactionState {
   /** Emit BEGIN/COMMIT (or equivalent) around the batch. */
   TransactionOn,
   /** Do not wrap the batch in a transaction. */
   TransactionOff,
   /** Use default / unspecified transaction behavior. */
   None,
}
