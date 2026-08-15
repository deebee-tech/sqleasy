import type { Dialect } from '../configuration/configuration';
import { MultiBuilderTransactionState } from '../enums/multi-builder-transaction-state';
import {
  parseMulti,
  parseMultiDisplay,
  parseMultiPrepared,
  parseMultiRaw,
  type PreparedSql,
} from '../parser/to-sql';
import type { QueryState } from '../state/query';
import { QueryBuilder } from './query';

/**
 * Composes multiple {@link QueryBuilder} statements into a single SQL string, optionally wrapped
 * in a transaction. Obtain one from a dialect entry point (e.g.
 * `new PostgresQuery().newMultiBuilder()`) rather than constructing directly. Named builders can
 * be removed or reordered before rendering.
 *
 * `V` is the per-engine builder view {@link addBuilder} hands back, so a batch obtained from a
 * dialect facade narrows each statement to that engine's honest surface — exactly like
 * `newBuilder()`. It defaults to the wide {@link QueryBuilder} for a directly-constructed batch.
 */
export class MultiBuilder<V = QueryBuilder> {
  #config: Dialect;
  #builders: QueryBuilder[] = [];
  #transactionState: MultiBuilderTransactionState = MultiBuilderTransactionState.TransactionOn;

  constructor(config: Dialect) {
    this.#config = config;
  }

  /** Adds a named builder to the batch and returns it, typed as the engine's narrow view {@link V}. */
  public addBuilder = (builderName: string): V => {
    const builder = new QueryBuilder(this.#config);
    builder.state().builderName = builderName;
    this.#builders.push(builder);

    return builder as unknown as V;
  };

  /** Renders the batch as a single prepared SQL string (transaction-wrapped when enabled). */
  public parse = (): string => {
    return parseMulti(this.states(), this.#transactionState, this.#config);
  };

  /** Renders the batch as a single raw SQL string with values inlined. DEBUG / TEST only. */
  public parseRaw = (): string => {
    return parseMultiRaw(this.states(), this.#transactionState, this.#config);
  };

  /**
   * DISPLAY ONLY — batch with values inlined as dialect-escaped literals (paste into a SQL client
   * or show on a debug screen). Not for a driver; use {@link preparedStatements} to execute.
   */
  public parseDisplay = (): string => {
    return parseMultiDisplay(this.states(), this.#transactionState, this.#config);
  };

  /**
   * The execution-safe form of the batch: each builder rendered as its own prepared
   * `{ sql, params }`, in batch order. This — not {@link parse} — is what you run: a batch is
   * executed statement by statement, because placeholder numbering restarts per statement (so the
   * single {@link parse} string is not a runnable parameterized call), and {@link parse}/{@link
   * parseRaw} carry no bound values at all. Open a transaction on your own connection, run each in
   * order, and consult {@link transactionState} to decide whether to wrap them in BEGIN/COMMIT — the
   * delimiters are NOT included here.
   */
  public preparedStatements = (): PreparedSql[] => {
    return this.#builders.map((builder) => builder.parsePrepared());
  };

  /**
   * The batch as ONE prepared statement — placeholders renumbered continuously across every
   * statement, values concatenated in the same order — for a single round trip that returns a
   * result set per statement.
   *
   * **MSSQL only; throws on the other three.** `sp_executesql` takes a `;`-joined batch plus one
   * shared parameter list, which is what makes continuous numbering correct. Elsewhere a
   * concatenated batch is not a runnable parameterized call, so {@link preparedStatements} is the
   * portable answer — and the right one whenever you want the statements to be ATOMIC, since that
   * is a transaction.
   *
   * Unlike {@link preparedStatements}, the transaction delimiters ARE included when
   * {@link transactionState} is on, because the batch travels as one statement.
   */
  public preparedBatch = (): PreparedSql => {
    return parseMultiPrepared(this.states(), this.#transactionState, this.#config);
  };

  /** Removes a previously added builder from the batch by name. */
  public removeBuilder = (builderName: string): void => {
    this.#builders = this.#builders.filter(
      (builder) => builder.state().builderName !== builderName,
    );
  };

  /**
   * Reorders the batch to match the given builder names; names not present are dropped and
   * repeated names are deduplicated (first occurrence wins).
   */
  public reorderBuilders = (builderNames: string[]): void => {
    const reordered: QueryBuilder[] = [];

    [...new Set(builderNames)].forEach((builderName) => {
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
