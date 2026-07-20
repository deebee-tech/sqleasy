#!/usr/bin/env node
// Seeds contract/capabilities/capabilities.json — the capability manifest described in
// docs/capability-manifest-design.md.
//
// The manifest is INERT. Nothing imports it, nothing generates from it, no gate reads it. It exists
// so that adjudication can begin as a by-product of the clean-sweep work rather than as a competing
// project: each sweep PR that fixes a violation also flips its cell and fills its four names.
//
// ── THE LAUNDERING TRAP ──────────────────────────────────────────────────────────────────────────
// This script must never be mistaken for a source of truth about what an engine supports.
// ts/query/tests/conformance/conformance.test.ts:24 says the goldens "are *generated*, then reviewed
// and frozen. They are not an independent check." A case emits real SQL precisely WHEN TypeScript
// silently emulated or dropped something — so `top` on mysql/postgres/sqlite (a silent no-op at
// to-sql.ts:279) would extract as `native`, survive any probe that only asks "does the server parse
// this", and get promoted from known bug to machine-attested capability. Strictly worse than the
// dated audit it would replace.
//
// Three defenses, all load-bearing:
//   1. `kind` is extraction's HYPOTHESIS, never a finding. `adjudicated` is false on every cell at
//      seed time and only a human may set it.
//   2. Every op and enum member named by the 2026-07-19 parity audit (Parts 2-4) or the 2026-07-20
//      approximation sweep is FORCED to `unadjudicated` regardless of what extraction concluded.
//      Those are exactly the cells extraction gets wrong.
//   3. `name` — the engine's own term for this capability, and the field that decides what a caller
//      sees when they hit the dot — is seeded EMPTY and is never inferred from the current
//      TypeScript method name. A pre-filled default means never corrected.
//
// There is deliberately no `emulated` kind. It is the low-energy path, and the 39 confirmed
// violations accumulated under a regime that already had a corpus, a parity ratchet, and code review.
// Do not build the drawer they would hide in.

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const DIALECTS = ['mssql', 'mysql', 'postgres', 'sqlite'];
const CORPUS = join(ROOT, 'contract', 'corpora', 'emission', 'corpus.json');
const ENUM_DIR = join(ROOT, 'ts', 'query', 'src', 'enums');
const OUT = join(ROOT, 'contract', 'capabilities', 'capabilities.json');

// Enums a CALLER can pass. The rest (BuilderType, ParserArea, DatabaseType, QueryType, ParserMode,
// MultiBuilderTransactionState, JoinOnOperator) are internal plumbing and never reach the surface,
// so they carry no capability claim and are excluded.
const CALLER_FACING_ENUMS = new Set([
  'CallKind',
  'CallParamDirection',
  'CallReturnIntent',
  'FrameBoundType',
  'FrameUnit',
  'FullTextMode',
  'HintKind',
  'JoinOperator',
  'JoinType',
  'JsonExtractMode',
  'NullsOrder',
  'OrderByDirection',
  'RowLockMode',
  'RowLockWait',
  'UpsertAction',
  'WhereOperator',
]);

