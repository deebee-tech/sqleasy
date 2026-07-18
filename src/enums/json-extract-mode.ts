/**
 * Whether a JSON path read returns text (`->>` / `JSON_UNQUOTE`) or a JSON value (`->` /
 * `JSON_EXTRACT`).
 */
export const JsonExtractMode = {
  /** Text extraction (`->>` on Postgres, `JSON_UNQUOTE(JSON_EXTRACT(...))` elsewhere). */
  Text: 'Text',
  /** JSON value extraction (`->` on Postgres, `JSON_EXTRACT` elsewhere). */
  Object: 'Object',
} as const;

/** One of the {@link JsonExtractMode} values. */
export type JsonExtractMode = (typeof JsonExtractMode)[keyof typeof JsonExtractMode];
