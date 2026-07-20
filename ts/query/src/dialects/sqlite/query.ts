import { MultiBuilder } from '../../builder/multi-builder';
import { QueryBuilder } from '../../builder/query';
import type { SqliteQueryBuilder } from '../../builder/typed-views';
import type { Dialect } from '../../configuration/configuration';
import { RuntimeConfiguration } from '../../configuration/runtime';
import { sqliteConfiguration } from './configuration';

/** Main entry point for SQLite: produces {@link QueryBuilder}s bound to the SQLite dialect. */
export class SqliteQuery {
  #configuration: Dialect;

  /** @param rc - Optional runtime options; defaults to a new {@link RuntimeConfiguration} when omitted. */
  constructor(rc: RuntimeConfiguration = new RuntimeConfiguration()) {
    this.#configuration = sqliteConfiguration(rc);
  }

  /** Returns the shared SQLite dialect configuration for this instance. */
  public configuration = (): Dialect => {
    return this.#configuration;
  };

  /** Creates a query builder, optionally with a one-off {@link RuntimeConfiguration}. */
  public newBuilder = (rc?: RuntimeConfiguration): SqliteQueryBuilder => {
    // One runtime class, narrowed static type: the builder is a real QueryBuilder, typed as the
    // per-engine view so only what SQLITE can run is on the dot. See builder/typed-views.ts.
    return new QueryBuilder(
      rc ? sqliteConfiguration(rc) : this.#configuration,
    ) as unknown as SqliteQueryBuilder;
  };

  /** Creates a multi-statement builder for batching statements, optionally in a transaction. */
  public newMultiBuilder = (rc?: RuntimeConfiguration): MultiBuilder<SqliteQueryBuilder> => {
    return new MultiBuilder<SqliteQueryBuilder>(rc ? sqliteConfiguration(rc) : this.#configuration);
  };
}
