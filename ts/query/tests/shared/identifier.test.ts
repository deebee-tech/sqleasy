import { describe, expect, it } from 'vitest';
import { qualifiedColumn, quoteIdentifier } from '../../src/helpers/identifier';

// Delimiter pairs as each dialect declares them: MSSQL [ ], Postgres " ", MySQL ` `.
const mssql = { begin: '[', end: ']' };
const postgres = { begin: '"', end: '"' };
const mysql = { begin: '`', end: '`' };

describe('quoteIdentifier', () => {
  it('leaves a well-formed identifier untouched (just wrapped)', () => {
    expect(quoteIdentifier('column', mssql)).toBe('[column]');
    expect(quoteIdentifier('customers', postgres)).toBe('"customers"');
    expect(quoteIdentifier('order_id', mysql)).toBe('`order_id`');
  });

  it('escapes the closing delimiter by doubling it — injection cannot break out', () => {
    // Without escaping, `[x] OR [1=1]` would close the identifier and inject a predicate.
    expect(quoteIdentifier('x] OR [1=1', mssql)).toBe('[x]] OR [1=1]');
    expect(quoteIdentifier('x" FROM secret--', postgres)).toBe('"x"" FROM secret--"');
    expect(quoteIdentifier('a`b', mysql)).toBe('`a``b`');
  });

  it('rejects a NUL byte rather than emitting an identifier a driver could truncate', () => {
    expect(() => quoteIdentifier('bad\0name', mssql)).toThrow(/NUL/);
  });
});

describe('qualifiedColumn', () => {
  it('qualifies with the table or alias when there is one', () => {
    expect(qualifiedColumn('o', 'total', postgres)).toBe('"o"."total"');
    expect(qualifiedColumn('orders', 'total', mssql)).toBe('[orders].[total]');
    expect(qualifiedColumn('o', 'total', mysql)).toBe('`o`.`total`');
  });

  // The empty alias means "unqualified" — the convention `fromTable(name, '')` has always used.
  // Concatenating it produced a zero-length delimited identifier, which Postgres and SQLite reject
  // outright and MySQL silently ACCEPTS: the same builder output ran on one dialect and was refused
  // by the others. Regression guard for that; see the rationale on qualifiedColumn.
  it('omits the prefix entirely for an empty alias rather than emitting an empty identifier', () => {
    expect(qualifiedColumn('', 'total', postgres)).toBe('"total"');
    expect(qualifiedColumn('', 'total', mssql)).toBe('[total]');
    expect(qualifiedColumn('', 'total', mysql)).toBe('`total`');
  });

  it('treats a nullish alias the same as an empty one', () => {
    expect(qualifiedColumn(undefined, 'total', postgres)).toBe('"total"');
  });

  it('still escapes both halves', () => {
    expect(qualifiedColumn('a"b', 'c"d', postgres)).toBe('"a""b"."c""d"');
  });
});
