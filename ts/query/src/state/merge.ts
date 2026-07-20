import type { JoinOnState } from './join-on';

/**
 * A right-hand-side expression in a MERGE `SET` assignment or `INSERT ... VALUES` list.
 *
 * MERGE is unusual in that the RHS is almost always a reference to the *source* row
 * (`source.col`), not a bound literal — which is why this is a tagged type rather than a plain
 * `value: any`. Making `source(...)` the natural spelling keeps the surface honest about how a
 * MERGE is actually written; `value(...)` is the escape for a genuine bound literal.
 */
export type MergeExpr =
  | { kind: 'source'; columnName: string }
  | { kind: 'target'; columnName: string }
  | { kind: 'value'; value: any }
  | { kind: 'raw'; sql: string };

/** How the MERGE `USING` source is expressed. */
export type MergeUsing =
  | { kind: 'values'; alias: string; columns: string[]; rows: any[][] }
  | { kind: 'table'; owner: string | undefined; table: string; alias: string }
  | { kind: 'select'; alias: string; subquery: unknown }
  | { kind: 'raw'; alias: string; sql: string };

/** One SET assignment inside a WHEN … THEN UPDATE arm. */
export type MergeAssignment = { columnName: string; value: MergeExpr };

/** The action taken by one WHEN clause. */
export type MergeWhenAction =
  | { kind: 'update'; assignments: MergeAssignment[]; raw: string | undefined }
  | { kind: 'delete' }
  | { kind: 'insert'; columns: string[]; values: MergeExpr[] }
  | { kind: 'insertDefaultValues' };

/** Which side of the match a WHEN clause fires on. */
export type MergeWhenMatch = 'matched' | 'notMatchedByTarget' | 'notMatchedBySource';

/** One WHEN clause of a MERGE, in author order. */
export type MergeWhenState = {
  match: MergeWhenMatch;
  /** Optional `AND <condition>` guard, rendered with {@link renderJoinOnConditions}. */
  and: JoinOnState[] | undefined;
  action: MergeWhenAction;
};

/**
 * State for a T-SQL `MERGE` statement. MERGE is native T-SQL only; the parser refuses it on every
 * other dialect. This is a first-class statement, NOT an INSERT carrying an upsert clause — that
 * conflation is precisely the "upsert wearing MERGE's name" that was removed.
 */
export type MergeState = {
  targetOwner: string | undefined;
  targetTable: string | undefined;
  targetAlias: string;
  /** `WITH (HOLDLOCK)` on the target. `undefined` means the caller did not decide either way. */
  holdlock: boolean | undefined;
  using: MergeUsing | undefined;
  /** `ON <merge_search_condition>` — required. */
  onStates: JoinOnState[];
  /** WHEN clauses in author order. */
  whenStates: MergeWhenState[];
  /** Raw `OUTPUT` result-set expression, e.g. `$action, inserted.id, deleted.status`. */
  outputRaw: string | undefined;
};

/** Creates a {@link MergeState} with default field values. */
export const createMergeState = (): MergeState => ({
  targetOwner: undefined,
  targetTable: undefined,
  targetAlias: 'target',
  holdlock: undefined,
  using: undefined,
  onStates: [],
  whenStates: [],
  outputRaw: undefined,
});
