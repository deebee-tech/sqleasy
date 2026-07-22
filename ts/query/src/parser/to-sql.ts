import type { Dialect } from '../configuration/configuration';
import { DatabaseType } from '../enums/database-type';
import { MultiBuilderTransactionState } from '../enums/multi-builder-transaction-state';
import { ParserArea } from '../enums/parser-area';
import { ParserMode } from '../enums/parser-mode';
import { QueryType } from '../enums/query-type';
import { ParserError } from '../helpers/parser-error';
import { dialectDisplayName } from '../helpers/dialect-name';
import { renderPlaceholders, SqlHelper } from '../helpers/sql';
import type { QueryState } from '../state/query';
import { defaultCall } from './default-call';
import { defaultCte } from './default-cte';
import { defaultDelete } from './default-delete';
import {
  assertInsertMergeRowCapSupported,
  assertMutationRowCapSupported,
  emitMutationRowCap,
} from './default-mutation-row-cap';
import { defaultFrom } from './default-from';
import { defaultGroupBy } from './default-group-by';
import { defaultHaving } from './default-having';
import { emitTrailingHints, validateHints } from './default-hint';
import { defaultInsert } from './default-insert';
import { defaultMerge } from './default-merge';
import { defaultJoin } from './default-join';
import { defaultLimitOffset, hasExplicitTop } from './default-limit-offset';
import { buildPostgresMutationJoinPredicate } from './default-mutation-join';
import { defaultOrderBy } from './default-order-by';
import { emitTrailingReturningClause } from './default-returning';
import { emitTrailingRowLockClause } from './default-row-lock';
import { defaultSelect } from './default-select';
import { defaultUnion } from './default-union';
import { defaultUpdate } from './default-update';
import { defaultWhere } from './default-where';

/**
 * A prepared statement and the ordered values bound to its placeholders — ready to hand
 * straight to a driver as `query(sql, params)`. For dialects that inline values into a
 * self-contained statement (e.g. MSSQL's `sp_executesql`), `params` is empty.
 */
export type PreparedSql = {
  sql: string;
  params: unknown[];
};

/** Hooks the dialect can inject into the shared clause walk (e.g. MSSQL's `TOP`). */
export type ToSqlOptions = {
  beforeSelectColumns?: (state: QueryState, config: Dialect, sqlHelper: SqlHelper) => void;
  /**
   * Every CTE name declared by this statement AND by each statement enclosing it.
   *
   * A CTE is visible to the whole statement, including its subqueries — so deciding whether a FROM
   * target names a CTE cannot be answered from the state currently being parsed. Each child builder
   * gets a FRESH state whose `cteStates` is empty, so an outer-declared name was invisible one level
   * down and the dialect's default owner got stamped on it. Threading the accumulated set is what
   * makes the answer the same at every depth.
   */
  declaredCteNames?: ReadonlySet<string>;
};

/**
 * Adds this statement's own CTE names to the set inherited from its enclosing statements.
 *
 * Returns the SAME options object when the statement declares nothing, so the common case
 * allocates nothing and the identity of `options` is preserved for every other consumer.
 */
const withDeclaredCteNames = (
  options: ToSqlOptions | undefined,
  state: QueryState,
): ToSqlOptions | undefined => {
  if (state.cteStates.length === 0) return options;

  const names = new Set(options?.declaredCteNames ?? []);
  for (const cte of state.cteStates) {
    names.add(cte.name);
  }
  return { ...options, declaredCteNames: names };
};

/**
 * Emits the ` WHERE ...` clause for a join-backed UPDATE/DELETE. For MySQL/MSSQL the join's ON
 * conditions were already emitted inline as real `JOIN ... ON` syntax by `defaultUpdate`/
 * `defaultDelete`, so this is just the caller's own `.where(...)` predicates, unchanged. For
 * Postgres, the join's ON conditions cannot live in `FROM`/`USING` — see
 * `default-mutation-join.ts` — so they are translated into a `WHERE` predicate here and ANDed
 * in front of the caller's own predicates.
 */
