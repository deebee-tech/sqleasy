import { describe, expect, it } from 'vitest';
import {
  SqliteQuery,
  PostgresQuery,
  WhereOperator,
  QueryType,
  JoinType,
  JoinOperator,
} from '../../src';
import { SqlHelper } from '../../src/helpers/sql';
import { postgresConfiguration } from '../../src/dialects/postgres/configuration';
import { RuntimeConfiguration } from '../../src/configuration/runtime';
import { BuilderType } from '../../src/enums/builder-type';
import { JoinOnOperator } from '../../src/enums/join-on-operator';
import { WhereOperator as WO } from '../../src/enums/where-operator';
import { ParserMode } from '../../src/enums/parser-mode';

describe('Parser coverage edge cases', () => {
  describe('default_from.ts', () => {
    it('throws when no FROM tables specified for a SELECT', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder.selectAll();

      expect(() => builder.parseRaw()).toThrow('No tables to select from');
    });

    it('fromWithBuilder followed by fromTable produces trailing comma', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder
        .selectAll()
        .fromWithBuilder('sub', (sb) => {
          sb.selectAll().fromTable('users', 'u');
        })
        .fromTable('orders', 'o');

      const sql = builder.parseRaw();
      expect(sql).toEqual(
        'SELECT * FROM (SELECT * FROM "users" AS "u") AS "sub", "orders" AS "o";',
      );
    });
  });

  describe('default_select.ts', () => {
    it('throws when no select states are present', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder.fromTable('users', 'u');

      expect(() => builder.parseRaw()).toThrow(
        'Select statement must have at least one select state',
      );
    });

    it('selectWithBuilder followed by selectColumn produces trailing comma', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder
        .selectWithBuilder('total', (sb) => {
          sb.selectRaw('COUNT(*)').fromTable('orders', 'o');
        })
        .selectColumn('u', 'name', '')
        .fromTable('users', 'u');

      const sql = builder.parseRaw();
      expect(sql).toEqual(
        'SELECT (SELECT COUNT(*) FROM "orders" AS "o") AS "total", "u"."name" FROM "users" AS "u";',
      );
    });
  });

  describe('sql_helper.ts', () => {
    it('getSqlDebug with more values than placeholders skips extra values', () => {
      const helper = new SqlHelper(ParserMode.Prepared);

      helper.addSqlSnippet('SELECT * FROM users WHERE id = ');
      helper.addDynamicValue(42);

      // `addDynamicValue` emits the placeholder token and records the value together, so a value
      // can no longer exist without a placeholder (or vice versa). That mismatch used to be
      // reachable — the caller had to remember to append the returned placeholder — and it
      // silently shifted every later bound parameter by one.
      const debug = helper.getSqlDebug();
      expect(debug).toEqual('SELECT * FROM users WHERE id = 42');
      expect(helper.getValues()).toEqual([42]);
    });

    it('getValueStringFromDataType with symbol type hits default branch', () => {
      const helper = new SqlHelper(ParserMode.Raw);

      const sym = Symbol('test');
      const result = helper.getValueStringFromDataType(sym);
      expect(result).toEqual('Symbol(test)');
    });

    it('getValueStringFromDataType with bigint type hits default branch', () => {
      const helper = new SqlHelper(ParserMode.Raw);

      const big = BigInt(9007199254740991);
      const result = helper.getValueStringFromDataType(big);
      expect(result).toEqual('9007199254740991');
    });
  });

  describe('default_order_by.ts', () => {
    it('returns empty SQL when no orderBy states exist', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder.selectAll().fromTable('users', 'u');

      const sql = builder.parseRaw();
      expect(sql).not.toContain('ORDER BY');
    });
  });

  describe('default_cte.ts', () => {
    it('returns empty SQL when no CTE states exist', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder.selectAll().fromTable('users', 'u');

      const sql = builder.parseRaw();
      expect(sql).not.toContain('WITH');
    });
  });

  describe('default_group_by.ts', () => {
    it('returns empty SQL when no groupBy states exist', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder.selectAll().fromTable('users', 'u');

      const sql = builder.parseRaw();
      expect(sql).not.toContain('GROUP BY');
    });
  });

  describe('default_delete.ts', () => {
    it('throws when delete has no from table', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();

      builder.selectAll();
      builder.state().queryType = QueryType.Delete;
      builder.state().fromStates = [];

      expect(() => builder.parseRaw()).toThrow('DELETE requires a table');
    });
  });

  describe('default_insert.ts', () => {
    it('throws when no insert state is provided', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();

      builder.state().queryType = QueryType.Insert;
      builder.state().insertState = undefined;

      expect(() => builder.parseRaw()).toThrow('No insert state provided');
    });
  });

  describe('default_update.ts', () => {
    it('throws when update has no from table', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();

      builder.updateTable('users', 'u');
      builder.state().fromStates = [];

      expect(() => builder.parseRaw()).toThrow('UPDATE requires a table');
    });

    it('throws when update has no SET columns', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();

      builder.updateTable('users', 'u');
      builder.state().updateStates = [];

      expect(() => builder.parseRaw()).toThrow('UPDATE requires at least one SET column');
    });
  });

  describe('default_having.ts', () => {
    it('throws when HAVING used without GROUP BY', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder.selectAll().fromTable('users', 'u').having('u', 'id', WhereOperator.Equals, 1);

      expect(() => builder.parseRaw()).toThrow('Having: HAVING requires a GROUP BY clause');
    });

    it('returns empty SQL when no having states exist', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder
        .selectColumn('u', 'status', '')
        .selectRaw('COUNT(*) AS cnt')
        .fromTable('users', 'u')
        .groupByColumn('u', 'status');

      const sql = builder.parseRaw();
      expect(sql).not.toContain('HAVING');
    });
  });

  describe('default_where.ts', () => {
    it('throws when first WHERE operator is AND', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder.selectAll().fromTable('users', 'u').and();

      expect(() => builder.parseRaw()).toThrow('First WHERE operator cannot be AND or OR');
    });

    it('throws when first WHERE operator is OR', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder.selectAll().fromTable('users', 'u').or();

      expect(() => builder.parseRaw()).toThrow('First WHERE operator cannot be AND or OR');
    });

    it('throws when AND is used as last WHERE operator', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder.selectAll().fromTable('users', 'u').where('u', 'id', WhereOperator.Equals, 1).and();

      expect(() => builder.parseRaw()).toThrow(
        'AND or OR cannot be used as the last WHERE operator',
      );
    });

    it('throws when OR is used as last WHERE operator', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder.selectAll().fromTable('users', 'u').where('u', 'id', WhereOperator.Equals, 1).or();

      expect(() => builder.parseRaw()).toThrow(
        'AND or OR cannot be used as the last WHERE operator',
      );
    });

    it('throws when AND is used consecutively', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder
        .selectAll()
        .fromTable('users', 'u')
        .where('u', 'id', WhereOperator.Equals, 1)
        .and()
        .and()
        .where('u', 'name', WhereOperator.Equals, 'test');

      expect(() => builder.parseRaw()).toThrow('AND or OR cannot be used consecutively');
    });

    it('throws when OR is used consecutively', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder
        .selectAll()
        .fromTable('users', 'u')
        .where('u', 'id', WhereOperator.Equals, 1)
        .or()
        .or()
        .where('u', 'name', WhereOperator.Equals, 'test');

      expect(() => builder.parseRaw()).toThrow('AND or OR cannot be used consecutively');
    });

    it('throws when AND or OR is the last WHERE operator', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder.selectAll().fromTable('users', 'u').where('u', 'id', WhereOperator.Equals, 1).and();

      expect(() => builder.parseRaw()).toThrow(
        'AND or OR cannot be used as the last WHERE operator',
      );
    });

    it('throws when AND is used after group begin', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder.selectAll().fromTable('users', 'u');
      builder.state().whereStates.push(
        {
          builderType: BuilderType.WhereGroupBegin,
          tableNameOrAlias: undefined,
          columnName: undefined,
          whereOperator: WO.None,
          raw: undefined,
          subquery: undefined,
          values: [],
        },
        {
          builderType: BuilderType.And,
          tableNameOrAlias: undefined,
          columnName: undefined,
          whereOperator: WO.None,
          raw: undefined,
          subquery: undefined,
          values: [],
        },
        {
          builderType: BuilderType.Where,
          tableNameOrAlias: 'u',
          columnName: 'id',
          whereOperator: WO.Equals,
          raw: undefined,
          subquery: undefined,
          values: [1],
        },
      );

      expect(() => builder.parseRaw()).toThrow(
        'AND or OR cannot be used directly after a group begin',
      );
    });

    it('throws when group begin is the last operator', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder.selectAll().fromTable('users', 'u');
      builder.state().whereStates.push({
        builderType: BuilderType.WhereGroupBegin,
        tableNameOrAlias: undefined,
        columnName: undefined,
        whereOperator: WO.None,
        raw: undefined,
        subquery: undefined,
        values: [],
      });

      expect(() => builder.parseRaw()).toThrow('Group begin cannot be the last WHERE operator');
    });

    it('throws when group end is the first operator', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder.selectAll().fromTable('users', 'u');
      builder.state().whereStates.push({
        builderType: BuilderType.WhereGroupEnd,
        tableNameOrAlias: undefined,
        columnName: undefined,
        whereOperator: WO.None,
        raw: undefined,
        subquery: undefined,
        values: [],
      });

      expect(() => builder.parseRaw()).toThrow('Group end cannot be the first WHERE operator');
    });

    it('group end followed by another group end suppresses trailing space', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder.selectAll().fromTable('users', 'u').where('u', 'id', WhereOperator.Equals, 1);
      builder.state().whereStates.push(
        {
          builderType: BuilderType.WhereGroupEnd,
          tableNameOrAlias: '',
          columnName: '',
          whereOperator: WO.None,
          raw: '',
          subquery: undefined,
          values: [],
        },
        {
          builderType: BuilderType.WhereGroupEnd,
          tableNameOrAlias: '',
          columnName: '',
          whereOperator: WO.None,
          raw: '',
          subquery: undefined,
          values: [],
        },
      );

      const sql = builder.parseRaw();
      expect(sql).toContain('))');
    });
  });

  describe('Postgres configuration full coverage', () => {
    it('covers transactionDelimiters', () => {
      const config = postgresConfiguration(new RuntimeConfiguration());
      expect(config.transactionDelimiters.begin).toEqual('BEGIN');
      expect(config.transactionDelimiters.end).toEqual('COMMIT');
    });
  });

  describe('defaultJoin validation errors', () => {
    it('throws when first ON operator is AND', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder.selectAll().fromTable('users', 'u');
      builder.state().joinStates.push({
        builderType: BuilderType.JoinTable,
        joinType: JoinType.Inner,
        owner: '',
        tableName: 'orders',
        alias: 'o',
        subquery: undefined,
        raw: undefined,
        joinOnStates: [
          {
            joinOperator: JoinOperator.None,
            joinOnOperator: JoinOnOperator.And,
            aliasLeft: undefined,
            columnLeft: undefined,
            aliasRight: undefined,
            columnRight: undefined,
            raw: undefined,
            valueRight: undefined,
          },
        ],
      });

      expect(() => builder.parseRaw()).toThrow('First JOIN ON operator cannot be AND or OR');
    });

    it('throws when last ON operator is AND', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder.selectAll().fromTable('users', 'u');
      builder.state().joinStates.push({
        builderType: BuilderType.JoinTable,
        joinType: JoinType.Inner,
        owner: '',
        tableName: 'orders',
        alias: 'o',
        subquery: undefined,
        raw: undefined,
        joinOnStates: [
          {
            joinOperator: JoinOperator.Equals,
            joinOnOperator: JoinOnOperator.On,
            aliasLeft: 'u',
            columnLeft: 'id',
            aliasRight: 'o',
            columnRight: 'user_id',
            raw: undefined,
            valueRight: undefined,
          },
          {
            joinOperator: JoinOperator.None,
            joinOnOperator: JoinOnOperator.And,
            aliasLeft: undefined,
            columnLeft: undefined,
            aliasRight: undefined,
            columnRight: undefined,
            raw: undefined,
            valueRight: undefined,
          },
        ],
      });

      expect(() => builder.parseRaw()).toThrow(
        'AND or OR cannot be used as the last JOIN ON operator',
      );
    });

    it('throws when AND used consecutively in ON', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder.selectAll().fromTable('users', 'u');
      builder.state().joinStates.push({
        builderType: BuilderType.JoinTable,
        joinType: JoinType.Inner,
        owner: '',
        tableName: 'orders',
        alias: 'o',
        subquery: undefined,
        raw: undefined,
        joinOnStates: [
          {
            joinOperator: JoinOperator.Equals,
            joinOnOperator: JoinOnOperator.On,
            aliasLeft: 'u',
            columnLeft: 'id',
            aliasRight: 'o',
            columnRight: 'user_id',
            raw: undefined,
            valueRight: undefined,
          },
          {
            joinOperator: JoinOperator.None,
            joinOnOperator: JoinOnOperator.And,
            aliasLeft: undefined,
            columnLeft: undefined,
            aliasRight: undefined,
            columnRight: undefined,
            raw: undefined,
            valueRight: undefined,
          },
          {
            joinOperator: JoinOperator.None,
            joinOnOperator: JoinOnOperator.And,
            aliasLeft: undefined,
            columnLeft: undefined,
            aliasRight: undefined,
            columnRight: undefined,
            raw: undefined,
            valueRight: undefined,
          },
          {
            joinOperator: JoinOperator.Equals,
            joinOnOperator: JoinOnOperator.On,
            aliasLeft: 'u',
            columnLeft: 'id2',
            aliasRight: 'o',
            columnRight: 'id2',
            raw: undefined,
            valueRight: undefined,
          },
        ],
      });

      expect(() => builder.parseRaw()).toThrow('AND or OR cannot be used consecutively');
    });

    it('throws when AND used after group begin in ON', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder.selectAll().fromTable('users', 'u');
      builder.state().joinStates.push({
        builderType: BuilderType.JoinTable,
        joinType: JoinType.Inner,
        owner: '',
        tableName: 'orders',
        alias: 'o',
        subquery: undefined,
        raw: undefined,
        joinOnStates: [
          {
            joinOperator: JoinOperator.None,
            joinOnOperator: JoinOnOperator.GroupBegin,
            aliasLeft: undefined,
            columnLeft: undefined,
            aliasRight: undefined,
            columnRight: undefined,
            raw: undefined,
            valueRight: undefined,
          },
          {
            joinOperator: JoinOperator.None,
            joinOnOperator: JoinOnOperator.And,
            aliasLeft: undefined,
            columnLeft: undefined,
            aliasRight: undefined,
            columnRight: undefined,
            raw: undefined,
            valueRight: undefined,
          },
          {
            joinOperator: JoinOperator.Equals,
            joinOnOperator: JoinOnOperator.On,
            aliasLeft: 'u',
            columnLeft: 'id',
            aliasRight: 'o',
            columnRight: 'uid',
            raw: undefined,
            valueRight: undefined,
          },
        ],
      });

      expect(() => builder.parseRaw()).toThrow(
        'AND or OR cannot be used directly after a group begin',
      );
    });

    it('throws when group begin is last ON operator', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder.selectAll().fromTable('users', 'u');
      builder.state().joinStates.push({
        builderType: BuilderType.JoinTable,
        joinType: JoinType.Inner,
        owner: '',
        tableName: 'orders',
        alias: 'o',
        subquery: undefined,
        raw: undefined,
        joinOnStates: [
          {
            joinOperator: JoinOperator.None,
            joinOnOperator: JoinOnOperator.GroupBegin,
            aliasLeft: undefined,
            columnLeft: undefined,
            aliasRight: undefined,
            columnRight: undefined,
            raw: undefined,
            valueRight: undefined,
          },
        ],
      });

      expect(() => builder.parseRaw()).toThrow('Group begin cannot be the last JOIN ON operator');
    });

    it('throws when group end is first ON operator', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder.selectAll().fromTable('users', 'u');
      builder.state().joinStates.push({
        builderType: BuilderType.JoinTable,
        joinType: JoinType.Inner,
        owner: '',
        tableName: 'orders',
        alias: 'o',
        subquery: undefined,
        raw: undefined,
        joinOnStates: [
          {
            joinOperator: JoinOperator.None,
            joinOnOperator: JoinOnOperator.GroupEnd,
            aliasLeft: undefined,
            columnLeft: undefined,
            aliasRight: undefined,
            columnRight: undefined,
            raw: undefined,
            valueRight: undefined,
          },
        ],
      });

      expect(() => builder.parseRaw()).toThrow('Group end cannot be the first JOIN ON operator');
    });

    it('group end followed by another state adds trailing space', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder.selectAll().fromTable('users', 'u');
      builder.state().joinStates.push({
        builderType: BuilderType.JoinTable,
        joinType: JoinType.Inner,
        owner: '',
        tableName: 'orders',
        alias: 'o',
        subquery: undefined,
        raw: undefined,
        joinOnStates: [
          {
            joinOperator: JoinOperator.Equals,
            joinOnOperator: JoinOnOperator.On,
            aliasLeft: 'u',
            columnLeft: 'id',
            aliasRight: 'o',
            columnRight: 'uid',
            raw: undefined,
            valueRight: undefined,
          },
          {
            joinOperator: JoinOperator.None,
            joinOnOperator: JoinOnOperator.And,
            aliasLeft: undefined,
            columnLeft: undefined,
            aliasRight: undefined,
            columnRight: undefined,
            raw: undefined,
            valueRight: undefined,
          },
          {
            joinOperator: JoinOperator.None,
            joinOnOperator: JoinOnOperator.GroupBegin,
            aliasLeft: undefined,
            columnLeft: undefined,
            aliasRight: undefined,
            columnRight: undefined,
            raw: undefined,
            valueRight: undefined,
          },
          {
            joinOperator: JoinOperator.Equals,
            joinOnOperator: JoinOnOperator.On,
            aliasLeft: 'o',
            columnLeft: 'active',
            aliasRight: 'u',
            columnRight: 'active',
            raw: undefined,
            valueRight: undefined,
          },
          {
            joinOperator: JoinOperator.None,
            joinOnOperator: JoinOnOperator.GroupEnd,
            aliasLeft: undefined,
            columnLeft: undefined,
            aliasRight: undefined,
            columnRight: undefined,
            raw: undefined,
            valueRight: undefined,
          },
        ],
      });

      const sql = builder.parseRaw();
      expect(sql).toContain('ON ');
      expect(sql).toContain('(');
      expect(sql).toContain(')');
    });

    it('raw ON followed by another state adds trailing space', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder
        .selectAll()
        .fromTable('users', 'u')
        .joinTable(JoinType.Inner, 'orders', 'o', (jb) => {
          jb.onRaw('1 = 1').and().on('u', 'id', JoinOperator.Equals, 'o', 'uid');
        });

      const sql = builder.parseRaw();
      expect(sql).toContain('ON 1 = 1 AND');
    });
  });

  describe('default_having edge cases', () => {
    it('having AND between conditions', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder
        .selectColumn('u', 'role', '')
        .selectRaw('COUNT(*) AS cnt')
        .fromTable('users', 'u')
        .groupByColumn('u', 'role');
      builder.state().havingStates.push(
        {
          builderType: BuilderType.Having,
          tableNameOrAlias: 'u',
          columnName: 'role',
          whereOperator: WO.Equals,
          raw: undefined,
          values: ['admin'],
        },
        {
          builderType: BuilderType.And,
          tableNameOrAlias: undefined,
          columnName: undefined,
          whereOperator: WO.None,
          raw: undefined,
          values: [],
        },
        {
          builderType: BuilderType.Having,
          tableNameOrAlias: 'u',
          columnName: 'cnt',
          whereOperator: WO.GreaterThan,
          raw: undefined,
          values: [5],
        },
      );

      const sql = builder.parseRaw();
      expect(sql).toContain('HAVING');
      expect(sql).toContain('AND');
    });

    it('having OR between conditions', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder
        .selectColumn('u', 'role', '')
        .selectRaw('COUNT(*) AS cnt')
        .fromTable('users', 'u')
        .groupByColumn('u', 'role');
      builder.state().havingStates.push(
        {
          builderType: BuilderType.Having,
          tableNameOrAlias: 'u',
          columnName: 'role',
          whereOperator: WO.Equals,
          raw: undefined,
          values: ['admin'],
        },
        {
          builderType: BuilderType.Or,
          tableNameOrAlias: undefined,
          columnName: undefined,
          whereOperator: WO.None,
          raw: undefined,
          values: [],
        },
        {
          builderType: BuilderType.Having,
          tableNameOrAlias: 'u',
          columnName: 'cnt',
          whereOperator: WO.LessThan,
          raw: undefined,
          values: [10],
        },
      );

      const sql = builder.parseRaw();
      expect(sql).toContain('HAVING');
      expect(sql).toContain('OR');
    });

    it('throws when first having operator is AND', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder.selectRaw('COUNT(*) AS cnt').fromTable('users', 'u').groupByColumn('u', 'role');
      builder.state().havingStates.push({
        builderType: BuilderType.And,
        tableNameOrAlias: undefined,
        columnName: undefined,
        whereOperator: WO.None,
        raw: undefined,
        values: [],
      });

      expect(() => builder.parseRaw()).toThrow('First HAVING operator cannot be AND or OR');
    });
  });

  describe('default_parser protected config getter', () => {
    it('parser uses config from getter', () => {
      const query = new PostgresQuery();
      const builder = query.newBuilder();
      builder.selectAll().fromTable('users', 'u').where('u', 'id', WhereOperator.Equals, 1);
      const sql = builder.parseRaw();
      expect(sql).toContain('"public"');
    });
  });

  describe('builder insertIntoWithOwner and deleteFromWithOwner', () => {
    it('insertIntoWithOwner sets owner correctly', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder.insertIntoWithOwner('main', 'users').insertColumns(['name']).insertValues(['John']);
      const sql = builder.parseRaw();
      expect(sql).toContain('"main"."users"');
    });

    it('deleteFromWithOwner sets owner correctly', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder.deleteFromWithOwner('main', 'users', 'u').where('u', 'id', WhereOperator.Equals, 1);
      const sql = builder.parseRaw();
      expect(sql).toContain('"main"."users"');
    });

    it('updateTableWithOwner sets owner correctly', () => {
      const query = new SqliteQuery();
      const builder = query.newBuilder();
      builder
        .updateTableWithOwner('main', 'users', 'u')
        .set('name', 'Jane')
        .where('u', 'id', WhereOperator.Equals, 1);
      const sql = builder.parseRaw();
      expect(sql).toContain('"main"."users"');
    });
  });
});
