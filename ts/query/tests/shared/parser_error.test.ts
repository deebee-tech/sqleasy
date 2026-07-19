import { describe, expect, it } from 'vitest';
import { ParserError } from '../../src/helpers/parser-error';
import { ParserArea } from '../../src/enums/parser-area';

describe('ParserError', () => {
  it('creates error with correct name QueryParserError', () => {
    const error = new ParserError(ParserArea.Select, 'test message');
    expect(error.name).toBe('QueryParserError');
  });

  it('message includes ParserArea string for Select', () => {
    const error = new ParserError(ParserArea.Select, 'column is required');
    expect(error.message).toBe('Select: column is required');
  });

  it('message includes ParserArea string for From', () => {
    const error = new ParserError(ParserArea.From, 'table is required');
    expect(error.message).toBe('From: table is required');
  });

  it('message includes ParserArea string for Join', () => {
    const error = new ParserError(ParserArea.Join, 'missing join condition');
    expect(error.message).toBe('Join: missing join condition');
  });

  it('message includes ParserArea string for Where', () => {
    const error = new ParserError(ParserArea.Where, 'invalid operator');
    expect(error.message).toBe('Where: invalid operator');
  });

  it('message includes ParserArea string for Having', () => {
    const error = new ParserError(ParserArea.Having, 'HAVING requires a GROUP BY clause');
    expect(error.message).toBe('Having: HAVING requires a GROUP BY clause');
  });

  it('message includes ParserArea string for OrderBy', () => {
    const error = new ParserError(ParserArea.OrderBy, 'direction required');
    expect(error.message).toBe('OrderBy: direction required');
  });

  it('message includes ParserArea string for LimitOffset', () => {
    const error = new ParserError(ParserArea.LimitOffset, 'invalid limit');
    expect(error.message).toBe('LimitOffset: invalid limit');
  });

  it('message includes ParserArea string for Insert', () => {
    const error = new ParserError(ParserArea.Insert, 'INSERT requires a table');
    expect(error.message).toBe('Insert: INSERT requires a table');
  });

  it('message includes ParserArea string for Update', () => {
    const error = new ParserError(ParserArea.Update, 'UPDATE requires a table');
    expect(error.message).toBe('Update: UPDATE requires a table');
  });

  it('message includes ParserArea string for Delete', () => {
    const error = new ParserError(ParserArea.Delete, 'DELETE requires a table');
    expect(error.message).toBe('Delete: DELETE requires a table');
  });

  it('message includes ParserArea string for General', () => {
    const error = new ParserError(ParserArea.General, 'unknown error');
    expect(error.message).toBe('General: unknown error');
  });

  it('is an instance of Error', () => {
    const error = new ParserError(ParserArea.Select, 'test');
    expect(error).toBeInstanceOf(Error);
  });

  it('is an instance of ParserError', () => {
    const error = new ParserError(ParserArea.Select, 'test');
    expect(error).toBeInstanceOf(ParserError);
  });

  it('can be thrown and caught', () => {
    expect(() => {
      throw new ParserError(ParserArea.Select, 'something went wrong');
    }).toThrow('Select: something went wrong');
  });

  it('can be caught as Error', () => {
    expect(() => {
      throw new ParserError(ParserArea.General, 'fail');
    }).toThrow(Error);
  });
});
