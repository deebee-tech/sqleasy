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
import { mysqlIndexHintForTable } from './default-hint';

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
      case JoinType.Lateral:
        if (config.databaseType === DatabaseType.Sqlite) {
          throw new ParserError(ParserArea.Join, 'SQLite does not support LATERAL joins');
        }
        if (config.databaseType === DatabaseType.Mssql) {
          throw new ParserError(
            ParserArea.Join,
            'MSSQL LATERAL joins use CROSS APPLY/OUTER APPLY — use joinCrossApply/joinOuterApply',
          );
        }
        sqlHelper.addSqlSnippet('JOIN LATERAL ');
        break;
      case JoinType.CrossApply:
        if (config.databaseType === DatabaseType.Mssql) {
          sqlHelper.addSqlSnippet('CROSS APPLY ');
          break;
        }
        if (
          config.databaseType === DatabaseType.Postgres ||
          config.databaseType === DatabaseType.Mysql
        ) {
          sqlHelper.addSqlSnippet('CROSS JOIN LATERAL ');
          break;
        }
        throw new ParserError(ParserArea.Join, 'SQLite does not support CROSS APPLY/LATERAL joins');
      case JoinType.OuterApply:
        if (config.databaseType === DatabaseType.Mssql) {
          sqlHelper.addSqlSnippet('OUTER APPLY ');
          break;
        }
        if (
          config.databaseType === DatabaseType.Postgres ||
          config.databaseType === DatabaseType.Mysql
        ) {
          sqlHelper.addSqlSnippet('LEFT JOIN LATERAL ');
          break;
        }
        throw new ParserError(ParserArea.Join, 'SQLite does not support OUTER APPLY/LATERAL joins');
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

      // MySQL's table reference is `tbl_name [[AS] alias] [index_hint_list]`, and the hint precedes
      // the ON clause — so this must stay above `defaultJoinOns` below.
      sqlHelper.addSqlSnippet(
        mysqlIndexHintForTable(state, config, joinState.alias ?? joinState.tableName ?? ''),
      );

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

      // MSSQL's `OUTER APPLY` carries its own join semantics and takes no ON clause. Postgres and
      // MySQL express the same thing as `LEFT JOIN LATERAL`, and a LEFT JOIN *requires* ON or
      // USING — the documented idiom is `ON TRUE`. An APPLY has no ON conditions by construction,
      // so `defaultJoinOns` returns empty and the statement was emitted without one at all, which
      // neither engine can parse. `CROSS JOIN LATERAL` is unaffected: a CROSS JOIN never takes ON.
      if (
        joinState.joinType === JoinType.OuterApply &&
        joinState.joinOnStates.length === 0 &&
        (config.databaseType === DatabaseType.Postgres ||
          config.databaseType === DatabaseType.Mysql)
      ) {
        sqlHelper.addSqlSnippet(' ON TRUE');
      }

      if (i < state.joinStates.length - 1) {
        sqlHelper.addSqlSnippet(' ');
      }
    }
  }

  return sqlHelper;
};

/**
 * Renders a JOIN's ON condition list *without* the leading `" ON "` keyword — the shared core
 * used both for a normal JOIN and (via {@link renderJoinOnConditions}) for translating a
 * join-backed UPDATE/DELETE's ON conditions into a Postgres `WHERE` predicate.
 */
const renderJoinOnPredicate = (
  sqlHelper: SqlHelper,
  config: Dialect,
  joinOnStates: JoinOnState[],
): SqlHelper => {
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

    // Consecutive ON predicates without an explicit AND/OR are joined with AND.
    const isPredicateOperator = (joinOnOperator: JoinOnOperator | undefined): boolean =>
      joinOnOperator === JoinOnOperator.On ||
      joinOnOperator === JoinOnOperator.Value ||
      joinOnOperator === JoinOnOperator.Raw ||
      joinOnOperator === JoinOnOperator.InValues ||
      joinOnOperator === JoinOnOperator.NotInValues ||
      joinOnOperator === JoinOnOperator.Between ||
      joinOnOperator === JoinOnOperator.NotBetween;
    const endsOnExpression =
      prevOn &&
      (isPredicateOperator(prevOn.joinOnOperator) ||
        prevOn.joinOnOperator === JoinOnOperator.GroupEnd);
    const startsOnExpression =
      isPredicateOperator(on.joinOnOperator) || on.joinOnOperator === JoinOnOperator.GroupBegin;
    if (i > 0 && endsOnExpression && startsOnExpression) {
      sqlHelper.addSqlSnippet('AND ');
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
        case JoinOperator.Like:
          sqlHelper.addSqlSnippet('LIKE');
          break;
        case JoinOperator.NotLike:
          sqlHelper.addSqlSnippet('NOT LIKE');
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
        case JoinOperator.Like:
          sqlHelper.addSqlSnippet('LIKE');
          break;
        case JoinOperator.NotLike:
          sqlHelper.addSqlSnippet('NOT LIKE');
          break;
      }

      sqlHelper.addSqlSnippet(' ');

      sqlHelper.addDynamicValue(on.valueRight);

      spaceAfter();
      continue;
    }

    if (
      on.joinOnOperator === JoinOnOperator.InValues ||
      on.joinOnOperator === JoinOnOperator.NotInValues
    ) {
      sqlHelper.addSqlSnippet(quoteIdentifier(on.aliasLeft, config.identifierDelimiters));
      sqlHelper.addSqlSnippet('.');
      sqlHelper.addSqlSnippet(quoteIdentifier(on.columnLeft, config.identifierDelimiters));

      sqlHelper.addSqlSnippet(
        on.joinOnOperator === JoinOnOperator.NotInValues ? ' NOT IN (' : ' IN (',
      );

      const values = on.valuesRight ?? [];
      values.forEach((value, valueIndex) => {
        sqlHelper.addDynamicValue(value);

        if (valueIndex < values.length - 1) {
          sqlHelper.addSqlSnippet(', ');
        }
      });

      sqlHelper.addSqlSnippet(')');

      spaceAfter();
      continue;
    }

    if (
      on.joinOnOperator === JoinOnOperator.Between ||
      on.joinOnOperator === JoinOnOperator.NotBetween
    ) {
      sqlHelper.addSqlSnippet(quoteIdentifier(on.aliasLeft, config.identifierDelimiters));
      sqlHelper.addSqlSnippet('.');
      sqlHelper.addSqlSnippet(quoteIdentifier(on.columnLeft, config.identifierDelimiters));

      sqlHelper.addSqlSnippet(
        on.joinOnOperator === JoinOnOperator.NotBetween ? ' NOT BETWEEN ' : ' BETWEEN ',
      );

      const [lower, upper] = on.valuesRight ?? [];
      sqlHelper.addDynamicValue(lower);
      sqlHelper.addSqlSnippet(' AND ');
      sqlHelper.addDynamicValue(upper);

      spaceAfter();
      continue;
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

  return renderJoinOnPredicate(sqlHelper, config, joinOnStates);
};

/**
 * Renders a JOIN's ON conditions as a standalone boolean expression (no leading `ON`/`WHERE`
 * keyword). Used to translate join-backed UPDATE/DELETE ON conditions into a Postgres `WHERE`
 * predicate, since Postgres's `UPDATE ... FROM` / `DELETE ... USING` do not support `JOIN ... ON`
 * syntax directly.
 */
export const renderJoinOnConditions = (
  sqlHelper: SqlHelper,
  config: Dialect,
  joinOnStates: JoinOnState[],
): SqlHelper => {
  return renderJoinOnPredicate(sqlHelper, config, joinOnStates);
};
