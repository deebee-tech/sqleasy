import '../configuration.dart';
import '../enums.dart';
import '../errors/parser_error.dart';
import '../identifier.dart';
import '../sql_helper.dart';
import '../state.dart';
import 'default_order_by.dart';

/// JSON aggregation — rows folded into one JSON array or object in a single SELECT-list column.
///
/// Mirrors the TypeScript port. One capability per shape (array, object), spelled per dialect;
/// refused entirely on MSSQL 2022. Measured:
///
///     Postgres  json_agg / jsonb_agg / json_object_agg / jsonb_object_agg   DISTINCT + ORDER BY
///     MySQL     JSON_ARRAYAGG / JSON_OBJECTAGG                               neither (ERROR 1064)
///     SQLite    json_group_array / json_group_object                        DISTINCT + ORDER BY
///     MSSQL     NONE — JSON_ARRAYAGG is Azure/2025 only; FOR JSON PATH is a different construct
const Map<DatabaseType, ({String array, String object})> _fn = {
  DatabaseType.postgres: (array: 'json_agg', object: 'json_object_agg'),
  DatabaseType.mysql: (array: 'JSON_ARRAYAGG', object: 'JSON_OBJECTAGG'),
  DatabaseType.sqlite: (array: 'json_group_array', object: 'json_group_object'),
};

void emitJsonAggregation(
  SqlHelper sqlHelper,
  Dialect config,
  String valueTable,
  String valueColumn,
  SelectState state,
  ParserArea area,
) {
  final db = config.databaseType;
  final names = _fn[db];

  if (names == null) {
    throw ParserError(
      area,
      'MSSQL has no JSON aggregate function — JSON_ARRAYAGG is Azure SQL / SQL Server 2025 only, '
      'and 2022 does not have it. FOR JSON PATH shapes the whole result set into one document, '
      'which is a different thing, so this library does not substitute it. Build the document '
      'yourself with a FOR JSON subquery via selectRaw if you need it on SQL Server 2022.',
    );
  }

  final value =
      qualifiedColumn(valueTable, valueColumn, config.identifierDelimiters);

  if (db == DatabaseType.mysql) {
    if (state.jsonAggDistinct) {
      throw ParserError(
        area,
        'MySQL JSON aggregation has no DISTINCT — de-duplicate in a subquery first, or aggregate '
        'on Postgres/SQLite which support it.',
      );
    }
    if (state.jsonAggOrderBy.isNotEmpty) {
      throw ParserError(
        area,
        'MySQL JSON aggregation has no inner ORDER BY — element order is unspecified. Order the '
        'rows in a subquery, or aggregate on Postgres/SQLite which support the inner ORDER BY.',
      );
    }
  }

  if (state.jsonAggJsonb && db != DatabaseType.postgres) {
    throw ParserError(
      area,
      'Only Postgres has a jsonb aggregate — jsonb is a Postgres storage type. Drop the jsonb '
      'option on this dialect; its json aggregate returns the same shape.',
    );
  }

  final isArray = state.jsonAggShape == 'array';
  final fnName = state.jsonAggJsonb
      ? (isArray ? 'jsonb_agg' : 'jsonb_object_agg')
      : (isArray ? names.array : names.object);

  sqlHelper.addSqlSnippet(fnName);
  sqlHelper.addSqlSnippet('(');
  if (state.jsonAggDistinct) sqlHelper.addSqlSnippet('DISTINCT ');

  if (!isArray) {
    sqlHelper.addSqlSnippet(qualifiedColumn(state.jsonAggKeyTable ?? '',
        state.jsonAggKeyColumn ?? '', config.identifierDelimiters));
    sqlHelper.addSqlSnippet(', ');
  }

  sqlHelper.addSqlSnippet(value);

  if (state.jsonAggOrderBy.isNotEmpty) {
    sqlHelper.addSqlSnippet(' ORDER BY ');
    final keys = state.jsonAggOrderBy;
    for (var i = 0; i < keys.length; i++) {
      emitOrderByTerm(sqlHelper, config, keys[i].tableNameOrAlias,
          keys[i].columnName, keys[i].direction, NullsOrder.none);
      if (i < keys.length - 1) sqlHelper.addSqlSnippet(', ');
    }
  }

  sqlHelper.addSqlSnippet(')');
}
