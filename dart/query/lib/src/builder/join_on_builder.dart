import '../configuration.dart';
import '../enums.dart';
import '../state.dart';

/// Builds the `ON` conditions of a JOIN.
///
/// Obtained inside a [QueryBuilder.joinTable] callback; you do not construct it directly.
class JoinOnBuilder {
  JoinOnBuilder(this._config);

  final Dialect _config;
  final List<JoinOnState> _states = [];

  JoinOnBuilder _child() => JoinOnBuilder(_config);

  /// A column-to-column condition: `leftAlias.leftColumn <op> rightAlias.rightColumn`.
  JoinOnBuilder on(
    String leftAlias,
    String leftColumn,
    JoinOperator operator,
    String rightAlias,
    String rightColumn,
  ) {
    _states.add(JoinOnState()
      ..joinOperator = operator
      ..joinOnOperator = JoinOnOperator.on
      ..aliasLeft = leftAlias
      ..columnLeft = leftColumn
      ..aliasRight = rightAlias
      ..columnRight = rightColumn);
    return this;
  }

  /// A column-to-value condition: `alias.column <op> ?`. The value is bound, never interpolated.
  JoinOnBuilder onValue(
    String alias,
    String column,
    JoinOperator operator,
    Object? value,
  ) {
    _states.add(JoinOnState()
      ..joinOperator = operator
      ..joinOnOperator = JoinOnOperator.value
      ..aliasLeft = alias
      ..columnLeft = column
      ..valueRight = value);
    return this;
  }

  /// `ON column IN (values)`.
  JoinOnBuilder onIn(String alias, String column, List<Object?> values) {
    _states.add(JoinOnState()
      ..joinOnOperator = JoinOnOperator.inValues
      ..aliasLeft = alias
      ..columnLeft = column
      ..valuesRight = List.of(values));
    return this;
  }

  /// `ON column NOT IN (values)`.
  JoinOnBuilder onNotIn(String alias, String column, List<Object?> values) {
    _states.add(JoinOnState()
      ..joinOnOperator = JoinOnOperator.notInValues
      ..aliasLeft = alias
      ..columnLeft = column
      ..valuesRight = List.of(values));
    return this;
  }

  /// `ON column BETWEEN value1 AND value2`.
  JoinOnBuilder onBetween(
      String alias, String column, Object? value1, Object? value2) {
    _states.add(JoinOnState()
      ..joinOnOperator = JoinOnOperator.between
      ..aliasLeft = alias
      ..columnLeft = column
      ..valuesRight = [value1, value2]);
    return this;
  }

  /// `ON column NOT BETWEEN value1 AND value2`.
  JoinOnBuilder onNotBetween(
      String alias, String column, Object? value1, Object? value2) {
    _states.add(JoinOnState()
      ..joinOnOperator = JoinOnOperator.notBetween
      ..aliasLeft = alias
      ..columnLeft = column
      ..valuesRight = [value1, value2]);
    return this;
  }

  /// `ON column IS NULL`.
  ///
  /// A null test is not expressible through [onValue]: `= NULL` is never true in SQL, so passing
  /// null there produces a predicate that silently matches nothing. WHERE has had
  /// `whereNull`/`whereNotNull` all along; this closes the same gap on the JOIN, and removes the
  /// raw fragment callers were otherwise forced to hand-write — which also meant hand-quoting the
  /// identifier.
  JoinOnBuilder onNull(String alias, String column) {
    _states.add(JoinOnState()
      ..joinOnOperator = JoinOnOperator.isNull
      ..aliasLeft = alias
      ..columnLeft = column);
    return this;
  }

  /// `ON column IS NOT NULL` — see [onNull].
  JoinOnBuilder onNotNull(String alias, String column) {
    _states.add(JoinOnState()
      ..joinOnOperator = JoinOnOperator.isNotNull
      ..aliasLeft = alias
      ..columnLeft = column);
    return this;
  }

  /// A raw ON fragment, emitted verbatim.
  JoinOnBuilder onRaw(String raw) {
    _states.add(JoinOnState()
      ..joinOnOperator = JoinOnOperator.raw
      ..raw = raw);
    return this;
  }

  /// A parenthesized group of conditions.
  JoinOnBuilder onGroup(void Function(JoinOnBuilder builder) builder) {
    _states.add(JoinOnState()..joinOnOperator = JoinOnOperator.groupBegin);

    final child = _child();
    builder(child);

    _states.addAll(child.states());

    _states.add(JoinOnState()..joinOnOperator = JoinOnOperator.groupEnd);
    return this;
  }

  JoinOnBuilder and() {
    _states.add(JoinOnState()
      ..joinOperator = JoinOperator.none
      ..joinOnOperator = JoinOnOperator.and);
    return this;
  }

  JoinOnBuilder or() {
    _states.add(JoinOnState()
      ..joinOperator = JoinOperator.none
      ..joinOnOperator = JoinOnOperator.or);
    return this;
  }

  /// The accumulated ON conditions. Consumed by the parent builder.
  List<JoinOnState> states() => _states;
}
