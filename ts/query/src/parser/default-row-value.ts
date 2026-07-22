import type { Dialect } from '../configuration/configuration';
import { DatabaseType } from '../enums/database-type';
import type { ParserArea } from '../enums/parser-area';
import { WhereOperator } from '../enums/where-operator';
import { qualifiedColumn } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import type { SqlHelper } from '../helpers/sql';
import type { WhereState } from '../state/where';

/**
 * Row-value comparison: `(a, b) > (?, ?)` and `(a, b) IN ((?,?), (?,?))`.
 *
 * The keyset-pagination predicate and the composite-key lookup. `(created_at, id) < (?, ?)` is the
 * only formulation of a keyset page that stays correct across ties and lets the engine use the
 * composite index that satisfies the ORDER BY — its absence is why deep pagination otherwise falls
 * back to OFFSET.
 *
 * ── WHERE IT WORKS (measured against the harness, 2026-07-22) ──
 *
 *     (a, b) > (?, ?)            Postgres  MySQL  SQLite 3.15+   accepted
 *     (a, b) IN ((?,?), (?,?))   Postgres  MySQL  SQLite         accepted
 *     (a, b) = (?, ?)            Postgres  MySQL  SQLite         accepted
 *     any of the above                                MSSQL      Msg — no row constructor
 *
 * T-SQL has no row constructor in a comparison in any version, and the OR-chain rewrite
 * (`a > ? OR (a = ? AND b > ?)`) is exactly the emulation this library refuses to synthesize: it
 * changes the plan, the parameter count, and the NULL semantics. So MSSQL refuses and says why.
 */

const MSSQL_REFUSAL =
  'MSSQL has no row-value constructor in a comparison — `(a, b) > (?, ?)` and `(a, b) IN (…)` are ' +
  'not T-SQL in any version. The equivalent OR-chain (a > ? OR (a = ? AND b > ?)) is an emulation ' +
  'this library will not synthesize for you: it changes the query plan and the NULL handling. ' +
  'Write that predicate yourself with whereRaw/whereGroup if you need it on SQL Server.';

const emitTuple = (
  sqlHelper: SqlHelper,
  config: Dialect,
  columns: { tableNameOrAlias: string; columnName: string }[],
): void => {
  sqlHelper.addSqlSnippet('(');
  columns.forEach((c, i) => {
    sqlHelper.addSqlSnippet(
      qualifiedColumn(c.tableNameOrAlias, c.columnName, config.identifierDelimiters),
    );
    if (i < columns.length - 1) sqlHelper.addSqlSnippet(', ');
  });
  sqlHelper.addSqlSnippet(')');
};

/** `(a, b) <op> (?, ?)` — one tuple on each side. `values` is the single right-hand tuple. */
export const emitRowValueComparison = (
  sqlHelper: SqlHelper,
  config: Dialect,
  cur: WhereState,
  area: ParserArea,
): void => {
  if (config.databaseType === DatabaseType.Mssql) {
    throw new ParserError(area, MSSQL_REFUSAL);
  }

  const columns = cur.rowColumns ?? [];
  const rhs = (cur.values[0] as unknown[]) ?? [];
  if (columns.length < 2) {
    throw new ParserError(area, 'A row-value comparison needs at least two columns');
  }
  if (rhs.length !== columns.length) {
    throw new ParserError(
      area,
      `A row-value comparison needs one value per column — got ${columns.length} columns and ${rhs.length} values`,
    );
  }

  emitTuple(sqlHelper, config, columns);
  sqlHelper.addSqlSnippet(` ${rowValueOperatorSql(cur.whereOperator, area)} `);
  sqlHelper.addSqlSnippet('(');
  rhs.forEach((value, i) => {
    sqlHelper.addDynamicValue(value);
    if (i < rhs.length - 1) sqlHelper.addSqlSnippet(', ');
  });
  sqlHelper.addSqlSnippet(')');
};

/** `(a, b) IN ((?,?), (?,?))`. `values` is the list of tuples. */
export const emitRowValueIn = (
  sqlHelper: SqlHelper,
  config: Dialect,
  cur: WhereState,
  area: ParserArea,
): void => {
  if (config.databaseType === DatabaseType.Mssql) {
    throw new ParserError(area, MSSQL_REFUSAL);
  }

  const columns = cur.rowColumns ?? [];
  const tuples = cur.values as unknown[][];
  if (columns.length < 2) {
    throw new ParserError(area, 'A row-value IN needs at least two columns');
  }
  if (tuples.length === 0) {
    throw new ParserError(area, 'A row-value IN needs at least one tuple');
  }
  for (const tuple of tuples) {
    if (!Array.isArray(tuple) || tuple.length !== columns.length) {
      throw new ParserError(
        area,
        `Every tuple in a row-value IN must have ${columns.length} values to match the columns`,
      );
    }
  }

  emitTuple(sqlHelper, config, columns);
  sqlHelper.addSqlSnippet(' IN (');
  tuples.forEach((tuple, ti) => {
    sqlHelper.addSqlSnippet('(');
    tuple.forEach((value, vi) => {
      sqlHelper.addDynamicValue(value);
      if (vi < tuple.length - 1) sqlHelper.addSqlSnippet(', ');
    });
    sqlHelper.addSqlSnippet(')');
    if (ti < tuples.length - 1) sqlHelper.addSqlSnippet(', ');
  });
  sqlHelper.addSqlSnippet(')');
};

/**
 * The SQL text for a row-value comparison operator. Only the ordered comparisons and equality make
 * sense on a tuple — LIKE, IS NULL, BETWEEN and friends do not compose with a row constructor.
 */
const rowValueOperatorSql = (op: WhereOperator, area: ParserArea): string => {
  switch (op) {
    case WhereOperator.Equals:
      return '=';
    case WhereOperator.NotEquals:
      return '<>';
    case WhereOperator.GreaterThan:
      return '>';
    case WhereOperator.GreaterThanOrEquals:
      return '>=';
    case WhereOperator.LessThan:
      return '<';
    case WhereOperator.LessThanOrEquals:
      return '<=';
    default:
      throw new ParserError(
        area,
        'A row-value comparison takes only =, <>, <, <=, > or >= — LIKE, IS NULL and BETWEEN have ' +
          'no meaning on a tuple. Use a single-column predicate for those.',
      );
  }
};
