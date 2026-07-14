import type { Dialect } from '../configuration/configuration';
import { DatabaseType } from '../enums/database-type';
import { MultiBuilderTransactionState } from '../enums/multi-builder-transaction-state';
import { ParserArea } from '../enums/parser-area';
import { ParserMode } from '../enums/parser-mode';
import { QueryType } from '../enums/query-type';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';
import type { QueryState } from '../state/query';
import { defaultCte } from './default-cte';
import { defaultDelete } from './default-delete';
import { defaultFrom } from './default-from';
import { defaultGroupBy } from './default-group-by';
import { defaultHaving } from './default-having';
import { defaultInsert } from './default-insert';
import { defaultJoin } from './default-join';
import { defaultLimitOffset } from './default-limit-offset';
import { defaultOrderBy } from './default-order-by';
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
  const sqlHelper = new SqlHelper(config, mode);

  if (state === null || state === undefined) {
    throw new ParserError(ParserArea.General, 'No state provided');
  }

  if (state.cteStates.length > 0) {
    const cte = defaultCte(state, config, mode);
    sqlHelper.addSqlSnippetWithValues(cte.getSql(), cte.getValues());
  }

  if (state.queryType === QueryType.Insert) {
    const insert = defaultInsert(state, config, mode);
    sqlHelper.addSqlSnippetWithValues(insert.getSql(), insert.getValues());
    if (!state.isInnerStatement) {
      sqlHelper.addSqlSnippet(';');
    }
    return sqlHelper;
  }

  if (state.queryType === QueryType.Update) {
    const update = defaultUpdate(state, config, mode);
    sqlHelper.addSqlSnippetWithValues(update.getSql(), update.getValues());

    if (state.whereStates.length > 0) {
      const where = defaultWhere(state, config, mode);
      sqlHelper.addSqlSnippet(' ');
      sqlHelper.addSqlSnippetWithValues(where.getSql(), where.getValues());
    }

    if (!state.isInnerStatement) {
      sqlHelper.addSqlSnippet(';');
    }
    return sqlHelper;
  }

  if (state.queryType === QueryType.Delete) {
    const del = defaultDelete(state, config, mode);
    sqlHelper.addSqlSnippetWithValues(del.getSql(), del.getValues());

    if (state.whereStates.length > 0) {
      const where = defaultWhere(state, config, mode);
      sqlHelper.addSqlSnippet(' ');
      sqlHelper.addSqlSnippetWithValues(where.getSql(), where.getValues());
    }

    if (!state.isInnerStatement) {
      sqlHelper.addSqlSnippet(';');
    }
    return sqlHelper;
  }

  const sel = defaultSelect(state, config, mode, options);
  sqlHelper.addSqlSnippetWithValues(sel.getSql(), sel.getValues());

  const from = defaultFrom(state, config, mode);
  sqlHelper.addSqlSnippet(' ');
  sqlHelper.addSqlSnippetWithValues(from.getSql(), from.getValues());

  if (state.joinStates.length > 0) {
    const join = defaultJoin(state, config, mode);
    sqlHelper.addSqlSnippet(' ');
    sqlHelper.addSqlSnippetWithValues(join.getSql(), join.getValues());
  }

  if (state.whereStates.length > 0) {
    const where = defaultWhere(state, config, mode);
    sqlHelper.addSqlSnippet(' ');
    sqlHelper.addSqlSnippetWithValues(where.getSql(), where.getValues());
  }

  if (state.groupByStates.length > 0) {
    const groupBy = defaultGroupBy(state, config, mode);
    sqlHelper.addSqlSnippet(' ');
    sqlHelper.addSqlSnippetWithValues(groupBy.getSql(), groupBy.getValues());
  }

  if (state.havingStates.length > 0) {
    const having = defaultHaving(state, config, mode);
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

  if (state.limit > 0 || state.offset > 0) {
    const limitOffset = defaultLimitOffset(state, config, mode);

    sqlHelper.addSqlSnippet(' ');
    sqlHelper.addSqlSnippetWithValues(limitOffset.getSql(), limitOffset.getValues());
  }

  if (!state.isInnerStatement) {
    sqlHelper.addSqlSnippet(';');
  }

  return sqlHelper;
};

/**
 * MSSQL prepends a `TOP` to the SELECT list — an explicit `.top(n)` when set, otherwise a
 * safety-net `TOP (maxRowsReturned)` on an unbounded outer query (no WHERE, no LIMIT, not a
 * subquery). Other dialects need no hook.
 */
