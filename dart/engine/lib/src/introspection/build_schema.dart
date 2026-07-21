/// Pure assembly of flat catalog rows into a [SchemaData], plus the defensive value readers every
/// dialect reader shares. The Dart port of the TypeScript `introspection/build-schema.ts`.
library;

import 'dart:convert';

import 'schema.dart';

/// A table row as read from the catalog, before assembly.
class RawTable {
  /// Describes one catalog table row.
  const RawTable({
    required this.schema,
    required this.name,
    required this.isView,
  });

  /// The namespace the table lives in.
  final String schema;

  /// The table or view name.
  final String name;

  /// Whether the catalog reported this as a view rather than a base table.
  final bool isView;
}

/// A column row as read from the catalog, before grouping onto its table.
///
/// TypeScript spells this `SchemaColumn & { schema, table }`. Dart has no intersection types, so
/// the two locating fields are declared alongside the column's own.
class RawColumn {
  /// Describes one catalog column row and the table it belongs to.
  const RawColumn({
    required this.schema,
    required this.table,
    required this.name,
    required this.dataType,
    required this.nullable,
    required this.isPrimaryKey,
    this.defaultValue,
  });

  /// The owning table's namespace.
  final String schema;

  /// The owning table's name.
  final String table;

  /// The column name.
  final String name;

  /// The declared type, verbatim — see [SchemaColumn.dataType] for why an empty string is kept.
  final String dataType;

  /// Whether the catalog permits NULL in this column.
  final bool nullable;

  /// Whether this column is part of the table's primary key.
  final bool isPrimaryKey;

  /// The DEFAULT expression as the catalog spells it, or null when there is none.
  final String? defaultValue;
}

/// A foreign-key row as read from the catalog, before grouping onto its table.
///
/// TypeScript spells this `SchemaForeignKey & { schema, table }`; the two locating fields are
/// declared alongside the edge's own for the same reason as [RawColumn].
class RawForeignKey {
  /// Describes one catalog foreign-key row and the table it belongs to.
  const RawForeignKey({
    required this.schema,
    required this.table,
    required this.columnName,
    required this.referencedTable,
    required this.referencedColumn,
    this.referencedSchema,
  });

  /// The referencing table's namespace.
  final String schema;

  /// The referencing table's name.
  final String table;

  /// The referencing column.
  final String columnName;

  /// The referenced table.
  final String referencedTable;

  /// The referenced column on [referencedTable].
  final String referencedColumn;

  /// The referenced table's schema, when the catalog reports one.
  final String? referencedSchema;
}

/// One (index, column) pair as read from the catalog, before grouping into per-table indexes.
class IndexColumnRow {
  /// Describes one column's membership in one index.
  const IndexColumnRow({
    required this.schema,
    required this.table,
    required this.indexName,
    required this.unique,
    required this.columnName,
    required this.ordinal,
  });

  /// The indexed table's namespace.
  final String schema;

  /// The indexed table's name.
  final String table;

  /// The index name.
  final String indexName;

  /// Whether the index enforces uniqueness.
  final bool unique;

  /// The column covered at this position.
  final String columnName;

  /// This column's position within the index — the sort key, since catalogs do not promise order.
  final int ordinal;
}

/// An approximate row count as read from the catalog, before attaching it to its table.
///
/// TypeScript passes this as an inline object literal; Dart needs a named type for it.
class RawRowCount {
  /// Describes one table's approximate row count.
  const RawRowCount({
    required this.schema,
    required this.table,
    required this.count,
  });

  /// The counted table's namespace.
  final String schema;

  /// The counted table's name.
  final String table;

  /// The catalog's approximate row count.
  final int count;
}

