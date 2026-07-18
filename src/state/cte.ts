import { BuilderType } from '../enums/builder-type';
import type { QueryState } from './query';

/**
 * Holds state for a single WITH (CTE) clause entry: name, body, and recursion flag.
 * Populated by the builder; exposed via {@link QueryState.cteStates}.
 */
export type CteState = {
  /** Which builder variant produced this state. */
  builderType: BuilderType;
  /** CTE name as declared in WITH. */
  name: string;
  /** Optional explicit column list: `WITH name (col1, col2) AS (...)`. Empty omits it. */
  columns: string[];
  /** Whether this CTE is declared as RECURSIVE. */
  recursive: boolean;
  /** Nested query state for the CTE body, when not using raw SQL. */
  subquery: QueryState | undefined;
  /** Raw SQL fragment for the CTE body when bypassing structured state. */
  raw: string | undefined;
};

/** Creates a {@link CteState} with default field values. */
export const createCteState = (): CteState => ({
  builderType: BuilderType.None,
  name: '',
  columns: [],
  recursive: false,
  subquery: undefined,
  raw: undefined,
});
