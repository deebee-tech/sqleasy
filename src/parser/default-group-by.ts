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
    emitGroupByColumnRef(
      sqlHelper,
      config,
      column.tableNameOrAlias,
      column.columnName,
    );
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

export const defaultGroupBy = (state: QueryState, config: Dialect, mode: ParserMode): SqlHelper => {
  const sqlHelper = new SqlHelper(mode);

  if (state.groupByStates.length === 0) {
    return sqlHelper;
  }

  const modifier = state.groupByStates.find(
    (groupByState) =>
      groupByState.builderType === BuilderType.GroupByRollup ||
      groupByState.builderType === BuilderType.GroupByCube ||
      groupByState.builderType === BuilderType.GroupByGroupingSets,
  );

  const plainColumns = collectPlainColumns(state.groupByStates);

  sqlHelper.addSqlSnippet('GROUP BY ');

  if (!modifier) {
    state.groupByStates.forEach((groupByState, i) => {
      if (groupByState.builderType === BuilderType.GroupByRaw) {
        sqlHelper.addSqlSnippet(groupByState.raw ?? '');

        if (i < state.groupByStates.length - 1) {
          sqlHelper.addSqlSnippet(', ');
        }

        return;
      }

      if (groupByState.builderType === BuilderType.GroupByColumn) {
        emitGroupByColumnRef(
          sqlHelper,
          config,
          groupByState.tableNameOrAlias ?? '',
          groupByState.columnName ?? '',
        );

        if (i < state.groupByStates.length - 1) {
          sqlHelper.addSqlSnippet(', ');
        }
      }
    });

    return sqlHelper;
  }

  if (modifier.builderType === BuilderType.GroupByRollup) {
    const columns =
      modifier.groupingSets && modifier.groupingSets.length === 1
        ? modifier.groupingSets[0]!
        : plainColumns;

    if (columns.length === 0) {
      throw new ParserError(ParserArea.General, 'ROLLUP requires at least one grouping column');
    }
    if (config.databaseType === DatabaseType.Mysql) {
      emitColumnList(sqlHelper, config, columns);
      sqlHelper.addSqlSnippet(' WITH ROLLUP');
      return sqlHelper;
    }

    sqlHelper.addSqlSnippet('ROLLUP (');
    emitColumnList(sqlHelper, config, columns);
    sqlHelper.addSqlSnippet(')');
    return sqlHelper;
  }

  if (modifier.builderType === BuilderType.GroupByCube) {
    const columns =
      modifier.groupingSets && modifier.groupingSets.length === 1
        ? modifier.groupingSets[0]!
        : plainColumns;

    if (columns.length === 0) {
      throw new ParserError(ParserArea.General, 'CUBE requires at least one grouping column');
    }

    if (config.databaseType === DatabaseType.Mysql) {
      throw new ParserError(
        ParserArea.General,
        'MySQL has no CUBE — use groupByRollup/groupByGroupingSets or groupByRaw',
      );
    }

    sqlHelper.addSqlSnippet('CUBE (');
    emitColumnList(sqlHelper, config, columns);
    sqlHelper.addSqlSnippet(')');
    return sqlHelper;
  }

  const sets = modifier.groupingSets ?? [];
  if (sets.length === 0) {
    throw new ParserError(ParserArea.General, 'GROUPING SETS requires at least one column set');
  }

  if (config.databaseType === DatabaseType.Mysql) {
    throw new ParserError(
      ParserArea.General,
      'MySQL has no GROUPING SETS — use groupByRollup or groupByRaw',
    );
  }

  sqlHelper.addSqlSnippet('GROUPING SETS (');
  sets.forEach((set, setIndex) => {
    sqlHelper.addSqlSnippet('(');
    emitColumnList(sqlHelper, config, set);
    sqlHelper.addSqlSnippet(')');
    if (setIndex < sets.length - 1) {
      sqlHelper.addSqlSnippet(', ');
    }
  });
  sqlHelper.addSqlSnippet(')');

  return sqlHelper;
};
