/// The ENTIRE hand-owned surface of the per-engine typed views — the single source of truth the
/// generator reads. Everything else under `lib/src/builder/views/` is derived output nobody edits.
///
/// SQLEasy is an honest capability surface: hitting the dot should show only what the engine you are
/// on can actually do. There is ONE runtime `QueryBuilder`; each dialect gets a generated
/// `abstract interface class` that redeclares only the methods that dialect can run, and
/// `QueryBuilder implements` all four. `tool/gen_views.dart` emits a method on EVERY view unless the
/// dialect's [absent] set excludes it — present-by-default, the exact analog of TypeScript's
/// `Exclude<keyof QueryBuilder, AbsentOnX>`, so a newly added builder method lands on every view
/// automatically and cannot silently vanish.
///
/// Each entry mirrors a runtime refusal that ALWAYS fires on that dialect (grounded in a hard throw
/// in `lib/src/parser/`); the TypeScript port carries the identical sets in `ts/query/src/builder/
/// typed-views.ts`. Keep the two in lockstep.
library;

/// One dialect's hand-owned policy: the methods it CANNOT run (absent from its view) and the
/// engine-native surface aliases it exposes (surface name -> the runtime method it delegates to).
class DialectViewPolicy {
  const DialectViewPolicy({required this.absent, this.aliases = const {}});

  /// Runtime method names that must NOT appear on this dialect's view.
  final Set<String> absent;

  /// Engine-native surface names this dialect exposes INSTEAD of the generic name: the key is the
  /// method that appears on the view, the value is the runtime `QueryBuilder` method it forwards to
  /// (which must itself be in [absent], so the generic name is hidden here while the alias is shown).
  /// Empty until the engine-native renames land; the generator supports it now so that change is a
  /// manifest edit, not a mechanism change.
  final Map<String, String> aliases;
}

