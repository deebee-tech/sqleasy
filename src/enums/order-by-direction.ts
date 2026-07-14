/**
 * Sort direction for ORDER BY columns and expressions.
 */
export const OrderByDirection = {
  /** Ascending (ASC). */
  Ascending: 'Ascending',
  /** Descending (DESC). */
  Descending: 'Descending',
  /** No direction / dialect default. */
  None: 'None',
} as const;

/** One of the {@link OrderByDirection} values. */
export type OrderByDirection = (typeof OrderByDirection)[keyof typeof OrderByDirection];