const toSqlOptionsFor = (config: Dialect): ToSqlOptions => {
  if (config.databaseType !== DatabaseType.Mssql) {
    return {};
  }

  return {
    beforeSelectColumns: (state: QueryState, cfg: Dialect, sqlHelper: SqlHelper) => {
      if (
        state.customState !== null &&
        state.customState !== undefined &&
        state.customState['top'] !== null &&
        state.customState['top'] !== undefined &&
        state.customState['top'] > 0
      ) {
        sqlHelper.addSqlSnippet('TOP ');
        sqlHelper.addSqlSnippet(`(${state.customState['top']})`);
        sqlHelper.addSqlSnippet(' ');
      } else if (
        !state.isInnerStatement &&
        state.limit === 0 &&
        (!state.whereStates || state.whereStates.length === 0)
      ) {
        sqlHelper.addSqlSnippet('TOP ');
        sqlHelper.addSqlSnippet(`(${cfg.runtimeConfiguration.maxRowsReturned})`);
        sqlHelper.addSqlSnippet(' ');
      }
    },
  };
};

/** A parameter value as a T-SQL literal for the sp_executesql value list. */
const mssqlParameterValue = (value: any): string => {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  switch (typeof value) {
    case 'number':
      return value.toString();
    case 'boolean':
      return value ? '1' : '0';
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
  switch (typeof value) {
    case 'string':
      return 'nvarchar(max)';
    case 'number':
      if (Number.isInteger(value)) {
        if (value >= -128 && value <= 127) {
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
  const paramsString = new SqlHelper(config, ParserMode.Prepared);
  const finalString = new SqlHelper(config, ParserMode.Prepared);

  const sqlHelper = defaultToSql(state, config, ParserMode.Prepared, toSqlOptionsFor(config));

  let sql = sqlHelper.getSql();
  sql = sql.replaceAll("'", "''");

  // No length cap: sp_executesql declares @statement/@params as nvarchar(max) (2 GB), so the old
  // 4000-char guard was spurious — and it measured post-escape, inflating the count on quote-heavy
  // SQL and falsely rejecting valid statements.

  let valueCounter = 0;

  for (const value of sqlHelper.getValues()) {
    const valuePosition = sql.indexOf(config.preparedStatementPlaceholder);

    if (valuePosition === -1) {
      break;
    }

    sql = sql.slice(0, valuePosition) + '@p' + valueCounter + sql.slice(valuePosition + 1);

    if (valueCounter > 0) {
      paramsString.addSqlSnippet(', ');
    }

    paramsString.addSqlSnippet('@p' + valueCounter + ' ' + mssqlParameterType(value));

    valueCounter++;
  }

  finalString.addSqlSnippet('SET NOCOUNT ON; ');
  finalString.addSqlSnippet("exec sp_executesql N'");
  finalString.addSqlSnippet(sql);
  finalString.addSqlSnippet("', N'");
  finalString.addSqlSnippet(paramsString.getSql());
  finalString.addSqlSnippet("'");

  // Only append the parameter-value list when there are parameters; otherwise a trailing
  // `', ;` is malformed sp_executesql syntax and SQL Server rejects the whole statement.
  const values = sqlHelper.getValues();
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
 * Postgres uses numbered `$n` placeholders. Render with the shared `?` placeholder, then
 * walk left-to-right replacing each `?` with `$1`, `$2`, … in order.
 */
const postgresPrepared = (state: QueryState, config: Dialect): PreparedSql => {
  const sqlHelper = defaultToSql(state, config, ParserMode.Prepared);

  let sql = sqlHelper.getSql();
  const placeholder = config.preparedStatementPlaceholder;
  let paramIndex = 1;
  let searchFrom = 0;

  while (true) {
    const pos = sql.indexOf(placeholder, searchFrom);
    if (pos === -1) break;

    const replacement = '$' + paramIndex;
    sql = sql.slice(0, pos) + replacement + sql.slice(pos + placeholder.length);
    searchFrom = pos + replacement.length;
    paramIndex++;
  }

  return { sql, params: sqlHelper.getValues() };
};

/**
 * Renders one query state as a prepared SQL string. MSSQL returns a self-contained
 * `sp_executesql`; Postgres rewrites `?`→`$n`; the rest keep the dialect's `?` placeholder.
 */
export const parse = (state: QueryState, config: Dialect): string => {
  if (config.databaseType === DatabaseType.Mssql) {
    return mssqlToSql(state, config);
  }
  if (config.databaseType === DatabaseType.Postgres) {
    return postgresPrepared(state, config).sql;
  }
  return defaultToSql(state, config, ParserMode.Prepared).getSql();
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
  const sqlHelper = defaultToSql(state, config, ParserMode.Prepared);
  return { sql: sqlHelper.getSql(), params: sqlHelper.getValues() };
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
    sql += config.transactionDelimiters.end + '; ';
  }

  return sql;
};
