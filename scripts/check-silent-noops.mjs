#!/usr/bin/env node
/**
 * Every clause-setting method must EMIT something or REFUSE. Neither is a silent no-op.
 *
 * The failure this exists to catch has recurred all through the 12.x work: a method that a caller
 * can reach, that accepts its arguments without complaint, and whose clause never reaches the SQL.
 * `.limit(1000)` on a DELETE deleted the whole table. `.top(0)` produced an uncapped SELECT.
 * `hintMssqlOption` on a branch silently went statement-wide. Each was found by accident, one at a
 * time, and each had shipped.
 *
 * The check is mechanical: build the same statement twice, call the method on one of them, and
 * compare the emitted SQL. Three outcomes, and only one is a defect:
 *
 *   SQL differs   the clause reached the output          — fine
 *   throws        the library refused, honestly          — fine
 *   SQL identical the call was accepted and discarded    — SILENT NO-OP
 *
 * A method is checked once per dialect, because a clause can be honoured on one engine and dropped
 * on another — which is exactly how the mutation row cap hid for so long.
 *
 * ── ON COVERAGE ──
 * Fixtures are hand-written, because generating arguments produced false results every time it was
 * tried: a wrong key or an unresolvable ORDER BY term reads as "the engine refused" when it was
 * really the probe that was malformed. Methods with no fixture are reported as SKIPPED with a
 * reason and counted separately. A green run means "no silent no-op among the CHECKED methods",
 * never "there are none" — the skip list is part of the result, not a footnote.
 */

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const q = require(join(root, 'ts/query/dist/index.cjs'));

const {
  AggregateFunction,
  JoinType,
  JoinOperator,
  WhereOperator,
  OrderByDirection,
  JsonExtractMode,
  FullTextMode,
  FrameUnit,
  FrameBoundType,
  NullsOrder,
} = q;

const DIALECTS = {
  postgres: () => new q.PostgresQuery(),
  mysql: () => new q.MysqlQuery(),
  sqlite: () => new q.SqliteQuery(),
  mssql: () => new q.MssqlQuery(),
};

/** Statement shapes a clause can attach to. Each is valid on its own, so the baseline always parses. */
const BASE = {
  select: (b) => b.fromTable('orders', 'o').selectAll(),
  selectGrouped: (b) =>
    b.fromTable('orders', 'o').selectColumn('o', 'id', '').groupByColumn('o', 'id'),
  selectOrdered: (b) =>
    b.fromTable('orders', 'o').selectAll().orderByColumn('o', 'id', OrderByDirection.Ascending),
  insert: (b) =>
    b
      .insertInto('orders')
      .insertColumns(['customer_id'])
      .insertValues([[1]]),
  insertSelect: (b) =>
    b
      .insertInto('orders')
      .insertColumns(['customer_id'])
      .insertSelect((s) => s.fromTable('orders', '').selectColumn('', 'customer_id', '')),
  update: (b) => b.updateTable('orders', 'o').set('note', 'x'),
  delete: (b) => b.deleteFrom('orders', 'o'),
};

const sub = (s) => s.fromTable('orders', '').selectColumn('', 'id', '');
const col = (t, c) => ({ tableNameOrAlias: t, columnName: c });

/**
 * method -> { base, apply }.  `apply` receives the builder AFTER the base has been built.
 * Anything absent from here appears in the SKIPPED list with its reason.
 */