// ── The forced-unadjudicated set ────────────────────────────────────────────────────────────────
// Provenance is recorded per entry and survives into the manifest, so a later reader can tell why a
// cell was withheld from extraction without re-reading two documents.
const FORCED = {
  // Parity audit Part 2 — FALSE-CONFORMED: goldens pinning SQL the engine cannot parse.
  limitWithTies: 'audit-F1: MySQL emitted FETCH FIRST … WITH TIES, which MySQL has no form of',
  groupByRollup: 'audit-F2: SQLite emitted ROLLUP, which SQLite does not have',
  groupByCube: 'audit-F2: SQLite emitted CUBE, which SQLite does not have',
  groupByGroupingSets: 'audit-F2: SQLite emitted GROUPING SETS, which SQLite does not have',
  hintUseIndex:
    'audit-F3/G2: hint emitted before the alias (invalid MySQL); also MSSQL and SQLite have real index hints that were never offered',
  fromTableFunction:
    'audit-F4/G3: MySQL emitted a FROM-clause function call it cannot parse; corpus covers only SQLite',
  fromTableWithOwner: 'sweep-2026-07-20: Sybase-era vocabulary on the shared surface',

  // Parity audit Part 3 — silently dropped clauses (valid SQL, wrong semantics).
  top: 'audit-S1: silent no-op on mysql/postgres/sqlite — to-sql.ts returns {} and the cap vanishes',
  forUpdate: 'audit-S2: MSSQL hint reaches only the first table; joined tables are NOT locked',
  forShare: 'audit-S2 + sweep: MSSQL HOLDLOCK silently escalates to SERIALIZABLE',
  forUpdateNowait: 'audit-S2: MSSQL wait-mode mapping is not equivalent',
  forUpdateSkipLocked: 'audit-S2: MSSQL READPAST is not equivalent to SKIP LOCKED',
  forShareNowait: 'audit-S2: MSSQL wait-mode mapping is not equivalent',
  forShareSkipLocked: 'audit-S2: MSSQL READPAST is not equivalent to SKIP LOCKED',
  whereMatch:
    'audit-S4 + sweep: SQLite FTS5 operand may be wrong; one method spans four unrelated full-text subsystems',

  // Parity audit Part 4 — real gaps (the dialect supports it; we do not).
  updateTable: 'audit-G1: SQLite UPDATE … FROM rejected outright, but SQLite 3.33+ supports it',
  updateTableWithOwner: 'audit-G1: same blanket SQLite mutation-join guard',

  // 2026-07-20 approximation sweep — confirmed violations beyond the audit.
  onConflictDoUpdate: 'sweep: MSSQL synthesizes MERGE (a different statement) with no HOLDLOCK',
  onConflictDoNothing: 'sweep: MSSQL synthesizes MERGE; MySQL silently ignores conflictColumns',
  onConflictDoUpdateRaw: 'sweep: same MSSQL MERGE substitution',
  joinOuterApply:
    'sweep: emits LEFT JOIN LATERAL with NO ON clause — invalid on Postgres and MySQL',
  joinCrossApply:
    'sweep: a T-SQL term that emits valid SQL on Postgres and MySQL, so it would extract native on all three and stay on the shared surface',
  orderByColumn: 'sweep: NullsOrder First/Last synthesized as CASE WHEN on MySQL and MSSQL',
  whereJsonExtract:
    'sweep: one method over ->> / JSON_EXTRACT / JSON_VALUE; MSSQL IsDistinctFrom uses a sentinel',
  selectJsonExtract: 'sweep: same JSON path divergence',
  whereJsonContains: 'sweep: same JSON path divergence',
  frame: 'sweep: MSSQL RANGE admits only UNBOUNDED/CURRENT ROW, not numeric offsets',
};

// Enum members carrying a capability claim that extraction cannot see, keyed `Enum.Member`.
// This axis is the whole point: roughly half the confirmed violations live here, invisible to any
// design keyed on method existence.
const FORCED_ENUM = {
  'WhereOperator.Ilike':
    'sweep: rewritten as LOWER(col) LIKE LOWER(?) on mysql/sqlite/mssql — none has ILIKE',
  'WhereOperator.NotIlike': 'sweep: same LOWER() rewrite',
  'WhereOperator.Iregex': 'audit-S3: MySQL degrades to collation-dependent matching',
  'WhereOperator.NotIregex': 'audit-S3: same collation degradation',
  'WhereOperator.Regex': 'sweep: collation-dependent on MySQL; scope-consistent with Iregex',
  'WhereOperator.NotRegex': 'sweep: same',
  'WhereOperator.IsDistinctFrom':
    'sweep: MSSQL/MySQL synthesize it; native only on postgres, sqlite 3.39+, mssql 2022+',
  'WhereOperator.IsNotDistinctFrom': 'sweep: same',
  'WhereOperator.Contains': 'sweep: collation-dependent case sensitivity, same class as Ilike',
  'WhereOperator.StartsWith': 'sweep: collation-dependent case sensitivity',
  'WhereOperator.EndsWith': 'sweep: collation-dependent case sensitivity',
  'NullsOrder.First': 'sweep: synthesized as CASE WHEN on MySQL and MSSQL',
  'NullsOrder.Last': 'sweep: synthesized as CASE WHEN on MySQL and MSSQL',
  'FullTextMode.Phrase': 'sweep: dropped or approximated on MySQL and MSSQL',
  'FullTextMode.Boolean': 'sweep: MySQL-specific concept spanning four unrelated subsystems',
  'FullTextMode.Natural': 'sweep: same',
  'JoinType.CrossApply': 'sweep: T-SQL vocabulary translated to LATERAL elsewhere',
  'JoinType.OuterApply': 'sweep: translated to LEFT JOIN LATERAL with no ON — invalid',
  'JoinType.Lateral': 'sweep: adjudicate alongside the APPLY pair',
  'FrameUnit.Range': 'sweep: MSSQL admits RANGE only with UNBOUNDED/CURRENT ROW',
  'JsonExtractMode.Object': 'sweep: no coverage on any dialect; unproven',
  'RowLockMode.ForShare':
    'sweep: MSSQL has no shared-row-lock hint; HOLDLOCK escalates to SERIALIZABLE',
  'RowLockWait.SkipLocked': 'sweep: MSSQL READPAST is not equivalent',
  'RowLockWait.Nowait': 'sweep: MSSQL wait-mode mapping is not equivalent',
  'HintKind.ForceIndex': 'audit-G2: MySQL-only today; MSSQL and SQLite have real index hints',
  'HintKind.UseIndex': 'audit-F3/G2: emitted before the alias; three dialects support hints',
};

