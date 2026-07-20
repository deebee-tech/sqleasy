#!/usr/bin/env node
// The version-vs-content gate — the mechanical replacement for the old weld.
//
// Before this, corpus.json's `version` was rewritten to the TypeScript package's version on every
// release, so a TS release that changed NO SQL still forced every port to chase a new version. Now
// the contract carries its own version, and this gate is what makes that independence real rather
// than aspirational: change the hashed content of corpora/ or schema/ without bumping the version and
// the build fails.
//
// It also checks the inverse (version bumped, content identical) but only WARNS — re-releasing an
// unchanged contract is pointless rather than dangerous.
//
//   node tools/validate.mjs           verify
//   node tools/validate.mjs --write   re-record hashes after a deliberate bump

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const CONTRACT_JSON = join(ROOT, 'contract.json');
const WRITE = process.argv.includes('--write');
const HASHED_TREES = ['corpora', 'schema'];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

/**
 * Hash the emission corpus by its `cases` array ALONE, deliberately excluding the `version` field.
 * Otherwise bumping the version would change the hash that is supposed to detect content drift, and
 * the gate would be self-defeating — it could never distinguish "the contract changed" from "we
 * renamed the contract".
 */
function hashCorpusCases(file) {
  const parsed = JSON.parse(readFileSync(file, 'utf8'));
  return createHash('sha256')
    .update(JSON.stringify(parsed.cases ?? parsed))
    .digest('hex');
}

function computeHashes() {
  const hashes = {};
  for (const tree of HASHED_TREES) {
    const dir = join(ROOT, tree);
    let files;
    try {
      files = walk(dir);
    } catch {
      continue; // corpora B/C/D do not exist yet
    }
    for (const file of files) {
      const key = relative(ROOT, file);
      hashes[key] = key.endsWith('corpus.json')
        ? hashCorpusCases(file)
        : createHash('sha256').update(readFileSync(file)).digest('hex');
    }
  }
  return hashes;
}

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const version = pkg.version;
const hashes = computeHashes();

if (WRITE) {
  writeFileSync(
    CONTRACT_JSON,
    JSON.stringify(
      {
        _comment:
          'The contract version is INDEPENDENT of every language package version. Hashes cover corpora/ and schema/; the emission corpus is hashed by its `cases` array alone, excluding `version`, so a rename can never masquerade as a content change. Regenerate with: pnpm --filter @deebeetech/sqleasy-contract validate:write',
        contractVersion: version,
        hashes,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`contract validate: recorded ${Object.keys(hashes).length} hash(es) at v${version}.`);
  process.exit(0);
}

let recorded;
try {
  recorded = JSON.parse(readFileSync(CONTRACT_JSON, 'utf8'));
} catch {
  console.error('contract validate: contract.json missing. Create it with `validate:write`.');
  process.exit(1);
}

const drifted = [];
for (const [file, hash] of Object.entries(hashes)) {
  if (recorded.hashes?.[file] !== hash) drifted.push(file);
}
for (const file of Object.keys(recorded.hashes ?? {})) {
  if (!(file in hashes)) drifted.push(`${file} (removed)`);
}

const versionChanged = recorded.contractVersion !== version;

if (drifted.length > 0 && !versionChanged) {
  console.error(
    `contract validate: contract content changed but the version is still ${version}.\n`,
  );
  for (const f of drifted) console.error(`  ✗ ${f}`);
  console.error(
    '\nThe contract is versioned independently of every implementation, so a content change\n' +
      'MUST bump contract/package.json:\n' +
      '  major — an existing golden changed / an op or tag was removed / the schema tightened\n' +
      '  minor — purely additive (new cases, ops, tags, dialects)\n' +
      '  patch — non-semantic (notes, formatting, ordering)\n' +
      'Then re-record: pnpm --filter @deebeetech/sqleasy-contract validate:write',
  );
  process.exit(1);
}

if (drifted.length === 0 && versionChanged) {
  console.warn(
    `contract validate: version moved to ${version} but no content changed. Harmless, but every ` +
      `port will see a new version for no behavioural reason — which is the exact churn this ` +
      `package exists to stop.`,
  );
}

console.log(
  `contract validate: ok — v${version}, ${Object.keys(hashes).length} hashed file(s) match.`,
);
