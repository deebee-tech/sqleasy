/**
 * Structured query-hint kinds. Each dialect accepts a different subset; unsupported combos throw
 * at parse time. Use {@link QueryBuilder.hintRaw} for hints this enum cannot express.
 */
export const HintKind = {
  /** MySQL `USE INDEX (name)` on a FROM/JOIN table reference. */
  UseIndex: 'UseIndex',
  /** MySQL `FORCE INDEX (name)` on a FROM/JOIN table reference. */
  ForceIndex: 'ForceIndex',
  /** MSSQL trailing `OPTION (...)` clause on a SELECT. */
  MssqlOption: 'MssqlOption',
  /** Dialect-specific raw hint SQL — caller owns correctness. */
  Raw: 'Raw',
} as const;

/** One of the {@link HintKind} values. */
export type HintKind = (typeof HintKind)[keyof typeof HintKind];
