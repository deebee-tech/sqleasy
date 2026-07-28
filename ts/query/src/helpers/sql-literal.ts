import { DatabaseType } from '../enums/database-type';
import { ParserArea } from '../enums/parser-area';
import { ParserError } from './parser-error';
import { sqlStringLiteral } from './sql';

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

const isBinaryValue = (value: unknown): value is Uint8Array => value instanceof Uint8Array;

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
        return "N'" + value.replaceAll("'", "''") + "'";
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
