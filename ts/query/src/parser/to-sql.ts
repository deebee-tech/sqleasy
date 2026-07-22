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
import { assertMutationRowCapSupported, emitMutationRowCap } from './default-mutation-row-cap';
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

  // Index hints (hintUseIndex/hintForceIndex) are a MySQL-only construct, and the capability check
  // must run for EVERY statement kind. It used to live only on the SELECT tail, so a hint set on a
  // non-MySQL INSERT/UPDATE/DELETE was SILENTLY DROPPED instead of refused — the exact silent-no-op
  // this library does not do. Validating here, before the queryType dispatch, closes that.
  validateHints(state, config, ParserArea.General);

  if (state.cteStates.length > 0) {
    const cte = defaultCte(state, config, mode, options);
    sqlHelper.addSqlSnippetWithValues(cte.getSql(), cte.getValues());
  }

  if (state.rowLock && state.queryType !== QueryType.Select) {
    throw new ParserError(ParserArea.General, 'FOR UPDATE/FOR SHARE requires a SELECT query');
  }

  if (state.upsertState && state.queryType !== QueryType.Insert) {
    throw new ParserError(ParserArea.Insert, 'Upsert (ON CONFLICT) requires INSERT');
  }

  if (state.callState && state.queryType !== QueryType.Call) {
    throw new ParserError(ParserArea.Call, 'Procedure/function call state requires queryType Call');
  }

  if (state.queryType === QueryType.Merge) {
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
