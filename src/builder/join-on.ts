import type { Dialect } from '../configuration/configuration';
import { JoinOnOperator } from '../enums/join-on-operator';
import { JoinOperator } from '../enums/join-operator';
import type { JoinOnState } from '../state/join-on';

/**
 * Fluent builder for a JOIN's `ON` condition list — `on`/`onValue` comparisons, `onRaw`
 * fragments, `and`/`or` combinators, and parenthesized `onGroup`s. One class for every
 * dialect; {@link states} hands the accumulated conditions to the join clause parser.
 */
export class JoinOnBuilder {
  #states: JoinOnState[] = [];
  #config: Dialect;

  constructor(config: Dialect) {
    this.#config = config;
  }

  #child = (): JoinOnBuilder => new JoinOnBuilder(this.#config);

  /** Returns a new join-on builder, reusing this configuration unless `config` is provided. */
  public newJoinOnBuilder = (config?: Dialect): JoinOnBuilder => {
    return new JoinOnBuilder(config ?? this.#config);
  };

  public and = (): this => {
    this.#states.push({
      joinOperator: JoinOperator.None,
      joinOnOperator: JoinOnOperator.And,
      aliasLeft: undefined,
      columnLeft: undefined,
      aliasRight: undefined,
      columnRight: undefined,
      raw: undefined,
      valueRight: undefined,
    });

    return this;
  };

  public on = (
    aliasLeft: string,
    columnLeft: string,
    joinOperator: JoinOperator,
    aliasRight: string,
    columnRight: string,
  ): this => {
    this.#states.push({
      joinOperator,
      joinOnOperator: JoinOnOperator.On,
      aliasLeft,
      columnLeft,
      aliasRight,
      columnRight,
      raw: undefined,
      valueRight: undefined,
    });

    return this;
  };

  public onGroup = (builder: (builder: JoinOnBuilder) => void): this => {
    this.#states.push({
      joinOperator: JoinOperator.None,
      joinOnOperator: JoinOnOperator.GroupBegin,
      aliasLeft: undefined,
      columnLeft: undefined,
      aliasRight: undefined,
      columnRight: undefined,
      raw: undefined,
      valueRight: undefined,
    });

    const child = this.#child();
    builder(child);

    // Splice the group's own conditions between the delimiters. Without this the child builder was
    // populated and then thrown away: every condition inside the group vanished (the join rendered
    // `... AND ()`), and any `onValue` inside it was never bound — so the JOIN silently matched on
    // the wrong predicate and returned the wrong rows.
    this.#states.push(...child.states());

    this.#states.push({
      joinOperator: JoinOperator.None,
      joinOnOperator: JoinOnOperator.GroupEnd,
      aliasLeft: undefined,
      columnLeft: undefined,
      aliasRight: undefined,
      columnRight: undefined,
      raw: undefined,
      valueRight: undefined,
    });

    return this;
  };

  public onRaw = (raw: string): this => {
    this.#states.push({
      joinOperator: JoinOperator.None,
      joinOnOperator: JoinOnOperator.Raw,
      aliasLeft: undefined,
      columnLeft: undefined,
      aliasRight: undefined,
      columnRight: undefined,
      raw,
      valueRight: undefined,
    });
    return this;
  };

  public onValue = (
    aliasLeft: string,
    columnLeft: string,
    joinOperator: JoinOperator,
    valueRight: any,
  ): this => {
    this.#states.push({
      joinOperator,
      joinOnOperator: JoinOnOperator.Value,
      aliasLeft,
      columnLeft,
      aliasRight: undefined,
      columnRight: undefined,
      raw: undefined,
      valueRight,
    });
    return this;
  };

  public or = (): this => {
    this.#states.push({
      joinOperator: JoinOperator.None,
      joinOnOperator: JoinOnOperator.Or,
      aliasLeft: undefined,
      columnLeft: undefined,
      aliasRight: undefined,
      columnRight: undefined,
      raw: undefined,
      valueRight: undefined,
    });

    return this;
  };

  public states = (): JoinOnState[] => {
    return this.#states;
  };
}
