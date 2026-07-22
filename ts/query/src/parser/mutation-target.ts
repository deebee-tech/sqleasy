import type { ParserArea } from '../enums/parser-area';
import { ParserError } from '../helpers/parser-error';
import type { FromState } from '../state/from';
import type { QueryState } from '../state/query';

/**
 * Refuses FROM sources an UPDATE/DELETE would silently discard.
 *
 * A mutation renders exactly ONE target, taken from `updateTable`/`deleteFrom`. Any other
 * `fromStates` entry — a derived table from `fromWithBuilder`, a LATERAL from `fromLateral`, a raw
 * source — was simply not emitted: its whole SELECT, its WHERE and its limit went on the floor, and
 * any predicate the caller wrote against its alias survived into the WHERE, leaving a reference to
 * an alias that appears nowhere in the statement.
 *
 * The capability the caller wanted already exists, correctly, through `joinWithBuilder`. Measured:
 *
 *     DELETE FROM "orders" AS "o" USING (SELECT "id" FROM "orders" LIMIT 2) AS "cap" WHERE …   (PG)
 *     DELETE `o` FROM `orders` AS `o` INNER JOIN (SELECT `id` FROM `orders` LIMIT 2) AS `cap`  (MySQL)
 *
 * So this points there rather than growing a second way to spell the same thing.
 */
const assertNoDroppedFromSources = (state: QueryState, area: ParserArea): void => {
  // A plain table source is SUPERSEDED, not lost: `fromTable('users','u').updateTable('orders','o')`
  // deliberately prefers the mutation target, which `mutationTargetIndex` exists to record. That is
  // established behaviour and stays.
  //
  // A derived table or raw source is different in kind — it can never BE the target, so it was
  // never superseded by anything. It just vanished, taking its SELECT, its WHERE and its limit with
  // it, while predicates written against its alias survived to reference nothing.
  const lost = state.fromStates.filter(
    (from, i) =>
      i !== state.mutationTargetIndex && (from.subquery !== undefined || from.raw !== undefined),
  );
  if (lost.length === 0) return;

  const aliases = lost
    .map((from) => from.alias)
    .filter((alias): alias is string => alias !== undefined && alias !== '')
    .join(', ');

  throw new ParserError(
    area,
    `An UPDATE/DELETE renders one target table, so the derived or raw FROM source(s) ` +
      `${aliases === '' ? '' : `(${aliases}) `}would be dropped without a word — their own WHERE ` +
      `and limit included, while predicates written against their alias survived and referenced ` +
      `nothing. Attach the source with joinWithBuilder/joinTable instead, which emits it as USING ` +
      `on Postgres and a multi-table form on MySQL.`,
  );
};

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
    assertNoDroppedFromSources(state, area);
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