const emitMutationWhere = (
  sqlHelper: SqlHelper,
  state: QueryState,
  config: Dialect,
  mode: ParserMode,
  options?: ToSqlOptions,
): void => {
  const joinPredicate =
    state.joinStates.length > 0 && config.databaseType === DatabaseType.Postgres
      ? buildPostgresMutationJoinPredicate(config, state, mode)
      : undefined;

  if (!joinPredicate || joinPredicate.getSql() === '') {
    if (state.whereStates.length > 0) {
      const where = defaultWhere(state, config, mode, options);
      sqlHelper.addSqlSnippet(' ');
      sqlHelper.addSqlSnippetWithValues(where.getSql(), where.getValues());
    }
    return;
  }

  sqlHelper.addSqlSnippet(' WHERE ');
  sqlHelper.addSqlSnippetWithValues(joinPredicate.getSql(), joinPredicate.getValues());

  if (state.whereStates.length > 0) {
    const where = defaultWhere(state, config, mode, options);
    let whereSql = where.getSql();
    if (whereSql.startsWith('WHERE ')) {
      whereSql = whereSql.slice('WHERE '.length);
    }
    sqlHelper.addSqlSnippet(' AND ');
    sqlHelper.addSqlSnippetWithValues(whereSql, where.getValues());
  }
};

/**
 * Renders a {@link QueryState} to SQL by walking its clauses in order. Pure and
 * dialect-driven: everything dialect-specific comes from {@link Dialect} `config`, except
 * the {@link ToSqlOptions} hooks the caller threads through (MSSQL's `TOP`). Used both for
 * the outer statement and, recursively, for every nested subquery.
 */
