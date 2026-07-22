import { describe, expect, it } from 'vitest';
import {
  FullTextMode,
  JoinOperator,
  JoinType,
  JsonExtractMode,
  MssqlQuery,
  MysqlQuery,
  OrderByDirection,
  PostgresQuery,
  SqliteQuery,
  WhereOperator,
} from '../../src';
import type { QueryBuilder } from '../../src';

describe('Tier 3 — JSON operators', () => {
  it('Postgres whereJsonExtract text mode', () => {
    const b = new PostgresQuery().newBuilder();
    b.selectAll()
      .fromTable('users', 'u')
      .whereJsonExtract(
        'u',
        'meta',
        '$.email',
        JsonExtractMode.Text,
        WhereOperator.Equals,
        'a@b.c',
      );
    // Was asserting `->>'email'`, which is a KEY lookup, not a JSONPath — so given SQLEasy's `$.email`
    // it returned NULL and the predicate silently never matched. The path argument is a JSONPath on
    // all four dialects now, and `jsonb_path_query_first` is the operator that actually takes one.
    expect(b.parseRaw()).toContain(
      'jsonb_path_query_first("u"."meta", \'$.email\') #>> \'{}\' = a@b.c',
    );
  });

  it('MySQL whereJsonContains', () => {
    const b = new MysqlQuery().newBuilder();
    b.selectAll().fromTable('users', 'u').whereJsonContains('u', 'meta', { role: 'admin' });
    expect(b.parseRaw()).toContain('JSON_CONTAINS(`u`.`meta`,');
  });

  it('selectJsonExtract on MSSQL uses JSON_VALUE', () => {
    const b = new MssqlQuery().newBuilder();
    b.selectJsonExtract('u', 'meta', '$.email', JsonExtractMode.Text, 'email').fromTable(
      'users',
      'u',
    );
    // SINGLE-quoted: a JSON path is a string VALUE. This assertion used to demand the double-quoted
    // form, which T-SQL reads as a delimited identifier — SQL Server rejects it under the default
    // QUOTED_IDENTIFIER ON. The test was pinning unrunnable SQL, so it moved with the fix.
    expect(b.parseRaw()).toContain("JSON_VALUE([u].[meta], '$.email') AS [email]");
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

// T-SQL has no upsert primitive. This block previously asserted that onConflictDoUpdate emits a
// MERGE — a different statement with different atomicity, trigger and error semantics, which the
// caller never wrote. It was also un-hinted, so it was race-prone at READ COMMITTED in a way
// ON CONFLICT never is. MERGE is genuine native T-SQL and should return as an explicit surface.
describe('Tier 3 — MSSQL has no upsert', () => {
  it('refuses onConflictDoUpdate rather than synthesizing a MERGE', () => {
    // Runtime-floor test: onConflict* is absent from the MSSQL view (typed-views.test.ts proves the
    // compile-time absence), so reach it through the wide builder to prove the runtime still refuses.
    const b = new MssqlQuery().newBuilder() as unknown as QueryBuilder;
    b.insertInto('users')
      .insertColumns(['email', 'name'])
      .insertValues(['a@b.c', 'Ada'])
      .onConflictDoUpdate(['email'], [{ columnName: 'name', value: 'Ada' }]);

    expect(() => b.parseRaw()).toThrow(/MSSQL has no upsert/);
  });
});

describe('Tier 3 — LATERAL / APPLY', () => {
  it('Postgres joinCrossLateral maps to CROSS JOIN LATERAL', () => {
    const b = new PostgresQuery().newBuilder();
    b.selectAll()
      .fromTable('orders', 'o')
      .joinCrossLateral('x', (sub) => {
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
    const b = new SqliteQuery().newBuilder() as unknown as QueryBuilder;
    b.selectAll()
      .fromTable('orders', 'o')
      .fromLateral('x', (sub) => {
        sub.selectAll().fromTable('line_items', 'li');
      });
    expect(() => b.parseRaw()).toThrow(/LATERAL/);
  });
});

describe('Tier 3 — table functions', () => {
  it('Postgres fromTableFunction', () => {
    const b = new PostgresQuery().newBuilder();
    b.selectAll().fromTableFunction('generate_series', 'g', [1, 3]);
    // NOT owner-qualified. This used to assert `FROM "public"."generate_series"`, which Postgres
    // rejects — `function public.generate_series(integer, integer) does not exist`, because built-ins
    // live in pg_catalog and resolve through search_path. The default owner is a TABLE default.
    expect(b.parseRaw()).toContain('FROM "generate_series"(1, 3) AS "g"');
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
    const b = new SqliteQuery().newBuilder() as unknown as QueryBuilder;
    b.selectAll()
      .fromTable('orders', 'o')
      .orderByColumn('o', 'total', OrderByDirection.Descending)
      .limitWithTies(5);
    expect(() => b.parseRaw()).toThrow(/WITH TIES/);
  });

  // MySQL has no WITH TIES in any form. It previously emitted `FETCH FIRST … WITH TIES`, which
  // MySQL cannot parse.
  it('MySQL limitWithTies throws', () => {
    const b = new MysqlQuery().newBuilder() as unknown as QueryBuilder;
    b.selectAll()
      .fromTable('orders', 'o')
      .orderByColumn('o', 'total', OrderByDirection.Descending)
      .limitWithTies(5);
    expect(() => b.parseRaw()).toThrow(/MySQL does not support WITH TIES/);
  });
});

// SQLite has none of ROLLUP, CUBE or GROUPING SETS; MySQL has only ROLLUP (as `WITH ROLLUP`).
// Each of these previously emitted SQL the engine cannot run.
describe('Tier 3 — grouping extensions refuse unsupported dialects', () => {
  it('SQLite groupByRollup throws', () => {
    const b = new SqliteQuery().newBuilder() as unknown as QueryBuilder;
    b.selectAll()
      .fromTable('orders', 'o')
      .groupByRollup([{ tableNameOrAlias: 'o', columnName: 'region' }]);
    expect(() => b.parseRaw()).toThrow(/SQLite has no ROLLUP/);
  });

  it('SQLite groupByCube throws', () => {
    const b = new SqliteQuery().newBuilder() as unknown as QueryBuilder;
    b.selectAll()
      .fromTable('orders', 'o')
      .groupByCube([{ tableNameOrAlias: 'o', columnName: 'region' }]);
    expect(() => b.parseRaw()).toThrow(/SQLite has no CUBE/);
  });

  it('SQLite groupByGroupingSets throws', () => {
    const b = new SqliteQuery().newBuilder() as unknown as QueryBuilder;
    b.selectAll()
      .fromTable('orders', 'o')
      .groupByGroupingSets([[{ tableNameOrAlias: 'o', columnName: 'region' }]]);
    expect(() => b.parseRaw()).toThrow(/SQLite has no GROUPING SETS/);
  });

  it('Postgres groupByCube still emits', () => {
    const b = new PostgresQuery().newBuilder();
    b.selectAll()
      .fromTable('orders', 'o')
      .groupByCube([{ tableNameOrAlias: 'o', columnName: 'region' }]);
    expect(b.parseRaw()).toContain('CUBE ("o"."region")');
  });
});

describe('Tier 3 — table functions refuse MySQL', () => {
  it('MySQL fromTableFunction throws', () => {
    const b = new MysqlQuery().newBuilder() as unknown as QueryBuilder;
    b.selectAll().fromTableFunction('generate_series', 'g', [1, 10]);
    expect(() => b.parseRaw()).toThrow(/MySQL does not support table functions in FROM/);
  });

  it('Postgres fromTableFunction still emits', () => {
    const b = new PostgresQuery().newBuilder();
    b.selectAll().fromTableFunction('generate_series', 'g', [1, 10]);
    expect(b.parseRaw()).toContain('generate_series');
  });
});

describe('Tier 3 — hints', () => {
  // MySQL's grammar is `tbl_name [[AS] alias] [index_hint_list]`. Asserting only that the hint
  // appears would pass even with the hint before the alias, which MySQL rejects (1064) — so pin
  // the full ordering.
  it('MySQL hintUseIndex emits the hint after the alias', () => {
    const b = new MysqlQuery().newBuilder();
    b.selectAll().fromTable('users', 'u').hintUseIndex('u', 'users_email_idx');
    expect(b.parseRaw()).toContain('FROM `users` AS `u` USE INDEX (`users_email_idx`)');
  });

  it('MySQL hintForceIndex emits the hint after the alias', () => {
    const b = new MysqlQuery().newBuilder();
    b.selectAll().fromTable('users', 'u').hintForceIndex('u', 'users_email_idx');
    expect(b.parseRaw()).toContain('FROM `users` AS `u` FORCE INDEX (`users_email_idx`)');
  });

  it('MySQL index hint on a JOIN sits between the alias and ON', () => {
    const b = new MysqlQuery().newBuilder();
    b.selectAll()
      .fromTable('users', 'u')
      .joinTable(JoinType.Inner, 'orders', 'o', (j) =>
        j.on('o', 'user_id', JoinOperator.Equals, 'u', 'id'),
      )
      .hintUseIndex('o', 'orders_user_idx');
    expect(b.parseRaw()).toContain('JOIN `orders` AS `o` USE INDEX (`orders_user_idx`) ON');
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

// A MySQL index hint (`USE INDEX`/`FORCE INDEX`) is a MySQL-only construct. On a SELECT the refusal
// has always fired, because the check rode the SELECT tail. But INSERT/UPDATE/DELETE return before
// that tail, so a hint set on a non-MySQL mutation was SILENTLY DROPPED — the statement went out
// clean and the caller's explicit hint vanished with no word, the exact silent-no-op this library
// refuses. The check now runs before the queryType dispatch, so every statement kind refuses alike.
//
// These reach the method through the wide QueryBuilder: the per-engine view no longer exposes it on
// non-MySQL (compile-time absence lives in typed-views.test.ts). This pins the RUNTIME floor.
describe('Tier 3 — index hints are refused on non-MySQL mutations, not dropped', () => {
  const nonMysql = [
    ['Postgres', () => new PostgresQuery().newBuilder()],
    ['MSSQL', () => new MssqlQuery().newBuilder()],
    ['SQLite', () => new SqliteQuery().newBuilder()],
  ] as const;

  for (const [name, make] of nonMysql) {
    it(`${name} refuses hintUseIndex on an UPDATE instead of dropping it`, () => {
      const b = make() as unknown as QueryBuilder;
      b.updateTable('users', 'u')
        .set('name', 'Ada')
        .where('u', 'id', WhereOperator.Equals, 1)
        .hintUseIndex('u', 'users_email_idx');
      expect(() => b.parseRaw()).toThrow(/index hints .* only supported on MySQL/);
    });

    it(`${name} refuses hintForceIndex on a DELETE instead of dropping it`, () => {
      const b = make() as unknown as QueryBuilder;
      b.deleteFrom('users', 'u')
        .where('u', 'id', WhereOperator.Equals, 1)
        .hintForceIndex('u', 'users_email_idx');
      expect(() => b.parseRaw()).toThrow(/index hints .* only supported on MySQL/);
    });
  }
});
