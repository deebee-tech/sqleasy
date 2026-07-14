import type { Dialect } from '../configuration/configuration';
import { BuilderType } from '../enums/builder-type';
import { ParserArea } from '../enums/parser-area';
import type { ParserMode } from '../enums/parser-mode';
import { WhereOperator } from '../enums/where-operator';
import { quoteIdentifier } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';
import type { QueryState } from '../state/query';
import { defaultToSql } from './to-sql';

export const defaultWhere = (state: QueryState, config: Dialect, mode: ParserMode): SqlHelper => {
  const sqlHelper = new SqlHelper(mode);

  if (state.whereStates.length === 0) {
    return sqlHelper;
  }

  sqlHelper.addSqlSnippet('WHERE ');

  for (let i = 0; i < state.whereStates.length; i++) {
    const cur = state.whereStates[i]!;
    const prev = i > 0 ? state.whereStates[i - 1] : undefined;
    const next = i < state.whereStates.length - 1 ? state.whereStates[i + 1] : undefined;
    const spaceAfter = () => {
      if (i < state.whereStates.length - 1 && next?.builderType !== BuilderType.WhereGroupEnd) {
        sqlHelper.addSqlSnippet(' ');
      }
    };

    if (i === 0 && (cur.builderType === BuilderType.And || cur.builderType === BuilderType.Or)) {
      throw new ParserError(ParserArea.Where, 'First WHERE operator cannot be AND or OR');
    }

    if (
      i === state.whereStates.length - 1 &&
      (cur.builderType === BuilderType.And || cur.builderType === BuilderType.Or)
    ) {
      throw new ParserError(
        ParserArea.Where,
        'AND or OR cannot be used as the last WHERE operator',
      );
    }

    if (
      (cur.builderType === BuilderType.And || cur.builderType === BuilderType.Or) &&
      (prev?.builderType === BuilderType.And || prev?.builderType === BuilderType.Or)
    ) {
      throw new ParserError(ParserArea.Where, 'AND or OR cannot be used consecutively');
    }

    if (
      (cur.builderType === BuilderType.And || cur.builderType === BuilderType.Or) &&
      prev?.builderType === BuilderType.WhereGroupBegin
    ) {
      throw new ParserError(
        ParserArea.Where,
        'AND or OR cannot be used directly after a group begin',
      );
    }

    if (cur.builderType === BuilderType.WhereGroupBegin && i === state.whereStates.length - 1) {
      throw new ParserError(ParserArea.Where, 'Group begin cannot be the last WHERE operator');
    }

    if (cur.builderType === BuilderType.WhereGroupEnd && i === 0) {
      throw new ParserError(ParserArea.Where, 'Group end cannot be the first WHERE operator');
    }

    if (cur.builderType === BuilderType.And) {
      sqlHelper.addSqlSnippet('AND');

      if (i < state.whereStates.length - 1) {
        sqlHelper.addSqlSnippet(' ');
      }
      continue;
    }

    if (cur.builderType === BuilderType.Or) {
      sqlHelper.addSqlSnippet('OR');
      spaceAfter();
      continue;
    }

    if (cur.builderType === BuilderType.WhereGroupBegin) {
      sqlHelper.addSqlSnippet('(');
      continue;
    }

    if (cur.builderType === BuilderType.WhereGroupEnd) {
      sqlHelper.addSqlSnippet(')');
      spaceAfter();
      continue;
    }

    if (cur.builderType === BuilderType.WhereRaw) {
      sqlHelper.addSqlSnippet(cur.raw ?? '');
      spaceAfter();
      continue;
    }

    // A grouped sub-expression: render the sub-builder's predicates inside the ( ) that
    // the surrounding WhereGroupBegin/End emit, carrying its bound values up in order.
    if (cur.builderType === BuilderType.WhereGroupBuilder) {
      if (cur.subquery) {
        const subHelper = defaultWhere(cur.subquery, config, mode);
        let inner = subHelper.getSql();
        if (inner.startsWith('WHERE ')) inner = inner.slice('WHERE '.length);
        sqlHelper.addSqlSnippetWithValues(inner, subHelper.getValues());
      }
      spaceAfter();
      continue;
    }

    if (cur.builderType === BuilderType.Where) {
      sqlHelper.addSqlSnippet(quoteIdentifier(cur.tableNameOrAlias, config.identifierDelimiters));
      sqlHelper.addSqlSnippet('.');
      sqlHelper.addSqlSnippet(quoteIdentifier(cur.columnName, config.identifierDelimiters));
      sqlHelper.addSqlSnippet(' ');

      switch (cur.whereOperator) {
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
      }

      sqlHelper.addSqlSnippet(' ');
      sqlHelper.addDynamicValue(cur.values[0]);
      spaceAfter();
      continue;
    }

    if (cur.builderType === BuilderType.WhereBetween) {
      sqlHelper.addSqlSnippet(quoteIdentifier(cur.tableNameOrAlias, config.identifierDelimiters));
      sqlHelper.addSqlSnippet('.');
      sqlHelper.addSqlSnippet(quoteIdentifier(cur.columnName, config.identifierDelimiters));
      sqlHelper.addSqlSnippet(' ');
      sqlHelper.addSqlSnippet('BETWEEN ');
      sqlHelper.addDynamicValue(cur.values[0]);
      sqlHelper.addSqlSnippet(' AND ');
      sqlHelper.addDynamicValue(cur.values[1]);
      spaceAfter();
      continue;
    }

    if (cur.builderType === BuilderType.WhereExistsBuilder) {
      sqlHelper.addSqlSnippet('EXISTS (');
      const subHelper = defaultToSql(cur.subquery, config, mode);
      sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
      sqlHelper.addSqlSnippet(')');
      spaceAfter();
      continue;
    }

    if (cur.builderType === BuilderType.WhereInBuilder) {
      sqlHelper.addSqlSnippet(quoteIdentifier(cur.tableNameOrAlias, config.identifierDelimiters));
      sqlHelper.addSqlSnippet('.');
      sqlHelper.addSqlSnippet(quoteIdentifier(cur.columnName, config.identifierDelimiters));
      sqlHelper.addSqlSnippet(' IN (');
      const subHelper = defaultToSql(cur.subquery, config, mode);
      sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
      sqlHelper.addSqlSnippet(')');
      spaceAfter();
      continue;
    }

    if (cur.builderType === BuilderType.WhereInValues) {
      // `IN ()` is a syntax error in every dialect. An empty list means "match nothing", but
      // silently rewriting it to a false predicate would hide a caller bug (an unfiltered
      // collection), so refuse it and let the caller decide.
      if (cur.values.length === 0) {
        throw new ParserError(ParserArea.Where, 'IN requires at least one value');
      }

      sqlHelper.addSqlSnippet(quoteIdentifier(cur.tableNameOrAlias, config.identifierDelimiters));
      sqlHelper.addSqlSnippet('.');
      sqlHelper.addSqlSnippet(quoteIdentifier(cur.columnName, config.identifierDelimiters));
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

    if (cur.builderType === BuilderType.WhereNotExistsBuilder) {
      sqlHelper.addSqlSnippet('NOT EXISTS (');
      const subHelper = defaultToSql(cur.subquery, config, mode);
      sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
      sqlHelper.addSqlSnippet(')');
      spaceAfter();
      continue;
    }

    if (cur.builderType === BuilderType.WhereNotInBuilder) {
      sqlHelper.addSqlSnippet(quoteIdentifier(cur.tableNameOrAlias, config.identifierDelimiters));
      sqlHelper.addSqlSnippet('.');
      sqlHelper.addSqlSnippet(quoteIdentifier(cur.columnName, config.identifierDelimiters));
      sqlHelper.addSqlSnippet(' NOT IN (');
      const subHelper = defaultToSql(cur.subquery, config, mode);
      sqlHelper.addSqlSnippetWithValues(subHelper.getSql(), subHelper.getValues());
      sqlHelper.addSqlSnippet(')');
      spaceAfter();
      continue;
    }

    if (cur.builderType === BuilderType.WhereNotInValues) {
      // See WhereInValues above — `NOT IN ()` is equally invalid.
      if (cur.values.length === 0) {
        throw new ParserError(ParserArea.Where, 'NOT IN requires at least one value');
      }

      sqlHelper.addSqlSnippet(quoteIdentifier(cur.tableNameOrAlias, config.identifierDelimiters));
      sqlHelper.addSqlSnippet('.');
      sqlHelper.addSqlSnippet(quoteIdentifier(cur.columnName, config.identifierDelimiters));
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

    if (cur.builderType === BuilderType.WhereNotNull) {
      sqlHelper.addSqlSnippet(quoteIdentifier(cur.tableNameOrAlias, config.identifierDelimiters));
      sqlHelper.addSqlSnippet('.');
      sqlHelper.addSqlSnippet(quoteIdentifier(cur.columnName, config.identifierDelimiters));
      sqlHelper.addSqlSnippet(' IS NOT NULL');
      spaceAfter();
      continue;
    }

    if (cur.builderType === BuilderType.WhereNull) {
      sqlHelper.addSqlSnippet(quoteIdentifier(cur.tableNameOrAlias, config.identifierDelimiters));
      sqlHelper.addSqlSnippet('.');
      sqlHelper.addSqlSnippet(quoteIdentifier(cur.columnName, config.identifierDelimiters));
      sqlHelper.addSqlSnippet(' IS NULL');
      spaceAfter();
      continue;
    }
  }

  return sqlHelper;
};
