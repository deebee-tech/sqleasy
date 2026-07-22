import type { Dialect } from '../configuration/configuration';
import { DatabaseType } from '../enums/database-type';
import { NullsOrder } from '../enums/nulls-order';
import type { ParserArea } from '../enums/parser-area';
import type { OrderByDirection } from '../enums/order-by-direction';
import { qualifiedColumn } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import type { SqlHelper } from '../helpers/sql';
import { emitOrderByTerm } from './default-order-by';

/**
 * Ordered string aggregation, in three grammars behind two engine-native names.
 *
 * The names split because the engines do not agree on the word: `string_agg` on Postgres, SQLite
 * and MSSQL; `GROUP_CONCAT` on MySQL and SQLite. Under the honest-capability rule each dialect is
 * offered only the name(s) it actually has — `selectStringAgg` is hidden on MySQL, `selectGroupConcat`
 * on Postgres/MSSQL — and this emitter is the belt-and-suspenders backstop for the prepared paths.
 *
 * ── THE THREE GRAMMARS (measured against the harness, 2026-07-22) ──
 *
 *     Postgres  string_agg(x, sep ORDER BY y)      separator MANDATORY; ORDER BY inside the parens,
 *                                                  NO comma before it
 *     SQLite    group_concat(x[, sep] ORDER BY y)  separator OPTIONAL (default ','); DISTINCT allows
 *                                                  only one argument, so no custom separator with it
 *     MySQL     GROUP_CONCAT(x ORDER BY y          SEPARATOR is a KEYWORD clause, never a 2nd arg;
 *                            SEPARATOR sep)         ORDER BY must come BEFORE it
 *     MSSQL     STRING_AGG(x, sep)                 separator MANDATORY; ordering lives OUTSIDE the
 *               WITHIN GROUP (ORDER BY y)          parens, in WITHIN GROUP; NO DISTINCT at all
 *
 * An integer ORDER BY ordinal is never emitted: it is a no-op constant on Postgres/SQLite and a
 * positional argument reference on MySQL, so it silently means the wrong thing. Callers pass a
 * column; the term carries its own direction.
 */

export type StringAggState = {
  functionName: 'string_agg' | 'group_concat';
  separator?: unknown;
  hasSeparator: boolean;
  distinct: boolean;
  orderBy: { tableNameOrAlias: string; columnName: string; direction: OrderByDirection }[];
};

const emitOrderKeys = (
  sqlHelper: SqlHelper,
  config: Dialect,
  keys: StringAggState['orderBy'],
): void => {
  keys.forEach((key, i) => {
    emitOrderByTerm(
      sqlHelper,
      config,
      key.tableNameOrAlias,
      key.columnName,
      key.direction,
      NullsOrder.None,
    );
    if (i < keys.length - 1) sqlHelper.addSqlSnippet(', ');
  });
};

