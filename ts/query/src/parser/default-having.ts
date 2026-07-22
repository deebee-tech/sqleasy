import type { Dialect } from '../configuration/configuration';
import { BuilderType } from '../enums/builder-type';
import { FullTextMode } from '../enums/full-text-mode';
import { ParserArea } from '../enums/parser-area';
import type { ParserMode } from '../enums/parser-mode';
import { qualifiedColumn } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';
import type { HavingState } from '../state/having';
import type { QueryState } from '../state/query';
import { emitComparisonPredicate } from './comparison-operator';
import { emitAggregateCall } from './default-aggregate';
import {
  emitFullTextMatchPredicate,
  emitJsonContainsPredicate,
  emitJsonExtractPredicate,
  assertPredicateSubqueryRowCap,
} from './default-json-predicate';
import type { ToSqlOptions } from './to-sql';
import { defaultToSql } from './to-sql';

/**
 * HAVING mirrors WHERE's predicate set exactly (BETWEEN, IN, NULL checks, EXISTS, groups) —
 * see `default-where.ts`, whose combinator/spacing rules this file follows term for term.
 */
const HAVING_PREDICATE_TYPES = new Set<BuilderType>([
  BuilderType.Having,
  BuilderType.HavingRaw,
  BuilderType.HavingBetween,
  BuilderType.HavingExistsBuilder,
  BuilderType.HavingInBuilder,
  BuilderType.HavingInValues,
  BuilderType.HavingNotExistsBuilder,
  BuilderType.HavingNotInBuilder,
  BuilderType.HavingNotInValues,
  BuilderType.HavingNotNull,
  BuilderType.HavingNull,
  BuilderType.HavingJsonExtract,
  BuilderType.HavingJsonContains,
  BuilderType.HavingFullText,
]);

const isHavingPredicate = (state: HavingState): boolean =>
  HAVING_PREDICATE_TYPES.has(state.builderType);

/** True when the prior token ends an expression that can be AND-joined to the next. */
const endsHavingExpression = (state: HavingState): boolean =>
  isHavingPredicate(state) || state.builderType === BuilderType.HavingGroupEnd;

/** True when the current token starts an expression that can follow an auto-AND. */
const startsHavingExpression = (state: HavingState): boolean =>
  isHavingPredicate(state) || state.builderType === BuilderType.HavingGroupBegin;

