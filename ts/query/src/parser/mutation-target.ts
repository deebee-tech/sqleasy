import type { ParserArea } from '../enums/parser-area';
import { ParserError } from '../helpers/parser-error';
import type { FromState } from '../state/from';
import type { QueryState } from '../state/query';

/**
 * Resolves the table targeted by UPDATE or DELETE.
 *
 * Prefers the `updateTable` / `deleteFrom` entry tracked by {@link QueryState.mutationTargetIndex}.
 * Falls back to the sole `fromStates` entry when no mutation index is set. Refuses ambiguous
 * stacks (multiple FROM sources without a recorded mutation target).
 */
export const resolveMutationTarget = (
  state: QueryState,
  area: ParserArea,
  missingMessage: string,
): FromState => {
  if (state.fromStates.length === 0) {
    throw new ParserError(area, missingMessage);
  }

  if (state.mutationTargetIndex !== undefined) {
    const target = state.fromStates[state.mutationTargetIndex];
    if (!target) {
      throw new ParserError(area, missingMessage);
    }
    return target;
  }

  if (state.fromStates.length > 1) {
    throw new ParserError(
      area,
      'Ambiguous UPDATE/DELETE target: call updateTable/deleteFrom after fromTable, or clearFrom first',
    );
  }

  return state.fromStates[0]!;
};
