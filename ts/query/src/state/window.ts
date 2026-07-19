import { FrameBoundType } from '../enums/frame-bound-type';
import { FrameUnit } from '../enums/frame-unit';
import { NullsOrder } from '../enums/nulls-order';
import { OrderByDirection } from '../enums/order-by-direction';

/** Holds state for one `PARTITION BY` term inside a window's `OVER (...)`. */
export type WindowPartitionByState = {
  /** Table name or alias qualifying the partitioning column; unset for `raw`. */
  tableNameOrAlias: string | undefined;
  /** Column name being partitioned by; unset for `raw`. */
  columnName: string | undefined;
  /** Raw SQL for this partition term when not using structured fields. */
  raw: string | undefined;
};

/** Holds state for one `ORDER BY` term inside a window's `OVER (...)`. */
export type WindowOrderByState = {
  /** Table name or alias qualifying the sort column; unset for `raw`. */
  tableNameOrAlias: string | undefined;
  /** Column name used for ordering; unset for `raw`. */
  columnName: string | undefined;
  /** ASC, DESC, or none. */
  direction: OrderByDirection;
  /** `NULLS FIRST`/`NULLS LAST` placement — see {@link NullsOrder}. */
  nulls: NullsOrder;
  /** Raw SQL for this sort term when not using structured fields. */
  raw: string | undefined;
};

/** One endpoint (`start`/`end`) of a window's `ROWS`/`RANGE BETWEEN ... AND ...` frame clause. */
export type WindowFrameBoundState = {
  /** Which kind of bound this endpoint is. */
  type: FrameBoundType;
  /** Row/range offset for {@link FrameBoundType.Preceding}/{@link FrameBoundType.Following}; ignored otherwise. */
  offset: number | undefined;
};

/** A window's optional frame clause (`ROWS`/`RANGE BETWEEN start AND end`). */
export type WindowFrameState = {
  /** Whether the frame counts physical rows or a logical range. */
  unit: FrameUnit;
  /** The frame's starting bound. */
  start: WindowFrameBoundState;
  /** The frame's ending bound; omitted means `CURRENT ROW` per the SQL standard's single-bound shorthand. */
  end: WindowFrameBoundState | undefined;
  /** Raw SQL for the entire frame clause when not using structured fields; mutually exclusive with the fields above. */
  raw: string | undefined;
};

/**
 * Holds state for one window function's `OVER (...)` clause: `PARTITION BY`, `ORDER BY`, and an
 * optional frame. Populated by {@link WindowBuilder}; nested under a `SelectWindow`
 * {@link SelectState}.
 */
export type WindowState = {
  /** PARTITION BY terms in declaration order. */
  partitionByStates: WindowPartitionByState[];
  /** ORDER BY terms in declaration order. */
  orderByStates: WindowOrderByState[];
  /** The frame clause, when set. */
  frame: WindowFrameState | undefined;
};

/** Creates a {@link WindowState} with default field values (an empty `OVER ()`). */
export const createWindowState = (): WindowState => ({
  partitionByStates: [],
  orderByStates: [],
  frame: undefined,
});