// ── Extraction ──────────────────────────────────────────────────────────────────────────────────

const corpus = JSON.parse(readFileSync(CORPUS, 'utf8'));

/** Enum member names, from the enum sources rather than a PascalCase heuristic. */
function readEnums() {
  const byMember = new Map(); // 'Ilike' -> ['WhereOperator']
  const all = {};
  for (const file of readdirSync(ENUM_DIR)) {
    if (!file.endsWith('.ts') || file === 'index.ts') continue;
    const text = readFileSync(join(ENUM_DIR, file), 'utf8');
    const block = text.match(/export const (\w+) = \{([\s\S]*?)\n\} as const/);
    if (!block) continue;
    const [, name, body] = block;
    if (!CALLER_FACING_ENUMS.has(name)) continue;
    const members = [...body.matchAll(/^\s*(\w+):\s*'/gm)].map((m) => m[1]);
    all[name] = members;
    for (const m of members) {
      if (!byMember.has(m)) byMember.set(m, []);
      byMember.get(m).push(name);
    }
  }
  return { all, byMember };
}

const { all: ENUMS, byMember } = readEnums();

/** Ops nest under assorted keys (subqueries, CTE bodies, builder lists). Walk everything. */
function walk(node, onOp) {
  if (Array.isArray(node)) {
    for (const item of node) walk(item, onOp);
    return;
  }
  if (!node || typeof node !== 'object') return;
  if (typeof node.op === 'string') onOp(node);
  for (const value of Object.values(node)) walk(value, onOp);
}

const emptyCell = () => ({ emitted: 0, threw: 0 });
const opCells = new Map(); // op -> dialect -> {emitted, threw}
const enumCells = new Map(); // 'Enum.Member' -> dialect -> {emitted, threw}
const enumUsedBy = new Map(); // 'Enum.Member' -> Set(op)

const bucket = (map, key) => {
  if (!map.has(key)) {
    map.set(key, Object.fromEntries(DIALECTS.map((d) => [d, emptyCell()])));
  }
  return map.get(key);
};

for (const testCase of corpus.cases ?? []) {
  const ops = new Set();
  const enumRefs = new Set();

  const visit = (node) => {
    ops.add(node.op);
    for (const [key, value] of Object.entries(node)) {
      if (key === 'op' || typeof value !== 'string') continue;
      for (const enumName of byMember.get(value) ?? []) {
        enumRefs.add(`${enumName}.${value}`);
        if (!enumUsedBy.has(`${enumName}.${value}`))
          enumUsedBy.set(`${enumName}.${value}`, new Set());
        enumUsedBy.get(`${enumName}.${value}`).add(node.op);
      }
    }
  };
  walk(testCase.ops, visit);
  walk(testCase.builders, visit);
  if (ops.size === 0) continue;

  for (const dialect of DIALECTS) {
    const expectation = testCase.expect?.[dialect];
    if (!expectation) continue; // narrowed out of this case
    const threw = Object.prototype.hasOwnProperty.call(expectation, 'throws');
    for (const op of ops) bucket(opCells, op)[dialect][threw ? 'threw' : 'emitted']++;
    for (const ref of enumRefs) bucket(enumCells, ref)[dialect][threw ? 'threw' : 'emitted']++;
  }
}

/**
 * Extraction's hypothesis for one cell. NOT a finding — see the laundering note above.
 *
 * Note the deliberate imprecision: a `{throws}` case attributes the throw to EVERY op in that case,
 * because the corpus does not record which op raised it. That over-attributes `absent`, which is the
 * safe direction (it produces a cell a human must confirm rather than one that silently claims
 * support). It is recorded in `evidence` so the ambiguity is visible.
 */
function hypothesize({ emitted, threw }) {
  if (emitted > 0) return 'native';
  if (threw > 0) return 'absent';
  return 'unadjudicated';
}

function buildCells(counts, forcedReason) {
  const cells = {};
  for (const dialect of DIALECTS) {
    const observed = counts[dialect];
    const forced = Boolean(forcedReason);
    cells[dialect] = {
      // The engine's OWN term for this capability. Seeded empty on purpose; it is what a caller sees
      // when they hit the dot, and it is the field nothing can infer. Filling all four with the same
      // string is what makes a capability shared — sharedness is derived, never authored.
      name: '',
      kind: forced ? 'unadjudicated' : hypothesize(observed),
      adjudicated: false,
      refusal: null,
      evidence: {
        casesEmitting: observed.emitted,
        casesThrowing: observed.threw,
        note: forced
          ? `forced unadjudicated — ${forcedReason}`
          : observed.emitted === 0 && observed.threw === 0
            ? 'no corpus coverage on this dialect'
            : 'extraction hypothesis from generated goldens; not an independent check',
      },
    };
  }
  return cells;
}

const ops = {};
for (const op of [...opCells.keys()].sort()) {
  ops[op] = { cells: buildCells(opCells.get(op), FORCED[op]) };
}

const enums = {};
for (const ref of [...enumCells.keys()].sort()) {
  const [enumName, member] = ref.split('.');
  enums[ref] = {
    enum: enumName,
    member,
    usedByOps: [...(enumUsedBy.get(ref) ?? [])].sort(),
    cells: buildCells(enumCells.get(ref), FORCED_ENUM[ref]),
  };
}

// Enum members the corpus never exercises at all. They are still part of the caller-facing surface —
// an unexercised member is an unproven capability claim, which is exactly what this manifest is for.
const uncovered = [];
for (const [enumName, members] of Object.entries(ENUMS)) {
  for (const member of members) {
    if (member === 'None') continue; // sentinel, not a capability
    const ref = `${enumName}.${member}`;
    if (enums[ref]) continue;
    uncovered.push(ref);
    enums[ref] = {
      enum: enumName,
      member,
      usedByOps: [],
      cells: buildCells(
        Object.fromEntries(DIALECTS.map((d) => [d, emptyCell()])),
        FORCED_ENUM[ref] ?? 'no corpus coverage — an unexercised member is an unproven claim',
      ),
    };
  }
}

const countKinds = (collection) => {
  const tally = { native: 0, absent: 0, unadjudicated: 0 };
  for (const entry of Object.values(collection)) {
    for (const dialect of DIALECTS) tally[entry.cells[dialect].kind]++;
  }
  return tally;
};

const manifest = {
  _comment:
    'INERT capability manifest. Nothing imports this, nothing generates from it, no gate reads it. ' +
    "`kind` is extraction's HYPOTHESIS from goldens that are generated rather than independently " +
    'checked — it is NOT a finding. `adjudicated` is false everywhere and only a human may set it. ' +
    "`name` is the engine's own term for the capability and is seeded EMPTY on purpose: it decides " +
    'what a caller sees when they hit the dot, and filling all four dialects with the SAME name is ' +
    'what makes a capability shared. Sharedness is DERIVED from the names agreeing, never authored. ' +
    'There is deliberately no "emulated" kind. See docs/capability-manifest-design.md. ' +
    'Regenerate with: node scripts/build-capability-manifest.mjs',
  manifestVersion: '0.1.0',
  generatedFrom: {
    corpus: 'contract/corpora/emission/corpus.json',
    corpusVersion: corpus.version ?? null,
    corpusCases: (corpus.cases ?? []).length,
    audit: 'docs/audits/dialect-parity-2026-07-19.md',
    sweep: '2026-07-20 approximation sweep (39 confirmed violations)',
  },
  dialects: DIALECTS,
  summary: {
    ops: Object.keys(ops).length,
    enumMembers: Object.keys(enums).length,
    enumMembersWithNoCoverage: uncovered.length,
    opCells: countKinds(ops),
    enumCells: countKinds(enums),
    adjudicated: 0,
    namesAssigned: 0,
  },
  ops,
  enums,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(manifest, null, 2) + '\n');

const { opCells: oc, enumCells: ec } = manifest.summary;
console.log(
  `capability manifest: ${manifest.summary.ops} ops + ${manifest.summary.enumMembers} enum members x ${DIALECTS.length} dialects\n` +
    `  op cells   : ${oc.native} native / ${oc.absent} absent / ${oc.unadjudicated} unadjudicated\n` +
    `  enum cells : ${ec.native} native / ${ec.absent} absent / ${ec.unadjudicated} unadjudicated\n` +
    `  adjudicated: 0 (every cell awaits a human)\n` +
    `  written    : ${OUT.replace(ROOT + '/', '')}`,
);
