/// Dialect-correct SQL literals for DISPLAY / paste-into-client use.
library;

import 'dart:convert';
import 'dart:typed_data';

import '../enums.dart';
import '../sql_helper.dart';
import 'sql_value.dart';

String _toHex(Uint8List bytes) {
  final buffer = StringBuffer();
  for (final b in bytes) {
    buffer.write(b.toRadixString(16).padLeft(2, '0'));
  }
  return buffer.toString();
}

/// A dialect-correct SQL literal for DISPLAY / paste-into-client use.
///
/// Quotes and escapes strings, renders `NULL`, and uses each engine's usual forms for booleans,
/// dates, and binary. This is what [parseDisplay] inlines into the statement text so a human can
/// copy the result into SSMS / psql / mysql / sqlite3.
///
/// **Not for driver execution.** Prefer [parsePrepared]. Distinct from [parseRaw], which
/// deliberately leaves values unquoted for golden-test readability.
String sqlLiteral(Object? value, DatabaseType databaseType) {
  if (value == null) {
    return 'NULL';
  }

  if (value is Uint8List) {
    final hex = _toHex(value);
    switch (databaseType) {
      case DatabaseType.mssql:
        return '0x$hex';
      case DatabaseType.postgres:
        return sqlStringLiteral('\\x$hex');
      case DatabaseType.mysql:
      case DatabaseType.sqlite:
      case DatabaseType.unknown:
        return "X'$hex'";
    }
  }

  if (value is num) {
    return formatNumber(value);
  }

  if (value is BigInt) {
    return value.toString();
  }

  if (value is bool) {
    if (databaseType == DatabaseType.mssql ||
        databaseType == DatabaseType.sqlite) {
      return value ? '1' : '0';
    }
    return value ? 'TRUE' : 'FALSE';
  }

  if (value is DateTime) {
    return sqlStringLiteral(formatDateTime(value));
  }

  if (value is String) {
    if (databaseType == DatabaseType.mssql) {
      return "N'${value.replaceAll("'", "''")}'";
    }
    return sqlStringLiteral(value);
  }

  final json = jsonEncode(value).replaceAll("'", "''");
  return databaseType == DatabaseType.mssql ? "N'$json'" : "'$json'";
}
