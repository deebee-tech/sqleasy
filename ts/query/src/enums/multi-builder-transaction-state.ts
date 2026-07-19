/**
 * Whether a multi-statement batch is wrapped in an explicit transaction block.
 */
export const MultiBuilderTransactionState = {
  /** Emit the dialect's BEGIN/COMMIT (or equivalent) around the batch. */
  TransactionOn: 'TransactionOn',
  /** Do not wrap the batch in a transaction. */
  TransactionOff: 'TransactionOff',
  /** Use default / unspecified transaction behavior. */
  None: 'None',
} as const;

/** One of the {@link MultiBuilderTransactionState} values. */
export type MultiBuilderTransactionState =
  (typeof MultiBuilderTransactionState)[keyof typeof MultiBuilderTransactionState];
