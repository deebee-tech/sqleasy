import type { QueryBuilder } from './query';

/**
 * Per-engine typed views over the single {@link QueryBuilder} runtime class.
 *
 * SQLEasy is an honest capability surface: hitting the dot should show only what the engine you are
 * on can actually do. The runtime enforces that by throwing (the floor, and all Go can do); these
 * views add the compile-time ceiling for TypeScript — a method a dialect cannot run is not on that
 * dialect's builder type, so it does not autocomplete and does not compile.
 *
 * There is ONE runtime class. A dialect facade (`MssqlQuery.newBuilder()`, …) constructs a
 * `QueryBuilder` and returns it typed as the narrow view; the object is unchanged, only its static
 * type is narrowed. Structural typing makes this sound — `QueryBuilder` really does have every
 * method each view exposes — and the {@link _assertQueryBuilderSatisfiesViews} guard fails the build
 * if that ever stops being true.
 *
 * ── HOW THE VIEW IS DERIVED (mechanism, proven before it was written) ──
 * {@link BuilderView} maps over a curated set of method keys and, for every method that returns the
 * builder (`this`, which resolves to `QueryBuilder` when indexed), REBINDS the return to the viewing
 * type `Self` — so `mssql.selectAll().where(…).top(…)` stays typed as the MSSQL view through the
 * whole chain. It ALSO rebinds subquery-callback parameters (see {@link RebindArgs}): a
 * `fromWithBuilder('sub', (inner) => …)` on the Postgres view hands back an `inner` that is itself
 * the Postgres view, so the ceiling holds one level down — a subquery runs on the SAME engine, and
 * `inner.top(5)` must be just as absent as `pg.top(5)`. Terminal methods that return something else
 * (`parsePrepared`, `state`, …) keep their real return. Everything NOT in the key set is absent.
 *
 * Two other approaches were measured and rejected: a `this`-returning `Omit<QueryBuilder, K>` does
 * NOT drop the omitted method (polymorphic `this` reintroduces it), and a method typed to `never` on
 * the wrong dialect still autocompletes and only fails on call — which defeats the "hit the dot"
 * test. Only structural absence via this mapped-type derivation passes.
 */

/**
 * Rewrites ONE method argument for the viewing type: a subquery callback `(b: QueryBuilder) => R`
 * becomes `(b: Self) => R`, so nested completion is narrowed to the same dialect. Every other
 * argument — a string, a `JoinOnBuilder`/`MergeBuilder`/`WindowBuilder` callback (a different builder
 * type, so it does not match) — is left exactly as it was. The contravariant position is why the
 * anti-drift guard still holds: a concrete `QueryBuilder` is WIDER than the view, which is precisely
 * what a `(b: Self) => R` parameter accepts.
 */
type RebindArg<T, Self> = T extends (b: QueryBuilder) => infer R ? (b: Self) => R : T;

/** Rewrites each argument in a method's parameter tuple via {@link RebindArg}. */
type RebindArgs<A extends readonly unknown[], Self> = { [I in keyof A]: RebindArg<A[I], Self> };

export type BuilderView<Keys extends keyof QueryBuilder, Self> = {
  [K in Keys]: QueryBuilder[K] extends (...args: infer A) => QueryBuilder
    ? (...args: RebindArgs<A, Self>) => Self
    : QueryBuilder[K];
};

/**
 * ── THE ADJUDICATION ──
 *
 * Below, each dialect names the methods it CANNOT run — the compile-time mirror of a runtime
 * refusal that ALWAYS fires on that dialect, no matter the arguments. Every entry is grounded in a
 * hard `throw` in the parser: if a method merely *sometimes* refuses (only in a certain combination,
 * or only for a non-empty argument), it stays on the view and the runtime handles the bad case. To
 * assert an absence we had not verified would be the same dishonesty this surface removes, pointed
 * the other way — so a method appears here only when its refusal has no escape path.
 *
 * A `clear*` sits beside its setter: `clearTop` is listed wherever `top` is, because a clear for a
 * capability the view does not expose has nothing to clear. `distinct`/`clearDistinct` (plain
 * DISTINCT, universal) are deliberately NOT here — only `distinctOn`/`clearDistinctOn` are.
 *
 * Conditional refusals intentionally left OFF these lists (they stay shared, runtime-guarded):
 *   • `joinTable(JoinType.FullOuter)` — MySQL rejects only that one join type, not `joinTable`.
 *   • `fromTableWithOwner`/`joinTableWithOwner`/… — MySQL refuses a NON-empty owner; an empty owner
 *     is accepted, so the method is usable.
 *   • `onConflictDoUpdate` on MySQL — valid (ON DUPLICATE KEY UPDATE); only a conflict TARGET is
 *     refused. Absent on MSSQL, which has no upsert at all.
 *   • `procParamNamed` on MSSQL — valid for procedures; only a named arg to a FUNCTION is refused.
 *   • `limitWithTies` + `offset` on MSSQL — the combination is refused, not `limitWithTies` itself.
 *   • joins in UPDATE/DELETE on SQLite — `joinTable` is fine on a SELECT; only the mutation combo
 *     throws.
 */

