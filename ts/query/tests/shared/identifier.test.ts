import { describe, expect, it } from 'vitest';
import { quoteIdentifier } from '../../src/helpers/identifier';

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
