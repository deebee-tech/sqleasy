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

/**
 * Absolute path to the emission corpus.
 *
 * Ports that can read a file at test time (TS, Python, C#, Go, and Dart on the VM) load it from here.
 * Dart additionally base64-embeds it into a generated source file, because dart2js has no `dart:io`
 * and cannot read a file when the suite runs under `-p chrome`.
 */
export const EMISSION_CORPUS_PATH = new URL('./corpora/emission/corpus.json', import.meta.url)
  .pathname;