export const emitStringAggregation = (
  sqlHelper: SqlHelper,
  config: Dialect,
  expr: { tableNameOrAlias: string; columnName: string },
  state: StringAggState,
  area: ParserArea,
): void => {
  const column = qualifiedColumn(
    expr.tableNameOrAlias,
    expr.columnName,
    config.identifierDelimiters,
  );
  const db = config.databaseType;

  if (state.functionName === 'string_agg') {
    if (db === DatabaseType.Mysql) {
      throw new ParserError(
        area,
        'MySQL has no string_agg — use groupConcat, its engine-native name',
      );
    }
    if (!state.hasSeparator) {
      throw new ParserError(
        area,
        `${db === DatabaseType.Mssql ? 'MSSQL' : 'Postgres'} string_agg requires a separator — ` +
          'there is no one-argument form. Pass the separator you want between values.',
      );
    }

    if (db === DatabaseType.Mssql) {
      // T-SQL: STRING_AGG(x, sep) WITHIN GROUP (ORDER BY …). No DISTINCT in this family on MSSQL.
      if (state.distinct) {
        throw new ParserError(
          area,
          'MSSQL STRING_AGG has no DISTINCT — it is the only engine of the four without it here. ' +
            'De-duplicate in a subquery first, or use a different engine for this query.',
        );
      }
      sqlHelper.addSqlSnippet('STRING_AGG(');
      sqlHelper.addSqlSnippet(column);
      sqlHelper.addSqlSnippet(', ');
      sqlHelper.addDynamicValue(state.separator);
      sqlHelper.addSqlSnippet(')');
      if (state.orderBy.length > 0) {
        sqlHelper.addSqlSnippet(' WITHIN GROUP (ORDER BY ');
        emitOrderKeys(sqlHelper, config, state.orderBy);
        sqlHelper.addSqlSnippet(')');
      }
      return;
    }

    // Postgres and SQLite: string_agg(x, sep ORDER BY …) — ordering inside the parens.
    sqlHelper.addSqlSnippet('string_agg(');
    if (state.distinct) sqlHelper.addSqlSnippet('DISTINCT ');
    sqlHelper.addSqlSnippet(column);
    sqlHelper.addSqlSnippet(', ');
    sqlHelper.addDynamicValue(state.separator);
    if (state.orderBy.length > 0) {
      // Postgres with DISTINCT can only order by the aggregated expression itself (measured). Emit
      // it, but refuse a key that would make the engine reject the whole statement.
      if (db === DatabaseType.Postgres && state.distinct) {
        const bad = state.orderBy.find(
          (k) => k.tableNameOrAlias !== expr.tableNameOrAlias || k.columnName !== expr.columnName,
        );
        if (bad !== undefined || state.orderBy.length > 1) {
          throw new ParserError(
            area,
            'Postgres string_agg(DISTINCT …) can only ORDER BY the aggregated expression itself — ' +
              'a different sort key is rejected by the engine. Drop DISTINCT, or sort by the same column.',
          );
        }
      }
      sqlHelper.addSqlSnippet(' ORDER BY ');
      emitOrderKeys(sqlHelper, config, state.orderBy);
    }
    sqlHelper.addSqlSnippet(')');
    return;
  }

  // group_concat
  if (db === DatabaseType.Postgres || db === DatabaseType.Mssql) {
    throw new ParserError(
      area,
      `${db === DatabaseType.Postgres ? 'Postgres' : 'MSSQL'} has no GROUP_CONCAT — use stringAgg, ` +
        'its engine-native name.',
    );
  }

  if (db === DatabaseType.Mysql) {
    // MySQL: GROUP_CONCAT(x ORDER BY … SEPARATOR sep) — ORDER BY before SEPARATOR, separator a keyword.
    sqlHelper.addSqlSnippet('GROUP_CONCAT(');
    if (state.distinct) sqlHelper.addSqlSnippet('DISTINCT ');
    sqlHelper.addSqlSnippet(column);
    if (state.orderBy.length > 0) {
      sqlHelper.addSqlSnippet(' ORDER BY ');
      emitOrderKeys(sqlHelper, config, state.orderBy);
    }
    if (state.hasSeparator) {
      sqlHelper.addSqlSnippet(' SEPARATOR ');
      sqlHelper.addDynamicValue(state.separator);
    }
    sqlHelper.addSqlSnippet(')');
    return;
  }

  // SQLite: group_concat(x[, sep] ORDER BY …). DISTINCT permits only one argument.
  if (state.distinct && state.hasSeparator) {
    throw new ParserError(
      area,
      'SQLite group_concat(DISTINCT …) takes only one argument, so it cannot carry a custom ' +
        "separator — the result uses the default ','. Drop the separator, or drop DISTINCT.",
    );
  }
  sqlHelper.addSqlSnippet('group_concat(');
  if (state.distinct) sqlHelper.addSqlSnippet('DISTINCT ');
  sqlHelper.addSqlSnippet(column);
  if (state.hasSeparator) {
    sqlHelper.addSqlSnippet(', ');
    sqlHelper.addDynamicValue(state.separator);
  }
  if (state.orderBy.length > 0) {
    sqlHelper.addSqlSnippet(' ORDER BY ');
    emitOrderKeys(sqlHelper, config, state.orderBy);
  }
  sqlHelper.addSqlSnippet(')');
};
