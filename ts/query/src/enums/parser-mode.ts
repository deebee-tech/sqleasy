/**
 * Whether values are inlined into the SQL (Raw) or surfaced as bound parameters (Prepared).
 */
export const ParserMode = {
  /** Values are rendered inline into the SQL string. */
  Raw: 'Raw',
  /** Values are replaced by placeholders and surfaced separately. */
  Prepared: 'Prepared',
  /** No mode / unused. */
  None: 'None',
} as const;

/** One of the {@link ParserMode} values. */
export type ParserMode = (typeof ParserMode)[keyof typeof ParserMode];
