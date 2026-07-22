import type { Dialect } from '../configuration/configuration';
import { DatabaseType } from '../enums/database-type';
import { NullsOrder } from '../enums/nulls-order';
import type { OrderByDirection } from '../enums/order-by-direction';
import type { ParserArea } from '../enums/parser-area';
import { qualifiedColumn } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import type { SqlHelper } from '../helpers/sql';
import { emitOrderByTerm } from './default-order-by';

/**
 * JSON aggregation — rows folded into one JSON array or object, in a single SELECT-list column.
 *
 * The standard N+1 fix: return a parent and its children in one round trip. One capability per
 * shape (array, object), spelled per dialect. Unlike string aggregation the engines do not fight
 * over the WORD — a user wants "aggregate to a JSON array" and does not care that Postgres calls it
 * `json_agg` — so this is ONE method per shape, not an engine-native-name split.
 *
 * ── PER-DIALECT NAMES AND LIMITS (measured against the harness, 2026-07-22) ──
 *
 *     Postgres  json_agg / jsonb_agg / json_object_agg / jsonb_object_agg
 *               DISTINCT and inner ORDER BY both supported
 *     MySQL     JSON_ARRAYAGG / JSON_OBJECTAGG
 *               NEITHER DISTINCT nor ORDER BY — both are ERROR 1064; element order is unspecified
 *     SQLite    json_group_array / json_group_object
 *               DISTINCT and ORDER BY supported (array); DISTINCT is single-argument
 *     MSSQL     NONE. JSON_ARRAYAGG is "not a recognized built-in function name" on 2022 (it is
 *               Azure SQL / SQL Server 2025 only). `FOR JSON PATH` shapes the WHOLE result set into
 *               one document — a different construct, not a per-column aggregate — so it is NOT a
 *               substitute and is not emitted. The method is hidden on the MSSQL view; this is the
 *               backstop for the prepared paths.
 */

export type JsonAggState = {
  shape: 'array' | 'object';
  jsonb: boolean;
  distinct: boolean;
  keyTableNameOrAlias?: string;
  keyColumnName?: string;
  orderBy: { tableNameOrAlias: string; columnName: string; direction: OrderByDirection }[];
};

const FN: Partial<Record<DatabaseType, { array: string; object: string }>> = {
  [DatabaseType.Postgres]: { array: 'json_agg', object: 'json_object_agg' },
  [DatabaseType.Mysql]: { array: 'JSON_ARRAYAGG', object: 'JSON_OBJECTAGG' },
  [DatabaseType.Sqlite]: { array: 'json_group_array', object: 'json_group_object' },
};

export const emitJsonAggregation = (
  sqlHelper: SqlHelper,
  config: Dialect,
  valueExpr: { tableNameOrAlias: string; columnName: string },
  state: JsonAggState,
  area: ParserArea,
): void => {
  const db = config.databaseType;
  const names = FN[db];

  if (names === undefined) {
    throw new ParserError(
      area,
      'MSSQL has no JSON aggregate function — JSON_ARRAYAGG is Azure SQL / SQL Server 2025 only, ' +
        'and 2022 does not have it. FOR JSON PATH shapes the whole result set into one document, ' +
        'which is a different thing, so this library does not substitute it. Build the document ' +
        'yourself with a FOR JSON subquery via selectRaw if you need it on SQL Server 2022.',
    );
  }

  const value = qualifiedColumn(
    valueExpr.tableNameOrAlias,
    valueExpr.columnName,
    config.identifierDelimiters,
  );

  // MySQL's JSON aggregates take a bare argument list — no DISTINCT, no ORDER BY (both ERROR 1064).
  // Refused rather than dropped, because a silently unordered/duplicated array is a wrong answer.
  if (db === DatabaseType.Mysql) {
    if (state.distinct) {
      throw new ParserError(
        area,
        'MySQL JSON aggregation has no DISTINCT — de-duplicate in a subquery first, or aggregate ' +
          'on Postgres/SQLite which support it.',
      );
    }
    if (state.orderBy.length > 0) {
      throw new ParserError(
        area,
        'MySQL JSON aggregation has no inner ORDER BY — element order is unspecified. Order the ' +
          'rows in a subquery, or aggregate on Postgres/SQLite which support the inner ORDER BY.',
      );
    }
  }

  if (state.jsonb && db !== DatabaseType.Postgres) {
    throw new ParserError(
      area,
      'Only Postgres has a jsonb aggregate — jsonb is a Postgres storage type. Drop the jsonb ' +
        'option on this dialect; its json aggregate returns the same shape.',
    );
  }

  const fnName = state.jsonb
    ? state.shape === 'array'
      ? 'jsonb_agg'
      : 'jsonb_object_agg'
    : state.shape === 'array'
      ? names.array
      : names.object;

  sqlHelper.addSqlSnippet(fnName);
  sqlHelper.addSqlSnippet('(');
  if (state.distinct) sqlHelper.addSqlSnippet('DISTINCT ');

  if (state.shape === 'object') {
    // SQLite's json_group_object takes DISTINCT on... nothing sensible — measured it applies to the
    // single-argument array form only, so an object DISTINCT is refused above by never being set.
    sqlHelper.addSqlSnippet(
      qualifiedColumn(
        state.keyTableNameOrAlias ?? '',
        state.keyColumnName ?? '',
        config.identifierDelimiters,
      ),
    );
    sqlHelper.addSqlSnippet(', ');
  }

  sqlHelper.addSqlSnippet(value);

  if (state.orderBy.length > 0) {
    sqlHelper.addSqlSnippet(' ORDER BY ');
    state.orderBy.forEach((key, i) => {
      emitOrderByTerm(
        sqlHelper,
        config,
        key.tableNameOrAlias,
        key.columnName,
        key.direction,
        NullsOrder.None,
      );
      if (i < state.orderBy.length - 1) sqlHelper.addSqlSnippet(', ');
    });
  }

  sqlHelper.addSqlSnippet(')');
};
