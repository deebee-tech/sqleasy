/**
 * One endpoint of a window function's frame clause (`ROWS`/`RANGE BETWEEN ... AND ...`).
 */
export const FrameBoundType = {
  /** `UNBOUNDED PRECEDING` — the frame's start, extending to the first row of the partition. */
  UnboundedPreceding: 'UnboundedPreceding',
  /** `N PRECEDING` — offset rows/range before the current row; see the bound's `offset`. */
  Preceding: 'Preceding',
  /** `CURRENT ROW`. */
  CurrentRow: 'CurrentRow',
  /** `N FOLLOWING` — offset rows/range after the current row; see the bound's `offset`. */
  Following: 'Following',
  /** `UNBOUNDED FOLLOWING` — the frame's end, extending to the last row of the partition. */
  UnboundedFollowing: 'UnboundedFollowing',
} as const;

/** One of the {@link FrameBoundType} endpoints. */
export type FrameBoundType = (typeof FrameBoundType)[keyof typeof FrameBoundType];
