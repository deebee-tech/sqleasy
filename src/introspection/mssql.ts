import type { DbExecutor } from '../index';
import { buildSchema } from './build-schema';
import type { SchemaData } from './schema';

/** SQL Server catalog reader (INFORMATION_SCHEMA + sys catalog). Pass an executor connected to a
 * SQL Server database (`createMssqlExecutor`). */
export async function introspectMssql(executor: DbExecutor, schema?: string): Promise<SchemaData> {
  const target = schema || 'dbo';

  const tables = await executor.run<{ table_name: string; table_type: string }>({
    sql: `SELECT TABLE_NAME AS table_name, TABLE_TYPE AS table_type
       FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = @p0 AND TABLE_TYPE IN ('BASE TABLE', 'VIEW')
       ORDER BY TABLE_TYPE, TABLE_NAME`,
    params: [target],
  });

  const columns = await executor.run<{
    table_name: string;
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
  }>({
    sql: `SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name, DATA_TYPE AS data_type,
              IS_NULLABLE AS is_nullable, COLUMN_DEFAULT AS column_default
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = @p0
       ORDER BY TABLE_NAME, ORDINAL_POSITION`,
    params: [target],
  });

  const pks = await executor.run<{ table_name: string; column_name: string }>({
    sql: `SELECT kcu.TABLE_NAME AS table_name, kcu.COLUMN_NAME AS column_name
       FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
       JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
         ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME AND tc.TABLE_SCHEMA = kcu.TABLE_SCHEMA
       WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY' AND tc.TABLE_SCHEMA = @p0`,
    params: [target],
  });

  const fks = await executor.run<{
    table_name: string;
    column_name: string;
    referenced_schema: string;
    referenced_table: string;
    referenced_column: string;
  }>({
    sql: `SELECT t1.name AS table_name, c1.name AS column_name,
              s2.name AS referenced_schema, t2.name AS referenced_table, c2.name AS referenced_column
       FROM sys.foreign_key_columns fkc
       JOIN sys.objects t1 ON fkc.parent_object_id = t1.object_id
       JOIN sys.columns c1 ON fkc.parent_object_id = c1.object_id AND fkc.parent_column_id = c1.column_id
       JOIN sys.objects t2 ON fkc.referenced_object_id = t2.object_id
       JOIN sys.columns c2 ON fkc.referenced_object_id = c2.object_id AND fkc.referenced_column_id = c2.column_id
       JOIN sys.schemas s1 ON t1.schema_id = s1.schema_id
       JOIN sys.schemas s2 ON t2.schema_id = s2.schema_id
       WHERE s1.name = @p0`,
    params: [target],
  });

  // Secondary indexes (sys.index_columns, key columns only in key_ordinal order; `i.type > 0` skips
  // heaps) + an approximate row count from partition stats.
  const indexes = await executor.run<{
    table_name: string;
    index_name: string;
    is_unique: boolean | number;
    column_name: string;
    ordinal: number;
  }>({
    sql: `SELECT t.name AS table_name, i.name AS index_name, i.is_unique AS is_unique,
              c.name AS column_name, ic.key_ordinal AS ordinal
       FROM sys.indexes i
       JOIN sys.tables t ON t.object_id = i.object_id
       JOIN sys.schemas s ON s.schema_id = t.schema_id
       JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
       JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
       WHERE s.name = @p0 AND i.type > 0 AND ic.is_included_column = 0
       ORDER BY t.name, i.name, ic.key_ordinal`,
    params: [target],
  });

  const rowCounts = await executor.run<{ table_name: string; n: number }>({
    sql: `SELECT t.name AS table_name, SUM(p.rows) AS n
       FROM sys.tables t
       JOIN sys.schemas s ON s.schema_id = t.schema_id
       JOIN sys.partitions p ON p.object_id = t.object_id AND p.index_id IN (0, 1)
       WHERE s.name = @p0
       GROUP BY t.name`,
    params: [target],
  });

  const pkSet = new Set(pks.rows.map((p) => `${p.table_name}.${p.column_name}`));

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
      isPrimaryKey: pkSet.has(`${c.table_name}.${c.column_name}`),
      defaultValue: c.column_default ?? undefined,
    })),
    fks.rows.map((fk) => ({
      schema: target,
      table: fk.table_name,
      columnName: fk.column_name,
      referencedTable: fk.referenced_table,
      referencedColumn: fk.referenced_column,
      referencedSchema: fk.referenced_schema,
    })),
    indexes.rows.map((r) => ({
      schema: target,
      table: r.table_name,
      indexName: r.index_name,
      unique: Boolean(r.is_unique),
      columnName: r.column_name,
      ordinal: Number(r.ordinal),
    })),
    rowCounts.rows.map((r) => ({ schema: target, table: r.table_name, count: Number(r.n) })),
  );
}
