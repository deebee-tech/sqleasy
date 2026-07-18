import type { Dialect } from '../configuration/configuration';
import { BuilderType } from '../enums/builder-type';
import { DatabaseType } from '../enums/database-type';
import { JoinOnOperator } from '../enums/join-on-operator';
import { JoinOperator } from '../enums/join-operator';
import { JoinType } from '../enums/join-type';
import { ParserArea } from '../enums/parser-area';
import type { ParserMode } from '../enums/parser-mode';
import { quoteIdentifier } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';
import type { JoinOnState } from '../state/join-on';
import type { QueryState } from '../state/query';
import type { ToSqlOptions } from './to-sql';
import { defaultToSql } from './to-sql';

export const defaultJoin = (
  state: QueryState,
  config: Dialect,
  mode: ParserMode,
  options?: ToSqlOptions,
): SqlHelper => {
  let sqlHelper = new SqlHelper(mode);

  if (state.joinStates.length === 0) {
    return sqlHelper;
  }

  for (let i = 0; i < state.joinStates.length; i++) {
    const joinState = state.joinStates[i]!;
    if (joinState.builderType === BuilderType.JoinRaw) {
      sqlHelper.addSqlSnippet(joinState.raw ?? '');
      if (i < state.joinStates.length - 1) {
        sqlHelper.addSqlSnippet(' ');
      }
      continue;
    }

    switch (joinState.joinType) {
      case JoinType.Inner:
        sqlHelper.addSqlSnippet('INNER JOIN ');
        break;
      case JoinType.Left:
        sqlHelper.addSqlSnippet('LEFT JOIN ');
        break;
      case JoinType.LeftOuter:
        sqlHelper.addSqlSnippet('LEFT OUTER JOIN ');
        break;
      case JoinType.Right:
        sqlHelper.addSqlSnippet('RIGHT JOIN ');
        break;
      case JoinType.RightOuter:
        sqlHelper.addSqlSnippet('RIGHT OUTER JOIN ');
        break;
      case JoinType.FullOuter:
        if (config.databaseType === DatabaseType.Mysql) {
          throw new ParserError(ParserArea.Join, 'MySQL does not support FULL OUTER JOIN');
        }
        sqlHelper.addSqlSnippet('FULL OUTER JOIN ');
        break;
      case JoinType.Cross:
        sqlHelper.addSqlSnippet('CROSS JOIN ');
        break;
    }

    if (joinState.builderType === BuilderType.JoinTable) {
      if (joinState.owner !== '' && config.databaseType === DatabaseType.Mysql) {
        throw new ParserError(ParserArea.Join, 'MySQL does not support table owners');
      }

      if (joinState.owner !== '') {
        sqlHelper.addSqlSnippet(quoteIdentifier(joinState.owner, config.identifierDelimiters));
        sqlHelper.addSqlSnippet('.');
      }

      sqlHelper.addSqlSnippet(quoteIdentifier(joinState.tableName, config.identifierDelimiters));

      if (joinState.alias !== '') {
        sqlHelper.addSqlSnippet(' AS ');
        sqlHelper.addSqlSnippet(quoteIdentifier(joinState.alias, config.identifierDelimiters));
      }

      sqlHelper = defaultJoinOns(sqlHelper, config, joinState.joinOnStates);

      if (i < state.joinStates.length - 1) {
        sqlHelper.addSqlSnippet(' ');
      }

      continue;
    }

    if (joinState.builderType === BuilderType.JoinBuilder) {
      const subHelper = defaultToSql(joinState.subquery, config, mode, options);

      sqlHelper.addSqlSnippetWithValues('(' + subHelper.getSql() + ')', subHelper.getValues());

      if (joinState.alias !== '') {
        sqlHelper.addSqlSnippet(' AS ');
        sqlHelper.addSqlSnippet(quoteIdentifier(joinState.alias, config.identifierDelimiters));
      }

      sqlHelper = defaultJoinOns(sqlHelper, config, joinState.joinOnStates);

      if (i < state.joinStates.length - 1) {
        sqlHelper.addSqlSnippet(' ');
      }
    }
  }

  return sqlHelper;
};