export const defaultToSql = (
  state: QueryState | undefined,
  config: Dialect,
  mode: ParserMode,
  options?: ToSqlOptions,
): SqlHelper => {
  const sqlHelper = new SqlHelper(mode);

  if (state === null || state === undefined) {
    throw new ParserError(ParserArea.General, 'No state provided');
  }

  // `TOP` is a T-SQL keyword and nothing else. Through 10.x `toSqlOptionsFor` returned `{}` for the
  // other three dialects, so `.top(5)` on Postgres/MySQL/SQLite emitted nothing at all and the row
  // cap the caller explicitly wrote vanished without a word — the very failure the docstring on
  // `toSqlOptionsFor` spends a paragraph refusing to commit in the other direction.
  //
  // A row cap IS reachable on all four dialects, but it is spelled `.limit(n)`. `.top(n)` is MSSQL's
  // own second construct, not a portable concept, and offering it where it cannot be honoured is
  // what this release removes. Guarded here rather than in the SELECT hook so it also fires for CTE
  // bodies, derived tables, and the prepared paths that pass no options at all.
  if (config.databaseType !== DatabaseType.Mssql && hasExplicitTop(state)) {
    throw new ParserError(
      ParserArea.LimitOffset,
      `${dialectDisplayName(config.databaseType)} has no TOP clause — use limit() instead`,
    );
  }

  // Every downstream parse — this statement's own clauses AND every child builder it contains — sees
  // the CTE names declared here plus those inherited from enclosing statements. Reassigning
  // `options` once is what guarantees no child path is missed: there is no second place to forget.
  options = withDeclaredCteNames(options, state);

  // Index hints (hintUseIndex/hintForceIndex) are a MySQL-only construct, and the capability check
  // must run for EVERY statement kind. It used to live only on the SELECT tail, so a hint set on a
  // non-MySQL INSERT/UPDATE/DELETE was SILENTLY DROPPED instead of refused — the exact silent-no-op
  // this library does not do. Validating here, before the queryType dispatch, closes that.
  validateHints(state, config, ParserArea.General);

  // A sub-builder is a SELECT. Building an INSERT/UPDATE/DELETE/CALL inside one of the child
  // callbacks used to inline that statement verbatim wherever the child goes — inside a derived
  // table's parentheses, after an INSERT's column list, inside MERGE's USING — producing a
  // statement no engine parses. Measured, isolating the POSITION:
  //
  //     PG     WITH c AS (DELETE FROM orders WHERE id=99 RETURNING id) SELECT id FROM c   legal
  //            WITH c AS (DELETE FROM orders WHERE id=99)              SELECT 1           legal
  //            SELECT * FROM (DELETE FROM orders WHERE id=99 RETURNING id) x    syntax error at "FROM"
  //     MySQL  WITH c AS (DELETE …) SELECT 1                                    ERROR 1064
  //     MSSQL  WITH c AS (DELETE …) SELECT 1                                    Msg 156
  //     SQLite WITH c AS (DELETE … RETURNING id) SELECT id FROM c        near "DELETE": syntax error
  //
  // So exactly one position on exactly one dialect allows it — a Postgres CTE body — and RETURNING
  // is NOT what makes it legal, which is why the check is on the position rather than the clause.
  if (state.isInnerStatement && state.queryType !== QueryType.Select) {
    const postgresDataModifyingCte =
      state.isCteBody === true && config.databaseType === DatabaseType.Postgres;

    if (!postgresDataModifyingCte) {
      throw new ParserError(
        ParserArea.General,
        `A sub-builder must be a SELECT — an INSERT, UPDATE, DELETE or CALL built inside a child ` +
          `callback would be spliced in wherever that child is inlined, which no engine parses. ` +
          `${
            config.databaseType === DatabaseType.Postgres
              ? 'Postgres allows a data-modifying CTE, so build it with cte() if that is what you meant.'
              : `${dialectDisplayName(config.databaseType)} has no data-modifying CTE either — run the mutation as its own statement.`
          }`,
      );
    }
  }

  // T-SQL forbids a BARE ORDER BY inside any subquery, derived table, CTE body or set-operation
  // operand — an ORDER BY there is only legal alongside a row cap, which is what gives the ordering
  // something to mean. Measured, with a working baseline and one variable at a time:
  //
  //                                            PG   MySQL  SQLite  MSSQL
  //     SELECT * FROM (SELECT id FROM o) x           OK    OK     OK      OK      <- baseline
  //     SELECT * FROM (SELECT … ORDER BY id) x       OK    OK     OK      Msg 1033
  //     WITH c AS (SELECT … ORDER BY id) SELECT …    OK    OK     OK      Msg 1033
  //     … WHERE id IN (SELECT … ORDER BY id)         OK    OK     OK      Msg 1033
  //     … WHERE EXISTS (SELECT … ORDER BY id)        OK    OK     OK      Msg 1033
  //     SELECT (SELECT … ORDER BY id LIMIT 1) AS k   OK    OK     OK      Msg 1033
  //
  // The other three take it in every position, so this is MSSQL's rule alone. `OFFSET 0 ROWS` alone
  // legalises it (measured), which is exactly why `offset(0)` had to stop being treated as unset.
  if (
    config.databaseType === DatabaseType.Mssql &&
    state.isInnerStatement &&
    state.orderByStates.length > 0 &&
    state.limit === 0 &&
    state.offset === undefined &&
    !hasExplicitTop(state)
  ) {
    throw new ParserError(
      ParserArea.OrderBy,
      'T-SQL rejects an ORDER BY inside a subquery, derived table, CTE body or set-operation ' +
        'operand unless it comes with a row cap (Msg 1033) — an ordering with nothing to cap ' +
        'has no meaning there. Add top(n), or offset(0) if you only want the ordering to be legal ' +
        'and are relying on it downstream.',
    );
  }

  // T-SQL allows WITH only at the START of a statement — never inside a subquery's parentheses, a
  // derived table, or another CTE's body. Measured, each position on its own and against a working
  // baseline, so the failure is attributable to the WITH and nothing else:
  //
  //                                            PG   MySQL  SQLite  MSSQL
  //     SELECT * FROM (WITH c AS (…) SELECT …) x    OK    OK     OK      Msg 156
  //     … WHERE id IN (WITH c AS (…) SELECT …)      OK    OK     OK      Msg 156
  //     WITH o AS (WITH i AS (…) SELECT …) SELECT   OK    OK     OK      Msg 156
  //
  // The other three take it in every position, so this is MSSQL's rule alone, not a shared one.
  if (
    config.databaseType === DatabaseType.Mssql &&
    state.isInnerStatement &&
    state.cteStates.length > 0
  ) {
    throw new ParserError(
      ParserArea.General,
      'T-SQL allows WITH only at the start of a statement, so a CTE cannot be declared on a ' +
        'subquery, a derived table, a set-operation branch or another CTE body. Declare it on the ' +
        'outermost builder — a T-SQL CTE is visible to the whole statement, including its ' +
        'subqueries.',
    );
  }

  if (state.cteStates.length > 0) {
    const cte = defaultCte(state, config, mode, options);
    sqlHelper.addSqlSnippetWithValues(cte.getSql(), cte.getValues());
  }

  if (state.rowLock && state.queryType !== QueryType.Select) {
    throw new ParserError(ParserArea.General, 'FOR UPDATE/FOR SHARE requires a SELECT query');
  }

  // A row lock cannot span a set operation, and the engines disagree about HOW it fails — which is
  // exactly what made this dangerous. Measured:
  //
  //   Postgres 17  SELECT … UNION ALL SELECT … FOR UPDATE
  //                  ERROR: FOR UPDATE is not allowed with UNION/INTERSECT/EXCEPT
  //   MySQL 8.4    same statement                    ACCEPTED — the trailing FOR UPDATE binds to
  //                                                  ONE operand, leaving the other's rows unlocked
  //   MSSQL 2022   emitted as a table hint, which lands on the FIRST operand only:
  //                  SELECT * FROM [t] WITH (UPDLOCK, ROWLOCK) UNION ALL SELECT * FROM [t]
  //
  // So one engine refuses loudly and two quietly lock a subset — a lock that covers half the rows
  // you asked for is worse than no lock, because the caller believes they hold it. SQLite already
  // refuses row locking outright, further down. Lock each operand's own statement instead, or lock
  // the base table before the union.
  if (state.rowLock && state.unionStates.length > 0) {
    throw new ParserError(
      ParserArea.General,
      'A row lock cannot cover a set operation — Postgres rejects it outright, and MySQL and MSSQL ' +
        'silently lock only one operand, leaving the rest of the rows you asked for unlocked. ' +
        'Lock the operands individually, or lock the base rows before combining them.',
    );
  }

  // On MySQL a trailing FOR UPDATE does not reach rows behind a DERIVED TABLE. Proven by a
  // two-session test with both controls, `innodb_lock_wait_timeout=3` / `lock_timeout=3s`:
  //
  //                                        MySQL 8.4     Postgres 17
  //     control — no lock holder           not blocked   not blocked
  //     holder: plain table FOR UPDATE     BLOCKED       BLOCKED
  //     holder: derived table FOR UPDATE   NOT BLOCKED   BLOCKED
  //
  // So the identical builder chain takes a real lock on Postgres and NO lock on MySQL, with no
  // error either way — the caller proceeds believing rows are held while another session updates
  // them underneath. Postgres keeps the capability; MySQL refuses rather than hand back a lock that
  // was never taken. (A first attempt at this measurement was invalid — a lock holder from the
  // previous probe was still sleeping in the background — which is why the controls are part of the record.)
  if (
    config.databaseType === DatabaseType.Mysql &&
    state.rowLock &&
    state.fromStates.some((from) => from.subquery !== undefined)
  ) {
    throw new ParserError(
      ParserArea.General,
      "MySQL's FOR UPDATE/FOR SHARE does not reach rows behind a derived table — they are read " +
        'completely unlocked, with no error, while Postgres locks them. Lock the base table in its ' +
        'own statement, or join the table directly instead of wrapping it in a subquery.',
    );
  }

  if (state.upsertState && state.queryType !== QueryType.Insert) {
    throw new ParserError(ParserArea.Insert, 'Upsert (ON CONFLICT) requires INSERT');
  }

  if (state.callState && state.queryType !== QueryType.Call) {
    throw new ParserError(ParserArea.Call, 'Procedure/function call state requires queryType Call');
  }

  if (state.queryType === QueryType.Merge) {
    // Before any SQL: a cap MERGE cannot express is refused, never dropped.
    assertInsertMergeRowCapSupported(state, config, ParserArea.Merge);

    // MERGE emits its own terminating semicolon (mandatory in T-SQL) and is never an inner
    // statement, so it returns straight from here.
    const merge = defaultMerge(state, config, mode, options);
    sqlHelper.addSqlSnippetWithValues(merge.getSql(), merge.getValues());
    return sqlHelper;
  }

  if (state.queryType === QueryType.Call) {
    if (state.cteStates.length > 0) {
      throw new ParserError(
        ParserArea.Call,
        'A CTE cannot be combined with a procedure/function call',
      );
    }

    if (state.returningState) {
      throw new ParserError(
        ParserArea.Call,
        'RETURNING/OUTPUT cannot be combined with a procedure/function call',
      );
    }

    const call = defaultCall(state, config, mode);
    sqlHelper.addSqlSnippetWithValues(call.getSql(), call.getValues());

    if (!state.isInnerStatement) {
      sqlHelper.addSqlSnippet(';');
    }
    return sqlHelper;
  }

  if (state.queryType === QueryType.Insert) {
    assertInsertMergeRowCapSupported(state, config, ParserArea.Insert);

    const insert = defaultInsert(state, config, mode, options);
    sqlHelper.addSqlSnippetWithValues(insert.getSql(), insert.getValues());

    // PG/SQLite's RETURNING is trailing; MSSQL's OUTPUT was already emitted inline by
    // `defaultInsert` (before VALUES), and MySQL has no equivalent (`defaultReturning` throws).
    if (state.returningState && config.databaseType !== DatabaseType.Mssql) {
      emitTrailingReturningClause(sqlHelper, config, state.returningState, ParserArea.Insert);
    }

    if (!state.isInnerStatement) {
      sqlHelper.addSqlSnippet(';');
    }
    return sqlHelper;
  }

  if (state.queryType === QueryType.Update) {
    // Before any SQL is produced: a row cap the engine cannot run is refused, never dropped.
    assertMutationRowCapSupported(state, config, ParserArea.Update);

    const update = defaultUpdate(state, config, mode, options);
    sqlHelper.addSqlSnippetWithValues(update.getSql(), update.getValues());

    emitMutationWhere(sqlHelper, state, config, mode, options);
    emitMutationRowCap(sqlHelper, state, config, mode);

    if (state.returningState && config.databaseType !== DatabaseType.Mssql) {
      emitTrailingReturningClause(sqlHelper, config, state.returningState, ParserArea.Update);
    }

    if (!state.isInnerStatement) {
      sqlHelper.addSqlSnippet(';');
    }
    return sqlHelper;
  }

  if (state.queryType === QueryType.Delete) {
    assertMutationRowCapSupported(state, config, ParserArea.Delete);

    const del = defaultDelete(state, config, mode, options);
    sqlHelper.addSqlSnippetWithValues(del.getSql(), del.getValues());

    emitMutationWhere(sqlHelper, state, config, mode, options);
    emitMutationRowCap(sqlHelper, state, config, mode);

    if (state.returningState && config.databaseType !== DatabaseType.Mssql) {
      emitTrailingReturningClause(sqlHelper, config, state.returningState, ParserArea.Delete);
    }

    if (!state.isInnerStatement) {
      sqlHelper.addSqlSnippet(';');
    }
    return sqlHelper;
  }

  if (state.returningState) {
    throw new ParserError(
      ParserArea.General,
      'RETURNING/OUTPUT requires INSERT, UPDATE, or DELETE',
    );
  }

  const sel = defaultSelect(state, config, mode, options);
  sqlHelper.addSqlSnippetWithValues(sel.getSql(), sel.getValues());

  const from = defaultFrom(state, config, mode, options);
  sqlHelper.addSqlSnippet(' ');
  sqlHelper.addSqlSnippetWithValues(from.getSql(), from.getValues());

  if (state.joinStates.length > 0) {
    const join = defaultJoin(state, config, mode, options);
    sqlHelper.addSqlSnippet(' ');
    sqlHelper.addSqlSnippetWithValues(join.getSql(), join.getValues());
  }

  if (state.whereStates.length > 0) {
    const where = defaultWhere(state, config, mode, options);
    sqlHelper.addSqlSnippet(' ');
    sqlHelper.addSqlSnippetWithValues(where.getSql(), where.getValues());
  }

  if (state.groupByStates.length > 0) {
    const groupBy = defaultGroupBy(state, config, mode);
    sqlHelper.addSqlSnippet(' ');
    sqlHelper.addSqlSnippetWithValues(groupBy.getSql(), groupBy.getValues());
  }

  if (state.havingStates.length > 0) {
    const having = defaultHaving(state, config, mode, options);
    sqlHelper.addSqlSnippet(' ');
    sqlHelper.addSqlSnippetWithValues(having.getSql(), having.getValues());
  }

  if (state.unionStates.length > 0) {
    const union = defaultUnion(state, config, mode, options);
    sqlHelper.addSqlSnippet(' ');
    sqlHelper.addSqlSnippetWithValues(union.getSql(), union.getValues());
  }

  if (state.orderByStates.length > 0) {
    const orderBy = defaultOrderBy(state, config, mode);
    sqlHelper.addSqlSnippet(' ');
    sqlHelper.addSqlSnippetWithValues(orderBy.getSql(), orderBy.getValues());
  }

  if (state.limit > 0 || state.offset !== undefined || state.limitWithTies) {
    const limitOffset = defaultLimitOffset(state, config, mode);

    // MSSQL's WITH TIES renders as a `TOP (n) WITH TIES` prefix on the SELECT list, so the trailing
    // clause is legitimately empty here — still call the parser for its guards, but do not emit the
    // separating space, or the statement ends `... ;` with a stray gap.
    const clause = limitOffset.getSql();
    if (clause !== '') {
      sqlHelper.addSqlSnippet(' ');
      sqlHelper.addSqlSnippetWithValues(clause, limitOffset.getValues());
    }
  }

  // Trailing `FOR UPDATE`/`FOR SHARE` (PG/MySQL). MSSQL's equivalent is a `WITH (...)` hint
  // already emitted on each FROM table by `defaultFrom`; SQLite has no row locking and throws.
  if (state.rowLock) {
    emitTrailingRowLockClause(sqlHelper, config, state.rowLock);
  }

  emitTrailingHints(sqlHelper, state, config);

  if (!state.isInnerStatement) {
    sqlHelper.addSqlSnippet(';');
  }

  return sqlHelper;
};

