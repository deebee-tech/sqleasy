import { BuilderType } from '../enums/builder-type';
import type { AggregateFunction } from '../enums/aggregate-function';
import type { OrderByDirection } from '../enums/order-by-direction';
import { JsonExtractMode } from '../enums/json-extract-mode';
import type { QueryState } from './query';
import type { WindowState } from './window';

/**
 * Holds state for one SELECT list item (column, subquery, alias, raw, or window function).
 * Populated by the builder; exposed via {@link QueryState.selectStates}.
 */
export type SelectState = {
  /** Which builder variant produced this state. */
  builderType: BuilderType;
  /** Table name or alias qualifying the selected column. */
  tableNameOrAlias: string | undefined;
  /** Column name or expression identifier. */
  columnName: string | undefined;
  /** Output alias for this select item. */
  alias: string | undefined;
  /** Nested query state when this item is a scalar subquery. */
  subquery: QueryState | undefined;
  /**
   * Raw SQL for this select item when not using structured fields. For a `SelectWindow` item,
   * this instead carries the window function's call expression (e.g. `'ROW_NUMBER()'`,
   * `'SUM("o"."amount")'`) — the structured part is the `OVER (...)` clause, in {@link window}.
   */
  raw: string | undefined;
  /** The `OVER (...)` clause for a `SelectWindow` item; unset for every other builder type. */
  window: WindowState | undefined;
  /** JSON path for a `SelectJsonExtract` item. */
  jsonPath?: string;
  /** Text vs JSON-object extraction for a `SelectJsonExtract` item. */
  jsonExtractMode?: JsonExtractMode;
  /**
   * The aggregate applied to this select item, when it is one. A call node with a single operand —
   * `columnName`, or `*` — and nothing nested inside it.
   */
  aggregate?: AggregateFunction;
  /** `COUNT(DISTINCT x)`. Refused with `*`, which every engine rejects. */
  aggregateDistinct?: boolean;
  /**
   * The `FILTER (WHERE …)` predicate on this aggregate, captured as a child state whose
   * whereStates are the predicate. Postgres 9.4+ and SQLite 3.30+ only — MySQL and MSSQL refuse,
   * and the refusal must be OURS: `FILTER` parses as a column alias there, so a bad emission is a
   * silently mis-aliased column rather than an error.
   */
  aggregateFilter?: QueryState;
  /**
   * Ordered string aggregation — `string_agg` / `GROUP_CONCAT` / `STRING_AGG … WITHIN GROUP`.
   *
   * `functionName` is the caller's chosen engine-native spelling; the emitter refuses it on the
   * dialects that lack that name. The three grammars diverge (separator position, ORDER BY inside
   * the parens vs WITHIN GROUP, whether the separator is mandatory), so this carries the parts and
   * the emitter assembles them per dialect.
   */
  stringAgg?: {
    functionName: 'string_agg' | 'group_concat';
    separator?: unknown;
    hasSeparator: boolean;
    distinct: boolean;
    orderBy: { tableNameOrAlias: string; columnName: string; direction: OrderByDirection }[];
  };
};

/** Creates a {@link SelectState} with default field values. */
export const createSelectState = (): SelectState => ({
  builderType: BuilderType.None,
  tableNameOrAlias: undefined,
  columnName: undefined,
  alias: undefined,
  subquery: undefined,
  raw: undefined,
  window: undefined,
  jsonPath: undefined,
  jsonExtractMode: undefined,
});
