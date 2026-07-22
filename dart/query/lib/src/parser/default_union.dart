import '../configuration.dart';
import '../enums.dart';
import '../dialect_name.dart';
import '../errors/parser_error.dart';
import '../sql_helper.dart';
import '../state.dart';
import 'to_sql.dart';

/// Does this set-operation BRANCH carry a clause whose scope depends on parentheses?
///
/// `ORDER BY`, `LIMIT` and `OFFSET` are the three. Everything else a branch can carry — `DISTINCT`,
/// MSSQL's `TOP (n)`, the whole WHERE/GROUP BY/HAVING stack — is already lexically bound to its own
/// SELECT and needs no help.
bool _branchIsScoped(QueryState branch) =>
    branch.orderByStates.isNotEmpty || branch.limit > 0 || branch.offset > 0;

/// Refuses a scoping clause on a branch the dialect cannot scope.
///
/// Mirrors the TypeScript port's `default-union.ts`. Through 12.0.0 a branch's `ORDER BY` / `LIMIT`
/// was emitted with NO parentheses, so it bound to the whole compound instead of the operand it was
/// written on:
///
///     .unionAll((u) => u..fromTable('b')..selectAll()..limit(3))
///     ->  SELECT * FROM "a" UNION ALL SELECT * FROM "b" LIMIT 3
///
/// That caps the UNION, not the branch — the statement runs and returns the wrong rows. Measured
/// against the harness on a 3-row table: the old SQL returned 1 row, the parenthesized form 4.
///
/// ── WHAT EACH ENGINE ACTUALLY DOES (measured 2026-07-22) ──
///
///     Postgres 17   ... UNION ALL (SELECT ... ORDER BY id LIMIT 3)   accepted
///     MySQL 8.4     ... UNION ALL (SELECT ... ORDER BY id LIMIT 3)   accepted
///     MSSQL 2022    parenthesized operand / per-operand ORDER BY     Msg 156
///                   SELECT TOP (3) ... UNION ALL SELECT ...          accepted
///     SQLite 3.51   parenthesized operand                            near "(": syntax error
///                   LIMIT before the set operator                    "should come after UNION ALL"
void _assertBranchScopeSupported(QueryState branch, Dialect config) {
  if (!_branchIsScoped(branch)) return;

  if (config.databaseType == DatabaseType.postgres ||
      config.databaseType == DatabaseType.mysql) {
    return;
  }

  final clause = branch.orderByStates.isNotEmpty
      ? 'ORDER BY'
      : branch.limit > 0
          ? 'LIMIT'
          : 'OFFSET';
  final area = branch.orderByStates.isNotEmpty
      ? ParserArea.orderBy
      : ParserArea.limitOffset;
  final name = dialectDisplayName(config.databaseType);

  final remedy = config.databaseType == DatabaseType.mssql
      ? 'T-SQL allows no parenthesized operand and no per-operand ORDER BY — cap the branch with '
          'top(n) instead, or lift it into a CTE and select from that'
      : 'SQLite allows no parenthesized operand and no LIMIT before the set operator — lift the '
          'branch into a CTE or a derived table and select from that';

  throw ParserError(
    area,
    '$name cannot scope $clause to one branch of a set operation. $remedy. '
    'Setting it on the outer builder instead applies it to the whole result, which is a '
    'different query.',
  );
}

SqlHelper defaultUnion(
  QueryState state,
  Dialect config,
  ParserMode mode, [
  ToSqlOptions? options,
]) {
  final sqlHelper = SqlHelper(mode);

  if (state.unionStates.isEmpty) {
    return sqlHelper;
  }

  for (var i = 0; i < state.unionStates.length; i++) {
    final unionState = state.unionStates[i];

    switch (unionState.builderType) {
      case BuilderType.union:
        sqlHelper.addSqlSnippet('UNION ');
      case BuilderType.unionAll:
        sqlHelper.addSqlSnippet('UNION ALL ');
      case BuilderType.intersect:
        sqlHelper.addSqlSnippet('INTERSECT ');
      case BuilderType.except:
        sqlHelper.addSqlSnippet('EXCEPT ');
      default:
        break;
    }

    if ((unionState.raw ?? '').isNotEmpty) {
      sqlHelper.addSqlSnippet(unionState.raw!);
    } else if (unionState.subquery != null) {
      _assertBranchScopeSupported(unionState.subquery!, config);

      final subHelper =
          defaultToSql(unionState.subquery, config, mode, options);
      // Parenthesized ONLY when the branch carries ORDER BY/LIMIT/OFFSET. Wrapping unconditionally
      // would rewrite every existing golden, and MSSQL and SQLite reject a parenthesized operand.
      final wrap = _branchIsScoped(unionState.subquery!);
      sqlHelper.addSqlSnippetWithValues(
          wrap ? '(${subHelper.getSql()})' : subHelper.getSql(),
          subHelper.getValues());
    }

    if (i < state.unionStates.length - 1) {
      sqlHelper.addSqlSnippet(' ');
    }
  }

  return sqlHelper;
}