const defaultJoinOns = (
  sqlHelper: SqlHelper,
  config: Dialect,
  joinOnStates: JoinOnState[],
): SqlHelper => {
  if (joinOnStates.length === 0) {
    return sqlHelper;
  }

  sqlHelper.addSqlSnippet(' ON ');

  for (let i = 0; i < joinOnStates.length; i++) {
    const on = joinOnStates[i]!;
    const prevOn = i > 0 ? joinOnStates[i - 1] : undefined;
    const nextOn = i < joinOnStates.length - 1 ? joinOnStates[i + 1] : undefined;

    // Separator after a condition — but never immediately before a `)`, which would render
    // `(... = ? )`. Mirrors the same rule in `defaultWhere`.
    const spaceAfter = () => {
      if (i < joinOnStates.length - 1 && nextOn?.joinOnOperator !== JoinOnOperator.GroupEnd) {
        sqlHelper.addSqlSnippet(' ');
      }
    };

    if (
      i === 0 &&
      (on.joinOnOperator === JoinOnOperator.And || on.joinOnOperator === JoinOnOperator.Or)
    ) {
      throw new ParserError(ParserArea.Join, 'First JOIN ON operator cannot be AND or OR');
    }

    if (
      i === joinOnStates.length - 1 &&
      (on.joinOnOperator === JoinOnOperator.And || on.joinOnOperator === JoinOnOperator.Or)
    ) {
      throw new ParserError(
        ParserArea.Join,
        'AND or OR cannot be used as the last JOIN ON operator',
      );
    }

    if (
      (on.joinOnOperator === JoinOnOperator.And || on.joinOnOperator === JoinOnOperator.Or) &&
      (prevOn?.joinOnOperator === JoinOnOperator.And ||
        prevOn?.joinOnOperator === JoinOnOperator.Or)
    ) {
      throw new ParserError(ParserArea.Join, 'AND or OR cannot be used consecutively');
    }

    if (
      (on.joinOnOperator === JoinOnOperator.And || on.joinOnOperator === JoinOnOperator.Or) &&
      prevOn?.joinOnOperator === JoinOnOperator.GroupBegin
    ) {
      throw new ParserError(
        ParserArea.Join,
        'AND or OR cannot be used directly after a group begin',
      );
    }

    if (on.joinOnOperator === JoinOnOperator.GroupBegin && i === joinOnStates.length - 1) {
      throw new ParserError(ParserArea.Join, 'Group begin cannot be the last JOIN ON operator');
    }

    if (on.joinOnOperator === JoinOnOperator.GroupEnd && i === 0) {
      throw new ParserError(ParserArea.Join, 'Group end cannot be the first JOIN ON operator');
    }

    if (on.joinOnOperator === JoinOnOperator.And) {
      sqlHelper.addSqlSnippet('AND');

      spaceAfter();
      continue;
    }

    if (on.joinOnOperator === JoinOnOperator.Or) {
      sqlHelper.addSqlSnippet('OR');

      spaceAfter();
      continue;
    }

    if (on.joinOnOperator === JoinOnOperator.GroupBegin) {
      sqlHelper.addSqlSnippet('(');
      continue;
    }

    if (on.joinOnOperator === JoinOnOperator.GroupEnd) {
      sqlHelper.addSqlSnippet(')');

      spaceAfter();
      continue;
    }

    if (on.joinOnOperator === JoinOnOperator.Raw) {
      sqlHelper.addSqlSnippet(on.raw ?? '');

      spaceAfter();
      continue;
    }

    if (on.joinOnOperator === JoinOnOperator.On) {
      sqlHelper.addSqlSnippet(quoteIdentifier(on.aliasLeft, config.identifierDelimiters));
      sqlHelper.addSqlSnippet('.');
      sqlHelper.addSqlSnippet(quoteIdentifier(on.columnLeft, config.identifierDelimiters));

      sqlHelper.addSqlSnippet(' ');

      switch (on.joinOperator) {
        case JoinOperator.Equals:
          sqlHelper.addSqlSnippet('=');
          break;
        case JoinOperator.NotEquals:
          sqlHelper.addSqlSnippet('<>');
          break;
        case JoinOperator.GreaterThan:
          sqlHelper.addSqlSnippet('>');
          break;
        case JoinOperator.GreaterThanOrEquals:
          sqlHelper.addSqlSnippet('>=');
          break;
        case JoinOperator.LessThan:
          sqlHelper.addSqlSnippet('<');
          break;
        case JoinOperator.LessThanOrEquals:
          sqlHelper.addSqlSnippet('<=');
          break;
      }

      sqlHelper.addSqlSnippet(' ');

      sqlHelper.addSqlSnippet(quoteIdentifier(on.aliasRight, config.identifierDelimiters));
      sqlHelper.addSqlSnippet('.');
      sqlHelper.addSqlSnippet(quoteIdentifier(on.columnRight, config.identifierDelimiters));

      spaceAfter();
      continue;
    }

    if (on.joinOnOperator === JoinOnOperator.Value) {
      sqlHelper.addSqlSnippet(quoteIdentifier(on.aliasLeft, config.identifierDelimiters));
      sqlHelper.addSqlSnippet('.');
      sqlHelper.addSqlSnippet(quoteIdentifier(on.columnLeft, config.identifierDelimiters));

      sqlHelper.addSqlSnippet(' ');

      switch (on.joinOperator) {
        case JoinOperator.Equals:
          sqlHelper.addSqlSnippet('=');
          break;
        case JoinOperator.NotEquals:
          sqlHelper.addSqlSnippet('<>');
          break;
        case JoinOperator.GreaterThan:
          sqlHelper.addSqlSnippet('>');
          break;
        case JoinOperator.GreaterThanOrEquals:
          sqlHelper.addSqlSnippet('>=');
          break;
        case JoinOperator.LessThan:
          sqlHelper.addSqlSnippet('<');
          break;
        case JoinOperator.LessThanOrEquals:
          sqlHelper.addSqlSnippet('<=');
          break;
      }

      sqlHelper.addSqlSnippet(' ');

      sqlHelper.addDynamicValue(on.valueRight);

      spaceAfter();
      continue;
    }
  }

  return sqlHelper;
};
