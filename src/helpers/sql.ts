import type { Dialect } from '../configuration/configuration';
import { ParserMode } from '../enums/parser-mode';

/** Accumulates SQL fragments and their bound values while a parser walks a query state. */
export class SqlHelper {
  #parts: string[] = [];
  #values: any[] = [];
  #config: Dialect;
  #parserMode: ParserMode;

  constructor(config: Dialect, parserMode: ParserMode) {
    this.#config = config;
    this.#parserMode = parserMode;
  }

  public addDynamicValue = (value: any): string => {
    if (this.#parserMode === ParserMode.Prepared) {
      this.#values.push(value);
      return this.#config.preparedStatementPlaceholder;
    }

    return this.getValueStringFromDataType(value);
  };

  public addSqlSnippet = (sql: string): void => {
    this.#parts.push(sql);
  };

  public addSqlSnippetWithValues = (sqlString: string, values: any[]): void => {
    this.#values.push(...values);
    this.addSqlSnippet(sqlString);
  };

  public clear = (): void => {
    this.#parts = [];
    this.#values = [];
  };

  public getSql = (): string => {
    return this.#parts.join('');
  };

  // ponytail: DEBUG / TEST rendering only — inlines each value UNQUOTED and UNESCAPED (a string
  // `a'b` renders as `= a'b`, not `= 'a''b'`). The output is a readable golden string
  // for the parser test suite (hundreds of assertions), NOT executable SQL. NEVER hand this to a
  // driver — execute the parameterized `parsePrepared()` (`{sql, params}`) instead. Kept unquoted
  // deliberately so the tests read as plain SQL; quoting it would rewrite the whole golden suite.
  public getSqlDebug = (): string => {
    let sqlString = this.#parts.join('');
    const placeholder = this.#config.preparedStatementPlaceholder;

    this.#values.forEach((value) => {
      const valuePosition = sqlString.indexOf(placeholder);

      if (valuePosition === -1) {
        return;
      }

      sqlString =
        sqlString.substring(0, valuePosition) +
        this.getValueStringFromDataType(value) +
        sqlString.substring(valuePosition + placeholder.length);
    });

    return sqlString;
  };

  public getValues = (): any[] => {
    // Exactly one value per emitted placeholder — never filter. `addDynamicValue` pushes one
    // value (null included) for every `?`/`$n` it emits, so stripping null/undefined here would
    // shift every later bound parameter by one and corrupt the write. SQL NULL is a bound null.
    return [...this.#values];
  };

  public getValueStringFromDataType = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }

    switch (typeof value) {
      case 'string':
        return value;
      case 'number':
        return value.toString();
      case 'boolean':
        return value ? 'true' : 'false';
      case 'object':
        if (value instanceof Date) {
          return value.toISOString();
        }
        return JSON.stringify(value);
      default:
        return value.toString();
    }
  };
}
