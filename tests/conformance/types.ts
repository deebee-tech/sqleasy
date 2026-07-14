/**
 * The language-neutral golden corpus: the contract every SQLEasy implementation must satisfy.
 *
 * A case describes a query as *intent* — a list of ops — not as a sequence of method calls. That
 * matters because the ports do not share an API: the Dart package uses named parameters and
 * nullable optionals where TypeScript uses positional args and empty-string sentinels. Each
 * language ships a small driver that replays an op-list through its own API and returns
 * `(sql, params)`; both must produce identical output for every dialect. The corpus, not either
 * implementation, is the definition of correct.
 */

export const DIALECTS = ['mssql', 'mysql', 'postgres', 'sqlite'] as const;
export type Dialect = (typeof DIALECTS)[number];

/**
 * A value supplied *into* a query, tagged with its type.
 *
 * The tag is the whole point: JSON cannot distinguish `5` from `5.0`, but the target languages can
 * and do. JavaScript has one number type; Dart has `int` and `double`, and renders them differently
 * (`5` vs `5.0`) — differently again between the Dart VM and dart2js. An untagged `5` in this corpus
 * would let a Dart port silently construct a `double` and emit `@p0 float` where TypeScript emits
 * `@p0 tinyint`. So `int` and `double` are always distinct here, and each driver must construct its
 * language's corresponding type exactly.
 */
export type InputValue =
  | { t: 'null' }
  | { t: 'string'; v: string }
  | { t: 'int'; v: number }
  | { t: 'double'; v: number }
  | { t: 'bool'; v: boolean }
  /** ISO 8601, always UTC, always `Z` — the only form `Date`/`DateTime` agree on. */
  | { t: 'datetime'; v: string };

/**
 * A value that came *out* as a bound parameter.
 *
 * Numbers are tagged `num`, not `int`/`double`, deliberately. A driver hands the bound value
 * straight to the database driver, and no dialect distinguishes an integral double from an int at
 * that boundary — TypeScript cannot even observe the difference (`5.0 === 5`), and Dart's `5 == 5.0`
 * is true. The int/double distinction is pinned where it is actually visible: in the emitted SQL
 * text (MSSQL's `@pN <type>` declarations, and inlined `parseRaw` literals), which the golden `sql`
 * strings below capture exactly.
 */
export type OutputValue =
  | { t: 'null' }
  | { t: 'string'; v: string }
  | { t: 'num'; v: number }
  | { t: 'bool'; v: boolean }
  | { t: 'datetime'; v: string }
  /** Anything a driver would pass through opaquely (an object/array bound as-is). */
  | { t: 'json'; v: string };

/** One builder operation. `ops` on an op is a nested sub-builder (a subquery, group, or CTE body). */
export type Op = {
  op: string;
  [key: string]: unknown;
};

/** What an implementation must produce for one dialect. */
export type Expectation =
  | {
      /** `parsePrepared()` — the execution-safe API. This is the load-bearing assertion. */
      prepared: { sql: string; params: OutputValue[] };
      /** `parseRaw()` — DEBUG rendering, values inlined unquoted. Pins SQL *shape* only. */
      raw: string;
    }
  /** The implementation must reject this input. Matched as a substring of the error message. */
  | { throws: string };

export type Case = {
  name: string;
  /** Why this case exists, when it is not obvious. Kept in the corpus so the Dart port inherits it. */
  note?: string;
  /** A single statement. Mutually exclusive with `builders`. */
  ops?: Op[];
  /** A MultiBuilder batch. Mutually exclusive with `ops`. */
  builders?: { name: string; ops: Op[] }[];
  /** MultiBuilder only; defaults to `on`. */
  transaction?: 'on' | 'off';
  /** Defaults to all four. Narrow it for dialect-specific behaviour (e.g. MSSQL `TOP`). */
  dialects?: Dialect[];
  expect: Partial<Record<Dialect, Expectation>>;
};

export type Corpus = {
  /** The SQLEasy version these goldens were generated from. */
  version: string;
  cases: Case[];
};