/**
 * MSSQL prepends a `TOP` to the SELECT list for an explicit `.top(n)`. Other dialects need no hook.
 *
 * There is deliberately no automatic cap here. SQLEasy emits the query it was asked for, however
 * unbounded — a row cap is the caller's policy, not the builder's, and one applied behind the
 * caller's back is a silent truncation they never wrote. `.top(n)` is the caller asking; it
 * conflicts with limit/offset outright, and `defaultLimitOffset` throws on that combination.
 */
const toSqlOptionsFor = (config: Dialect): ToSqlOptions => {
  if (config.databaseType !== DatabaseType.Mssql) {
    return {};
  }

  return {
    beforeSelectColumns: (state: QueryState, _cfg: Dialect, sqlHelper: SqlHelper) => {
      // Two distinct T-SQL constructs share this slot. `.top(n)` is the caller asking for TOP
      // directly; `.limitWithTies(n)` also renders here, because WITH TIES is only expressible on
      // TOP. They cannot both apply — `defaultLimitOffset` refuses TOP combined with limit/offset.
      // PRESENCE, not positivity — the same rule `hasExplicitTop` already documents. `TOP (0)` is
      // legal T-SQL and returns no rows (measured), so testing `> 0` here silently turned the
      // caller's "give me nothing" into "give me everything": an uncapped SELECT, no error. That
      // semantic inversion is worse than a dropped clause, because the statement still succeeds.
      if (hasExplicitTop(state)) {
        sqlHelper.addSqlSnippet(`TOP (${Number(state.customState!['top'])}) `);
        return;
      }

      if (state.limitWithTies && state.limit > 0) {
        sqlHelper.addSqlSnippet(`TOP (${state.limit}) WITH TIES `);
      }
    },
  };
};

