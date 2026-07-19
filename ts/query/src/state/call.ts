import { CallKind } from '../enums/call-kind';
import type { CallParamDirection } from '../enums/call-param-direction';
import { CallReturnIntent } from '../enums/call-return-intent';

/**
 * One argument to a {@link QueryBuilder.callProcedure}/{@link QueryBuilder.callFunction} call.
 *
 * `name` is dual-purpose, matching how the underlying SQL actually spells a named argument. For
 * {@link CallParamDirection.In} it is the *named-argument key* — Postgres (`name := value`) and
 * MSSQL (`@name = value`) match it against the routine's own declared parameter name; MySQL has
 * no named-argument syntax and refuses it. For {@link CallParamDirection.Out}/{@link
 * CallParamDirection.InOut} it is instead the *variable identifier*: the MSSQL local variable
 * `DECLARE @name ...` declares, or the MySQL session variable `@name` references — required on
 * both, and by convention the same name as the routine's own parameter. Postgres has no variables
 * at all (an OUT value simply comes back as a result column of the `CALL`), so `name` there is
 * always just the named-argument key, and may be omitted.
 */
export type CallParamState = {
  /** Calling convention: bound input, output-only, or both. */
  direction: CallParamDirection;
  /** See the type-level doc above — meaning depends on `direction` and dialect. */
  name: string | undefined;
  /** Bound value for `In`/`InOut`; ignored (no value to supply) for `Out`. */
  value: any;
  /** Declared T-SQL type for an MSSQL OUT/INOUT variable (e.g. `'INT'`); required there only. */
  sqlType: string | undefined;
  /** Raw SQL argument expression, emitted verbatim — mutually exclusive with `value`. */
  raw: string | undefined;
};

/**
 * Holds state for a {@link QueryBuilder.callProcedure}/{@link QueryBuilder.callFunction}
 * statement. Populated by the builder; exposed via {@link QueryState.callState}.
 */
export type CallState = {
  /** Procedure (`CALL`/`EXEC`) or function (`SELECT` expression). */
  kind: CallKind;
  /** Schema/owner the routine lives in; `undefined`/`''` omits it. */
  owner: string | undefined;
  /** The routine name. */
  name: string;
  /** For functions: scalar vs. set-returning invocation. Unused for procedures. */
  returnIntent: CallReturnIntent;
  /** Arguments in declaration order. */
  params: CallParamState[];
};

/** Creates a {@link CallState} with default field values. */
export const createCallState = (): CallState => ({
  kind: CallKind.Procedure,
  owner: undefined,
  name: '',
  returnIntent: CallReturnIntent.Void,
  params: [],
});
