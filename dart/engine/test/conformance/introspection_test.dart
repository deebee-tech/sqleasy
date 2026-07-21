@TestOn('vm')
@Tags(['integration'])
library;

import 'dart:convert';
import 'dart:io';

import 'package:sqleasy_engine/sqleasy_engine.dart';
import 'package:test/test.dart';

/// Replays CORPUS D (schema introspection) against every dialect this port can read.
///
/// The corpus — not this engine — is the definition of correct: it is AUTHORED from
/// `harness/seed/*.sql`, so a failure means the reader is wrong until an argument about what the
/// catalog genuinely says proves otherwise.
///
/// Requires the shared docker harness (`pnpm harness:up`). FAIL LOUD, NEVER SKIP.
void main() {
  // MSSQL is absent from this port ENTIRELY, not merely unreplayed: there is no pure-Dart TDS
  // driver, so `IntrospectDialect` has no `mssql` value to pass. The TypeScript replay covers all
  // four. This set is asserted below so the gap can never go quiet.
  const implemented = <String, IntrospectDialect>{
    'postgres': IntrospectDialect.postgres,
    'mysql': IntrospectDialect.mysql,
    'sqlite': IntrospectDialect.sqlite,
  };

  final corpus = jsonDecode(
    File('../../contract/corpora/introspection/corpus.json').readAsStringSync(),
  ) as Map<String, Object?>;
  final schemaName = (corpus['schemaName']! as Map).cast<String, String>();
  final tables = (corpus['tables']! as List).cast<Map<String, Object?>>();

  /// Resolve a corpus field for one dialect.
  ///
  /// A per-dialect map is a JSON object naming EVERY dialect the contract knows — including `mssql`,
  /// which this port cannot read but the corpus still speaks for. Anything else is the shared value.
  /// A partial map is a corpus bug, never a "fall back to shared" shorthand, so it fails loudly
  /// rather than letting a half-written divergence read as agreement.
  Object? pick(Object? field, String dialect) {
    if (field is! Map) return field;
    const known = {'mssql', 'mysql', 'postgres', 'sqlite'};
    final missing = known.difference(field.keys.cast<String>().toSet());
    if (missing.isNotEmpty) {
      fail('corpus D: per-dialect map is missing ${missing.join(', ')} — '
          'spell out every dialect or use a shared value');
    }
    return field[dialect];
  }

  late Map<String, DbExecutor> executors;
  late Map<String, SchemaData> schemas;

  setUpAll(() async {
    executors = {
      'postgres': await PostgresExecutor.open(
        const PostgresConnectionOptions(
          host: 'localhost',
          database: 'sqleasy_ci',
          username: 'sqleasy',
          password: 'sqleasy_ci',
        ),
      ),
      'mysql': await MysqlExecutor.open(
        const MysqlConnectionOptions(
          host: 'localhost',
          database: 'sqleasy_ci',
          username: 'root',
          password: 'sqleasy_ci',
          allowInvalidCertificate: true,
        ),
      ),
      'sqlite': SqliteExecutor.openInMemory()
        ..database.execute(
          File('../../harness/seed/sqlite.sql').readAsStringSync(),
        ),
    };
    schemas = {
      for (final entry in implemented.entries)
        entry.key: await introspectSchema(
          executors[entry.key]!,
          entry.value,
          entry.key == 'sqlite' ? null : schemaName[entry.key],
        ),
    };
  });

  tearDownAll(() async {
    for (final executor in executors.values) {
      await executor.close();
    }
  });

  test('replays every dialect this port can read', () {
    expect(executors.keys.toSet(), implemented.keys.toSet());
    expect(IntrospectDialect.values.map((d) => d.name).toSet(),
        implemented.keys.toSet(),
        reason:
            'a dialect the port can read but does not replay is a coverage hole');
  });

  for (final dialect in implemented.keys) {
    group(dialect, () {
      test('reports exactly the seeded tables and views', () {
        final got = schemas[dialect]!
            .tables
            .map((t) => '${t.type.name} ${t.name}')
            .toList()
          ..sort();
        final want = tables.map((t) => '${t['type']} ${t['name']}').toList()
          ..sort();
        expect(got, want);
      });

      test('scopes every table to the dialect’s own namespace', () {
        expect(schemas[dialect]!.tables.map((t) => t.schema).toSet(),
            {schemaName[dialect]});
      });

      for (final table in tables) {
        final name = table['name']! as String;
        test('$name: columns, keys, indexes, row-count presence', () {
          final found =
              schemas[dialect]!.tables.where((t) => t.name == name).toList();
          expect(found, hasLength(1),
              reason: '$dialect has no table named $name');
          final got = found.single;

          // Columns in ordinal order — position IS the contract.
          final wantColumns = (table['columns']! as List)
              .cast<Map<String, Object?>>()
              .map((c) => [
                    c['name'],
                    pick(c['dataType'], dialect),
                    pick(c['nullable'], dialect),
                    pick(c['isPrimaryKey'], dialect),
                    pick(c['defaultValue'], dialect),
                  ])
              .toList();
          expect(
            got.columns
                .map((c) => [
                      c.name,
                      c.dataType,
                      c.nullable,
                      c.isPrimaryKey,
                      c.defaultValue,
                    ])
                .toList(),
            wantColumns,
          );

          final wantFks = (table['foreignKeys']! as List)
              .cast<Map<String, Object?>>()
              .map((f) => [
                    f['columnName'],
                    f['referencedTable'],
                    f['referencedColumn'],
                    pick(f['referencedSchema'], dialect),
                  ])
              .toList()
            ..sort((a, b) => '${a.first}'.compareTo('${b.first}'));
          expect(
            got.foreignKeys
                .map((f) => [
                      f.columnName,
                      f.referencedTable,
                      f.referencedColumn,
                      f.referencedSchema,
                    ])
                .toList()
              ..sort((a, b) => '${a.first}'.compareTo('${b.first}')),
            wantFks,
          );

          // Indexes as a SET: enumeration order is the reader's ORDER BY, not the catalog's promise.
          // A null name means the dialect reports no such index at all — drop it, don't expect one.
          final wantIndexes = (table['indexes']! as List)
              .cast<Map<String, Object?>>()
              .map((i) => [pick(i['name'], dialect), i['columns'], i['unique']])
              .where((i) => i.first != null)
              .toList()
            ..sort((a, b) => '${a.first}'.compareTo('${b.first}'));
          expect(
            got.indexes.map((i) => [i.name, i.columns, i.unique]).toList()
              ..sort((a, b) => '${a.first}'.compareTo('${b.first}')),
            wantIndexes,
          );

          // A PRESENCE flag, never a number: it comes from planner statistics that are explicitly
          // allowed to be stale (Postgres reports -1 until ANALYZE; SQLite has no such statistic).
          expect(got.approxRowCount == null ? 'absent' : 'present',
              pick(table['approxRowCount'], dialect));
        });
      }
    });
  }
}
