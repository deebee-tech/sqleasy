import type {
  SchemaColumn,
  SchemaData,
  SchemaForeignKey,
  SchemaIndex,
  SchemaTable,
} from './schema';

/** A table row as read from the catalog, before assembly. */
export type RawTable = {
  schema: string;
  name: string;
  isView: boolean;
};

/** One (index, column) pair as read from the catalog, before grouping into per-table indexes. */
export type IndexColumnRow = {
  schema: string;
  table: string;
  indexName: string;
  unique: boolean;
  columnName: string;
  ordinal: number;
};

/** Stitch flat catalog rows into per-table column/FK/index lists. Shared by every dialect reader. */
export function buildSchema(
  tables: RawTable[],
  columns: (SchemaColumn & { schema: string; table: string })[],
  fks: (SchemaForeignKey & { schema: string; table: string })[],
  indexColumns: IndexColumnRow[] = [],
  rowCounts: { schema: string; table: string; count: number }[] = [],
): SchemaData {
  const colMap = new Map<string, SchemaColumn[]>();
  for (const c of columns) {
    const key = `${c.schema}.${c.table}`;
    const list = colMap.get(key) ?? [];
    list.push({
      name: c.name,
      dataType: c.dataType,
      nullable: c.nullable,
      isPrimaryKey: c.isPrimaryKey,
      defaultValue: c.defaultValue,
    });
    colMap.set(key, list);
  }

  const fkMap = new Map<string, SchemaForeignKey[]>();
  for (const fk of fks) {
    const key = `${fk.schema}.${fk.table}`;
    const list = fkMap.get(key) ?? [];
    list.push({
      columnName: fk.columnName,
      referencedTable: fk.referencedTable,
      referencedColumn: fk.referencedColumn,
      referencedSchema: fk.referencedSchema,
    });
    fkMap.set(key, list);
  }

  // Group flat (index, column) rows into per-table indexes, columns ordered within each index.
  const idxMap = new Map<
    string,
    Map<string, { unique: boolean; cols: { name: string; ordinal: number }[] }>
  >();
  for (const r of indexColumns) {
    const key = `${r.schema}.${r.table}`;
    const byName = idxMap.get(key) ?? new Map();
    const idx = byName.get(r.indexName) ?? { unique: r.unique, cols: [] };
    idx.cols.push({ name: r.columnName, ordinal: r.ordinal });
    byName.set(r.indexName, idx);
    idxMap.set(key, byName);
  }
  const indexesFor = (key: string): SchemaIndex[] =>
    [...(idxMap.get(key)?.entries() ?? [])].map(([name, i]) => ({
      name,
      unique: i.unique,
      columns: i.cols.sort((a, b) => a.ordinal - b.ordinal).map((c) => c.name),
    }));

  const rowCountMap = new Map(rowCounts.map((r) => [`${r.schema}.${r.table}`, r.count]));

  const result: SchemaTable[] = tables.map((t) => {
    const key = `${t.schema}.${t.name}`;
    return {
      schema: t.schema,
      name: t.name,
      type: t.isView ? 'view' : 'table',
      columns: colMap.get(key) ?? [],
      foreignKeys: fkMap.get(key) ?? [],
      indexes: indexesFor(key),
      approxRowCount: rowCountMap.get(key),
    };
  });

  return { tables: result };
}