const CASES = {
  // ── SELECT list ──
  distinct: { base: 'select', apply: (b) => b.distinct() },
  distinctOn: { base: 'select', apply: (b) => b.distinctOn([col('o', 'id')]) },
  selectColumn: { base: 'select', apply: (b) => b.selectColumn('o', 'note', '') },
  selectColumns: {
    base: 'select',
    apply: (b) => b.selectColumns([{ table: 'o', column: 'note' }]),
  },
  selectRaw: { base: 'select', apply: (b) => b.selectRaw('1') },
  selectRaws: { base: 'select', apply: (b) => b.selectRaws(['1']) },
  selectWithBuilder: { base: 'select', apply: (b) => b.selectWithBuilder(sub, 'k') },
  selectJsonExtract: {
    base: 'select',
    apply: (b) => b.selectJsonExtract('o', 'note', '$.x', JsonExtractMode.Text, 'k'),
  },
  selectJsonArrayAgg: {
    base: 'select',
    apply: (b) => b.selectJsonArrayAgg('o', 'id', 'arr'),
  },
  selectJsonObjectAgg: {
    base: 'select',
    apply: (b) => b.selectJsonObjectAgg('o', 'id', 'o', 'total', 'obj'),
  },
  selectStringAgg: {
    base: 'select',
    apply: (b) => b.selectStringAgg('o', 'note', '|', 'g'),
  },
  selectGroupConcat: {
    base: 'select',
    apply: (b) => b.selectGroupConcat('o', 'note', 'g', { separator: '|' }),
  },
  selectAggregate: {
    base: 'select',
    apply: (b) => b.selectAggregate(AggregateFunction.Count, '', '*', 'n'),
  },
  selectWindow: {
    base: 'select',
    apply: (b) => b.selectWindow('ROW_NUMBER()', (w) => w.partitionByColumn('o', 'id'), 'rn'),
  },

  // ── FROM ──
  fromTable: { base: 'select', apply: (b) => b.fromTable('customers', 'c2') },
  fromTables: {
    base: 'select',
    apply: (b) => b.fromTables([{ tableName: 'customers', alias: 'c3' }]),
  },
  fromRaw: { base: 'select', apply: (b) => b.fromRaw('customers c4') },
  fromRaws: { base: 'select', apply: (b) => b.fromRaws(['customers c5']) },
  fromWithBuilder: { base: 'select', apply: (b) => b.fromWithBuilder('d1', sub) },
  fromLateral: { base: 'select', apply: (b) => b.fromLateral('d2', sub) },
  fromTableFunction: { base: 'select', apply: (b) => b.fromTableFunction('f', [1], 'fx') },
  fromFunctionRaw: { base: 'select', apply: (b) => b.fromFunctionRaw('f(1) fy') },

  // ── JOIN ──
  joinTable: {
    base: 'select',
    apply: (b) =>
      b.joinTable(JoinType.Inner, 'customers', 'j1', (j) =>
        j.on('j1', 'id', JoinOperator.Equals, 'o', 'customer_id'),
      ),
  },
  joinRaw: {
    base: 'select',
    apply: (b) => b.joinRaw('INNER JOIN customers j2 ON j2.id = o.customer_id'),
  },
  joinWithBuilder: {
    base: 'select',
    apply: (b) =>
      b.joinWithBuilder(JoinType.Inner, 'j3', sub, (j) =>
        j.on('j3', 'id', JoinOperator.Equals, 'o', 'id'),
      ),
  },
  joinCrossApply: { base: 'select', apply: (b) => b.joinCrossApply('j4', sub) },
  joinOuterApply: { base: 'select', apply: (b) => b.joinOuterApply('j5', sub) },
  joinLateral: {
    base: 'select',
    apply: (b) => b.joinLateral('j6', sub, (j) => j.on('j6', 'id', JoinOperator.Equals, 'o', 'id')),
  },

  // ── WHERE ──
  where: { base: 'select', apply: (b) => b.where('o', 'id', WhereOperator.Equals, 1) },
  whereBetween: { base: 'select', apply: (b) => b.whereBetween('o', 'id', 1, 9) },
  whereNull: { base: 'select', apply: (b) => b.whereNull('o', 'note') },
  whereNotNull: { base: 'select', apply: (b) => b.whereNotNull('o', 'note') },
  whereInValues: { base: 'select', apply: (b) => b.whereInValues('o', 'id', [1, 2]) },
  whereRowValue: {
    base: 'select',
    apply: (b) =>
      b.whereRowValue([col('o', 'id'), col('o', 'customer_id')], WhereOperator.GreaterThan, [1, 1]),
  },
  whereRowValueIn: {
    base: 'select',
    apply: (b) =>
      b.whereRowValueIn(
        [col('o', 'id'), col('o', 'customer_id')],
        [
          [1, 1],
          [2, 2],
        ],
      ),
  },
  whereNotInValues: { base: 'select', apply: (b) => b.whereNotInValues('o', 'id', [1, 2]) },
  whereRaw: { base: 'select', apply: (b) => b.whereRaw('1 = 1') },
  whereRaws: { base: 'select', apply: (b) => b.whereRaws(['1 = 1']) },
  whereGroup: {
    base: 'select',
    apply: (b) => b.whereGroup((g) => g.where('o', 'id', WhereOperator.Equals, 1)),
  },
  whereInWithBuilder: { base: 'select', apply: (b) => b.whereInWithBuilder('o', 'id', sub) },
  whereNotInWithBuilder: { base: 'select', apply: (b) => b.whereNotInWithBuilder('o', 'id', sub) },
  whereExistsWithBuilder: { base: 'select', apply: (b) => b.whereExistsWithBuilder(sub) },
  whereNotExistsWithBuilder: { base: 'select', apply: (b) => b.whereNotExistsWithBuilder(sub) },
  whereJsonExtract: {
    base: 'select',
    apply: (b) =>
      b.whereJsonExtract('o', 'note', '$.x', JsonExtractMode.Text, WhereOperator.Equals, 'a'),
  },
  whereJsonContains: { base: 'select', apply: (b) => b.whereJsonContains('o', 'note', '{}') },
  whereMatch: {
    base: 'select',
    apply: (b) => b.whereMatch([col('o', 'note')], FullTextMode.Natural, 'x'),
  },
  whereMatchRaw: { base: 'select', apply: (b) => b.whereMatchRaw('1 = 1') },
  whereExists: { base: 'select', apply: (b) => b.whereExists(sub) },
  whereNotExists: { base: 'select', apply: (b) => b.whereNotExists(sub) },

  // ── GROUP BY / HAVING ──
  groupByColumn: { base: 'select', apply: (b) => b.groupByColumn('o', 'id') },
  groupByColumns: {
    base: 'select',
    apply: (b) => b.groupByColumns([{ table: 'o', column: 'id' }]),
  },
  groupByRaw: { base: 'select', apply: (b) => b.groupByRaw('o.id') },
  groupByRaws: { base: 'select', apply: (b) => b.groupByRaws(['o.id']) },
  groupByRollup: { base: 'select', apply: (b) => b.groupByRollup([col('o', 'id')]) },
  groupByCube: { base: 'select', apply: (b) => b.groupByCube([col('o', 'id')]) },
  groupByGroupingSets: { base: 'select', apply: (b) => b.groupByGroupingSets([[col('o', 'id')]]) },
  having: {
    base: 'selectGrouped',
    apply: (b) => b.having('o', 'id', WhereOperator.GreaterThan, 1),
  },
  havingBetween: { base: 'selectGrouped', apply: (b) => b.havingBetween('o', 'id', 1, 9) },
  havingNull: { base: 'selectGrouped', apply: (b) => b.havingNull('o', 'id') },
  havingNotNull: { base: 'selectGrouped', apply: (b) => b.havingNotNull('o', 'id') },
  havingInValues: { base: 'selectGrouped', apply: (b) => b.havingInValues('o', 'id', [1]) },
  havingNotInValues: { base: 'selectGrouped', apply: (b) => b.havingNotInValues('o', 'id', [1]) },
  havingRaw: { base: 'selectGrouped', apply: (b) => b.havingRaw('COUNT(*) > 1') },
  havingAggregate: {
    base: 'selectGrouped',
    apply: (b) => b.havingAggregate(AggregateFunction.Count, '', '*', WhereOperator.GreaterThan, 1),
  },
  havingRaws: { base: 'selectGrouped', apply: (b) => b.havingRaws(['COUNT(*) > 1']) },
  havingGroup: {
    base: 'selectGrouped',
    apply: (b) => b.havingGroup((g) => g.having('o', 'id', WhereOperator.GreaterThan, 1)),
  },
  havingInWithBuilder: {
    base: 'selectGrouped',
    apply: (b) => b.havingInWithBuilder('o', 'id', sub),
  },
  havingNotInWithBuilder: {
    base: 'selectGrouped',
    apply: (b) => b.havingNotInWithBuilder('o', 'id', sub),
  },
  havingExists: { base: 'selectGrouped', apply: (b) => b.havingExists(sub) },
  havingNotExists: { base: 'selectGrouped', apply: (b) => b.havingNotExists(sub) },
  havingJsonExtract: {
    base: 'selectGrouped',
    apply: (b) =>
      b.havingJsonExtract('o', 'note', '$.x', JsonExtractMode.Text, WhereOperator.Equals, 'a'),
  },
  havingJsonContains: {
    base: 'selectGrouped',
    apply: (b) => b.havingJsonContains('o', 'note', '{}'),
  },
  havingMatch: {
    base: 'selectGrouped',
    apply: (b) => b.havingMatch([col('o', 'note')], FullTextMode.Natural, 'x'),
  },

  // ── ORDER BY / paging ──
  orderByColumn: {
    base: 'select',
    apply: (b) => b.orderByColumn('o', 'id', OrderByDirection.Ascending),
  },
  orderByColumns: {
    base: 'select',
    apply: (b) =>
      b.orderByColumns([
        { table: 'o', column: 'id', direction: OrderByDirection.Ascending, nulls: NullsOrder.None },
      ]),
  },
  orderByRaw: { base: 'select', apply: (b) => b.orderByRaw('o.id') },
  orderByRaws: { base: 'select', apply: (b) => b.orderByRaws(['o.id']) },
  limit: { base: 'selectOrdered', apply: (b) => b.limit(5) },
  // NOTE: every value here is distinct on purpose. Two methods writing the same slot with the
  // SAME argument produce identical SQL, which phase 2 would report as a cancellation.
  // `limitWithTies(7)` vs `limit(5)` is the difference between a finding and an artifact.
  offset: { base: 'selectOrdered', apply: (b) => b.offset(9) },
  limitWithTies: { base: 'selectOrdered', apply: (b) => b.limitWithTies(7) },
  top: { base: 'select', apply: (b) => b.top(3) },

  // ── set operations / CTEs ──
  union: { base: 'select', apply: (b) => b.union(sub) },
  unionAll: { base: 'select', apply: (b) => b.unionAll(sub) },
  intersect: { base: 'select', apply: (b) => b.intersect(sub) },
  except: { base: 'select', apply: (b) => b.except(sub) },
  cte: { base: 'select', apply: (b) => b.cte('c1', sub) },
  cteRaw: { base: 'select', apply: (b) => b.cteRaw('c2', 'SELECT 1') },

  // ── row locks / hints ──
  forUpdate: { base: 'select', apply: (b) => b.forUpdate() },
  forShare: { base: 'select', apply: (b) => b.forShare() },
  forUpdateNowait: { base: 'select', apply: (b) => b.forUpdateNowait() },
  forUpdateSkipLocked: { base: 'select', apply: (b) => b.forUpdateSkipLocked() },
  forShareNowait: { base: 'select', apply: (b) => b.forShareNowait() },
  forShareSkipLocked: { base: 'select', apply: (b) => b.forShareSkipLocked() },
  updlock: { base: 'select', apply: (b) => b.updlock() },
  updlockNowait: { base: 'select', apply: (b) => b.updlockNowait() },
  updlockReadpast: { base: 'select', apply: (b) => b.updlockReadpast() },
  hintUseIndex: { base: 'select', apply: (b) => b.hintUseIndex('o', ['orders_pkey']) },
  hintForceIndex: { base: 'select', apply: (b) => b.hintForceIndex('o', ['orders_pkey']) },
  hintMssqlOption: { base: 'select', apply: (b) => b.hintMssqlOption('MAXDOP 1') },
  hintRaw: { base: 'select', apply: (b) => b.hintRaw('/* x */') },

  // ── mutations ──
  insertIgnore: { base: 'insert', apply: (b) => b.insertIgnore() },
  insertRaw: { base: 'insert', apply: (b) => b.insertRaw('SELECT 1') },
  onConflictDoNothing: { base: 'insert', apply: (b) => b.onConflictDoNothing(['customer_id']) },
  onConflictDoUpdate: {
    base: 'insert',
    apply: (b) => b.onConflictDoUpdate(['customer_id'], [{ columnName: 'note', value: 'x' }]),
  },
  onConflictDoUpdateRaw: {
    base: 'insert',
    apply: (b) => b.onConflictDoUpdateRaw(['customer_id'], 'note = 1'),
  },
  onDuplicateKeyUpdate: {
    base: 'insert',
    apply: (b) => b.onDuplicateKeyUpdate([{ columnName: 'note', value: 'x' }]),
  },
  onDuplicateKeyUpdateRaw: { base: 'insert', apply: (b) => b.onDuplicateKeyUpdateRaw('note = 1') },
  returning: { base: 'insert', apply: (b) => b.returning(['id']) },
  returningRaw: { base: 'insert', apply: (b) => b.returningRaw('id') },
  setRaw: { base: 'update', apply: (b) => b.setRaw('note = 1') },
  setColumns: { base: 'update', apply: (b) => b.setColumns([{ columnName: 'note', value: 'y' }]) },
};

