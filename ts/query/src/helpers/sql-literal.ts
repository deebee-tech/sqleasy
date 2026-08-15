import { DatabaseType } from '../enums/database-type';
import { ParserArea } from '../enums/parser-area';
import { ParserError } from './parser-error';
import { sqlStringLiteral } from './sql';

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

const isBinaryValue = (value: unknown): value is Uint8Array => value instanceof Uint8Array;

/**
 * Whether a string is safe to carry to SQL Server as `varchar` rather than `nvarchar`.
 *
 * This decides an index seek, not a nicety. T-SQL type precedence puts `nvarchar` above `varchar`,
 * so comparing a `varchar` COLUMN to an `nvarchar` parameter converts the column — and a converted
 * column cannot be seeked. Measured on `SQL_Latin1_General_CP1_CI_AS`: an `nvarchar` parameter
 * against an indexed `varchar(50)` column produced an index SCAN at 10x the cost of the seek a
 * `varchar` parameter got. The reverse never bites: a `varchar` parameter against an `nvarchar`
 * column converts the PARAMETER, which is one scalar operation and leaves the seek intact. So
 * `varchar` is the strictly safer declaration wherever the value survives it.
 *
 * ASCII is the conservative test. `varchar` really means "the server's codepage", which the parser
 * cannot know, and CP1252 would admit accented Latin text too — so a name like `José` falls back to
 * `nvarchar` here and may scan a `varchar` column. That is the correct trade: a scan returns the
 * right rows, and guessing a codepage returns the wrong ones. Everything a check-in kiosk actually
 * searches on — plain names, phone digits, email addresses, codes — is ASCII and gets the seek.
 */
export const isCodepageSafeText = (value: string): boolean => {
  for (let i = 0; i < value.length; i++) {
    if (value.charCodeAt(i) > 0x7f) {
      return false;
    }
  }
  return true;
};

/**
 * A dialect-correct SQL literal for DISPLAY / paste-into-client use.
 *
 * Quotes and escapes strings, renders `NULL`, and uses each engine's usual forms for booleans,
 * dates, and binary. This is what {@link parseDisplay} inlines into the statement text so a human
 * can copy the result into SSMS / psql / mysql / sqlite3.
 *
 * **Not for driver execution.** Prefer {@link parsePrepared}. Distinct from {@link parseRaw}, which
 * deliberately leaves values unquoted for golden-test readability.
 */
export const sqlLiteral = (value: unknown, databaseType: DatabaseType): string => {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  if (isBinaryValue(value)) {
    const hex = toHex(value);
    switch (databaseType) {
      case DatabaseType.Mssql:
        return '0x' + hex;
      case DatabaseType.Postgres:
        return sqlStringLiteral('\\x' + hex);
      default:
        // MySQL and SQLite both accept the X'…' hex blob form.
        return "X'" + hex + "'";
    }
  }

  switch (typeof value) {
    case 'number':
      if (!Number.isFinite(value)) {
        throw new ParserError(ParserArea.General, `value is not a finite number: ${value}`);
      }
      return value.toString();
    case 'bigint':
      return value.toString();
    case 'boolean':
      if (databaseType === DatabaseType.Mssql || databaseType === DatabaseType.Sqlite) {
        return value ? '1' : '0';
      }
      return value ? 'TRUE' : 'FALSE';
    case 'string':
      if (databaseType === DatabaseType.Mssql) {
        // The `N` prefix must agree with the declared parameter type in `mssqlParameterType`, or
        // sp_executesql is handed an nvarchar literal for a varchar parameter. See
        // {@link isCodepageSafeText} for why the unprefixed form is preferred where it is safe.
        const quoted = "'" + value.replaceAll("'", "''") + "'";
        return isCodepageSafeText(value) ? quoted : 'N' + quoted;
      }
      return sqlStringLiteral(value);
    case 'object':
      if (value instanceof Date) {
        return sqlStringLiteral(value.toISOString());
      }
      {
        const json = JSON.stringify(value).replaceAll("'", "''");
        return databaseType === DatabaseType.Mssql ? "N'" + json + "'" : "'" + json + "'";
      }
    default:
      return sqlStringLiteral(String(value));
  }
};
