import type { Dialect } from '../configuration/configuration';
import { CallKind } from '../enums/call-kind';
import { CallParamDirection } from '../enums/call-param-direction';
import { CallReturnIntent } from '../enums/call-return-intent';
import { DatabaseType } from '../enums/database-type';
import { ParserArea } from '../enums/parser-area';
import type { ParserMode } from '../enums/parser-mode';
import { quoteIdentifier } from '../helpers/identifier';
import { ParserError } from '../helpers/parser-error';
import { SqlHelper } from '../helpers/sql';
import type { CallParamState, CallState } from '../state/call';
import type { QueryState } from '../state/query';

const AREA = ParserArea.Call;

/**
 * `name`/variable identifiers are spliced into the SQL as bare syntax (`@name`, `name :=`), never
 * through {@link quoteIdentifier} — quoting a T-SQL local variable or a MySQL session variable is
 * not valid syntax at all. Since that text is not a bound value either, it must be restricted to a
 * safe identifier shape here, or a caller-supplied name could inject arbitrary SQL.
 */
const SAFE_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

const assertSafeParamName = (name: string): void => {
  if (!SAFE_NAME_PATTERN.test(name)) {
    throw new ParserError(AREA, `invalid parameter/variable name: "${name}"`);
  }
};

const qualifiedCallName = (config: Dialect, owner: string | undefined, name: string): string => {
  let out = '';
  if (owner && owner !== '') {
    out += quoteIdentifier(owner, config.identifierDelimiters) + '.';
  }
  out += quoteIdentifier(name, config.identifierDelimiters);
  return out;
};

/** Emits one argument's value/raw text — shared by every dialect's `In`/`InOut` handling. */
const emitArgValue = (sqlHelper: SqlHelper, param: CallParamState): void => {
  if (param.raw !== undefined) {
    sqlHelper.addSqlSnippet(param.raw);
    return;
  }
  sqlHelper.addDynamicValue(param.value);
};

// ---------------------------------------------------------------------------
// Postgres: `CALL name(...)` for procedures, `SELECT name(...)` /
// `SELECT * FROM name(...)` for functions. No variables exist — an `Out`
// argument is simply passed as NULL; named args are `name := value`.
// ---------------------------------------------------------------------------

const emitPostgresArgs = (sqlHelper: SqlHelper, params: CallParamState[]): void => {
  sqlHelper.addSqlSnippet('(');

  let sawNamed = false;
  for (let i = 0; i < params.length; i++) {
    const param = params[i]!;
    const named = param.name !== undefined;

    if (named) {
      sawNamed = true;
    } else if (sawNamed) {
      throw new ParserError(AREA, 'a positional argument cannot follow a named argument');
    }

    if (named) {
      assertSafeParamName(param.name!);
      sqlHelper.addSqlSnippet(param.name + ' := ');
    }

    if (param.raw !== undefined) {
      sqlHelper.addSqlSnippet(param.raw);
    } else if (param.direction === CallParamDirection.Out) {
      // No variables in Postgres — the OUT value comes back as a result column of the CALL;
      // the argument slot itself is just a placeholder.
      sqlHelper.addDynamicValue(null);
    } else {
      sqlHelper.addDynamicValue(param.value);
    }

    if (i < params.length - 1) {
      sqlHelper.addSqlSnippet(', ');
    }
  }

  sqlHelper.addSqlSnippet(')');
};

const emitPostgresCall = (sqlHelper: SqlHelper, config: Dialect, callState: CallState): void => {
  if (callState.kind === CallKind.Procedure) {
    sqlHelper.addSqlSnippet('CALL ');
  } else if (callState.returnIntent === CallReturnIntent.ResultSet) {
    sqlHelper.addSqlSnippet('SELECT * FROM ');
  } else {
    sqlHelper.addSqlSnippet('SELECT ');
  }

  sqlHelper.addSqlSnippet(qualifiedCallName(config, callState.owner, callState.name));
  emitPostgresArgs(sqlHelper, callState.params);
};

// ---------------------------------------------------------------------------
// MySQL: `CALL name(...)` for procedures, `SELECT name(...)` for functions
// (no table-valued functions). No named-argument syntax at all; OUT/INOUT
// arguments are session variables (`@name`), referenced positionally. An
// InOut parameter needs its variable seeded first, via a prefixed `SET`.
// ---------------------------------------------------------------------------

