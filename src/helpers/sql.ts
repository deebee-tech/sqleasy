import { ParserArea } from '../enums/parser-area';
import { ParserMode } from '../enums/parser-mode';
import { ParserError } from './parser-error';

const NUL = String.fromCharCode(0);

/**
 * Marks where one bound value sits in a Prepared-mode SQL string, until the final pass swaps it for
 * the dialect's real placeholder.
 *
 * The clause walk must NOT emit the dialect's own `?`/`$` directly. The final pass locates
 * placeholders by scanning the rendered SQL, and a `?` or `$` inside a caller-supplied raw fragment
 * is indistinguishable from a real one: `selectRaw("'why?' AS q")` had its literal rewritten to
 * `'why@p0'` while the true placeholder was left dangling, and Postgres turned `selectRaw("'$100'")`
 * into `'$1100'`, shifting every later `$n` past its value. A NUL byte cannot appear in a raw
 * fragment or an identifier (both reject it), so this token cannot be forged from caller text.
 */
export const PLACEHOLDER_TOKEN = NUL + '?' + NUL;

/**
 * Refuses a value that has no SQL representation, at the point it is bound or inlined.
 *
 * `NaN`/`Infinity` used to render as the bare words `NaN`/`Infinity` (invalid SQL in every dialect)
 * when inlined, and to sail straight into the bound `params` otherwise — surfacing as a driver-level
 * error far from the call that caused it, or silently coercing. Fail here, where the caller is.
 */
export const assertBindableValue = (value: any): void => {
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new ParserError(ParserArea.General, `value is not a finite number: ${value}`);
  }
};

/**
 * Replaces each {@link PLACEHOLDER_TOKEN} with the dialect's placeholder, in emission order.
 *
 * Values are appended in the same order their tokens are, so the Nth token binds the Nth value.
 * `nth` receives the zero-based index, which Postgres needs for `$1`, `$2`, … and MSSQL for
 * `@p0`, `@p1`, ….
 */
export const renderPlaceholders = (sql: string, nth: (index: number) => string): string => {
  let index = 0;
  return sql.split(PLACEHOLDER_TOKEN).reduce((acc, part) => acc + nth(index++) + part);
};

/**
 * Accumulates SQL fragments and their bound values while a parser walks a query state.
 *
 * Deliberately dialect-agnostic: it emits {@link PLACEHOLDER_TOKEN}, never a dialect's `?`/`$`, so
 * it needs no {@link Dialect}. The dialect's placeholder is applied once, at the top-level parse.
 */
export class SqlHelper {
  #parts: string[] = [];
  #values: any[] = [];
  #parserMode: ParserMode;

  constructor(parserMode: ParserMode) {
    this.#parserMode = parserMode;
  }

  /**
   * Emits one bound value: a {@link PLACEHOLDER_TOKEN} in Prepared mode (with the value recorded for
   * binding), or the value inlined in Raw mode.
   *
   * This appends directly rather than returning text for the caller to pass back through
   * {@link addSqlSnippet}, so that `addSqlSnippet` can reject *every* NUL byte it sees. If the token
   * passed through the public path, `addSqlSnippet` could not tell our token from a NUL sequence
   * in a caller's raw fragment — which is exactly how a raw fragment could forge a placeholder.
   */
  public addDynamicValue = (value: any): void => {
    assertBindableValue(value);

    if (this.#parserMode === ParserMode.Prepared) {
      this.#values.push(value);
      this.#parts.push(PLACEHOLDER_TOKEN);
      return;
    }

    this.#parts.push(this.getValueStringFromDataType(value));
  };

  /**
   * Appends a SQL fragment. This is the path every caller-supplied raw fragment takes, so a NUL
   * byte is refused outright: it could forge a {@link PLACEHOLDER_TOKEN} and steal a bound value's
   * position, and it silently truncates the statement in some drivers. Our own tokens never come
   * through here — see {@link addDynamicValue}.
   */
  public addSqlSnippet = (sql: string): void => {
    if (sql.includes(NUL)) {
      throw new ParserError(ParserArea.General, 'SQL fragment contains a NUL byte');
    }

    this.#parts.push(sql);
  };

  /**
   * Splices a sub-parser's already-rendered SQL and its bound values into this helper. The sub-SQL
   * legitimately carries {@link PLACEHOLDER_TOKEN}s, so it bypasses the NUL check in
   * {@link addSqlSnippet} — its own fragments were validated when the sub-parser built them.
   */
  public addSqlSnippetWithValues = (sqlString: string, values: any[]): void => {
    this.#values.push(...values);
    this.#parts.push(sqlString);
  };

  public clear = (): void => {
    this.#parts = [];
    this.#values = [];
  };

  /**
   * The rendered SQL, still carrying {@link PLACEHOLDER_TOKEN} for each bound value. Sub-parsers
   * compose their output into a parent helper, so the tokens must survive until the top-level
   * parse swaps them for the dialect's placeholder via {@link renderPlaceholders}.
   */
  public getSql = (): string => {
    return this.#parts.join('');
  };

  // DEBUG / TEST rendering only — inlines each value UNQUOTED and UNESCAPED (a string `a'b` renders
  // as `= a'b`, not `= 'a''b'`). The output is a readable golden string for the parser test suite
  // (hundreds of assertions), NOT executable SQL. NEVER hand this to a driver — execute the
  // parameterized `parsePrepared()` (`{sql, params}`) instead. Kept unquoted deliberately so the
  // tests read as plain SQL; quoting it would rewrite the whole golden suite.
  public getSqlDebug = (): string => {
    // Splitting on the token is exact. The old scan for the dialect's `?`/`$` could land inside a
    // raw fragment or an inlined value and substitute in the wrong place.
    const values = this.#values;
    return renderPlaceholders(this.#parts.join(''), (index) =>
      index < values.length ? this.getValueStringFromDataType(values[index]) : '',
    );
  };

  public getValues = (): any[] => {
    // Exactly one value per emitted placeholder — never filter. `addDynamicValue` pushes one
    // value (null included) for every token it emits, so stripping null/undefined here would
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
        // NaN/Infinity have no SQL literal — they used to render as the bare words `NaN`/`Infinity`,
        // which every dialect rejects. Fail loudly at build time rather than at the driver.
        if (!Number.isFinite(value)) {
          throw new ParserError(ParserArea.General, `value is not a finite number: ${value}`);
        }
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
