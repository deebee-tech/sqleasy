@TestOn('vm')
library;

import 'package:sqleasy_engine/sqleasy_engine.dart';
import 'package:test/test.dart';

/// Pure assembly tests — no database. `buildSchema` is the one piece every dialect reader funnels
/// through, so it is provable without a server; the DB-backed conformance lives in the
/// `integration`-tagged suites.
void main() {
  group('buildSchema', () {
    test(
        'groups columns and FKs per table, orders index columns by ordinal, and marks views',
        () {
      const idxCols = <IndexColumnRow>[
        // Out of ordinal order on purpose — assembly must sort them.
        IndexColumnRow(
          schema: 'public',
          table: 'users',
          indexName: 'ix_ab',
          unique: true,
          columnName: 'b',
          ordinal: 2,
        ),
        IndexColumnRow(
          schema: 'public',
          table: 'users',
          indexName: 'ix_ab',
          unique: true,
          columnName: 'a',
          ordinal: 1,
        ),
      ];
      final schema = buildSchema(
        const [
          RawTable(schema: 'public', name: 'users', isView: false),
          RawTable(schema: 'public', name: 'user_summary', isView: true),
        ],
        const [
          RawColumn(
            schema: 'public',
            table: 'users',
            name: 'id',
            dataType: 'int',
            nullable: false,
            isPrimaryKey: true,
          ),
          RawColumn(
            schema: 'public',
            table: 'users',
            name: 'email',
            dataType: 'text',
            nullable: true,
            isPrimaryKey: false,
          ),
        ],
        const [
          RawForeignKey(
            schema: 'public',
            table: 'users',
            columnName: 'org_id',
            referencedTable: 'orgs',
            referencedColumn: 'id',
          ),
        ],
        idxCols,
        const [RawRowCount(schema: 'public', table: 'users', count: 42)],
      );

      final users = schema.tables.firstWhere((t) => t.name == 'users');
      expect(users.type, SchemaTableType.table);
      expect(users.columns.map((c) => c.name), ['id', 'email']);
      expect(users.columns[0].isPrimaryKey, isTrue);
      expect(users.columns[1].nullable, isTrue);

      expect(users.foreignKeys, hasLength(1));
      final fk = users.foreignKeys.single;
      expect(fk.columnName, 'org_id');
      expect(fk.referencedTable, 'orgs');
      expect(fk.referencedColumn, 'id');
      expect(fk.referencedSchema, isNull);

      // Columns sorted a, b even though supplied 2, 1.
      expect(users.indexes, hasLength(1));
      final index = users.indexes.single;
      expect(index.name, 'ix_ab');
      expect(index.unique, isTrue);
      expect(index.columns, ['a', 'b']);

      expect(users.approxRowCount, 42);

      expect(
        schema.tables.firstWhere((t) => t.name == 'user_summary').type,
        SchemaTableType.view,
      );
    });

    test('gives a bare table empty lists and no row count', () {
      final schema = buildSchema(
        const [RawTable(schema: 'main', name: 't', isView: false)],
        const [],
        const [],
      );
      final table = schema.tables.single;
      expect(table.columns, isEmpty);
      expect(table.foreignKeys, isEmpty);
      expect(table.indexes, isEmpty);
      expect(table.approxRowCount, isNull);
    });
  });
}
