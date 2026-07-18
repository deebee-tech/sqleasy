import { describe, expect, it } from 'vitest';
import {
  JoinOperator,
  JoinType,
  MssqlQuery,
  MysqlQuery,
  PostgresQuery,
  QueryBuilder,
  SqliteQuery,
  WhereOperator,
} from '../../src';

/**
 * Join-backed UPDATE/DELETE (`.join(...)` combined with `.updateTable`/`.deleteFrom`).
 *
 * This used to be silently dropped: the join and its ON conditions were built into
 * `joinStates`/`joinOnStates`, but the UPDATE/DELETE branch of `to-sql.ts` never looked at them —
 * no error, no SQL, and any `onValue` bound value was never bound. It now renders real dialect
 * SQL (MySQL/MSSQL native `JOIN...ON`; Postgres `FROM`/`USING` with the ON condition translated
 * into a `WHERE` predicate; SQLite throws, since it has no multi-table UPDATE/DELETE syntax).
 */
describe('join-backed UPDATE/DELETE', () => {
  const addJoin = (b: QueryBuilder): QueryBuilder =>
    b.joinTable(JoinType.Inner, 'customers', 'c', (j) =>
      j.on('o', 'customer_id', JoinOperator.Equals, 'c', 'id'),
    );

  it('MySQL renders the join right after the target, before SET', () => {
    const builder = new MysqlQuery().newBuilder();
    builder.updateTable('orders', 'o').set('total', 0);
    addJoin(builder);
    builder.where('c', 'banned', WhereOperator.Equals, true);

    expect(builder.parseRaw()).toBe(
      'UPDATE `orders` AS `o` INNER JOIN `customers` AS `c` ON `o`.`customer_id` = `c`.`id` SET `total` = 0 WHERE `c`.`banned` = true;',
    );
  });

  it('MySQL renders a multi-table DELETE the same way', () => {
    const builder = new MysqlQuery().newBuilder();
    builder.deleteFrom('orders', 'o');
    addJoin(builder);
    builder.where('c', 'banned', WhereOperator.Equals, true);

    expect(builder.parseRaw()).toBe(
      'DELETE `o` FROM `orders` AS `o` INNER JOIN `customers` AS `c` ON `o`.`customer_id` = `c`.`id` WHERE `c`.`banned` = true;',
    );
  });

  it('MSSQL renders UPDATE...FROM with a real JOIN', () => {
    const builder = new MssqlQuery().newBuilder();
    builder.updateTable('orders', 'o').set('total', 0);
    addJoin(builder);
    builder.where('c', 'banned', WhereOperator.Equals, true);

    expect(builder.parseRaw()).toBe(
      'UPDATE [o] SET [total] = 0 FROM [dbo].[orders] AS [o] INNER JOIN [dbo].[customers] AS [c] ON [o].[customer_id] = [c].[id] WHERE [c].[banned] = true;',
    );
  });

  it('MSSQL renders DELETE...FROM with a real JOIN', () => {
    const builder = new MssqlQuery().newBuilder();
    builder.deleteFrom('orders', 'o');
    addJoin(builder);
    builder.where('c', 'banned', WhereOperator.Equals, true);

    expect(builder.parseRaw()).toBe(
      'DELETE [o] FROM [dbo].[orders] AS [o] INNER JOIN [dbo].[customers] AS [c] ON [o].[customer_id] = [c].[id] WHERE [c].[banned] = true;',
    );
  });

  it('MSSQL still uses the FROM/JOIN form even without an explicit target alias', () => {
    const builder = new MssqlQuery().newBuilder();
    builder.updateTable('orders', '').set('total', 0);
    builder.joinTable(JoinType.Inner, 'customers', 'c', (j) =>
      j.on('orders', 'customer_id', JoinOperator.Equals, 'c', 'id'),
    );

    expect(builder.parseRaw()).toBe(
      'UPDATE [dbo].[orders] SET [total] = 0 FROM [dbo].[orders] INNER JOIN [dbo].[customers] AS [c] ON [orders].[customer_id] = [c].[id];',
    );
  });

  it("Postgres translates the ON condition into a WHERE predicate, ANDed with the caller's own WHERE", () => {
    const builder = new PostgresQuery().newBuilder();
    builder.updateTable('orders', 'o').set('total', 0);
    addJoin(builder);
    builder.where('c', 'banned', WhereOperator.Equals, true);

    expect(builder.parseRaw()).toBe(
      'UPDATE "public"."orders" AS "o" SET "total" = 0 FROM "public"."customers" AS "c" ' +
        'WHERE "o"."customer_id" = "c"."id" AND "c"."banned" = true;',
    );
  });

  it('Postgres DELETE...USING mirrors UPDATE...FROM', () => {
    const builder = new PostgresQuery().newBuilder();
    builder.deleteFrom('orders', 'o');
    addJoin(builder);
    builder.where('c', 'banned', WhereOperator.Equals, true);

    expect(builder.parseRaw()).toBe(
      'DELETE FROM "public"."orders" AS "o" USING "public"."customers" AS "c" ' +
        'WHERE "o"."customer_id" = "c"."id" AND "c"."banned" = true;',
    );
  });

  it('Postgres omits the WHERE predicate for a CROSS JOIN (no ON condition to translate)', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .updateTable('orders', 'o')
      .set('flagged', true)
      .joinTable(JoinType.Cross, 'flags', 'f', () => {});

    expect(builder.parseRaw()).toBe(
      'UPDATE "public"."orders" AS "o" SET "flagged" = true FROM "public"."flags" AS "f";',
    );
  });

  it('Postgres rejects an OUTER join, since translating it to WHERE would silently make it an INNER join', () => {
    const builder = new PostgresQuery().newBuilder();
    builder.updateTable('orders', 'o').set('total', 0);
    builder.joinTable(JoinType.Left, 'customers', 'c', (j) =>
      j.on('o', 'customer_id', JoinOperator.Equals, 'c', 'id'),
    );

    expect(() => builder.parseRaw()).toThrow('only supports INNER or CROSS joins');
  });

  it('SQLite rejects a join-backed UPDATE outright', () => {
    const builder = new SqliteQuery().newBuilder();
    builder.updateTable('orders', 'o').set('total', 0);
    addJoin(builder);

    expect(() => builder.parseRaw()).toThrow('SQLite does not support joins in UPDATE/DELETE');
  });

  it('SQLite rejects a join-backed DELETE outright', () => {
    const builder = new SqliteQuery().newBuilder();
    builder.deleteFrom('orders', 'o');
    addJoin(builder);

    expect(() => builder.parseRaw()).toThrow('SQLite does not support joins in UPDATE/DELETE');
  });

  it('Postgres ANDs the predicates of two separate joins and comma-separates their FROM items', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .updateTable('orders', 'o')
      .set('total', 0)
      .joinTable(JoinType.Inner, 'customers', 'c', (j) =>
        j.on('o', 'customer_id', JoinOperator.Equals, 'c', 'id'),
      )
      .joinTable(JoinType.Inner, 'regions', 'r', (j) =>
        j.on('c', 'region_id', JoinOperator.Equals, 'r', 'id'),
      );

    expect(builder.parseRaw()).toBe(
      'UPDATE "public"."orders" AS "o" SET "total" = 0 FROM "public"."customers" AS "c", "public"."regions" AS "r" ' +
        'WHERE "o"."customer_id" = "c"."id" AND "c"."region_id" = "r"."id";',
    );
  });

  it('Postgres parenthesizes a join whose ON list has more than one condition, so AND/OR precedence survives combining it with other joins', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .updateTable('orders', 'o')
      .set('total', 0)
      .joinTable(JoinType.Inner, 'customers', 'c', (j) =>
        j
          .on('o', 'customer_id', JoinOperator.Equals, 'c', 'id')
          .or()
          .onValue('c', 'vip', JoinOperator.Equals, true),
      );

    expect(builder.parseRaw()).toBe(
      'UPDATE "public"."orders" AS "o" SET "total" = 0 FROM "public"."customers" AS "c" ' +
        'WHERE ("o"."customer_id" = "c"."id" OR "c"."vip" = true);',
    );
  });

  it('Postgres accepts a subquery join target as a FROM item', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .updateTable('orders', 'o')
      .set('total', 0)
      .joinWithBuilder(
        JoinType.Inner,
        'c',
        (sub) => sub.selectColumn('customers', 'id', '').fromTable('customers', 'customers'),
        (j) => j.on('o', 'customer_id', JoinOperator.Equals, 'c', 'id'),
      );

    expect(builder.parseRaw()).toBe(
      'UPDATE "public"."orders" AS "o" SET "total" = 0 ' +
        'FROM (SELECT "customers"."id" FROM "public"."customers" AS "customers") AS "c" ' +
        'WHERE "o"."customer_id" = "c"."id";',
    );
  });

  it('Postgres rejects a raw JOIN fragment in a join-backed UPDATE/DELETE', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .updateTable('orders', 'o')
      .set('total', 0)
      .joinRaw('JOIN customers c ON o.customer_id = c.id');

    expect(() => builder.parseRaw()).toThrow('Raw JOIN fragments are not supported');
  });

  it('a plain (non-join) UPDATE/DELETE on every dialect is unaffected', () => {
    for (const Query of [MssqlQuery, MysqlQuery, PostgresQuery, SqliteQuery]) {
      const builder = new Query().newBuilder();
      builder.updateTable('orders', 'o').set('total', 0).where('o', 'id', WhereOperator.Equals, 1);
      expect(() => builder.parseRaw()).not.toThrow();
    }
  });
});
