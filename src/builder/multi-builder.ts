import type { Dialect } from '../configuration/configuration';
import { MultiBuilderTransactionState } from '../enums/multi-builder-transaction-state';
import { parseMulti, parseMultiRaw } from '../parser/to-sql';
import type { QueryState } from '../state/query';
import { QueryBuilder } from './query';

/**
 * Composes multiple {@link QueryBuilder} statements into a single SQL string, optionally wrapped
 * in a transaction. Obtain one from a dialect entry point (e.g.
 * `new PostgresQuery().newMultiBuilder()`) rather than constructing directly. Named builders can
 * be removed or reordered before rendering.
 */
export class MultiBuilder {
  #config: Dialect;
  #builders: QueryBuilder[] = [];
  #transactionState: MultiBuilderTransactionState = MultiBuilderTransactionState.TransactionOn;

  constructor(config: Dialect) {
    this.#config = config;
  }

  /** Adds a named builder to the batch and returns it for configuration. */
  public addBuilder = (builderName: string): QueryBuilder => {
    const builder = new QueryBuilder(this.#config);
    builder.state().builderName = builderName;
    this.#builders.push(builder);

    return builder;
  };

  /** Renders the batch as a single prepared SQL string (transaction-wrapped when enabled). */
  public parse = (): string => {
    return parseMulti(this.states(), this.#transactionState, this.#config);
  };

  /** Renders the batch as a single raw SQL string with values inlined. DEBUG / TEST only. */
  public parseRaw = (): string => {
    return parseMultiRaw(this.states(), this.#transactionState, this.#config);
  };

  /** Removes a previously added builder from the batch by name. */
  public removeBuilder = (builderName: string): void => {
    this.#builders = this.#builders.filter(
      (builder) => builder.state().builderName !== builderName,
    );
  };

  /** Reorders the batch to match the given builder names; names not present are dropped. */
  public reorderBuilders = (builderNames: string[]): void => {
    const reordered: QueryBuilder[] = [];

    builderNames.forEach((builderName) => {
      const match = this.#builders.find((builder) => builder.state().builderName === builderName);

      if (match) {
        reordered.push(match);
      }
    });

    this.#builders = reordered;
  };

  /** Sets whether the batch is wrapped in a transaction. */
  public setTransactionState = (transactionState: MultiBuilderTransactionState): void => {
    this.#transactionState = transactionState;
  };

  /** Returns the {@link QueryState} of every builder in the batch, in order. */
  public states = (): QueryState[] => {
    return this.#builders.map((builder) => builder.state());
  };

  /** Returns the current transaction state of the batch. */
  public transactionState = (): MultiBuilderTransactionState => {
    return this.#transactionState;
  };
}