/** A parameter value as a T-SQL literal for the sp_executesql value list. */
const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

const isBinaryValue = (value: unknown): value is Uint8Array => value instanceof Uint8Array;

const mssqlParameterValue = (value: any): string => {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  if (isBinaryValue(value)) {
    return '0x' + toHex(value);
  }

  switch (typeof value) {
    case 'number':
      if (!Number.isFinite(value)) {
        throw new ParserError(ParserArea.General, `value is not a finite number: ${value}`);
      }
      return value.toString();
    case 'boolean':
      return value ? '1' : '0';
    case 'bigint':
      return value.toString();
    case 'object':
      if (value instanceof Date) {
        return "'" + value.toISOString() + "'";
      }
      return "N'" + JSON.stringify(value).replaceAll("'", "''") + "'";
    default:
      return "N'" + String(value).replaceAll("'", "''") + "'";
  }
};

/** The T-SQL declared type for an sp_executesql `@pN` parameter, inferred from the value. */
const mssqlParameterType = (value: any): string => {
  if (isBinaryValue(value)) {
    return 'varbinary(max)';
  }

  switch (typeof value) {
    case 'string':
      return 'nvarchar(max)';
    case 'number':
      if (!Number.isFinite(value)) {
        throw new ParserError(ParserArea.General, `value is not a finite number: ${value}`);
      }
      // Only a SAFE integer is declared as an integral type. `Number.isInteger(1e21)` is true, but
      // it renders via `toString()` as `1e+21` — not a legal `bigint` literal, so SQL Server
      // rejected the batch. Anything past 2^53 is not exactly representable anyway; declare it
      // `float`, whose literal syntax does accept scientific notation.
      if (Number.isSafeInteger(value)) {
        // T-SQL `tinyint` is UNSIGNED 0–255. The old lower bound of -128 declared negatives as
        // `tinyint`, and SQL Server raised an arithmetic-overflow error on every one of them.
        if (value >= 0 && value <= 255) {
          return 'tinyint';
        } else if (value >= -32768 && value <= 32767) {
          return 'smallint';
        } else if (value >= -2147483648 && value <= 2147483647) {
          return 'int';
        } else {
          return 'bigint';
        }
      } else {
        return 'float';
      }
    case 'boolean':
      return 'bit';
    case 'bigint':
      return 'bigint';
    default:
      return 'nvarchar(max)';
  }
};