/// Stitch flat catalog rows into per-table column/FK/index lists. Shared by every dialect reader.
SchemaData buildSchema(
  List<RawTable> tables,
  List<RawColumn> columns,
  List<RawForeignKey> fks, [
  List<IndexColumnRow> indexColumns = const [],
  List<RawRowCount> rowCounts = const [],
]) {
  final colMap = <String, List<SchemaColumn>>{};
  for (final c in columns) {
    final key = '${c.schema}.${c.table}';
    (colMap[key] ??= <SchemaColumn>[]).add(SchemaColumn(
      name: c.name,
      dataType: c.dataType,
      nullable: c.nullable,
      isPrimaryKey: c.isPrimaryKey,
      defaultValue: c.defaultValue,
    ));
  }

  final fkMap = <String, List<SchemaForeignKey>>{};
  for (final fk in fks) {
    final key = '${fk.schema}.${fk.table}';
    (fkMap[key] ??= <SchemaForeignKey>[]).add(SchemaForeignKey(
      columnName: fk.columnName,
      referencedTable: fk.referencedTable,
      referencedColumn: fk.referencedColumn,
      referencedSchema: fk.referencedSchema,
    ));
  }

  // Group flat (index, column) rows into per-table indexes, columns ordered within each index.
  final idxMap = <String, Map<String, _PendingIndex>>{};
  for (final r in indexColumns) {
    final key = '${r.schema}.${r.table}';
    final byName = idxMap[key] ??= <String, _PendingIndex>{};
    final idx = byName[r.indexName] ??= _PendingIndex(r.unique);
    idx.cols.add(_PendingIndexColumn(r.columnName, r.ordinal));
  }
  List<SchemaIndex> indexesFor(String key) => [
        for (final entry
            in (idxMap[key] ?? const <String, _PendingIndex>{}).entries)
          SchemaIndex(
            name: entry.key,
            unique: entry.value.unique,
            columns: (entry.value.cols
                  ..sort((a, b) => a.ordinal.compareTo(b.ordinal)))
                .map((c) => c.name)
                .toList(),
          ),
      ];

  final rowCountMap = <String, int>{
    for (final r in rowCounts) '${r.schema}.${r.table}': r.count,
  };

  final result = <SchemaTable>[
    for (final t in tables)
      SchemaTable(
        schema: t.schema,
        name: t.name,
        type: t.isView ? SchemaTableType.view : SchemaTableType.table,
        columns: colMap['${t.schema}.${t.name}'] ?? const <SchemaColumn>[],
        foreignKeys:
            fkMap['${t.schema}.${t.name}'] ?? const <SchemaForeignKey>[],
        indexes: indexesFor('${t.schema}.${t.name}'),
        approxRowCount: rowCountMap['${t.schema}.${t.name}'],
      ),
  ];

  return SchemaData(tables: result);
}

/// An index being accumulated column by column, before it becomes a [SchemaIndex].
class _PendingIndex {
  _PendingIndex(this.unique);

  final bool unique;
  final List<_PendingIndexColumn> cols = <_PendingIndexColumn>[];
}

/// One (column, ordinal) pair inside a [_PendingIndex].
class _PendingIndexColumn {
  const _PendingIndexColumn(this.name, this.ordinal);

  final String name;
  final int ordinal;
}

// ─── Defensive catalog value readers ─────────────────────────────────────────────────────────────
//
// TypeScript reads catalog rows through a structural type parameter and coerces with `Number(...)`,
// which is total. Dart reads them out of an untyped `Row` map, where a hard cast would THROW on a
// driver that picked a different representation — and drivers do disagree: postgres returns
// `reltuples::bigint` as text, mysql hands back `SEQ_IN_INDEX` as a number and `NON_UNIQUE` as an
// int (the executor deliberately un-guesses TINYINT(1) → bool), and sqlite's pragma columns carry
// whatever affinity the value had. These readers accept every one of those shapes rather than
// making the reader's correctness depend on a driver's decoding choice.

/// Reads a catalog number that may arrive as an `int`, a `num`, a `bool` or text. Null when the
/// value is null or is not a number at all.
int? readCatalogInt(Object? value) {
  if (value == null) return null;
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is bool) return value ? 1 : 0;
  final text = '$value';
  return int.tryParse(text) ?? double.tryParse(text)?.toInt();
}

/// Reads a catalog flag that may arrive as a real `bool` (postgres), as 0/1 (mysql, sqlite), or as
/// text (`'t'`, `'true'`). Anything unrecognized reads as false.
bool readCatalogBool(Object? value) {
  if (value is bool) return value;
  final number = readCatalogInt(value);
  if (number != null) return number != 0;
  final text = '$value'.toLowerCase();
  return text == 't' || text == 'true' || text == 'y' || text == 'yes';
}

/// Reads a catalog text value, keeping null as null.
///
/// Used for the columns whose type genuinely varies: a SQLite `DEFAULT 0` comes back from
/// `pragma_table_info` as a number rather than as the text of the expression, and a hard `as String`
/// would fail on exactly the schemas this is meant to describe.
///
/// BYTES ARE DECODED, NEVER STRINGIFIED. MySQL 8's data-dictionary views hand several catalog
/// columns back as binary — `DATA_TYPE`, `IS_NULLABLE`, `TABLE_TYPE` and `COLUMN_KEY` all arrive as
/// a `Uint8List`. `'$value'` on one of those yields `[105, 110, 116]`, which is not a failure any
/// caller would notice: the reader would report a column of type "[105, 110, 116]" and, worse, every
/// `== 'YES'` / `== 'PRI'` / `== 'VIEW'` test would quietly answer false — no nullable columns, no
/// primary keys, and every view reported as a table. Corpus D caught it on its first Dart run.
String? readCatalogText(Object? value) {
  if (value == null) return null;
  if (value is String) return value;
  if (value is List<int>) return utf8.decode(value, allowMalformed: true);
  return '$value';
}
