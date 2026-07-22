// QueryBuilder implements the four generated per-engine views by structural conformance, so
// every method structurally satisfies an interface member — annotating all ~150 with `@override`
// would be noise, and the lint misfires here regardless:
// QueryBuilder extends nothing, so `annotate_overrides` never has a real superclass override to catch.
// ignore_for_file: annotate_overrides
import '../configuration.dart';
import '../enums.dart';
import '../errors/parser_error.dart';
import '../parser/to_sql.dart' as parser;
import '../parser/to_sql.dart' show PreparedSql;
import '../state.dart';
import 'join_on_builder.dart';
import 'merge_builder.dart';
import 'window_builder.dart';

part 'query_views.dart';

/// A column reference for [QueryBuilder.selectColumns].
typedef ColumnRef = ({String table, String column, String? alias});

/// A table reference for [QueryBuilder.fromTables].
typedef TableRef = ({String table, String? alias, String? owner});

/// A join specification for [QueryBuilder.joinTables].
typedef JoinRef = ({
  JoinType joinType,
  String table,
  String? alias,
  String? owner,
  void Function(JoinOnBuilder builder) on,
});

/// An ORDER BY column for [QueryBuilder.orderByColumns].
typedef OrderByRef = ({
  String table,
  String column,
  OrderByDirection direction,
  NullsOrder? nulls,
});

/// A `DISTINCT ON` column for [QueryBuilder.distinctOn].
typedef DistinctOnRef = ({String table, String column});

/// A GROUP BY column for [QueryBuilder.groupByColumns].
typedef GroupByRef = ({String table, String column});

/// A full-text column reference for [QueryBuilder.whereMatch] / [QueryBuilder.havingMatch].
typedef MatchColumnRef = ({String table, String column});

/// A GROUP BY column set for [QueryBuilder.groupByGroupingSets].
typedef GroupBySetRef = List<GroupByRef>;

/// A SET assignment for [QueryBuilder.setColumns].
typedef SetRef = ({String column, Object? value});

