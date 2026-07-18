/**
 * The conflict-resolution action for an INSERT's upsert clause.
 */
export const UpsertAction = {
  /** No upsert clause configured. */
  None: 'None',
  /** Conflicting rows are silently skipped (PG/SQLite `DO NOTHING`, MySQL `INSERT IGNORE`). */
  DoNothing: 'DoNothing',
  /** Conflicting rows are updated (PG/SQLite `DO UPDATE SET`, MySQL `ON DUPLICATE KEY UPDATE`). */
  DoUpdate: 'DoUpdate',
} as const;

/** One of the {@link UpsertAction} values. */
export type UpsertAction = (typeof UpsertAction)[keyof typeof UpsertAction];
