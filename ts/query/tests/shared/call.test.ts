import { describe, expect, it } from 'vitest';
import {
  CallReturnIntent,
  MssqlQuery,
  MultiBuilderTransactionState,
  MysqlQuery,
  PostgresQuery,
  QueryType,
  SqliteQuery,
} from '../../src';

describe('Stored procedures & functions (CALL / EXEC)', () => {
  describe('callProcedure', () => {
    it('Postgres emits CALL name(...)', () => {
      const builder = new PostgresQuery().newBuilder();
      builder.callProcedure('archive_user').procParam(42);

      expect(builder.parseRaw()).toEqual('CALL "public"."archive_user"(42);');
      expect(builder.parse()).toEqual('CALL "public"."archive_user"($1);');
      expect(builder.parsePrepared()).toEqual({
        sql: 'CALL "public"."archive_user"($1);',
        params: [42],
      });
    });

    it('Postgres callProcedureWithOwner overrides the default owner', () => {
      const builder = new PostgresQuery().newBuilder();
      builder.callProcedureWithOwner('sales', 'close_order').procParam(7);

      expect(builder.parseRaw()).toEqual('CALL "sales"."close_order"(7);');
    });

    it('MySQL emits CALL name(...) with no owner by default', () => {
      const builder = new MysqlQuery().newBuilder();
      builder.callProcedure('archive_user').procParam(42);

      expect(builder.parseRaw()).toEqual('CALL `archive_user`(42);');
      expect(builder.parsePrepared()).toEqual({
        sql: 'CALL `archive_user`(?);',
        params: [42],
      });
    });

    it('MSSQL emits EXEC name ...', () => {
      const builder = new MssqlQuery().newBuilder();
      builder.callProcedure('archive_user').procParam(42);

      expect(builder.parseRaw()).toEqual('EXEC [dbo].[archive_user] 42;');
    });

    it('MSSQL EXEC with no parameters omits the trailing space', () => {
      const builder = new MssqlQuery().newBuilder();
      builder.callProcedure('cleanup');

      expect(builder.parseRaw()).toEqual('EXEC [dbo].[cleanup];');
    });

    it('SQLite has no stored procedures/functions and throws', () => {
      const builder = new SqliteQuery().newBuilder();
      builder.callProcedure('archive_user').procParam(42);

      expect(() => builder.parsePrepared()).toThrow(
        'SQLite does not support stored procedures or functions (CALL/EXEC)',
      );
    });

    it('a call requires a name', () => {
      const builder = new PostgresQuery().newBuilder();
      builder.callProcedure('');

      expect(() => builder.parsePrepared()).toThrow('callProcedure/callFunction requires a name');
    });

    it('throws when no call state is provided', () => {
      const builder = new PostgresQuery().newBuilder();
      builder.selectAll();
      builder.state().queryType = QueryType.Call;

      expect(() => builder.parseRaw()).toThrow('No call state provided');
    });

    it('MSSQL OUT/INOUT parameters require a variable name', () => {
      const builder = new MssqlQuery().newBuilder();
      builder.callProcedure('archive_user');
      builder.state().callState!.params.push({
        direction: 'Out' as any,
        name: undefined,
        value: undefined,
        sqlType: 'INT',
        raw: undefined,
      });

      expect(() => builder.parsePrepared()).toThrow(
        'OUT/INOUT parameters require a variable name on MSSQL',
      );
    });
  });

  describe('callFunction', () => {
    it('Postgres scalar emits SELECT name(...)', () => {
      const builder = new PostgresQuery().newBuilder();
      builder.callFunction('add_two').procParam(1).procParam(2);

      expect(builder.parseRaw()).toEqual('SELECT "public"."add_two"(1, 2);');
    });

    it('Postgres ResultSet emits SELECT * FROM name(...)', () => {
      const builder = new PostgresQuery().newBuilder();
      builder.callFunction('users_over', CallReturnIntent.ResultSet).procParam(18);

      expect(builder.parseRaw()).toEqual('SELECT * FROM "public"."users_over"(18);');
    });

    it('MySQL scalar emits SELECT name(...)', () => {
      const builder = new MysqlQuery().newBuilder();
      builder.callFunction('add_two').procParam(1).procParam(2);

      expect(builder.parseRaw()).toEqual('SELECT `add_two`(1, 2);');
    });

    it('MySQL refuses a table-valued (ResultSet) function', () => {
      const builder = new MysqlQuery().newBuilder();
      builder.callFunction('users_over', CallReturnIntent.ResultSet).procParam(18);

      expect(() => builder.parsePrepared()).toThrow(
        'MySQL does not support table-valued functions',
      );
    });

    it('MSSQL scalar emits SELECT name(...)', () => {
      const builder = new MssqlQuery().newBuilder();
      builder.callFunction('add_two').procParam(1).procParam(2);

      expect(builder.parseRaw()).toEqual('SELECT [dbo].[add_two](1, 2);');
    });

    it('MSSQL ResultSet emits SELECT * FROM name(...)', () => {
      const builder = new MssqlQuery().newBuilder();
      builder.callFunction('users_over', CallReturnIntent.ResultSet).procParam(18);

      expect(builder.parseRaw()).toEqual('SELECT * FROM [dbo].[users_over](18);');
    });

    it('callFunction refuses CallReturnIntent.Void', () => {
      const builder = new PostgresQuery().newBuilder();

      expect(() => builder.callFunction('add_two', CallReturnIntent.Void)).toThrow(
        'callFunction requires CallReturnIntent.Scalar or CallReturnIntent.ResultSet',
      );
    });

    it('callFunctionWithOwner refuses CallReturnIntent.Void', () => {
      const builder = new PostgresQuery().newBuilder();

      expect(() =>
        builder.callFunctionWithOwner('public', 'add_two', CallReturnIntent.Void),
      ).toThrow('callFunction requires CallReturnIntent.Scalar or CallReturnIntent.ResultSet');
    });

    it('SQLite throws for functions too', () => {
      const builder = new SqliteQuery().newBuilder();
      builder.callFunction('add_two').procParam(1).procParam(2);

      expect(() => builder.parsePrepared()).toThrow(
        'SQLite does not support stored procedures or functions (CALL/EXEC)',
      );
    });
  });

  describe('named parameters', () => {
    it('Postgres procParamNamed emits name := value', () => {
      const builder = new PostgresQuery().newBuilder();
      builder
        .callProcedure('set_status')
        .procParamNamed('user_id', 1)
        .procParamNamed('status', 'active');

      expect(builder.parseRaw()).toEqual(
        'CALL "public"."set_status"(user_id := 1, status := active);',
      );
    });

    it('Postgres refuses a positional argument after a named one', () => {
      const builder = new PostgresQuery().newBuilder();
      builder.callProcedure('set_status').procParamNamed('user_id', 1).procParam('active');

      expect(() => builder.parsePrepared()).toThrow(
        'a positional argument cannot follow a named argument',
      );
    });

    it('MSSQL procParamNamed emits @name = value', () => {
      const builder = new MssqlQuery().newBuilder();
      builder.callProcedure('set_status').procParamNamed('user_id', 1);

      expect(builder.parseRaw()).toEqual('EXEC [dbo].[set_status] @user_id = 1;');
    });

    it('MSSQL refuses a positional argument after a named one', () => {
      const builder = new MssqlQuery().newBuilder();
      builder.callProcedure('set_status').procParamNamed('user_id', 1).procParam('active');

      expect(() => builder.parsePrepared()).toThrow(
        'a positional argument cannot follow a named argument',
      );
    });

    it('MySQL refuses named parameters entirely', () => {
      const builder = new MysqlQuery().newBuilder();
      builder.callProcedure('set_status').procParamNamed('user_id', 1);

      expect(() => builder.parsePrepared()).toThrow(
        'MySQL does not support named parameters in CALL',
      );
    });

    it('MSSQL functions refuse named parameters', () => {
      const builder = new MssqlQuery().newBuilder();
      builder.callFunction('add_two').procParamNamed('a', 1).procParam(2);

      expect(() => builder.parsePrepared()).toThrow(
        'MSSQL does not support named parameters when invoking a function',
      );
    });

    it('invalid names are rejected rather than spliced into the SQL', () => {
      const builder = new PostgresQuery().newBuilder();
      builder.callProcedure('set_status').procParamNamed('user_id); DROP TABLE users; --', 1);

      expect(() => builder.parsePrepared()).toThrow('invalid parameter/variable name');
    });
  });

  describe('raw parameters', () => {
    it('procParamRaw is spliced verbatim as an argument', () => {
      const builder = new PostgresQuery().newBuilder();
      builder.callProcedure('bump_score').procParam(1).procParamRaw('score + 1');

      expect(builder.parseRaw()).toEqual('CALL "public"."bump_score"(1, score + 1);');
    });

    it('MSSQL procedures splice a raw argument in positionally', () => {
      const builder = new MssqlQuery().newBuilder();
      builder.callProcedure('bump_score').procParam(1).procParamRaw('score + 1');

      expect(builder.parseRaw()).toEqual('EXEC [dbo].[bump_score] 1, score + 1;');
    });

    it('MSSQL functions splice a raw argument in positionally', () => {
      const builder = new MssqlQuery().newBuilder();
      builder.callFunction('bump_score').procParam(1).procParamRaw('score + 1');

      expect(builder.parseRaw()).toEqual('SELECT [dbo].[bump_score](1, score + 1);');
    });
  });

  describe('OUT / INOUT parameters', () => {
    it('MSSQL procParamOut declares a variable and emits it as OUTPUT', () => {
      const builder = new MssqlQuery().newBuilder();
      builder.callProcedure('archive_user').procParam(42).procParamOut('archived_count', 'INT');

      expect(builder.parseRaw()).toEqual(
        'DECLARE @archived_count INT; ' +
          'EXEC [dbo].[archive_user] 42, @archived_count = @archived_count OUTPUT;',
      );
    });

    it('MSSQL procParamOut requires an explicit sqlType', () => {
      const builder = new MssqlQuery().newBuilder();
      builder.callProcedure('archive_user').procParamOut('archived_count');

      expect(() => builder.parsePrepared()).toThrow(
        'OUT/INOUT parameters require an explicit sqlType on MSSQL',
      );
    });

    it('MSSQL procParamInOut declares and seeds the variable, bound as a parameter', () => {
      const builder = new MssqlQuery().newBuilder();
      builder.callProcedure('adjust_balance').procParamInOut('balance', 100, 'INT');

      expect(builder.parseRaw()).toEqual(
        'DECLARE @balance INT = 100; ' + 'EXEC [dbo].[adjust_balance] @balance = @balance OUTPUT;',
      );

      // MSSQL inlines every value into a self-contained `sp_executesql` batch, so `parsePrepared`
      // carries no separate `params` here (same contract as every other MSSQL statement).
      const prepared = builder.parsePrepared();
      expect(prepared.params).toEqual([]);
      expect(prepared.sql).toContain('DECLARE @balance INT = @p0;');
      expect(prepared.sql).toContain('@p0 = 100');
    });

    it('MySQL procParamOut references a session variable positionally, no DECLARE needed', () => {
      const builder = new MysqlQuery().newBuilder();
      builder.callProcedure('archive_user').procParam(42).procParamOut('archived_count');

      expect(builder.parseRaw()).toEqual('CALL `archive_user`(42, @archived_count);');
    });

    it('MySQL procParamOut requires a session variable name', () => {
      const builder = new MysqlQuery().newBuilder();
      const call = builder.callProcedure('archive_user');
      call.state().callState!.params.push({
        direction: 'Out' as any,
        name: undefined,
        value: undefined,
        sqlType: undefined,
        raw: undefined,
      });

      expect(() => builder.parsePrepared()).toThrow(
        'OUT/INOUT parameters require a session variable name on MySQL',
      );
    });

    it('MySQL procParamInOut seeds the session variable via a prefixed SET', () => {
      const builder = new MysqlQuery().newBuilder();
      builder.callProcedure('adjust_balance').procParam(7).procParamInOut('balance', 100);

      expect(builder.parseRaw()).toEqual('SET @balance = 100; CALL `adjust_balance`(7, @balance);');

      const prepared = builder.parsePrepared();
      expect(prepared.sql).toEqual('SET @balance = ?; CALL `adjust_balance`(?, @balance);');
      expect(prepared.params).toEqual([100, 7]);
    });

    it('Postgres procParamOut passes NULL — there are no variables to declare', () => {
      const builder = new PostgresQuery().newBuilder();
      builder.callProcedure('archive_user').procParam(42).procParamOut('archived_count');

      const prepared = builder.parsePrepared();
      expect(prepared.sql).toEqual('CALL "public"."archive_user"($1, archived_count := $2);');
      expect(prepared.params).toEqual([42, null]);
    });

    it('OUT/INOUT parameters are refused on function calls', () => {
      const builder = new PostgresQuery().newBuilder();
      builder.callFunction('add_two').procParam(1).procParamOut('result');

      expect(() => builder.parsePrepared()).toThrow(
        'OUT/INOUT parameters are only supported for procedure calls, not functions',
      );
    });
  });

  describe('combinations refused elsewhere', () => {
    it('a CTE cannot be combined with a call', () => {
      const builder = new PostgresQuery().newBuilder();
      builder.cteRaw('recent', 'SELECT 1').callProcedure('archive_user').procParam(1);

      expect(() => builder.parsePrepared()).toThrow(
        'A CTE cannot be combined with a procedure/function call',
      );
    });

    it('RETURNING cannot be combined with a call', () => {
      const builder = new PostgresQuery().newBuilder();
      builder.callProcedure('archive_user').procParam(1);
      builder.returning(['id']);

      expect(() => builder.parsePrepared()).toThrow(
        'RETURNING/OUTPUT cannot be combined with a procedure/function call',
      );
    });

    it('calling a procParam* method before callProcedure/callFunction throws', () => {
      const builder = new PostgresQuery().newBuilder();

      expect(() => builder.procParam(1)).toThrow(
        'call a procParam* method only after callProcedure/callFunction',
      );
    });

    it('selecting after a call resets the query type, and the stale call state then throws', () => {
      const builder = new PostgresQuery().newBuilder();
      builder.callProcedure('archive_user').procParam(1);
      builder.selectAll().fromTable('users', 'u');

      expect(() => builder.parsePrepared()).toThrow(
        'Procedure/function call state requires queryType Call',
      );
    });
  });

  describe('clearCall', () => {
    it('removes a previously configured call and resets the query type', () => {
      const builder = new PostgresQuery().newBuilder();
      builder.callProcedure('archive_user').procParam(1);
      builder.clearCall();

      expect(builder.state().callState).toBeUndefined();
      builder.selectAll().fromTable('users', 'u');
      expect(builder.parseRaw()).toEqual('SELECT * FROM "public"."users" AS "u";');
    });
  });

  describe('procParams', () => {
    it('appends several positional IN arguments in order', () => {
      const builder = new PostgresQuery().newBuilder();
      builder.callProcedure('add_three').procParams([1, 2, 3]);

      expect(builder.parseRaw()).toEqual('CALL "public"."add_three"(1, 2, 3);');
    });
  });

  describe('MultiBuilder integration', () => {
    it('a call can be batched alongside other statements', () => {
      const multi = new PostgresQuery().newMultiBuilder();
      multi.setTransactionState(MultiBuilderTransactionState.TransactionOff);
      multi.addBuilder('archive').callProcedure('archive_user').procParam(1);
      multi.addBuilder('select').selectAll().fromTable('users', 'u');

      expect(multi.parseRaw()).toEqual(
        'CALL "public"."archive_user"(1);SELECT * FROM "public"."users" AS "u";',
      );

      const prepared = multi.preparedStatements();
      expect(prepared[0]).toEqual({ sql: 'CALL "public"."archive_user"($1);', params: [1] });
    });
  });
});
