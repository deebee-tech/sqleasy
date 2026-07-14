import type { Dialect } from '../configuration/configuration';
import { BuilderType } from '../enums/builder-type';
import type { ParserMode } from '../enums/parser-mode';
import { SqlHelper } from '../helpers/sql';
import type { QueryState } from '../state/query';
import type { ToSqlOptions } from './to-sql';
import { defaultToSql } from './to-sql';

export const defaultUnion = (
  state: QueryState,
  config: Dialect,
  mode: ParserMode,
  options?: ToSqlOptions,
): SqlHelper => {
  const sqlHelper = new SqlHelper(config, mode);

  if (state.unionStates.length === 0) {
    return sqlHelper;
  }

  for (let i = 0; i < state.unionStates.length; i++) {
    const unionState = state.unionStates[i]!;

    switch (unionState.builderType) {
      case BuilderType.Union:
        sqlHelper.addSqlSnippet('UNION ');
        break;
      case BuilderType.UnionAll:
        sqlHelper.addSqlSnippet('UNION ALL ');
        break;
      case BuilderType.Intersect:
        sqlHelper.addSqlSnippet('INTERSECT ');
        break;
      case BuilderType.Except:
        sqlHelper.addSqlSnippet('EXCEPT ');
        break;
    }

    if (unionState.raw) {
      sqlHelper.addSqlSnippet(unionState.raw);
    } else if (unionState.subquery) {
      const subHelper = defaultToSql(unionState.subquery, config, mode, options);
      sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
    }

    if (i < state.unionStates.length - 1) {
      sqlHelper.addSqlSnippet(' ');
    }
  }

  return sqlHelper;
};
