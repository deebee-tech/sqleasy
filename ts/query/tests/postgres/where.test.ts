import { describe, expect, it } from 'vitest';
import { PostgresQuery, WhereOperator } from '../../src';

describe('PostgresQuery where', () => {
  it('where equals', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').where('u', 'id', WhereOperator.Equals, 1);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" WHERE "u"."id" = 1;');
  });

  it('where not equals', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'status', WhereOperator.NotEquals, 'inactive');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" WHERE "u"."status" <> inactive;');
  });

  it('where greater than', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').where('u', 'age', WhereOperator.GreaterThan, 18);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" WHERE "u"."age" > 18;');
  });

  it('where greater than or equals', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'age', WhereOperator.GreaterThanOrEquals, 21);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" WHERE "u"."age" >= 21;');
  });

  it('where less than', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').where('u', 'age', WhereOperator.LessThan, 65);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" WHERE "u"."age" < 65;');
  });

  it('where less than or equals', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'age', WhereOperator.LessThanOrEquals, 30);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" WHERE "u"."age" <= 30;');
  });

  it('where with AND', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'age', WhereOperator.GreaterThan, 18)
      .and()
      .where('u', 'active', WhereOperator.Equals, true);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM "public"."users" AS "u" WHERE "u"."age" > 18 AND "u"."active" = true;',
    );
  });

  it('where with OR', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'role', WhereOperator.Equals, 'admin')
      .or()
      .where('u', 'role', WhereOperator.Equals, 'superadmin');

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM "public"."users" AS "u" WHERE "u"."role" = admin OR "u"."role" = superadmin;',
    );
  });

  it('whereBetween', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').whereBetween('u', 'age', 18, 65);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" WHERE "u"."age" BETWEEN 18 AND 65;');
  });

  it('whereNull', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').whereNull('u', 'deleted_at');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" WHERE "u"."deleted_at" IS NULL;');
  });

  it('whereNotNull', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').whereNotNull('u', 'email');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" WHERE "u"."email" IS NOT NULL;');
  });

  it('whereInValues', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').whereInValues('u', 'id', [1, 2, 3]);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" WHERE "u"."id" IN (1, 2, 3);');
  });

  it('whereNotInValues', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .whereNotInValues('u', 'status', ['banned', 'suspended']);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM "public"."users" AS "u" WHERE "u"."status" NOT IN (banned, suspended);',
    );
  });

  it('whereInWithBuilder subquery', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .whereInWithBuilder('u', 'id', (sb) => {
        sb.selectColumn('o', 'user_id', '').fromTable('orders', 'o');
      });

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM "public"."users" AS "u" WHERE "u"."id" IN (SELECT "o"."user_id" FROM "public"."orders" AS "o");',
    );
  });

  it('whereNotInWithBuilder subquery', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .whereNotInWithBuilder('u', 'id', (sb) => {
        sb.selectColumn('b', 'user_id', '').fromTable('blacklist', 'b');
      });

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM "public"."users" AS "u" WHERE "u"."id" NOT IN (SELECT "b"."user_id" FROM "public"."blacklist" AS "b");',
    );
  });

  it('whereExistsWithBuilder', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .whereExistsWithBuilder('u', 'id', (sb) => {
        sb.selectRaw('1').fromTable('orders', 'o').where('o', 'user_id', WhereOperator.Equals, 1);
      });

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM "public"."users" AS "u" WHERE EXISTS (SELECT 1 FROM "public"."orders" AS "o" WHERE "o"."user_id" = 1);',
    );
  });

  it('whereNotExistsWithBuilder', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .whereNotExistsWithBuilder('u', 'id', (sb) => {
        sb.selectRaw('1').fromTable('orders', 'o').where('o', 'user_id', WhereOperator.Equals, 1);
      });

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM "public"."users" AS "u" WHERE NOT EXISTS (SELECT 1 FROM "public"."orders" AS "o" WHERE "o"."user_id" = 1);',
    );
  });

  it('whereRaw', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').whereRaw('"u"."age" > 18');

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" WHERE "u"."age" > 18;');
  });

  it('whereRaws multiple with AND', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .whereRaw('"u"."age" > 18')
      .and()
      .whereRaw('"u"."active" = true');

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM "public"."users" AS "u" WHERE "u"."age" > 18 AND "u"."active" = true;',
    );
  });

  it('where with boolean value', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').where('u', 'active', WhereOperator.Equals, false);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" WHERE "u"."active" = false;');
  });

  it('where equals with parse() - $1 placeholder', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').where('u', 'id', WhereOperator.Equals, 42);

    const sql = builder.parse();
    expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" WHERE "u"."id" = $1;');
  });

  it('where multiple conditions with parse() - $1, $2 placeholders', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'age', WhereOperator.GreaterThan, 18)
      .and()
      .where('u', 'active', WhereOperator.Equals, true);

    const sql = builder.parse();
    expect(sql).toEqual(
      'SELECT * FROM "public"."users" AS "u" WHERE "u"."age" > $1 AND "u"."active" = $2;',
    );
  });

  it('whereBetween with parse() - $1, $2 placeholders', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').whereBetween('u', 'age', 18, 65);

    const sql = builder.parse();
    expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" WHERE "u"."age" BETWEEN $1 AND $2;');
  });

  it('whereInValues with parse() - $1, $2, $3 placeholders', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder.selectAll().fromTable('users', 'u').whereInValues('u', 'id', [1, 2, 3]);

    const sql = builder.parse();
    expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" WHERE "u"."id" IN ($1, $2, $3);');
  });

  it('complex where with parse() - multiple numbered placeholders', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'name', WhereOperator.Equals, 'John')
      .and()
      .where('u', 'age', WhereOperator.GreaterThan, 25)
      .and()
      .whereBetween('u', 'score', 80, 100);

    const sql = builder.parse();
    expect(sql).toEqual(
      'SELECT * FROM "public"."users" AS "u" WHERE "u"."name" = $1 AND "u"."age" > $2 AND "u"."score" BETWEEN $3 AND $4;',
    );
  });

  it('clearWhere resets where state', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .where('u', 'id', WhereOperator.Equals, 1)
      .clearWhere()
      .where('u', 'id', WhereOperator.Equals, 2);

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM "public"."users" AS "u" WHERE "u"."id" = 2;');
  });

  it('whereNotInValues with parse() - $1, $2 placeholders', () => {
    const query = new PostgresQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .whereNotInValues('u', 'status', ['banned', 'suspended']);

    const sql = builder.parse();
    expect(sql).toEqual(
      'SELECT * FROM "public"."users" AS "u" WHERE "u"."status" NOT IN ($1, $2);',
    );
  });
});