/** Methods with no fixture, and WHY. Counted and printed — never silently omitted. */
const SKIPPED = {
  and: 'combinator — meaningless without two adjacent predicates; covered by whereGroup',
  or: 'combinator — as above',
  merge: 'MSSQL-only sub-builder with its own required shape; covered by the merge suites',
  callProcedure: 'builds a CALL statement rather than adding a clause — no shared baseline',
  callFunction: 'as callProcedure',
  procParam: 'only meaningful inside a call statement',
  procParams: 'as procParam',
  procParamNamed: 'as procParam',
  procParamOut: 'as procParam',
  procParamInOut: 'as procParam',
  procParamRaw: 'as procParam',
  insertSelect: 'used to BUILD the insertSelect baseline; a no-op there would fail that baseline',
  insertInto: 'used to build the insert baseline',
  insertColumns: 'used to build the insert baseline',
  insertValues: 'used to build the insert baseline',
  updateTable: 'used to build the update baseline',
  deleteFrom: 'used to build the delete baseline',
  set: 'used to build the update baseline',
  selectAll: 'used to build the select baseline',
  cteRecursive: 'requires a self-referencing body; covered by the recursive-CTE suites',
  joinTables: 'plural form of joinTable, same code path',
  joinRaws: 'plural form of joinRaw',
  joinCrossLateral: 'alias of joinCrossApply',
  joinLeftLateral: 'alias of joinOuterApply',
  fromTableWithOwner: 'owner variants share the emission path with their base method',
  fromTablesWithOwner: 'as above',
  fromTableFunctionWithOwner: 'as above',
  insertIntoWithOwner: 'as above',
  updateTableWithOwner: 'as above',
  deleteFromWithOwner: 'as above',
  joinTableWithOwner: 'as above',
  joinTablesWithOwner: 'as above',
  callProcedureWithOwner: 'as above',
  callFunctionWithOwner: 'as above',
};

