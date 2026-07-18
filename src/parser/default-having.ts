import type { Dialect } from '../configuration/configuration';
import { BuilderType } from '../enums/builder-type';
import { ParserArea } from '../enums/parser-area';
import type { ParserMode } from '../enums/parser-mode';
import { WhereOperator } from '../enums/where-operator';
import { quoteIdentifier } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';
import type { HavingState } from '../state/having';
import type { QueryState } from '../state/query';

const isHavingPredicate = (state: HavingState): boolean =>
  state.builderType === BuilderType.Having || state.builderType === BuilderType.HavingRaw;

export const defaultHaving = (state: QueryState, config: Dialect, mode: ParserMode): SqlHelper => {
  const sqlHelper = new SqlHelper(mode);

  if (state.havingStates.length === 0) {
    return sqlHelper;
  }

  if (state.groupByStates.length === 0) {
    throw new ParserError(ParserArea.Having, 'HAVING requires a GROUP BY clause');
  }

  sqlHelper.addSqlSnippet('HAVING ');

  for (let i = 0; i < state.havingStates.length; i++) {
    const havingState = state.havingStates[i]!;
    const prev = i > 0 ? state.havingStates[i - 1] : undefined;

    if (
      i === 0 &&
      (havingState.builderType === BuilderType.And || havingState.builderType === BuilderType.Or)
    ) {
      throw new ParserError(ParserArea.Having, 'First HAVING operator cannot be AND or OR');
    }

    if (
      i === state.havingStates.length - 1 &&
      (havingState.builderType === BuilderType.And || havingState.builderType === BuilderType.Or)
    ) {
      throw new ParserError(
        ParserArea.Having,
        'AND or OR cannot be used as the last HAVING operator',
      );
    }

    if (
      (havingState.builderType === BuilderType.And || havingState.builderType === BuilderType.Or) &&
      prev &&
      (prev.builderType === BuilderType.And || prev.builderType === BuilderType.Or)
    ) {
      throw new ParserError(ParserArea.Having, 'AND or OR cannot be used consecutively');
    }

    if (havingState.builderType === BuilderType.And) {
      sqlHelper.addSqlSnippet(' AND ');
      continue;
    }

    if (havingState.builderType === BuilderType.Or) {
      sqlHelper.addSqlSnippet(' OR ');
      continue;
    }

    // Consecutive predicates without an explicit AND/OR are joined with AND so
    // `.having().having()` and `havingRaws([...])` emit valid SQL.
    if (i > 0 && prev && isHavingPredicate(prev) && isHavingPredicate(havingState)) {
      sqlHelper.addSqlSnippet(' AND ');
    }

    if (havingState.builderType === BuilderType.HavingRaw) {
      sqlHelper.addSqlSnippet(havingState.raw ?? '');
      continue;
    }

    if (havingState.builderType === BuilderType.Having) {
      sqlHelper.addSqlSnippet(
        quoteIdentifier(havingState.tableNameOrAlias, config.identifierDelimiters),
      );
      sqlHelper.addSqlSnippet('.');
      sqlHelper.addSqlSnippet(quoteIdentifier(havingState.columnName, config.identifierDelimiters));
      sqlHelper.addSqlSnippet(' ');

      const value = havingState.values[0];

      // Null comparisons are three-valued — emit IS NULL / IS NOT NULL instead of `= NULL`.
      if (
        (havingState.whereOperator === WhereOperator.Equals ||
          havingState.whereOperator === WhereOperator.NotEquals) &&
        (value === null || value === undefined)
      ) {
        sqlHelper.addSqlSnippet(
          havingState.whereOperator === WhereOperator.Equals ? 'IS NULL' : 'IS NOT NULL',
        );
        continue;
      }

      switch (havingState.whereOperator) {
        case WhereOperator.Equals:
          sqlHelper.addSqlSnippet('=');
          break;
        case WhereOperator.NotEquals:
          sqlHelper.addSqlSnippet('<>');
          break;
        case WhereOperator.GreaterThan:
          sqlHelper.addSqlSnippet('>');
          break;
        case WhereOperator.GreaterThanOrEquals:
          sqlHelper.addSqlSnippet('>=');
          break;
        case WhereOperator.LessThan:
          sqlHelper.addSqlSnippet('<');
          break;
        case WhereOperator.LessThanOrEquals:
          sqlHelper.addSqlSnippet('<=');
          break;
        case WhereOperator.Like:
          sqlHelper.addSqlSnippet('LIKE');
          break;
        case WhereOperator.NotLike:
          sqlHelper.addSqlSnippet('NOT LIKE');
          break;
        default:
          throw new ParserError(
            ParserArea.Having,
            `Unsupported HAVING operator: ${havingState.whereOperator}`,
          );
      }

      sqlHelper.addSqlSnippet(' ');
      sqlHelper.addDynamicValue(value);
      continue;
    }
  }

  return sqlHelper;
};
