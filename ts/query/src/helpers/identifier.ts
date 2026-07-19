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
  // Parser state carries these as `string | undefined`; a nullish name is an empty identifier
  // (the emitting site is guarded so this never fires at runtime) — never the literal "undefined".
  const id = name ?? '';
  if (id.includes('\0')) {
    throw new ParserError(ParserArea.General, 'identifier contains a NUL byte');
  }
  const escaped = id.split(delimiters.end).join(delimiters.end + delimiters.end);
  return delimiters.begin + escaped + delimiters.end;
}
