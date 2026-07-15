import type { DbExecutor } from '../index';
import { buildSchema } from './build-schema';
import type { SchemaData } from './schema';

/** MySQL / MariaDB catalog reader (information_schema). Pass an executor connected to a MySQL
 * database (`createMysqlExecutor`). */
export async function introspectMysql(executor: DbExecutor, schema?: string): Promise<SchemaData> {
  let target = schema;
  if (!target) {
    const r = await executor.run<{ db: string }>({ sql: 'SELECT DATABASE() AS db' });
    target = r.rows[0]?.db ?? '';
  }

  // Explicit lowercase aliases: MySQL 8's information_schema returns UPPERCASE column headers unless
  // aliased (5.7/MariaDB return them as written) — without them every row property reads undefined.
  const tables = await executor.run<{ table_name: string; table_type: string }>({
    sql: `SELECT TABLE_NAME AS table_name, TABLE_TYPE AS table_type
       FROM information_schema.tables
       WHERE table_schema = ? AND table_type IN ('BASE TABLE', 'VIEW')
       ORDER BY table_type, table_name`,
    params: [target],
  });

  const columns = await executor.run<{
    table_name: string;
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
    column_key: string;
  }>({
    sql: `SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name, DATA_TYPE AS data_type,
              IS_NULLABLE AS is_nullable, COLUMN_DEFAULT AS column_default, COLUMN_KEY AS column_key
       FROM information_schema.columns
       WHERE table_schema = ?
       ORDER BY table_name, ordinal_position`,
    params: [target],
  });

  const fks = await executor.run<{
    table_name: string;
    column_name: string;
    referenced_table_schema: string;
    referenced_table_name: string;
    referenced_column_name: string;
  }>({
    sql: `SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name,
              REFERENCED_TABLE_SCHEMA AS referenced_table_schema,
              REFERENCED_TABLE_NAME AS referenced_table_name,
              REFERENCED_COLUMN_NAME AS referenced_column_name
       FROM information_schema.key_column_usage
       WHERE table_schema = ? AND referenced_table_name IS NOT NULL`,
    params: [target],
  });

  // Secondary indexes (one row per index column, ordered by SEQ_IN_INDEX) + approx row count.
  const indexes = await executor.run<{
    table_name: string;
    index_name: string;
    non_unique: number;
    column_name: string | null;
    seq: number;
  }>({
    sql: `SELECT TABLE_NAME AS table_name, INDEX_NAME AS index_name, NON_UNIQUE AS non_unique,
              COLUMN_NAME AS column_name, SEQ_IN_INDEX AS seq
       FROM information_schema.statistics
       WHERE table_schema = ?
       ORDER BY table_name, index_name, seq`,
    params: [target],
  });

  const rowCounts = await executor.run<{ table_name: string; n: number | null }>({
    sql: `SELECT TABLE_NAME AS table_name, TABLE_ROWS AS n
       FROM information_schema.tables
       WHERE table_schema = ? AND table_type = 'BASE TABLE'`,
    params: [target],
  });

  return buildSchema(
    tables.rows.map((t) => ({
      schema: target,
      name: t.table_name,
      isView: t.table_type === 'VIEW',
    })),
    columns.rows.map((c) => ({
      schema: target,
      table: c.table_name,
      name: c.column_name,
      dataType: c.data_type,
      nullable: c.is_nullable === 'YES',
      isPrimaryKey: c.column_key === 'PRI',
      defaultValue: c.column_default ?? undefined,
    })),
    fks.rows.map((fk) => ({
      schema: target,
      table: fk.table_name,
      columnName: fk.column_name,
      referencedTable: fk.referenced_table_name,
      referencedColumn: fk.referenced_column_name,
      referencedSchema: fk.referenced_table_schema,
    })),
    indexes.rows
      .filter((r) => r.column_name != null)
      .map((r) => ({
        schema: target,
        table: r.table_name,
        indexName: r.index_name,
        unique: r.non_unique === 0,
        columnName: r.column_name!,
        ordinal: Number(r.seq),
      })),
    rowCounts.rows.map((r) => ({ schema: target, table: r.table_name, count: Number(r.n ?? 0) })),
  );
}
