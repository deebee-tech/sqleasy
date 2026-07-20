import '../configuration.dart';
import '../state.dart';
import 'join_on_builder.dart';
import 'query_builder.dart';

/// `source.<col>` — a reference to the USING source row (the common MERGE RHS).
MergeExpr source(String columnName) => MergeSourceExpr(columnName);

/// `target.<col>` — a reference to the target row.
MergeExpr target(String columnName) => MergeTargetExpr(columnName);

/// A genuine bound literal (`@pN`), for the rarer case where a WHEN action assigns a constant.
MergeExpr value(Object? v) => MergeValueExpr(v);

/// A raw SQL fragment for an RHS the structured forms cannot express.
MergeExpr raw(String sql) => MergeRawExpr(sql);

/// Builds a T-SQL `MERGE` statement, one clause per method, in the grammar's own vocabulary.
///
/// MERGE is native T-SQL and exists on no other dialect; [QueryBuilder.merge] stores this state and
/// the parser refuses it everywhere but MSSQL. A whole statement, not an INSERT with a conflict
/// clause — that conflation was the removed lie. Obtained inside a [QueryBuilder.merge] callback.
class MergeBuilder {
  MergeBuilder(this._config);

  final Dialect _config;
  final MergeState _state = MergeState();

  QueryBuilder _child() => QueryBuilder(_config);

  List<JoinOnState>? _collectAnd(void Function(JoinOnBuilder)? and) {
    if (and == null) return null;
    final j = JoinOnBuilder(_config);
    and(j);
    return j.states();
  }

  MergeBuilder _pushWhen(
    MergeWhenMatch match,
    MergeWhenAction action,
    void Function(JoinOnBuilder)? and,
  ) {
    _state.whenStates.add(MergeWhenState(match, _collectAnd(and), action));
    return this;
  }

  /// `MERGE INTO <table> [AS alias]`.
  MergeBuilder into(String table, [String alias = 'target']) {
    _state.targetTable = table;
    _state.targetAlias = alias;
    return this;
  }

  /// `MERGE INTO <owner>.<table> [AS alias]`.
  MergeBuilder intoWithOwner(String owner, String table,
      [String alias = 'target']) {
    _state.targetOwner = owner;
    _state.targetTable = table;
    _state.targetAlias = alias;
    return this;
  }

  /// `WITH (HOLDLOCK)` on the target. A MERGE used as an upsert is race-prone without it; the
  /// builder emits the MERGE you wrote and this is how you write the concurrency-safe one.
  MergeBuilder holdlock([bool on = true]) {
    _state.holdlock = on;
    return this;
  }

  /// `USING (VALUES …) AS alias (columns)` — one or more literal rows.
  MergeBuilder usingValues(
    String alias,
    List<String> columns,
    List<List<Object?>> rows,
  ) {
    _state.using = MergeUsingValues(alias, columns, rows);
    return this;
  }

  /// `USING <table> AS alias`.
  MergeBuilder usingTable(String table, String alias, [String? owner]) {
    _state.using = MergeUsingTable(alias, table, owner);
    return this;
  }

  /// `USING (<subquery>) AS alias`.
  MergeBuilder usingSelect(String alias, void Function(QueryBuilder) build) {
    final child = _child();
    build(child);
    child.state.isInnerStatement = true;
    _state.using = MergeUsingSelect(alias, child.state);
    return this;
  }

  /// `USING <raw> AS alias`.
  MergeBuilder usingRaw(String sql, String alias) {
    _state.using = MergeUsingRaw(alias, sql);
    return this;
  }

  /// `ON <merge_search_condition>` — required.
  MergeBuilder on(void Function(JoinOnBuilder) build) {
    final j = JoinOnBuilder(_config);
    build(j);
    _state.onStates = j.states();
    return this;
  }

  /// `WHEN MATCHED [AND …] THEN UPDATE SET …`.
  MergeBuilder whenMatchedThenUpdate(
    List<MergeAssignment> assignments, [
    void Function(JoinOnBuilder)? and,
  ]) =>
      _pushWhen(
          MergeWhenMatch.matched, MergeUpdateAction(assignments, null), and);

  /// `WHEN MATCHED [AND …] THEN UPDATE SET <raw>`.
  MergeBuilder whenMatchedThenUpdateRaw(String raw,
          [void Function(JoinOnBuilder)? and]) =>
      _pushWhen(MergeWhenMatch.matched, MergeUpdateAction(const [], raw), and);

  /// `WHEN MATCHED [AND …] THEN DELETE`.
  MergeBuilder whenMatchedThenDelete([void Function(JoinOnBuilder)? and]) =>
      _pushWhen(MergeWhenMatch.matched, const MergeDeleteAction(), and);

  /// `WHEN NOT MATCHED [BY TARGET] [AND …] THEN INSERT (columns) VALUES (…)`.
  MergeBuilder whenNotMatchedThenInsert(
    List<String> columns,
    List<MergeExpr> values, [
    void Function(JoinOnBuilder)? and,
  ]) =>
      _pushWhen(
        MergeWhenMatch.notMatchedByTarget,
        MergeInsertAction(columns, values),
        and,
      );

  /// `WHEN NOT MATCHED [BY TARGET] [AND …] THEN INSERT DEFAULT VALUES`.
  MergeBuilder whenNotMatchedThenInsertDefaultValues(
          [void Function(JoinOnBuilder)? and]) =>
      _pushWhen(
        MergeWhenMatch.notMatchedByTarget,
        const MergeInsertDefaultValuesAction(),
        and,
      );

  /// `WHEN NOT MATCHED BY SOURCE [AND …] THEN UPDATE SET …`.
  MergeBuilder whenNotMatchedBySourceThenUpdate(
    List<MergeAssignment> assignments, [
    void Function(JoinOnBuilder)? and,
  ]) =>
      _pushWhen(
        MergeWhenMatch.notMatchedBySource,
        MergeUpdateAction(assignments, null),
        and,
      );

  /// `WHEN NOT MATCHED BY SOURCE [AND …] THEN DELETE`.
  MergeBuilder whenNotMatchedBySourceThenDelete(
          [void Function(JoinOnBuilder)? and]) =>
      _pushWhen(
          MergeWhenMatch.notMatchedBySource, const MergeDeleteAction(), and);

  /// `OUTPUT <expression>` as raw SQL, e.g. `$action, inserted.id, deleted.status`. Deliberately
  /// the only OUTPUT form: MERGE's OUTPUT exposes `$action` and mixes inserted/deleted, so a
  /// structured form that captured one side would be a half-truth this library refuses.
  MergeBuilder outputRaw(String sql) {
    _state.outputRaw = sql;
    return this;
  }

  MergeState get state => _state;
}
