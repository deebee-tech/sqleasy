import { BuilderType } from '../enums/builder-type';
import { NullsOrder } from '../enums/nulls-order';
import { OrderByDirection } from '../enums/order-by-direction';

/**
 * Holds state for one ORDER BY sort key and direction.
 * Populated by the builder; exposed via {@link QueryState.orderByStates}.
 */
export type OrderByState = {
  /** Which builder variant produced this state. */
  builderType: BuilderType;
  /** Table name or alias qualifying the sort column. */
  tableNameOrAlias: string | undefined;
  /** Column or expression name used for ordering. */
  columnName: string | undefined;
  /** ASC, DESC, or none. */
  direction: OrderByDirection;
  /** `NULLS FIRST`/`NULLS LAST` placement; `None` omits it (dialect default). Ignored for `raw`. */
  nulls: NullsOrder;
  /** Raw SQL for this ORDER BY term when not using structured fields. */
  raw: string | undefined;
};

/** Creates an {@link OrderByState} with default field values. */
export const createOrderByState = (): OrderByState => ({
  builderType: BuilderType.None,
  tableNameOrAlias: undefined,
  columnName: undefined,
  direction: OrderByDirection.None,
  nulls: NullsOrder.None,
  raw: undefined,
});
