import '../errors/parser_error.dart';
import '../state.dart';

/// Resolves the table targeted by UPDATE or DELETE.
///
/// Prefers the `updateTable` / `deleteFrom` entry tracked by [QueryState.mutationTargetIndex].
/// Falls back to the sole `fromStates` entry when no mutation index is set. Refuses ambiguous
/// stacks (multiple FROM sources without a recorded mutation target).
/// Refuses FROM sources an UPDATE/DELETE would silently discard.
///
/// A plain table source is SUPERSEDED, not lost: `fromTable('users').updateTable('orders')`
/// deliberately prefers the mutation target, which `mutationTargetIndex` records. That stays.
///
/// A derived table or raw source is different in kind — it can never BE the target, so it was never
/// superseded by anything. It just vanished, taking its SELECT, its WHERE and its limit with it,
/// while predicates written against its alias survived to reference nothing. The capability already
/// exists correctly through `joinWithBuilder`, which emits USING on Postgres and a multi-table form
/// on MySQL, so this points there.
void _assertNoDroppedFromSources(QueryState state, ParserArea area) {
  final target = state.mutationTargetIndex;
  final lost = <FromState>[];
  for (var i = 0; i < state.fromStates.length; i++) {
    final from = state.fromStates[i];
    if (i != target && (from.subquery != null || from.raw != null)) {
      lost.add(from);
    }
  }
  if (lost.isEmpty) return;

  final aliases = lost
      .map((f) => f.alias)
      .whereType<String>()
      .where((a) => a.isNotEmpty)
      .join(', ');

  throw ParserError(
    area,
    'An UPDATE/DELETE renders one target table, so the derived or raw FROM source(s) '
    '${aliases.isEmpty ? '' : '($aliases) '}would be dropped without a word — their own WHERE '
    'and limit included, while predicates written against their alias survived and referenced '
    'nothing. Attach the source with joinWithBuilder/joinTable instead, which emits it as USING '
    'on Postgres and a multi-table form on MySQL.',
  );
}

FromState resolveMutationTarget(
  QueryState state,
  ParserArea area,
  String missingMessage,
) {
  if (state.fromStates.isEmpty) {
    throw ParserError(area, missingMessage);
  }

  final index = state.mutationTargetIndex;
  if (index != null) {
    if (index < 0 || index >= state.fromStates.length) {
      throw ParserError(area, missingMessage);
    }
    _assertNoDroppedFromSources(state, area);
    return state.fromStates[index];
  }

  if (state.fromStates.length > 1) {
    throw ParserError(
      area,
      'Ambiguous UPDATE/DELETE target: call updateTable/deleteFrom after fromTable, or clearFrom first',
    );
  }

  return state.fromStates[0];
}
