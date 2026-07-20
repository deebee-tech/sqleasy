import { MultiBuilder } from '../../builder/multi-builder';
import { QueryBuilder } from '../../builder/query';
import type { MssqlQueryBuilder } from '../../builder/typed-views';
import type { Dialect } from '../../configuration/configuration';
import { RuntimeConfiguration } from '../../configuration/runtime';
import { mssqlConfiguration } from './configuration';

/** Main entry point for Microsoft SQL Server: produces {@link QueryBuilder}s bound to the MSSQL dialect. */
export class MssqlQuery {
  #configuration: Dialect;

  /** @param rc - Optional runtime options; defaults to a new {@link RuntimeConfiguration} when omitted. */
  constructor(rc: RuntimeConfiguration = new RuntimeConfiguration()) {
    this.#configuration = mssqlConfiguration(rc);
  }

  /** Returns the shared MSSQL dialect configuration for this instance. */
  public configuration = (): Dialect => {
    return this.#configuration;
  };

  /** Creates a query builder, optionally with a one-off {@link RuntimeConfiguration}. */
  public newBuilder = (rc?: RuntimeConfiguration): MssqlQueryBuilder => {
    // One runtime class, narrowed static type: the builder is a real QueryBuilder, typed as the
    // per-engine view so only what MSSQL can run is on the dot. See builder/typed-views.ts.
    return new QueryBuilder(
      rc ? mssqlConfiguration(rc) : this.#configuration,
    ) as unknown as MssqlQueryBuilder;
  };

  /** Creates a multi-statement builder for batching statements, optionally in a transaction. */
  public newMultiBuilder = (rc?: RuntimeConfiguration): MultiBuilder<MssqlQueryBuilder> => {
    return new MultiBuilder<MssqlQueryBuilder>(rc ? mssqlConfiguration(rc) : this.#configuration);
  };
}
