/**
 * Corpus D — SCHEMA INTROSPECTION: the canonical shape a catalog read must produce, whatever engine
 * holds the schema.
 *
 * Corpus A pins what SQL the builder EMITS. Corpus C pins what the engine HANDS BACK after running
 * it. This pins what the engine says the DATABASE ITSELF looks like — the third thing a port can
 * silently get wrong, and the one with no user-visible symptom until someone generates code from it.
 *
 * The subject is `harness/seed/*.sql`: ONE logical schema written four ways (customers + orders +
 * an active_customers view, with a primary key, a foreign key, a unique index, a secondary index,
 * and a DEFAULT). Because the four renderings describe the same thing, almost every field of the
 * answer must come back identical — and the handful that cannot are the point of this corpus.
 *
 * ── SHARED BY DEFAULT, DIVERGENT ONLY WHERE STATED ──
 * Every field below is written ONCE as a plain value when all four dialects agree. Where they
 * genuinely differ, the value becomes a map keyed by dialect and EVERY dialect must appear. There is
 * no partial map and no fallback: a divergence is either spelled out in full or it does not exist.
 * That is what makes this file readable as a comparison table rather than a pile of exceptions.
 *
 * ── WHAT LEGITIMATELY DIVERGES, AND WHY ──
 *   • dataType — the catalog's own words, verbatim. Postgres says `timestamp without time zone`
 *     where MySQL says `datetime`; SQLite reports the DECLARED text including its length, because
 *     that is literally what `CREATE TABLE` wrote. Normalizing these to a common vocabulary would
 *     invent a type nobody declared, which is the exact failure this project refuses.
 *   • index names — Postgres derives `customers_pkey`, MySQL calls every primary key `PRIMARY`, and
 *     SQLite's `INTEGER PRIMARY KEY` is the rowid itself, so there is NO backing index to report.
 *     A null name is that last case: not "unknown", but "this engine has no such index".
 *   • nullability — SQLite does NOT mark its rowid primary key `NOT NULL`. `pragma_table_info` reports
 *     `notnull = 0` for `INTEGER PRIMARY KEY`, and the reader honours the pragma rather than
 *     "correcting" it, because SQLite genuinely permits NULL in a non-INTEGER primary key and a
 *     reader that assumed otherwise would misreport those. A view is looser still: Postgres declines
 *     to prove non-nullability through one and calls every view column nullable, where MySQL and SQL
 *     Server carry the base column's own answer through.
 *   • MySQL's phantom defaults — MySQL reports `COLUMN_DEFAULT = '0'` for an integer column of a
 *     VIEW that has no default at all. Measured, not folklore.
 *   • approxRowCount — a PRESENCE flag, never a number: it comes from planner statistics that are
 *     explicitly allowed to be stale. Postgres reports `-1` (dropped as "no estimate") until the
 *     table is ANALYZEd, and these tables are far too small to trigger autovacuum's threshold;
 *     SQLite has no such statistic at all. Pinning a count would pin a lie.
 */

import type { Dialect } from './corpus';

/**
 * A value that is either shared by all four dialects, or spelled out for each of them.
 *
 * Resolution is unambiguous by construction: a per-dialect map is a JSON object, and no field typed
 * this way ever holds an object as its shared form. `null` is a value, not a missing entry.
 */
export type Shared<T> = T | Record<Dialect, T>;

/** A column as the catalog reports it, in `ordinal_position` order. */
export type IntrospectionColumn = {
  name: string;
  /** Why this column's expectations diverge, when they do. */
  note?: string;
  /** The DECLARED type, verbatim — see the divergence note above. */
  dataType: Shared<string>;
  nullable: Shared<boolean>;
  isPrimaryKey: Shared<boolean>;
  /** The DEFAULT expression as the catalog renders it, or null where the column has none. */
  defaultValue: Shared<string | null>;
};

/** A foreign key, resolved to the referenced table's column. */
export type IntrospectionForeignKey = {
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
  /** Null where the dialect's catalog has no schema to report (SQLite's pragma does not name one). */
  referencedSchema: Shared<string | null>;
};

/**
 * An index, keyed by name.
 *
 * A null name means the dialect reports NO such index — the honest answer for SQLite's rowid primary
 * key, which is the table's storage rather than a separate structure.
 */
export type IntrospectionIndex = {
  name: Shared<string | null>;
  /** Why this index exists on the dialects it does, when it is not obvious. */
  note?: string;
  /** In index order: only the LEADING column can drive a seek. */
  columns: string[];
  unique: boolean;
};

/** Whether the dialect supplies a row estimate at all. Never a count — see the note above. */
export type RowCountPresence = 'present' | 'absent';

export type IntrospectionTable = {
  name: string;
  type: 'table' | 'view';
  /** Why this table's expectations are what they are, when it is not obvious. */
  note?: string;
  /** Ordered — `ordinal_position` is part of the contract, not incidental. */
  columns: IntrospectionColumn[];
  foreignKeys: IntrospectionForeignKey[];
  /**
   * Compared as a SET keyed by name: enumeration order is genuinely arbitrary (Postgres sorts by
   * index name, SQLite's pragma walks them newest-first), and pinning it would gate on an accident.
   */
  indexes: IntrospectionIndex[];
  approxRowCount: Shared<RowCountPresence>;
};

export type IntrospectionCorpus = {
  /** The SQLEasy version these goldens were authored against. */
  version: string;
  /** The namespace each dialect calls the seeded schema. */
  schemaName: Record<Dialect, string>;
  /**
   * Compared as a SET keyed by name — every dialect happens to sort tables before views today, but
   * that is the readers' `ORDER BY`, not a promise the catalogs make.
   */
  tables: IntrospectionTable[];
};