const emitMysqlArgs = (sqlHelper: SqlHelper, params: CallParamState[]): void => {
  sqlHelper.addSqlSnippet('(');

  for (let i = 0; i < params.length; i++) {
    const param = params[i]!;

    if (param.name !== undefined && param.direction === CallParamDirection.In) {
      throw new ParserError(AREA, 'MySQL does not support named parameters in CALL');
    }

    if (param.raw !== undefined) {
      sqlHelper.addSqlSnippet(param.raw);
    } else if (
      param.direction === CallParamDirection.Out ||
      param.direction === CallParamDirection.InOut
    ) {
      if (!param.name) {
        throw new ParserError(
          AREA,
          'OUT/INOUT parameters require a session variable name on MySQL',
        );
      }
      assertSafeParamName(param.name);
      sqlHelper.addSqlSnippet('@' + param.name);
    } else {
      sqlHelper.addDynamicValue(param.value);
    }

    if (i < params.length - 1) {
      sqlHelper.addSqlSnippet(', ');
    }
  }

  sqlHelper.addSqlSnippet(')');
};

const emitMysqlCall = (sqlHelper: SqlHelper, config: Dialect, callState: CallState): void => {
  if (callState.kind === CallKind.Function) {
    if (callState.returnIntent === CallReturnIntent.ResultSet) {
      throw new ParserError(AREA, 'MySQL does not support table-valued functions');
    }

    sqlHelper.addSqlSnippet('SELECT ');
    sqlHelper.addSqlSnippet(qualifiedCallName(config, callState.owner, callState.name));
    emitMysqlArgs(sqlHelper, callState.params);
    return;
  }

  // Seed every InOut session variable before the CALL — MySQL user variables carry over between
  // statements in the same session, but a fresh one is untyped/NULL, so InOut needs an explicit
  // starting value.
  for (const param of callState.params) {
    if (param.direction === CallParamDirection.InOut) {
      assertSafeParamName(param.name!);
      sqlHelper.addSqlSnippet('SET @' + param.name + ' = ');
      sqlHelper.addDynamicValue(param.value);
      sqlHelper.addSqlSnippet('; ');
    }
  }

  sqlHelper.addSqlSnippet('CALL ');
  sqlHelper.addSqlSnippet(qualifiedCallName(config, callState.owner, callState.name));
  emitMysqlArgs(sqlHelper, callState.params);
};

// ---------------------------------------------------------------------------
// MSSQL: `EXEC name ...` for procedures, `SELECT name(...)` (scalar) /
// `SELECT * FROM name(...)` (table-valued) for functions. OUT/INOUT
// parameters need a `DECLARE`d local variable, emitted ahead of the EXEC, and
// are always referenced in named form (`@name = @name OUTPUT`) so they can
// mix freely with positional IN arguments earlier in the call.
// ---------------------------------------------------------------------------

const emitMssqlDeclarations = (sqlHelper: SqlHelper, params: CallParamState[]): void => {
  for (const param of params) {
    if (
      param.direction !== CallParamDirection.Out &&
      param.direction !== CallParamDirection.InOut
    ) {
      continue;
    }

    if (!param.name) {
      throw new ParserError(AREA, 'OUT/INOUT parameters require a variable name on MSSQL');
    }
    if (!param.sqlType) {
      throw new ParserError(AREA, 'OUT/INOUT parameters require an explicit sqlType on MSSQL');
    }
    assertSafeParamName(param.name);

    sqlHelper.addSqlSnippet('DECLARE @' + param.name + ' ' + param.sqlType);
    if (param.direction === CallParamDirection.InOut) {
      sqlHelper.addSqlSnippet(' = ');
      sqlHelper.addDynamicValue(param.value);
    }
    sqlHelper.addSqlSnippet('; ');
  }
};