const build = (make, baseName, apply) => {
  const b = make().newBuilder();
  BASE[baseName](b);
  if (apply) apply(b);
  return b.parseRaw();
};

let checked = 0;
let noops = 0;
const findings = [];

for (const [method, spec] of Object.entries(CASES)) {
  for (const [dialect, make] of Object.entries(DIALECTS)) {
    let before;
    try {
      before = build(make, spec.base, undefined);
    } catch (err) {
      findings.push({ method, dialect, kind: 'BASELINE-BROKEN', detail: err.message });
      continue;
    }

    checked += 1;
    let after;
    try {
      after = build(make, spec.base, spec.apply);
    } catch {
      continue; // refused — honest
    }

    if (after === before) {
      noops += 1;
      findings.push({ method, dialect, kind: 'SILENT-NOOP', detail: before });
    }
  }
}

const skippedNames = Object.keys(SKIPPED);
const covered = new Set([...Object.keys(CASES), ...skippedNames]);
const probe = new q.PostgresQuery().newBuilder();
const NON_CLAUSE = /^(clear|parse)|^(state|configuration)$/;
const unaccounted = Object.keys(probe)
  .filter((k) => typeof probe[k] === 'function' && !NON_CLAUSE.test(k) && !covered.has(k))
  .sort();

console.log(`check-silent-noops: ${checked} (method x dialect) pairs checked`);
console.log(`  fixtures      : ${Object.keys(CASES).length} methods`);
console.log(
  `  skipped       : ${skippedNames.length} methods (see SKIPPED in this script for why)`,
);
if (unaccounted.length > 0) {
  console.log(`  UNACCOUNTED   : ${unaccounted.length} — ${unaccounted.join(', ')}`);
}

