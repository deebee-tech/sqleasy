#!/usr/bin/env node
// Asserts the honest capability surface is IDENTICAL across the TypeScript reference and the Dart
// port: the set of methods each dialect's typed view HIDES must match, method-for-method, in both
// languages. This is the cross-language spec the next port (C#/Go/Python) mirrors, so a drift between
// TS and Dart here would silently ship two different honest surfaces.
//
// Source of truth in each language:
//   TS   — the `AbsentOn{Mssql,Mysql,Postgres,Sqlite}` union types in
//          ts/query/src/builder/typed-views.ts (a method a dialect cannot expose).
//   Dart — the per-dialect `absent` Set in dart/query/tool/view_manifest.dart (from which the views
//          are generated).
//
// Both hand-author the same fact — "this method is not on this dialect's view" — including the
// engine-native renames (a hidden generic name and an alias that belongs only to its home dialect
// both land in the absent sets), so the two sets must be equal per dialect.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const TS = join(ROOT, 'ts', 'query', 'src', 'builder', 'typed-views.ts');
const DART = join(ROOT, 'dart', 'query', 'tool', 'view_manifest.dart');

const DIALECTS = ['mssql', 'mysql', 'postgres', 'sqlite'];

/** Strip `//` line comments so an identifier inside a comment is never mistaken for a set member. */
function stripComments(text) {
  return text
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, ''))
    .join('\n');
}

/** Quoted single-token identifiers in a block, as a Set. */
function identifiers(block) {
  return new Set([...stripComments(block).matchAll(/'([A-Za-z][A-Za-z0-9]*)'/g)].map((m) => m[1]));
}

/** The four TS `AbsentOn<Dialect>` union types → { mssql: Set, … }. */
function tsAbsent() {
  // Strip comments FIRST so a `;` inside a doc comment cannot truncate the union block below.
  const src = stripComments(readFileSync(TS, 'utf8'));
  const out = {};
  for (const dialect of DIALECTS) {
    const typeName = `AbsentOn${dialect[0].toUpperCase()}${dialect.slice(1)}`;
    const match = src.match(new RegExp(`type ${typeName} =([\\s\\S]*?);`, 'm'));
    if (!match) throw new Error(`check-surface-parity: ${typeName} not found in typed-views.ts`);
    out[dialect] = identifiers(match[1]);
  }
  return out;
}

/** The four Dart `'<dialect>': DialectViewPolicy(absent: { … })` sets → { mssql: Set, … }. */
function dartAbsent() {
  const src = stripComments(readFileSync(DART, 'utf8'));
  const out = {};
  for (const dialect of DIALECTS) {
    // Grab the `absent: { … }` block for this dialect (up to the closing brace of the set).
    const match = src.match(
      new RegExp(`'${dialect}':\\s*DialectViewPolicy\\(\\s*absent:\\s*\\{([\\s\\S]*?)\\}`, 'm'),
    );
    if (!match)
      throw new Error(
        `check-surface-parity: absent set for '${dialect}' not found in view_manifest.dart`,
      );
    out[dialect] = identifiers(match[1]);
  }
  return out;
}

const ts = tsAbsent();
const dart = dartAbsent();

let drift = false;
const lines = [];
for (const dialect of DIALECTS) {
  const tsOnly = [...ts[dialect]].filter((m) => !dart[dialect].has(m)).sort();
  const dartOnly = [...dart[dialect]].filter((m) => !ts[dialect].has(m)).sort();
  if (tsOnly.length || dartOnly.length) {
    drift = true;
    lines.push(`  ${dialect}: DRIFT`);
    if (tsOnly.length) lines.push(`    absent in TS only : ${tsOnly.join(', ')}`);
    if (dartOnly.length) lines.push(`    absent in Dart only: ${dartOnly.join(', ')}`);
  } else {
    lines.push(`  ${dialect}: ok (${ts[dialect].size} hidden)`);
  }
}

if (drift) {
  console.error(
    'check-surface-parity: the TS and Dart honest surfaces DIFFER —\n' + lines.join('\n'),
  );
  console.error(
    '\nThe two ports must hide the same methods per dialect. Reconcile ' +
      'ts/query/src/builder/typed-views.ts with dart/query/tool/view_manifest.dart.',
  );
  process.exit(1);
}

console.log(
  'check-surface-parity: ok — TS and Dart hide the same methods on all four dialects.\n' +
    lines.join('\n'),
);
