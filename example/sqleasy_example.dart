// ignore_for_file: avoid_print

import 'package:sqleasy/sqleasy.dart';

/// SQLEasy builds the SQL and its bound parameters. It does not connect to anything — you hand the
/// pair to whatever driver you already use (`postgres`, `mysql_client`, `sqflite`, `drift`, …).
///
/// The builder API lands in the next milestone; today the package exposes the error type and the
/// value-rendering layer that the whole port is built on. See README.md.
void main() {
  try {
    throw ParserError(ParserArea.where, 'IN requires at least one value');
  } on ParserError catch (error) {
    // Renders exactly as the TypeScript implementation does — the golden corpus matches error text.
    print(error); // Where: IN requires at least one value
  }
}
