import type { DbExecutor } from '../index';
import { buildSchema, type IndexColumnRow } from './build-schema';
import type { SchemaColumn, SchemaData, SchemaForeignKey } from './schema';

/** SQLite catalog reader (sqlite_master + pragma table-valued functions). Also serves libsql/turso —
 * they are all SQLite engines with the same catalog. Pass an executor from `createSqliteExecutor`. */
export async function introspectSqlite(executor: DbExecutor): Promise<SchemaData> {
  const tables = await executor.run<{ name: string; type: string }>({
    sql: `SELECT name, type FROM sqlite_master
       WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%'
       ORDER BY type, name`,
  });

  const columns: (SchemaColumn & { schema: string; table: string })[] = [];
  const fks: (SchemaForeignKey & { schema: string; table: string })[] = [];
  const indexColumns: IndexColumnRow[] = [];

  for (const t of tables.rows) {
    // Table-valued pragma functions accept the table name as a bound parameter, so no identifier
    // interpolation is needed.
    const cols = await executor.run<{
      name: string;
      type: string;
      notnull: number;
      dflt_value: string | null;
      pk: number;
    }>({
      sql: 'SELECT name, type, "notnull", dflt_value, pk FROM pragma_table_info(?)',
      params: [t.name],
    });

    for (const c of cols.rows) {
      columns.push({
        schema: 'main',
        table: t.name,
        name: c.name,
        // SQLite is dynamically typed, and `CREATE TABLE t(a)` is legal — a column may genuinely
        // have NO declared type, which pragma_table_info reports as an empty string. This used to
        // substitute 'TEXT', inventing a declaration the schema does not contain; a caller reading
        // the catalog to generate code or compare environments would see a type nobody wrote.
        //
        // The empty string is passed through as-is, which is what the catalog actually says. Note
        // that a typeless column takes BLOB affinity in SQLite, not TEXT, so the old default was
        // not even the right guess.
        dataType: c.type ?? '',
        // Honour pragma notnull only — SQLite historically allows NULL in non-INTEGER PRIMARY KEY
        // columns, so forcing PK columns non-nullable misreports the catalog.
        nullable: c.notnull === 0,
        isPrimaryKey: c.pk > 0,
        defaultValue: c.dflt_value ?? undefined,
      });
    }

    const fkRows = await executor.run<{ from: string; table: string; to: string }>({
      sql: 'SELECT "from", "table", "to" FROM pragma_foreign_key_list(?)',
      params: [t.name],
    });
    for (const fk of fkRows.rows) {
      fks.push({
        schema: 'main',
        table: t.name,
        columnName: fk.from,
        referencedTable: fk.table,
        referencedColumn: fk.to,
      });
    }

    // Indexes: list them, then read each index's columns (pragma_index_info, ordered by seqno).
    const idxList = await executor.run<{ name: string; unique: number }>({
      sql: 'SELECT name, "unique" FROM pragma_index_list(?)',
      params: [t.name],
    });
    for (const idx of idxList.rows) {
      const idxCols = await executor.run<{ seqno: number; name: string | null }>({
        sql: 'SELECT seqno, name FROM pragma_index_info(?)',
        params: [idx.name],
      });
      for (const ic of idxCols.rows) {
        if (ic.name == null) continue; // expression-index columns have no name
        indexColumns.push({
          schema: 'main',
          table: t.name,
          indexName: idx.name,
          unique: idx.unique === 1,
          columnName: ic.name,
          ordinal: ic.seqno,
        });
      }
    }
  }

  return buildSchema(
    tables.rows.map((t) => ({ schema: 'main', name: t.name, isView: t.type === 'view' })),
    columns,
    fks,
    indexColumns,
  );
}
