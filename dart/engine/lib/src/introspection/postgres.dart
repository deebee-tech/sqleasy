/// The Postgres catalog reader — the Dart port of the TypeScript `introspection/postgres.ts`.
library;

import '../executor.dart';
import 'build_schema.dart';
import 'schema.dart';

/// Postgres catalog reader (information_schema + pg_catalog). Pass an executor connected to a
/// Postgres database (`PostgresExecutor.open`).
Future<SchemaData> introspectPostgres(DbExecutor executor,
    [String? schema]) async {
  final target = (schema == null || schema.isEmpty) ? 'public' : schema;

  final tables = await executor.run(PreparedSql(
    r'''SELECT table_name, table_type
       FROM information_schema.tables
       WHERE table_schema = $1 AND table_type IN ('BASE TABLE', 'VIEW')
       ORDER BY table_type, table_name''',
    [target],
  ));

  final columns = await executor.run(PreparedSql(
    r'''SELECT table_name, column_name, data_type, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_schema = $1
       ORDER BY table_name, ordinal_position''',
    [target],
  ));

  final pks = await executor.run(PreparedSql(
    r'''SELECT kcu.table_name, kcu.column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
       WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = $1''',
    [target],
  ));

  // Pair referencing and referenced columns by ordinal via referential_constraints.
  // Joining key_column_usage to constraint_column_usage on constraint_name alone cartesian-products
  // composite FKs (N×N bogus edges). constraint_column_usage.table_schema is the REFERENCED table's
  // schema — joining it to tc.table_schema also drops cross-schema FKs.
  final fks = await executor.run(PreparedSql(
    r'''SELECT kcu.table_name, kcu.column_name,
              kcu_ref.table_schema AS referenced_table_schema,
              kcu_ref.table_name AS referenced_table_name,
              kcu_ref.column_name AS referenced_column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_schema = kcu.constraint_schema
        AND tc.constraint_name = kcu.constraint_name
       JOIN information_schema.referential_constraints rc
         ON tc.constraint_schema = rc.constraint_schema
        AND tc.constraint_name = rc.constraint_name
       JOIN information_schema.key_column_usage kcu_ref
         ON rc.unique_constraint_schema = kcu_ref.constraint_schema
        AND rc.unique_constraint_name = kcu_ref.constraint_name
        AND kcu.position_in_unique_constraint = kcu_ref.ordinal_position
       WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = $1''',
    [target],
  ));

  // Secondary indexes: columns unnested in key order (WITH ORDINALITY), `attnum > 0` drops
  // expression-index entries. Plus an approximate row count from planner stats (reltuples).
  //
  // relkind IN ('r','p'): a PARTITIONED table's parent is 'p', not 'r'. Filtering on 'r' alone
  // reported every partitioned table as having no indexes and no row count — silently, and worst on
  // exactly the biggest tables in a database, which are the ones most likely to be partitioned.
  final indexes = await executor.run(PreparedSql(
    r'''SELECT t.relname AS table_name, i.relname AS index_name, ix.indisunique AS is_unique,
              a.attname AS column_name, k.ord AS ordinal
       FROM pg_index ix
       JOIN pg_class i ON i.oid = ix.indexrelid
       JOIN pg_class t ON t.oid = ix.indrelid
       JOIN pg_namespace n ON n.oid = t.relnamespace
       JOIN LATERAL unnest(string_to_array(ix.indkey::text, ' ')::int[]) WITH ORDINALITY AS k(attnum, ord)
         ON true
       JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
       WHERE n.nspname = $1 AND t.relkind IN ('r', 'p') AND k.attnum > 0
       ORDER BY table_name, index_name, ordinal''',
    [target],
  ));

  final rowCounts = await executor.run(PreparedSql(
    r'''SELECT c.relname AS table_name, c.reltuples::bigint AS n
       FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
       -- reltuples on a partitioned parent is -1 until it is ANALYZEd; the >= 0 filter below
       -- drops that rather than reporting a table with minus one row.
       WHERE n.nspname = $1 AND c.relkind IN ('r', 'p')''',
    [target],
  ));

  final pkSet = <String>{
    for (final p in pks.rows) '${p['table_name']}.${p['column_name']}',
  };

  return buildSchema(
    [
      for (final t in tables.rows)
        RawTable(
          schema: target,
          name: t['table_name']! as String,
          isView: t['table_type'] == 'VIEW',
        ),
    ],
    [
      for (final c in columns.rows)
        RawColumn(
          schema: target,
          table: c['table_name']! as String,
          name: c['column_name']! as String,
          dataType: c['data_type']! as String,
          nullable: c['is_nullable'] == 'YES',
          isPrimaryKey:
              pkSet.contains('${c['table_name']}.${c['column_name']}'),
          defaultValue: readCatalogText(c['column_default']),
        ),
    ],
    [
      for (final fk in fks.rows)
        RawForeignKey(
          schema: target,
          table: fk['table_name']! as String,
          columnName: fk['column_name']! as String,
          referencedTable: fk['referenced_table_name']! as String,
          referencedColumn: fk['referenced_column_name']! as String,
          referencedSchema: readCatalogText(fk['referenced_table_schema']),
        ),
    ],
    [
      for (final r in indexes.rows)
        IndexColumnRow(
          schema: target,
          table: r['table_name']! as String,
          indexName: r['index_name']! as String,
          unique: readCatalogBool(r['is_unique']),
          columnName: r['column_name']! as String,
          ordinal: readCatalogInt(r['ordinal']) ?? 0,
        ),
    ],
    [
      for (final r in rowCounts.rows)
        if ((readCatalogInt(r['n']) ?? 0) >= 0)
          RawRowCount(
            schema: target,
            table: r['table_name']! as String,
            count: readCatalogInt(r['n']) ?? 0,
          ),
    ],
  );
}
