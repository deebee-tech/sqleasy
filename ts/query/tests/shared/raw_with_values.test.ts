import { describe, expect, it } from 'vitest';
import { JoinOperator, JoinType, MssqlQuery, PostgresQuery, RuntimeConfiguration } from '../../src';

/**
 * A raw fragment used to be text and only text. A caller with `name LIKE ?` had nowhere to put the
 * value, so the value went into the string — which is how a query builder ends up shipping SQL
 * injection, and is exactly what 12Stone's V2 had done at ~94 call sites before this existed.
 *
 * The markers are replaced while the fragment is still being walked, so the value never becomes
 * part of the statement text at all.
 */
describe('raw fragments carrying bound values', () => {
  it('binds a WHERE fragment, in marker order', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('contacts', 'c')
      .whereRaw("c.first_name || ' ' || c.last_name LIKE ?", ['%ada%']);

    const { sql, params } = builder.parsePrepared();

    expect(sql).toContain("c.first_name || ' ' || c.last_name LIKE $1");
    expect(params).toEqual(['%ada%']);
  });

  it('binds an ON fragment', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('orders', 'o')
      .joinTable(JoinType.Left, 'customers', 'c', (j) => {
        j.on('o', 'customer_id', JoinOperator.Equals, 'c', 'id');
        j.and();
        j.onRaw('COALESCE(c.tier, ?) = ?', [0, 3]);
      });

    const { sql, params } = builder.parsePrepared();

    expect(sql).toContain('COALESCE(c.tier, $1) = $2');
    expect(params).toEqual([0, 3]);
  });

  it('keeps a raw fragment interleaved with structured predicates in emission order', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('contacts', 'c')
      .where('c', 'campus_id', 'Equals' as never, 10)
      .and()
      .whereRaw('EXTRACT(YEAR FROM c.created) = ?', [2026])
      .and()
      .where('c', 'status_id', 'Equals' as never, 3);

    const { params } = builder.parsePrepared();

    // The raw fragment's value sits between the two structured ones, not appended after them.
    expect(params).toEqual([10, 2026, 3]);
  });

  /**
   * The reason a fragment is not always scanned for `?`. A question mark in the fragment's TEXT is
   * ordinary, and tearing one out to make room for a value nobody supplied would corrupt the SQL —
   * so markers are only looked for when the caller actually passed values.
   */
  it('leaves a literal question mark alone when no values are supplied', () => {
    const builder = new PostgresQuery().newBuilder();
    builder.selectAll().fromTable('notes', 'n').whereRaw("n.body LIKE '%why?%'");

    const { sql, params } = builder.parsePrepared();

    expect(sql).toContain("n.body LIKE '%why?%'");
    expect(params).toEqual([]);
  });

  it('takes an escaped marker as a literal question mark', () => {
    const builder = new PostgresQuery().newBuilder();
    builder
      .selectAll()
      .fromTable('notes', 'n')
      .whereRaw("n.body LIKE '%why\\?%' AND n.id = ?", [7]);

    const { sql, params } = builder.parsePrepared();

    expect(sql).toContain("n.body LIKE '%why?%'");
    expect(sql).toContain('n.id = $1');
    expect(params).toEqual([7]);
  });

  // Binding what it can and leaving the rest dangling is the failure that surfaces far from here,
  // as a driver error about a parameter count nobody can trace back to a fragment.
  it.each([
    { name: 'too few values', raw: 'a = ? AND b = ?', values: [1] },
    { name: 'too many values', raw: 'a = ?', values: [1, 2] },
  ])('refuses a marker/value count mismatch: $name', ({ raw, values }) => {
    const builder = new PostgresQuery().newBuilder();
    builder.selectAll().fromTable('t', 't').whereRaw(raw, values);

    expect(() => builder.parsePrepared()).toThrow(/value marker\(s\) but .* value\(s\)/);
  });

  it('inlines the values under parseRaw, like every other value', () => {
    const builder = new PostgresQuery().newBuilder();
    builder.selectAll().fromTable('t', 't').whereRaw('t.n = ?', [42]);

    expect(builder.parseRaw()).toContain('t.n = 42');
  });

  it('MSSQL bound mode renders the fragment with @pN', () => {
    const rc = new RuntimeConfiguration();
    rc.mssqlBoundParameters = true;
    const builder = new MssqlQuery(rc).newBuilder();
    builder
      .selectAll()
      .fromTable('Contacts', 'c')
      .whereRaw("c.First_Name + ' ' + c.Last_Name LIKE ?", ['%ada%']);

    const { sql, params } = builder.parsePrepared();

    expect(sql).toContain("c.First_Name + ' ' + c.Last_Name LIKE @p0");
    expect(params).toEqual(['%ada%']);
  });
});
