/**
 * The SQLEasy cross-language contract.
 *
 * Every language port depends on THIS package, never on a language implementation. That single rule
 * is what makes the turbo graph behave: a change here reruns every port's conformance suite, while a
 * change in `ts/query` reruns only TypeScript.
 *
 * TypeScript is the reference *minter* of the corpora; every language — TypeScript included — is only
 * a *replayer* of them.
 */

export * from './schema/corpus';
export * from './schema/normalization';
export * from './schema/introspection';

/**
 * Absolute path to the emission corpus.
 *
 * Ports that can read a file at test time (TS, Python, C#, Go, and Dart on the VM) load it from here.
 * Dart additionally base64-embeds it into a generated source file, because dart2js has no `dart:io`
 * and cannot read a file when the suite runs under `-p chrome`.
 */
export const EMISSION_CORPUS_PATH = new URL('./corpora/emission/corpus.json', import.meta.url)
  .pathname;

/**
 * Absolute path to the NORMALIZATION corpus (corpus C).
 *
 * Unlike the emission corpus this one is not pure: replaying it requires the shared docker harness
 * (`pnpm harness:up`), because it asserts what a real database hands back.
 */
export const NORMALIZATION_CORPUS_PATH = new URL(
  './corpora/normalization/corpus.json',
  import.meta.url,
).pathname;

/**
 * Absolute path to the INTROSPECTION corpus (corpus D).
 *
 * Harness-gated for the same reason as corpus C, and then some: it asserts what a real catalog says
 * about the schema in `harness/seed/`, so the seed and this corpus move together.
 */
export const INTROSPECTION_CORPUS_PATH = new URL(
  './corpora/introspection/corpus.json',
  import.meta.url,
).pathname;
