import type { DbExecutor } from '../index';
import { buildSchema } from './build-schema';
import type { SchemaData } from './schema';

/** Postgres catalog reader (information_schema + pg_catalog). Pass an executor connected to a
 * Postgres database (`createPostgresExecutor`). */
export async function introspectPostgres(
  executor: DbExecutor,
  schema?: string,
): Promise<SchemaData> {
  const target = schema || 'public';

  const tables = await executor.run<{ table_name: string; table_type: string }>({
    sql: `SELECT table_name, table_type
       FROM information_schema.tables
       WHERE table_schema = $1 AND table_type IN ('BASE TABLE', 'VIEW')
       ORDER BY table_type, table_name`,
    params: [target],
  });

  const columns = await executor.run<{
    table_name: string;
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
  }>({
    sql: `SELECT table_name, column_name, data_type, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_schema = $1
       ORDER BY table_name, ordinal_position`,
    params: [target],
  });

  const pks = await executor.run<{ table_name: string; column_name: string }>({
    sql: `SELECT kcu.table_name, kcu.column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
       WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = $1`,
    params: [target],
  });

  const fks = await executor.run<{
    table_name: string;
    column_name: string;
    referenced_table_schema: string;
    referenced_table_name: string;
    referenced_column_name: string;
  }>({
    sql: `SELECT kcu.table_name, kcu.column_name,
              ccu.table_schema AS referenced_table_schema,
              ccu.table_name AS referenced_table_name,
              ccu.column_name AS referenced_column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
       JOIN information_schema.constraint_column_usage ccu
         ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
       WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = $1`,
    params: [target],
  });

  // Secondary indexes: columns unnested in key order (WITH ORDINALITY), `attnum > 0` drops
  // expression-index entries. Plus an approximate row count from planner stats (reltuples).
  //
  // relkind IN ('r','p'): a PARTITIONED table's parent is 'p', not 'r'. Filtering on 'r' alone
  // reported every partitioned table as having no indexes and no row count — silently, and worst on
  // exactly the biggest tables in a database, which are the ones most likely to be partitioned.
  const indexes = await executor.run<{
    table_name: string;
    index_name: string;
    is_unique: boolean;
    column_name: string;
    ordinal: number;
  }>({
    sql: `SELECT t.relname AS table_name, i.relname AS index_name, ix.indisunique AS is_unique,
              a.attname AS column_name, k.ord AS ordinal
       FROM pg_index ix
       JOIN pg_class i ON i.oid = ix.indexrelid
       JOIN pg_class t ON t.oid = ix.indrelid
       JOIN pg_namespace n ON n.oid = t.relnamespace
       JOIN LATERAL unnest(string_to_array(ix.indkey::text, ' ')::int[]) WITH ORDINALITY AS k(attnum, ord)
         ON true
       JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
       WHERE n.nspname = $1 AND t.relkind IN ('r', 'p') AND k.attnum > 0
       ORDER BY table_name, index_name, ordinal`,
    params: [target],
  });

  const rowCounts = await executor.run<{ table_name: string; n: string }>({
    sql: `SELECT c.relname AS table_name, c.reltuples::bigint AS n
       FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
       -- reltuples on a partitioned parent is -1 until it is ANALYZEd; the >= 0 filter below
       -- drops that rather than reporting a table with minus one row.
       WHERE n.nspname = $1 AND c.relkind IN ('r', 'p')`,
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
      referencedTable: fk.referenced_table_name,
      referencedColumn: fk.referenced_column_name,
      referencedSchema: fk.referenced_table_schema,
    })),
    indexes.rows.map((r) => ({
      schema: target,
      table: r.table_name,
      indexName: r.index_name,
      unique: r.is_unique,
      columnName: r.column_name,
      ordinal: Number(r.ordinal),
    })),
    rowCounts.rows
      .map((r) => ({ schema: target, table: r.table_name, count: Number(r.n) }))
      .filter((r) => r.count >= 0),
  );
}
