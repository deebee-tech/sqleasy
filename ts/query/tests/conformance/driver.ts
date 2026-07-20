import {
  CallReturnIntent,
  FrameBoundType,
  FrameUnit,
  FullTextMode,
  JoinOperator,
  JoinType,
  JsonExtractMode,
  MssqlQuery,
  MultiBuilderTransactionState,
  MysqlQuery,
  NullsOrder,
  OrderByDirection,
  PostgresQuery,
  QueryBuilder,
  SqliteQuery,
  WhereOperator,
  source,
  target,
  value,
  raw,
  type JoinOnBuilder,
  type MergeBuilder,
  type MergeExpr,
  type MultiBuilder,
  type WindowBuilder,
} from '../../src';
import type {
  Case,
  Dialect,
  Expectation,
  InputValue,
  Op,
  OutputValue,
} from '@deebeetech/sqleasy-contract';

/**
 * Replays a corpus op-list through the TypeScript API.
 *
 * The Dart package ships the equivalent of this file against *its* API. Neither driver is allowed to
 * compute SQL itself — each only translates ops into builder calls — so any disagreement in the
 * output is a disagreement between the two implementations, which is exactly what we want to catch.
 */

const queryFor = (dialect: Dialect) => {
  switch (dialect) {
    case 'mssql':
      return new MssqlQuery();
    case 'mysql':
      return new MysqlQuery();
    case 'postgres':
      return new PostgresQuery();
    case 'sqlite':
      return new SqliteQuery();
  }
};

/**
 * Materializes a tagged corpus value as a JavaScript value.
 *
 * `int` and `double` both become a JS number — the language has only one. That collapse is precisely
 * why the corpus tags them: a Dart driver must NOT collapse them, and the golden SQL text records
 * what each one renders to.
 */
const toValue = (value: InputValue): unknown => {
  switch (value.t) {
    case 'null':
      return null;
    case 'string':
      return value.v;
    case 'int':
    case 'double':
      return value.v;
    case 'bool':
      return value.v;
    case 'datetime':
      return new Date(value.v);
  }
};

/** Encodes a bound parameter for comparison. See {@link OutputValue} on why numbers are one tag. */
export const encodeOutputValue = (value: unknown): OutputValue => {
  if (value === null || value === undefined) {
    return { t: 'null' };
  }
  if (value instanceof Date) {
    return { t: 'datetime', v: value.toISOString() };
  }
  switch (typeof value) {
    case 'string':
      return { t: 'string', v: value };
    case 'number':
      return { t: 'num', v: value };
    case 'boolean':
      return { t: 'bool', v: value };
    default:
      return { t: 'json', v: JSON.stringify(value) };
  }
};

const val = (op: Op, key = 'value'): unknown => toValue(op[key] as InputValue);
const str = (op: Op, key: string): string => op[key] as string;
/** The corpus models "no alias" / "no owner" as absent; the TS API spells that as `''`. */
const opt = (op: Op, key: string): string => (op[key] as string | undefined) ?? '';
const ops = (op: Op, key = 'ops'): Op[] => (op[key] as Op[]) ?? [];
const list = <T>(op: Op, key: string): T[] => (op[key] as T[]) ?? [];

const applyJoinOn = (b: JoinOnBuilder, onOps: Op[]): void => {
  for (const op of onOps) {
    switch (op.op) {
      case 'on':
        b.on(
          str(op, 'leftAlias'),
          str(op, 'leftColumn'),
          op.operator as JoinOperator,
          str(op, 'rightAlias'),
          str(op, 'rightColumn'),
        );
        break;
      case 'onValue':
        b.onValue(str(op, 'alias'), str(op, 'column'), op.operator as JoinOperator, val(op));
        break;
      case 'onRaw':
        b.onRaw(str(op, 'sql'));
        break;
      case 'onIn':
        b.onIn(str(op, 'alias'), str(op, 'column'), list<InputValue>(op, 'values').map(toValue));
        break;
      case 'onNotIn':
        b.onNotIn(str(op, 'alias'), str(op, 'column'), list<InputValue>(op, 'values').map(toValue));
        break;
      case 'onBetween':
        b.onBetween(str(op, 'alias'), str(op, 'column'), val(op, 'from'), val(op, 'to'));
        break;
      case 'onNotBetween':
        b.onNotBetween(str(op, 'alias'), str(op, 'column'), val(op, 'from'), val(op, 'to'));
        break;
      case 'onGroup':
        b.onGroup((sub) => applyJoinOn(sub, ops(op)));
        break;
      case 'and':
        b.and();
        break;
      case 'or':
        b.or();
        break;
      default:
        throw new Error(`conformance driver: unknown join-on op "${op.op}"`);
    }
  }
};