const broken = findings.filter((f) => f.kind === 'BASELINE-BROKEN');
if (broken.length > 0) {
  console.log(
    `\n  ${broken.length} baseline(s) failed to parse — the probe is wrong, not the library:`,
  );
  for (const f of broken.slice(0, 10)) {
    console.log(`    ${f.method} / ${f.dialect}: ${f.detail.slice(0, 90)}`);
  }
}

if (noops > 0) {
  console.log(
    `\n  ✗ ${noops} SILENT NO-OP(S) — the call was accepted and the clause never appeared:\n`,
  );
  for (const f of findings.filter((x) => x.kind === 'SILENT-NOOP')) {
    console.log(`    ${f.method.padEnd(26)} ${f.dialect.padEnd(9)} ${f.detail.slice(0, 76)}`);
  }
  process.exit(1);
}

if (unaccounted.length > 0) {
  console.log('\n  ✗ methods with neither a fixture nor a skip reason — add one or the other');
  process.exit(1);
}

console.log('\ncheck-silent-noops: ok — every checked method emits or refuses');

/**
 * PHASE 2 — one clause CANCELLING another.
 *
 * Phase 1 asks "does this method do anything at all", which a method can pass while still being
 * swallowed whenever some OTHER clause is present. That is a different defect and it is the one
 * that hid longest: `groupByRollup()` and `groupByColumn()` each emit fine alone, but set both and
 * the plain column vanishes — the statement runs and groups by the wrong thing.
 *
 * So: for every ordered pair (X, Y) sharing a baseline, emit X alone and then X-then-Y. If adding Y
 * changed nothing, Y was accepted and discarded. Throwing is fine — that is a refusal.
 */
