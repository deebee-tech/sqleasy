import { MultiBuilder } from '../../builder/multi-builder';
import { QueryBuilder } from '../../builder/query';
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
  public newBuilder = (rc?: RuntimeConfiguration): QueryBuilder => {
    return new QueryBuilder(rc ? sqliteConfiguration(rc) : this.#configuration);
  };

  /** Creates a multi-statement builder for batching statements, optionally in a transaction. */
  public newMultiBuilder = (rc?: RuntimeConfiguration): MultiBuilder => {
    return new MultiBuilder(rc ? sqliteConfiguration(rc) : this.#configuration);
  };
}
