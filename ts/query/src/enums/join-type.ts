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
  /** LATERAL derived table (Postgres/MySQL `JOIN LATERAL`; MSSQL maps to `CROSS APPLY`). */
  Lateral: 'Lateral',
  /** MSSQL `CROSS APPLY` (Postgres/MySQL: `CROSS JOIN LATERAL`). */
  CrossApply: 'CrossApply',
  /** MSSQL `OUTER APPLY` (Postgres/MySQL: `LEFT JOIN LATERAL`). */
  OuterApply: 'OuterApply',
  /** No join type / not applicable. */
  None: 'None',
} as const;

/** One of the {@link JoinType} kinds. */
export type JoinType = (typeof JoinType)[keyof typeof JoinType];
