import type { CteState } from "./cte_state";
import type { FromState } from "./from_state";
import type { GroupByState } from "./group_by_state";
import type { HavingState } from "./having_state";
import type { InsertState } from "./insert_state";
import type { JoinState } from "./join_state";
import type { OrderByState } from "./order_by_state";
import type { SelectState } from "./select_state";
import type { UnionState } from "./union_state";
import type { UpdateState } from "./update_state";
import type { WhereState } from "./where_state";
import { QueryType } from "../enums/query_type";

export class SqlEasyState {
   builderName: string = "";
   queryType: QueryType = QueryType.Select;
   fromStates: FromState[] = [];
   joinStates: JoinState[] = [];
   whereStates: WhereState[] = [];
   orderByStates: OrderByState[] = [];
   selectStates: SelectState[] = [];
   groupByStates: GroupByState[] = [];
   havingStates: HavingState[] = [];
   unionStates: UnionState[] = [];
   cteStates: CteState[] = [];
   insertState: InsertState | undefined = undefined;
   updateStates: UpdateState[] = [];
   isInnerStatement: boolean = false;
   limit: number = 0;
   offset: number = 0;
   distinct: boolean = false;
   customState: any | undefined = undefined;
}
