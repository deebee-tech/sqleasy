#!/usr/bin/env node
// Standing guardrail against the failure mode found by the 2026-07-19 parity audit: a feature gets
// built for the dialects someone happens to use (MSSQL, Postgres) and quietly skipped for the others.
//
// For every op the corpus exercises, every dialect must resolve to one of:
//   CONFORMED       >=1 case asserts real emitted SQL for that dialect
//   DOCUMENTED-THROW >=1 case asserts a {throws} for that dialect  (a CORRECT absence)
// Anything else is a GAP.
//
// This is a RATCHET, not a wall. The audit's existing backlog is recorded in
// dialect-parity-baseline.json so the gate is useful today without requiring the whole backlog to be
// fixed first. It fails only on a NEW gap — i.e. exactly the regression it exists to prevent. When a
// baselined gap is fixed it reports that too, so the baseline tightens instead of rotting.
//
// It deliberately cannot detect the audit's worst class (FALSE-CONFORMED: a golden that pins SQL the
// engine will reject). Nothing static can — that needs the emitted SQL executed against a real server,
// which is what the normalization corpus and the shared harness are for.

import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const DIALECTS = ['mssql', 'mysql', 'postgres', 'sqlite'];
const BASELINE_PATH = join(ROOT, 'scripts', 'dialect-parity-baseline.json');
const WRITE = process.argv.includes('--write-baseline');

// The corpus moves to contract/ in phase 3; accept either location so the gate works throughout.
const CANDIDATES = [
  join(ROOT, 'contract', 'corpora', 'emission', 'corpus.json'),
  join(ROOT, 'ts', 'query', 'goldens', 'corpus.json'),
];
const corpusPath = CANDIDATES.find((p) => existsSync(p));
if (!corpusPath) {
  console.error('check-dialect-parity: no corpus found. Looked in:\n  ' + CANDIDATES.join('\n  '));
  process.exit(1);
}

const corpus = JSON.parse(readFileSync(corpusPath, 'utf8'));

/** Ops nest — a subquery/CTE body carries its own op-list under assorted keys. Walk all of them. */
function collectOps(ops, sink) {
  if (!Array.isArray(ops)) return;
  for (const op of ops) {
    if (!op || typeof op !== 'object') continue;
    if (typeof op.op === 'string') sink.add(op.op);
    for (const value of Object.values(op)) {
      if (Array.isArray(value)) collectOps(value, sink);
      else if (value && typeof value === 'object') {
        for (const nested of Object.values(value)) collectOps(nested, sink);
      }
    }
  }
}

// op -> dialect -> {conformed, thrown}
const seen = new Map();
const touch = (op) => {
  if (!seen.has(op)) {
    seen.set(
      op,
      Object.fromEntries(DIALECTS.map((d) => [d, { conformed: false, thrown: false }])),
    );
  }
  return seen.get(op);
};

for (const testCase of corpus.cases ?? []) {
  const ops = new Set();
  collectOps(testCase.ops, ops);
  for (const builder of testCase.builders ?? []) collectOps(builder.ops, ops);
  if (ops.size === 0) continue;

  for (const dialect of DIALECTS) {
    const expectation = testCase.expect?.[dialect];
    if (!expectation) continue; // narrowed out — accounted for by dialects[]
    const isThrow = Object.prototype.hasOwnProperty.call(expectation, 'throws');
    for (const op of ops) {
      const record = touch(op)[dialect];
      if (isThrow) record.thrown = true;
      else record.conformed = true;
    }
  }
}

const gaps = [];
for (const [op, byDialect] of [...seen.entries()].sort()) {
  for (const dialect of DIALECTS) {
    const { conformed, thrown } = byDialect[dialect];
    if (!conformed && !thrown) gaps.push(`${op}:${dialect}`);
  }
}
gaps.sort();

if (WRITE) {
  writeFileSync(
    BASELINE_PATH,
    JSON.stringify(
      {
        _comment:
          'Known op x dialect gaps as of the 2026-07-19 parity audit. This is a RATCHET: entries may be REMOVED as gaps are closed, never added without a deliberate decision. A new gap not listed here fails CI. Regenerate with: node scripts/check-dialect-parity.mjs --write-baseline',
        generatedFrom: corpusPath.replace(ROOT + '/', ''),
        corpusVersion: corpus.version ?? null,
        gaps,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`check-dialect-parity: baseline written with ${gaps.length} known gaps.`);
  process.exit(0);
}

if (!existsSync(BASELINE_PATH)) {
  console.error(
    'check-dialect-parity: no baseline. Create one with:\n  node scripts/check-dialect-parity.mjs --write-baseline',
  );
  process.exit(1);
}

const baseline = new Set(JSON.parse(readFileSync(BASELINE_PATH, 'utf8')).gaps ?? []);
const current = new Set(gaps);

const introduced = gaps.filter((g) => !baseline.has(g));
const fixed = [...baseline].filter((g) => !current.has(g)).sort();

if (fixed.length > 0) {
  console.log(`check-dialect-parity: ${fixed.length} baselined gap(s) now closed — nice:`);
  for (const g of fixed.slice(0, 20)) console.log(`  ✔ ${g}`);
  console.log('  Tighten the ratchet: node scripts/check-dialect-parity.mjs --write-baseline\n');
}

if (introduced.length > 0) {
  console.error(
    `check-dialect-parity: ${introduced.length} NEW op x dialect gap(s) — a feature landed for some dialects but not others.\n`,
  );
  for (const g of introduced) {
    const [op, dialect] = g.split(':');
    console.error(`  ✗ ${op} has no case (neither emission nor {throws}) for ${dialect}`);
  }
  console.error(
    '\nEvery op must resolve, per dialect, to either real emitted SQL or an explicit {throws}\n' +
      'case proving clean rejection. If the dialect genuinely cannot do it, add the {throws} case —\n' +
      'that is a correct absence. If it can, implement it. See docs/audits/dialect-parity-2026-07-19.md.',
  );
  process.exit(1);
}

console.log(
  `check-dialect-parity: ok — ${seen.size} ops x ${DIALECTS.length} dialects, no new gaps ` +
    `(${baseline.size} known, tracked in scripts/dialect-parity-baseline.json).`,
);
