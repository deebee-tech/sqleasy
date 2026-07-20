import { describe, expect, it } from 'vitest';
import { FullTextMode, MssqlQuery, MysqlQuery, PostgresQuery, SqliteQuery } from '../../src';

// `FullTextMode.Phrase` had ZERO corpus coverage on any dialect — the corpus contains "Natural"
// twice, "Boolean" once, and "Phrase" not at all — and no hand-written test either. It was a
// reachable enum member whose behaviour nothing checked, which is how it ended up meaning three
// different things on four engines.
//
// It resolves three different ways, and all three are honest:
//   Postgres — genuinely supports it, and now emits it (phraseto_tsquery, 9.6+)
//   MySQL / MSSQL — express a phrase by quoting the VALUE, not by a mode, so they refuse
//   SQLite — has no phrase form at all and already refused
describe('FullTextMode.Phrase', () => {
  const cols = [{ tableNameOrAlias: 'd', columnName: 'body' }];

  // Postgres was refusing this as "not structured yet". It IS structured: phraseto_tsquery joins
  // the terms with the `<->` distance operator, which is exactly a phrase match. Routing it to
  // plainto_tsquery instead would match the words in any order — the one thing a phrase prevents.
  it('Postgres emits phraseto_tsquery rather than refusing', () => {
    const b = new PostgresQuery().newBuilder();
    b.selectAll().fromTable('docs', 'd').whereMatch(cols, 'exact words', FullTextMode.Phrase);

    const sql = b.parseRaw();
    expect(sql).toContain('phraseto_tsquery');
    expect(sql).not.toContain('plainto_tsquery');
  });

  it('Postgres keeps a distinct function per mode', () => {
    const emit = (mode: FullTextMode) => {
      const b = new PostgresQuery().newBuilder();
      b.selectAll().fromTable('docs', 'd').whereMatch(cols, 'q', mode);
      return b.parseRaw();
    };

    expect(emit(FullTextMode.Natural)).toContain('plainto_tsquery');
    expect(emit(FullTextMode.Boolean)).toContain('to_tsquery');
    expect(emit(FullTextMode.Phrase)).toContain('phraseto_tsquery');

    // All three must differ. Collapsing any two is the defect this file exists to prevent.
    const all = [FullTextMode.Natural, FullTextMode.Boolean, FullTextMode.Phrase].map(emit);
    expect(new Set(all).size).toBe(3);
  });

  // MySQL can search for a phrase, but only by quoting the search STRING:
  // `AGAINST('"a b"' IN BOOLEAN MODE)`. The query text is a bound parameter, so the builder cannot
  // add those quotes without rewriting the caller's value — and it never tried. Phrase emitted
  // exactly the same statement as Boolean, where the words match independently.
  it('MySQL refuses Phrase rather than emitting a Boolean search', () => {
    const b = new MysqlQuery().newBuilder();
    b.selectAll().fromTable('docs', 'd').whereMatch(cols, 'exact words', FullTextMode.Phrase);

    expect(() => b.parseRaw()).toThrow(/MySQL expresses a phrase by quoting the search string/);
  });

  it('MSSQL refuses Phrase rather than emitting a plain CONTAINS', () => {
    const b = new MssqlQuery().newBuilder();
    b.selectAll().fromTable('docs', 'd').whereMatch(cols, 'exact words', FullTextMode.Phrase);

    expect(() => b.parseRaw()).toThrow(
      /MSSQL expresses a phrase by quoting it inside the CONTAINS/,
    );
  });

  it('SQLite still refuses Phrase', () => {
    const b = new SqliteQuery().newBuilder();
    b.selectAll().fromTable('docs', 'd').whereMatch(cols, 'exact words', FullTextMode.Phrase);

    expect(() => b.parseRaw()).toThrow(/SQLite FTS only supports Natural\/Boolean/);
  });

  // The modes that were never broken must stay working on every engine that has them.
  it('Natural and Boolean are unaffected on MySQL', () => {
    const emit = (mode: FullTextMode) => {
      const b = new MysqlQuery().newBuilder();
      b.selectAll().fromTable('docs', 'd').whereMatch(cols, 'q', mode);
      return b.parseRaw();
    };

    expect(emit(FullTextMode.Natural)).toContain('IN NATURAL LANGUAGE MODE');
    expect(emit(FullTextMode.Boolean)).toContain('IN BOOLEAN MODE');
  });

  it('Natural and Boolean are unaffected on MSSQL', () => {
    const emit = (mode: FullTextMode) => {
      const b = new MssqlQuery().newBuilder();
      b.selectAll().fromTable('docs', 'd').whereMatch(cols, 'q', mode);
      return b.parseRaw();
    };

    expect(emit(FullTextMode.Natural)).toContain('FREETEXT(');
    expect(emit(FullTextMode.Boolean)).toContain('CONTAINS(');
  });
});
