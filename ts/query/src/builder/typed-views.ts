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
 * whole chain. Terminal methods that return something else (`parsePrepared`, `state`, …) keep their
 * real return. Everything NOT in the key set is simply absent.
 *
 * Two other approaches were measured and rejected: a `this`-returning `Omit<QueryBuilder, K>` does
 * NOT drop the omitted method (polymorphic `this` reintroduces it), and a method typed to `never` on
 * the wrong dialect still autocompletes and only fails on call — which defeats the "hit the dot"
 * test. Only structural absence via this mapped-type derivation passes.
 */
export type BuilderView<Keys extends keyof QueryBuilder, Self> = {
  [K in Keys]: QueryBuilder[K] extends (...args: infer A) => QueryBuilder
    ? (...args: A) => Self
    : QueryBuilder[K];
};

/**
 * Methods that only MSSQL can run, so they are absent from the other three views.
 *
 * `top`/`clearTop` — `TOP` is a T-SQL keyword; the row cap elsewhere is `limit()`. `merge` — MERGE
 * is native T-SQL only. `hintMssqlOption` — a T-SQL `OPTION (...)` query hint. All adjudicated in
 * `contract/capabilities/decisions.json`.
 */
type MssqlOnly = 'top' | 'clearTop' | 'merge' | 'hintMssqlOption';

/**
 * Methods that only Postgres can run. `distinctOn`/`clearDistinctOn` — `DISTINCT ON` is Postgres
 * only; the other three already refuse it at runtime.
 */
type PostgresOnly = 'distinctOn' | 'clearDistinctOn';

// The rollout tightens these as the capability manifest is adjudicated. Only cells that are ACTUALLY
// adjudicated appear above — an un-adjudicated method stays on every view (shared by default) rather
// than being asserted absent on a guess. Asserting an absence we have not verified would be the same
// dishonesty this surface exists to remove, pointed the other way.

// Each view is an `interface extends`, not a `type` alias, because a view passes ITSELF as `Self`
// (so builder-returning methods report the view type and chaining stays narrow) — and a `type` alias
// cannot reference itself (TS2456), while an interface can. The bodies are intentionally empty: the
// whole shape comes from `BuilderView`. The empty-object-type lint is disabled per view for exactly
// that reason.

/** The MSSQL builder view: every common method plus MSSQL's own, minus what only Postgres can do. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MssqlQueryBuilder extends BuilderView<
  Exclude<keyof QueryBuilder, PostgresOnly>,
  MssqlQueryBuilder
> {}

/** The Postgres builder view. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PostgresQueryBuilder extends BuilderView<
  Exclude<keyof QueryBuilder, MssqlOnly>,
  PostgresQueryBuilder
> {}

/** The MySQL builder view. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MysqlQueryBuilder extends BuilderView<
  Exclude<keyof QueryBuilder, MssqlOnly | PostgresOnly>,
  MysqlQueryBuilder
> {}

/** The SQLite builder view. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SqliteQueryBuilder extends BuilderView<
  Exclude<keyof QueryBuilder, MssqlOnly | PostgresOnly>,
  SqliteQueryBuilder
> {}

/**
 * The surface every dialect shares — the intersection of the four views (nothing dialect-exclusive).
 *
 * All four dialect views are assignable to this, so a helper that works on *any* dialect's builder
 * and only touches common methods should accept `CommonQueryBuilder` (or be generic over it) rather
 * than the concrete `QueryBuilder`, which the narrow views are NOT assignable to.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CommonQueryBuilder extends BuilderView<
  Exclude<keyof QueryBuilder, MssqlOnly | PostgresOnly>,
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
