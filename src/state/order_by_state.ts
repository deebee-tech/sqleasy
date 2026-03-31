import { BuilderType } from "../enums/builder_type";
import { OrderByDirection } from "../enums/order_by_direction";

/**
 * Holds state for one ORDER BY sort key and direction.
 * Populated by the builder; exposed via {@link SqlEasyState.orderByStates}.
 */
export class OrderByState {
   /** Which builder variant produced this state. */
   builderType: BuilderType = BuilderType.None;
   /** Table name or alias qualifying the sort column. */
   tableNameOrAlias: string | undefined = undefined;
   /** Column or expression name used for ordering. */
   columnName: string | undefined = undefined;
   /** ASC, DESC, or none. */
   direction: OrderByDirection = OrderByDirection.None;
   /** Raw SQL for this ORDER BY term when not using structured fields. */
   raw: string | undefined = undefined;
}
