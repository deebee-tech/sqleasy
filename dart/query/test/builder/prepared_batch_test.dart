import 'package:sqleasy/sqleasy.dart';
import 'package:test/test.dart';

/// `preparedStatements()` renders each statement on its own, and placeholder numbering restarts in
/// every one — correct when you run them one at a time, and a misbinding waiting to happen if you
/// concatenate them. `preparedBatch()` is the other half: ONE statement, numbered continuously.
///
/// It is MSSQL-only on purpose. `sp_executesql` takes a `;`-joined batch plus a single parameter
/// list every statement can see; the other three run one statement per prepared call, so there is
/// no honest batch to emit and the call refuses instead.
MssqlQuery _boundMssql() {
  final rc = RuntimeConfiguration()..mssqlBoundParameters = true;
  return MssqlQuery(rc);
}

void _twoStatements(MultiBuilder multi) {
  final count = multi.addBuilder('count') as QueryBuilder;
  count
    ..selectRaw('COUNT(*) AS [total]')
    ..fromTable('contacts', alias: 'c')
    ..where('c', 'campus_id', WhereOperator.equals, 10);

  final page = multi.addBuilder('page') as QueryBuilder;
  page
    ..selectAll()
    ..fromTable('contacts', alias: 'c')
    ..where('c', 'campus_id', WhereOperator.equals, 10)
    ..and()
    ..where('c', 'status_id', WhereOperator.equals, 3);
}

void main() {
  group('MultiBuilder.preparedBatch', () {
    test('numbers placeholders continuously and concatenates the values', () {
      final multi = _boundMssql().newMultiBuilder()
        ..setTransactionState(MultiBuilderTransactionState.transactionOff);
      _twoStatements(multi);

      final prepared = multi.preparedBatch();

      // The collision this exists to prevent: without the offset the second statement would
      // restart at @p0 and silently read the first statement's value.
      expect(prepared.sql, contains('[c].[campus_id] = @p0'));
      expect(prepared.sql, contains('[c].[campus_id] = @p1'));
      expect(prepared.sql, contains('[c].[status_id] = @p2'));
      expect(prepared.params, [10, 10, 3]);

      // Every placeholder in the batch is distinct and covered by exactly one value.
      final used = RegExp(r'@p(\d+)')
          .allMatches(prepared.sql)
          .map((m) => int.parse(m.group(1)!))
          .toList();
      expect(used.toSet().length, prepared.params.length);
      expect(used.reduce((a, b) => a > b ? a : b), prepared.params.length - 1);
    });

    test('includes the transaction delimiters, unlike preparedStatements', () {
      final multi = _boundMssql().newMultiBuilder();
      _twoStatements(multi);

      final prepared = multi.preparedBatch();

      expect(prepared.sql.startsWith('BEGIN TRANSACTION; '), isTrue);
      expect(prepared.sql.endsWith('COMMIT TRANSACTION;'), isTrue);
    });

    test('carries no params under the default inlined form', () {
      final multi = MssqlQuery().newMultiBuilder()
        ..setTransactionState(MultiBuilderTransactionState.transactionOff);
      _twoStatements(multi);

      final prepared = multi.preparedBatch();

      expect(prepared.params, isEmpty);
      // Two self-contained statements, so two wrappers — nothing to renumber between them.
      expect(RegExp('sp_executesql').allMatches(prepared.sql).length, 2);
    });

    test('the other three refuse rather than emitting a batch they cannot run',
        () {
      for (final query in <dynamic>[
        PostgresQuery(),
        MysqlQuery(),
        SqliteQuery()
      ]) {
        final multi = query.newMultiBuilder() as MultiBuilder;
        final b1 = multi.addBuilder('b1') as QueryBuilder;
        b1
          ..selectAll()
          ..fromTable('users', alias: 'u')
          ..where('u', 'id', WhereOperator.equals, 1);

        expect(
          () => multi.preparedBatch(),
          throwsA(predicate((e) => '$e'.contains('only executable on MSSQL'))),
        );
      }
    });

    test('preparedStatements still restarts per statement, as documented', () {
      final multi = _boundMssql().newMultiBuilder()
        ..setTransactionState(MultiBuilderTransactionState.transactionOff);
      _twoStatements(multi);

      final statements = multi.preparedStatements();

      expect(statements.length, 2);
      // Each is independently runnable — which is precisely why they cannot be concatenated.
      expect(statements[0].sql, contains('@p0'));
      expect(statements[1].sql, contains('@p0'));
      expect(statements[0].params, [10]);
      expect(statements[1].params, [10, 3]);
    });
  });
}