/**
 * Wraps the rendered statement in a self-contained `exec sp_executesql`: the SQL string
 * (with `''`-escaped quotes and `?`→`@pN`), the `@pN type` declaration list, and — only
 * when there are parameters — the `@pN = value` assignment list.
 */
const mssqlToSql = (state: QueryState, config: Dialect): string => {
  const paramsString = new SqlHelper(ParserMode.Prepared);
  const finalString = new SqlHelper(ParserMode.Prepared);

  const sqlHelper = defaultToSql(state, config, ParserMode.Prepared, toSqlOptionsFor(config));

  let sql = sqlHelper.getSql();
  sql = sql.replaceAll("'", "''");

  // No length cap: sp_executesql declares @statement/@params as nvarchar(max) (2 GB), so the old
  // 4000-char guard was spurious — and it measured post-escape, inflating the count on quote-heavy
  // SQL and falsely rejecting valid statements.

  const values = sqlHelper.getValues();

  // Substitute by token, never by scanning for a bare `?`. The old scan rewrote the first `?` it
  // found — which, for `selectRaw("'why?' AS q")`, was the one inside the caller's string literal,
  // corrupting it to `'why@p0'` and leaving the real placeholder dangling as `?`.
  sql = renderPlaceholders(sql, (index) => '@p' + index);

  values.forEach((value, index) => {
    if (index > 0) {
      paramsString.addSqlSnippet(', ');
    }

    paramsString.addSqlSnippet('@p' + index + ' ' + mssqlParameterType(value));
  });

  finalString.addSqlSnippet('SET NOCOUNT ON; ');
  finalString.addSqlSnippet("exec sp_executesql N'");
  finalString.addSqlSnippet(sql);
  finalString.addSqlSnippet("', N'");
  finalString.addSqlSnippet(paramsString.getSql());
  finalString.addSqlSnippet("'");

  // Only append the parameter-value list when there are parameters; otherwise a trailing
  // `', ;` is malformed sp_executesql syntax and SQL Server rejects the whole statement.
  if (values.length > 0) {
    finalString.addSqlSnippet(', ');
    for (let i = 0; i < values.length; i++) {
      if (i > 0) {
        finalString.addSqlSnippet(', ');
      }
      finalString.addSqlSnippet('@p' + i + ' = ' + mssqlParameterValue(values[i]));
    }
  }

  finalString.addSqlSnippet(';');

  return finalString.getSql();
};

