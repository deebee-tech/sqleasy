import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { runCase } from './driver';
import { DIALECTS, type Case, type Corpus, type Dialect } from './types';

/**
 * Replays the frozen golden corpus through the TypeScript implementation.
 *
 * This is the cross-language contract. `sqleasy-dart` ships the same corpus and the same test
 * against its own driver, and must produce byte-identical output — on the Dart VM *and* under
 * dart2js, which do not agree with each other about numbers. When this file and its Dart twin are
 * both green, the two implementations emit the same SQL.
 *
 * Regenerate with:
 *
 *     pnpm goldens
 *
 * The goldens are *generated*, then reviewed and frozen. They are not an independent check on
 * TypeScript — the hand-written suite in tests/ is that, and it must stay green. Regenerating is a
 * deliberate act, and **the resulting diff is the thing to review**: every changed line is a change
 * to the SQL this library emits, which the Dart port then has to follow.
 */

const CORPUS_PATH = new URL('../../goldens/corpus.json', import.meta.url).pathname;
const PACKAGE_PATH = new URL('../../package.json', import.meta.url).pathname;

const corpus = JSON.parse(readFileSync(CORPUS_PATH, 'utf8')) as Corpus;
const dialectsFor = (testCase: Case): Dialect[] => testCase.dialects ?? [...DIALECTS];

// `pnpm goldens` sets this. Any other run asserts against the frozen file.
const rewriting = process.env['GOLDENS_WRITE'] === '1';

if (rewriting) {
  describe('golden corpus (regenerating)', () => {
    it('writes goldens/corpus.json from the current implementation', () => {
      const version = JSON.parse(readFileSync(PACKAGE_PATH, 'utf8')).version as string;

      const regenerated: Corpus = {
        version,
        cases: corpus.cases.map((testCase) => {
          const expectations: Case['expect'] = {};
          for (const dialect of dialectsFor(testCase)) {
            expectations[dialect] = runCase(testCase, dialect);
          }

          // Rebuild each case explicitly so authored key order survives and the diff stays readable.
          return {
            name: testCase.name,
            ...(testCase.note ? { note: testCase.note } : {}),
            ...(testCase.dialects ? { dialects: testCase.dialects } : {}),
            ...(testCase.transaction ? { transaction: testCase.transaction } : {}),
            ...(testCase.ops ? { ops: testCase.ops } : {}),
            ...(testCase.builders ? { builders: testCase.builders } : {}),
            expect: expectations,
          };
        }),
      };

      writeFileSync(CORPUS_PATH, JSON.stringify(regenerated, null, 2) + '\n');

      const names = regenerated.cases.map((c) => c.name);
      expect(new Set(names).size, 'case names must be unique').toBe(names.length);
    });
  });
} else {
  describe('golden corpus conformance', () => {
    it('is populated: every case has an expectation for every dialect it declares', () => {
      expect(corpus.cases.length).toBeGreaterThan(0);

      for (const testCase of corpus.cases) {
        for (const dialect of dialectsFor(testCase)) {
          expect(
            testCase.expect[dialect],
            `case "${testCase.name}" has no golden for ${dialect} — run \`pnpm goldens\``,
          ).toBeDefined();
        }
      }
    });

    for (const testCase of corpus.cases) {
      describe(testCase.name, () => {
        for (const dialect of dialectsFor(testCase)) {
          it(dialect, () => {
            expect(runCase(testCase, dialect)).toEqual(testCase.expect[dialect]);
          });
        }
      });
    }
  });
}
