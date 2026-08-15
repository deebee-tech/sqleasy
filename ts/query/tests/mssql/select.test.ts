import { describe, expect, it } from 'vitest';
import { MssqlQuery, WhereOperator } from '../../src';

describe('MssqlQuery select', () => {
  it('select all', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM [dbo].[users] AS [u];');
  });

  it('select all with WHERE', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').where('u', 'id', WhereOperator.Equals, 1);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM [dbo].[users] AS [u] WHERE [u].[id] = 1;');
  });

  it('selectColumn with alias', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .selectColumn('u', 'name', 'userName')
      .fromTable('users', 'u')
      .where('u', 'id', WhereOperator.Equals, 1);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT [u].[name] AS [userName] FROM [dbo].[users] AS [u] WHERE [u].[id] = 1;',
    );
  });

  it('selectColumn without alias (empty string)', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .selectColumn('u', 'name', '')
      .fromTable('users', 'u')
      .where('u', 'id', WhereOperator.Equals, 1);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT [u].[name] FROM [dbo].[users] AS [u] WHERE [u].[id] = 1;');
  });

  it('selectColumns (multiple)', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .selectColumns([
        { tableNameOrAlias: 'u', columnName: 'id', columnAlias: 'userId' },
        { tableNameOrAlias: 'u', columnName: 'name', columnAlias: 'userName' },
        { tableNameOrAlias: 'u', columnName: 'email', columnAlias: '' },
      ])
      .fromTable('users', 'u')
      .where('u', 'id', WhereOperator.Equals, 1);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT [u].[id] AS [userId], [u].[name] AS [userName], [u].[email] FROM [dbo].[users] AS [u] WHERE [u].[id] = 1;',
    );
  });

  it('selectRaw', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .selectRaw('COUNT(*) AS total')
      .fromTable('users', 'u')
      .where('u', 'active', WhereOperator.Equals, 1);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT COUNT(*) AS total FROM [dbo].[users] AS [u] WHERE [u].[active] = 1;',
    );
  });

  it('selectRaws', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .selectRaws(['COUNT(*) AS total', 'MAX([u].[age]) AS maxAge'])
      .fromTable('users', 'u')
      .where('u', 'active', WhereOperator.Equals, 1);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT COUNT(*) AS total, MAX([u].[age]) AS maxAge FROM [dbo].[users] AS [u] WHERE [u].[active] = 1;',
    );
  });

  it('selectWithBuilder (subquery in SELECT)', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .selectColumn('u', 'name', 'userName')
      .selectWithBuilder('orderCount', (b) => {
        b.selectRaw('COUNT(*)').fromTable('orders', 'o').whereRaw('[o].[user_id] = [u].[id]');
      })
      .fromTable('users', 'u')
      .where('u', 'active', WhereOperator.Equals, 1);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT [u].[name] AS [userName], (SELECT COUNT(*) FROM [dbo].[orders] AS [o] WHERE [o].[user_id] = [u].[id]) AS [orderCount] FROM [dbo].[users] AS [u] WHERE [u].[active] = 1;',
    );
  });

  it('distinct', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.distinct().selectAll().fromTable('users', 'u');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT DISTINCT * FROM [dbo].[users] AS [u];');
  });

  it('distinct with top', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.distinct().selectAll().fromTable('users', 'u').top(10);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT DISTINCT TOP (10) * FROM [dbo].[users] AS [u];');
  });
});

