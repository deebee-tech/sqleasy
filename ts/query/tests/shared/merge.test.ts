import { describe, expect, it } from 'vitest';
import {
  JoinOperator,
  MssqlQuery,
  MysqlQuery,
  PostgresQuery,
  SqliteQuery,
  source,
  value,
} from '../../src';

// MERGE is native T-SQL and exists on no other dialect. This is an EXPLICIT surface a caller opts
// into knowingly — not the silent INSERT-becomes-MERGE substitution that was removed. The whole
// point of the design is that it expresses MERGE as T-SQL defines it (USING / ON / WHEN MATCHED /
// WHEN NOT MATCHED [BY SOURCE] / OUTPUT / mandatory semicolon / HOLDLOCK), not an upsert wearing
// the word.
describe('MSSQL MERGE', () => {
  const mssql = () => new MssqlQuery().newBuilder();

  it('emits a full three-arm MERGE with HOLDLOCK', () => {
    const b = mssql();
    b.merge((m) => {
      m.into('users', 'target')
        .holdlock()
        .usingValues('source', ['id', 'email', 'name'], [[1, 'a@x.io', 'Ada']])
        .on((on) => on.on('target', 'id', JoinOperator.Equals, 'source', 'id'))
        .whenMatchedThenUpdate([
          { columnName: 'email', value: source('email') },
          { columnName: 'name', value: source('name') },
        ])
        .whenNotMatchedThenInsert(
          ['id', 'email', 'name'],
          [source('id'), source('email'), source('name')],
        )
        .whenNotMatchedBySourceThenDelete();
    });

    expect(b.parseRaw()).toEqual(
      'MERGE INTO [dbo].[users] WITH (HOLDLOCK) AS [target] ' +
        'USING (VALUES (1, a@x.io, Ada)) AS [source] ([id], [email], [name]) ' +
        'ON [target].[id] = [source].[id] ' +
        'WHEN MATCHED THEN UPDATE SET [email] = [source].[email], [name] = [source].[name] ' +
        'WHEN NOT MATCHED BY TARGET THEN INSERT ([id], [email], [name]) ' +
        'VALUES ([source].[id], [source].[email], [source].[name]) ' +
        'WHEN NOT MATCHED BY SOURCE THEN DELETE;',
    );
  });

  it('places WITH (HOLDLOCK) before the alias, per the T-SQL grammar', () => {
    const b = mssql();
    b.merge((m) => {
      m.into('t')
        .holdlock()
        .usingTable('staging', 'source')
        .on((on) => on.on('target', 'id', JoinOperator.Equals, 'source', 'id'))
        .whenMatchedThenDelete();
    });
    // hint precedes alias: `... [t] WITH (HOLDLOCK) AS [target] ...`, never `AS [target] WITH (...)`.
    expect(b.parseRaw()).toContain('[dbo].[t] WITH (HOLDLOCK) AS [target]');
    expect(b.parseRaw()).not.toMatch(/AS \[target\] WITH/);
  });

  it('omits the hint entirely when holdlock() is not called', () => {
    const b = mssql();
    b.merge((m) => {
      m.into('t')
        .usingTable('staging', 'source')
        .on((on) => on.on('target', 'id', JoinOperator.Equals, 'source', 'id'))
        .whenMatchedThenDelete();
    });
    expect(b.parseRaw()).not.toContain('HOLDLOCK');
  });

  it('parameterizes USING VALUES literals through sp_executesql', () => {
    const b = mssql();
    b.merge((m) => {
      m.into('users', 'target')
        .usingValues('source', ['id', 'name'], [[1, 'Ada']])
        .on((on) => on.on('target', 'id', JoinOperator.Equals, 'source', 'id'))
        .whenNotMatchedThenInsert(['id', 'name'], [source('id'), source('name')]);
    });
    const { sql, params } = b.parsePrepared();
    expect(sql).toContain('VALUES (@p0, @p1)');
    expect(sql).toContain('@p0 tinyint, @p1 nvarchar(max)');
    expect(params).toEqual([]);
  });

  it('terminates with a mandatory semicolon', () => {
    const b = mssql();
    b.merge((m) => {
      m.into('t')
        .usingTable('s', 'source')
        .on((on) => on.on('target', 'id', JoinOperator.Equals, 'source', 'id'))
        .whenMatchedThenDelete();
    });
    expect(b.parseRaw().endsWith(';')).toBe(true);
  });

  it('carries an AND guard on a WHEN clause', () => {
    const b = mssql();
    b.merge((m) => {
      m.into('t')
        .usingTable('s', 'source')
        .on((on) => on.on('target', 'id', JoinOperator.Equals, 'source', 'id'))
        .whenMatchedThenDelete((and) => and.onValue('source', 'active', JoinOperator.Equals, true));
    });
    expect(b.parseRaw()).toContain('WHEN MATCHED AND [source].[active] = true THEN DELETE');
  });

  it('supports a raw OUTPUT expression with $action', () => {
    const b = mssql();
    b.merge((m) => {
      m.into('t')
        .usingTable('s', 'source')
        .on((on) => on.on('target', 'id', JoinOperator.Equals, 'source', 'id'))
        .whenMatchedThenDelete()
        .outputRaw('$action, deleted.id');
    });
    expect(b.parseRaw()).toContain('OUTPUT $action, deleted.id;');
  });

  it('lets a WHEN action assign a bound literal via value()', () => {
    const b = mssql();
    b.merge((m) => {
      m.into('t')
        .usingTable('s', 'source')
        .on((on) => on.on('target', 'id', JoinOperator.Equals, 'source', 'id'))
        .whenMatchedThenUpdate([{ columnName: 'archived', value: value(true) }]);
    });
    expect(b.parseRaw()).toContain('UPDATE SET [archived] = true');
  });
});