const applyWindow = (w: WindowBuilder, windowOps: Op[]): void => {
  for (const op of windowOps) {
    switch (op.op) {
      case 'partitionByColumn':
        w.partitionByColumn(str(op, 'table'), str(op, 'column'));
        break;
      case 'partitionByRaw':
        w.partitionByRaw(str(op, 'sql'));
        break;
      case 'orderByColumn':
        w.orderByColumn(
          str(op, 'table'),
          str(op, 'column'),
          (op.direction as OrderByDirection | undefined) ?? OrderByDirection.None,
          (op.nulls as NullsOrder | undefined) ?? NullsOrder.None,
        );
        break;
      case 'orderByRaw':
        w.orderByRaw(str(op, 'sql'));
        break;
      case 'frame':
        w.frame(
          op.unit as FrameUnit,
          op.startType as FrameBoundType,
          op.startOffset as number | undefined,
          op.endType as FrameBoundType | undefined,
          op.endOffset as number | undefined,
        );
        break;
      case 'frameRaw':
        w.frameRaw(str(op, 'sql'));
        break;
      default:
        throw new Error(`conformance driver: unknown window op "${op.op}"`);
    }
  }
};

/** Decode a corpus-encoded MERGE RHS expression back into a {@link MergeExpr}. */
const mergeExpr = (o: {
  kind: string;
  column?: string;
  value?: InputValue;
  sql?: string;
}): MergeExpr => {
  switch (o.kind) {
    case 'source':
      return source(o.column as string);
    case 'target':
      return target(o.column as string);
    case 'value':
      return value(toValue(o.value as InputValue));
    case 'raw':
      return raw(o.sql as string);
    default:
      throw new Error(`unknown merge expr kind: ${o.kind}`);
  }
};

type MergeAssignmentOp = {
  column: string;
  expr: { kind: string; column?: string; value?: InputValue; sql?: string };
};
const mergeAssignments = (op: Op): { columnName: string; value: MergeExpr }[] =>
  list<MergeAssignmentOp>(op, 'assignments').map((a) => ({
    columnName: a.column,
    value: mergeExpr(a.expr),
  }));
const andArg = (op: Op): ((j: JoinOnBuilder) => void) | undefined =>
  op.and ? (j) => applyJoinOn(j, ops(op, 'and')) : undefined;

