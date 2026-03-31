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

/**
 * Root snapshot of query-builder state returned by {@link IBuilder.state}.
 * Arrays preserve clause order; insert/update fields apply per query kind.
 */
export class SqlEasyState {
   /** Logical name of the builder instance, if set. */
   builderName: string = "";
   /** High-level statement kind (SELECT, INSERT, etc.). */
   queryType: QueryType = QueryType.Select;
   /** FROM sources in declaration order. */
   fromStates: FromState[] = [];
   /** JOIN clauses in declaration order. */
   joinStates: JoinState[] = [];
   /** WHERE predicates in declaration order. */
   whereStates: WhereState[] = [];
   /** ORDER BY terms in declaration order. */
   orderByStates: OrderByState[] = [];
   /** SELECT list items in declaration order. */
   selectStates: SelectState[] = [];
   /** GROUP BY terms in declaration order. */
   groupByStates: GroupByState[] = [];
   /** HAVING predicates in declaration order. */
   havingStates: HavingState[] = [];
   /** UNION / compound-query parts in declaration order. */
   unionStates: UnionState[] = [];
   /** WITH (CTE) entries in declaration order. */
   cteStates: CteState[] = [];
   /** INSERT-specific state; undefined for non-INSERT queries. */
   insertState: InsertState | undefined = undefined;
   /** UPDATE SET assignments in declaration order. */
   updateStates: UpdateState[] = [];
   /** True when this state represents a nested subquery, not the outer query. */
   isInnerStatement: boolean = false;
   /** Maximum row count (0 often means unset; dialect-specific). */
   limit: number = 0;
   /** Rows to skip before returning (0 often means unset). */
   offset: number = 0;
   /** Whether SELECT DISTINCT was requested. */
   distinct: boolean = false;
   /** Opaque hook for dialect- or app-specific extensions. */
   customState: any | undefined = undefined;
}
