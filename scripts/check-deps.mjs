#!/usr/bin/env node
// Enforces the single-version rule: every first-party manifest must reference third-party deps as
// `catalog:` and first-party deps as `workspace:`. A literal range anywhere means two packages can
// silently resolve different copies of the same library — which is exactly how a monorepo ends up
// several majors behind its own dependency through green gates.
//
// peerDependencies are deliberately exempt: they are a compatibility RANGE the consumer satisfies,
// not a version this repo installs.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const WORKSPACE_DIRS = ['configs', 'ts', 'dart', 'python', 'csharp', 'go', 'contract'];
const CHECKED_FIELDS = ['dependencies', 'devDependencies', 'optionalDependencies'];
const ALLOWED = /^(catalog:|workspace:)/;

/** Collect every first-party package.json: the root plus one level inside each workspace dir. */
function manifests() {
  const found = [join(ROOT, 'package.json')];
  for (const dir of WORKSPACE_DIRS) {
    const base = join(ROOT, dir);
    let entries;
    try {
      entries = readdirSync(base);
    } catch {
      continue; // directory not created yet — phases land incrementally
    }
    // A workspace dir may itself be a package (go/) or contain packages (ts/query, ts/engine).
    const selfManifest = join(base, 'package.json');
    try {
      if (statSync(selfManifest).isFile()) found.push(selfManifest);
    } catch {
      /* not a package itself */
    }
    for (const entry of entries) {
      const candidate = join(base, entry, 'package.json');
      try {
        if (statSync(candidate).isFile()) found.push(candidate);
      } catch {
        /* not a package */
      }
    }
  }
  return found;
}

const violations = [];
for (const file of manifests()) {
  const pkg = JSON.parse(readFileSync(file, 'utf8'));
  for (const field of CHECKED_FIELDS) {
    for (const [name, spec] of Object.entries(pkg[field] ?? {})) {
      if (typeof spec === 'string' && !ALLOWED.test(spec)) {
        violations.push(`${relative(ROOT, file)}  ${field}.${name} = "${spec}"`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error('check-deps: every dependency must be "catalog:" or "workspace:".\n');
  for (const v of violations) console.error(`  ✗ ${v}`);
  console.error(
    '\nAdd the version to the `catalog:` block in pnpm-workspace.yaml and reference it as "catalog:".',
  );
  process.exit(1);
}

console.log('check-deps: ok — all dependencies use catalog: or workspace:');