const applyMerge = (m: MergeBuilder, mergeOps: Op[]): void => {
  for (const op of mergeOps) {
    switch (op.op) {
      case 'into':
        m.into(str(op, 'table'), opt(op, 'alias') || 'target');
        break;
      case 'intoWithOwner':
        m.intoWithOwner(str(op, 'owner'), str(op, 'table'), opt(op, 'alias') || 'target');
        break;
      case 'holdlock':
        m.holdlock(op.on === undefined ? true : (op.on as boolean));
        break;
      case 'usingValues':
        m.usingValues(
          str(op, 'alias'),
          list<string>(op, 'columns'),
          list<InputValue[]>(op, 'rows').map((row) => row.map(toValue)),
        );
        break;
      case 'usingTable':
        m.usingTable(str(op, 'table'), str(op, 'alias'), op.owner as string | undefined);
        break;
      case 'usingSelect':
        m.usingSelect(str(op, 'alias'), (q) => apply(q, ops(op)));
        break;
      case 'usingRaw':
        m.usingRaw(str(op, 'sql'), str(op, 'alias'));
        break;
      case 'on':
        m.on((j) => applyJoinOn(j, ops(op)));
        break;
      case 'whenMatchedThenUpdate':
        m.whenMatchedThenUpdate(mergeAssignments(op), andArg(op));
        break;
      case 'whenMatchedThenUpdateRaw':
        m.whenMatchedThenUpdateRaw(str(op, 'raw'), andArg(op));
        break;
      case 'whenMatchedThenDelete':
        m.whenMatchedThenDelete(andArg(op));
        break;
      case 'whenNotMatchedThenInsert':
        m.whenNotMatchedThenInsert(
          list<string>(op, 'columns'),
          list<{ kind: string }>(op, 'values').map(mergeExpr),
          andArg(op),
        );
        break;
      case 'whenNotMatchedThenInsertDefaultValues':
        m.whenNotMatchedThenInsertDefaultValues(andArg(op));
        break;
      case 'whenNotMatchedBySourceThenUpdate':
        m.whenNotMatchedBySourceThenUpdate(mergeAssignments(op), andArg(op));
        break;
      case 'whenNotMatchedBySourceThenDelete':
        m.whenNotMatchedBySourceThenDelete(andArg(op));
        break;
      case 'outputRaw':
        m.outputRaw(str(op, 'sql'));
        break;
      default:
        throw new Error(`unknown merge op: ${op.op}`);
    }
  }
};

