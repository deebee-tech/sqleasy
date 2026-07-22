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
//   1. `kind` on an UNADJUDICATED cell is extraction's HYPOTHESIS, never a finding. A cell only
//      becomes adjudicated from a HUMAN source: decisions.json, or the typed-view surface
//      (dart/query/tool/view_manifest.dart — hand-authored, gate-enforced, parity-checked against
//      the TS AbsentOn* sets). Extraction never sets `adjudicated`.
//   2. Every op and enum member named by the 2026-07-19 parity audit (Parts 2-4) or the 2026-07-20
//      approximation sweep is FORCED to `unadjudicated` UNLESS a human source settled it. The forced
//      list is the nuance guard: for a forced op the view surface trusts only the ABSENCE side, never
//      "present, therefore native" — because presence does not settle a meaning that turns on an enum
//      or argument the view cannot see (whereMatch's full-text subsystem, updateTable's SQLite gap).
//   3. `name` is never inferred from GENERATED goldens. It comes only from a human source — the
//      engine-native names in decisions.json, or the verified view surface (where a method present on
//      a non-forced op is native under its own name, and a renamed method is native under its alias).
//      The laundering trap below is about extraction, not about the hand-verified view surface.
//
// There is deliberately no `emulated` kind. It is the low-energy path, and the 39 confirmed
// violations accumulated under a regime that already had a corpus, a parity ratchet, and code review.
// Do not build the drawer they would hide in.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const DIALECTS = ['mssql', 'mysql', 'postgres', 'sqlite'];
const CORPUS = join(ROOT, 'contract', 'corpora', 'emission', 'corpus.json');
const ENUM_DIR = join(ROOT, 'ts', 'query', 'src', 'enums');
const OUT = join(ROOT, 'contract', 'capabilities', 'capabilities.json');
const DECISIONS_PATH = join(ROOT, 'contract', 'capabilities', 'decisions.json');

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

// Hand-authored adjudications. This file is the SOURCE OF TRUTH and is never generated; the
// manifest is generated and must never be hand-edited. Without this split the first regeneration
// would silently destroy every decision made.
const DECISIONS = existsSync(DECISIONS_PATH)
  ? JSON.parse(readFileSync(DECISIONS_PATH, 'utf8'))
  : { ops: {}, enums: {} };

// ── The typed-view surface as an adjudication source ──────────────────────────────────────────────
// The per-engine typed views (dart/query/tool/view_manifest.dart, held in lockstep with the TS
// AbsentOn* sets by scripts/check-surface-parity.mjs) are a HAND-AUTHORED, gate-enforced record of
// exactly which methods each dialect can run. That is a human adjudication, the same class as
// decisions.json — so its FIRM facts feed the manifest and complete the method (op) axis:
//
//   • a method in a dialect's `absent` set that is NOT a rename target → the capability is genuinely
//     ABSENT on that dialect (adjudicated absent);
//   • a method that a dialect renames (its generic name is hidden and an engine-native alias shown) →
//     the capability is NATIVE there, under the alias's name (adjudicated native, name = the alias).
//
// It deliberately does NOT touch PRESENT-but-unrenamed cells: a method being on the view means it
// runs, but not that it means the SAME thing on every engine — `whereMatch` spans four unrelated
// full-text subsystems, `orderByColumn` carries NullsOrder nuance — so those stay on the
// forced/extraction path for a human to judge at the enum/argument level. This is NOT laundering:
// nothing here is read from the generated goldens; it is read from the verified honest surface.
const VIEW_MANIFEST = join(ROOT, 'dart', 'query', 'tool', 'view_manifest.dart');

function readViewSurface() {
  const stripComments = (t) =>
    t
      .split('\n')
      .map((l) => l.replace(/\/\/.*$/, ''))
      .join('\n');
  const src = stripComments(readFileSync(VIEW_MANIFEST, 'utf8'));
  const surface = {};
  for (const dialect of DIALECTS) {
    const block = src.match(
      new RegExp(`'${dialect}':\\s*DialectViewPolicy\\(([\\s\\S]*?)\\n  \\),`, 'm'),
    );
    if (!block) throw new Error(`build-capability-manifest: policy for '${dialect}' not found`);
    const absentMatch = block[1].match(/absent:\s*\{([\s\S]*?)\}/);
    const absent = new Set(
      [...(absentMatch?.[1] ?? '').matchAll(/'([A-Za-z][A-Za-z0-9]*)'/g)].map((m) => m[1]),
    );
    const aliasMatch = block[1].match(/aliases:\s*\{([\s\S]*?)\}/);
    const aliasTargetToSurface = {};
    for (const pair of (aliasMatch?.[1] ?? '').matchAll(/'([A-Za-z0-9]+)':\s*'([A-Za-z0-9]+)'/g)) {
      aliasTargetToSurface[pair[2]] = pair[1]; // target method -> engine-native surface name
    }
    surface[dialect] = { absent, aliasTargetToSurface };
  }
  return surface;
}

