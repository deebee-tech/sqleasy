import type { Dialect } from '../configuration/configuration';
import { JoinOnBuilder } from './join-on';
import { QueryBuilder } from './query';
import type { MssqlQueryBuilder } from './typed-views';
import type {
  MergeAssignment,
  MergeExpr,
  MergeState,
  MergeWhenAction,
  MergeWhenMatch,
} from '../state/merge';
import { createMergeState } from '../state/merge';

/** `source.<col>` — a reference to the USING source row (the common MERGE RHS). */
export const source = (columnName: string): MergeExpr => ({ kind: 'source', columnName });
/** `target.<col>` — a reference to the target row. */
export const target = (columnName: string): MergeExpr => ({ kind: 'target', columnName });
/** A genuine bound literal (`@pN`), for the rarer case where a WHEN action assigns a constant. */
export const value = (v: any): MergeExpr => ({ kind: 'value', value: v });
/** A raw SQL fragment for an RHS the structured forms cannot express. */
export const raw = (sql: string): MergeExpr => ({ kind: 'raw', sql });

/**
 * Builds a T-SQL `MERGE` statement, one clause per method, in the grammar's own vocabulary.
 *
 * MERGE is native T-SQL and exists on no other dialect; {@link QueryBuilder.merge} stores this
 * state and the parser refuses it everywhere but MSSQL. This is a whole statement, not an INSERT
 * with a conflict clause — that conflation was the removed lie.
 *
 * Populated through a callback, the same shape as `joinTable((j) => …)` and
 * `selectWindow(fn, (w) => …)`.
 */
export class MergeBuilder {
  #state: MergeState = createMergeState();
  #config: Dialect;

  constructor(config: Dialect) {
    this.#config = config;
  }

  #child = (): QueryBuilder => new QueryBuilder(this.#config);

  #collectAnd = (and?: (j: JoinOnBuilder) => void): MergeState['whenStates'][number]['and'] => {
    if (!and) {
      return undefined;
    }
    const j = new JoinOnBuilder(this.#config);
    and(j);
    return j.states();
  };