const apply = (b: QueryBuilder, opList: Op[]): void => {
  for (const op of opList) {
    switch (op.op) {
      // ---- MERGE ----
      case 'merge':
        b.merge((m) => applyMerge(m, ops(op)));
        break;
      // ---- SELECT ----
      case 'selectAll':
        b.selectAll();
        break;
      case 'selectColumn':
        b.selectColumn(str(op, 'table'), str(op, 'column'), opt(op, 'alias'));
        break;
      case 'selectColumns':
        b.selectColumns(
          list<{ table: string; column: string; alias?: string }>(op, 'columns').map((c) => ({
            tableNameOrAlias: c.table,
            columnName: c.column,
            columnAlias: c.alias ?? '',
          })),
        );
        break;
      case 'selectRaw':
        b.selectRaw(str(op, 'sql'));
        break;
      case 'selectRaws':
        b.selectRaws(list<string>(op, 'sqls'));
        break;
      case 'selectWithBuilder':
        b.selectWithBuilder(str(op, 'alias'), (sub) => apply(sub, ops(op)));
        break;
      case 'selectWindow':
        b.selectWindow(str(op, 'fn'), (w) => applyWindow(w, ops(op, 'over')), opt(op, 'alias'));
        break;
      case 'selectJsonExtract':
        b.selectJsonExtract(
          str(op, 'table'),
          str(op, 'column'),
          str(op, 'path'),
          (op.mode as JsonExtractMode | undefined) ?? JsonExtractMode.Text,
          opt(op, 'alias'),
        );
        break;
      case 'distinct':
        b.distinct();
        break;
      case 'distinctOn':
        b.distinctOn(
          list<{ table: string; column: string }>(op, 'columns').map((c) => ({
            tableNameOrAlias: c.table,
            columnName: c.column,
          })),
        );
        break;

      // ---- FROM ----
      case 'fromTable':
        b.fromTable(str(op, 'table'), str(op, 'alias'));
        break;
      case 'fromTableWithOwner':
        b.fromTableWithOwner(str(op, 'owner'), str(op, 'table'), str(op, 'alias'));
        break;
      case 'fromTables':
        b.fromTables(
          list<{ table: string; alias: string }>(op, 'tables').map((t) => ({
            tableName: t.table,
            alias: t.alias,
          })),
        );
        break;
      case 'fromRaw':
        b.fromRaw(str(op, 'sql'));
        break;
      case 'fromRaws':
        b.fromRaws(list<string>(op, 'sqls'));
        break;
      case 'fromWithBuilder':
        b.fromWithBuilder(str(op, 'alias'), (sub) => apply(sub, ops(op)));
        break;
      case 'fromLateral':
        b.fromLateral(str(op, 'alias'), (sub) => apply(sub, ops(op)));
        break;
      case 'fromTableFunction':
        b.fromTableFunction(
          str(op, 'name'),
          str(op, 'alias'),
          list<InputValue>(op, 'params').map(toValue),
        );
        break;
      case 'fromTableFunctionWithOwner':
        b.fromTableFunctionWithOwner(
          str(op, 'owner'),
          str(op, 'name'),
          str(op, 'alias'),
          list<InputValue>(op, 'params').map(toValue),
        );
        break;
      case 'fromFunctionRaw':
        b.fromFunctionRaw(str(op, 'sql'), str(op, 'alias'));
        break;

      // ---- JOIN ----
      case 'joinTable':
        b.joinTable(op.joinType as JoinType, str(op, 'table'), str(op, 'alias'), (j) =>
          applyJoinOn(j, ops(op, 'on')),
        );
        break;
      case 'joinTableWithOwner':
        b.joinTableWithOwner(
          op.joinType as JoinType,
          str(op, 'owner'),
          str(op, 'table'),
          str(op, 'alias'),
          (j) => applyJoinOn(j, ops(op, 'on')),
        );
        break;
      case 'joinWithBuilder':
        b.joinWithBuilder(
          op.joinType as JoinType,
          str(op, 'alias'),
          (sub) => apply(sub, ops(op)),
          (j) => applyJoinOn(j, ops(op, 'on')),
        );
        break;
      case 'joinRaw':
        b.joinRaw(str(op, 'sql'));
        break;
      case 'joinCrossApply':
        b.joinCrossApply(
          str(op, 'alias'),
          (sub) => apply(sub, ops(op)),
          op.on ? (j) => applyJoinOn(j, ops(op, 'on')) : undefined,
        );
        break;
      case 'joinOuterApply':
        b.joinOuterApply(
          str(op, 'alias'),
          (sub) => apply(sub, ops(op)),
          op.on ? (j) => applyJoinOn(j, ops(op, 'on')) : undefined,
        );
        break;
      case 'joinLateral':
        b.joinLateral(
          str(op, 'alias'),
          (sub) => apply(sub, ops(op)),
          (j) => applyJoinOn(j, ops(op, 'on')),
        );
        break;

      // ---- WHERE ----
      case 'where':
        b.where(str(op, 'table'), str(op, 'column'), op.operator as WhereOperator, val(op));
        break;
      case 'whereBetween':
        b.whereBetween(str(op, 'table'), str(op, 'column'), val(op, 'from'), val(op, 'to'));
        break;
      case 'whereInValues':
        b.whereInValues(
          str(op, 'table'),
          str(op, 'column'),
          list<InputValue>(op, 'values').map(toValue),
        );
        break;
      case 'whereNotInValues':
        b.whereNotInValues(
          str(op, 'table'),
          str(op, 'column'),
          list<InputValue>(op, 'values').map(toValue),
        );
        break;
      case 'whereNull':
        b.whereNull(str(op, 'table'), str(op, 'column'));
        break;
      case 'whereNotNull':
        b.whereNotNull(str(op, 'table'), str(op, 'column'));
        break;
      case 'whereRaw':
        b.whereRaw(str(op, 'sql'));
        break;
      case 'whereGroup':
        b.whereGroup((sub) => apply(sub, ops(op)));
        break;
      case 'whereInWithBuilder':
        b.whereInWithBuilder(str(op, 'table'), str(op, 'column'), (sub) => apply(sub, ops(op)));
        break;
      case 'whereNotInWithBuilder':
        b.whereNotInWithBuilder(str(op, 'table'), str(op, 'column'), (sub) => apply(sub, ops(op)));
        break;
      case 'whereExistsWithBuilder':
        b.whereExistsWithBuilder(str(op, 'table'), str(op, 'column'), (sub) => apply(sub, ops(op)));
        break;
      case 'whereNotExistsWithBuilder':
        b.whereNotExistsWithBuilder(str(op, 'table'), str(op, 'column'), (sub) =>
          apply(sub, ops(op)),
        );
        break;
      case 'whereExists':
        b.whereExists((sub) => apply(sub, ops(op)));
        break;
      case 'whereNotExists':
        b.whereNotExists((sub) => apply(sub, ops(op)));
        break;
      case 'whereJsonExtract':
        b.whereJsonExtract(
          str(op, 'table'),
          str(op, 'column'),
          str(op, 'path'),
          op.mode as JsonExtractMode,
          op.operator as WhereOperator,
          val(op),
        );
        break;
      case 'whereJsonContains':
        b.whereJsonContains(str(op, 'table'), str(op, 'column'), val(op));
        break;
      case 'whereMatch':
        b.whereMatch(
          list<{ table: string; column: string }>(op, 'columns').map((c) => ({
            tableNameOrAlias: c.table,
            columnName: c.column,
          })),
          str(op, 'query'),
          (op.mode as FullTextMode | undefined) ?? FullTextMode.Natural,
        );
        break;
      case 'whereMatchRaw':
        b.whereMatchRaw(str(op, 'sql'));
        break;
      case 'and':
        b.and();
        break;
      case 'or':
        b.or();
        break;

      // ---- GROUP BY / HAVING ----
      case 'groupByColumn':
        b.groupByColumn(str(op, 'table'), str(op, 'column'));
        break;
      case 'groupByRaw':
        b.groupByRaw(str(op, 'sql'));
        break;
      case 'groupByRollup':
        b.groupByRollup(
          list<{ table: string; column: string }>(op, 'columns').map((c) => ({
            tableNameOrAlias: c.table,
            columnName: c.column,
          })),
        );
        break;
      case 'groupByCube':
        b.groupByCube(
          list<{ table: string; column: string }>(op, 'columns').map((c) => ({
            tableNameOrAlias: c.table,
            columnName: c.column,
          })),
        );
        break;
      case 'groupByGroupingSets':
        b.groupByGroupingSets(
          list<{ sets: { table: string; column: string }[] }>(op, 'sets').map((entry) =>
            entry.sets.map((c) => ({
              tableNameOrAlias: c.table,
              columnName: c.column,
            })),
          ),
        );
        break;
      case 'having':
        b.having(str(op, 'table'), str(op, 'column'), op.operator as WhereOperator, val(op));
        break;
      case 'havingRaw':
        b.havingRaw(str(op, 'sql'));
        break;
      case 'havingBetween':
        b.havingBetween(str(op, 'table'), str(op, 'column'), val(op, 'from'), val(op, 'to'));
        break;
      case 'havingInValues':
        b.havingInValues(
          str(op, 'table'),
          str(op, 'column'),
          list<InputValue>(op, 'values').map(toValue),
        );
        break;
      case 'havingNotInValues':
        b.havingNotInValues(
          str(op, 'table'),
          str(op, 'column'),
          list<InputValue>(op, 'values').map(toValue),
        );
        break;
      case 'havingNull':
        b.havingNull(str(op, 'table'), str(op, 'column'));
        break;
      case 'havingNotNull':
        b.havingNotNull(str(op, 'table'), str(op, 'column'));
        break;
      case 'havingGroup':
        b.havingGroup((sub) => apply(sub, ops(op)));
        break;
      case 'havingInWithBuilder':
        b.havingInWithBuilder(str(op, 'table'), str(op, 'column'), (sub) => apply(sub, ops(op)));
        break;
      case 'havingNotInWithBuilder':
        b.havingNotInWithBuilder(str(op, 'table'), str(op, 'column'), (sub) => apply(sub, ops(op)));
        break;
      case 'havingExists':
        b.havingExists((sub) => apply(sub, ops(op)));
        break;
      case 'havingNotExists':
        b.havingNotExists((sub) => apply(sub, ops(op)));
        break;
      case 'havingJsonExtract':
        b.havingJsonExtract(
          str(op, 'table'),
          str(op, 'column'),
          str(op, 'path'),
          op.mode as JsonExtractMode,
          op.operator as WhereOperator,
          val(op),
        );
        break;
      case 'havingJsonContains':
        b.havingJsonContains(str(op, 'table'), str(op, 'column'), val(op));
        break;
      case 'havingMatch':
        b.havingMatch(
          list<{ table: string; column: string }>(op, 'columns').map((c) => ({
            tableNameOrAlias: c.table,
            columnName: c.column,
          })),
          str(op, 'query'),
          (op.mode as FullTextMode | undefined) ?? FullTextMode.Natural,
        );
        break;

      // ---- ORDER BY / LIMIT ----
      case 'orderByColumn':
        b.orderByColumn(
          str(op, 'table'),
          str(op, 'column'),
          (op.direction as OrderByDirection | undefined) ?? OrderByDirection.None,
          (op.nulls as NullsOrder | undefined) ?? NullsOrder.None,
        );
        break;
      case 'orderByRaw':
        b.orderByRaw(str(op, 'sql'));
        break;
      case 'limit':
        b.limit(op.n as number);
        break;
      case 'limitWithTies':
        b.limitWithTies(op.n as number);
        break;
      case 'offset':
        b.offset(op.n as number);
        break;
      case 'top':
        b.top(op.n as number);
        break;
      case 'forUpdate':
        b.forUpdate();
        break;
      case 'forUpdateNowait':
        b.forUpdateNowait();
        break;
      case 'forUpdateSkipLocked':
        b.forUpdateSkipLocked();
        break;
      case 'forShare':
        b.forShare();
        break;
      case 'forShareNowait':
        b.forShareNowait();
        break;
      case 'forShareSkipLocked':
        b.forShareSkipLocked();
        break;

      // ---- INSERT / UPDATE / DELETE ----
      case 'insertInto':
        b.insertInto(str(op, 'table'));
        break;
      case 'insertIntoWithOwner':
        b.insertIntoWithOwner(str(op, 'owner'), str(op, 'table'));
        break;
      case 'insertColumns':
        b.insertColumns(list<string>(op, 'columns'));
        break;
      case 'insertValues':
        b.insertValues(list<InputValue>(op, 'values').map(toValue));
        break;
      case 'insertRaw':
        b.insertRaw(str(op, 'sql'));
        break;
      case 'insertSelect':
        b.insertSelect((sub) => apply(sub, ops(op)));
        break;
      case 'onConflictDoNothing':
        b.onConflictDoNothing(list<string>(op, 'conflictColumns'));
        break;
      case 'onConflictDoUpdate':
        b.onConflictDoUpdate(
          list<string>(op, 'conflictColumns'),
          list<{ column: string; value: InputValue }>(op, 'updates').map((u) => ({
            columnName: u.column,
            value: toValue(u.value),
          })),
        );
        break;
      case 'onConflictDoUpdateRaw':
        b.onConflictDoUpdateRaw(list<string>(op, 'conflictColumns'), str(op, 'sql'));
        break;
      case 'updateTable':
        b.updateTable(str(op, 'table'), str(op, 'alias'));
        break;
      case 'updateTableWithOwner':
        b.updateTableWithOwner(str(op, 'owner'), str(op, 'table'), str(op, 'alias'));
        break;
      case 'set':
        b.set(str(op, 'column'), val(op));
        break;
      case 'setRaw':
        b.setRaw(str(op, 'sql'));
        break;
      case 'deleteFrom':
        b.deleteFrom(str(op, 'table'), str(op, 'alias'));
        break;
      case 'deleteFromWithOwner':
        b.deleteFromWithOwner(str(op, 'owner'), str(op, 'table'), str(op, 'alias'));
        break;
      case 'returning':
        b.returning(list<string>(op, 'columns'));
        break;
      case 'returningRaw':
        b.returningRaw(str(op, 'sql'));
        break;

      // ---- SET OPERATIONS / CTE ----
      case 'union':
        b.union((sub) => apply(sub, ops(op)));
        break;
      case 'unionAll':
        b.unionAll((sub) => apply(sub, ops(op)));
        break;
      case 'intersect':
        b.intersect((sub) => apply(sub, ops(op)));
        break;
      case 'except':
        b.except((sub) => apply(sub, ops(op)));
        break;
      case 'cte':
        b.cte(str(op, 'name'), (sub) => apply(sub, ops(op)), list<string>(op, 'columns'));
        break;
      case 'cteRecursive':
        b.cteRecursive(str(op, 'name'), (sub) => apply(sub, ops(op)), list<string>(op, 'columns'));
        break;
      case 'cteRaw':
        b.cteRaw(str(op, 'name'), str(op, 'sql'));
        break;

      // ---- CALL (stored procedures / functions) ----
      case 'callProcedure':
        b.callProcedure(str(op, 'name'));
        break;
      case 'callProcedureWithOwner':
        b.callProcedureWithOwner(str(op, 'owner'), str(op, 'name'));
        break;
      case 'callFunction':
        b.callFunction(str(op, 'name'), op.returnIntent as CallReturnIntent | undefined);
        break;
      case 'callFunctionWithOwner':
        b.callFunctionWithOwner(
          str(op, 'owner'),
          str(op, 'name'),
          op.returnIntent as CallReturnIntent | undefined,
        );
        break;
      case 'procParam':
        b.procParam(val(op));
        break;
      case 'procParams':
        b.procParams(list<InputValue>(op, 'values').map(toValue));
        break;
      case 'procParamNamed':
        b.procParamNamed(str(op, 'name'), val(op));
        break;
      case 'procParamRaw':
        b.procParamRaw(str(op, 'sql'));
        break;
      case 'procParamOut':
        b.procParamOut(str(op, 'name'), op.sqlType as string | undefined);
        break;
      case 'procParamInOut':
        b.procParamInOut(str(op, 'name'), val(op), op.sqlType as string | undefined);
        break;
      case 'clearCall':
        b.clearCall();
        break;

      case 'hintUseIndex':
        b.hintUseIndex(str(op, 'table'), str(op, 'index'));
        break;
      case 'hintForceIndex':
        b.hintForceIndex(str(op, 'table'), str(op, 'index'));
        break;
      case 'hintMssqlOption':
        b.hintMssqlOption(str(op, 'option'));
        break;
      case 'hintRaw':
        b.hintRaw(str(op, 'sql'));
        break;
      case 'clearHints':
        b.clearHints();
        break;

      default:
        throw new Error(`conformance driver: unknown op "${op.op}"`);
    }
  }
};

