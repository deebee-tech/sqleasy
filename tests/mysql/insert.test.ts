import { describe, expect, it } from 'vitest';
import { MysqlQuery } from '../../src';

describe('MysqlQuery insert', () => {
  it('insertInto with single row', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .insertInto('users')
      .insertColumns(['name', 'email', 'age'])
      .insertValues(['Alice', 'alice@example.com', 30]);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'INSERT INTO `users` (`name`, `email`, `age`) VALUES (Alice, alice@example.com, 30);',
    );
  });

  it('insertInto with multiple rows', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .insertInto('users')
      .insertColumns(['name', 'email'])
      .insertValues(['Alice', 'alice@example.com'])
      .insertValues(['Bob', 'bob@example.com']);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'INSERT INTO `users` (`name`, `email`) VALUES (Alice, alice@example.com), (Bob, bob@example.com);',
    );
  });

  it('insertInto with numeric values', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .insertInto('products')
      .insertColumns(['name', 'price', 'quantity'])
      .insertValues(['Widget', 9.99, 100]);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'INSERT INTO `products` (`name`, `price`, `quantity`) VALUES (Widget, 9.99, 100);',
    );
  });

  it('insertInto with boolean values', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder.insertInto('users').insertColumns(['name', 'active']).insertValues(['Alice', true]);

    const sql = builder.parseRaw();
    expect(sql).toEqual('INSERT INTO `users` (`name`, `active`) VALUES (Alice, true);');
  });

  it('insertRaw', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder.insertRaw("INSERT INTO `users` (`name`) VALUES ('Alice')");

    const sql = builder.parseRaw();
    expect(sql).toEqual("INSERT INTO `users` (`name`) VALUES ('Alice');");
  });

  it('insertInto without columns', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder.insertInto('users').insertValues(['Alice', 'alice@example.com', 30]);

    const sql = builder.parseRaw();
    expect(sql).toEqual('INSERT INTO `users` VALUES (Alice, alice@example.com, 30);');
  });

  it('insertInto with three rows', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder
      .insertInto('users')
      .insertColumns(['name', 'age'])
      .insertValues(['Alice', 25])
      .insertValues(['Bob', 30])
      .insertValues(['Charlie', 35]);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'INSERT INTO `users` (`name`, `age`) VALUES (Alice, 25), (Bob, 30), (Charlie, 35);',
    );
  });

  it('insertIntoWithOwner with non-empty owner throws', () => {
    const query = new MysqlQuery();
    const builder = query.newBuilder();
    builder.insertIntoWithOwner('mydb', 'users').insertColumns(['name']).insertValues(['Alice']);

    expect(() => builder.parseRaw()).toThrow('MySQL does not support table owners');
  });
});
