import type { Dialect } from '../configuration/configuration';
import { DatabaseType } from '../enums/database-type';
import { ParserArea } from '../enums/parser-area';
import type { ParserMode } from '../enums/parser-mode';
import { dialectDisplayName } from '../helpers/dialect-name';
import { quoteIdentifier } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';
import type {
  MergeExpr,
  MergeState,
  MergeUsing,
  MergeWhenAction,
  MergeWhenState,
} from '../state/merge';
import type { QueryState } from '../state/query';
import { renderJoinOnConditions } from './default-join';
import { defaultToSql, type ToSqlOptions } from './to-sql';

const qi = (name: string | undefined, config: Dialect): string =>
  quoteIdentifier(name, config.identifierDelimiters);

/** `alias.column`, both quoted. */
const columnRef = (config: Dialect, alias: string, column: string): string =>
  qi(alias, config) + '.' + qi(column, config);

const usingAlias = (state: MergeState): string => (state.using ? state.using.alias : 'source');

/** Emit one MERGE RHS expression — a source/target column, a bound literal, or raw SQL. */
const emitExpr = (
  sqlHelper: SqlHelper,
  config: Dialect,
  state: MergeState,
  expr: MergeExpr,
): void => {
  switch (expr.kind) {
    case 'source':
      sqlHelper.addSqlSnippet(columnRef(config, usingAlias(state), expr.columnName));
      return;
    case 'target':
      sqlHelper.addSqlSnippet(columnRef(config, state.targetAlias, expr.columnName));
      return;
    case 'value':
      sqlHelper.addDynamicValue(expr.value);
      return;
    case 'raw':
      sqlHelper.addSqlSnippet(expr.sql);
      return;
  }
};

/** `AND <condition>` guard on a WHEN clause, via the shared join-on predicate machinery. */
const emitAnd = (sqlHelper: SqlHelper, config: Dialect, when: MergeWhenState): void => {
  if (!when.and || when.and.length === 0) {
    return;
  }
  sqlHelper.addSqlSnippet(' AND ');
  renderJoinOnConditions(sqlHelper, config, when.and);
};

const emitAction = (
  sqlHelper: SqlHelper,
  config: Dialect,
  state: MergeState,
  action: MergeWhenAction,
): void => {
  switch (action.kind) {
    case 'delete':
      sqlHelper.addSqlSnippet('DELETE');
      return;
    case 'update': {
      sqlHelper.addSqlSnippet('UPDATE SET ');
      if (action.raw !== undefined) {
        sqlHelper.addSqlSnippet(action.raw);
        return;
      }
      if (action.assignments.length === 0) {
        throw new ParserError(
          ParserArea.Merge,
          'MERGE UPDATE requires at least one SET assignment',
        );
      }
      action.assignments.forEach((assignment, i) => {
        sqlHelper.addSqlSnippet(qi(assignment.columnName, config));
        sqlHelper.addSqlSnippet(' = ');
        emitExpr(sqlHelper, config, state, assignment.value);
        if (i < action.assignments.length - 1) {
          sqlHelper.addSqlSnippet(', ');
        }
      });
      return;
    }
    case 'insert': {
      if (action.columns.length !== action.values.length) {
        throw new ParserError(
          ParserArea.Merge,
          'MERGE INSERT column count must equal the VALUES count',
        );
      }
      sqlHelper.addSqlSnippet('INSERT (');
      action.columns.forEach((column, i) => {
        sqlHelper.addSqlSnippet(qi(column, config));
        if (i < action.columns.length - 1) {
          sqlHelper.addSqlSnippet(', ');
        }
      });
      sqlHelper.addSqlSnippet(') VALUES (');
      action.values.forEach((expr, i) => {
        emitExpr(sqlHelper, config, state, expr);
        if (i < action.values.length - 1) {
          sqlHelper.addSqlSnippet(', ');
        }
      });
      sqlHelper.addSqlSnippet(')');
      return;
    }
    case 'insertDefaultValues':
      sqlHelper.addSqlSnippet('INSERT DEFAULT VALUES');
      return;
  }
};