/** Runs one case against one dialect and returns what the implementation actually produced. */
export const runCase = (testCase: Case, dialect: Dialect): Expectation => {
  const query = queryFor(dialect);

  try {
    if (testCase.builders) {
      const multi: MultiBuilder = query.newMultiBuilder();
      if (testCase.transaction === 'off') {
        multi.setTransactionState(MultiBuilderTransactionState.TransactionOff);
      }
      for (const spec of testCase.builders) {
        apply(multi.addBuilder(spec.name), spec.ops);
      }
      // MultiBuilder has no `parsePrepared` — it batches statements, and MSSQL inlines its values —
      // so the batch contract is the SQL string alone. Bound params are covered by single-statement
      // cases, which is where a driver would ever see them.
      return { prepared: { sql: multi.parse(), params: [] }, raw: multi.parseRaw() };
    }

    // The replay must be able to call ANY builder method for ANY dialect — including ones a dialect
    // refuses — because that is how the {throws} goldens are minted. So it uses the WIDE runtime
    // surface, not the narrow per-engine view a facade now hands back.
    const builder = query.newBuilder() as unknown as QueryBuilder;
    apply(builder, testCase.ops ?? []);

    const { sql, params } = builder.parsePrepared();
    return {
      prepared: { sql, params: params.map(encodeOutputValue) },
      raw: builder.parseRaw(),
    };
  } catch (error) {
    return { throws: (error as Error).message };
  }
};