/**
 * Postgres uses numbered `$n` placeholders: substitute the Nth token with `$1`, `$2`, … in order.
 *
 * This must not scan for a bare `$`. Doing so rewrote the `$` inside caller text — `selectRaw("'$100'")`
 * became `'$1100'` — and shifted the real placeholder to `$2` while only one value was bound, so
 * Postgres rejected the statement outright. `$` is especially common in Postgres (`$$`-quoting).
 */
const postgresPrepared = (state: QueryState, config: Dialect): PreparedSql => {
  const sqlHelper = defaultToSql(state, config, ParserMode.Prepared);

  // Use the dialect placeholder character as the `$n` prefix so the config field is not dead.
  const sql = renderPlaceholders(
    sqlHelper.getSql(),
    (index) => config.preparedStatementPlaceholder + (index + 1),
  );

  return { sql, params: sqlHelper.getValues() };
};

/**
 * The dialect's own placeholder, substituted for each {@link PLACEHOLDER_TOKEN}. MySQL and SQLite
 * bind positionally, so every placeholder is the same `?`.
 */
const positionalPrepared = (state: QueryState, config: Dialect): PreparedSql => {
  const sqlHelper = defaultToSql(state, config, ParserMode.Prepared);

  const sql = renderPlaceholders(sqlHelper.getSql(), () => config.preparedStatementPlaceholder);

  return { sql, params: sqlHelper.getValues() };
};

