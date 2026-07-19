import { describe, expect, it } from 'vitest';
import { PLACEHOLDER_TOKEN, SqlHelper } from '../../src/helpers/sql';
import { ParserMode } from '../../src/enums/parser-mode';

describe('SqlHelper', () => {
  describe('addSqlSnippet', () => {
    it('appends SQL correctly', () => {
      const helper = new SqlHelper(ParserMode.Prepared);
      helper.addSqlSnippet('SELECT ');
      helper.addSqlSnippet('* FROM users');
      expect(helper.getSql()).toBe('SELECT * FROM users');
    });

    it('appends multiple snippets in sequence', () => {
      const helper = new SqlHelper(ParserMode.Prepared);
      helper.addSqlSnippet('A');
      helper.addSqlSnippet('B');
      helper.addSqlSnippet('C');
      expect(helper.getSql()).toBe('ABC');
    });
  });

  describe('addDynamicValue', () => {
    // The clause walk emits a dialect-agnostic token, NOT the dialect's own `?`/`$`. The real
    // placeholder is substituted once, at the top-level parse. Emitting `?`/`$` here made a
    // placeholder indistinguishable from the same character inside a caller's raw fragment, and
    // the substitution pass corrupted whichever it hit first. See PLACEHOLDER_TOKEN.
    it('in Prepared mode binds the value and emits the placeholder token (MSSQL)', () => {
      const helper = new SqlHelper(ParserMode.Prepared);
      helper.addDynamicValue('test');
      expect(helper.getSql()).toBe(PLACEHOLDER_TOKEN);
      expect(helper.getValues()).toEqual(['test']);
    });

    it('in Prepared mode binds the value and emits the placeholder token (MySQL)', () => {
      const helper = new SqlHelper(ParserMode.Prepared);
      helper.addDynamicValue(42);
      expect(helper.getSql()).toBe(PLACEHOLDER_TOKEN);
      expect(helper.getValues()).toEqual([42]);
    });

    it('in Prepared mode binds the value and emits the placeholder token (Postgres)', () => {
      const helper = new SqlHelper(ParserMode.Prepared);
      helper.addDynamicValue('hello');
      expect(helper.getSql()).toBe(PLACEHOLDER_TOKEN);
      expect(helper.getValues()).toEqual(['hello']);
    });

    it('emits a token that caller text cannot forge', () => {
      // The token is NUL-delimited; NUL is rejected everywhere caller text enters the SQL.
      expect(PLACEHOLDER_TOKEN).toContain(String.fromCharCode(0));
      expect(PLACEHOLDER_TOKEN).not.toBe('?');
      expect(PLACEHOLDER_TOKEN).not.toBe('$');
    });

    it('in Raw mode inlines a string and binds nothing', () => {
      const helper = new SqlHelper(ParserMode.Raw);
      helper.addDynamicValue('inline');
      expect(helper.getSql()).toBe('inline');
      expect(helper.getValues()).toEqual([]);
    });

    it('in Raw mode inlines a number and binds nothing', () => {
      const helper = new SqlHelper(ParserMode.Raw);
      helper.addDynamicValue(123);
      expect(helper.getSql()).toBe('123');
      expect(helper.getValues()).toEqual([]);
    });

    it('in Raw mode inlines a boolean and binds nothing', () => {
      const helper = new SqlHelper(ParserMode.Raw);
      helper.addDynamicValue(true);
      helper.addSqlSnippet(',');
      helper.addDynamicValue(false);
      expect(helper.getSql()).toBe('true,false');
      expect(helper.getValues()).toEqual([]);
    });

    it('accumulates multiple values in Prepared mode', () => {
      const helper = new SqlHelper(ParserMode.Prepared);
      helper.addDynamicValue('a');
      helper.addDynamicValue('b');
      helper.addDynamicValue('c');
      expect(helper.getValues()).toEqual(['a', 'b', 'c']);
    });
  });

  describe('addSqlSnippetWithValues', () => {
    it('merges values correctly by spreading the array', () => {
      const helper = new SqlHelper(ParserMode.Prepared);
      helper.addSqlSnippetWithValues('WHERE id = ? AND name = ?', [1, 'test']);
      expect(helper.getSql()).toBe('WHERE id = ? AND name = ?');
      expect(helper.getValues()).toEqual([1, 'test']);
    });

    it('appends to existing values', () => {
      const helper = new SqlHelper(ParserMode.Prepared);
      helper.addDynamicValue('existing');
      helper.addSqlSnippetWithValues('AND x = ?', [42]);
      expect(helper.getValues()).toEqual(['existing', 42]);
    });
  });

  describe('getSql', () => {
    it('returns combined SQL string', () => {
      const helper = new SqlHelper(ParserMode.Prepared);
      helper.addSqlSnippet('SELECT * ');
      helper.addSqlSnippet('FROM users ');
      helper.addSqlSnippet('WHERE id = ?');
      expect(helper.getSql()).toBe('SELECT * FROM users WHERE id = ?');
    });

    it('returns empty string when no snippets added', () => {
      const helper = new SqlHelper(ParserMode.Prepared);
      expect(helper.getSql()).toBe('');
    });
  });

  describe('getSqlDebug', () => {
    it('replaces placeholder tokens with values (MSSQL)', () => {
      const helper = new SqlHelper(ParserMode.Prepared);
      helper.addSqlSnippet('SELECT * FROM users WHERE id = ');
      helper.addDynamicValue('42');
      helper.addSqlSnippet(' AND name = ');
      helper.addDynamicValue('Alice');
      expect(helper.getSqlDebug()).toBe('SELECT * FROM users WHERE id = 42 AND name = Alice');
    });

    it('replaces placeholder tokens with values (Postgres)', () => {
      const helper = new SqlHelper(ParserMode.Prepared);
      helper.addSqlSnippet('SELECT * FROM users WHERE id = ');
      helper.addDynamicValue('42');
      helper.addSqlSnippet(' AND name = ');
      helper.addDynamicValue('Alice');
      expect(helper.getSqlDebug()).toBe('SELECT * FROM users WHERE id = 42 AND name = Alice');
    });

    it('returns SQL unchanged when no placeholders exist', () => {
      const helper = new SqlHelper(ParserMode.Raw);
      helper.addSqlSnippet('SELECT * FROM users');
      expect(helper.getSqlDebug()).toBe('SELECT * FROM users');
    });
  });

  describe('getValues', () => {
    it('returns one value per placeholder, preserving null/undefined (no shift)', () => {
      const helper = new SqlHelper(ParserMode.Prepared);
      helper.addDynamicValue('keep');
      helper.addDynamicValue(null);
      helper.addDynamicValue(42);
      helper.addDynamicValue(undefined);
      helper.addDynamicValue('also_keep');
      // One entry per emitted `?` — a null column binds SQL NULL in place, it is not dropped.
      expect(helper.getValues()).toEqual(['keep', null, 42, undefined, 'also_keep']);
    });

    it('returns empty array when no values exist', () => {
      const helper = new SqlHelper(ParserMode.Prepared);
      expect(helper.getValues()).toEqual([]);
    });
  });

  describe('getValueStringFromDataType', () => {
    it('handles string values', () => {
      const helper = new SqlHelper(ParserMode.Raw);
      expect(helper.getValueStringFromDataType('hello')).toBe('hello');
    });

    it('handles number values', () => {
      const helper = new SqlHelper(ParserMode.Raw);
      expect(helper.getValueStringFromDataType(42)).toBe('42');
      expect(helper.getValueStringFromDataType(3.14)).toBe('3.14');
      expect(helper.getValueStringFromDataType(0)).toBe('0');
    });

    it('handles boolean values', () => {
      const helper = new SqlHelper(ParserMode.Raw);
      expect(helper.getValueStringFromDataType(true)).toBe('true');
      expect(helper.getValueStringFromDataType(false)).toBe('false');
    });

    it('handles Date values', () => {
      const helper = new SqlHelper(ParserMode.Raw);
      const date = new Date('2024-01-15T12:00:00.000Z');
      expect(helper.getValueStringFromDataType(date)).toBe('2024-01-15T12:00:00.000Z');
    });

    it('handles object values via JSON.stringify', () => {
      const helper = new SqlHelper(ParserMode.Raw);
      const obj = { key: 'value' };
      expect(helper.getValueStringFromDataType(obj)).toBe('{"key":"value"}');
    });

    it('handles array values via JSON.stringify', () => {
      const helper = new SqlHelper(ParserMode.Raw);
      expect(helper.getValueStringFromDataType([1, 2, 3])).toBe('[1,2,3]');
    });

    it('handles null by returning empty string', () => {
      const helper = new SqlHelper(ParserMode.Raw);
      expect(helper.getValueStringFromDataType(null)).toBe('');
    });

    it('handles undefined by returning empty string', () => {
      const helper = new SqlHelper(ParserMode.Raw);
      expect(helper.getValueStringFromDataType(undefined)).toBe('');
    });
  });

  describe('clear', () => {
    it('resets SQL and values', () => {
      const helper = new SqlHelper(ParserMode.Prepared);
      helper.addSqlSnippet('SELECT * FROM users WHERE id = ');
      helper.addDynamicValue(1);
      expect(helper.getSql()).not.toBe('');
      expect(helper.getValues()).not.toEqual([]);

      helper.clear();
      expect(helper.getSql()).toBe('');
      expect(helper.getValues()).toEqual([]);
    });

    it('allows reuse after clearing', () => {
      const helper = new SqlHelper(ParserMode.Prepared);
      helper.addSqlSnippet('first');
      helper.clear();
      helper.addSqlSnippet('second');
      expect(helper.getSql()).toBe('second');
    });
  });
});
