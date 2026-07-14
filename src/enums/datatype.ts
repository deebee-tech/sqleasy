/**
 * A coarse value category. SQL generation does not use it — it is exposed for callers that want
 * to describe or coerce column values on top of the builder.
 */
export const Datatype = {
  /** Boolean value. */
  Boolean: 'Boolean',
  /** Date/time value. */
  DateTime: 'DateTime',
  /** Numeric value. */
  Number: 'Number',
  /** String value. */
  String: 'String',
  /** Unknown or unspecified type. */
  Unknown: 'Unknown',
} as const;

/** One of the {@link Datatype} value categories. */
export type Datatype = (typeof Datatype)[keyof typeof Datatype];
