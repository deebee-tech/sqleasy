import { JoinOnOperator } from '../enums/join-on-operator';
import { JoinOperator } from '../enums/join-operator';

/**
 * Holds state for one ON (or AND) join condition between two sides.
 * Populated by the builder; nested under {@link JoinState.joinOnStates}.
 */
export type JoinOnState = {
  /** Alias of the left-hand column in the join condition. */
  aliasLeft: string | undefined;
  /** Left-hand column name. */
  columnLeft: string | undefined;
  /** Operator relating left and right (e.g. equals). */
  joinOperator: JoinOperator;
  /** Alias of the right-hand side (column or literal context). */
  aliasRight: string | undefined;
  /** Right-hand column name when the RHS is a column. */
  columnRight: string | undefined;
  /** AND/OR style combinator with the next join-on term. */
  joinOnOperator: JoinOnOperator;
  /** Raw SQL for this join condition when not using structured fields. */
  raw: string | undefined;
  /** Right-hand value when the RHS is a literal or parameter (`onValue`). */
  valueRight: any | undefined;
  /** Right-hand value list for `onIn`/`onNotIn` (any length) or `onBetween`/`onNotBetween` (exactly two). */
  valuesRight: any[] | undefined;
};

/** Creates a {@link JoinOnState} with default field values. */
export const createJoinOnState = (): JoinOnState => ({
  aliasLeft: undefined,
  columnLeft: undefined,
  joinOperator: JoinOperator.Equals,
  aliasRight: undefined,
  columnRight: undefined,
  joinOnOperator: JoinOnOperator.None,
  raw: undefined,
  valueRight: undefined,
  valuesRight: undefined,
});
