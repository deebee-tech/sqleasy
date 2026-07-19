import { describe, expect, it } from 'vitest';
import { JoinOperator, JoinType, MysqlQuery } from '../../src';

describe('MysqlQuery join', () => {
  it('INNER JOIN', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .joinTable(JoinType.Inner, 'orders', 'o', (jb) => {
        jb.on('u', 'id', JoinOperator.Equals, 'o', 'user_id');
      });

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM `users` AS `u` INNER JOIN `orders` AS `o` ON `u`.`id` = `o`.`user_id`;',
    );
  });

  it('LEFT JOIN', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .joinTable(JoinType.Left, 'orders', 'o', (jb) => {
        jb.on('u', 'id', JoinOperator.Equals, 'o', 'user_id');
      });

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM `users` AS `u` LEFT JOIN `orders` AS `o` ON `u`.`id` = `o`.`user_id`;',
    );
  });

  it('LEFT OUTER JOIN', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .joinTable(JoinType.LeftOuter, 'orders', 'o', (jb) => {
        jb.on('u', 'id', JoinOperator.Equals, 'o', 'user_id');
      });

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM `users` AS `u` LEFT OUTER JOIN `orders` AS `o` ON `u`.`id` = `o`.`user_id`;',
    );
  });

  it('RIGHT JOIN', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .joinTable(JoinType.Right, 'orders', 'o', (jb) => {
        jb.on('u', 'id', JoinOperator.Equals, 'o', 'user_id');
      });

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM `users` AS `u` RIGHT JOIN `orders` AS `o` ON `u`.`id` = `o`.`user_id`;',
    );
  });

  it('RIGHT OUTER JOIN', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .joinTable(JoinType.RightOuter, 'orders', 'o', (jb) => {
        jb.on('u', 'id', JoinOperator.Equals, 'o', 'user_id');
      });

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM `users` AS `u` RIGHT OUTER JOIN `orders` AS `o` ON `u`.`id` = `o`.`user_id`;',
    );
  });

  it('FULL OUTER JOIN throws', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .joinTable(JoinType.FullOuter, 'orders', 'o', (jb) => {
        jb.on('u', 'id', JoinOperator.Equals, 'o', 'user_id');
      });

    expect(() => builder.parseRaw()).toThrow('MySQL does not support FULL OUTER JOIN');
  });

  it('joinTableWithOwner with non-empty owner throws', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .joinTableWithOwner(JoinType.Inner, 'mydb', 'orders', 'o', (jb) => {
        jb.on('u', 'id', JoinOperator.Equals, 'o', 'user_id');
      });

    expect(() => builder.parseRaw()).toThrow('MySQL does not support table owners');
  });

  it('CROSS JOIN', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .joinTable(JoinType.Cross, 'roles', 'r', () => {});

    const sql = builder.parseRaw();
    expect(sql).toEqual('SELECT * FROM `users` AS `u` CROSS JOIN `roles` AS `r`;');
  });

  it('joinRaw', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .joinRaw('INNER JOIN `orders` AS `o` ON `u`.`id` = `o`.`user_id`');

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM `users` AS `u` INNER JOIN `orders` AS `o` ON `u`.`id` = `o`.`user_id`;',
    );
  });

  it('joinRaws', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .joinRaws([
        'INNER JOIN `orders` AS `o` ON `u`.`id` = `o`.`user_id`',
        'LEFT JOIN `products` AS `p` ON `o`.`product_id` = `p`.`id`',
      ]);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM `users` AS `u` ' +
        'INNER JOIN `orders` AS `o` ON `u`.`id` = `o`.`user_id` ' +
        'LEFT JOIN `products` AS `p` ON `o`.`product_id` = `p`.`id`;',
    );
  });

  it('ON with AND', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .joinTable(JoinType.Inner, 'orders', 'o', (jb) => {
        jb.on('u', 'id', JoinOperator.Equals, 'o', 'user_id')
          .and()
          .on('u', 'tenant_id', JoinOperator.Equals, 'o', 'tenant_id');
      });

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM `users` AS `u` INNER JOIN `orders` AS `o` ON ' +
        '`u`.`id` = `o`.`user_id` AND `u`.`tenant_id` = `o`.`tenant_id`;',
    );
  });

  it('ON with OR', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .joinTable(JoinType.Inner, 'orders', 'o', (jb) => {
        jb.on('u', 'id', JoinOperator.Equals, 'o', 'user_id')
          .or()
          .on('u', 'id', JoinOperator.Equals, 'o', 'alt_user_id');
      });

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM `users` AS `u` INNER JOIN `orders` AS `o` ON ' +
        '`u`.`id` = `o`.`user_id` OR `u`.`id` = `o`.`alt_user_id`;',
    );
  });

  it('ON with onGroup produces grouped parentheses', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .joinTable(JoinType.Inner, 'orders', 'o', (jb) => {
        jb.on('u', 'id', JoinOperator.Equals, 'o', 'user_id')
          .and()
          .onGroup((gb) => {
            gb.on('o', 'status', JoinOperator.Equals, 'u', 'default_status')
              .or()
              .on('o', 'type', JoinOperator.Equals, 'u', 'default_type');
          });
      });

    const sql = builder.parseRaw();
    // Previously asserted `AND ()` — the group's conditions were built into a child JoinOnBuilder
    // that was then discarded, so the predicate silently vanished and the join matched the wrong
    // rows. The test name was right; the expectation was pinning the bug.
    expect(sql).toEqual(
      'SELECT * FROM `users` AS `u` INNER JOIN `orders` AS `o` ON ' +
        '`u`.`id` = `o`.`user_id` AND (`o`.`status` = `u`.`default_status` ' +
        'OR `o`.`type` = `u`.`default_type`);',
    );
  });

  it('ON with onValue', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .joinTable(JoinType.Inner, 'orders', 'o', (jb) => {
        jb.on('u', 'id', JoinOperator.Equals, 'o', 'user_id')
          .and()
          .onValue('o', 'status', JoinOperator.Equals, 'active');
      });

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM `users` AS `u` INNER JOIN `orders` AS `o` ON ' +
        '`u`.`id` = `o`.`user_id` AND `o`.`status` = active;',
    );
  });

  it('ON with onValue numeric', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .joinTable(JoinType.Inner, 'orders', 'o', (jb) => {
        jb.on('u', 'id', JoinOperator.Equals, 'o', 'user_id')
          .and()
          .onValue('o', 'amount', JoinOperator.GreaterThan, 100);
      });

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM `users` AS `u` INNER JOIN `orders` AS `o` ON ' +
        '`u`.`id` = `o`.`user_id` AND `o`.`amount` > 100;',
    );
  });

  it('ON with onRaw', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .joinTable(JoinType.Inner, 'orders', 'o', (jb) => {
        jb.onRaw('`u`.`id` = `o`.`user_id`');
      });

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM `users` AS `u` INNER JOIN `orders` AS `o` ON `u`.`id` = `o`.`user_id`;',
    );
  });

  it('multiple joins', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .joinTable(JoinType.Inner, 'orders', 'o', (jb) => {
        jb.on('u', 'id', JoinOperator.Equals, 'o', 'user_id');
      })
      .joinTable(JoinType.Left, 'products', 'p', (jb) => {
        jb.on('o', 'product_id', JoinOperator.Equals, 'p', 'id');
      });

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM `users` AS `u` ' +
        'INNER JOIN `orders` AS `o` ON `u`.`id` = `o`.`user_id` ' +
        'LEFT JOIN `products` AS `p` ON `o`.`product_id` = `p`.`id`;',
    );
  });

  it('joinTables', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .joinTables([
        {
          joinType: JoinType.Inner,
          tableName: 'orders',
          alias: 'o',
          joinOnBuilder: (jb) => {
            jb.on('u', 'id', JoinOperator.Equals, 'o', 'user_id');
          },
        },
        {
          joinType: JoinType.Left,
          tableName: 'products',
          alias: 'p',
          joinOnBuilder: (jb) => {
            jb.on('o', 'product_id', JoinOperator.Equals, 'p', 'id');
          },
        },
      ]);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM `users` AS `u` ' +
        'INNER JOIN `orders` AS `o` ON `u`.`id` = `o`.`user_id` ' +
        'LEFT JOIN `products` AS `p` ON `o`.`product_id` = `p`.`id`;',
    );
  });

  it('joinWithBuilder (subquery join)', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .joinWithBuilder(
        JoinType.Inner,
        'recent_orders',
        (sb) => {
          sb.selectAll().fromTable('orders', 'o');
        },
        (jb) => {
          jb.on('u', 'id', JoinOperator.Equals, 'recent_orders', 'user_id');
        },
      );

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM `users` AS `u` ' +
        'INNER JOIN (SELECT * FROM `orders` AS `o`) AS `recent_orders` ' +
        'ON `u`.`id` = `recent_orders`.`user_id`;',
    );
  });

  it('ON with NotEquals operator', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .joinTable(JoinType.Inner, 'orders', 'o', (jb) => {
        jb.on('u', 'id', JoinOperator.NotEquals, 'o', 'excluded_user_id');
      });

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM `users` AS `u` INNER JOIN `orders` AS `o` ON `u`.`id` <> `o`.`excluded_user_id`;',
    );
  });

  it('ON with LessThan operator', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .selectAll()
      .fromTable('users', 'u')
      .joinTable(JoinType.Inner, 'orders', 'o', (jb) => {
        jb.on('u', 'created_at', JoinOperator.LessThan, 'o', 'created_at');
      });

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'SELECT * FROM `users` AS `u` INNER JOIN `orders` AS `o` ON `u`.`created_at` < `o`.`created_at`;',
    );
  });
});
