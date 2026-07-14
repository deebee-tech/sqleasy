import { describe, expect, it } from 'vitest';
import { MssqlQuery } from '../../src';

describe('MssqlQuery insert', () => {
  it('insertInto with columns and values (single row)', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .insertInto('users')
      .insertColumns(['name', 'email'])
      .insertValues(['John', 'john@example.com']);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'INSERT INTO [dbo].[users] ([name], [email]) VALUES (John, john@example.com);',
    );
  });

  it('insertInto with multiple rows', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .insertInto('users')
      .insertColumns(['name', 'email'])
      .insertValues(['John', 'john@example.com'])
      .insertValues(['Jane', 'jane@example.com']);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'INSERT INTO [dbo].[users] ([name], [email]) VALUES (John, john@example.com), (Jane, jane@example.com);',
    );
  });

  it('insertIntoWithOwner', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .insertIntoWithOwner('sales', 'users')
      .insertColumns(['name', 'email'])
      .insertValues(['John', 'john@example.com']);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'INSERT INTO [sales].[users] ([name], [email]) VALUES (John, john@example.com);',
    );
  });

  it('insertRaw', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder.insertRaw("INSERT INTO [dbo].[users] ([name]) VALUES ('John')");

    const sql = builder.parseRaw();
    expect(sql).toEqual("INSERT INTO [dbo].[users] ([name]) VALUES ('John');");
  });

  it('insertInto with numeric values', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .insertInto('users')
      .insertColumns(['name', 'age', 'active'])
      .insertValues(['John', 30, true]);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'INSERT INTO [dbo].[users] ([name], [age], [active]) VALUES (John, 30, true);',
    );
  });

  it('insertInto with multiple rows and numeric values', () => {
    const query = new MssqlQuery();
    const builder = query.newBuilder();
    builder
      .insertInto('scores')
      .insertColumns(['user_id', 'score'])
      .insertValues([1, 95])
      .insertValues([2, 87])
      .insertValues([3, 92]);

    const sql = builder.parseRaw();
    expect(sql).toEqual(
      'INSERT INTO [dbo].[scores] ([user_id], [score]) VALUES (1, 95), (2, 87), (3, 92);',
    );
  });
});
