/**
 * Indicates which SQL clause produced a parser error for clearer diagnostics.
 */
export const ParserArea = {
  /** SELECT list or projections. */
  Select: 'Select',
  /** FROM clause. */
  From: 'From',
  /** JOIN definitions. */
  Join: 'Join',
  /** WHERE clause. */
  Where: 'Where',
  /** ORDER BY clause. */
  OrderBy: 'OrderBy',
  /** LIMIT, OFFSET, FETCH, TOP, etc. */
  LimitOffset: 'LimitOffset',
  /** Cross-clause or unspecified area. */
  General: 'General',
} as const;

/** One of the {@link ParserArea} clause identifiers. */
export type ParserArea = (typeof ParserArea)[keyof typeof ParserArea];