/// The single, dialect-agnostic fluent SQL builder for SELECT / INSERT / UPDATE / DELETE.
///
/// The injected [Dialect] carries everything dialect-specific, so one class serves every database.
/// Every mutator returns the builder, so it works with both chaining and Dart cascades. Obtain one
/// via a dialect entry point (e.g. `SqliteQuery().newBuilder()`).
///
/// This is the Dart port of the TypeScript `QueryBuilder`, reshaped to Dart conventions: "no alias"
/// and "no owner" are optional named parameters that default to absent, not empty-string sentinels.
class QueryBuilder
    implements
        MssqlQueryBuilder,
        MysqlQueryBuilder,
        PostgresQueryBuilder,
        SqliteQueryBuilder {
  QueryBuilder(this._config);

  QueryState _state = QueryState();
  final Dialect _config;

  /// Where [and] / [or] append — flips when WHERE vs HAVING predicates are added.
  String _combinatorTarget = 'where';

  QueryBuilder _child() => QueryBuilder(_config);

  /// The dialect configuration backing this builder.
  Dialect get configuration => _config;

  /// The underlying mutable query state. Consumed by the parser and [MultiBuilder].
  QueryState get state => _state;

  QueryBuilder _pushCombinator(BuilderType builderType) {
    if (_combinatorTarget == 'having') {
      _state.havingStates.add(HavingState()
        ..builderType = builderType
        ..whereOperator = WhereOperator.none
        ..values = []);
      return this;
    }

    _state.whereStates.add(WhereState()
      ..builderType = builderType
      ..whereOperator = WhereOperator.none
      ..values = []);
    return this;
  }

  // ---- logic / clearing ----------------------------------------------------------------------

  QueryBuilder and() => _pushCombinator(BuilderType.and);

  QueryBuilder or() => _pushCombinator(BuilderType.or);

  QueryBuilder distinct() {
    _state.distinct = true;
    return this;
  }

  QueryBuilder clearAll() {
    _state = QueryState();
    _combinatorTarget = 'where';
    return this;
  }

  QueryBuilder clearFrom() {
    _state.fromStates = [];
    return this;
  }

  QueryBuilder clearGroupBy() {
    _state.groupByStates = [];
    return this;
  }

  QueryBuilder clearHaving() {
    _state.havingStates = [];
    _combinatorTarget = 'where';
    return this;
  }

  QueryBuilder clearJoin() {
    _state.joinStates = [];
    return this;
  }

  QueryBuilder clearLimit() {
    _state.limit = 0;
    _state.limitWithTies = false;
    return this;
  }

  /// Removes the offset entirely. `null`, not `0` — `offset(0)` is a real, emitted value.
  QueryBuilder clearOffset() {
    _state.offset = null;
    return this;
  }

  QueryBuilder clearOrderBy() {
    _state.orderByStates = [];
    return this;
  }

  QueryBuilder clearSelect() {
    _state.selectStates = [];
    _state.distinct = false;
    _state.distinctOnColumns = null;
    return this;
  }

  QueryBuilder clearDistinct() {
    _state.distinct = false;
    return this;
  }

  /// Postgres-only `DISTINCT ON (...)`. Mutually exclusive with [distinct].
  QueryBuilder distinctOn(List<DistinctOnRef> columns) {
    _state.distinctOnColumns = [
      for (final column in columns)
        DistinctOnColumnState(column.table, column.column),
    ];
    return this;
  }

  QueryBuilder clearDistinctOn() {
    _state.distinctOnColumns = null;
    return this;
  }

  QueryBuilder clearWhere() {
    _state.whereStates = [];
    return this;
  }

  QueryBuilder clearCte() {
    _state.cteStates = [];
    return this;
  }

  QueryBuilder clearUnion() {
    _state.unionStates = [];
    return this;
  }

  QueryBuilder clearInsert() {
    _state.insertState = null;
    _state.upsertState = null;
    if (_state.queryType == QueryType.insert) {
      _state.queryType = QueryType.select;
    }
    return this;
  }

  QueryBuilder clearUpdate() {
    _state.updateStates = [];
    _clearMutationTarget();
    if (_state.queryType == QueryType.update) {
      _state.queryType = QueryType.select;
    }
    return this;
  }

  /// Clears the DELETE target table and resets sticky Delete query type.
  QueryBuilder clearDelete() {
    _clearMutationTarget();
    if (_state.queryType == QueryType.delete) {
      _state.queryType = QueryType.select;
    }
    return this;
  }

  void _clearMutationTarget() {
    final index = _state.mutationTargetIndex;
    if (index != null) {
      _state.fromStates.removeAt(index);
      _state.mutationTargetIndex = null;
    }
  }

  void _markSelectQuery() {
    if (_state.queryType == QueryType.delete ||
        _state.queryType == QueryType.update ||
        _state.queryType == QueryType.insert ||
        _state.queryType == QueryType.call) {
      _state.queryType = QueryType.select;
      _state.mutationTargetIndex = null;
    }
  }

  QueryBuilder clearTop() {
    final custom = _state.customState;
    if (custom != null) {
      custom.remove('top');
      if (custom.isEmpty) {
        _state.customState = null;
      }
    }
    return this;
  }

  // ---- SELECT --------------------------------------------------------------------------------

  QueryBuilder selectAll() {
    _markSelectQuery();
    _state.selectStates.add(SelectState()..builderType = BuilderType.selectAll);
    return this;
  }

  QueryBuilder selectColumn(String table, String column, {String? alias}) {
    _markSelectQuery();
    _state.selectStates.add(SelectState()
      ..builderType = BuilderType.selectColumn
      ..tableNameOrAlias = table
      ..columnName = column
      ..alias = alias);
    return this;
  }

  QueryBuilder selectColumns(List<ColumnRef> columns) {
    for (final c in columns) {
      selectColumn(c.table, c.column, alias: c.alias);
    }
    return this;
  }

  QueryBuilder selectRaw(String rawSelect) {
    _markSelectQuery();
    _state.selectStates.add(SelectState()
      ..builderType = BuilderType.selectRaw
      ..raw = rawSelect);
    return this;
  }

  QueryBuilder selectRaws(List<String> rawSelects) {
    for (final r in rawSelects) {
      selectRaw(r);
    }
    return this;
  }

  QueryBuilder selectWithBuilder(
      String alias, void Function(QueryBuilder builder) builder) {
    _markSelectQuery();
    final child = _child();
    builder(child);
    child.state.isInnerStatement = true;

    _state.selectStates.add(SelectState()
      ..builderType = BuilderType.selectBuilder
      ..alias = alias
      ..subquery = child.state);
    return this;
  }

  /// Adds a window function to the SELECT list: `fn OVER (...)`.
  QueryBuilder selectWindow(
    String fn,
    void Function(WindowBuilder builder) over, {
    String? alias,
  }) {
    _markSelectQuery();
    final windowBuilder = WindowBuilder();
    over(windowBuilder);

    _state.selectStates.add(SelectState()
      ..builderType = BuilderType.selectWindow
      ..alias = alias
      ..raw = fn
      ..window = windowBuilder.state());
    return this;
  }

  /// Dialect-aware JSON path extraction in the SELECT list.
  QueryBuilder selectJsonExtract(
    String table,
    String column,
    String path,
    JsonExtractMode mode, {
    String? alias,
  }) {
    _markSelectQuery();
    _state.selectStates.add(SelectState()
      ..builderType = BuilderType.selectJsonExtract
      ..tableNameOrAlias = table
      ..columnName = column
      ..jsonPath = path
      ..jsonExtractMode = mode
      ..alias = alias);
    return this;
  }

  /// `COUNT(x)`, `SUM(x)`, `AVG(x)`, `MIN(x)`, `MAX(x)` in the SELECT list, optionally over
  /// DISTINCT. Pass `'*'` as the column for `COUNT(*)` — only COUNT has a star form.
  QueryBuilder selectAggregate(
    AggregateFunction aggregate,
    String table,
    String column, {
    String? alias,
    bool distinct = false,
    void Function(QueryBuilder builder)? filter,
  }) {
    _markSelectQuery();
    _state.selectStates.add(SelectState()
      ..builderType = BuilderType.selectAggregate
      ..tableNameOrAlias = table
      ..columnName = column
      ..alias = alias
      ..aggregate = aggregate
      ..aggregateDistinct = distinct
      ..aggregateFilter = _captureFilter(filter));
    return this;
  }

  /// Runs a `FILTER (WHERE …)` callback against a child builder and returns its state. Only the
  /// child's WHERE predicates are read downstream; the dialect refusal lives in the emitter.
  QueryState? _captureFilter(void Function(QueryBuilder builder)? filter) {
    if (filter == null) return null;
    final child = _child();
    filter(child);
    child.state.isInnerStatement = true;
    return child.state;
  }

  // ---- FROM ----------------------------------------------------------------------------------

  QueryBuilder fromTable(String table, {String? alias, String? owner}) {
    _state.fromStates.add(FromState()
      ..builderType = BuilderType.fromTable
      ..owner = owner ?? _config.defaultOwner
      ..tableName = table
      ..alias = alias);
    return this;
  }

  QueryBuilder fromTables(List<TableRef> tables) {
    for (final t in tables) {
      fromTable(t.table, alias: t.alias, owner: t.owner);
    }
    return this;
  }

  QueryBuilder fromRaw(String rawFrom) {
    _state.fromStates.add(FromState()
      ..builderType = BuilderType.fromRaw
      ..raw = rawFrom);
    return this;
  }

  QueryBuilder fromRaws(List<String> rawFroms) {
    for (final r in rawFroms) {
      fromRaw(r);
    }
    return this;
  }

  QueryBuilder fromWithBuilder(
      String alias, void Function(QueryBuilder builder) builder) {
    final child = _child();
    builder(child);
    child.state.isInnerStatement = true;

    _state.fromStates.add(FromState()
      ..builderType = BuilderType.fromBuilder
      ..alias = alias
      ..subquery = child.state);
    return this;
  }

  /// Postgres/MySQL `FROM LATERAL (subquery) AS alias`. MSSQL/SQLite throw — use APPLY on MSSQL.
  QueryBuilder fromLateral(
      String alias, void Function(QueryBuilder builder) builder) {
    final child = _child();
    builder(child);
    child.state.isInnerStatement = true;

    _state.fromStates.add(FromState()
      ..builderType = BuilderType.fromLateral
      ..alias = alias
      ..subquery = child.state);
    return this;
  }

  /// Table-valued / set-returning function in the FROM clause.
  ///
  /// NO owner is injected. The default owner is a TABLE default, and a function is not a table:
  /// qualifying `generate_series` with it produced `FROM "public"."generate_series"(1, 5)`, which
  /// Postgres rejects with `function public.generate_series(integer, integer) does not exist` —
  /// built-ins live in `pg_catalog`, and the unqualified call resolves through `search_path` exactly
  /// as intended. MSSQL carried the identical defect as `[dbo].[generate_series](...)`. Use
  /// [fromTableFunctionWithOwner] when a function genuinely lives in a named schema.
  QueryBuilder fromTableFunction(
    String functionName,
    String alias, [
    List<Object?> params = const [],
  ]) {
    _state.fromStates.add(FromState()
      ..builderType = BuilderType.fromFunction
      ..owner = ''
      ..functionName = functionName
      ..alias = alias
      ..functionParams = List.of(params));
    return this;
  }

  /// [fromTableFunction] with an explicit schema/owner qualifier.
  QueryBuilder fromTableFunctionWithOwner(
    String owner,
    String functionName,
    String alias, [
    List<Object?> params = const [],
  ]) {
    _state.fromStates.add(FromState()
      ..builderType = BuilderType.fromFunction
      ..owner = owner
      ..functionName = functionName
      ..alias = alias
      ..functionParams = List.of(params));
    return this;
  }

  /// Raw-SQL table source when structured TVF helpers are insufficient.
  QueryBuilder fromFunctionRaw(String rawFrom, String alias) {
    _state.fromStates.add(FromState()
      ..builderType = BuilderType.fromRaw
      ..raw = rawFrom
      ..alias = alias);
    return this;
  }

  // ---- JOIN ----------------------------------------------------------------------------------

  QueryBuilder joinTable(
    JoinType joinType,
    String table,
    void Function(JoinOnBuilder builder) on, {
    String? alias,
    String? owner,
  }) {
    final joinOnBuilder = JoinOnBuilder(_config);
    on(joinOnBuilder);

    _state.joinStates.add(JoinState()
      ..builderType = BuilderType.joinTable
      ..joinType = joinType
      ..owner = owner ?? _config.defaultOwner
      ..tableName = table
      ..alias = alias
      ..joinOnStates = joinOnBuilder.states());
    return this;
  }

  QueryBuilder joinTables(List<JoinRef> joins) {
    for (final j in joins) {
      joinTable(j.joinType, j.table, j.on, alias: j.alias, owner: j.owner);
    }
    return this;
  }

  QueryBuilder joinWithBuilder(
    JoinType joinType,
    String alias,
    void Function(QueryBuilder builder) builder,
    void Function(JoinOnBuilder builder) on,
  ) {
    final child = _child();
    builder(child);
    child.state.isInnerStatement = true;

    final joinOnBuilder = JoinOnBuilder(_config);
    on(joinOnBuilder);

    _state.joinStates.add(JoinState()
      ..builderType = BuilderType.joinBuilder
      ..joinType = joinType
      ..alias = alias
      ..subquery = child.state
      ..joinOnStates = joinOnBuilder.states());
    return this;
  }

  QueryBuilder joinRaw(String rawJoin) {
    _state.joinStates.add(JoinState()
      ..builderType = BuilderType.joinRaw
      ..joinType = JoinType.none
      ..raw = rawJoin);
    return this;
  }

  QueryBuilder joinRaws(List<String> rawJoins) {
    for (final r in rawJoins) {
      joinRaw(r);
    }
    return this;
  }

  QueryBuilder _joinApply(
    JoinType joinType,
    String alias,
    void Function(QueryBuilder builder) builder, [
    void Function(JoinOnBuilder builder)? on,
  ]) {
    final child = _child();
    builder(child);
    child.state.isInnerStatement = true;

    // CROSS APPLY / OUTER APPLY / CROSS JOIN LATERAL have NO `ON` slot, and passing one emitted a
    // bare trailing ON the engine rejects. Isolated on the harness:
    //
    //     MSSQL  … CROSS APPLY (SELECT 1 AS k) x ON x.k=1   Msg 156
    //            … OUTER APPLY (SELECT 1 AS k) x ON x.k=1   Msg 156
    //            … OUTER APPLY (SELECT 1 AS k) x            3 rows
    //     PG     … CROSS JOIN LATERAL (…) x ON x.k=1        syntax error at or near "ON"
    //            … LEFT  JOIN LATERAL (…) x                 syntax error at or near ";"
    //            … LEFT  JOIN LATERAL (…) x ON TRUE         accepted
    //
    // The `ON TRUE` joinLeftLateral already synthesizes is what PG's LEFT form requires, so only an
    // explicit predicate had nowhere to go — and it needs none: an APPLY/LATERAL subquery is
    // correlated by construction, so the predicate belongs in its own WHERE.
    if (on != null && joinType != JoinType.lateral) {
      throw ParserError(
        ParserArea.join,
        'CROSS APPLY, OUTER APPLY and CROSS/LEFT JOIN LATERAL take no ON clause — the subquery is '
        'already correlated, so put the predicate in its own where() instead. Only joinLateral '
        '(INNER JOIN LATERAL) has an ON slot.',
      );
    }

    final joinOnBuilder = JoinOnBuilder(_config);
    on?.call(joinOnBuilder);

    _state.joinStates.add(JoinState()
      ..builderType = BuilderType.joinBuilder
      ..joinType = joinType
      ..alias = alias
      ..subquery = child.state
      ..joinOnStates = joinOnBuilder.states());
    return this;
  }

  /// MSSQL `CROSS APPLY` / Postgres+MySQL `CROSS JOIN LATERAL`. SQLite throws.
  QueryBuilder joinCrossApply(
    String alias,
    void Function(QueryBuilder builder) builder, [
    void Function(JoinOnBuilder builder)? on,
  ]) =>
      _joinApply(JoinType.crossApply, alias, builder, on);

  /// MSSQL `OUTER APPLY` / Postgres+MySQL `LEFT JOIN LATERAL`. SQLite throws.
  QueryBuilder joinOuterApply(
    String alias,
    void Function(QueryBuilder builder) builder, [
    void Function(JoinOnBuilder builder)? on,
  ]) =>
      _joinApply(JoinType.outerApply, alias, builder, on);

  /// Postgres / MySQL `CROSS JOIN LATERAL` — those engines' spelling of [joinCrossApply].
  ///
  /// NOT a synonym for [joinLateral], which is a third join taking its own ON condition. The three
  /// are genuinely different — measured: `CROSS JOIN LATERAL … AS x`,
  /// `LEFT JOIN LATERAL … ON TRUE`, and `JOIN LATERAL … ON <cond>` — so this renames one of them
  /// per dialect rather than collapsing any two.
  QueryBuilder joinCrossLateral(
    String alias,
    void Function(QueryBuilder builder) builder, [
    void Function(JoinOnBuilder builder)? on,
  ]) =>
      joinCrossApply(alias, builder, on);

  /// Postgres / MySQL `LEFT JOIN LATERAL … ON TRUE` — their spelling of [joinOuterApply].
  QueryBuilder joinLeftLateral(
    String alias,
    void Function(QueryBuilder builder) builder, [
    void Function(JoinOnBuilder builder)? on,
  ]) =>
      joinOuterApply(alias, builder, on);

  /// Postgres/MySQL `JOIN LATERAL (subquery) AS alias ON ...`. MSSQL/SQLite throw.
  QueryBuilder joinLateral(
    String alias,
    void Function(QueryBuilder builder) builder,
    void Function(JoinOnBuilder builder) on,
  ) =>
      _joinApply(JoinType.lateral, alias, builder, on);

  // ---- WHERE ---------------------------------------------------------------------------------

  QueryBuilder where(
      String table, String column, WhereOperator operator, Object? value) {
    _combinatorTarget = 'where';
    _state.whereStates.add(WhereState()
      ..builderType = BuilderType.where
      ..tableNameOrAlias = table
      ..columnName = column
      ..whereOperator = operator
      ..values = [value]);
    return this;
  }

  QueryBuilder whereBetween(
      String table, String column, Object? from, Object? to) {
    _combinatorTarget = 'where';
    _state.whereStates.add(WhereState()
      ..builderType = BuilderType.whereBetween
      ..tableNameOrAlias = table
      ..columnName = column
      ..whereOperator = WhereOperator.equals
      ..values = [from, to]);
    return this;
  }

  /// A row-value comparison: `(a, b) > (?, ?)`. The keyset-pagination predicate and the
  /// composite-key lookup. Refused on MSSQL, which has no row constructor in a comparison.
  QueryBuilder whereRowValue(
    List<GroupByRef> columns,
    WhereOperator operator,
    List<Object?> values,
  ) {
    _combinatorTarget = 'where';
    _state.whereStates.add(WhereState()
      ..builderType = BuilderType.whereRowValue
      ..whereOperator = operator
      ..rowColumns = [
        for (final c in columns) GroupByColumnRef(c.table, c.column),
      ]
      ..values = [List.of(values)]);
    return this;
  }

  /// A row-value `IN`: `(a, b) IN ((?,?), (?,?))`. Refused on MSSQL for the same reason.
  QueryBuilder whereRowValueIn(
    List<GroupByRef> columns,
    List<List<Object?>> tuples,
  ) {
    _combinatorTarget = 'where';
    _state.whereStates.add(WhereState()
      ..builderType = BuilderType.whereRowValueIn
      ..rowColumns = [
        for (final c in columns) GroupByColumnRef(c.table, c.column),
      ]
      ..values = tuples.map((t) => List<Object?>.of(t)).toList());
    return this;
  }

  QueryBuilder whereInValues(
      String table, String column, List<Object?> values) {
    _combinatorTarget = 'where';
    _state.whereStates.add(WhereState()
      ..builderType = BuilderType.whereInValues
      ..tableNameOrAlias = table
      ..columnName = column
      ..values = List.of(values));
    return this;
  }

  QueryBuilder whereNotInValues(
      String table, String column, List<Object?> values) {
    _combinatorTarget = 'where';
    _state.whereStates.add(WhereState()
      ..builderType = BuilderType.whereNotInValues
      ..tableNameOrAlias = table
      ..columnName = column
      ..values = List.of(values));
    return this;
  }

  QueryBuilder whereNull(String table, String column) {
    _combinatorTarget = 'where';
    _state.whereStates.add(WhereState()
      ..builderType = BuilderType.whereNull
      ..tableNameOrAlias = table
      ..columnName = column);
    return this;
  }

  QueryBuilder whereNotNull(String table, String column) {
    _combinatorTarget = 'where';
    _state.whereStates.add(WhereState()
      ..builderType = BuilderType.whereNotNull
      ..tableNameOrAlias = table
      ..columnName = column);
    return this;
  }

  QueryBuilder whereRaw(String rawWhere) {
    _combinatorTarget = 'where';
    _state.whereStates.add(WhereState()
      ..builderType = BuilderType.whereRaw
      ..raw = rawWhere);
    return this;
  }

  QueryBuilder whereRaws(List<String> rawWheres) {
    for (final r in rawWheres) {
      whereRaw(r);
    }
    return this;
  }

  QueryBuilder whereJsonExtract(
    String table,
    String column,
    String path,
    JsonExtractMode mode,
    WhereOperator operator,
    Object? value,
  ) {
    _combinatorTarget = 'where';
    _state.whereStates.add(WhereState()
      ..builderType = BuilderType.whereJsonExtract
      ..tableNameOrAlias = table
      ..columnName = column
      ..whereOperator = operator
      ..values = [value]
      ..jsonPath = path
      ..jsonExtractMode = mode);
    return this;
  }

  QueryBuilder whereJsonContains(String table, String column, Object? value) {
    _combinatorTarget = 'where';
    _state.whereStates.add(WhereState()
      ..builderType = BuilderType.whereJsonContains
      ..tableNameOrAlias = table
      ..columnName = column
      ..values = [value]);
    return this;
  }

  QueryBuilder whereMatch(
    List<MatchColumnRef> columns,
    String query, [
    FullTextMode mode = FullTextMode.natural,
  ]) {
    _combinatorTarget = 'where';
    _state.whereStates.add(WhereState()
      ..builderType = BuilderType.whereFullText
      ..values = [query]
      ..fullTextMode = mode
      ..fullTextColumns = [
        for (final column in columns)
          FullTextColumnRef(column.table, column.column),
      ]);
    return this;
  }

  /// Raw full-text SQL when structured [whereMatch] cannot express the predicate.
  QueryBuilder whereMatchRaw(String rawWhere) => whereRaw(rawWhere);

  QueryBuilder whereGroup(void Function(QueryBuilder builder) builder) {
    _combinatorTarget = 'where';
    _state.whereStates
        .add(WhereState()..builderType = BuilderType.whereGroupBegin);

    final child = _child();
    builder(child);
    child.state.isInnerStatement = true;

    if (child.state.whereStates.isEmpty) {
      throw ParserError(ParserArea.where, 'WHERE group cannot be empty');
    }

    _state.whereStates.add(WhereState()
      ..builderType = BuilderType.whereGroupBuilder
      ..subquery = child.state);

    _state.whereStates.add(WhereState()
      ..builderType = BuilderType.whereGroupEnd
      ..subquery = child.state);
    return this;
  }

  QueryBuilder whereInWithBuilder(String table, String column,
      void Function(QueryBuilder builder) builder) {
    return _whereSubquery(BuilderType.whereInBuilder, table, column, builder);
  }

  QueryBuilder whereNotInWithBuilder(String table, String column,
      void Function(QueryBuilder builder) builder) {
    return _whereSubquery(
        BuilderType.whereNotInBuilder, table, column, builder);
  }

  QueryBuilder whereExistsWithBuilder(String table, String column,
      void Function(QueryBuilder builder) builder) {
    return _whereSubquery(
        BuilderType.whereExistsBuilder, table, column, builder);
  }

  QueryBuilder whereNotExistsWithBuilder(String table, String column,
      void Function(QueryBuilder builder) builder) {
    return _whereSubquery(
        BuilderType.whereNotExistsBuilder, table, column, builder);
  }

  /// `WHERE EXISTS (subquery)` — the same clause as [whereExistsWithBuilder] without its unused
  /// table/column parameters.
  QueryBuilder whereExists(void Function(QueryBuilder builder) builder) {
    _combinatorTarget = 'where';
    final child = _child();
    builder(child);
    child.state.isInnerStatement = true;

    _state.whereStates.add(WhereState()
      ..builderType = BuilderType.whereExistsBuilder
      ..subquery = child.state);
    return this;
  }

  /// `WHERE NOT EXISTS (subquery)` — the same clause as [whereNotExistsWithBuilder] without its
  /// unused table/column parameters.
  QueryBuilder whereNotExists(void Function(QueryBuilder builder) builder) {
    _combinatorTarget = 'where';
    final child = _child();
    builder(child);
    child.state.isInnerStatement = true;

    _state.whereStates.add(WhereState()
      ..builderType = BuilderType.whereNotExistsBuilder
      ..subquery = child.state);
    return this;
  }

  QueryBuilder _whereSubquery(
    BuilderType type,
    String table,
    String column,
    void Function(QueryBuilder builder) builder,
  ) {
    _combinatorTarget = 'where';
    final child = _child();
    builder(child);
    child.state.isInnerStatement = true;

    _state.whereStates.add(WhereState()
      ..builderType = type
      ..tableNameOrAlias = table
      ..columnName = column
      ..subquery = child.state);
    return this;
  }

  // ---- GROUP BY / HAVING ---------------------------------------------------------------------

  QueryBuilder groupByColumn(String table, String column) {
    _state.groupByStates.add(GroupByState()
      ..builderType = BuilderType.groupByColumn
      ..tableNameOrAlias = table
      ..columnName = column);
    return this;
  }

  QueryBuilder groupByColumns(List<GroupByRef> columns) {
    for (final c in columns) {
      groupByColumn(c.table, c.column);
    }
    return this;
  }

  QueryBuilder groupByRaw(String rawGroupBy) {
    _state.groupByStates.add(GroupByState()
      ..builderType = BuilderType.groupByRaw
      ..raw = rawGroupBy);
    return this;
  }

  QueryBuilder groupByRaws(List<String> rawGroupBys) {
    for (final r in rawGroupBys) {
      groupByRaw(r);
    }
    return this;
  }

  QueryBuilder groupByRollup([List<GroupByRef> columns = const []]) {
    _state.groupByStates.add(GroupByState()
      ..builderType = BuilderType.groupByRollup
      ..groupingSets = columns.isNotEmpty
          ? [
              [
                for (final column in columns)
                  GroupByColumnRef(column.table, column.column),
              ],
            ]
          : null);
    return this;
  }

  QueryBuilder groupByCube([List<GroupByRef> columns = const []]) {
    _state.groupByStates.add(GroupByState()
      ..builderType = BuilderType.groupByCube
      ..groupingSets = columns.isNotEmpty
          ? [
              [
                for (final column in columns)
                  GroupByColumnRef(column.table, column.column),
              ],
            ]
          : null);
    return this;
  }

  QueryBuilder groupByGroupingSets(List<GroupBySetRef> sets) {
    _state.groupByStates.add(GroupByState()
      ..builderType = BuilderType.groupByGroupingSets
      ..groupingSets = [
        for (final set in sets)
          [
            for (final column in set)
              GroupByColumnRef(column.table, column.column),
          ],
      ]);
    return this;
  }

  QueryBuilder having(
      String table, String column, WhereOperator operator, Object? value) {
    _combinatorTarget = 'having';
    _state.havingStates.add(HavingState()
      ..builderType = BuilderType.having
      ..tableNameOrAlias = table
      ..columnName = column
      ..whereOperator = operator
      ..values = [value]);
    return this;
  }

  /// `string_agg(x, sep ORDER BY y)` — Postgres, SQLite and MSSQL (ordering renders as WITHIN
  /// GROUP). Hidden on MySQL, whose name is groupConcat. Separator mandatory (no one-arg form).
  QueryBuilder selectStringAgg(
    String table,
    String column,
    Object? separator,
    String alias, {
    bool distinct = false,
    List<StringAggOrderKey> orderBy = const [],
  }) {
    return _pushStringAgg(
        'string_agg', table, column, true, separator, alias, distinct, orderBy);
  }

  /// `GROUP_CONCAT(x ORDER BY y SEPARATOR sep)` — MySQL and SQLite. Separator OPTIONAL (defaults to
  /// ','). Hidden on Postgres and MSSQL, whose name is stringAgg.
  QueryBuilder selectGroupConcat(
    String table,
    String column,
    String alias, {
    Object? separator,
    bool hasSeparator = false,
    bool distinct = false,
    List<StringAggOrderKey> orderBy = const [],
  }) {
    return _pushStringAgg('group_concat', table, column, hasSeparator,
        separator, alias, distinct, orderBy);
  }

  QueryBuilder _pushStringAgg(
    String functionName,
    String table,
    String column,
    bool hasSeparator,
    Object? separator,
    String alias,
    bool distinct,
    List<StringAggOrderKey> orderBy,
  ) {
    _markSelectQuery();
    _state.selectStates.add(SelectState()
      ..builderType = BuilderType.selectStringAgg
      ..tableNameOrAlias = table
      ..columnName = column
      ..alias = alias
      ..stringAggFunction = functionName
      ..stringAggSeparator = separator
      ..stringAggHasSeparator = hasSeparator
      ..stringAggDistinct = distinct
      ..stringAggOrderBy = List.of(orderBy));
    return this;
  }

  /// `HAVING COUNT(x) > n` — the canonical HAVING, previously reachable only through havingRaw.
  QueryBuilder havingAggregate(
    AggregateFunction aggregate,
    String table,
    String column,
    WhereOperator operator,
    Object? value, {
    bool distinct = false,
    void Function(QueryBuilder builder)? filter,
  }) {
    _combinatorTarget = 'having';
    _state.havingStates.add(HavingState()
      ..builderType = BuilderType.havingAggregate
      ..tableNameOrAlias = table
      ..columnName = column
      ..whereOperator = operator
      ..values = [value]
      ..aggregate = aggregate
      ..aggregateDistinct = distinct
      ..aggregateFilter = _captureFilter(filter));
    return this;
  }

  QueryBuilder havingRaw(String rawHaving) {
    _combinatorTarget = 'having';
    _state.havingStates.add(HavingState()
      ..builderType = BuilderType.havingRaw
      ..raw = rawHaving);
    return this;
  }

  QueryBuilder havingRaws(List<String> rawHavings) {
    for (final r in rawHavings) {
      havingRaw(r);
    }
    return this;
  }

  QueryBuilder havingJsonExtract(
    String table,
    String column,
    String path,
    JsonExtractMode mode,
    WhereOperator operator,
    Object? value,
  ) {
    _combinatorTarget = 'having';
    _state.havingStates.add(HavingState()
      ..builderType = BuilderType.havingJsonExtract
      ..tableNameOrAlias = table
      ..columnName = column
      ..whereOperator = operator
      ..values = [value]
      ..jsonPath = path
      ..jsonExtractMode = mode);
    return this;
  }

  QueryBuilder havingJsonContains(String table, String column, Object? value) {
    _combinatorTarget = 'having';
    _state.havingStates.add(HavingState()
      ..builderType = BuilderType.havingJsonContains
      ..tableNameOrAlias = table
      ..columnName = column
      ..values = [value]);
    return this;
  }

  QueryBuilder havingMatch(
    List<MatchColumnRef> columns,
    String query, [
    FullTextMode mode = FullTextMode.natural,
  ]) {
    _combinatorTarget = 'having';
    _state.havingStates.add(HavingState()
      ..builderType = BuilderType.havingFullText
      ..values = [query]
      ..fullTextMode = mode
      ..fullTextColumns = [
        for (final column in columns)
          FullTextColumnRef(column.table, column.column),
      ]);
    return this;
  }

  QueryBuilder havingBetween(
      String table, String column, Object? from, Object? to) {
    _combinatorTarget = 'having';
    _state.havingStates.add(HavingState()
      ..builderType = BuilderType.havingBetween
      ..tableNameOrAlias = table
      ..columnName = column
      ..whereOperator = WhereOperator.equals
      ..values = [from, to]);
    return this;
  }

  QueryBuilder havingInValues(
      String table, String column, List<Object?> values) {
    _combinatorTarget = 'having';
    _state.havingStates.add(HavingState()
      ..builderType = BuilderType.havingInValues
      ..tableNameOrAlias = table
      ..columnName = column
      ..values = List.of(values));
    return this;
  }

  QueryBuilder havingNotInValues(
      String table, String column, List<Object?> values) {
    _combinatorTarget = 'having';
    _state.havingStates.add(HavingState()
      ..builderType = BuilderType.havingNotInValues
      ..tableNameOrAlias = table
      ..columnName = column
      ..values = List.of(values));
    return this;
  }

  QueryBuilder havingNull(String table, String column) {
    _combinatorTarget = 'having';
    _state.havingStates.add(HavingState()
      ..builderType = BuilderType.havingNull
      ..tableNameOrAlias = table
      ..columnName = column);
    return this;
  }

  QueryBuilder havingNotNull(String table, String column) {
    _combinatorTarget = 'having';
    _state.havingStates.add(HavingState()
      ..builderType = BuilderType.havingNotNull
      ..tableNameOrAlias = table
      ..columnName = column);
    return this;
  }

  QueryBuilder havingInWithBuilder(String table, String column,
      void Function(QueryBuilder builder) builder) {
    return _havingSubquery(BuilderType.havingInBuilder, table, column, builder);
  }

  QueryBuilder havingNotInWithBuilder(String table, String column,
      void Function(QueryBuilder builder) builder) {
    return _havingSubquery(
        BuilderType.havingNotInBuilder, table, column, builder);
  }

  QueryBuilder _havingSubquery(
    BuilderType type,
    String table,
    String column,
    void Function(QueryBuilder builder) builder,
  ) {
    _combinatorTarget = 'having';
    final child = _child();
    builder(child);
    child.state.isInnerStatement = true;

    _state.havingStates.add(HavingState()
      ..builderType = type
      ..tableNameOrAlias = table
      ..columnName = column
      ..subquery = child.state);
    return this;
  }

  /// `HAVING EXISTS (subquery)` — mirrors [whereExists] for the HAVING clause.
  QueryBuilder havingExists(void Function(QueryBuilder builder) builder) {
    _combinatorTarget = 'having';
    final child = _child();
    builder(child);
    child.state.isInnerStatement = true;

    _state.havingStates.add(HavingState()
      ..builderType = BuilderType.havingExistsBuilder
      ..subquery = child.state);
    return this;
  }

  /// `HAVING NOT EXISTS (subquery)` — mirrors [whereNotExists] for the HAVING clause.
  QueryBuilder havingNotExists(void Function(QueryBuilder builder) builder) {
    _combinatorTarget = 'having';
    final child = _child();
    builder(child);
    child.state.isInnerStatement = true;

    _state.havingStates.add(HavingState()
      ..builderType = BuilderType.havingNotExistsBuilder
      ..subquery = child.state);
    return this;
  }

  /// Opens a parenthesized HAVING group — mirrors [whereGroup] for the HAVING clause.
  QueryBuilder havingGroup(void Function(QueryBuilder builder) builder) {
    _combinatorTarget = 'having';
    _state.havingStates
        .add(HavingState()..builderType = BuilderType.havingGroupBegin);

    final child = _child();
    builder(child);
    child.state.isInnerStatement = true;

    if (child.state.havingStates.isEmpty) {
      throw ParserError(ParserArea.having, 'HAVING group cannot be empty');
    }

    _state.havingStates.add(HavingState()
      ..builderType = BuilderType.havingGroupBuilder
      ..subquery = child.state);

    _state.havingStates.add(HavingState()
      ..builderType = BuilderType.havingGroupEnd
      ..subquery = child.state);
    return this;
  }

  // ---- ORDER BY / LIMIT ----------------------------------------------------------------------

  QueryBuilder orderByColumn(
    String table,
    String column,
    OrderByDirection direction, [
    NullsOrder nulls = NullsOrder.none,
  ]) {
    _state.orderByStates.add(OrderByState()
      ..builderType = BuilderType.orderByColumn
      ..tableNameOrAlias = table
      ..columnName = column
      ..direction = direction
      ..nulls = nulls);
    return this;
  }

  QueryBuilder orderByColumns(List<OrderByRef> columns) {
    for (final c in columns) {
      orderByColumn(c.table, c.column, c.direction, c.nulls ?? NullsOrder.none);
    }
    return this;
  }

  QueryBuilder orderByRaw(String rawOrderBy) {
    _state.orderByStates.add(OrderByState()
      ..builderType = BuilderType.orderByRaw
      ..direction = OrderByDirection.ascending
      ..raw = rawOrderBy);
    return this;
  }

  QueryBuilder orderByRaws(List<String> rawOrderBys) {
    for (final r in rawOrderBys) {
      orderByRaw(r);
    }
    return this;
  }

  QueryBuilder limit(int limit) {
    if (limit <= 0) {
      throw ParserError(
          ParserArea.limitOffset, 'LIMIT must be a positive integer');
    }
    _state.limit = limit;
    return this;
  }

  /// Limits rows and includes tied rows at the cutoff (`FETCH FIRST n ROWS WITH TIES`).
  QueryBuilder limitWithTies(int n) {
    limit(n);
    _state.limitWithTies = true;
    return this;
  }

  QueryBuilder clearLimitWithTies() {
    _state.limitWithTies = false;
    return this;
  }

  /// Rows to skip. `0` is a REAL value, not "unset" — it is what legalises an ORDER BY inside an
  /// MSSQL derived table or subquery (`OFFSET 0 ROWS`). Omit the call entirely for "no offset".
  QueryBuilder offset(int offset) {
    if (offset < 0) {
      throw ParserError(
          ParserArea.limitOffset, 'OFFSET must be a non-negative integer');
    }
    _state.offset = offset;
    return this;
  }

  /// Sets the `TOP` row limit for the generated SELECT (MSSQL; ignored by other dialects).
  QueryBuilder top(int top) {
    (_state.customState ??= {})['top'] = top;
    return this;
  }

  // ---- INSERT / UPDATE / DELETE --------------------------------------------------------------

  /// Assembles a T-SQL `MERGE` statement via a [MergeBuilder] callback — native T-SQL only; the
  /// parser refuses it on every other dialect. MERGE is its own statement kind, so this flips
  /// [QueryType] the way `insertInto` does rather than contributing a clause.
  QueryBuilder merge(void Function(MergeBuilder) build) {
    _state.queryType = QueryType.merge;
    final mergeBuilder = MergeBuilder(_config);
    build(mergeBuilder);
    _state.mergeState = mergeBuilder.state;
    return this;
  }

  QueryBuilder insertInto(String table, {String? owner}) {
    _state.queryType = QueryType.insert;
    final insert = _state.insertState ??= InsertState();
    insert.owner = owner ?? _config.defaultOwner;
    insert.tableName = table;
    return this;
  }

  QueryBuilder insertColumns(List<String> columns) {
    (_state.insertState ??= InsertState()).columns = List.of(columns);
    return this;
  }

  QueryBuilder insertValues(List<Object?> values) {
    (_state.insertState ??= InsertState()).values.add(List.of(values));
    return this;
  }

  QueryBuilder insertSelect(void Function(QueryBuilder builder) builder) {
    _state.queryType = QueryType.insert;
    final insert = _state.insertState ??= InsertState();

    final child = _child();
    builder(child);
    child.state.isInnerStatement = true;

    insert.selectSubquery = child.state;
    return this;
  }

  QueryBuilder insertRaw(String raw) {
    _state.queryType = QueryType.insert;
    (_state.insertState ??= InsertState()).raw = raw;
    return this;
  }

  QueryBuilder updateTable(String table, {String? alias, String? owner}) {
    _state.queryType = QueryType.update;
    _state.fromStates.add(FromState()
      ..builderType = BuilderType.fromTable
      ..owner = owner ?? _config.defaultOwner
      ..tableName = table
      ..alias = alias);
    _state.mutationTargetIndex = _state.fromStates.length - 1;
    return this;
  }

  QueryBuilder set(String column, Object? value) {
    _state.updateStates.add(UpdateState()
      ..builderType = BuilderType.updateColumn
      ..columnName = column
      ..value = value);
    return this;
  }

  QueryBuilder setColumns(List<SetRef> columns) {
    for (final c in columns) {
      set(c.column, c.value);
    }
    return this;
  }

  QueryBuilder setRaw(String raw) {
    _state.updateStates.add(UpdateState()
      ..builderType = BuilderType.updateRaw
      ..raw = raw);
    return this;
  }

  QueryBuilder deleteFrom(String table, {String? alias, String? owner}) {
    _state.queryType = QueryType.delete;
    _state.fromStates.add(FromState()
      ..builderType = BuilderType.fromTable
      ..owner = owner ?? _config.defaultOwner
      ..tableName = table
      ..alias = alias);
    _state.mutationTargetIndex = _state.fromStates.length - 1;
    return this;
  }

  // ---- SET OPERATIONS / CTE ------------------------------------------------------------------

  QueryBuilder union(void Function(QueryBuilder builder) builder) =>
      _union(BuilderType.union, builder);

  QueryBuilder unionAll(void Function(QueryBuilder builder) builder) =>
      _union(BuilderType.unionAll, builder);

  QueryBuilder intersect(void Function(QueryBuilder builder) builder) =>
      _union(BuilderType.intersect, builder);

  QueryBuilder except(void Function(QueryBuilder builder) builder) =>
      _union(BuilderType.except, builder);

  QueryBuilder _union(
      BuilderType type, void Function(QueryBuilder builder) builder) {
    final child = _child();
    builder(child);
    child.state.isInnerStatement = true;

    _state.unionStates.add(UnionState()
      ..builderType = type
      ..subquery = child.state);
    return this;
  }

  QueryBuilder cte(
    String name,
    void Function(QueryBuilder builder) builder, [
    List<String> columns = const [],
  ]) =>
      _cte(name, false, builder, columns);

  QueryBuilder cteRecursive(
    String name,
    void Function(QueryBuilder builder) builder, [
    List<String> columns = const [],
  ]) =>
      _cte(name, true, builder, columns);

  QueryBuilder _cte(
    String name,
    bool recursive,
    void Function(QueryBuilder builder) builder, [
    List<String> columns = const [],
  ]) {
    final child = _child();
    builder(child);
    child.state.isInnerStatement = true;
    child.state.isCteBody = true;

    _state.cteStates.add(CteState()
      ..builderType = BuilderType.cteBuilder
      ..name = name
      ..columns = List.of(columns)
      ..recursive = recursive
      ..subquery = child.state);
    return this;
  }

  QueryBuilder cteRaw(String name, String raw) {
    _state.cteStates.add(CteState()
      ..builderType = BuilderType.cteRaw
      ..name = name
      ..raw = raw);
    return this;
  }

  // ---- RETURNING / OUTPUT ---------------------------------------------------------------------

  /// Returns the given columns from an INSERT/UPDATE/DELETE: PG/SQLite `RETURNING`, MSSQL
  /// `OUTPUT INSERTED.…`/`OUTPUT DELETED.…`. MySQL has no equivalent and throws at parse time.
  QueryBuilder returning(List<String> columns) {
    _state.returningState = ReturningState()..columns = List.of(columns);
    return this;
  }

  /// Raw-SQL form of [returning] for expressions the structured column list cannot express.
  QueryBuilder returningRaw(String raw) {
    _state.returningState = ReturningState()..raw = raw;
    return this;
  }

  QueryBuilder clearReturning() {
    _state.returningState = null;
    return this;
  }

  // ---- upsert -----------------------------------------------------------------------------

  /// INSERT conflict clause: silently skip conflicting rows (PG/SQLite `ON CONFLICT ... DO
  /// NOTHING`, MySQL `INSERT IGNORE`). Not supported on MSSQL (`MERGE` is a Tier 3 feature) —
  /// throws at parse time.
  ///
  /// [conflictColumns] is the conflict target for PG/SQLite. Ignored on MySQL, which infers the
  /// conflicting key from the table's own constraints; kept so one call shape works everywhere.
  QueryBuilder onConflictDoNothing([List<String> conflictColumns = const []]) {
    _state.upsertState = UpsertState()
      ..action = UpsertAction.doNothing
      ..conflictColumns = List.of(conflictColumns);
    return this;
  }

  /// INSERT conflict clause: update the existing row (PG/SQLite `ON CONFLICT ... DO UPDATE SET`,
  /// MySQL `ON DUPLICATE KEY UPDATE`). Not supported on MSSQL (`MERGE` is a Tier 3 feature) —
  /// throws at parse time.
  ///
  /// [conflictColumns] is the conflict target for PG/SQLite. Ignored on MySQL; see
  /// [onConflictDoNothing].
  QueryBuilder onConflictDoUpdate(
      List<String> conflictColumns, List<SetRef> updates) {
    _state.upsertState = UpsertState()
      ..action = UpsertAction.doUpdate
      ..conflictColumns = List.of(conflictColumns)
      ..updateColumns = [
        for (final u in updates) UpsertSetState(u.column, u.value),
      ];
    return this;
  }

  /// Raw-SQL form of [onConflictDoUpdate]'s SET list for expressions columns can't express.
  QueryBuilder onConflictDoUpdateRaw(List<String> conflictColumns, String raw) {
    _state.upsertState = UpsertState()
      ..action = UpsertAction.doUpdate
      ..conflictColumns = List.of(conflictColumns)
      ..updateRaw = raw;
    return this;
  }

  QueryBuilder clearUpsert() {
    _state.upsertState = null;
    return this;
  }

  // ---- engine-native upsert spellings (MySQL) ---------------------------------------------
  // MySQL's upsert is `INSERT IGNORE` / `... ON DUPLICATE KEY UPDATE`, and neither takes a conflict
  // target (it fires on ANY unique key). The MySQL view exposes these names instead of `onConflict*`;
  // they forward to the same runtime, so the emitted SQL and the goldens are unchanged. No
  // `conflictColumns` parameter, because MySQL cannot honour one.

  /// MySQL `INSERT IGNORE`.
  QueryBuilder insertIgnore() => onConflictDoNothing();

  /// MySQL `... ON DUPLICATE KEY UPDATE col = val, …`.
  QueryBuilder onDuplicateKeyUpdate(List<SetRef> updates) =>
      onConflictDoUpdate(const [], updates);

  /// Raw-SQL form of [onDuplicateKeyUpdate]'s SET list.
  QueryBuilder onDuplicateKeyUpdateRaw(String raw) =>
      onConflictDoUpdateRaw(const [], raw);

  // ---- row locks --------------------------------------------------------------------------

  /// Exclusive row lock on the SELECT's result rows (`FOR UPDATE`; MSSQL `WITH (UPDLOCK,
  /// ROWLOCK)`).
  QueryBuilder forUpdate() {
    _state.rowLock = RowLockState()..mode = RowLockMode.forUpdate;
    return this;
  }

  /// [forUpdate], failing immediately instead of waiting on an already-locked row.
  QueryBuilder forUpdateNowait() {
    _state.rowLock = RowLockState()
      ..mode = RowLockMode.forUpdate
      ..wait = RowLockWait.nowait;
    return this;
  }

  /// [forUpdate], silently skipping already-locked rows instead of waiting.
  QueryBuilder forUpdateSkipLocked() {
    _state.rowLock = RowLockState()
      ..mode = RowLockMode.forUpdate
      ..wait = RowLockWait.skipLocked;
    return this;
  }

  // ---- engine-native lock spellings (MSSQL) -----------------------------------------------
  // A T-SQL DBA reaches for the UPDLOCK table hint, not `FOR UPDATE`. The MSSQL view exposes these
  // names instead of `forUpdate*`; they forward to the same runtime (`WITH (UPDLOCK, ROWLOCK[,
  // NOWAIT|READPAST])`), so the emitted SQL and the goldens are unchanged.

  /// MSSQL `WITH (UPDLOCK, ROWLOCK)` — the T-SQL spelling of [forUpdate].
  QueryBuilder updlock() => forUpdate();

  /// [updlock], failing immediately on an already-locked row (`, NOWAIT`).
  QueryBuilder updlockNowait() => forUpdateNowait();

  /// MSSQL `WITH (UPDLOCK, ROWLOCK, READPAST)` — the T-SQL spelling of [forUpdateSkipLocked].
  ///
  /// Named for the hint that does the work. It was `updlockSkipLocked`, which was half-translated:
  /// `updlock` is T-SQL while `SkipLocked` is Postgres/MySQL vocabulary, and the already-adjudicated
  /// `RowLockWait.skipLocked` cell records MSSQL's own term as READPAST — so the op and the enum
  /// contradicted each other. UPDLOCK + ROWLOCK + READPAST is Microsoft's documented queue idiom.
  QueryBuilder updlockReadpast() => forUpdateSkipLocked();

  /// Shared row lock on the SELECT's result rows (`FOR SHARE`; MSSQL `WITH (HOLDLOCK,
  /// ROWLOCK)`).
  QueryBuilder forShare() {
    _state.rowLock = RowLockState()..mode = RowLockMode.forShare;
    return this;
  }

  /// [forShare], failing immediately instead of waiting on an already-locked row.
  QueryBuilder forShareNowait() {
    _state.rowLock = RowLockState()
      ..mode = RowLockMode.forShare
      ..wait = RowLockWait.nowait;
    return this;
  }

  /// [forShare], silently skipping already-locked rows instead of waiting.
  QueryBuilder forShareSkipLocked() {
    _state.rowLock = RowLockState()
      ..mode = RowLockMode.forShare
      ..wait = RowLockWait.skipLocked;
    return this;
  }

  QueryBuilder clearRowLock() {
    _state.rowLock = null;
    return this;
  }

  /// MySQL `USE INDEX (index)` on a FROM/JOIN table alias. Other dialects throw at parse time.
  QueryBuilder hintUseIndex(String tableNameOrAlias, String indexName) {
    _state.hintStates.add(HintState()
      ..kind = HintKind.useIndex
      ..tableNameOrAlias = tableNameOrAlias
      ..indexName = indexName);
    return this;
  }

  /// MySQL `FORCE INDEX (index)` on a FROM/JOIN table alias.
  QueryBuilder hintForceIndex(String tableNameOrAlias, String indexName) {
    _state.hintStates.add(HintState()
      ..kind = HintKind.forceIndex
      ..tableNameOrAlias = tableNameOrAlias
      ..indexName = indexName);
    return this;
  }

  /// MSSQL trailing `OPTION (...)` clause, e.g. `hintMssqlOption('RECOMPILE')`.
  QueryBuilder hintMssqlOption(String optionText) {
    _state.hintStates.add(HintState()
      ..kind = HintKind.mssqlOption
      ..optionText = optionText);
    return this;
  }

  /// Raw hint escape hatch — caller owns dialect correctness.
  QueryBuilder hintRaw(String rawHint) {
    _state.hintStates.add(HintState()
      ..kind = HintKind.raw
      ..raw = rawHint);
    return this;
  }

  QueryBuilder clearHints() {
    _state.hintStates = [];
    return this;
  }

  // ---- stored procedures / functions ----------------------------------------------------------

  CallState _requireCallState() {
    final callState = _state.callState;
    if (callState == null) {
      throw ParserError(ParserArea.call,
          'call a procParam* method only after callProcedure/callFunction');
    }
    return callState;
  }

  /// Invokes a stored procedure: Postgres/MySQL `CALL`, MSSQL `EXEC`. Not supported on SQLite.
  ///
  /// NO owner is injected — see [fromTableFunction] for the measurement. The default owner is a
  /// TABLE default, and qualifying a ROUTINE with it puts every built-in out of reach:
  /// `SELECT "public"."generate_series"()` and `[dbo].[STRING_SPLIT](...)` are both rejected by a
  /// live server (`function ... does not exist`, `Invalid object name 'dbo.STRING_SPLIT'`), while
  /// the unqualified call resolves through `search_path` / the default schema exactly as intended.
  /// Nothing is lost for a user's own routine, which resolves the same way; use
  /// [callProcedureWithOwner] when it genuinely lives in a named schema.
  QueryBuilder callProcedure(String name) {
    _state.queryType = QueryType.call;
    _state.callState = CallState()
      ..kind = CallKind.procedure
      ..owner = ''
      ..name = name
      ..returnIntent = CallReturnIntent.voidReturn
      ..params = [];
    return this;
  }

  /// [callProcedure], qualified with an explicit schema/owner.
  QueryBuilder callProcedureWithOwner(String owner, String name) {
    _state.queryType = QueryType.call;
    _state.callState = CallState()
      ..kind = CallKind.procedure
      ..owner = owner
      ..name = name
      ..returnIntent = CallReturnIntent.voidReturn
      ..params = [];
    return this;
  }

  /// Invokes a stored function as an expression: `SELECT name(...)` (or, with
  /// [CallReturnIntent.resultSet], `SELECT * FROM name(...)` for a set-returning / table-valued
  /// function — refused on MySQL, which has none). Not supported on SQLite.
  QueryBuilder callFunction(String name,
      [CallReturnIntent returnIntent = CallReturnIntent.scalar]) {
    if (returnIntent == CallReturnIntent.voidReturn) {
      throw ParserError(ParserArea.call,
          'callFunction requires CallReturnIntent.Scalar or CallReturnIntent.ResultSet');
    }
    _state.queryType = QueryType.call;
    // No owner injected — same reasoning as callProcedure above.
    _state.callState = CallState()
      ..kind = CallKind.function
      ..owner = ''
      ..name = name
      ..returnIntent = returnIntent
      ..params = [];
    return this;
  }

  /// [callFunction], qualified with an explicit schema/owner.
  QueryBuilder callFunctionWithOwner(String owner, String name,
      [CallReturnIntent returnIntent = CallReturnIntent.scalar]) {
    if (returnIntent == CallReturnIntent.voidReturn) {
      throw ParserError(ParserArea.call,
          'callFunction requires CallReturnIntent.Scalar or CallReturnIntent.ResultSet');
    }
    _state.queryType = QueryType.call;
    _state.callState = CallState()
      ..kind = CallKind.function
      ..owner = owner
      ..name = name
      ..returnIntent = returnIntent
      ..params = [];
    return this;
  }

  /// Appends a positional IN argument.
  QueryBuilder procParam(Object? value) {
    _requireCallState().params.add(CallParamState()
      ..direction = CallParamDirection.in_
      ..value = value);
    return this;
  }

  /// Appends several positional IN arguments in order.
  QueryBuilder procParams(List<Object?> values) {
    for (final value in values) {
      procParam(value);
    }
    return this;
  }

  /// Appends a named IN argument (Postgres `name := value`, MSSQL `@name = value`). Not supported
  /// on MySQL, which has no named-argument call syntax — throws at parse time.
  QueryBuilder procParamNamed(String name, Object? value) {
    _requireCallState().params.add(CallParamState()
      ..direction = CallParamDirection.in_
      ..name = name
      ..value = value);
    return this;
  }

  /// Appends a positional argument as raw SQL, emitted verbatim (e.g. a computed expression).
  QueryBuilder procParamRaw(String raw) {
    _requireCallState().params.add(CallParamState()
      ..direction = CallParamDirection.in_
      ..raw = raw);
    return this;
  }

  /// Appends an output-only argument to a **procedure** call (refused on function calls — a
  /// function's result is its return expression, not an output parameter). [name] is the MSSQL
  /// declared variable / MySQL session variable identifier — required on both, conventionally the
  /// same as the procedure's own parameter name; Postgres has no variables and reads the OUT value
  /// back as a result column of the `CALL` instead, so `name` there only matters if you also want
  /// this argument to use named-call syntax.
  ///
  /// [sqlType] is the MSSQL `DECLARE`d type (e.g. `'INT'`, `'NVARCHAR(50)'`). Required on MSSQL —
  /// throws at parse time if omitted there. Ignored on Postgres/MySQL.
  QueryBuilder procParamOut(String name, [String? sqlType]) {
    _requireCallState().params.add(CallParamState()
      ..direction = CallParamDirection.out
      ..name = name
      ..sqlType = sqlType);
    return this;
  }

  /// [procParamOut], additionally seeding the variable/argument with an initial [value].
  QueryBuilder procParamInOut(String name, Object? value, [String? sqlType]) {
    _requireCallState().params.add(CallParamState()
      ..direction = CallParamDirection.inOut
      ..name = name
      ..value = value
      ..sqlType = sqlType);
    return this;
  }

  /// Clears a previously configured procedure/function call.
  QueryBuilder clearCall() {
    _state.callState = null;
    if (_state.queryType == QueryType.call) {
      _state.queryType = QueryType.select;
    }
    return this;
  }

  // ---- rendering -----------------------------------------------------------------------------

  /// DEBUG / TEST rendering with values inlined UNQUOTED. NOT execution-safe — run [parsePrepared].
  String parseRaw() => parser.parseRaw(state, _config);

  /// DEBUG / TEST rendering (placeholders as text). NOT execution-safe — run [parsePrepared].
  String parse() => parser.parse(state, _config);

  /// The ONLY execution-safe render: parameterized SQL plus its ordered bound values.
  PreparedSql parsePrepared() => parser.parsePrepared(state, _config);
}
