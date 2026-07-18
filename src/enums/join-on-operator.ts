/**
 * Classifies each entry in a JOIN ON condition list (column compare, grouping, logic).
 */
export const JoinOnOperator = {
  /** Opens a parenthesized ON predicate group. */
  GroupBegin: 'GroupBegin',
  /** Closes a parenthesized ON predicate group. */
  GroupEnd: 'GroupEnd',
  /** Standard ON left op right comparison. */
  On: 'On',
  /** ON fragment as raw SQL. */
  Raw: 'Raw',
  /** ON right-hand value or bound parameter. */
  Value: 'Value',
  /** Logical AND between ON parts. */
  And: 'And',
  /** Logical OR between ON parts. */
  Or: 'Or',
  /** `ON column IN (values)` — see {@link JoinOnBuilder.onIn}. */
  InValues: 'InValues',
  /** `ON column NOT IN (values)` — see {@link JoinOnBuilder.onNotIn}. */
  NotInValues: 'NotInValues',
  /** `ON column BETWEEN low AND high` — see {@link JoinOnBuilder.onBetween}. */
  Between: 'Between',
  /** `ON column NOT BETWEEN low AND high` — see {@link JoinOnBuilder.onNotBetween}. */
  NotBetween: 'NotBetween',
  /** No operator / unused slot. */
  None: 'None',
} as const;

/** One of the {@link JoinOnOperator} values. */
export type JoinOnOperator = (typeof JoinOnOperator)[keyof typeof JoinOnOperator];