/// The four dialect policies, keyed by the lowercase dialect name used in the generated file names.
const Map<String, DialectViewPolicy> viewManifest = {
  // MSSQL — no shared row lock, no LATERAL (it spells it APPLY), no JSON containment, no upsert
  // (T-SQL uses the separate MERGE statement), no MySQL index hints, no Postgres DISTINCT ON.
  'mssql': DialectViewPolicy(
    absent: {
      // GROUP_CONCAT is MySQL/SQLite's spelling; MSSQL's is stringAgg.
      'selectGroupConcat',
      'forShare',
      'forShareNowait',
      'forShareSkipLocked',
      'fromLateral',
      'joinLateral',
      'whereJsonContains',
      'havingJsonContains',
      'onConflictDoNothing',
      'onConflictDoUpdate',
      'onConflictDoUpdateRaw',
      'clearUpsert',
      'hintUseIndex',
      'hintForceIndex',
      'distinctOn',
      'clearDistinctOn',
      // Engine-native renames: MSSQL spells the lock family `updlock*`, so `forUpdate*` are hidden;
      // the MySQL upsert spellings live only on the MySQL view.
      'forUpdate',
      'forUpdateNowait',
      'forUpdateSkipLocked',
      'insertIgnore',
      'onDuplicateKeyUpdate',
      'onDuplicateKeyUpdateRaw',
      // MSSQL keeps the APPLY spelling, so the Postgres/MySQL LATERAL aliases are hidden here.
      'joinCrossLateral',
      'joinLeftLateral',
    },
    aliases: {
      'updlock': 'forUpdate',
      'updlockNowait': 'forUpdateNowait',
      'updlockReadpast': 'forUpdateSkipLocked',
    },
  ),

  // MySQL — no TOP (use limit), no MERGE, no MSSQL OPTION hint, no DISTINCT ON, no WITH TIES, no
  // CUBE/GROUPING SETS (only ROLLUP), no table functions in FROM, no named CALL params, no RETURNING.
  'mysql': DialectViewPolicy(
    absent: {
      // string_agg is the other three's spelling; MySQL's is groupConcat.
      'selectStringAgg',
      'top',
      'clearTop',
      'merge',
      'hintMssqlOption',
      'distinctOn',
      'clearDistinctOn',
      'limitWithTies',
      'clearLimitWithTies',
      'groupByCube',
      'groupByGroupingSets',
      'fromTableFunction',
      'fromTableFunctionWithOwner',
      'procParamNamed',
      'returning',
      'returningRaw',
      'clearReturning',
      // Engine-native renames: MySQL spells upsert `insertIgnore` / `onDuplicateKeyUpdate*`, so
      // `onConflict*` are hidden; the MSSQL `updlock*` family lives only on the MSSQL view. MySQL
      // keeps `forUpdate*`.
      'onConflictDoNothing',
      'onConflictDoUpdate',
      'onConflictDoUpdateRaw',
      'updlock',
      'updlockNowait',
      'updlockReadpast',
      // MySQL spells the APPLY concept LATERAL, so the APPLY names are hidden and
      // `joinCrossLateral`/`joinLeftLateral` are shown instead. `joinLateral` is a THIRD, different
      // join (it takes its own ON condition) and stays present under its own name.
      'joinCrossApply',
      'joinOuterApply',
    },
    aliases: {
      'insertIgnore': 'onConflictDoNothing',
      'onDuplicateKeyUpdate': 'onConflictDoUpdate',
      'onDuplicateKeyUpdateRaw': 'onConflictDoUpdateRaw',
      'joinCrossLateral': 'joinCrossApply',
      'joinLeftLateral': 'joinOuterApply',
    },
  ),

  // Postgres — the widest surface. Lacks only TOP/MERGE/OPTION (T-SQL) and the MySQL index hints.
  'postgres': DialectViewPolicy(
    absent: {
      // GROUP_CONCAT is MySQL/SQLite's spelling; Postgres's is stringAgg.
      'selectGroupConcat',
      'top',
      'clearTop',
      'merge',
      'hintMssqlOption',
      'hintUseIndex',
      'hintForceIndex',
      // Engine-native renames belonging to other dialects: Postgres keeps `forUpdate*` and
      // `onConflict*`.
      'updlock',
      'updlockNowait',
      // Carried verbatim from the TS AbsentOnPostgres union, which still names the pre-rename
      // `updlockReadpast`; the surface-parity gate compares the two lists literally. Harmless
      // here either way — every alias surface name (now `updlockReadpast`) is excluded from
      // auto-discovery, so the MSSQL lock spellings never reach this view.
      'updlockReadpast',
      'insertIgnore',
      'onDuplicateKeyUpdate',
      'onDuplicateKeyUpdateRaw',
      // Postgres spells the APPLY concept LATERAL, so the APPLY names are hidden and
      // `joinCrossLateral`/`joinLeftLateral` are shown instead. `joinLateral` is a THIRD, different
      // join (it takes its own ON condition) and stays present under its own name.
      'joinCrossApply',
      'joinOuterApply',
    },
    aliases: {
      'joinCrossLateral': 'joinCrossApply',
      'joinLeftLateral': 'joinOuterApply',
    },
  ),

  // SQLite — the narrowest. No stored procedures/functions, no row locking, no LATERAL/APPLY, no
  // grouping extensions, no JSON containment, no index/OPTION hints, no WITH TIES, no MERGE/TOP,
  // no DISTINCT ON.
  'sqlite': DialectViewPolicy(
    absent: {
      'callProcedure',
      'callProcedureWithOwner',
      'callFunction',
      'callFunctionWithOwner',
      'clearCall',
      'procParam',
      'procParams',
      'procParamNamed',
      'procParamInOut',
      'procParamOut',
      'procParamRaw',
      'forUpdate',
      'forUpdateNowait',
      'forUpdateSkipLocked',
      'forShare',
      'forShareNowait',
      'forShareSkipLocked',
      'clearRowLock',
      'fromLateral',
      'joinLateral',
      'joinCrossApply',
      'joinOuterApply',
      'groupByRollup',
      'groupByCube',
      'groupByGroupingSets',
      'whereJsonContains',
      'havingJsonContains',
      'hintUseIndex',
      'hintForceIndex',
      'hintMssqlOption',
      'limitWithTies',
      'clearLimitWithTies',
      'merge',
      'top',
      'clearTop',
      'distinctOn',
      'clearDistinctOn',
      // Engine-native renames belonging to other dialects: SQLite keeps `onConflict*` and already
      // lacks row locking, so it never had `forUpdate*`.
      'updlock',
      'updlockNowait',
      // Same as Postgres above: the pre-rename spelling, carried verbatim from TS's
      // AbsentOnSqlite so the literal surface-parity comparison matches.
      'updlockReadpast',
      'insertIgnore',
      'onDuplicateKeyUpdate',
      'onDuplicateKeyUpdateRaw',
      // No LATERAL at all, so the Postgres/MySQL spellings are hidden alongside the APPLY names.
      'joinCrossLateral',
      'joinLeftLateral',
    },
  ),
};

/// The view interface name for a dialect key, e.g. `mssql` -> `MssqlQueryBuilder`.
String viewClassName(String dialect) =>
    '${dialect[0].toUpperCase()}${dialect.substring(1)}QueryBuilder';

/// Every alias SURFACE name across all dialects — excluded from auto-discovery so an alias is never
/// sprayed onto a view it does not belong to; each is emitted only on its home dialect.
Set<String> allAliasSurfaceNames() =>
    {for (final p in viewManifest.values) ...p.aliases.keys};
