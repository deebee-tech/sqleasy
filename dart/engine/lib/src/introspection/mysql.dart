/// The MySQL / MariaDB catalog reader — the Dart port of the TypeScript `introspection/mysql.ts`.
library;

import '../executor.dart';
import 'build_schema.dart';
import 'schema.dart';

/// MySQL / MariaDB catalog reader (information_schema). Pass an executor connected to a MySQL
/// database (`MysqlExecutor.open`).
Future<SchemaData> introspectMysql(DbExecutor executor,
    [String? schema]) async {
  var resolved = schema;
  if (resolved == null || resolved.isEmpty) {
    final r = await executor.run(const PreparedSql('SELECT DATABASE() AS db'));
    resolved = r.rows.isEmpty ? null : readCatalogText(r.rows.first['db']);
  }
  if (resolved == null || resolved.isEmpty) {
    throw StateError(
      'introspectMysql: no schema given and DATABASE() is NULL — USE a database or pass schema',
    );
  }
  final target = resolved;

  // EVERY text field is read through `readCatalogText`, never `as String`. MySQL 8's data dictionary
  // hands several of these back as BINARY (`DATA_TYPE`, `IS_NULLABLE`, `TABLE_TYPE`, `COLUMN_KEY`),
  // so a hard cast throws on some and — far worse — an `== 'YES'` test against a `Uint8List` quietly
  // answers false. See the note on `readCatalogText`.
  //
  // Explicit lowercase aliases: MySQL 8's information_schema returns UPPERCASE column headers unless
  // aliased (5.7/MariaDB return them as written) — without them every row property reads undefined.
  final tables = await executor.run(PreparedSql(
    r'''SELECT TABLE_NAME AS table_name, TABLE_TYPE AS table_type
       FROM information_schema.tables
       WHERE table_schema = ? AND table_type IN ('BASE TABLE', 'VIEW')
       ORDER BY table_type, table_name''',
    [target],
  ));

  final columns = await executor.run(PreparedSql(
    r'''SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name, DATA_TYPE AS data_type,
              IS_NULLABLE AS is_nullable, COLUMN_DEFAULT AS column_default, COLUMN_KEY AS column_key
       FROM information_schema.columns
       WHERE table_schema = ?
       ORDER BY table_name, ordinal_position''',
    [target],
  ));

  final fks = await executor.run(PreparedSql(
    r'''SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name,
              REFERENCED_TABLE_SCHEMA AS referenced_table_schema,
              REFERENCED_TABLE_NAME AS referenced_table_name,
              REFERENCED_COLUMN_NAME AS referenced_column_name
       FROM information_schema.key_column_usage
       WHERE table_schema = ? AND referenced_table_name IS NOT NULL''',
    [target],
  ));

  // Secondary indexes (one row per index column, ordered by SEQ_IN_INDEX) + approx row count.
  final indexes = await executor.run(PreparedSql(
    r'''SELECT TABLE_NAME AS table_name, INDEX_NAME AS index_name, NON_UNIQUE AS non_unique,
              COLUMN_NAME AS column_name, SEQ_IN_INDEX AS seq
       FROM information_schema.statistics
       WHERE table_schema = ?
       ORDER BY table_name, index_name, seq''',
    [target],
  ));

  final rowCounts = await executor.run(PreparedSql(
    // Not a raw string: the statement ends on a quote, so the final one is escaped rather than
    // padded — the SQL text stays byte-identical to the TypeScript reference.
    '''SELECT TABLE_NAME AS table_name, TABLE_ROWS AS n
       FROM information_schema.tables
       WHERE table_schema = ? AND table_type = 'BASE TABLE\'''',
    [target],
  ));

  // An expression index reports no COLUMN_NAME; it has no column to attribute, so it is dropped.
  final indexColumns = <IndexColumnRow>[];
  for (final r in indexes.rows) {
    final columnName = readCatalogText(r['column_name']);
    if (columnName == null) continue;
    indexColumns.add(IndexColumnRow(
      schema: target,
      table: readCatalogText(r['table_name'])!,
      indexName: readCatalogText(r['index_name'])!,
      // information_schema.statistics states the NEGATIVE, so unique is NON_UNIQUE = 0.
      unique: readCatalogInt(r['non_unique']) == 0,
      columnName: columnName,
      ordinal: readCatalogInt(r['seq']) ?? 0,
    ));
  }

  return buildSchema(
    [
      for (final t in tables.rows)
        RawTable(
          schema: target,
          name: readCatalogText(t['table_name'])!,
          isView: readCatalogText(t['table_type']) == 'VIEW',
        ),
    ],
    [
      for (final c in columns.rows)
        RawColumn(
          schema: target,
          table: readCatalogText(c['table_name'])!,
          name: readCatalogText(c['column_name'])!,
          dataType: readCatalogText(c['data_type'])!,
          nullable: readCatalogText(c['is_nullable']) == 'YES',
          isPrimaryKey: readCatalogText(c['column_key']) == 'PRI',
          defaultValue: readCatalogText(c['column_default']),
        ),
    ],
    [
      for (final fk in fks.rows)
        RawForeignKey(
          schema: target,
          table: readCatalogText(fk['table_name'])!,
          columnName: readCatalogText(fk['column_name'])!,
          referencedTable: readCatalogText(fk['referenced_table_name'])!,
          referencedColumn: readCatalogText(fk['referenced_column_name'])!,
          referencedSchema: readCatalogText(fk['referenced_table_schema']),
        ),
    ],
    indexColumns,
    [
      for (final r in rowCounts.rows)
        RawRowCount(
          schema: target,
          table: readCatalogText(r['table_name'])!,
          count: readCatalogInt(r['n']) ?? 0,
        ),
    ],
  );
}
