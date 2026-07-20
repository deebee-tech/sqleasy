import { MultiBuilder } from '../../builder/multi-builder';
import { QueryBuilder } from '../../builder/query';
import type { MysqlQueryBuilder } from '../../builder/typed-views';
import type { Dialect } from '../../configuration/configuration';
import { RuntimeConfiguration } from '../../configuration/runtime';
import { mysqlConfiguration } from './configuration';

/** Main entry point for MySQL: produces {@link QueryBuilder}s bound to the MySQL dialect. */
export class MysqlQuery {
  #configuration: Dialect;

  /** @param rc - Optional runtime options; defaults to a new {@link RuntimeConfiguration} when omitted. */
  constructor(rc: RuntimeConfiguration = new RuntimeConfiguration()) {
    this.#configuration = mysqlConfiguration(rc);
  }

  /** Returns the shared MySQL dialect configuration for this instance. */
  public configuration = (): Dialect => {
    return this.#configuration;
  };

  /** Creates a query builder, optionally with a one-off {@link RuntimeConfiguration}. */
  public newBuilder = (rc?: RuntimeConfiguration): MysqlQueryBuilder => {
    // One runtime class, narrowed static type: the builder is a real QueryBuilder, typed as the
    // per-engine view so only what MYSQL can run is on the dot. See builder/typed-views.ts.
    return new QueryBuilder(
      rc ? mysqlConfiguration(rc) : this.#configuration,
    ) as unknown as MysqlQueryBuilder;
  };

  /** Creates a multi-statement builder for batching statements, optionally in a transaction. */
  public newMultiBuilder = (rc?: RuntimeConfiguration): MultiBuilder<MysqlQueryBuilder> => {
    return new MultiBuilder<MysqlQueryBuilder>(rc ? mysqlConfiguration(rc) : this.#configuration);
  };
}
