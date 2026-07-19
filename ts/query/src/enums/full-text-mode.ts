/**
 * Full-text search match mode — not every dialect supports every mode; unsupported combos throw
 * at parse time.
 */
export const FullTextMode = {
  /** Natural-language / plain search (PG `plainto_tsquery`, MySQL natural mode, MSSQL `FREETEXT`). */
  Natural: 'Natural',
  /** Boolean / structured query (PG `to_tsquery`, MySQL boolean mode, MSSQL `CONTAINS`). */
  Boolean: 'Boolean',
  /** Phrase search where the dialect distinguishes it (MySQL `IN BOOLEAN MODE` phrase, PG phrase). */
  Phrase: 'Phrase',
} as const;

/** One of the {@link FullTextMode} values. */
export type FullTextMode = (typeof FullTextMode)[keyof typeof FullTextMode];
