import type { Dialect } from '../configuration/configuration';
import { BuilderType } from '../enums/builder-type';
import { DatabaseType } from '../enums/database-type';
import { ParserArea } from '../enums/parser-area';
import type { ParserMode } from '../enums/parser-mode';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';
import type { GroupByColumnRef, GroupByState } from '../state/group-by';
import type { QueryState } from '../state/query';
import { emitGroupByColumnRef } from './default-json-predicate';

const emitColumnList = (
  sqlHelper: SqlHelper,
  config: Dialect,
  columns: GroupByColumnRef[],
): void => {
  columns.forEach((column, i) => {
    emitGroupByColumnRef(sqlHelper, config, column.tableNameOrAlias, column.columnName);
    if (i < columns.length - 1) {
      sqlHelper.addSqlSnippet(', ');
    }
  });
};

const collectPlainColumns = (groupByStates: GroupByState[]): GroupByColumnRef[] =>
  groupByStates
    .filter((state) => state.builderType === BuilderType.GroupByColumn)
    .map((state) => ({
      tableNameOrAlias: state.tableNameOrAlias ?? '',
      columnName: state.columnName ?? '',
    }));

/**
 * Emits the GROUP BY list, with EVERY grouping element the caller set.
 *
 * ── WHAT WAS WRONG (fixed 2026-07-22) ──
 * This used `groupByStates.find(...)` to locate the first ROLLUP/CUBE/GROUPING SETS and emitted only
 * that. Every other grouping element — plain columns, raws, a second modifier — was discarded with
 * no word, so the statement ran and grouped by something the caller never asked for:
 *
 *     groupByRollup(id) + groupByColumn(customer_id)  ->  GROUP BY ROLLUP ("o"."id")
 *     groupByColumn(customer_id) + groupByRollup(id)  ->  GROUP BY ROLLUP ("o"."id")
 *     groupByRollup(id) + groupByCube(customer_id)    ->  GROUP BY ROLLUP ("o"."id")
 *
 * Wrong results, no error, in either order. Found by the mechanical clause-pair sweep in
 * `scripts/check-silent-noops.mjs` rather than by anyone reading the code.
 *
 * ── THE TWO GRAMMARS (measured against the harness, 2026-07-22) ──
 * ROLLUP is an ELEMENT on Postgres and MSSQL, and a trailing SUFFIX on MySQL. They do not compose
 * the same way and cannot share an emission path:
 *
 *     Postgres 17  GROUP BY ROLLUP(a), b            OK      order is not significant
 *                  GROUP BY a, ROLLUP(b)            OK
 *                  GROUP BY ROLLUP(a), CUBE(b)      OK
 *     MSSQL 2022   GROUP BY ROLLUP(a), b            OK
 *     MySQL 8.4    GROUP BY a, b WITH ROLLUP        OK      one suffix, applies to the whole list
 *                  GROUP BY a, ROLLUP(b)            ERROR 1064 — no function form at all
 *
 * So MySQL takes at most ONE rollup and it goes at the end; the other two take any number of
 * elements in any order. SQLite has none of the three and refuses, as before.
 */
