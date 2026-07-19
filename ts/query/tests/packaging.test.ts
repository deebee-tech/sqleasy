import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Packaging is a contract with consumers that no unit test touches: it lives entirely in
 * package.json, so a broken exports map ships green. It has already shipped broken twice
 * (string-builder 2.0.2, and this package through 4.0.1), both times because one top-level
 * `types` shadowed BOTH lanes -- a CJS/node16 consumer resolved the ESM `.d.mts` and got
 * TS1479, while the correctly-built `index.d.cts` sat in the tarball unreachable.
 */
const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8'),
) as {
  main: string;
  types: string;
  exports: Record<
    string,
    { import: { types: string; default: string }; require: { types: string; default: string } }
  >;
};

describe('package exports map', () => {
  it('resolves types per lane, so a CJS consumer never lands on the ESM .d.mts', () => {
    const root = pkg.exports['.'];

    // The whole bug: `types` must live INSIDE each lane, never above them.
    expect(root).not.toHaveProperty('types');

    expect(root.import.types).toMatch(/\.d\.mts$/);
    expect(root.import.default).toMatch(/\.mjs$/);
    expect(root.require.types).toMatch(/\.d\.cts$/);
    expect(root.require.default).toMatch(/\.cjs$/);
  });

  it('points `main` at the CJS build, since `main` is only ever read by CJS consumers', () => {
    expect(pkg.main).toMatch(/\.cjs$/);
  });
});

describe('release.config.mjs numMatches', () => {
  /**
   * semantic-release-replace-plugin asserts this count and HARD-FAILS the release when it is
   * off, so the exports map above cannot be edited without updating it. That coupling is
   * invisible at the edit site -- this test is the thing that makes it visible, in CI, before
   * a release dies at the publish step.
   */
  it('equals the real `dist/index` occurrence count in package.json', () => {
    const pkgRaw = readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8');
    const configRaw = readFileSync(
      fileURLToPath(new URL('../release.config.mjs', import.meta.url)),
      'utf8',
    );

    const actual = pkgRaw.match(/dist\/index/g)?.length ?? 0;
    const declared = Number(/numMatches:\s*(\d+)/.exec(configRaw)?.[1]);

    expect(declared).toBe(actual);
  });
});
