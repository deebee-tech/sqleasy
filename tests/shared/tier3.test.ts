import { describe, expect, it } from 'vitest';
import {
  FullTextMode,
  JsonExtractMode,
  MssqlQuery,
  MysqlQuery,
  OrderByDirection,
  PostgresQuery,
  SqliteQuery,
  WhereOperator,
} from '../../src';

describe('Tier 3 — JSON operators', () => {
  it('Postgres whereJsonExtract text mode', () => {
    const b = new PostgresQuery().newBuilder();
    b.selectAll()
      .fromTable('users', 'u')
      .whereJsonExtract('u', 'meta', 'email', JsonExtractMode.Text, WhereOperator.Equals, 'a@b.c');
    expect(b.parseRaw()).toContain('"u"."meta"->>\'email\' = a@b.c');
  });

  it('MySQL whereJsonContains', () => {
    const b = new MysqlQuery().newBuilder();
    b.selectAll()
      .fromTable('users', 'u')
      .whereJsonContains('u', 'meta', { role: 'admin' });
    expect(b.parseRaw()).toContain('JSON_CONTAINS(`u`.`meta`,');
  });

  it('selectJsonExtract on MSSQL uses JSON_VALUE', () => {
    const b = new MssqlQuery().newBuilder();
    b.selectJsonExtract('u', 'meta', '$.email', JsonExtractMode.Text, 'email')
      .fromTable('users', 'u');
    expect(b.parseRaw()).toContain('JSON_VALUE([u].[meta], "$.email") AS [email]');
  });
});

describe('Tier 3 — full-text search', () => {
  it('Postgres whereMatch natural mode', () => {
    const b = new PostgresQuery().newBuilder();
    b.selectAll()
      .fromTable('docs', 'd')
      .whereMatch([{ tableNameOrAlias: 'd', columnName: 'body' }], 'hello world');
    expect(b.parseRaw()).toContain('plainto_tsquery');
    expect(b.parseRaw()).toContain('@@');
  });

  it('MySQL whereMatch boolean mode', () => {
    const b = new MysqlQuery().newBuilder();
    b.selectAll()
      .fromTable('docs', 'd')
      .whereMatch([{ tableNameOrAlias: 'd', columnName: 'body' }], '+hello', FullTextMode.Boolean);
    expect(b.parseRaw()).toContain('IN BOOLEAN MODE');
  });

  it('SQLite FTS MATCH', () => {
    const b = new SqliteQuery().newBuilder();
    b.selectAll()
      .fromTable('docs_fts', 'd')
      .whereMatch([{ tableNameOrAlias: 'd', columnName: 'body' }], 'hello');
    expect(b.parseRaw()).toContain('"d"."body" MATCH hello');
  });
});

describe('Tier 3 — MSSQL MERGE upsert', () => {
  it('emits MERGE for onConflictDoUpdate', () => {
    const b = new MssqlQuery().newBuilder();
    b.insertInto('users')
      .insertColumns(['email', 'name'])
      .insertValues(['a@b.c', 'Ada'])
      .onConflictDoUpdate(['email'], [{ columnName: 'name', value: 'Grace' }]);
    const sql = b.parseRaw();
    expect(sql).toContain('MERGE INTO');
    expect(sql).toContain('WHEN MATCHED THEN UPDATE SET');
  });
});

describe('Tier 3 — LATERAL / APPLY', () => {
  it('Postgres joinCrossApply maps to CROSS JOIN LATERAL', () => {
    const b = new PostgresQuery().newBuilder();
    b.selectAll()
      .fromTable('orders', 'o')
      .joinCrossApply('x', (sub) => {
        sub.selectColumn('li', 'sku', '').fromTable('line_items', 'li');
      });
    expect(b.parseRaw()).toContain('CROSS JOIN LATERAL');
  });

  it('MSSQL joinOuterApply', () => {
    const b = new MssqlQuery().newBuilder();
    b.selectAll()
      .fromTable('orders', 'o')
      .joinOuterApply('x', (sub) => {
        sub.selectColumn('li', 'sku', '').fromTable('line_items', 'li');
      });
    expect(b.parseRaw()).toContain('OUTER APPLY');
  });

  it('SQLite fromLateral throws', () => {
    const b = new SqliteQuery().newBuilder();
    b.selectAll().fromTable('orders', 'o').fromLateral('x', (sub) => {
      sub.selectAll().fromTable('line_items', 'li');
    });
    expect(() => b.parseRaw()).toThrow(/LATERAL/);
  });
});

describe('Tier 3 — table functions', () => {
  it('Postgres fromTableFunction', () => {
    const b = new PostgresQuery().newBuilder();
    b.selectAll().fromTableFunction('generate_series', 'g', [1, 3]);
    expect(b.parseRaw()).toContain('FROM "public"."generate_series"(1, 3) AS "g"');
  });

  it('SQLite json_each TVF', () => {
    const b = new SqliteQuery().newBuilder();
    b.selectAll().fromTableFunction('json_each', 'j', ['{"a":1}']);
    expect(b.parseRaw()).toContain('json_each({"a":1})');
  });
});

describe('Tier 3 — grouping sets', () => {
  it('Postgres groupByRollup', () => {
    const b = new PostgresQuery().newBuilder();
    b.selectColumn('o', 'region', '')
      .fromTable('orders', 'o')
      .groupByRollup([{ tableNameOrAlias: 'o', columnName: 'region' }]);
    expect(b.parseRaw()).toContain('GROUP BY ROLLUP ("o"."region")');
  });

  it('MySQL groupByRollup uses WITH ROLLUP', () => {
    const b = new MysqlQuery().newBuilder();
    b.selectColumn('o', 'region', '')
      .fromTable('orders', 'o')
      .groupByColumn('o', 'region')
      .groupByRollup();
    expect(b.parseRaw()).toContain('GROUP BY `o`.`region` WITH ROLLUP');
  });
});

describe('Tier 3 — WITH TIES', () => {
  it('Postgres limitWithTies', () => {
    const b = new PostgresQuery().newBuilder();
    b.selectColumn('o', 'id', '')
      .fromTable('orders', 'o')
      .orderByColumn('o', 'total', OrderByDirection.Descending)
      .limitWithTies(5);
    expect(b.parseRaw()).toContain('FETCH FIRST 5 ROWS WITH TIES');
  });

  it('SQLite limitWithTies throws', () => {
    const b = new SqliteQuery().newBuilder();
    b.selectAll()
      .fromTable('orders', 'o')
      .orderByColumn('o', 'total', OrderByDirection.Descending)
      .limitWithTies(5);
    expect(() => b.parseRaw()).toThrow(/WITH TIES/);
  });
});

describe('Tier 3 — hints', () => {
  it('MySQL hintUseIndex', () => {
    const b = new MysqlQuery().newBuilder();
    b.selectAll().fromTable('users', 'u').hintUseIndex('u', 'users_email_idx');
    expect(b.parseRaw()).toContain('USE INDEX (`users_email_idx`)');
  });

  it('MSSQL hintMssqlOption', () => {
    const b = new MssqlQuery().newBuilder();
    b.selectAll()
      .fromTable('users', 'u')
      .orderByColumn('u', 'id', OrderByDirection.Ascending)
      .limit(10)
      .hintMssqlOption('RECOMPILE');
    expect(b.parseRaw()).toContain('OPTION (RECOMPILE)');
  });
});
