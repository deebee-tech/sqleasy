import 'package:sqleasy/sqleasy.dart';
import 'package:test/test.dart';

// The engine-native surface names forward to the same runtime as the generic ones, so they emit the
// identical SQL — these confirm the delegators are wired correctly (the ceiling/compile-time side is
// proven in test/views_ceiling_test.dart and test/views_conformance_test.dart).
void main() {
  group('MSSQL updlock family', () {
    QueryBuilder locked(void Function(MssqlQueryBuilder b) apply) {
      final b = MssqlQuery().newBuilder()
        ..selectAll()
        ..fromTable('users', alias: 'u');
      apply(b);
      return b as QueryBuilder;
    }

    test('updlock() emits WITH (UPDLOCK, ROWLOCK)', () {
      expect(locked((b) => b.updlock()).parseRaw(),
          contains('WITH (UPDLOCK, ROWLOCK)'));
    });

    test('updlockNowait() adds NOWAIT', () {
      expect(locked((b) => b.updlockNowait()).parseRaw(), contains('NOWAIT'));
    });

    test('updlockReadpast() adds READPAST', () {
      expect(
          locked((b) => b.updlockReadpast()).parseRaw(), contains('READPAST'));
    });
  });

  group('MySQL upsert spellings', () {
    QueryBuilder inserted(void Function(MysqlQueryBuilder b) apply) {
      final b = MysqlQuery().newBuilder()
        ..insertInto('users')
        ..insertColumns(['email', 'name'])
        ..insertValues(['a@b.c', 'Ada']);
      apply(b);
      return b as QueryBuilder;
    }

    test('insertIgnore() emits INSERT IGNORE', () {
      expect(inserted((b) => b.insertIgnore()).parseRaw(),
          contains('INSERT IGNORE'));
    });

    test('onDuplicateKeyUpdate() emits ON DUPLICATE KEY UPDATE', () {
      final sql = inserted(
        (b) => b.onDuplicateKeyUpdate([(column: 'name', value: 'Ada')]),
      ).parseRaw();
      expect(sql, contains('ON DUPLICATE KEY UPDATE'));
    });

    test('onDuplicateKeyUpdateRaw() emits the raw SET list', () {
      final sql = inserted(
        (b) => b.onDuplicateKeyUpdateRaw('name = VALUES(name)'),
      ).parseRaw();
      expect(sql, contains('ON DUPLICATE KEY UPDATE name = VALUES(name)'));
    });
  });
}
