import type { FromState } from "./from_state";
import type { JoinState } from "./join_state";
import type { OrderByState } from "./order_by_state";
import type { SelectState } from "./select_state";
import type { WhereState } from "./where_state";

export class SqlEasyState {
   builderName: string = "";
   fromStates: FromState[] = [];
   joinStates: JoinState[] = [];
   whereStates: WhereState[] = [];
   orderByStates: OrderByState[] = [];
   selectStates: SelectState[] = [];
   isInnerStatement: boolean = false;
   limit: number = 0;
   offset: number = 0;
   distinct: boolean = false;
   customState: any | undefined = undefined;
}