const whenKeyword = (match: MergeWhenState['match']): string => {
  switch (match) {
    case 'matched':
      return 'WHEN MATCHED';
    case 'notMatchedByTarget':
      return 'WHEN NOT MATCHED BY TARGET';
    case 'notMatchedBySource':
      return 'WHEN NOT MATCHED BY SOURCE';
  }
};

const emitUsing = (
  sqlHelper: SqlHelper,
  config: Dialect,
  mode: ParserMode,
  using: MergeUsing,
  options?: ToSqlOptions,
): void => {
  sqlHelper.addSqlSnippet('USING ');
  switch (using.kind) {
    case 'values': {
      if (using.rows.length === 0) {
        throw new ParserError(ParserArea.Merge, 'MERGE USING (VALUES …) requires at least one row');
      }
      sqlHelper.addSqlSnippet('(VALUES ');
      using.rows.forEach((row, r) => {
        if (row.length !== using.columns.length) {
          throw new ParserError(
            ParserArea.Merge,
            'MERGE USING VALUES row width must equal the column count',
          );
        }
        sqlHelper.addSqlSnippet('(');
        row.forEach((cell, c) => {
          sqlHelper.addDynamicValue(cell);
          if (c < row.length - 1) {
            sqlHelper.addSqlSnippet(', ');
          }
        });
        sqlHelper.addSqlSnippet(')');
        if (r < using.rows.length - 1) {
          sqlHelper.addSqlSnippet(', ');
        }
      });
      sqlHelper.addSqlSnippet(') AS ');
      sqlHelper.addSqlSnippet(qi(using.alias, config));
      sqlHelper.addSqlSnippet(' (');
      using.columns.forEach((column, i) => {
        sqlHelper.addSqlSnippet(qi(column, config));
        if (i < using.columns.length - 1) {
          sqlHelper.addSqlSnippet(', ');
        }
      });
      sqlHelper.addSqlSnippet(')');
      return;
    }
    case 'table': {
      if (using.owner !== undefined && using.owner !== '') {
        sqlHelper.addSqlSnippet(qi(using.owner, config));
        sqlHelper.addSqlSnippet('.');
      }
      sqlHelper.addSqlSnippet(qi(using.table, config));
      sqlHelper.addSqlSnippet(' AS ');
      sqlHelper.addSqlSnippet(qi(using.alias, config));
      return;
    }
    case 'select': {
      const sub = defaultToSql(using.subquery as QueryState, config, mode, options);
      sqlHelper.addSqlSnippetWithValues('(' + sub.getSql() + ')', sub.getValues());
      sqlHelper.addSqlSnippet(' AS ');
      sqlHelper.addSqlSnippet(qi(using.alias, config));
      return;
    }
    case 'raw': {
      sqlHelper.addSqlSnippet(using.sql);
      sqlHelper.addSqlSnippet(' AS ');
      sqlHelper.addSqlSnippet(qi(using.alias, config));
      return;
    }
  }
};

const unconditionalCount = (whens: MergeWhenState[], match: MergeWhenState['match']): number =>
  whens.filter((w) => w.match === match && (!w.and || w.and.length === 0)).length;

/**
 * Validates the WHEN-clause cardinality T-SQL enforces, so a MERGE SQL Server would reject at
 * runtime (Msg 10714/10715) never leaves the builder — the same "don't emit unrunnable SQL" rule
 * the rest of the surface holds to.
 */