const emitMssqlProcedureArgs = (sqlHelper: SqlHelper, params: CallParamState[]): void => {
  if (params.length === 0) {
    return;
  }

  sqlHelper.addSqlSnippet(' ');

  let sawNamed = false;
  for (let i = 0; i < params.length; i++) {
    const param = params[i]!;
    const hasVariable =
      param.direction === CallParamDirection.Out || param.direction === CallParamDirection.InOut;
    // OUT/INOUT are always emitted in named form (`@name = @name OUTPUT`), so they may follow
    // positional IN arguments without breaking T-SQL's positional-before-named ordering rule.
    const named = hasVariable || param.name !== undefined;

    if (named) {
      sawNamed = true;
    } else if (sawNamed) {
      throw new ParserError(AREA, 'a positional argument cannot follow a named argument');
    }

    if (hasVariable) {
      // `name` was already validated by `emitMssqlDeclarations`.
      sqlHelper.addSqlSnippet('@' + param.name + ' = @' + param.name + ' OUTPUT');
    } else if (param.raw !== undefined) {
      sqlHelper.addSqlSnippet(param.raw);
    } else {
      if (param.name !== undefined) {
        assertSafeParamName(param.name);
        sqlHelper.addSqlSnippet('@' + param.name + ' = ');
      }
      // `param.raw` is already handled by the branch above — only a bound value reaches here.
      sqlHelper.addDynamicValue(param.value);
    }

    if (i < params.length - 1) {
      sqlHelper.addSqlSnippet(', ');
    }
  }
};

const emitMssqlFunctionArgs = (sqlHelper: SqlHelper, params: CallParamState[]): void => {
  sqlHelper.addSqlSnippet('(');

  for (let i = 0; i < params.length; i++) {
    const param = params[i]!;
    if (param.name !== undefined) {
      throw new ParserError(
        AREA,
        'MSSQL does not support named parameters when invoking a function',
      );
    }

    emitArgValue(sqlHelper, param);

    if (i < params.length - 1) {
      sqlHelper.addSqlSnippet(', ');
    }
  }

  sqlHelper.addSqlSnippet(')');
};

const emitMssqlCall = (sqlHelper: SqlHelper, config: Dialect, callState: CallState): void => {
  emitMssqlDeclarations(sqlHelper, callState.params);

  if (callState.kind === CallKind.Procedure) {
    sqlHelper.addSqlSnippet('EXEC ');
    sqlHelper.addSqlSnippet(qualifiedCallName(config, callState.owner, callState.name));
    emitMssqlProcedureArgs(sqlHelper, callState.params);
    return;
  }

  sqlHelper.addSqlSnippet(
    callState.returnIntent === CallReturnIntent.ResultSet ? 'SELECT * FROM ' : 'SELECT ',
  );
  sqlHelper.addSqlSnippet(qualifiedCallName(config, callState.owner, callState.name));
  emitMssqlFunctionArgs(sqlHelper, callState.params);
};

/**
 * Renders a `CALL`/`EXEC`/`SELECT func(...)` statement for {@link QueryState.callState}. SQLite has
 * no stored procedures or functions at all and refuses every call outright. OUT/INOUT parameters
 * are refused for functions on every dialect — a function's result is its return expression, not
 * an output parameter, and none of the `SELECT`-based function emissions below have anywhere to
 * put one.
 */
export const defaultCall = (state: QueryState, config: Dialect, mode: ParserMode): SqlHelper => {
  const sqlHelper = new SqlHelper(mode);

  if (!state.callState) {
    throw new ParserError(AREA, 'No call state provided');
  }
  const callState = state.callState;

  if (!callState.name) {
    throw new ParserError(AREA, 'callProcedure/callFunction requires a name');
  }

  if (config.databaseType === DatabaseType.Sqlite) {
    throw new ParserError(
      AREA,
      'SQLite does not support stored procedures or functions (CALL/EXEC)',
    );
  }

  if (callState.kind === CallKind.Function) {
    for (const param of callState.params) {
      if (param.direction !== CallParamDirection.In) {
        throw new ParserError(
          AREA,
          'OUT/INOUT parameters are only supported for procedure calls, not functions',
        );
      }
    }
  }

  if (config.databaseType === DatabaseType.Postgres) {
    emitPostgresCall(sqlHelper, config, callState);
  } else if (config.databaseType === DatabaseType.Mysql) {
    emitMysqlCall(sqlHelper, config, callState);
  } else {
    emitMssqlCall(sqlHelper, config, callState);
  }

  return sqlHelper;
};
