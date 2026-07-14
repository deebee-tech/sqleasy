/**
 * SQL JOIN kinds: inner, outer variants, cross join, or none.
 */
export const JoinType = {
  /** INNER JOIN. */
  Inner: 'Inner',
  /** LEFT JOIN (synonym for left outer in many dialects). */
  Left: 'Left',
  /** LEFT OUTER JOIN. */
  LeftOuter: 'LeftOuter',
  /** RIGHT JOIN. */
  Right: 'Right',
  /** RIGHT OUTER JOIN. */
  RightOuter: 'RightOuter',
  /** FULL OUTER JOIN. */
  FullOuter: 'FullOuter',
  /** CROSS JOIN. */
  Cross: 'Cross',
  /** No join type / not applicable. */
  None: 'None',
} as const;

/** One of the {@link JoinType} kinds. */
export type JoinType = (typeof JoinType)[keyof typeof JoinType];