  #pushWhen = (
    match: MergeWhenMatch,
    action: MergeWhenAction,
    and?: (j: JoinOnBuilder) => void,
  ): this => {
    this.#state.whenStates.push({ match, and: this.#collectAnd(and), action });
    return this;
  };

  /** `MERGE INTO <table> [AS alias]` — target defaults to the alias `target`, owner to the dialect default. */
  public into = (table: string, alias = 'target'): this => {
    this.#state.targetTable = table;
    this.#state.targetAlias = alias;
    return this;
  };

  /** `MERGE INTO <owner>.<table> [AS alias]`. */
  public intoWithOwner = (owner: string, table: string, alias = 'target'): this => {
    this.#state.targetOwner = owner;
    this.#state.targetTable = table;
    this.#state.targetAlias = alias;
    return this;
  };

  /**
   * `WITH (HOLDLOCK)` on the target.
   *
   * A MERGE used as an upsert is race-prone at READ COMMITTED without it — under concurrency an
   * un-hinted MERGE can still raise a duplicate-key violation, which `HOLDLOCK` (a SERIALIZABLE
   * hint on the target only) prevents. The builder does not add it for you: it emits the MERGE you
   * wrote, and this is how you write the concurrency-safe one.
   */
  public holdlock = (on = true): this => {
    this.#state.holdlock = on;
    return this;
  };

  /** `USING (VALUES …) AS alias (columns)` — one or more literal rows. */
  public usingValues = (alias: string, columns: string[], rows: any[][]): this => {
    this.#state.using = { kind: 'values', alias, columns, rows };
    return this;
  };

  /** `USING <table> AS alias`. */
  public usingTable = (table: string, alias: string, owner?: string): this => {
    this.#state.using = { kind: 'table', owner, table, alias };
    return this;
  };

  /**
   * `USING (<subquery>) AS alias`. MERGE is MSSQL-only, so its USING subquery runs on MSSQL — the
   * callback builder is the MSSQL view, keeping the honest-surface ceiling inside the subquery too.
   * The concrete `QueryBuilder` the runtime passes is assignable to that view.
   */
  public usingSelect = (alias: string, build: (q: MssqlQueryBuilder) => void): this => {
    const child = this.#child();
    build(child);
    child.state().isInnerStatement = true;
    this.#state.using = { kind: 'select', alias, subquery: child.state() };
    return this;
  };

  /** `USING <raw> AS alias`, for a source the structured forms cannot express (APPLY, TVF, …). */
  public usingRaw = (sql: string, alias: string): this => {
    this.#state.using = { kind: 'raw', alias, sql };
    return this;
  };

  /** `ON <merge_search_condition>` — required; full predicate strength via {@link JoinOnBuilder}. */
  public on = (build: (j: JoinOnBuilder) => void): this => {
    const j = new JoinOnBuilder(this.#config);
    build(j);
    this.#state.onStates = j.states();
    return this;
  };

  /** `WHEN MATCHED [AND …] THEN UPDATE SET …`. */
  public whenMatchedThenUpdate = (
    assignments: MergeAssignment[],
    and?: (j: JoinOnBuilder) => void,
  ): this => this.#pushWhen('matched', { kind: 'update', assignments, raw: undefined }, and);

  /** `WHEN MATCHED [AND …] THEN UPDATE SET <raw>`. */
  public whenMatchedThenUpdateRaw = (raw: string, and?: (j: JoinOnBuilder) => void): this =>
    this.#pushWhen('matched', { kind: 'update', assignments: [], raw }, and);

  /** `WHEN MATCHED [AND …] THEN DELETE`. */
  public whenMatchedThenDelete = (and?: (j: JoinOnBuilder) => void): this =>
    this.#pushWhen('matched', { kind: 'delete' }, and);

  /** `WHEN NOT MATCHED [BY TARGET] [AND …] THEN INSERT (columns) VALUES (…)`. */
  public whenNotMatchedThenInsert = (
    columns: string[],
    values: MergeExpr[],
    and?: (j: JoinOnBuilder) => void,
  ): this => this.#pushWhen('notMatchedByTarget', { kind: 'insert', columns, values }, and);

  /** `WHEN NOT MATCHED [BY TARGET] [AND …] THEN INSERT DEFAULT VALUES`. */
  public whenNotMatchedThenInsertDefaultValues = (and?: (j: JoinOnBuilder) => void): this =>
    this.#pushWhen('notMatchedByTarget', { kind: 'insertDefaultValues' }, and);

  /** `WHEN NOT MATCHED BY SOURCE [AND …] THEN UPDATE SET …`. */
  public whenNotMatchedBySourceThenUpdate = (
    assignments: MergeAssignment[],
    and?: (j: JoinOnBuilder) => void,
  ): this =>
    this.#pushWhen('notMatchedBySource', { kind: 'update', assignments, raw: undefined }, and);

  /** `WHEN NOT MATCHED BY SOURCE [AND …] THEN DELETE`. */
  public whenNotMatchedBySourceThenDelete = (and?: (j: JoinOnBuilder) => void): this =>
    this.#pushWhen('notMatchedBySource', { kind: 'delete' }, and);

  /**
   * `OUTPUT <expression>` as a raw fragment, e.g. `$action, inserted.id, deleted.status`.
   *
   * Deliberately raw, and the only OUTPUT form offered here. MERGE's OUTPUT is materially richer
   * than an INSERT/UPDATE/DELETE OUTPUT — it exposes the per-row `$action` and can mix `inserted.*`
   * and `deleted.*` in one row — so a structured `output(columns)` that quietly captured a single
   * side would be exactly the kind of half-true convenience this library refuses. Write the
   * expression; the builder does not pretend to know which side each column comes from.
   */
  public outputRaw = (sql: string): this => {
    this.#state.outputRaw = sql;
    return this;
  };

  public state = (): MergeState => this.#state;
}
