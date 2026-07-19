import { describe, expect, it } from 'vitest';
import { DatabaseType, Fn } from '../../src';

/**
 * The `Fn` scalar surface — pure per-dialect emit helpers. These assert the exact SQL string per
 * dialect; the Dart port asserts the byte-identical strings in `test/expression/scalar_test.dart`,
 * so any divergence between the two implementations shows up as one of these expectations going red.
 */
describe('Fn.concat', () => {
  it('MSSQL uses native CONCAT (already NULL-skipping)', () => {
    expect(Fn.concat(['a', 'b'], DatabaseType.Mssql)).toBe('CONCAT(a, b)');
  });
  it('Postgres casts each operand to text and coalesces to ""', () => {
    expect(Fn.concat(['a', 'b'], DatabaseType.Postgres)).toBe(
      "(COALESCE(CAST(a AS text), '') || COALESCE(CAST(b AS text), ''))",
    );
  });
  it('MySQL wraps coalesced operands in CONCAT', () => {
    expect(Fn.concat(['a', 'b'], DatabaseType.Mysql)).toBe(
      "CONCAT(COALESCE(a, ''), COALESCE(b, ''))",
    );
  });
  it('SQLite joins coalesced operands with ||', () => {
    expect(Fn.concat(['a', 'b'], DatabaseType.Sqlite)).toBe("(COALESCE(a, '') || COALESCE(b, ''))");
  });
});

describe('Fn.charLength', () => {
  it('MSSQL LEN, MySQL CHAR_LENGTH, else LENGTH (characters, not bytes)', () => {
    expect(Fn.charLength('c', DatabaseType.Mssql)).toBe('LEN(c)');
    expect(Fn.charLength('c', DatabaseType.Mysql)).toBe('CHAR_LENGTH(c)');
    expect(Fn.charLength('c', DatabaseType.Postgres)).toBe('LENGTH(c)');
    expect(Fn.charLength('c', DatabaseType.Sqlite)).toBe('LENGTH(c)');
  });
});

describe('Fn.round', () => {
  it('Postgres casts to numeric (no float overload); others round directly', () => {
    expect(Fn.round('x', 2, DatabaseType.Postgres)).toBe('ROUND(CAST(x AS numeric), 2)');
    expect(Fn.round('x', 2, DatabaseType.Mysql)).toBe('ROUND(x, 2)');
    expect(Fn.round('x', '0', DatabaseType.Sqlite)).toBe('ROUND(x, 0)');
    expect(Fn.round('x', 0, DatabaseType.Mssql)).toBe('ROUND(x, 0)');
  });
});

describe('Fn.now', () => {
  it('emits each dialect current-timestamp expression', () => {
    expect(Fn.now(DatabaseType.Mssql)).toBe('GETDATE()');
    expect(Fn.now(DatabaseType.Mysql)).toBe('NOW()');
    expect(Fn.now(DatabaseType.Sqlite)).toBe("datetime('now')");
    expect(Fn.now(DatabaseType.Postgres)).toBe('CURRENT_TIMESTAMP');
    expect(Fn.now(DatabaseType.Unknown)).toBe('CURRENT_TIMESTAMP');
  });
});

describe('Fn.divide', () => {
  it('forces fractional division on the integer-division dialects, leaves MySQL as a plain /', () => {
    expect(Fn.divide('n', 'd', DatabaseType.Postgres)).toBe('(CAST(n AS numeric) / d)');
    expect(Fn.divide('n', 'd', DatabaseType.Mssql)).toBe('(CAST(n AS decimal(38, 10)) / d)');
    expect(Fn.divide('n', 'd', DatabaseType.Sqlite)).toBe('(CAST(n AS REAL) / d)');
    expect(Fn.divide('n', 'd', DatabaseType.Mysql)).toBe('(n / d)');
  });
});
