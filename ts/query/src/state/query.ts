import type { HintState } from './hint';
import type { CallState } from './call';
import type { CteState } from './cte';
import type { FromState } from './from';
import type { GroupByState } from './group-by';
import type { HavingState } from './having';
import type { InsertState } from './insert';
import type { MergeState } from './merge';
import type { JoinState } from './join';
import type { OrderByState } from './order-by';
import type { ReturningState } from './returning';
import type { RowLockState } from './row-lock';
import type { SelectState } from './select';
import type { UnionState } from './union';
import type { UpdateState } from './update';
import type { UpsertState } from './upsert';
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
  /** INSERT conflict clause (upsert); undefined when not configured. */
  upsertState: UpsertState | undefined;
  /** MERGE statement (native T-SQL only); undefined when not a MERGE. */
  mergeState: MergeState | undefined;
  /** RETURNING/OUTPUT clause for INSERT/UPDATE/DELETE; undefined when not configured. */
  returningState: ReturningState | undefined;
  /** Row-locking clause for SELECT (`FOR UPDATE`/`FOR SHARE`); undefined when not configured. */
  rowLock: RowLockState | undefined;
  /** Stored procedure/function call state; undefined for non-Call queries. */
  callState: CallState | undefined;
  /** True when this state represents a nested subquery, not the outer query. */
  isInnerStatement: boolean;
  /** Maximum row count. `0` is unreachable — `limit()` refuses a non-positive value. */
  limit: number;
  /** When true, emit `WITH TIES` alongside the row limit (dialect-specific). */
  limitWithTies?: boolean;
  /**
   * Rows to skip before returning. `undefined` means the caller never asked; `0` means they asked
   * for zero, which is NOT the same thing and is not interchangeable.
   *
   * `OFFSET 0 ROWS` is the token that legalises an ORDER BY inside an MSSQL derived table or
   * subquery — measured: `SELECT * FROM (SELECT id FROM orders ORDER BY id) x` is Msg 1033, and
   * adding `OFFSET 0 ROWS` alone (no FETCH) makes it run. Treating `0` as "unset" therefore
   * deleted the only clause holding the statement up.
   */
  offset: number | undefined;
  /** Whether SELECT DISTINCT was requested. */
  distinct: boolean;
  /**
   * `DISTINCT ON (...)` columns (Postgres only); undefined/empty omits it. Mutually exclusive
   * with {@link distinct} — setting both throws at parse time.
   */
  distinctOnColumns: { tableNameOrAlias: string; columnName: string }[] | undefined;
  /** Opaque hook for dialect- or app-specific extensions. */
  customState: any | undefined;
  /**
   * Index into {@link fromStates} for the UPDATE/DELETE target table.
   * Set by `updateTable` / `deleteFrom` so a prior `fromTable` cannot steal the target.
   */
  mutationTargetIndex: number | undefined;
  /** Structured/raw query hints in declaration order. */
  hintStates?: HintState[];
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
  upsertState: undefined,
  mergeState: undefined,
  returningState: undefined,
  rowLock: undefined,
  callState: undefined,
  isInnerStatement: false,
  limit: 0,
  limitWithTies: false,
  offset: undefined,
  distinct: false,
  distinctOnColumns: undefined,
  customState: undefined,
  mutationTargetIndex: undefined,
  hintStates: [],
});
