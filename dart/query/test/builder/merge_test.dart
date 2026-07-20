import 'package:sqleasy/sqleasy.dart';
import 'package:test/test.dart';

void main() {
  // MERGE is native T-SQL and exists on no other dialect. An explicit surface the caller opts into,
  // expressing MERGE as T-SQL defines it — not the removed silent INSERT-becomes-MERGE. The emitted
  // SQL must match the TypeScript port byte-for-byte (both are pinned by the golden corpus).
  group('MSSQL MERGE', () {
    QueryBuilder mssql() => MssqlQuery().newBuilder();

    test('emits a full three-arm MERGE with HOLDLOCK', () {
      final b = mssql()
        ..merge((m) {
          m
            ..into('users', 'target')
            ..holdlock()
            ..usingValues('source', [
              'id',
              'email',
              'name'
            ], [
              [1, 'a@x.io', 'Ada'],
            ])
            ..on((on) =>
                on.on('target', 'id', JoinOperator.equals, 'source', 'id'))
            ..whenMatchedThenUpdate([
              MergeAssignment('email', source('email')),
              MergeAssignment('name', source('name')),
            ])
            ..whenNotMatchedThenInsert(
              ['id', 'email', 'name'],
              [source('id'), source('email'), source('name')],
            )
            ..whenNotMatchedBySourceThenDelete();
        });

      expect(
        b.parseRaw(),
        equals('MERGE INTO [dbo].[users] WITH (HOLDLOCK) AS [target] '
            'USING (VALUES (1, a@x.io, Ada)) AS [source] ([id], [email], [name]) '
            'ON [target].[id] = [source].[id] '
            'WHEN MATCHED THEN UPDATE SET [email] = [source].[email], [name] = [source].[name] '
            'WHEN NOT MATCHED BY TARGET THEN INSERT ([id], [email], [name]) '
            'VALUES ([source].[id], [source].[email], [source].[name]) '
            'WHEN NOT MATCHED BY SOURCE THEN DELETE;'),
      );
    });

    test('places WITH (HOLDLOCK) before the alias', () {
      final b = mssql()
        ..merge((m) {
          m
            ..into('t')
            ..holdlock()
            ..usingTable('staging', 'source')
            ..on((on) =>
                on.on('target', 'id', JoinOperator.equals, 'source', 'id'))
            ..whenMatchedThenDelete();
        });
      expect(b.parseRaw(), contains('[dbo].[t] WITH (HOLDLOCK) AS [target]'));
      expect(b.parseRaw(), isNot(matches(RegExp(r'AS \[target\] WITH'))));
    });

    test('parameterizes USING VALUES literals through sp_executesql', () {
      final b = mssql()
        ..merge((m) {
          m
            ..into('users', 'target')
            ..usingValues('source', [
              'id',
              'name'
            ], [
              [1, 'Ada'],
            ])
            ..on((on) =>
                on.on('target', 'id', JoinOperator.equals, 'source', 'id'))
            ..whenNotMatchedThenInsert(
                ['id', 'name'], [source('id'), source('name')]);
        });
      final prepared = b.parsePrepared();
      expect(prepared.sql, contains('VALUES (@p0, @p1)'));
      expect(prepared.sql, contains('@p0 tinyint, @p1 nvarchar(max)'));
      expect(prepared.params, isEmpty);
    });

    test('carries an AND guard on a WHEN clause', () {
      final b = mssql()
        ..merge((m) {
          m
            ..into('t')
            ..usingTable('s', 'source')
            ..on((on) =>
                on.on('target', 'id', JoinOperator.equals, 'source', 'id'))
            ..whenMatchedThenDelete((and) =>
                and.onValue('source', 'active', JoinOperator.equals, true));
        });
      expect(b.parseRaw(),
          contains('WHEN MATCHED AND [source].[active] = true THEN DELETE'));
    });

    test('supports a raw OUTPUT with \$action', () {
      final b = mssql()
        ..merge((m) {
          m
            ..into('t')
            ..usingTable('s', 'source')
            ..on((on) =>
                on.on('target', 'id', JoinOperator.equals, 'source', 'id'))
            ..whenMatchedThenDelete()
            ..outputRaw('\$action, deleted.id');
        });
      expect(b.parseRaw(), contains('OUTPUT \$action, deleted.id;'));
    });
  });

  group('MERGE cardinality', () {
    test('requires at least one WHEN clause', () {
      final b = MssqlQuery().newBuilder()
        ..merge((m) {
          m
            ..into('t')
            ..usingTable('s', 'source')
            ..on((on) =>
                on.on('target', 'id', JoinOperator.equals, 'source', 'id'));
        });
      expect(
          () => b.parseRaw(),
          throwsA(predicate(
              (e) => e.toString().contains('at least one WHEN clause'))));
    });

    test('rejects two same-kind WHEN MATCHED', () {
      final b = MssqlQuery().newBuilder()
        ..merge((m) {
          m
            ..into('t')
            ..usingTable('s', 'source')
            ..on((on) =>
                on.on('target', 'id', JoinOperator.equals, 'source', 'id'))
            ..whenMatchedThenUpdate([MergeAssignment('x', source('x'))],
                (and) => and.onValue('source', 'a', JoinOperator.equals, true))
            ..whenMatchedThenUpdate([MergeAssignment('y', source('y'))]);
        });
      expect(
          () => b.parseRaw(),
          throwsA(predicate(
              (e) => e.toString().contains('one UPDATE and one DELETE'))));
    });
  });

  group('MERGE refused off MSSQL', () {
    for (final entry in {
      'Postgres': () => PostgresQuery().newBuilder(),
      'MySQL': () => MysqlQuery().newBuilder(),
      'SQLite': () => SqliteQuery().newBuilder(),
    }.entries) {
      test('${entry.key} refuses MERGE', () {
        final b = entry.value()
          ..merge((m) {
            m
              ..into('t')
              ..usingTable('s', 'source')
              ..on((on) =>
                  on.on('target', 'id', JoinOperator.equals, 'source', 'id'))
              ..whenMatchedThenDelete();
          });
        expect(
            () => b.parseRaw(),
            throwsA(predicate((e) =>
                e.toString().contains('${entry.key} has no MERGE statement'))));
        expect(
            () => b.parsePrepared(),
            throwsA(predicate(
                (e) => e.toString().contains('has no MERGE statement'))));
      });
    }
  });
}
