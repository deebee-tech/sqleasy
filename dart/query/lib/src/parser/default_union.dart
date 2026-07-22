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
bool _branchPages(QueryState branch) =>
    branch.orderByStates.isNotEmpty ||
    branch.limit > 0 ||
    branch.offset != null;

/// A branch that is ITSELF a set operation, i.e. the caller expressed a grouped operand.
///
/// `A UNION ALL (B UNION C)` is not `A UNION ALL B UNION C`. Every engine reads the flat form as
/// `(A UNION ALL B) UNION C`, so the outer UNION ALL's duplicates get deduplicated by an inner
/// UNION that was never meant to see them. Measured on customers {1,2,3} with A=id<=2, B=id>=2,
/// C=id=3: grouped returns 4 rows, flat returns 3. No error either way.
///
/// This wants only the parentheses, and three of four engines give them — a different dialect
/// profile from [_branchPages].
bool _branchGroups(QueryState branch) =>
    branch.unionStates.isNotEmpty || branch.cteStates.isNotEmpty;

bool _branchIsScoped(QueryState branch) =>
    _branchPages(branch) || _branchGroups(branch);

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
///     MSSQL 2022    ... UNION ALL (SELECT id FROM t)                 accepted — parens are FINE
///                   ... UNION ALL (SELECT ... ORDER BY id)           Msg 156
///                   SELECT TOP (3) ... UNION ALL SELECT ...          accepted
///     SQLite 3.51   parenthesized operand                            near "(": syntax error
///                   LIMIT before the set operator                    "should come after UNION ALL"
///
/// The two failing engines fail for DIFFERENT reasons. An earlier version of this comment claimed
/// T-SQL rejects a parenthesized operand; that is false and was measured false. MSSQL still cannot
/// scope a branch row cap, but because T-SQL allows no ORDER BY inside a set-operation operand, and
/// `limit()` on MSSQL renders as OFFSET/FETCH, which REQUIRES one. Its real branch cap is `top(n)`,
/// which needs neither. SQLite is the only engine that rejects the parentheses themselves.
void _assertBranchScopeSupported(QueryState branch, Dialect config) {
  if (!_branchIsScoped(branch)) return;

  if (config.databaseType == DatabaseType.postgres ||
      config.databaseType == DatabaseType.mysql) {
    return;
  }

  final name = dialectDisplayName(config.databaseType);

  // SQLite refuses on the parentheses themselves, so BOTH needs are out of reach.
  if (config.databaseType == DatabaseType.sqlite) {
    final what = _branchGroups(branch)
        ? (branch.unionStates.isNotEmpty ? 'a nested set operation' : 'a CTE')
        : branch.orderByStates.isNotEmpty
            ? 'ORDER BY'
            : branch.limit > 0
                ? 'LIMIT'
                : 'OFFSET';
    final area = _branchGroups(branch)
        ? ParserArea.general
        : branch.orderByStates.isNotEmpty
            ? ParserArea.orderBy
            : ParserArea.limitOffset;

    throw ParserError(
      area,
      '$name cannot scope $what to one branch of a set operation — it allows no parenthesized '
      'operand at all. Lift the branch into a CTE or a derived table and select from that. '
      'Leaving it unparenthesized would change which rows the statement returns.',
    );
  }

  // MSSQL: grouping is fine, paging is not.
  if (!_branchPages(branch)) return;

  final clause = branch.orderByStates.isNotEmpty
      ? 'ORDER BY'
      : branch.limit > 0
          ? 'LIMIT'
          : 'OFFSET';
  final area = branch.orderByStates.isNotEmpty
      ? ParserArea.orderBy
      : ParserArea.limitOffset;

  throw ParserError(
    area,
    '$name cannot scope $clause to one branch of a set operation. T-SQL allows no ORDER BY '
    'inside a set-operation operand, and its OFFSET/FETCH paging form requires one — cap the '
    'branch with top(n), which needs neither, or lift it into a CTE and select from that. '
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
      // Parenthesized ONLY when the branch needs it — a paging clause or a nested set operation.
      // Wrapping unconditionally would rewrite every existing golden, and SQLite rejects a
      // parenthesized operand outright. (MSSQL does NOT — it rejects paging inside an operand.)
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
