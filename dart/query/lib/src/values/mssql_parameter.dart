/// MSSQL's `sp_executesql` parameter rendering.
///
/// MSSQL is the one dialect where inlined literal formatting is *executed* rather than merely
/// displayed: `parsePrepared()` wraps the statement in `exec sp_executesql`, declares each parameter
/// with a T-SQL type, and inlines its value — so `params` comes back empty. Every number and date
/// divergence in [sql_value] is therefore a **correctness** bug here, not just a golden-string one.
library;

import 'dart:typed_data';

import '../enums.dart';
import '../errors/parser_error.dart';
import 'sql_literal.dart';
import 'sql_value.dart';

/// The T-SQL type declared for an `@pN` parameter, inferred from its value.
String mssqlParameterType(Object? value) {
  if (value is Uint8List) {
    return 'varbinary(max)';
  }

  if (value is String) {
    // `varchar` wherever the value survives it, because an `nvarchar` parameter against a `varchar`
    // column converts the COLUMN and loses the index seek. See [isCodepageSafeText] — this is a
    // measured 10x, not a style preference. The literal in the sp_executesql value list must agree,
    // and `sqlLiteral` applies the same test.
    return isCodepageSafeText(value) ? 'varchar(max)' : 'nvarchar(max)';
  }

  if (value is num) {
    if (!value.isFinite) {
      throw ParserError(
          ParserArea.general, 'value is not a finite number: $value');
    }

    // Only a SAFE integer is declared as an integral type. `Number.isInteger(1e21)` is true, but it
    // renders as `1e+21` — not a legal `bigint` literal, so SQL Server rejects the batch. Beyond
    // 2^53 nothing is exactly an integer anyway; `float` accepts scientific notation.
    if (isSafeIntegral(value)) {
      // NOTE: `isIntegral`, not `value is int`. An integral DOUBLE (5.0) must land in exactly the
      // same band as the int 5 — that is what TypeScript does, and the corpus froze it. Using
      // `is int` here would declare `float` on the Dart VM and `int` on dart2js, from one input.
      //
      // ONE declaration across the whole 32-bit range, deliberately. This used to band by magnitude
      // — `tinyint` 0–255, then `smallint`, then `int` — and that is a plan-cache multiplier,
      // because sp_executesql's cache key includes the parameter DECLARATION. The same statement
      // against the same column cached a separate plan per band, so `id = 200` and `id = 5000`
      // compiled twice for no reason (measured: 3 declarations, 3 plans). Narrower types bought
      // nothing either: against an `int` column the narrower parameter is the side that gets
      // converted, so the seek was never at stake.
      //
      // `bigint` only past the 32-bit range, where the column has to be `bigint` anyway.
      if (value >= -2147483648 && value <= 2147483647) {
        return 'int';
      } else {
        return 'bigint';
      }
    }

    return 'float';
  }

  if (value is bool) {
    return 'bit';
  }

  if (value is BigInt) {
    return 'bigint';
  }

  return 'nvarchar(max)';
}

/// A value as a T-SQL literal for the `sp_executesql` value list.
String mssqlParameterValue(Object? value) =>
    sqlLiteral(value, DatabaseType.mssql);