export const defaultGroupBy = (state: QueryState, config: Dialect, mode: ParserMode): SqlHelper => {
  const sqlHelper = new SqlHelper(mode);

  if (state.groupByStates.length === 0) {
    return sqlHelper;
  }

  const isModifier = (g: GroupByState): boolean =>
    g.builderType === BuilderType.GroupByRollup ||
    g.builderType === BuilderType.GroupByCube ||
    g.builderType === BuilderType.GroupByGroupingSets;

  const modifiers = state.groupByStates.filter(isModifier);
  const plainColumns = collectPlainColumns(state.groupByStates);

  /** The columns a modifier groups over: its own set, or the statement's plain columns. */
  const columnsFor = (g: GroupByState): GroupByColumnRef[] =>
    g.groupingSets && g.groupingSets.length === 1 ? g.groupingSets[0]! : plainColumns;

  const NAME: Partial<Record<string, string>> = {
    [BuilderType.GroupByRollup]: 'ROLLUP',
    [BuilderType.GroupByCube]: 'CUBE',
    [BuilderType.GroupByGroupingSets]: 'GROUPING SETS',
  };

  for (const modifier of modifiers) {
    const label = NAME[modifier.builderType] ?? 'grouping';

    if (config.databaseType === DatabaseType.Sqlite) {
      throw new ParserError(ParserArea.General, `SQLite has no ${label} — use groupByRaw`);
    }

    if (config.databaseType === DatabaseType.Mysql && label !== 'ROLLUP') {
      throw new ParserError(
        ParserArea.General,
        `MySQL has no ${label} — use groupByRollup or groupByRaw`,
      );
    }

    if (modifier.builderType === BuilderType.GroupByGroupingSets) {
      if ((modifier.groupingSets ?? []).length === 0) {
        throw new ParserError(ParserArea.General, 'GROUPING SETS requires at least one column set');
      }
    } else if (columnsFor(modifier).length === 0) {
      throw new ParserError(ParserArea.General, `${label} requires at least one grouping column`);
    }
  }

  // MySQL's WITH ROLLUP is one trailing suffix over the whole list, so a second modifier has
  // nowhere to go. Refusing beats picking one and dropping the other, which is the bug this
  // rewrite exists to remove.
  if (config.databaseType === DatabaseType.Mysql && modifiers.length > 1) {
    throw new ParserError(
      ParserArea.General,
      'MySQL spells ROLLUP as a single trailing WITH ROLLUP over the whole GROUP BY list, so it ' +
        'takes only one grouping modifier — two cannot both apply. Use groupByRaw if you need a ' +
        'shape MySQL cannot express directly.',
    );
  }

  sqlHelper.addSqlSnippet('GROUP BY ');

  const emitModifier = (g: GroupByState): void => {
    if (g.builderType === BuilderType.GroupByGroupingSets) {
      const sets = g.groupingSets ?? [];
      sqlHelper.addSqlSnippet('GROUPING SETS (');
      sets.forEach((set, i) => {
        sqlHelper.addSqlSnippet('(');
        emitColumnList(sqlHelper, config, set);
        sqlHelper.addSqlSnippet(')');
        if (i < sets.length - 1) sqlHelper.addSqlSnippet(', ');
      });
      sqlHelper.addSqlSnippet(')');
      return;
    }

    sqlHelper.addSqlSnippet(g.builderType === BuilderType.GroupByRollup ? 'ROLLUP (' : 'CUBE (');
    emitColumnList(sqlHelper, config, columnsFor(g));
    sqlHelper.addSqlSnippet(')');
  };

  // MySQL: every element is a plain term and the single ROLLUP becomes a trailing suffix. A rollup
  // that carried its own column set contributes those columns to the list, since there is no
  // per-modifier slot to put them in.
  if (config.databaseType === DatabaseType.Mysql) {
    const rollup = modifiers[0];
    const carriesOwnColumns =
      rollup?.groupingSets !== undefined && rollup.groupingSets.length === 1;
    const otherTerms = state.groupByStates.filter((g) => !isModifier(g));

    // `ROLLUP(a), b` and `GROUP BY a, b WITH ROLLUP` are NOT the same query: the first rolls up `a`
    // and crosses it with `b`, the second rolls up the pair. MySQL has only the second, so when a
    // rollup carries its own columns AND other terms are present, there is nothing honest to emit.
    // Folding them into one list would quietly answer a different question — which is the class of
    // bug this whole rewrite removes, so it refuses instead.
    if (carriesOwnColumns && otherTerms.length > 0) {
      throw new ParserError(
        ParserArea.General,
        'MySQL cannot cross a ROLLUP with other grouping terms — its WITH ROLLUP applies to the ' +
          'whole GROUP BY list, so ROLLUP(a) alongside b has no MySQL spelling. Roll up the full ' +
          'list by passing every column to groupByRollup, or use groupByRaw.',
      );
    }

    const terms = rollup ? columnsFor(rollup) : [];
    const emitted =
      rollup && carriesOwnColumns
        ? terms.map((c) => ({ kind: 'col' as const, col: c }))
        : state.groupByStates
            .filter((g) => !isModifier(g))
            .map((g) =>
              g.builderType === BuilderType.GroupByRaw
                ? { kind: 'raw' as const, raw: g.raw ?? '' }
                : {
                    kind: 'col' as const,
                    col: {
                      tableNameOrAlias: g.tableNameOrAlias ?? '',
                      columnName: g.columnName ?? '',
                    },
                  },
            );

    emitted.forEach((term, i) => {
      if (term.kind === 'raw') {
        sqlHelper.addSqlSnippet(term.raw);
      } else {
        emitGroupByColumnRef(sqlHelper, config, term.col.tableNameOrAlias, term.col.columnName);
      }
      if (i < emitted.length - 1) sqlHelper.addSqlSnippet(', ');
    });

    if (rollup) {
      sqlHelper.addSqlSnippet(' WITH ROLLUP');
    }

    return sqlHelper;
  }

  // Postgres / MSSQL: every state is its own grouping element, in the order the caller wrote them.
  // A modifier carrying its own column set does NOT also emit those columns separately, which is
  // why plain columns are skipped when they were absorbed into one.
  const absorbed =
    modifiers.length > 0 &&
    modifiers.every((m) => !(m.groupingSets && m.groupingSets.length === 1)) &&
    plainColumns.length > 0;

  const elements = state.groupByStates.filter(
    (g) => isModifier(g) || !(absorbed && g.builderType === BuilderType.GroupByColumn),
  );

  elements.forEach((g, i) => {
    if (isModifier(g)) {
      emitModifier(g);
    } else if (g.builderType === BuilderType.GroupByRaw) {
      sqlHelper.addSqlSnippet(g.raw ?? '');
    } else {
      emitGroupByColumnRef(sqlHelper, config, g.tableNameOrAlias ?? '', g.columnName ?? '');
    }

    if (i < elements.length - 1) {
      sqlHelper.addSqlSnippet(', ');
    }
  });

  return sqlHelper;
};
