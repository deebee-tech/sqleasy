import { describe, expect, it } from 'vitest';
import { MssqlQuery } from '../../src/dialects/mssql/query';
import { MysqlQuery } from '../../src/dialects/mysql/query';
import { PostgresQuery } from '../../src/dialects/postgres/query';
import { SqliteQuery } from '../../src/dialects/sqlite/query';
import { DatabaseType } from '../../src/enums/database-type';
import { MultiBuilderTransactionState } from '../../src/enums/multi-builder-transaction-state';
import { WhereOperator } from '../../src/enums/where-operator';
import { sqlLiteral } from '../../src/helpers/sql-literal';

describe('parseDisplay', () => {
  it('Postgres inlines escaped literals (no $n placeholders)', () => {
    const builder = new PostgresQuery()
      .newBuilder()
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'name', WhereOperator.Equals, "O'Brien")
      .and()
      .where('u', 'active', WhereOperator.Equals, true);

    expect(builder.parseDisplay()).toBe(
      `SELECT * FROM "public"."users" AS "u" WHERE "u"."name" = 'O''Brien' AND "u"."active" = TRUE;`,
    );
    expect(builder.parseDisplay()).not.toContain('$1');
  });

  it('MySQL inlines escaped literals (no ? placeholders)', () => {
    const builder = new MysqlQuery()
      .newBuilder()
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'name', WhereOperator.Equals, "O'Brien");

    expect(builder.parseDisplay()).toBe(
      "SELECT * FROM `users` AS `u` WHERE `u`.`name` = 'O''Brien';",
    );
    expect(builder.parseDisplay()).not.toContain('?');
  });

  it('SQLite inlines escaped literals with 0/1 booleans', () => {
    const builder = new SqliteQuery()
      .newBuilder()
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'active', WhereOperator.Equals, false);

    expect(builder.parseDisplay()).toBe(
      'SELECT * FROM "users" AS "u" WHERE "u"."active" = 0;',
    );
  });

  it('MSSQL returns the inner statement — not sp_executesql — with N\'…\' literals', () => {
    const builder = new MssqlQuery()
      .newBuilder()
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'name', WhereOperator.Equals, "O'Brien")
      .and()
      .where('u', 'id', WhereOperator.Equals, 42);

    const sql = builder.parseDisplay();
    expect(sql).toBe(
      "SELECT * FROM [dbo].[users] AS [u] WHERE [u].[name] = N'O''Brien' AND [u].[id] = 42;",
    );
    expect(sql).not.toContain('sp_executesql');
    expect(sql).not.toContain('SET NOCOUNT');
    // Executable form still wraps.
    expect(builder.parse()).toContain('sp_executesql');
  });

  it('quotes strings (unlike parseRaw golden form)', () => {
    const builder = new PostgresQuery()
      .newBuilder()
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'name', WhereOperator.Equals, "O'Brien");

    expect(builder.parseDisplay()).toContain("'O''Brien'");
    // parseRaw deliberately leaves values unquoted for golden readability.
    expect(builder.parseRaw()).toContain('= O\'Brien');
    expect(builder.parseRaw()).not.toContain("'O''Brien'");
  });

  it('MultiBuilder.parseDisplay inlines across the batch', () => {
    const multi = new PostgresQuery().newMultiBuilder();
    multi.setTransactionState(MultiBuilderTransactionState.TransactionOff);
    const a = multi.addBuilder('a');
    a.selectAll().fromTable('users', 'u').where('u', 'id', WhereOperator.Equals, 1);
    const b = multi.addBuilder('b');
    b.selectAll().fromTable('users', 'u').where('u', 'id', WhereOperator.Equals, 2);

    expect(multi.parseDisplay()).toBe(
      'SELECT * FROM "public"."users" AS "u" WHERE "u"."id" = 1;' +
        'SELECT * FROM "public"."users" AS "u" WHERE "u"."id" = 2;',
    );
  });
});

describe('sqlLiteral', () => {
  it('formats binary per dialect', () => {
    const bytes = new Uint8Array([0xde, 0xad]);
    expect(sqlLiteral(bytes, DatabaseType.Mssql)).toBe('0xdead');
    expect(sqlLiteral(bytes, DatabaseType.Postgres)).toBe("'\\xdead'");
    expect(sqlLiteral(bytes, DatabaseType.Mysql)).toBe("X'dead'");
    expect(sqlLiteral(bytes, DatabaseType.Sqlite)).toBe("X'dead'");
  });
});
