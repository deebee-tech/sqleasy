import { describe, expect, it } from 'vitest';
import { MssqlQuery } from '../../src';
import { WhereOperator } from '../../src/enums/where-operator';
import { OrderByDirection } from '../../src/enums/order-by-direction';
import { QueryType } from '../../src/enums/query-type';

describe('Builder state management', () => {
  const query = new MssqlQuery();

  describe('clearAll', () => {
    it('resets all state to defaults', () => {
      const builder = query.newBuilder();
      builder
        .selectColumn('u', 'id', 'id')
        .fromTable('users', 'u')
        .where('u', 'id', WhereOperator.Equals, 1)
        .limit(10)
        .offset(5);

      builder.clearAll();
      const state = builder.state();

      expect(state.selectStates).toEqual([]);
      expect(state.fromStates).toEqual([]);
      expect(state.whereStates).toEqual([]);
      expect(state.joinStates).toEqual([]);
      expect(state.orderByStates).toEqual([]);
      expect(state.groupByStates).toEqual([]);
      expect(state.havingStates).toEqual([]);
      expect(state.limit).toBe(0);
      // `undefined`, not 0 — offset(0) is a real value that emits `OFFSET 0`.
      expect(state.offset).toBeUndefined();
    });
  });

  describe('clearSelect', () => {
    it('clears only select states', () => {
      const builder = query.newBuilder();
      builder.selectColumn('u', 'id', 'id').fromTable('users', 'u');
      builder.clearSelect();

      expect(builder.state().selectStates).toEqual([]);
      expect(builder.state().fromStates.length).toBe(1);
    });

    it('also clears distinct', () => {
      const builder = query.newBuilder();
      builder.distinct().selectColumn('u', 'id', 'id').fromTable('users', 'u');
      expect(builder.state().distinct).toBe(true);

      builder.clearSelect();
      expect(builder.state().distinct).toBe(false);
      expect(builder.state().selectStates).toEqual([]);
    });
  });

  describe('clearDistinct', () => {
    it('clears only distinct', () => {
      const builder = query.newBuilder();
      builder.distinct().selectColumn('u', 'id', 'id').fromTable('users', 'u');
      builder.clearDistinct();

      expect(builder.state().distinct).toBe(false);
      expect(builder.state().selectStates.length).toBe(1);
    });
  });

  describe('clearCte', () => {
    it('clears only CTE states', () => {
      const builder = query.newBuilder();
      builder
        .cte('active', (b) => {
          b.selectAll().fromTable('users', 'u');
        })
        .selectAll()
        .fromRaw('[active]');
      builder.clearCte();

      expect(builder.state().cteStates).toEqual([]);
      expect(builder.state().selectStates.length).toBe(1);
    });
  });

  describe('clearUnion', () => {
    it('clears only union states', () => {
      const builder = query.newBuilder();
      builder
        .selectAll()
        .fromTable('users', 'u')
        .union((ub) => {
          ub.selectAll().fromTable('archived_users', 'a');
        });
      builder.clearUnion();

      expect(builder.state().unionStates).toEqual([]);
      expect(builder.state().fromStates.length).toBe(1);
    });
  });

  describe('clearInsert', () => {
    it('clears insert state and resets query type to Select', () => {
      const builder = query.newBuilder();
      builder.insertInto('users').insertColumns(['name']).insertValues(['Ada']);
      expect(builder.state().queryType).toBe(QueryType.Insert);

      builder.clearInsert();
      expect(builder.state().insertState).toBeUndefined();
      expect(builder.state().queryType).toBe(QueryType.Select);
    });
  });

  describe('clearUpdate', () => {
    it('clears update states and resets query type to Select', () => {
      const builder = query.newBuilder();
      builder.updateTable('users', 'u').set('name', 'Ada');
      expect(builder.state().queryType).toBe(QueryType.Update);

      builder.clearUpdate();
      expect(builder.state().updateStates).toEqual([]);
      expect(builder.state().queryType).toBe(QueryType.Select);
    });
  });

  describe('clearFrom', () => {
    it('clears only from states', () => {
      const builder = query.newBuilder();
      builder.selectColumn('u', 'id', 'id').fromTable('users', 'u');
      builder.clearFrom();

      expect(builder.state().fromStates).toEqual([]);
      expect(builder.state().selectStates.length).toBe(1);
    });
  });

  describe('clearJoin', () => {
    it('clears only join states', () => {
      const builder = query.newBuilder();
      builder
        .selectAll()
        .fromTable('users', 'u')
        .joinRaw('INNER JOIN orders AS o ON u.id = o.user_id');
      builder.clearJoin();

      expect(builder.state().joinStates).toEqual([]);
      expect(builder.state().fromStates.length).toBe(1);
    });
  });

  describe('clearWhere', () => {
    it('clears only where states', () => {
      const builder = query.newBuilder();
      builder.selectAll().fromTable('users', 'u').where('u', 'id', WhereOperator.Equals, 1);
      builder.clearWhere();

      expect(builder.state().whereStates).toEqual([]);
      expect(builder.state().fromStates.length).toBe(1);
    });
  });

  describe('clearOrderBy', () => {
    it('clears only orderBy states', () => {
      const builder = query.newBuilder();
      builder
        .selectAll()
        .fromTable('users', 'u')
        .orderByColumn('u', 'name', OrderByDirection.Ascending);
      builder.clearOrderBy();

      expect(builder.state().orderByStates).toEqual([]);
      expect(builder.state().fromStates.length).toBe(1);
    });
  });

  describe('clearLimit', () => {
    it('resets limit to 0', () => {
      const builder = query.newBuilder();
      builder.selectAll().fromTable('users', 'u').limit(50);
      expect(builder.state().limit).toBe(50);

      builder.clearLimit();
      expect(builder.state().limit).toBe(0);
    });
  });

  describe('clearOffset', () => {
    it('resets offset to 0', () => {
      const builder = query.newBuilder();
      builder.selectAll().fromTable('users', 'u').offset(20);
      expect(builder.state().offset).toBe(20);

      builder.clearOffset();
      // Cleared means absent, which is distinct from offset(0) — that one still emits.
      expect(builder.state().offset).toBeUndefined();
    });
  });

  describe('clearGroupBy', () => {
    it('clears only groupBy states', () => {
      const builder = query.newBuilder();
      builder.selectAll().fromTable('users', 'u').groupByColumn('u', 'status');
      builder.clearGroupBy();

      expect(builder.state().groupByStates).toEqual([]);
      expect(builder.state().fromStates.length).toBe(1);
    });
  });

  describe('clearHaving', () => {
    it('clears only having states', () => {
      const builder = query.newBuilder();
      builder
        .selectAll()
        .fromTable('users', 'u')
        .groupByColumn('u', 'status')
        .having('u', 'status', WhereOperator.Equals, 'active');
      builder.clearHaving();

      expect(builder.state().havingStates).toEqual([]);
      expect(builder.state().groupByStates.length).toBe(1);
    });
  });

  describe('state()', () => {
    it('returns the QueryState object', () => {
      const builder = query.newBuilder();
      const state = builder.state();

      expect(state).toBeDefined();
      expect(state.selectStates).toBeDefined();
      expect(state.fromStates).toBeDefined();
      expect(state.whereStates).toBeDefined();
      expect(state.joinStates).toBeDefined();
      expect(state.orderByStates).toBeDefined();
      expect(state.groupByStates).toBeDefined();
      expect(state.havingStates).toBeDefined();
      expect(state.limit).toBe(0);
      expect(state.offset).toBeUndefined();
      expect(state.distinct).toBe(false);
    });

    it('reflects mutations made through the builder', () => {
      const builder = query.newBuilder();
      builder.selectColumn('u', 'id', 'user_id').fromTable('users', 'u');

      const state = builder.state();
      expect(state.selectStates.length).toBe(1);
      expect(state.fromStates.length).toBe(1);
    });
  });

  describe('chaining', () => {
    it('returns the builder for fluent API', () => {
      const builder = query.newBuilder();
      const result = builder
        .selectColumn('u', 'id', 'id')
        .selectColumn('u', 'name', 'name')
        .fromTable('users', 'u')
        .where('u', 'id', WhereOperator.GreaterThan, 0)
        .orderByColumn('u', 'name', OrderByDirection.Ascending)
        .limit(10)
        .offset(5);

      expect(result).toBe(builder);
    });

    it('clear methods return the builder for continued chaining', () => {
      const builder = query.newBuilder();
      const result = builder
        .selectAll()
        .fromTable('users', 'u')
        .clearSelect()
        .selectColumn('u', 'id', 'id');

      expect(result).toBe(builder);
      expect(builder.state().selectStates.length).toBe(1);
    });

    it('clearAll returns the builder for continued chaining', () => {
      const builder = query.newBuilder();
      const result = builder
        .selectAll()
        .fromTable('users', 'u')
        .clearAll()
        .selectColumn('u', 'name', 'name');

      expect(result).toBe(builder);
      expect(builder.state().selectStates.length).toBe(1);
      expect(builder.state().fromStates.length).toBe(0);
    });
  });

  describe('M1 foundation fixes', () => {
    it('auto-ANDs consecutive WHERE predicates', () => {
      const builder = query.newBuilder();
      builder
        .selectAll()
        .fromTable('users', 'u')
        .where('u', 'a', WhereOperator.Equals, 1)
        .where('u', 'b', WhereOperator.Equals, 2);

      expect(builder.parsePrepared().sql).toContain('WHERE [u].[a] = @p0 AND [u].[b] = @p1');
    });

    it('clearUpdate removes the UPDATE-owned FROM target', () => {
      const builder = query.newBuilder();
      builder.updateTable('users', 'u').set('name', 'Ada');
      expect(builder.state().fromStates.length).toBe(1);

      builder.clearUpdate();
      expect(builder.state().fromStates).toEqual([]);
      expect(builder.state().mutationTargetIndex).toBeUndefined();
      expect(builder.state().queryType).toBe(QueryType.Select);
    });

    it('clearDelete clears sticky DELETE query type and target', () => {
      const builder = query.newBuilder();
      builder.deleteFrom('users', 'u');
      expect(builder.state().queryType).toBe(QueryType.Delete);

      builder.clearDelete();
      expect(builder.state().queryType).toBe(QueryType.Select);
      expect(builder.state().fromStates).toEqual([]);
    });

    it('selectAll resets sticky DELETE query type', () => {
      const builder = query.newBuilder();
      builder.deleteFrom('users', 'u').selectAll().fromTable('orders', 'o');
      expect(builder.state().queryType).toBe(QueryType.Select);
      expect(builder.parsePrepared().sql).toMatch(/^SET NOCOUNT ON;.*SELECT \*/);
    });

    it('clearHaving resets combinator target to WHERE', () => {
      const builder = query.newBuilder();
      builder
        .selectAll()
        .fromTable('users', 'u')
        .groupByColumn('u', 'status')
        .having('u', 'status', WhereOperator.Equals, 'a')
        .clearHaving()
        .where('u', 'id', WhereOperator.Equals, 1)
        .and()
        .where('u', 'active', WhereOperator.Equals, true);

      expect(builder.state().havingStates).toEqual([]);
      const sql = builder.parsePrepared().sql;
      expect(sql).toContain('WHERE [u].[id] = @p0 AND [u].[active] = @p1');
      expect(sql).not.toContain('HAVING');
    });

    it('defensively copies insertColumns / insertValues / whereInValues lists', () => {
      const cols = ['name'];
      const vals = ['Ada'];
      const ids = [1, 2];
      const builder = query.newBuilder();
      builder.insertInto('users').insertColumns(cols).insertValues(vals);
      cols.push('x');
      vals.push('y');
      expect(builder.state().insertState?.columns).toEqual(['name']);
      expect(builder.state().insertState?.values[0]).toEqual(['Ada']);

      const select = query.newBuilder();
      select.selectAll().fromTable('users', 'u').whereInValues('u', 'id', ids);
      ids.push(3);
      expect(select.state().whereStates[0]?.values).toEqual([1, 2]);
    });

    it('UPDATE prefers updateTable target over a prior fromTable', () => {
      const builder = query.newBuilder();
      builder.fromTable('users', 'u').updateTable('orders', 'o').set('total', 1);
      expect(builder.parsePrepared().sql).toContain('UPDATE [o] SET');
      expect(builder.parsePrepared().sql).toContain('FROM [dbo].[orders] AS [o]');
    });

    it('rejects empty whereGroup', () => {
      const builder = query.newBuilder();
      expect(() =>
        builder
          .selectAll()
          .fromTable('users', 'u')
          .whereGroup(() => {}),
      ).toThrow(/WHERE group cannot be empty/);
    });

    it('rejects non-positive limit', () => {
      const builder = query.newBuilder();
      expect(() => builder.limit(0)).toThrow(/LIMIT must be a positive integer/);
      expect(() => builder.limit(-1)).toThrow(/LIMIT must be a positive integer/);
    });
  });
});
