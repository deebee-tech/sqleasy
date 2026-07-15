/** A column as reported by a database's catalog. */
export type SchemaColumn = {
  name: string;
  dataType: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  defaultValue?: string;
};

/** A foreign key from one column to another table's column. */
export type SchemaForeignKey = {
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
  referencedSchema?: string;
};

/** A secondary index (or unique constraint) on a table. `columns` are in index order — only the
 * LEADING column can drive an index seek or an ordered scan. `unique` also tells a FK target apart
 * as 1:1 vs 1:N (join fan-out). */
export type SchemaIndex = {
  name: string;
  columns: string[];
  unique: boolean;
};

/** A table or view with its columns and outgoing foreign keys. */
export type SchemaTable = {
  schema: string;
  name: string;
  type: 'table' | 'view';
  columns: SchemaColumn[];
  foreignKeys: SchemaForeignKey[];
  /** Secondary indexes + unique constraints (the PK included where the catalog reports it). Empty
   * when none, or for a view. */
  indexes: SchemaIndex[];
  /** Approximate row count from catalog statistics — a coarse cost-tier signal, never exact (may be
   * stale or 0). Absent when the dialect can't cheaply estimate it (sqlite). */
  approxRowCount?: number;
};

/** The introspected shape of a database. */
export type SchemaData = {
  tables: SchemaTable[];
};
