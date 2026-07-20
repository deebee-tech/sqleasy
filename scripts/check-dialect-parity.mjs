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

// --derive: REPORT ONLY, never a gate. Derives each case's dialect set from the capability manifest
// and compares it to the authored one. Under docs/capability-manifest-design.md, `dialects` stops
// being authored and becomes the intersection, over a case's ops, of the dialects where every op is
// `native` — so the 289 cases that currently declare nothing are stamped rather than rewritten.
// While adjudication is in progress most cells are `unadjudicated`, so this mostly measures how much
// of the corpus rests on unproven capability claims. That number IS the report.
if (process.argv.includes('--derive')) {
  const manifestPath = join(ROOT, 'contract', 'capabilities', 'capabilities.json');
  if (!existsSync(manifestPath)) {
    console.error('check-dialect-parity --derive: no manifest. Build it with:');
    console.error('  node scripts/build-capability-manifest.mjs');
    process.exit(1);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

  let agree = 0;
  const narrowed = [];
  const widened = [];
  const blocked = [];

  for (const testCase of corpus.cases ?? []) {
    const ops = new Set();
    collectOps(testCase.ops, ops);
    for (const builder of testCase.builders ?? []) collectOps(builder.ops, ops);
    if (ops.size === 0) continue;

    const authored = testCase.dialects ?? DIALECTS;
    const unproven = new Set();
    const derived = DIALECTS.filter((dialect) =>
      [...ops].every((op) => {
        const cell = manifest.ops?.[op]?.cells?.[dialect];
        if (!cell) return true; // op absent from the manifest: nothing claimed, do not narrow on it
        if (cell.kind === 'native') return true;
        if (cell.kind === 'unadjudicated') {
          unproven.add(`${op}:${dialect}`);
          return true; // cannot narrow on an unmade decision
        }
        return false; // absent
      }),
    );

    const same = derived.length === authored.length && derived.every((d) => authored.includes(d));
    if (same) agree++;
    else {
      // Two very different disagreements, and conflating them misleads. A cell that resolved
      // `absent` genuinely narrows the case. A cell still `unadjudicated` cannot narrow anything,
      // so the derived set stays wide — that is not a claim of support, it is "nobody has decided".
      const lost = authored.filter((d) => !derived.includes(d));
      const gained = derived.filter((d) => !authored.includes(d));
      const entry = { name: testCase.name, authored, derived, lost, gained };
      if (lost.length > 0) narrowed.push(entry);
      else widened.push(entry);
    }
    if (unproven.size > 0) blocked.push({ name: testCase.name, unproven: [...unproven] });
  }

  const total = (corpus.cases ?? []).length;
  console.log(`check-dialect-parity --derive: ${total} cases\n`);
  console.log(`  ${agree} agree with the authored dialect set`);
  console.log(
    `  ${narrowed.length} would RENARROW — an op resolved 'absent' on a dialect the case claims`,
  );
  console.log(
    `  ${widened.length} appear wider only because a cell is still 'unadjudicated' (NOT a support claim)`,
  );
  console.log(
    `  ${blocked.length} rest on at least one unadjudicated cell, so cannot be derived yet\n`,
  );

  if (narrowed.length > 0) {
    console.log('REAL NARROWINGS — the manifest says the dialect cannot do this:');
    for (const entry of narrowed.slice(0, 20)) {
      console.log(`  ~ ${entry.name}\n      loses [${entry.lost.join(', ')}]`);
    }
    if (narrowed.length > 20) console.log(`  … and ${narrowed.length - 20} more`);
  }

  console.log(
    '\nREPORT ONLY — this never fails the build. The derived set becomes authoritative only when\n' +
      'the cells it reads have been adjudicated by a human. See docs/capability-manifest-design.md.',
  );
  process.exit(0);
}

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
    seen.set(op, Object.fromEntries(DIALECTS.map((d) => [d, { conformed: false, thrown: false }])));
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
