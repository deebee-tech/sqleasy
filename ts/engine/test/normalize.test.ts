import { describe, expect, it } from 'vitest';
import {
  canonicalDate,
  canonicalInstant,
  canonicalTimestamp,
  normalizeRow,
  normalizeValue,
  type ColumnKinds,
} from '../src/normalize';

/**
 * Unit-level guards for the canonical temporal forms.
 *
 * The corpus is the contract and it runs against real databases; this file pins the two decisions a
 * corpus case cannot reach, because both are about what happens when the engine does NOT know
 * something — and a golden can only assert what it does know.
 */
describe('canonical temporal forms', () => {
  // 2024-04-01T10:00:00 UTC. Its LOCAL components differ from its UTC components on any machine that
  // is not on UTC, which is what makes the `components` argument observable.
  const value = new Date(Date.UTC(2024, 3, 1, 10, 0, 0));

  it('reads the half of the Date the driver put the digits in', () => {
    expect(canonicalTimestamp(value, 'utc')).toBe('2024-04-01T10:00:00');
    expect(canonicalDate(value, 'utc')).toBe('2024-04-01');
  });

  it('renders an instant in UTC, with the designator', () => {
    expect(canonicalInstant(value)).toBe('2024-04-01T10:00:00Z');
  });

  it('keeps a non-zero millisecond part and drops a zero one', () => {
    expect(canonicalTimestamp(new Date(Date.UTC(2024, 3, 1, 10, 0, 0, 250)), 'utc')).toBe(
      '2024-04-01T10:00:00.250',
    );
    expect(canonicalTimestamp(value, 'utc')).toBe('2024-04-01T10:00:00');
  });

  it('gives a DATE no invented midnight', () => {
    expect(canonicalDate(value, 'utc')).not.toContain('T');
  });
});

describe('normalizeValue', () => {
  const value = new Date(Date.UTC(2024, 3, 1, 10, 0, 0));

  /**
   * THE REFUSAL. An unidentified temporal is returned untouched rather than guessed at, because
   * guessing is what produced the bug this module was rewritten to fix: every `Date` used to be
   * flattened into the zone-less form, which silently shifted a `timestamptz` into the reader's zone
   * and gave a `DATE` a midnight it never had.
   */
  it('leaves a Date alone when the column kind is unknown', () => {
    expect(normalizeValue(value)).toBe(value);
    expect(normalizeValue(value, undefined)).toBe(value);
  });

  it('never touches a value that is not a Date', () => {
    // Including a string that LOOKS like a timestamp — a `note` column holding "2024-04-01" is text
    // a user typed, and rewriting it to look tidy would be data corruption.
    for (const other of ['2024-04-01', '19.99', 42, 0n, true, null, undefined]) {
      expect(normalizeValue(other, 'naive')).toBe(other);
    }
  });
});

describe('normalizeRow', () => {
  it('normalizes only the columns it was given kinds for, and keeps key order', () => {
    const kinds: ColumnKinds = new Map([
      ['created', 'naive'],
      ['due', 'date'],
      ['seen_at', 'instant'],
    ]);
    const at = new Date(Date.UTC(2024, 3, 1, 10, 0, 0));
    const row = { id: 7, created: at, due: at, seen_at: at, untyped: at, note: 'hello' };

    const out = normalizeRow(row, kinds, 'utc') as Record<string, unknown>;

    expect(Object.keys(out)).toEqual(['id', 'created', 'due', 'seen_at', 'untyped', 'note']);
    expect(out.created).toBe('2024-04-01T10:00:00');
    expect(out.due).toBe('2024-04-01');
    expect(out.seen_at).toBe('2024-04-01T10:00:00Z');
    // No kind was supplied for `untyped`, so it survives as the driver's own object.
    expect(out.untyped).toBe(at);
    expect(out.note).toBe('hello');
  });
});
