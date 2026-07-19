/**
 * The unit a window function's frame clause counts in — physical rows, or logical value range.
 */
export const FrameUnit = {
  /** `ROWS` — counts physical rows relative to the current row. */
  Rows: 'Rows',
  /** `RANGE` — counts by logical value distance (or, with unbounded/current-row bounds, groups of peers). */
  Range: 'Range',
} as const;

/** One of the {@link FrameUnit} kinds. */
export type FrameUnit = (typeof FrameUnit)[keyof typeof FrameUnit];
