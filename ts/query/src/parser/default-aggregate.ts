import type { Dialect } from '../configuration/configuration';
import { AGGREGATE_STAR, AggregateFunction } from '../enums/aggregate-function';
import { DatabaseType } from '../enums/database-type';
import { ParserMode } from '../enums/parser-mode';
import type { ParserArea } from '../enums/parser-area';
import { qualifiedColumn } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import type { SqlHelper } from '../helpers/sql';
import type { QueryState } from '../state/query';
import { defaultWhere } from './default-where';

/**
 * The five aggregate calls, rendered.
 *
 * ── WHAT THIS IS, AND THE LINE IT DOES NOT CROSS ──
 * A CALL NODE: one function, one operand, an optional DISTINCT. Nothing nests inside it and nothing
 * composes with it. SQLEasy models clauses rather than expressions, and that stays true — `CASE`,
 * `CAST`, `COALESCE` and a general scalar-function surface remain out. What changed is only that
 * `COUNT(x)` turned out to be common enough that reaching it exclusively through `selectRaw` cost
 * more than the node does: `HAVING COUNT(*) > 5`, the canonical HAVING, was `havingRaw` only.
 *
 * ── WHY THERE IS NO DIALECT SPLIT HERE ──
 * All five are identical text on all four engines, including DISTINCT inside them. Measured:
 *
 *     COUNT(*) · COUNT(col) · COUNT(DISTINCT col) · SUM(DISTINCT col) · AVG/MIN/MAX
 *       Postgres 17, MySQL 8.4, SQLite 3.51, MSSQL 2022 — all accepted
 *     COUNT(DISTINCT *)
 *       rejected by all four (SQLite: `near "*": syntax error`)
 *
 * So this is one of the genuinely shared capabilities, and gets one shared spelling. The
 * engine-native-name rule applies where the engines differ, and here they do not.
 */

const SQL_NAME: Record<AggregateFunction, string> = {
  [AggregateFunction.Count]: 'COUNT',
  [AggregateFunction.Sum]: 'SUM',
  [AggregateFunction.Avg]: 'AVG',
  [AggregateFunction.Min]: 'MIN',
  [AggregateFunction.Max]: 'MAX',
};

/**
 * Renders `FN(`, `FN(DISTINCT `, the operand, and `)`.
 *
 * The star is emitted bare. Quoting it would produce `"*"`, which is a column literally named `*` —
 * a different query that happens to parse.
 */
/** The aggregate call fields, in whatever state carries them (SELECT list or HAVING). */
export type AggregateCall = {
  aggregate: AggregateFunction;
  tableNameOrAlias: string;
  columnName: string;
  distinct: boolean;
  filter?: QueryState;
};

export const emitAggregateCall = (
  sqlHelper: SqlHelper,
  config: Dialect,
  call: AggregateCall,
  mode: ParserMode,
  area: ParserArea,
): void => {
  const { aggregate, tableNameOrAlias, columnName, distinct, filter } = call;
  const isStar = columnName === AGGREGATE_STAR;

  // `SUM(*)` is not a syntax error — Postgres answers "function sum() does not exist", because `*`
  // makes it a zero-argument call. Only COUNT has a star form, so the refusal has to be ours and
  // has to name the alternative rather than silently counting something else.
  if (isStar && aggregate !== AggregateFunction.Count) {
    throw new ParserError(
      area,
      `${SQL_NAME[aggregate]}(*) is not a function any dialect has — only COUNT takes the star. ` +
        `Aggregate a column instead, or use count if you meant "how many rows".`,
    );
  }

  // Rejected by all four, and rightly: `*` is every column, so there is no value to compare for
  // distinctness. Refused rather than quietly dropping the DISTINCT.
  if (isStar && distinct) {
    throw new ParserError(
      area,
      'COUNT(DISTINCT *) is rejected by every dialect — `*` is not a value that can be compared ' +
        'for distinctness. Name the column whose distinct values you want to count.',
    );
  }

  if (!isStar && columnName === '') {
    throw new ParserError(area, `${SQL_NAME[aggregate]} requires a column, or '*' for count`);
  }

  sqlHelper.addSqlSnippet(SQL_NAME[aggregate]);
  sqlHelper.addSqlSnippet('(');
  if (distinct) {
    sqlHelper.addSqlSnippet('DISTINCT ');
  }
  sqlHelper.addSqlSnippet(
    isStar
      ? AGGREGATE_STAR
      : qualifiedColumn(tableNameOrAlias, columnName, config.identifierDelimiters),
  );
  sqlHelper.addSqlSnippet(')');

  if (filter !== undefined) {
    emitAggregateFilter(sqlHelper, config, filter, mode, area);
  }
};

/**
 * `FILTER (WHERE …)` on the aggregate just emitted.
 *
 * Postgres 9.4+ and SQLite 3.30+ only. MySQL and MSSQL have no FILTER clause — and this is where
 * the refusal MUST live, not with the engine: measured, `FILTER` is not a reserved word on either,
 * so `COUNT(*) FILTER` parses as `COUNT(*) AS FILTER` and the engine then faults on the `(WHERE …)`
 * — or worse, on a shape where it does not, silently yields a mis-aliased column. So a bad emission
 * is not a syntax error there; it is a wrong answer. Refusing before emitting is the only safe
 * option, and the message names conditional aggregation as what those engines use instead (without
 * emitting it — this library refuses rather than rewrites).
 *
 * The predicate is a real WHERE clause, captured on `filter.whereStates`, so it composes with
 * everything WHERE composes with. `defaultWhere` emits `WHERE …`; the leading keyword is stripped
 * because FILTER supplies its own.
 */
const emitAggregateFilter = (
  sqlHelper: SqlHelper,
  config: Dialect,
  filter: QueryState,
  mode: ParserMode,
  area: ParserArea,
): void => {
  if (config.databaseType === DatabaseType.Mysql || config.databaseType === DatabaseType.Mssql) {
    throw new ParserError(
      area,
      `${config.databaseType === DatabaseType.Mysql ? 'MySQL' : 'MSSQL'} has no FILTER clause on ` +
        'aggregates — and it cannot be emitted safely, because FILTER parses as a column alias ' +
        'there rather than erroring. Use conditional aggregation instead, e.g. ' +
        'COUNT(CASE WHEN <pred> THEN 1 END), which you can build with selectRaw.',
    );
  }

  if (filter.whereStates.length === 0) {
    throw new ParserError(area, 'FILTER requires a WHERE predicate');
  }

  const where = defaultWhere(filter, config, mode);
  let whereSql = where.getSql();
  // `defaultWhere` leads with `WHERE `; FILTER writes its own, so strip the duplicate.
  if (whereSql.startsWith('WHERE ')) {
    whereSql = whereSql.slice('WHERE '.length);
  }

  sqlHelper.addSqlSnippet(' FILTER (WHERE ');
  sqlHelper.addSqlSnippetWithValues(whereSql, where.getValues());
  sqlHelper.addSqlSnippet(')');
};