const VIEW = readViewSurface();

/**
 * The firm typed-view fact for one (op, dialect), or null to leave it to forced/extraction.
 *
 * `isForced` is the nuance guard: an op on the {@link FORCED} list is one whose mere presence on a
 * view does NOT settle it (its per-dialect meaning turns on an enum or argument the view cannot see —
 * `whereMatch`'s full-text subsystem, `updateTable`'s SQLite UPDATE…FROM gap). For those, only the
 * ABSENCE side is firm; a present cell is left flagged for a human. For every other op, present means
 * genuinely native under its own name — the clean-sweep removed the emulations that made presence
 * untrustworthy, so this is the honest surface, not laundering.
 */
function viewFact(op, dialect, isForced) {
  const { absent, aliasTargetToSurface } = VIEW[dialect];
  const renamedTo = aliasTargetToSurface[op];
  if (renamedTo) return { kind: 'native', name: renamedTo }; // hidden generic, shown as the alias
  if (absent.has(op)) return { kind: 'absent', name: '' }; // genuinely absent
  if (isForced) return null; // present but nuanced — leave for a human to judge
  return { kind: 'native', name: op }; // present and unambiguous — native under its own name
}

function buildCells(counts, forcedReason, decision, viewFor) {
  const cells = {};
  for (const dialect of DIALECTS) {
    const observed = counts[dialect];
    const forced = Boolean(forcedReason);
    const decided = decision?.[dialect];
    // decisions.json (richest — carries refusal + prose) outranks the view surface, which outranks
    // the forced list and raw extraction. decisions.json and the view surface are both human and are
    // held consistent, so this order only decides which one supplies the prose.
    const view = decided ? null : (viewFor?.(dialect) ?? null);
    const source = decided ? 'decisions' : view ? 'view' : forced ? 'forced' : 'extraction';
    // CONTRADICTION GUARD. The view says "present", so viewFact calls it native — but presence is not
    // performance. An op kept on a view as a CONDITIONAL refusal (MySQL keeps `*WithOwner` because an
    // EMPTY owner is legal there) still throws for every real use, and the corpus proves it: every
    // case on that dialect threw and none emitted. Before this guard the manifest shipped
    // `deleteFromWithOwner`, `insertIntoWithOwner` and `joinTableWithOwner` as
    // `native, adjudicated: true` on MySQL while the parser threw 'MySQL does not support table
    // owners' — the manifest asserting a capability the engine refuses, which is the exact dishonesty
    // it exists to prevent. `fromTableWithOwner`/`updateTableWithOwner` escaped only by happening to
    // sit on FORCED.
    //
    // A HUMAN decision still outranks this: decisions.json can say native-with-nuance and mean it.
    // Extraction and the view surface cannot.
    const contradicted =
      !decided && view?.kind === 'native' && observed.threw > 0 && observed.emitted === 0;

    cells[dialect] = {
      name: contradicted ? '' : (decided?.name ?? view?.name ?? ''),
      kind: contradicted
        ? 'unadjudicated'
        : (decided?.kind ?? view?.kind ?? (forced ? 'unadjudicated' : hypothesize(observed))),
      adjudicated: contradicted ? false : (decided?.adjudicated ?? (view ? true : false)),
      refusal: decided?.refusal ?? null,
      evidence: {
        casesEmitting: observed.emitted,
        casesThrowing: observed.threw,
        note: contradicted
          ? `presence on the ${dialect} view is a CONDITIONAL refusal — every corpus case throws and none emits, so it cannot be native; needs a human decision`
          : source === 'decisions'
            ? 'adjudicated in contract/capabilities/decisions.json'
            : source === 'view'
              ? 'adjudicated by the typed-view surface (dart/query/tool/view_manifest.dart)'
              : source === 'forced'
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
  ops[op] = {
    cells: buildCells(opCells.get(op), FORCED[op], DECISIONS.ops?.[op], (d) =>
      viewFact(op, d, Boolean(FORCED[op])),
    ),
  };
}

const enums = {};
for (const ref of [...enumCells.keys()].sort()) {
  const [enumName, member] = ref.split('.');
  enums[ref] = {
    enum: enumName,
    member,
    usedByOps: [...(enumUsedBy.get(ref) ?? [])].sort(),
    cells: buildCells(enumCells.get(ref), FORCED_ENUM[ref], DECISIONS.enums?.[ref]),
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
        DECISIONS.enums?.[ref],
      ),
    };
  }
}

/** Counts cells across BOTH axes — ops and enum members — matching a predicate. */
const countWhere = (predicate) =>
  [...Object.values(ops), ...Object.values(enums)].reduce(
    (total, entry) => total + DIALECTS.filter((d) => predicate(entry.cells[d])).length,
    0,
  );

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
    'A cell is `adjudicated` when a HUMAN source settled it: decisions.json (rich, carries the ' +
    'refusal text) or the typed-view surface (dart/query/tool/view_manifest.dart, held in lockstep ' +
    'with the TS AbsentOn* sets by scripts/check-surface-parity.mjs) — the latter now supplies every ' +
    "method's per-dialect membership and engine-native name. An UNADJUDICATED cell is one no human " +
    'source has settled: an op on the forced list whose meaning turns on an enum/argument the views ' +
    "cannot see (whereMatch's full-text subsystem, updateTable's SQLite gap), or a caller-facing enum " +
    'member (WhereOperator.Ilike, NullsOrder.First, …) — the enum axis is NOT expressible in the typed ' +
    "views and remains the hand-adjudication frontier. `kind` on an unadjudicated cell is extraction's " +
    "HYPOTHESIS from generated goldens, never a finding. `name` is the engine's own term; filling all " +
    'four dialects with the SAME name is what makes a capability shared (sharedness is DERIVED, never ' +
    'authored). There is deliberately no "emulated" kind. See docs/capability-manifest-design.md. ' +
    'Regenerate with: node scripts/build-capability-manifest.mjs',
  manifestVersion: '0.1.0',
  generatedFrom: {
    corpus: 'contract/corpora/emission/corpus.json',
    corpusVersion: corpus.version ?? null,
    corpusCases: (corpus.cases ?? []).length,
    decisions: 'contract/capabilities/decisions.json',
    typedViewSurface:
      'dart/query/tool/view_manifest.dart (parity-checked against ts typed-views.ts)',
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
    adjudicated: countWhere((c) => c.adjudicated),
    namesAssigned: countWhere((c) => c.name !== ''),
  },
  ops,
  enums,
};