/**
 * Pairs that write the SAME state slot with the SAME meaning, under two engine-native names.
 *
 * `forUpdate()` and `updlock()` are one capability spelled per dialect — the rename this library
 * made deliberately. Calling both is redundant, not swallowed: each sets the same lock mode, so the
 * second changes nothing and SHOULD change nothing. Recording them here keeps phase 2 honest rather
 * than teaching it to ignore whole families.
 */
const EQUIVALENT = new Set([
  'forUpdate|updlock',
  'updlock|forUpdate',
  'forUpdateNowait|updlockNowait',
  'updlockNowait|forUpdateNowait',
  'forUpdateSkipLocked|updlockReadpast',
  'updlockReadpast|forUpdateSkipLocked',
]);

const runCancellationPhase = () => {
  const byBase = {};
  for (const [method, spec] of Object.entries(CASES)) {
    (byBase[spec.base] ??= []).push([method, spec.apply]);
  }

  let pairs = 0;
  const cancelled = [];

  for (const [baseName, entries] of Object.entries(byBase)) {
    for (const [dialect, make] of Object.entries(DIALECTS)) {
      for (const [xName, xApply] of entries) {
        let alone;
        try {
          alone = build(make, baseName, xApply);
        } catch {
          continue; // X refused on this dialect — nothing to add Y to
        }

        for (const [yName, yApply] of entries) {
          if (yName === xName) continue;
          if (EQUIVALENT.has(`${xName}|${yName}`)) continue;
          pairs += 1;

          let both;
          try {
            both = build(make, baseName, (b) => {
              xApply(b);
              yApply(b);
            });
          } catch {
            continue; // refused — honest
          }

          if (both === alone) {
            cancelled.push({ x: xName, y: yName, dialect, sql: alone });
          }
        }
      }
    }
  }

  return { pairs, cancelled };
};

const { pairs, cancelled } = runCancellationPhase();

console.log(`\ncheck-silent-noops phase 2: ${pairs} ordered clause pairs checked`);

if (cancelled.length > 0) {
  // Group by the pair so one root cause reads as one finding rather than four dialect rows.
  const grouped = new Map();
  for (const c of cancelled) {
    const key = `${c.x} + ${c.y}`;
    (grouped.get(key) ?? grouped.set(key, []).get(key)).push(c.dialect);
  }
  console.log(`\n  ✗ ${grouped.size} clause pair(s) where the SECOND call was swallowed:\n`);
  for (const [pair, dialects] of [...grouped].sort()) {
    console.log(`    ${pair.padEnd(46)} ${dialects.join(', ')}`);
  }
  process.exit(1);
}

console.log('check-silent-noops phase 2: ok — no clause cancels another');