/**
 * MSSQL cannot run these.
 *
 * `forShare*` — no shared row lock; HOLDLOCK is a SERIALIZABLE isolation hint, not `FOR SHARE`
 * (default-row-lock). `fromLateral`/`joinLateral` — T-SQL spells LATERAL as APPLY, so the LATERAL
 * forms are refused in favour of `joinCrossApply`/`joinOuterApply` (default-from, default-join).
 * `whereJsonContains`/`havingJsonContains` — no JSON containment operator (default-where).
 * `onConflict*`/`clearUpsert` — no upsert; T-SQL expresses it with the separate MERGE statement
 * (default-insert). `hintUseIndex`/`hintForceIndex` — MySQL-only index hints (default-hint).
 * `distinctOn`/`clearDistinctOn` — `DISTINCT ON` is Postgres-only (default-select).
 */
type AbsentOnMssql =
  | 'forShare'
  | 'forShareNowait'
  | 'forShareSkipLocked'
  | 'fromLateral'
  | 'joinLateral'
  | 'whereJsonContains'
  | 'havingJsonContains'
  | 'onConflictDoNothing'
  | 'onConflictDoUpdate'
  | 'onConflictDoUpdateRaw'
  | 'clearUpsert'
  | 'hintUseIndex'
  | 'hintForceIndex'
  | 'distinctOn'
  | 'clearDistinctOn'
  // Engine-native renames: MSSQL spells the exclusive lock family `updlock*`, so `forUpdate*` are
  // hidden here; the MySQL upsert spellings live only on the MySQL view.
  | 'forUpdate'
  | 'forUpdateNowait'
  | 'forUpdateSkipLocked'
  | 'insertIgnore'
  | 'onDuplicateKeyUpdate'
  | 'onDuplicateKeyUpdateRaw';

/**
 * MySQL cannot run these.
 *
 * `top`/`clearTop` — `TOP` is a T-SQL keyword; the row cap is `limit()`. `merge` — MERGE is native
 * T-SQL only. `hintMssqlOption` — a T-SQL `OPTION (...)` hint. `distinctOn`/`clearDistinctOn` —
 * Postgres-only. `limitWithTies`/`clearLimitWithTies` — no WITH TIES (default-limit-offset).
 * `groupByCube`/`groupByGroupingSets` — MySQL has ROLLUP but neither CUBE nor GROUPING SETS
 * (default-group-by). `fromTableFunction`/`fromTableFunctionWithOwner` — no table-valued functions
 * in FROM (default-from). `procParamNamed` — no named parameters in CALL (default-call).
 * `returning`/`returningRaw`/`clearReturning` — no RETURNING clause (default-returning).
 */
type AbsentOnMysql =
  | 'top'
  | 'clearTop'
  | 'merge'
  | 'hintMssqlOption'
  | 'distinctOn'
  | 'clearDistinctOn'
  | 'limitWithTies'
  | 'clearLimitWithTies'
  | 'groupByCube'
  | 'groupByGroupingSets'
  | 'fromTableFunction'
  | 'fromTableFunctionWithOwner'
  | 'procParamNamed'
  | 'returning'
  | 'returningRaw'
  | 'clearReturning'
  // Engine-native renames: MySQL spells upsert `insertIgnore` / `onDuplicateKeyUpdate*`, so
  // `onConflict*` are hidden here; the MSSQL `updlock*` family lives only on the MSSQL view. MySQL
  // keeps `forUpdate*`.
  | 'onConflictDoNothing'
  | 'onConflictDoUpdate'
  | 'onConflictDoUpdateRaw'
  | 'updlock'
  | 'updlockNowait'
  | 'updlockSkipLocked';

/**
 * Postgres cannot run these.
 *
 * `top`/`clearTop` — T-SQL keyword; use `limit()`. `merge` — native T-SQL only. `hintMssqlOption` —
 * T-SQL `OPTION (...)`. `hintUseIndex`/`hintForceIndex` — MySQL-only index hints (default-hint).
 * Everything else Postgres does; it is the widest surface, and `distinctOn` is its own.
 */
type AbsentOnPostgres =
  | 'top'
  | 'clearTop'
  | 'merge'
  | 'hintMssqlOption'
  | 'hintUseIndex'
  | 'hintForceIndex'
  // Engine-native renames belonging to other dialects: Postgres keeps `forUpdate*` and `onConflict*`.
  | 'updlock'
  | 'updlockNowait'
  | 'updlockSkipLocked'
  | 'insertIgnore'
  | 'onDuplicateKeyUpdate'
  | 'onDuplicateKeyUpdateRaw';

