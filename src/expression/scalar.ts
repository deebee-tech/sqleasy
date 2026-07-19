import { DatabaseType } from '../enums/database-type';

/** The shape of the {@link Fn} scalar-expression helpers. */
export type ScalarExpressions = {
  /** NULL-skipping string concatenation. See {@link Fn.concat}. */
  concat(operands: string[], databaseType: DatabaseType): string;
  /** Character (not byte) length. See {@link Fn.charLength}. */
  charLength(operand: string, databaseType: DatabaseType): string;
  /** Round to `places` decimals. See {@link Fn.round}. */
  round(operand: string, places: string | number, databaseType: DatabaseType): string;
  /** The current-timestamp expression. See {@link Fn.now}. */
  now(databaseType: DatabaseType): string;
  /** Fractional (never integer) division. See {@link Fn.divide}. */
  divide(numerator: string, denominator: string, databaseType: DatabaseType): string;
};

/**
 * Pure, per-dialect emit helpers for scalar expressions — the dialect-correctness knowledge for a
 * handful of common functions, factored out so an expression compiler (DeeBee's formula compiler is
 * one consumer) can build normalized SQL without re-deriving each dialect's quirks.
 *
 * Every helper takes ALREADY-BUILT operand SQL — quoted/qualified by the caller — plus the target
 * {@link DatabaseType}, and returns a SQL fragment. No identifier quoting, no parameter binding, no
 * `{Column}` resolution: those stay with the caller. This is deliberately NOT an expression AST —
 * just the normalization helpers.
 */
export const Fn: ScalarExpressions = {
  /**
   * NULL-skipping string concatenation (spreadsheet-style: one NULL operand must not null the whole
   * result). MSSQL `CONCAT` already skips NULLs; the others coalesce each operand to `''` — on
   * Postgres casting to text first, since its `||`/`COALESCE` reject a non-text operand (this also
   * makes `integer || integer` work). Pass two or more operands.
   */
  concat(operands: string[], databaseType: DatabaseType): string {
    if (databaseType === DatabaseType.Mssql) return `CONCAT(${operands.join(', ')})`;
    const parts = operands.map((operand) =>
      databaseType === DatabaseType.Postgres
        ? `COALESCE(CAST(${operand} AS text), '')`
        : `COALESCE(${operand}, '')`,
    );
    return databaseType === DatabaseType.Mysql
      ? `CONCAT(${parts.join(', ')})`
      : `(${parts.join(' || ')})`;
  },

  /**
   * Character length (NOT byte length). MySQL `LENGTH()` counts BYTES (5 for `café`), so use
   * `CHAR_LENGTH()`; MSSQL uses `LEN()`; Postgres/SQLite `LENGTH()` already counts characters on text.
   */
  charLength(operand: string, databaseType: DatabaseType): string {
    if (databaseType === DatabaseType.Mssql) return `LEN(${operand})`;
    if (databaseType === DatabaseType.Mysql) return `CHAR_LENGTH(${operand})`;
    return `LENGTH(${operand})`;
  },

  /**
   * Round to `places` decimal places. Postgres has no `round(double precision, integer)` overload —
   * only `round(numeric, integer)` — so a float column errors; cast to numeric there. The other
   * dialects round a float directly. `places` is emitted verbatim (pass a literal like `2` or `'0'`,
   * or built SQL).
   */
  round(operand: string, places: string | number, databaseType: DatabaseType): string {
    return databaseType === DatabaseType.Postgres
      ? `ROUND(CAST(${operand} AS numeric), ${places})`
      : `ROUND(${operand}, ${places})`;
  },

  /**
   * The current timestamp: `GETDATE()` on MSSQL, `NOW()` on MySQL, `datetime('now')` on SQLite, and
   * `CURRENT_TIMESTAMP` on Postgres (also the standard fallback for an unset/unknown dialect).
   */
  now(databaseType: DatabaseType): string {
    switch (databaseType) {
      case DatabaseType.Mssql:
        return 'GETDATE()';
      case DatabaseType.Mysql:
        return 'NOW()';
      case DatabaseType.Sqlite:
        return `datetime('now')`;
      default:
        return 'CURRENT_TIMESTAMP';
    }
  },

  /**
   * Fractional division — `numerator / denominator` that NEVER truncates to integer division.
   * Postgres, MSSQL, and SQLite all do INTEGER division when both operands are integers (`5 / 2` → 2);
   * MySQL already yields a decimal. This casts the numerator to the dialect's fractional type so the
   * result is always fractional: Postgres `numeric`, MSSQL `decimal`, SQLite `REAL`; MySQL is left as
   * a plain `/`. Division-by-zero behavior is the dialect's own (Postgres/MSSQL error, MySQL/SQLite
   * yield NULL) — this normalizes the integer-vs-decimal split only.
   */
  divide(numerator: string, denominator: string, databaseType: DatabaseType): string {
    switch (databaseType) {
      case DatabaseType.Postgres:
        return `(CAST(${numerator} AS numeric) / ${denominator})`;
      case DatabaseType.Mssql:
        return `(CAST(${numerator} AS decimal(38, 10)) / ${denominator})`;
      case DatabaseType.Sqlite:
        return `(CAST(${numerator} AS REAL) / ${denominator})`;
      default:
        return `(${numerator} / ${denominator})`;
    }
  },
};
