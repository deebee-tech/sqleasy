/// The normalized model a catalog reader produces — the Dart port of the TypeScript
/// `introspection/schema.ts`. Pure data: no driver, no I/O.
library;

/// A column as reported by a database's catalog.
class SchemaColumn {
  /// Describes one catalog column.
  const SchemaColumn({
    required this.name,
    required this.dataType,
    required this.nullable,
    required this.isPrimaryKey,
    this.defaultValue,
  });

  /// The column name, as the catalog spells it.
  final String name;

  /// The type as DECLARED in the catalog, verbatim.
  ///
  /// May be an empty string, and that is meaningful rather than missing: SQLite is dynamically typed
  /// and `CREATE TABLE t(a)` gives `a` no declared type at all. An empty string means the schema
  /// genuinely does not name one — do not substitute a default, which would report a declaration
  /// nobody wrote.
  final String dataType;

  /// Whether the catalog permits NULL in this column.
  final bool nullable;

  /// Whether this column is part of the table's primary key.
  final bool isPrimaryKey;

  /// The DEFAULT expression exactly as the catalog spells it. Null when the column declares none.
  final String? defaultValue;
}

/// A foreign key from one column to another table's column.
class SchemaForeignKey {
  /// Describes one outgoing foreign-key edge.
  const SchemaForeignKey({
    required this.columnName,
    required this.referencedTable,
    required this.referencedColumn,
    this.referencedSchema,
  });

  /// The referencing column on the owning table.
  final String columnName;

  /// The referenced table.
  final String referencedTable;

  /// The referenced column on [referencedTable].
  final String referencedColumn;

  /// The referenced table's schema. Null when the dialect's catalog does not report one (sqlite).
  final String? referencedSchema;
}

/// A secondary index (or unique constraint) on a table. [columns] are in index order — only the
/// LEADING column can drive an index seek or an ordered scan. [unique] also tells a FK target apart
/// as 1:1 vs 1:N (join fan-out).
class SchemaIndex {
  /// Describes one index and the columns it covers, in index order.
  const SchemaIndex({
    required this.name,
    required this.columns,
    required this.unique,
  });

  /// The index name, as the catalog spells it.
  final String name;

  /// The indexed columns, in index order.
  final List<String> columns;

  /// Whether the index enforces uniqueness.
  final bool unique;
}

/// Whether a [SchemaTable] is a base table or a view.
///
/// The TypeScript reference models this as the string union `'table' | 'view'`. Dart has no union
/// types, so it is an enum whose `name` is exactly that string — `SchemaTableType.view.name` is
/// `'view'`, so the two implementations serialize identically.
enum SchemaTableType {
  /// A base table.
  table,

  /// A view.
  view,
}

/// A table or view with its columns and outgoing foreign keys.
class SchemaTable {
  /// Describes one table or view and everything the catalog reports about it.
  const SchemaTable({
    required this.schema,
    required this.name,
    required this.type,
    required this.columns,
    required this.foreignKeys,
    required this.indexes,
    this.approxRowCount,
  });

  /// The namespace the table lives in (postgres `public`, mysql the database, sqlite `main`).
  final String schema;

  /// The table or view name.
  final String name;

  /// Whether this is a base table or a view.
  final SchemaTableType type;

  /// The columns, in the catalog's own ordinal order.
  final List<SchemaColumn> columns;

  /// The outgoing foreign keys.
  final List<SchemaForeignKey> foreignKeys;

  /// Secondary indexes + unique constraints (the PK included where the catalog reports it). Empty
  /// when none, or for a view.
  final List<SchemaIndex> indexes;

  /// Approximate row count from catalog statistics — a coarse cost-tier signal, never exact (may be
  /// stale or 0). Absent when the dialect can't cheaply estimate it (sqlite).
  final int? approxRowCount;
}

/// The introspected shape of a database.
class SchemaData {
  /// Holds every table and view a reader found.
  const SchemaData({required this.tables});

  /// The tables and views, in the order the reader listed them.
  final List<SchemaTable> tables;
}