export const defaultHaving = (
  state: QueryState,
  config: Dialect,
  mode: ParserMode,
  options?: ToSqlOptions,
): SqlHelper => {
  const sqlHelper = new SqlHelper(mode);

  if (state.havingStates.length === 0) {
    return sqlHelper;
  }

  if (state.groupByStates.length === 0) {
    throw new ParserError(ParserArea.Having, 'HAVING requires a GROUP BY clause');
  }

  sqlHelper.addSqlSnippet('HAVING ');

  for (let i = 0; i < state.havingStates.length; i++) {
    const cur = state.havingStates[i]!;
    const prev = i > 0 ? state.havingStates[i - 1] : undefined;
    const next = i < state.havingStates.length - 1 ? state.havingStates[i + 1] : undefined;
    const spaceAfter = () => {
      if (i < state.havingStates.length - 1 && next?.builderType !== BuilderType.HavingGroupEnd) {
        sqlHelper.addSqlSnippet(' ');
      }
    };

    if (i === 0 && (cur.builderType === BuilderType.And || cur.builderType === BuilderType.Or)) {
      throw new ParserError(ParserArea.Having, 'First HAVING operator cannot be AND or OR');
    }

    if (
      i === state.havingStates.length - 1 &&
      (cur.builderType === BuilderType.And || cur.builderType === BuilderType.Or)
    ) {
      throw new ParserError(
        ParserArea.Having,
        'AND or OR cannot be used as the last HAVING operator',
      );
    }

    if (
      (cur.builderType === BuilderType.And || cur.builderType === BuilderType.Or) &&
      (prev?.builderType === BuilderType.And || prev?.builderType === BuilderType.Or)
    ) {
      throw new ParserError(ParserArea.Having, 'AND or OR cannot be used consecutively');
    }

    if (
      (cur.builderType === BuilderType.And || cur.builderType === BuilderType.Or) &&
      prev?.builderType === BuilderType.HavingGroupBegin
    ) {
      throw new ParserError(
        ParserArea.Having,
        'AND or OR cannot be used directly after a group begin',
      );
    }

    if (cur.builderType === BuilderType.HavingGroupBegin && i === state.havingStates.length - 1) {
      throw new ParserError(ParserArea.Having, 'Group begin cannot be the last HAVING operator');
    }

    if (cur.builderType === BuilderType.HavingGroupEnd && i === 0) {
      throw new ParserError(ParserArea.Having, 'Group end cannot be the first HAVING operator');
    }

    if (cur.builderType === BuilderType.And) {
      sqlHelper.addSqlSnippet('AND');

      if (i < state.havingStates.length - 1) {
        sqlHelper.addSqlSnippet(' ');
      }
      continue;
    }

    if (cur.builderType === BuilderType.Or) {
      sqlHelper.addSqlSnippet('OR');
      spaceAfter();
      continue;
    }

    // Consecutive predicates / groups without an explicit AND/OR are joined with AND.
    if (i > 0 && prev && endsHavingExpression(prev) && startsHavingExpression(cur)) {
      sqlHelper.addSqlSnippet('AND ');
    }

    if (cur.builderType === BuilderType.HavingGroupBegin) {
      sqlHelper.addSqlSnippet('(');
      continue;
    }

    if (cur.builderType === BuilderType.HavingGroupEnd) {
      sqlHelper.addSqlSnippet(')');
      spaceAfter();
      continue;
    }

    if (cur.builderType === BuilderType.HavingRaw) {
      sqlHelper.addSqlSnippet(cur.raw ?? '');
      spaceAfter();
      continue;
    }

    // A grouped sub-expression: render the sub-builder's predicates inside the ( ) that the
    // surrounding HavingGroupBegin/End emit, carrying its bound values up in order.
    if (cur.builderType === BuilderType.HavingGroupBuilder) {
      if (!cur.subquery || cur.subquery.havingStates.length === 0) {
        throw new ParserError(ParserArea.Having, 'HAVING group cannot be empty');
      }
      const subHelper = defaultHaving(
        { ...cur.subquery, groupByStates: state.groupByStates },
        config,
        mode,
      );
      let inner = subHelper.getSql();
      if (inner.startsWith('HAVING ')) inner = inner.slice('HAVING '.length);
      if (inner.trim() === '') {
        throw new ParserError(ParserArea.Having, 'HAVING group cannot be empty');
      }
      sqlHelper.addSqlSnippetWithValues(inner, subHelper.getValues());
      spaceAfter();
      continue;
    }

    if (cur.builderType === BuilderType.HavingAggregate) {
      const scratch = new SqlHelper(mode);
      emitAggregateCall(
        scratch,
        config,
        cur.aggregate!,
        cur.tableNameOrAlias ?? '',
        cur.columnName ?? '',
        cur.aggregateDistinct === true,
        ParserArea.Having,
      );

      emitComparisonPredicate(
        sqlHelper,
        config,
        scratch.getSql(),
        cur.whereOperator,
        cur.values[0],
        ParserArea.Having,
      );
      spaceAfter();
      continue;
    }

    if (cur.builderType === BuilderType.Having) {
      const columnSql = qualifiedColumn(
        cur.tableNameOrAlias,
        cur.columnName,
        config.identifierDelimiters,
      );

      emitComparisonPredicate(
        sqlHelper,
        config,
        columnSql,
        cur.whereOperator,
        cur.values[0],
        ParserArea.Having,
      );
      spaceAfter();
      continue;
    }

    if (cur.builderType === BuilderType.HavingBetween) {
      sqlHelper.addSqlSnippet(
        qualifiedColumn(cur.tableNameOrAlias, cur.columnName, config.identifierDelimiters),
      );
      sqlHelper.addSqlSnippet(' ');
      sqlHelper.addSqlSnippet('BETWEEN ');
      sqlHelper.addDynamicValue(cur.values[0]);
      sqlHelper.addSqlSnippet(' AND ');
      sqlHelper.addDynamicValue(cur.values[1]);
      spaceAfter();
      continue;
    }

    if (cur.builderType === BuilderType.HavingExistsBuilder) {
      sqlHelper.addSqlSnippet('EXISTS (');
      const subHelper = defaultToSql(cur.subquery, config, mode, options);
      sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
      sqlHelper.addSqlSnippet(')');
      spaceAfter();
      continue;
    }

    if (cur.builderType === BuilderType.HavingInBuilder) {
      assertPredicateSubqueryRowCap(cur.subquery, config, ParserArea.Having);
      sqlHelper.addSqlSnippet(
        qualifiedColumn(cur.tableNameOrAlias, cur.columnName, config.identifierDelimiters),
      );
      sqlHelper.addSqlSnippet(' IN (');
      const subHelper = defaultToSql(cur.subquery, config, mode, options);
      sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
      sqlHelper.addSqlSnippet(')');
      spaceAfter();
      continue;
    }

    if (cur.builderType === BuilderType.HavingInValues) {
      // `IN ()` is a syntax error in every dialect — see WHERE's identical guard.
      if (cur.values.length === 0) {
        throw new ParserError(ParserArea.Having, 'IN requires at least one value');
      }

      sqlHelper.addSqlSnippet(
        qualifiedColumn(cur.tableNameOrAlias, cur.columnName, config.identifierDelimiters),
      );
      sqlHelper.addSqlSnippet(' IN (');

      for (let j = 0; j < cur.values.length; j++) {
        sqlHelper.addDynamicValue(cur.values[j]);
        if (j < cur.values.length - 1) {
          sqlHelper.addSqlSnippet(', ');
        }
      }

      sqlHelper.addSqlSnippet(')');
      spaceAfter();
      continue;
    }

    if (cur.builderType === BuilderType.HavingNotExistsBuilder) {
      sqlHelper.addSqlSnippet('NOT EXISTS (');
      const subHelper = defaultToSql(cur.subquery, config, mode, options);
      sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
      sqlHelper.addSqlSnippet(')');
      spaceAfter();
      continue;
    }

    if (cur.builderType === BuilderType.HavingNotInBuilder) {
      assertPredicateSubqueryRowCap(cur.subquery, config, ParserArea.Having);
      sqlHelper.addSqlSnippet(
        qualifiedColumn(cur.tableNameOrAlias, cur.columnName, config.identifierDelimiters),
      );
      sqlHelper.addSqlSnippet(' NOT IN (');
      const subHelper = defaultToSql(cur.subquery, config, mode, options);
      sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
      sqlHelper.addSqlSnippet(')');
      spaceAfter();
      continue;
    }

    if (cur.builderType === BuilderType.HavingNotInValues) {
      // See HavingInValues above — `NOT IN ()` is equally invalid.
      if (cur.values.length === 0) {
        throw new ParserError(ParserArea.Having, 'NOT IN requires at least one value');
      }

      sqlHelper.addSqlSnippet(
        qualifiedColumn(cur.tableNameOrAlias, cur.columnName, config.identifierDelimiters),
      );
      sqlHelper.addSqlSnippet(' NOT IN (');

      for (let j = 0; j < cur.values.length; j++) {
        sqlHelper.addDynamicValue(cur.values[j]);
        if (j < cur.values.length - 1) {
          sqlHelper.addSqlSnippet(', ');
        }
      }

      sqlHelper.addSqlSnippet(')');
      spaceAfter();
      continue;
    }

    if (cur.builderType === BuilderType.HavingNotNull) {
      sqlHelper.addSqlSnippet(
        qualifiedColumn(cur.tableNameOrAlias, cur.columnName, config.identifierDelimiters),
      );
      sqlHelper.addSqlSnippet(' IS NOT NULL');
      spaceAfter();
      continue;
    }

    if (cur.builderType === BuilderType.HavingNull) {
      sqlHelper.addSqlSnippet(
        qualifiedColumn(cur.tableNameOrAlias, cur.columnName, config.identifierDelimiters),
      );
      sqlHelper.addSqlSnippet(' IS NULL');
      spaceAfter();
      continue;
    }

    if (cur.builderType === BuilderType.HavingJsonExtract) {
      emitJsonExtractPredicate(sqlHelper, config, mode, cur, ParserArea.Having);
      spaceAfter();
      continue;
    }

    if (cur.builderType === BuilderType.HavingJsonContains) {
      emitJsonContainsPredicate(sqlHelper, config, cur, ParserArea.Having);
      spaceAfter();
      continue;
    }

    if (cur.builderType === BuilderType.HavingFullText) {
      emitFullTextMatchPredicate(
        sqlHelper,
        config,
        cur.fullTextColumns ?? [],
        cur.fullTextMode ?? FullTextMode.Natural,
        cur.values[0],
        ParserArea.Having,
      );
      spaceAfter();
      continue;
    }
  }

  return sqlHelper;
};