/**
 * Renders one query state as a prepared SQL string (placeholders, without a separate params
 * array). For Postgres/MySQL/SQLite this is **not** execution-safe on its own — use
 * {@link parsePrepared} to get `{ sql, params }`. For MSSQL, `parse` and `parsePrepared`
 * both return the same self-contained `sp_executesql` batch (values inlined; `params` empty).
 */
export const parse = (state: QueryState, config: Dialect): string => {
  if (config.databaseType === DatabaseType.Mssql) {
    return mssqlToSql(state, config);
  }
  if (config.databaseType === DatabaseType.Postgres) {
    return postgresPrepared(state, config).sql;
  }
  return positionalPrepared(state, config).sql;
};

/**
 * Renders one query state as prepared SQL plus its ordered bound values. MSSQL inlines its
 * values into the `sp_executesql` string, so its `params` is empty.
 */
export const parsePrepared = (state: QueryState, config: Dialect): PreparedSql => {
  if (config.databaseType === DatabaseType.Mssql) {
    return { sql: mssqlToSql(state, config), params: [] };
  }
  if (config.databaseType === DatabaseType.Postgres) {
    return postgresPrepared(state, config);
  }
  return positionalPrepared(state, config);
};

/**
 * Renders one query state as a raw SQL string with values inlined (MSSQL keeps its `TOP`). DEBUG /
 * TEST display only: values are inlined UNQUOTED + UNESCAPED (readable golden SQL for the parser
 * test suite), so the result is NOT execution-safe. To run a query, use `parsePrepared` (bound
 * params) — never execute `parseRaw`/`parse` output against a driver. See `SqlHelper.getSqlDebug`.
 */
export const parseRaw = (state: QueryState, config: Dialect): string => {
  const sqlHelper = defaultToSql(state, config, ParserMode.Raw, toSqlOptionsFor(config));
  return sqlHelper.getSqlDebug();
};

/**
 * Renders a batch of query states as a single prepared SQL string. Each statement is prepared
 * independently (so placeholder numbering restarts per statement, matching running them one by
 * one). When `transactionState` is {@link MultiBuilderTransactionState.TransactionOn}, the batch
 * is wrapped in the dialect's `transactionDelimiters`.
 */
export const parseMulti = (
  states: QueryState[],
  transactionState: MultiBuilderTransactionState,
  config: Dialect,
): string => {
  let sql = '';

  if (transactionState === MultiBuilderTransactionState.TransactionOn) {
    sql += config.transactionDelimiters.begin + '; ';
  }

  for (const state of states) {
    sql += parse(state, config);
  }

  if (transactionState === MultiBuilderTransactionState.TransactionOn) {
    sql += config.transactionDelimiters.end + ';';
  }

  return sql;
};

/**
 * Renders a batch of query states as a single raw SQL string with values inlined. DEBUG / TEST
 * display only — NOT execution-safe (see {@link parseRaw}). Wraps in the dialect's
 * `transactionDelimiters` when `transactionState` is
 * {@link MultiBuilderTransactionState.TransactionOn}.
 */
export const parseMultiRaw = (
  states: QueryState[],
  transactionState: MultiBuilderTransactionState,
  config: Dialect,
): string => {
  let sql = '';

  if (transactionState === MultiBuilderTransactionState.TransactionOn) {
    sql += config.transactionDelimiters.begin + '; ';
  }

  for (const state of states) {
    sql += parseRaw(state, config);
  }

  if (transactionState === MultiBuilderTransactionState.TransactionOn) {
    sql += config.transactionDelimiters.end + ';';
  }

  return sql;
};