describe('MERGE cardinality rules', () => {
  const withArms = (arms: (m: import('../../src').MergeBuilder) => void) => {
    const b = new MssqlQuery().newBuilder();
    b.merge((m) => {
      m.into('t')
        .usingTable('s', 'source')
        .on((on) => on.on('target', 'id', JoinOperator.Equals, 'source', 'id'));
      arms(m);
    });
    return b;
  };

  it('requires at least one WHEN clause', () => {
    expect(() => withArms(() => {}).parseRaw()).toThrow(/at least one WHEN clause/);
  });

  it('rejects two unconditional WHEN MATCHED as one UPDATE + one DELETE only', () => {
    const b = withArms((m) => {
      m.whenMatchedThenUpdate([{ columnName: 'x', value: source('x') }]).whenMatchedThenDelete();
    });
    // Two WHEN MATCHED with the first unconditional violates T-SQL's "first must be conditional".
    expect(() => b.parseRaw()).toThrow(/first must carry an AND condition/);
  });

  it('rejects two WHEN MATCHED of the same kind', () => {
    const b = withArms((m) => {
      m.whenMatchedThenUpdate([{ columnName: 'x', value: source('x') }], (and) =>
        and.onValue('source', 'a', JoinOperator.Equals, true),
      ).whenMatchedThenUpdate([{ columnName: 'y', value: source('y') }]);
    });
    expect(() => b.parseRaw()).toThrow(/one UPDATE and one DELETE/);
  });

  it('accepts one conditional + one unconditional WHEN MATCHED of different kinds', () => {
    const b = withArms((m) => {
      m.whenMatchedThenUpdate([{ columnName: 'x', value: source('x') }], (and) =>
        and.onValue('source', 'a', JoinOperator.Equals, true),
      ).whenMatchedThenDelete();
    });
    expect(b.parseRaw()).toContain('WHEN MATCHED AND');
    expect(b.parseRaw()).toContain('WHEN MATCHED THEN DELETE');
  });
});

describe('MERGE is refused off MSSQL', () => {
  const build = (make: () => ReturnType<MssqlQuery['newBuilder']>) => {
    const b = make();
    b.merge((m) => {
      m.into('t')
        .usingTable('s', 'source')
        .on((on) => on.on('target', 'id', JoinOperator.Equals, 'source', 'id'))
        .whenMatchedThenDelete();
    });
    return b;
  };

  for (const [name, make] of [
    ['Postgres', () => new PostgresQuery().newBuilder()],
    ['MySQL', () => new MysqlQuery().newBuilder()],
    ['SQLite', () => new SqliteQuery().newBuilder()],
  ] as const) {
    it(`${name} refuses MERGE — via parseRaw and parsePrepared alike`, () => {
      expect(() => build(make).parseRaw()).toThrow(new RegExp(`${name} has no MERGE statement`));
      expect(() => build(make).parsePrepared()).toThrow(/has no MERGE statement/);
    });
  }
});