/**
 * SQLite cannot run these — the narrowest surface.
 *
 * `call*`/`clearCall`/`procParam*` — no stored procedures or functions (default-call). `forUpdate*`/
 * `forShare*`/`clearRowLock` — no row locking (default-row-lock). `fromLateral`/`joinLateral`/
 * `joinCrossApply`/`joinOuterApply` — no LATERAL or APPLY (default-from, default-join).
 * `groupByRollup`/`groupByCube`/`groupByGroupingSets` — none of the grouping extensions
 * (default-group-by). `whereJsonContains`/`havingJsonContains` — no JSON containment (default-where).
 * `hintUseIndex`/`hintForceIndex` — MySQL-only; `hintMssqlOption` — MSSQL-only (default-hint).
 * `limitWithTies`/`clearLimitWithTies` — no WITH TIES. `merge`, `top`/`clearTop` — T-SQL only.
 * `distinctOn`/`clearDistinctOn` — Postgres-only.
 */
type AbsentOnSqlite =
  | 'callProcedure'
  | 'callProcedureWithOwner'
  | 'callFunction'
  | 'callFunctionWithOwner'
  | 'clearCall'
  | 'procParam'
  | 'procParams'
  | 'procParamNamed'
  | 'procParamInOut'
  | 'procParamOut'
  | 'procParamRaw'
  | 'forUpdate'
  | 'forUpdateNowait'
  | 'forUpdateSkipLocked'
  | 'forShare'
  | 'forShareNowait'
  | 'forShareSkipLocked'
  | 'clearRowLock'
  | 'fromLateral'
  | 'joinLateral'
  | 'joinCrossApply'
  | 'joinOuterApply'
  | 'groupByRollup'
  | 'groupByCube'
  | 'groupByGroupingSets'
  | 'whereJsonContains'
  | 'havingJsonContains'
  | 'hintUseIndex'
  | 'hintForceIndex'
  | 'hintMssqlOption'
  | 'limitWithTies'
  | 'clearLimitWithTies'
  | 'merge'
  | 'top'
  | 'clearTop'
  | 'distinctOn'
  | 'clearDistinctOn'
  // Engine-native renames belonging to other dialects: SQLite keeps `onConflict*` and already lacks
  // row locking, so it never had `forUpdate*`.
  | 'updlock'
  | 'updlockNowait'
  | 'updlockSkipLocked'
  | 'insertIgnore'
  | 'onDuplicateKeyUpdate'
  | 'onDuplicateKeyUpdateRaw';

// Each view is an `interface extends`, not a `type` alias, because a view passes ITSELF as `Self`
// (so builder-returning methods report the view type and chaining stays narrow) — and a `type` alias
// cannot reference itself (TS2456), while an interface can. The bodies are intentionally empty: the
// whole shape comes from `BuilderView`. The empty-object-type lint is disabled per view for exactly
// that reason.

/** The MSSQL builder view — every method except {@link AbsentOnMssql}. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MssqlQueryBuilder extends BuilderView<
  Exclude<keyof QueryBuilder, AbsentOnMssql>,
  MssqlQueryBuilder
> {}

/** The Postgres builder view — every method except {@link AbsentOnPostgres}. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PostgresQueryBuilder extends BuilderView<
  Exclude<keyof QueryBuilder, AbsentOnPostgres>,
  PostgresQueryBuilder
> {}

/** The MySQL builder view — every method except {@link AbsentOnMysql}. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MysqlQueryBuilder extends BuilderView<
  Exclude<keyof QueryBuilder, AbsentOnMysql>,
  MysqlQueryBuilder
> {}

/** The SQLite builder view — every method except {@link AbsentOnSqlite}. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SqliteQueryBuilder extends BuilderView<
  Exclude<keyof QueryBuilder, AbsentOnSqlite>,
  SqliteQueryBuilder
> {}

/**
 * The surface every dialect shares — a method appears here only when NO dialect lacks it, so it is
 * `keyof QueryBuilder` minus the union of all four absence sets.
 *
 * All four dialect views are assignable to this, so a helper that works on *any* dialect's builder
 * and only touches common methods should accept `CommonQueryBuilder` (or be generic over it) rather
 * than the concrete `QueryBuilder`, which the narrow views are NOT assignable to.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CommonQueryBuilder extends BuilderView<
  Exclude<keyof QueryBuilder, AbsentOnMssql | AbsentOnMysql | AbsentOnPostgres | AbsentOnSqlite>,
  CommonQueryBuilder
> {}

/**
 * Anti-drift guard, checked at compile time only (never called).
 *
 * A view is a hand-curated subset of `QueryBuilder`'s surface. If a method a view names is renamed
 * or removed on `QueryBuilder`, or its signature drifts, these assignments stop type-checking and
 * the build fails — so a view can never quietly promise a method the runtime no longer has. The
 * runtime `QueryBuilder` must be assignable to every view, because it genuinely has all their
 * methods; the narrowing is only in the static type a facade hands back.
 */
export const _assertQueryBuilderSatisfiesViews = (builder: QueryBuilder): void => {
  const _mssql: MssqlQueryBuilder = builder;
  const _postgres: PostgresQueryBuilder = builder;
  const _mysql: MysqlQueryBuilder = builder;
  const _sqlite: SqliteQueryBuilder = builder;
  void _mssql;
  void _postgres;
  void _mysql;
  void _sqlite;
};
