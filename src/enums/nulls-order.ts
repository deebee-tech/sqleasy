/**
 * `NULLS FIRST` / `NULLS LAST` placement for an ORDER BY term (top-level or inside a window's
 * `OVER (... ORDER BY ...)`). Postgres and SQLite have native syntax; MySQL and MSSQL have
 * neither, and get an equivalent `CASE WHEN col IS NULL THEN … END` sort-key emulation — see
 * `default-order-by.ts`.
 */
export const NullsOrder = {
  /** No explicit NULL placement — dialect default (NULLS LAST for ASC, NULLS FIRST for DESC, per SQL:2003). */
  None: 'None',
  /** NULLs sort before all non-NULL values. */
  First: 'First',
  /** NULLs sort after all non-NULL values. */
  Last: 'Last',
} as const;

/** One of the {@link NullsOrder} placements. */
export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder];
