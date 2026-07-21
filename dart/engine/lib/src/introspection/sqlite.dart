/// The SQLite catalog reader — the Dart port of the TypeScript `introspection/sqlite.ts`.
library;

import '../executor.dart';
import 'build_schema.dart';
import 'schema.dart';

/// SQLite catalog reader (sqlite_master + pragma table-valued functions). Also serves libsql/turso —
/// they are all SQLite engines with the same catalog. Pass an executor from `SqliteExecutor`.
Future<SchemaData> introspectSqlite(DbExecutor executor) async {
  final tables = await executor.run(const PreparedSql(
    '''SELECT name, type FROM sqlite_master
       WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%'
       ORDER BY type, name''',
  ));

  final columns = <RawColumn>[];
  final fks = <RawForeignKey>[];
  final indexColumns = <IndexColumnRow>[];

  for (final t in tables.rows) {
    final tableName = t['name']! as String;

    // Table-valued pragma functions accept the table name as a bound parameter, so no identifier
    // interpolation is needed.
    final cols = await executor.run(PreparedSql(
      'SELECT name, type, "notnull", dflt_value, pk FROM pragma_table_info(?)',
      [tableName],
    ));

    for (final c in cols.rows) {
      columns.add(RawColumn(
        schema: 'main',
        table: tableName,
        name: c['name']! as String,
        // SQLite is dynamically typed, and `CREATE TABLE t(a)` is legal — a column may genuinely
        // have NO declared type, which pragma_table_info reports as an empty string. This used to
        // substitute 'TEXT', inventing a declaration the schema does not contain; a caller reading
        // the catalog to generate code or compare environments would see a type nobody wrote.
        //
        // The empty string is passed through as-is, which is what the catalog actually says. Note
        // that a typeless column takes BLOB affinity in SQLite, not TEXT, so the old default was
        // not even the right guess.
        dataType: readCatalogText(c['type']) ?? '',
        // Honour pragma notnull only — SQLite historically allows NULL in non-INTEGER PRIMARY KEY
        // columns, so forcing PK columns non-nullable misreports the catalog.
        nullable: readCatalogInt(c['notnull']) == 0,
        isPrimaryKey: (readCatalogInt(c['pk']) ?? 0) > 0,
        defaultValue: readCatalogText(c['dflt_value']),
      ));
    }

    final fkRows = await executor.run(PreparedSql(
      'SELECT "from", "table", "to" FROM pragma_foreign_key_list(?)',
      [tableName],
    ));
    for (final fk in fkRows.rows) {
      fks.add(RawForeignKey(
        schema: 'main',
        table: tableName,
        columnName: fk['from']! as String,
        referencedTable: fk['table']! as String,
        referencedColumn: fk['to']! as String,
      ));
    }

    // Indexes: list them, then read each index's columns (pragma_index_info, ordered by seqno).
    final idxList = await executor.run(PreparedSql(
      'SELECT name, "unique" FROM pragma_index_list(?)',
      [tableName],
    ));
    for (final idx in idxList.rows) {
      final indexName = idx['name']! as String;
      final unique = readCatalogInt(idx['unique']) == 1;
      final idxCols = await executor.run(PreparedSql(
        'SELECT seqno, name FROM pragma_index_info(?)',
        [indexName],
      ));
      for (final ic in idxCols.rows) {
        // Expression-index columns have no name.
        final columnName = readCatalogText(ic['name']);
        if (columnName == null) continue;
        indexColumns.add(IndexColumnRow(
          schema: 'main',
          table: tableName,
          indexName: indexName,
          unique: unique,
          columnName: columnName,
          ordinal: readCatalogInt(ic['seqno']) ?? 0,
        ));
      }
    }
  }

  return buildSchema(
    [
      for (final t in tables.rows)
        RawTable(
          schema: 'main',
          name: t['name']! as String,
          isView: t['type'] == 'view',
        ),
    ],
    columns,
    fks,
    indexColumns,
  );
}