const rendered = JSON.stringify(manifest, null, 2) + '\n';

// `--check` REBUILDS and COMPARES instead of writing — the freshness gate.
//
// capabilities.json is generated from typed-views.ts, decisions.json and the emission corpus, and
// every one of those moves. Without this, the committed manifest drifts silently: it keeps describing
// a surface that no longer exists, and it is the artifact that documents what each dialect can do.
// A stale one is worse than none, because it reads as authoritative.
if (process.argv.includes('--check')) {
  const current = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (current !== rendered) {
    console.error(
      'check-capabilities: STALE — contract/capabilities/capabilities.json does not match its inputs.\n' +
        '  It is generated from ts/query/src/builder/typed-views.ts, contract/capabilities/decisions.json\n' +
        '  and the emission corpus. Regenerate and commit the result:\n' +
        '    pnpm capabilities',
    );
    process.exit(1);
  }
  console.log('check-capabilities: ok — the manifest matches its inputs.');
  process.exit(0);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, rendered);

const { opCells: oc, enumCells: ec } = manifest.summary;
console.log(
  `capability manifest: ${manifest.summary.ops} ops + ${manifest.summary.enumMembers} enum members x ${DIALECTS.length} dialects\n` +
    `  op cells   : ${oc.native} native / ${oc.absent} absent / ${oc.unadjudicated} unadjudicated\n` +
    `  enum cells : ${ec.native} native / ${ec.absent} absent / ${ec.unadjudicated} unadjudicated\n` +
    `  adjudicated: ${manifest.summary.adjudicated} of ${(manifest.summary.ops + manifest.summary.enumMembers) * DIALECTS.length}` +
    ` (${manifest.summary.namesAssigned} carry an engine-native name)\n` +
    `  written    : ${OUT.replace(ROOT + '/', '')}`,
);
