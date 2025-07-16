import { BuilderType } from "../enums/builder_type";
import { OrderByDirection } from "../enums/order_by_direction";

export class OrderByState {
   builderType: BuilderType = BuilderType.None;
   tableNameOrAlias: string | undefined = undefined;
   columnName: string | undefined = undefined;
   direction: OrderByDirection = OrderByDirection.None;
   raw: string | undefined = undefined;
}
