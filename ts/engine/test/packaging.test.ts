import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * This package's whole selling point is subpath-per-dialect, which multiplies the blast radius
 * of an exports-map mistake by six. A flat `{types, import, require}` lets one top-level `types`
 * shadow BOTH lanes, so every CJS/node16 consumer resolves the ESM `.d.mts` and gets TS1479 while
 * the correctly-built `.d.cts` sits unreachable in the tarball. Nothing else in the suite reads
 * package.json, so that ships green without this.
 */
type Lane = { types: string; default: string };

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8'),
) as { main: string; exports: Record<string, { import: Lane; require: Lane }> };

describe('package exports map', () => {
  const subpaths = Object.keys(pkg.exports);

  it('declares every entry tsdown builds', () => {
    expect(subpaths.sort()).toEqual(
      ['.', './introspection', './mssql', './mysql', './postgres', './sqlite'].sort(),
    );
  });

  it.each(subpaths)('resolves types per lane for %s', (subpath) => {
    const entry = pkg.exports[subpath];

    // The whole bug: `types` must live INSIDE each lane, never above them.
    expect(entry).not.toHaveProperty('types');

    expect(entry.import.types).toMatch(/\.d\.mts$/);
    expect(entry.import.default).toMatch(/\.mjs$/);
    expect(entry.require.types).toMatch(/\.d\.cts$/);
    expect(entry.require.default).toMatch(/\.cjs$/);
  });

  it('points `main` at the CJS build, since `main` is only ever read by CJS consumers', () => {
    expect(pkg.main).toMatch(/\.cjs$/);
  });
});
