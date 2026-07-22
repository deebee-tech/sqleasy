import type { ConfigurationDelimiters } from '../configuration/delimiters';
import { ParserArea } from '../enums/parser-area';
import { ParserError } from './parser-error';

/**
 * Quote a SQL identifier (schema/table/column/alias) for a dialect, escaping any embedded closing
 * delimiter by doubling it — the standard SQL identifier escape (`]`→`]]` for MSSQL, `"`→`""` for
 * Postgres, `` ` ``→ ` `` ` for MySQL). Identifier names are user-controlled (a dataset's table and
 * column names), so without escaping a name like `x] OR [1=1` would break out of the quoting and
 * inject SQL. A NUL byte can silently truncate the identifier in some drivers, so it is rejected.
 */
export function quoteIdentifier(
  name: string | undefined,
  delimiters: ConfigurationDelimiters,
): string {
  // Parser state carries these as `string | undefined`; a nullish name is an empty identifier —
  // never the literal "undefined". Callers building a QUALIFIED reference must go through
  // {@link qualifiedColumn}, which is what actually guards the empty case.
  const id = name ?? '';
  if (id.includes('\0')) {
    throw new ParserError(ParserArea.General, 'identifier contains a NUL byte');
  }
  const escaped = id.split(delimiters.end).join(delimiters.end + delimiters.end);
  return delimiters.begin + escaped + delimiters.end;
}

/**
 * A column reference, qualified by its table or alias only when there IS one.
 *
 * An empty alias means "unqualified" — the convention `fromTable(name, '')` has always used, and
 * the one the emission corpus pins ("from table without an alias"). Every other clause used to
 * concatenate `quoteIdentifier(alias) + '.' + quoteIdentifier(column)` unconditionally, so the same
 * empty string that correctly suppressed `AS ""` in FROM produced a zero-length delimited
 * identifier everywhere else. Measured against the harness on the shipped 11.0.0:
 *
 *     WHERE ""."id" = $1   ->  Postgres: ERROR: zero-length delimited identifier
 *     WHERE ""."id" = ?    ->  SQLite:   SQLITE_ERROR: no such column: .id
 *     WHERE ``.`id` = ?    ->  MySQL:    ACCEPTED — returns the row
 *
 * MySQL accepting it is what makes this worse than a plain syntax error: the same builder output
 * runs on one dialect and is rejected by the others, which is precisely the portability trap this
 * library exists to make impossible. Routing every qualified reference through here is what keeps
 * the FROM clause's convention true in all of them.
 */
export function qualifiedColumn(
  tableNameOrAlias: string | undefined,
  columnName: string | undefined,
  delimiters: ConfigurationDelimiters,
): string {
  const column = quoteIdentifier(columnName, delimiters);
  if (tableNameOrAlias === undefined || tableNameOrAlias === '') return column;
  return quoteIdentifier(tableNameOrAlias, delimiters) + '.' + column;
}
