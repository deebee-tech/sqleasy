import type { CteState } from './cte';
import type { FromState } from './from';
import type { GroupByState } from './group-by';
import type { HavingState } from './having';
import type { InsertState } from './insert';
import type { JoinState } from './join';
import type { OrderByState } from './order-by';
import type { SelectState } from './select';
import type { UnionState } from './union';
import type { UpdateState } from './update';
import type { WhereState } from './where';
import { QueryType } from '../enums/query-type';

/**
 * Root snapshot of query-builder state returned by {@link QueryBuilder.state}.
 * Arrays preserve clause order; insert/update fields apply per query kind.
 */
export type QueryState = {
  /** Logical name of the builder instance, if set. */
  builderName: string;
  /** High-level statement kind (SELECT, INSERT, etc.). */
  queryType: QueryType;
  /** FROM sources in declaration order. */
  fromStates: FromState[];
  /** JOIN clauses in declaration order. */
  joinStates: JoinState[];
  /** WHERE predicates in declaration order. */
  whereStates: WhereState[];
  /** ORDER BY terms in declaration order. */
  orderByStates: OrderByState[];
  /** SELECT list items in declaration order. */
  selectStates: SelectState[];
  /** GROUP BY terms in declaration order. */
  groupByStates: GroupByState[];
  /** HAVING predicates in declaration order. */
  havingStates: HavingState[];
  /** UNION / compound-query parts in declaration order. */
  unionStates: UnionState[];
  /** WITH (CTE) entries in declaration order. */
  cteStates: CteState[];
  /** INSERT-specific state; undefined for non-INSERT queries. */
  insertState: InsertState | undefined;
  /** UPDATE SET assignments in declaration order. */
  updateStates: UpdateState[];
  /** True when this state represents a nested subquery, not the outer query. */
  isInnerStatement: boolean;
  /** Maximum row count (0 often means unset; dialect-specific). */
  limit: number;
  /** Rows to skip before returning (0 often means unset). */
  offset: number;
  /** Whether SELECT DISTINCT was requested. */
  distinct: boolean;
  /** Opaque hook for dialect- or app-specific extensions. */
  customState: any | undefined;
};

/** Creates a {@link QueryState} with default field values (an empty SELECT). */
export const createQueryState = (): QueryState => ({
  builderName: '',
  queryType: QueryType.Select,
  fromStates: [],
  joinStates: [],
  whereStates: [],
  orderByStates: [],
  selectStates: [],
  groupByStates: [],
  havingStates: [],
  unionStates: [],
  cteStates: [],
  insertState: undefined,
  updateStates: [],
  isInnerStatement: false,
  limit: 0,
  offset: 0,
  distinct: false,
  customState: undefined,
});