const validateWhenCardinality = (state: MergeState): void => {
  const whens = state.whenStates;
  if (whens.length === 0) {
    throw new ParserError(ParserArea.Merge, 'MERGE requires at least one WHEN clause');
  }

  const matched = whens.filter((w) => w.match === 'matched');
  if (matched.length > 2) {
    throw new ParserError(
      ParserArea.Merge,
      'MERGE allows at most two WHEN MATCHED clauses (one UPDATE and one DELETE)',
    );
  }
  if (matched.length === 2) {
    const kinds = new Set(matched.map((w) => w.action.kind));
    if (!(kinds.has('update') && kinds.has('delete'))) {
      throw new ParserError(
        ParserArea.Merge,
        'two WHEN MATCHED clauses must be one UPDATE and one DELETE, not two of the same',
      );
    }
    if (!matched[0]!.and || matched[0]!.and.length === 0) {
      throw new ParserError(
        ParserArea.Merge,
        'with two WHEN MATCHED clauses the first must carry an AND condition',
      );
    }
  }
  if (unconditionalCount(whens, 'matched') > 1) {
    throw new ParserError(ParserArea.Merge, 'MERGE allows at most one unconditional WHEN MATCHED');
  }
  if (unconditionalCount(whens, 'notMatchedByTarget') > 1) {
    throw new ParserError(
      ParserArea.Merge,
      'MERGE allows at most one unconditional WHEN NOT MATCHED BY TARGET',
    );
  }
};

/**
 * Renders a T-SQL `MERGE` statement from {@link MergeState}. Native T-SQL only — every other
 * dialect is refused, because MERGE exists nowhere else and the builder does not approximate it.
 * This replaced the parked upsert-shaped emitter, which structurally could not carry a USING
 * alias, an arbitrary ON, WHEN NOT MATCHED BY SOURCE, DELETE arms, or multiple WHENs.
 */
export const defaultMerge = (
  state: QueryState,
  config: Dialect,
  mode: ParserMode,
  options?: ToSqlOptions,
): SqlHelper => {
  const sqlHelper = new SqlHelper(mode);

  if (config.databaseType !== DatabaseType.Mssql) {
    throw new ParserError(
      ParserArea.Merge,
      `${dialectDisplayName(config.databaseType)} has no MERGE statement — it is native T-SQL only`,
    );
  }

  const merge = state.mergeState;
  if (!merge || !merge.targetTable) {
    throw new ParserError(ParserArea.Merge, 'MERGE requires a target table — call into(...)');
  }
  if (!merge.using) {
    throw new ParserError(ParserArea.Merge, 'MERGE requires a USING source');
  }
  if (merge.onStates.length === 0) {
    throw new ParserError(ParserArea.Merge, 'MERGE requires an ON condition');
  }
  validateWhenCardinality(merge);

  // MERGE [INTO] <target> [WITH (hint)] [AS alias] — the hint precedes the alias. Emitting the
  // alias first (`AS target WITH (HOLDLOCK)`) is non-canonical and version-fragile.
  sqlHelper.addSqlSnippet('MERGE INTO ');
  sqlHelper.addSqlSnippet(
    qi(
      merge.targetOwner !== undefined && merge.targetOwner !== ''
        ? merge.targetOwner
        : config.defaultOwner,
      config,
    ),
  );
  sqlHelper.addSqlSnippet('.');
  sqlHelper.addSqlSnippet(qi(merge.targetTable, config));
  if (merge.holdlock === true) {
    sqlHelper.addSqlSnippet(' WITH (HOLDLOCK)');
  }
  sqlHelper.addSqlSnippet(' AS ');
  sqlHelper.addSqlSnippet(qi(merge.targetAlias, config));
  sqlHelper.addSqlSnippet(' ');

  emitUsing(sqlHelper, config, mode, merge.using, options);

  sqlHelper.addSqlSnippet(' ON ');
  renderJoinOnConditions(sqlHelper, config, merge.onStates);

  for (const when of merge.whenStates) {
    sqlHelper.addSqlSnippet(' ');
    sqlHelper.addSqlSnippet(whenKeyword(when.match));
    emitAnd(sqlHelper, config, when);
    sqlHelper.addSqlSnippet(' THEN ');
    emitAction(sqlHelper, config, merge, when.action);
  }

  if (merge.outputRaw !== undefined) {
    sqlHelper.addSqlSnippet(' OUTPUT ');
    sqlHelper.addSqlSnippet(merge.outputRaw);
  }

  // The terminating semicolon is MANDATORY on MERGE (Msg 10713 otherwise). MERGE is top-level, so
  // it is always emitted.
  sqlHelper.addSqlSnippet(';');

  return sqlHelper;
};