describe('MssqlQuery parse (prepared statements)', () => {
  it('parse select with where - sp_executesql format', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').where('u', 'id', WhereOperator.Equals, 42);

    const sql = builder.parse();
    expect(sql).toContain('exec sp_executesql');
    expect(sql).toContain('@p0 int');
    expect(sql).toContain('@p0 = 42');
  });

  it('parse with string parameter', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').where('u', 'name', WhereOperator.Equals, 'John');

    const sql = builder.parse();
    // varchar, not nvarchar: an nvarchar parameter against a varchar COLUMN converts the column
    // and loses the index seek. The literal drops its `N` to match the declaration.
    expect(sql).toContain('@p0 varchar(max)');
    expect(sql).toContain("@p0 = 'John'");
  });

  it('parse with no parameters omits the value list (no trailing comma)', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u');

    const sql = builder.parse();
    expect(sql).toContain('exec sp_executesql');
    // A dangling `', ;` is malformed sp_executesql and SQL Server rejects it.
    expect(sql).not.toContain("', ;");
    expect(sql.trim().endsWith("N'';")).toBe(true);
  });

  it('parse with multiple parameters of different types', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'id', WhereOperator.Equals, 42)
      .and()
      .where('u', 'active', WhereOperator.Equals, true);

    const sql = builder.parse();
    expect(sql).toContain('@p0 int');
    expect(sql).toContain('@p1 bit');
    expect(sql).toContain(', @p1 = 1');
  });

  it('parse with boolean parameter', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').where('u', 'active', WhereOperator.Equals, true);

    const sql = builder.parse();
    expect(sql).toContain('@p0 bit');
  });

  it('parse with float parameter', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').where('u', 'score', WhereOperator.Equals, 3.14);

    const sql = builder.parse();
    expect(sql).toContain('@p0 float');
  });

  // These used to be two tests pinning a `tinyint` band and a `smallint` band. The bands are gone
  // on purpose: sp_executesql's cache key includes the parameter DECLARATION, so banding by
  // magnitude cached a separate plan for `= 5` and `= 1000` — the same statement, the same column,
  // compiled twice. Measured against SQL Server 2022: three declarations, three plans.
  it('declares one int across the whole 32-bit range, so the bands cannot split the plan cache', () => {
    const declarationFor = (value: number) => {
      const builder = new MssqlQuery().newBuilder();
      builder.selectAll().fromTable('users', 'u').where('u', 'v', WhereOperator.Equals, value);
      return /N'(@p0 [a-z]+)'/.exec(builder.parse())?.[1];
    };

    // 5 and 255 were tinyint; 1000 was smallint; -100 was smallint (never tinyint, which is
    // unsigned and overflowed the batch). All one declaration now.
    for (const value of [0, 5, 255, 256, 1000, -100, 2147483647, -2147483648]) {
      expect(declarationFor(value)).toBe('@p0 int');
    }
  });

  it('parse with bigint value', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'bigId', WhereOperator.Equals, 9999999999);

    const sql = builder.parse();
    expect(sql).toContain('@p0 bigint');
  });

  // The band boundaries used to matter for correctness too — T-SQL `tinyint` is UNSIGNED, so a
  // negative declared into that band raised an arithmetic-overflow error on the whole batch. With
  // one `int` declaration the hazard cannot arise, and `tinyint` should appear nowhere.
  it('never emits the unsigned narrow bands, so a negative cannot overflow the batch', () => {
    const builder = new MssqlQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'zero', WhereOperator.Equals, 0)
      .and()
      .where('u', 'max', WhereOperator.Equals, 255)
      .and()
      .where('u', 'negative', WhereOperator.Equals, -100);

    const sql = builder.parse();
    expect(sql).toContain('@p0 int, @p1 int, @p2 int');
    expect(sql).not.toContain('tinyint');
    expect(sql).not.toContain('smallint');
  });

  // `Number.isInteger(1e21)` is true, but it renders as `1e+21` — not a legal bigint literal, so
  // SQL Server rejected the batch. Anything past 2^53 is declared float, whose literal syntax
  // accepts scientific notation.
  it('declares an integer beyond 2^53 as float, not bigint', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').where('u', 'huge', WhereOperator.Equals, 1e21);

    const sql = builder.parse();
    expect(sql).toContain('@p0 float');
    expect(sql).not.toContain('bigint');
  });

  it('parse with default type (object/unknown)', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'data', WhereOperator.Equals, Symbol('test'));

    const sql = builder.parse();
    expect(sql).toContain('@p0 nvarchar(max)');
  });
});
