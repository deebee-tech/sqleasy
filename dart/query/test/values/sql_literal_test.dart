import 'dart:typed_data';

import 'package:sqleasy/sqleasy.dart';
import 'package:sqleasy/src/values/sql_literal.dart';
import 'package:test/test.dart';

void main() {
  group('parseDisplay', () {
    test('Postgres inlines escaped literals (no \$n placeholders)', () {
      final builder = PostgresQuery()
          .newBuilder()
          .selectAll()
          .fromTable('users', alias: 'u')
          .where('u', 'name', WhereOperator.equals, "O'Brien")
          .and()
          .where('u', 'active', WhereOperator.equals, true);

      expect(
        builder.parseDisplay(),
        'SELECT * FROM "public"."users" AS "u" WHERE "u"."name" = \'O\'\'Brien\' AND "u"."active" = TRUE;',
      );
      expect(builder.parseDisplay(), isNot(contains(r'$1')));
    });

    test('MSSQL returns the inner statement — not sp_executesql', () {
      final builder = MssqlQuery()
          .newBuilder()
          .selectAll()
          .fromTable('users', alias: 'u')
          .where('u', 'name', WhereOperator.equals, "O'Brien")
          .and()
          .where('u', 'id', WhereOperator.equals, 42);

      final sql = builder.parseDisplay();
      expect(
        sql,
        "SELECT * FROM [dbo].[users] AS [u] WHERE [u].[name] = N'O''Brien' AND [u].[id] = 42;",
      );
      expect(sql, isNot(contains('sp_executesql')));
      expect(builder.parse(), contains('sp_executesql'));
    });

    test('quotes strings (unlike parseRaw golden form)', () {
      final builder = PostgresQuery()
          .newBuilder()
          .selectAll()
          .fromTable('users', alias: 'u')
          .where('u', 'name', WhereOperator.equals, "O'Brien");

      expect(builder.parseDisplay(), contains("'O''Brien'"));
      // parseRaw deliberately leaves values unquoted for golden readability.
      expect(builder.parseRaw(), contains("= O'Brien"));
      expect(builder.parseRaw(), isNot(contains("'O''Brien'")));
    });
  });

  group('sqlLiteral', () {
    test('formats binary per dialect', () {
      final bytes = Uint8List.fromList([0xde, 0xad]);
      expect(sqlLiteral(bytes, DatabaseType.mssql), '0xdead');
      expect(sqlLiteral(bytes, DatabaseType.postgres), "'\\xdead'");
      expect(sqlLiteral(bytes, DatabaseType.mysql), "X'dead'");
      expect(sqlLiteral(bytes, DatabaseType.sqlite), "X'dead'");
    });
  });
}
